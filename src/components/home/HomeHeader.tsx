// @ts-nocheck
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { COLORS, ROUTES, SPACING, TYPE, getLogoSource } from '../../utils';

const HomeHeader = ({ subtitle = 'What would you like to order today?' }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { data: authData } = useSelector(state => state.auth);
  const { totals } = useCart();

  const firstName =
    authData?.user?.firstName ||
    authData?.user?.username?.split(/[@._]/)[0] ||
    'Guest';
  const greeting = authData?.token ? `Hi, ${firstName} 👋` : `Hi, ${firstName} 👋`;

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + SPACING.md }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Image source={getLogoSource()} style={styles.logo} resizeMode="contain" />
          <View style={styles.textCol}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.sub}>{subtitle}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => navigation.navigate(ROUTES.CART)}
          activeOpacity={0.85}
        >
          <Text style={styles.cartIcon}>🛒</Text>
          {totals.count > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totals.count > 9 ? '9+' : totals.count}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  logo: { width: 44, height: 44, borderRadius: 12, marginRight: SPACING.md },
  textCol: { flex: 1 },
  greeting: { ...TYPE.greeting },
  sub: { ...TYPE.greetingSub },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cartIcon: { fontSize: 20 },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.red,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
});

export default HomeHeader;
