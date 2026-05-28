// @ts-nocheck
import { useCallback, useState } from 'react';
import Clipboard from '@react-native-clipboard/clipboard';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import AuthAccountPanel from '../components/auth/AuthAccountPanel';
import PageHeader from '../components/home/PageHeader';
import { authStyles } from '../components/auth/authStyles';
import { authLogout, authSyncUser } from '../app/actions';
import { getUserProfile } from '../app/api/user';
import {
  COLORS,
  FONT,
  RADIUS,
  ROUTES,
  SHADOW,
  SPACING,
  bottomNavContentPadding,
  getLogoSource,
  isCustomerVerified,
  requireVerifiedCustomer,
} from '../utils';
import {
  getStoredFcmToken,
  registerForPushNotifications,
  showTestLocalNotification,
} from '../services/firebase';

function MenuRow({ label, hint, onPress, danger }) {
  return (
    <TouchableOpacity
      style={[styles.menuRow, danger && styles.menuRowDanger]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={styles.menuTextCol}>
        <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
        {hint ? <Text style={styles.menuHint}>{hint}</Text> : null}
      </View>
      <Text style={styles.menuChevron}>›</Text>
    </TouchableOpacity>
  );
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollBottomPad = bottomNavContentPadding(insets.bottom) + 56;
  const { data: authData } = useSelector(state => state.auth);
  const isGuest = !authData?.token;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(!isGuest);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (!authData?.token) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const user = await getUserProfile(authData.token);
      setProfile(user);
      if (user) {
        dispatch(
          authSyncUser({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            verified: user.isVerified,
            isVerified: user.isVerified,
          }),
        );
      }
    } catch (err) {
      setError(err?.message || 'Unable to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authData?.token, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (!isGuest) loadProfile();
    }, [isGuest, loadProfile]),
  );

  const displayName =
    profile?.fullName ||
    [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') ||
    profile?.username ||
    authData?.user?.firstName ||
    authData?.user?.email ||
    'Customer';

  const email = profile?.email || authData?.user?.email || '';
  const verified = isCustomerVerified({ token: authData?.token, user: profile || authData?.user });

  if (isGuest) {
    return (
      <AuthAccountPanel
        headline="Your account"
        subheadline="Sign in to place orders with delivery, pay online, and track your purchases."
        loginMessage="Sign in to your account"
        afterLogin={{ screen: ROUTES.PROFILE }}
      />
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} tintColor={COLORS.navy2} />
      }
    >
      <PageHeader title="Profile" subtitle="Your Patrick's Cold Cuts account" />

      <View style={styles.profileCard}>
        {loading && !profile ? (
          <ActivityIndicator color={COLORS.navy2} style={styles.loader} />
        ) : (
          <>
            <View style={styles.avatarRow}>
              <Image source={getLogoSource()} style={styles.avatar} resizeMode="contain" />
              <View style={styles.nameCol}>
                <Text style={styles.displayName}>{displayName}</Text>
                {email ? <Text style={styles.email}>{email}</Text> : null}
                {profile?.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
              </View>
            </View>
            <View style={[styles.badge, verified ? styles.badgeOk : styles.badgeWarn]}>
              <Text style={[styles.badgeText, verified ? styles.badgeTextOk : styles.badgeTextWarn]}>
                {verified ? '✓ Email verified' : '⚠ Verify email to order'}
              </Text>
            </View>
            {error ? <Text style={authStyles.cardError}>{error}</Text> : null}
          </>
        )}
      </View>

      {!verified ? (
        <TouchableOpacity
          style={styles.verifyBanner}
          onPress={() => navigation.navigate(ROUTES.VERIFY_EMAIL, { email })}
          activeOpacity={0.9}
        >
          <Text style={styles.verifyTitle}>Complete email verification</Text>
          <Text style={styles.verifySub}>Tap to open verification help and resend the link.</Text>
        </TouchableOpacity>
      ) : null}

      <MenuRow label="My orders" hint="Track delivery and pay online" onPress={() => navigation.navigate(ROUTES.HISTORY)} />
      <MenuRow
        label="Edit profile"
        hint="Name and username"
        onPress={() => {
          if (requireVerifiedCustomer(navigation, authData, 'edit your profile')) {
            navigation.navigate(ROUTES.EDIT_PROFILE);
          }
        }}
      />
      <MenuRow label="Saved items" hint="Your favourites" onPress={() => navigation.navigate(ROUTES.FAVORITES)} />
      {__DEV__ ? (
        <>
      <MenuRow
        label="Copy FCM token"
        hint="One tap — paste in Firebase Send test message"
        onPress={async () => {
          let token = await getStoredFcmToken();
          if (!token) {
            token = await registerForPushNotifications();
          }
          if (!token) {
            Alert.alert(
              'No token yet',
              'Allow notifications when prompted (or in Settings → Apps → Ezquerdev → Notifications), then try again. The emulator needs Google Play services.',
            );
            return;
          }

          Clipboard.setString(token);
          Alert.alert(
            'Token copied',
            'Paste it in Firebase Console → Compose → Send test message.\n\nImportant: press Home before sending the test so the app is in the background. Do not copy from logcat (line breaks break the token).',
            [{ text: 'OK' }],
          );
        }}
      />
      <MenuRow
        label="Test local notification"
        hint="Checks notification channel on this device"
        onPress={async () => {
          try {
            await showTestLocalNotification();
            Alert.alert(
              'Test sent',
              'Pull down the status bar. If you see a notification, this device can show alerts. Then try Firebase Send test message with the copied token.',
            );
          } catch (err) {
            Alert.alert('Test failed', err?.message ?? 'Could not show notification');
          }
        }}
      />
        </>
      ) : null}

      <TouchableOpacity
        style={authStyles.primaryBtn}
        onPress={() => {
          if (requireVerifiedCustomer(navigation, authData, 'edit your profile')) {
            navigation.navigate(ROUTES.EDIT_PROFILE);
          }
        }}
        activeOpacity={0.88}
      >
        <Text style={authStyles.primaryBtnText}>Edit profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[authStyles.secondaryBtn, styles.logoutBtn]}
        onPress={() => {
          Alert.alert('Log out?', 'You can sign in again anytime.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log out', style: 'destructive', onPress: () => dispatch(authLogout()) },
          ]);
        }}
        activeOpacity={0.88}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={authStyles.secondaryBtnText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    flexGrow: 1,
  },
  logoutBtn: {
    marginBottom: SPACING.md,
  },
  loader: { marginVertical: SPACING.xl },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  avatar: { width: 64, height: 64, borderRadius: 16, marginRight: SPACING.md },
  nameCol: { flex: 1 },
  displayName: {
    fontFamily: FONT,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  email: { fontFamily: FONT, fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
  username: { fontFamily: FONT, fontSize: 13, color: COLORS.navy2, marginTop: 2, fontWeight: '600' },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  badgeOk: { backgroundColor: COLORS.successBg },
  badgeWarn: { backgroundColor: '#FEF3C7' },
  badgeText: { fontFamily: FONT, fontSize: 12, fontWeight: '700' },
  badgeTextOk: { color: COLORS.success },
  badgeTextWarn: { color: '#92400E' },
  verifyBanner: {
    backgroundColor: COLORS.navy,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  verifyTitle: { fontFamily: FONT, fontSize: 15, fontWeight: '700', color: COLORS.white },
  verifySub: { fontFamily: FONT, fontSize: 12, color: 'rgba(249,245,238,0.75)', marginTop: 4, lineHeight: 18 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.soft,
  },
  menuRowDanger: { borderColor: 'rgba(200,23,58,0.25)' },
  menuTextCol: { flex: 1 },
  menuLabel: { fontFamily: FONT, fontSize: 15, fontWeight: '700', color: COLORS.text },
  menuLabelDanger: { color: COLORS.red },
  menuHint: { fontFamily: FONT, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  menuChevron: { fontSize: 22, color: COLORS.textMuted, marginLeft: SPACING.sm },
});

export default ProfileScreen;
