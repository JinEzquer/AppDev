// @ts-nocheck
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../context/CartContext';
import { CartIcon, HeartIcon, HomeIcon, ProfileIcon } from './icons/NavIcons';
import { COLORS, ROUTES, SPACING, TYPE } from '../utils';

const NAV_INACTIVE = 'rgba(255,255,255,0.55)';
const NAV_ACTIVE = COLORS.white;

export const BOTTOM_NAV_BAR_HEIGHT = 60;

const TABS = [
  { key: ROUTES.HOME, label: 'Home', kind: 'home' },
  { key: ROUTES.FAVORITES, label: 'Saved', kind: 'saved' },
  { key: ROUTES.CART, label: 'Cart', kind: 'cart' },
  { key: ROUTES.PROFILE, label: 'Profile', kind: 'profile' },
];

function TabIcon({ tab, active }) {
  if (tab.kind === 'home') {
    return <HomeIcon color={active ? NAV_ACTIVE : NAV_INACTIVE} size={24} />;
  }
  if (tab.kind === 'saved') {
    return (
      <HeartIcon
        size={22}
        color={active ? COLORS.red : NAV_INACTIVE}
        filled={active}
      />
    );
  }
  if (tab.kind === 'cart') {
    return <CartIcon color={active ? NAV_ACTIVE : NAV_INACTIVE} size={24} />;
  }
  return <ProfileIcon color={active ? NAV_ACTIVE : NAV_INACTIVE} size={24} />;
}

const BottomNav = ({ activeRoute, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const { totals } = useCart();

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      <View style={styles.bar}>
        {TABS.map(tab => {
          const isActive = activeRoute === tab.key;
          const badge = tab.key === ROUTES.CART && totals.count > 0 ? totals.count : 0;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => onNavigate(tab.key)}
              activeOpacity={0.75}
            >
              <View style={styles.iconWrap}>
                <TabIcon tab={tab} active={isActive} />
                {badge > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.navy,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    minHeight: BOTTOM_NAV_BAR_HEIGHT,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { position: 'relative', marginBottom: 4, height: 28, justifyContent: 'center', alignItems: 'center' },
  label: { ...TYPE.navLabel, color: NAV_INACTIVE, marginTop: 2 },
  labelActive: { color: NAV_ACTIVE, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: -2,
    right: -12,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: COLORS.white },
});

export default BottomNav;
