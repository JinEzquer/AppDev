// @ts-nocheck
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { COLORS, FONT, ROUTES, SPACING, TYPE, getLogoSource } from '../utils';

/**
 * Web hero parity (home/index.html.twig): eyebrow, crafted headline, desc, CTAs, badges.
 */
const ShopHero = ({ compact = false, onExplore }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: authData } = useSelector(state => state.auth);
  const firstName =
    authData?.user?.firstName ||
    authData?.user?.username?.split(/[@._]/)[0] ||
    'Guest';
  const initial = (firstName.charAt(0) || 'G').toUpperCase();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + SPACING.sm }]}>
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />

      <View style={styles.navRow}>
        <Image source={getLogoSource()} style={styles.logo} resizeMode="contain" />
        <View style={styles.brandTextCol}>
          <Text style={styles.brandWhite}>
            PATRICK&apos;S <Text style={styles.brandGold}>COLD CUTS</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate(ROUTES.PROFILE)}
          activeOpacity={0.85}
        >
          <Text style={styles.profileInitial}>{initial}</Text>
        </TouchableOpacity>
      </View>

      {!compact ? (
        <>
          <Text style={styles.eyebrow}>Premium Frozen Foods & Deli</Text>

          <Text style={styles.heroBlock}>
            <Text style={[TYPE.heroLight, styles.heroWhite]}>Crafted with{'\n'}</Text>
            <Text style={[TYPE.heroGold, styles.heroGoldText]}>cold precision.</Text>
            <Text style={[TYPE.heroBold, styles.heroWhite]}>{'\n'}Delivered fresh.</Text>
          </Text>

          <Text style={styles.desc}>
            Over two decades of sourcing the finest frozen foods, artisan cold cuts, and premium
            deli selections — delivered from our family to yours.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnPrimary} onPress={onExplore} activeOpacity={0.9}>
              <Text style={styles.btnPrimaryText}>Explore Products</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => navigation.navigate(ROUTES.HISTORY)}
              activeOpacity={0.85}
            >
              <Text style={styles.btnGhostText}>Your Orders →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.badges}>
            <Badge num="20+" label={'Years\nin business'} />
            <View style={styles.badgeSep} />
            <Badge num="1K+" label={'Happy\ncustomers'} />
            <View style={styles.badgeSep} />
            <Badge num="500+" label={'Products\nstocked'} />
          </View>
        </>
      ) : (
        <Text style={styles.compactTitle}>Saved favorites</Text>
      )}
    </View>
  );
};

function Badge({ num, label }) {
  return (
    <View style={styles.badgeItem}>
      <Text style={styles.badgeNum}>{num}</Text>
      <Text style={styles.badgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.navy,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl,
    overflow: 'hidden',
  },
  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,16,58,0.55)',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 120,
    backgroundColor: 'rgba(7,16,58,0.35)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  brandTextCol: { flex: 1, marginLeft: SPACING.sm },
  brandWhite: {
    ...TYPE.brand,
    color: COLORS.white,
  },
  brandGold: {
    ...TYPE.brand,
    color: COLORS.gold,
  },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.55)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontFamily: FONT,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.gold,
  },
  eyebrow: {
    ...TYPE.eyebrow,
    color: COLORS.gold,
    zIndex: 1,
    marginBottom: SPACING.sm,
  },
  heroBlock: { zIndex: 1, marginBottom: SPACING.md },
  heroWhite: { color: COLORS.cream },
  heroGoldText: { color: COLORS.gold },
  desc: {
    ...TYPE.body,
    color: 'rgba(249,245,238,0.82)',
    zIndex: 1,
    marginBottom: SPACING.lg,
    maxWidth: 340,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.md,
    zIndex: 1,
    marginBottom: SPACING.lg,
  },
  btnPrimary: {
    backgroundColor: COLORS.red,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 4,
  },
  btnPrimaryText: {
    ...TYPE.button,
    color: COLORS.white,
  },
  btnGhost: { paddingVertical: SPACING.sm },
  btnGhostText: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.cream,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  badgeItem: { flex: 1, alignItems: 'center' },
  badgeNum: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: '300',
    color: COLORS.cream,
  },
  badgeLabel: {
    fontFamily: FONT,
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(249,245,238,0.65)',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 12,
  },
  badgeSep: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  compactTitle: {
    ...TYPE.title,
    color: COLORS.cream,
    zIndex: 1,
    marginBottom: SPACING.sm,
  },
});

export default ShopHero;
