// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AuthField from '../../components/auth/AuthField';
import { authLoginEmailVerifyComplete } from '../../app/actions';
import { resendVerificationEmail } from '../../app/api/auth';
import { resetToHome } from '../../navigations/navigationRef';
import { ROUTES } from '../../utils';
import {
  completeEmailVerification,
  pollPostVerifyLogin,
} from '../../utils/completeEmailVerification';
import { extractLoginFromUrl, isEmailVerifyDeepLink } from '../../utils/emailVerifyDeepLink';
import { COLORS, FONT, RADIUS, SHADOW, SPACING, getLogoSource } from '../../utils';

const PENDING_TOKEN_KEY = '@patrick_pending_verify_token';
const PENDING_EMAIL_KEY = '@patrick_pending_verify_email';
const POLL_MS = 800;

const VerifyEmailScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const [email, setEmail] = useState(route.params?.email || '');
  const [pendingToken, setPendingToken] = useState(route.params?.verificationToken || '');
  const [sending, setSending] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [statusHint, setStatusHint] = useState(
    'Verify in Gmail on PC or phone (keep this app open). We sign you in automatically after you tap Verify.',
  );
  const signedInRef = useRef(false);
  const failCountRef = useRef(0);

  useEffect(() => {
    (async () => {
      if (!pendingToken) {
        const stored = await AsyncStorage.getItem(PENDING_TOKEN_KEY);
        if (stored) setPendingToken(stored);
      }
      if (!email) {
        const storedEmail = await AsyncStorage.getItem(PENDING_EMAIL_KEY);
        if (storedEmail) setEmail(storedEmail);
      }
    })();
  }, []);

  useEffect(() => {
    if (email) AsyncStorage.setItem(PENDING_EMAIL_KEY, email);
  }, [email]);

  useEffect(() => {
    if (pendingToken) AsyncStorage.setItem(PENDING_TOKEN_KEY, pendingToken);
  }, [pendingToken]);

  const goToShop = useCallback(
    data => {
      if (signedInRef.current || !data?.token) return;
      signedInRef.current = true;
      setStatusHint('Verified! Opening shop…');

      dispatch(
        authLoginEmailVerifyComplete({
          token: data.token,
          user: {
            ...(data.user || {}),
            email: data.user?.email || email,
            verified: true,
            isVerified: true,
          },
        }),
      );

      AsyncStorage.multiRemove([PENDING_TOKEN_KEY, PENDING_EMAIL_KEY]);

      const resetStack = () => {
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: ROUTES.HOME }],
          });
        } catch {
          resetToHome();
        }
      };

      resetStack();
      setTimeout(resetStack, 150);
      setTimeout(resetStack, 500);
    },
    [dispatch, email, navigation],
  );

  /** Poll server after user verified in Gmail on PC Chrome or phone. */
  const tryAutoSignIn = useCallback(
    async (showFeedback = false) => {
      if (signedInRef.current || !email.includes('@')) return;

      if (showFeedback) setSigningIn(true);

      try {
        const tryFinish = showFeedback
          ? () => completeEmailVerification(email, pendingToken)
          : () => pollPostVerifyLogin(email);

        const result = await tryFinish();
        if (result?.token) {
          failCountRef.current = 0;
          goToShop(result);
          return;
        }

        failCountRef.current += 1;
        if (showFeedback) {
          setStatusHint(
            failCountRef.current >= 3
              ? 'Still waiting. Use the latest Gmail link after Resend, or register if this email has no account.'
              : 'Not verified yet. Tap Verify in your latest Gmail, then try again.',
          );
        }
      } catch (err) {
        if (showFeedback) {
          setStatusHint(
            err?.message?.includes('reach')
              ? 'Cannot reach the server. Run start_server.bat and check the emulator uses 10.0.2.2:8000.'
              : 'Could not sign in yet. Try Resend, then verify in Gmail.',
          );
        }
      } finally {
        if (showFeedback) setSigningIn(false);
      }
    },
    [email, goToShop, pendingToken],
  );

  const handleDeepLink = useCallback(
    async url => {
      if (!url || signedInRef.current || !isEmailVerifyDeepLink(url)) return;
      try {
        const result = await extractLoginFromUrl(url);
        if (result?.token) {
          goToShop(result);
        }
      } catch {
        await tryAutoSignIn();
      }
    },
    [goToShop, tryAutoSignIn],
  );

  useFocusEffect(
    useCallback(() => {
      setStatusHint(
        'Open Gmail (PC Chrome is OK). Tap Verify my email, then return here — sign-in is automatic.',
      );

      tryAutoSignIn();
      const pollId = setInterval(tryAutoSignIn, POLL_MS);

      Linking.getInitialURL().then(handleDeepLink);
      const linkSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

      const appStateSub = AppState.addEventListener('change', state => {
        if (state === 'active') {
          Linking.getInitialURL().then(handleDeepLink);
          tryAutoSignIn();
        }
      });

      return () => {
        clearInterval(pollId);
        linkSub.remove();
        appStateSub.remove();
      };
    }, [handleDeepLink, tryAutoSignIn]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!route.params?.justRegistered) return;
      const sent = route.params?.verificationEmailSent === true;
      Alert.alert(
        sent ? 'Check your Gmail' : 'Email could not be sent',
        sent
          ? `We emailed ${email}.\n\n1. Open Gmail on PC or phone\n2. Tap Verify my email (keep start_server.bat running)\n3. Return to this app — you will enter the shop automatically`
          : 'Tap Resend. Keep start_server.bat running on your PC.',
      );
    }, [route.params?.justRegistered, route.params?.verificationEmailSent, email]),
  );

  const handleResend = async () => {
    if (!email.includes('@')) {
      Alert.alert('Email required', 'Enter the email you used to register.');
      return;
    }
    setSending(true);
    try {
      const result = await resendVerificationEmail(email);
      if (result?.alreadyVerified && result?.token) {
        Alert.alert(
          'Already verified',
          'This email is already verified. Sign in from the Login screen instead.',
          [{ text: 'Go to Login', onPress: () => navigation.navigate(ROUTES.LOGIN) }, { text: 'OK' }],
        );
        return;
      }
      if (result?.verificationToken) {
        setPendingToken(result.verificationToken);
      }
      setStatusHint('New email sent. Tap Verify in Gmail (use the newest message), then return here.');
      Alert.alert(
        'Email sent',
        'Tap Verify in your newest Gmail message (PC Chrome works). Old emails will not work after Resend.',
      );
    } catch (err) {
      if (err?.code === 'ACCOUNT_NOT_FOUND') {
        Alert.alert(
          'No account for this email',
          'Register first with this exact email, or fix a typo. This email is not in our system yet.',
          [
            { text: 'Go to Register', onPress: () => navigation.navigate(ROUTES.REGISTER) },
            { text: 'OK' },
          ],
        );
        setStatusHint('No account found for this email — register first or fix the spelling.');
      } else {
        Alert.alert('Could not send', err?.message || 'Try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Image source={getLogoSource()} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Verify your email</Text>
      <Text style={styles.body}>
        You can verify in Gmail on your PC, phone, or anywhere. Keep this app open. After you tap
        Verify in Gmail, switch back here and you will enter the shop signed in.
      </Text>

      <View style={styles.statusCard}>
        <ActivityIndicator color={COLORS.navy2} size="small" />
        <Text style={styles.statusText}>{statusHint}</Text>
      </View>

      <View style={styles.stepsCard}>
        <Text style={styles.stepsTitle}>Steps</Text>
        <Text style={styles.step}>1. Keep start_server.bat running on your PC</Text>
        <Text style={styles.step}>2. Open Gmail (PC Chrome, web, or phone) and tap Verify my email</Text>
        <Text style={styles.step}>3. You may see “Email verified” in the browser — that is OK</Text>
        <Text style={styles.step}>4. Return to this app — the shop opens automatically</Text>
      </View>

      <View style={styles.formCard}>
        <AuthField
          icon="✉"
          placeholder="Your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TouchableOpacity
          style={[styles.primaryBtn, (sending || signingIn) && styles.btnDisabled]}
          onPress={() => tryAutoSignIn(true)}
          disabled={signingIn}
          activeOpacity={0.88}
        >
          {signingIn ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryBtnText}>I verified — open the shop now</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, sending && styles.btnDisabled]}
          onPress={handleResend}
          disabled={sending}
          activeOpacity={0.88}
        >
          {sending ? (
            <ActivityIndicator color={COLORS.navy2} />
          ) : (
            <Text style={styles.secondaryBtnText}>Resend verification email</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxl },
  logo: { width: 72, height: 72, alignSelf: 'center', marginBottom: SPACING.lg },
  title: {
    fontFamily: FONT,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  body: {
    fontFamily: FONT,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.cream2,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusText: { flex: 1, fontFamily: FONT, fontSize: 13, fontWeight: '600', color: COLORS.navy2, lineHeight: 18 },
  stepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.soft,
  },
  stepsTitle: { fontFamily: FONT, fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  step: { fontFamily: FONT, fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 4 },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  primaryBtn: {
    backgroundColor: COLORS.navy2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontFamily: FONT, fontSize: 16, fontWeight: '700', color: COLORS.white },
  secondaryBtn: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.navy2,
    borderRadius: RADIUS.md,
  },
  secondaryBtnText: { fontFamily: FONT, fontSize: 15, fontWeight: '700', color: COLORS.navy2 },
});

export default VerifyEmailScreen;
