// @ts-nocheck
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import AuthField from '../../components/auth/AuthField';
import AuthScreenLayout, { AuthForgotRow } from '../../components/auth/AuthScreenLayout';
import { authLogin, authLoginGoogleComplete } from '../../app/actions';
import {
  COLORS,
  ROUTES,
  SPACING,
  getApiBaseUrl,
  isCustomerVerified,
  signInWithGoogle,
} from '../../utils';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const { data: authData, isLoading, isError, error } = useSelector(state => state.auth);
  const afterLogin = route.params?.afterLogin;

  useEffect(() => {
    if (!isError || !error) return;
    if (/verify/i.test(error)) {
      Alert.alert('Email not verified', error, [
        {
          text: 'Open verification help',
          onPress: () =>
            navigation.navigate(ROUTES.VERIFY_EMAIL, {
              email: username.includes('@') ? username.trim() : '',
            }),
        },
        { text: 'OK' },
      ]);
      return;
    }
    Alert.alert('Cannot log in', error);
  }, [isError, error, navigation, username]);

  useEffect(() => {
    if (!authData?.token) return;
    if (!isCustomerVerified(authData)) {
      Alert.alert(
        'Verify your email',
        'Check Gmail for the verification link, then sign in again.',
        [
          {
            text: 'Help',
            onPress: () =>
              navigation.navigate(ROUTES.VERIFY_EMAIL, { email: authData.user?.email || '' }),
          },
        ],
      );
      return;
    }
    if (afterLogin?.screen) {
      navigation.navigate(afterLogin.screen, afterLogin.params || {});
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(ROUTES.HOME);
    }
  }, [authData?.token, afterLogin, navigation]);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    dispatch(authLogin({ username, password }));
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      dispatch(authLoginGoogleComplete({ token: result.token, user: result.user }));
    } catch (err) {
      // Bridge page may have opened the app via ezquerdev:// while openAuth was closing.
      await new Promise(r => setTimeout(r, 1200));
      if (authData?.token) {
        return;
      }
      const msg = err?.message || 'Could not complete Google sign-in.';
      let hint = '';
      if (/private IP|device_id|device_name|adb reverse|port forwarding/i.test(msg)) {
        hint =
          '\n\nRun: npm run fix:emulator-network\n(adds adb reverse for Google)\n\nOr use email + password below.';
      } else if (/invalid.state|host mismatch/i.test(msg)) {
        hint =
          '\n\nRun: npm run fix:emulator-network\n\nGoogle redirect URI in Cloud Console:\nhttp://127.0.0.1:8000/connect/google/check';
      } else if (!/DNS|dns|network|reach/i.test(msg) && !msg.includes('cancelled')) {
        hint =
          '\n\nEmulator issue? Use email + password below, or test Google on a real phone with Wi‑Fi.';
      }
      Alert.alert('Google sign-in failed', msg + hint);
    } finally {
      setGoogleLoading(false);
    }
  };

  const busy = isLoading || googleLoading;

  return (
    <AuthScreenLayout
      headline="Welcome Back"
      subheadline="Let's continue your journey"
      primaryLabel="Continue"
      onPrimaryPress={handleLogin}
      primaryLoading={isLoading}
      primaryDisabled={busy}
      onGooglePress={handleGoogleSignIn}
      googleLoading={googleLoading}
      socialDivider="or login with"
      footerText="New here?"
      footerLinkLabel="Create an account"
      onFooterPress={() => navigation.navigate(ROUTES.REGISTER)}
      onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      extraFooter={
        <>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={busy}
            style={styles.guestLink}
          >
            <Text style={styles.guestText}>Continue as guest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate(ROUTES.VERIFY_EMAIL)}
            disabled={busy}
            style={styles.verifyLink}
          >
            <Text style={styles.verifyText}>Need to verify email?</Text>
          </TouchableOpacity>
        </>
      }
    >
      <AuthField
        icon="✉"
        placeholder="Email"
        value={username}
        onChangeText={setUsername}
        keyboardType="email-address"
      />
      <AuthField
        icon="🔒"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <AuthForgotRow
        onPress={() => Linking.openURL(`${getApiBaseUrl()}/login`).catch(() => {})}
      />
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  guestLink: { alignItems: 'center', marginBottom: SPACING.sm },
  guestText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 14 },
  verifyLink: { alignItems: 'center', marginBottom: SPACING.md },
  verifyText: { color: COLORS.navy2, fontSize: 13, fontWeight: '600' },
});

export default Login;
