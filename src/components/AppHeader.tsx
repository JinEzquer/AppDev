// @ts-nocheck
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, getLogoSource } from '../utils';

const AppHeader = ({ title }) => {
  const insets = useSafeAreaInsets();
  const { data: authData } = useSelector(state => state.auth);
  const isGuest = !authData?.token;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + SPACING.sm }]}>
      <Image source={getLogoSource()} style={styles.logo} resizeMode="contain" />
      <View style={styles.titles}>
        <Text style={styles.brand}>Patrick&apos;s Cold Cuts</Text>
        <Text style={styles.title}>
          {title || (isGuest ? 'Browse as guest — sign in when you order' : 'Welcome back')}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  logo: { width: 40, height: 40, marginRight: SPACING.sm, borderRadius: 8 },
  titles: { flex: 1 },
  brand: { fontSize: 17, fontWeight: '700', color: COLORS.gold },
  title: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
});

export default AppHeader;
