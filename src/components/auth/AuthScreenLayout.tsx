// @ts-nocheck
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, getLogoSource } from '../../utils';
import { authStyles } from './authStyles';

const AuthScreenLayout = ({
  headline,
  subheadline,
  children,
  primaryLabel = 'Continue',
  onPrimaryPress,
  primaryLoading = false,
  primaryDisabled = false,
  onGooglePress,
  googleLoading = false,
  socialDivider = 'or continue with',
  footerText,
  footerLinkLabel,
  onFooterPress,
  extraFooter,
  onBack,
}) => {
  const insets = useSafeAreaInsets();

  const handleFacebook = () => {
    Alert.alert('Facebook sign-in', 'Not configured. Use Google or email.');
  };

  const handleApple = () => {
    Alert.alert('Apple sign-in', 'Not configured. Use Google or email.');
  };

  return (
    <KeyboardAvoidingView
      style={authStyles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          authStyles.scrollContent,
          { paddingTop: insets.top + SPACING.lg, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
        ) : null}

        <Image source={getLogoSource()} style={authStyles.logo} resizeMode="contain" />

        <Text style={authStyles.headline}>
          <Text style={authStyles.headlineAccent}>{headline.split(' ')[0]} </Text>
          {headline.split(' ').slice(1).join(' ')}
        </Text>
        <Text style={authStyles.subheadline}>{subheadline}</Text>

        <View style={authStyles.formCard}>{children}</View>

        <TouchableOpacity
          style={[authStyles.primaryBtn, (primaryDisabled || primaryLoading) && styles.btnDisabled]}
          onPress={onPrimaryPress}
          disabled={primaryDisabled || primaryLoading}
          activeOpacity={0.88}
        >
          {primaryLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={authStyles.primaryBtnText}>{primaryLabel}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{socialDivider}</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={onGooglePress}
            disabled={googleLoading || primaryLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={COLORS.navy2} />
            ) : (
              <Text style={styles.googleLetter}>G</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={handleFacebook}>
            <Text style={styles.fbLetter}>f</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn} onPress={handleApple}>
            <Text style={styles.appleLetter}>A</Text>
          </TouchableOpacity>
        </View>

        {extraFooter}

        {footerText ? (
          <View style={authStyles.footerRow}>
            <Text style={authStyles.footerMuted}>{footerText} </Text>
            <TouchableOpacity onPress={onFooterPress} disabled={primaryLoading}>
              <Text style={authStyles.footerLink}>{footerLinkLabel}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const AuthForgotRow = ({ onPress }) => (
  <TouchableOpacity style={styles.forgotRow} onPress={onPress}>
    <Text style={styles.forgotText}>Forgot password?</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backBtn: { alignSelf: 'flex-start', marginBottom: SPACING.md },
  backText: { color: COLORS.navy2, fontSize: 15, fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { marginHorizontal: SPACING.md, fontSize: 13, color: COLORS.textMuted },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.lg, marginBottom: SPACING.lg },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLetter: { fontSize: 22, fontWeight: '800', color: '#4285F4' },
  fbLetter: { fontSize: 26, fontWeight: '800', color: '#1877F2' },
  appleLetter: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  forgotRow: { alignSelf: 'flex-end', marginTop: -SPACING.sm, marginBottom: SPACING.md },
  forgotText: { fontSize: 13, color: COLORS.navy2, fontWeight: '600' },
});

export default AuthScreenLayout;
