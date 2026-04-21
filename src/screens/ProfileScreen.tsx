// @ts-nocheck
import { Image, StyleSheet, Text, View } from 'react-native';
import { useDispatch } from 'react-redux';
import CustomButton from '../components/CustomButton';
import { authLogout } from '../app/actions';
import { COLORS, IMG, SPACING } from '../utils';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Image source={IMG.LOGO} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Patrick's Cold Cuts</Text>
        <Text style={styles.tagline}>Where Quality Meets the Cold</Text>
        <View style={styles.divider} />
        <Text style={styles.info}>Your trusted source for fresh, tasty cold cuts.</Text>
        <CustomButton
          label="Log Out"
          variant="secondary"
          onPress={() => dispatch(authLogout())}
          containerStyle={styles.logoutButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundWarm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  logoContainer: { marginBottom: SPACING.md },
  logo: { width: 120, height: 120 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.xs, textAlign: 'center' },
  tagline: { fontSize: 14, color: COLORS.textMuted, fontStyle: 'italic', marginBottom: SPACING.md },
  divider: { height: 1, backgroundColor: COLORS.border, width: '100%', marginBottom: SPACING.md },
  info: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.lg },
  logoutButton: { marginTop: SPACING.sm, width: '100%' },
});

export default ProfileScreen;
