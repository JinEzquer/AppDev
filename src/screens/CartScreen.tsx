// @ts-nocheck
import {
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import PageHeader from '../components/home/PageHeader';
import { shopUi } from '../components/shop/shopUi';
import { useCart } from '../context/CartContext';
import {
  COLORS,
  FONT,
  RADIUS,
  ROUTES,
  SPACING,
  bottomNavContentPadding,
  requireVerifiedCustomer,
  resolveAssetUrl,
} from '../utils';
import {
  calculateOrderTotal,
  formatPeso,
  formatQuantityValue,
  getActiveUnitOption,
  stepQuantity,
} from '../utils/productOrder';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CartScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: authData } = useSelector(state => state.auth);
  const { lines, updateLine, removeLine, totals } = useCart();
  const bottomPad = bottomNavContentPadding(insets.bottom);

  const goCheckout = () => {
    if (!authData?.token) {
      navigation.navigate(ROUTES.LOGIN, { message: 'Sign in to checkout' });
      return;
    }
    if (!requireVerifiedCustomer(navigation, authData, 'checkout')) {
      return;
    }
    navigation.navigate(ROUTES.CHECKOUT);
  };

  const renderItem = ({ item }) => {
    const imageUri = resolveAssetUrl(item.image);
    const lineTotal = calculateOrderTotal(item.price, item.quantity, item.order);
    const unitOpt = getActiveUnitOption(item.order, item.orderUnit);
    const maxStock = item.stockQuantity;
    const qtyLabel = formatQuantityValue(item.quantity, item.order, item.orderUnit);

    return (
      <View style={styles.lineCard}>
        <TouchableOpacity style={styles.removeX} onPress={() => removeLine(item.key)} hitSlop={8}>
          <Text style={styles.removeXText}>×</Text>
        </TouchableOpacity>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPh]}>
            <Text style={styles.thumbPhText}>PCC</Text>
          </View>
        )}
        <View style={styles.lineBody}>
          <Text style={styles.lineName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.lineMeta}>{qtyLabel}</Text>
          <Text style={styles.linePrice}>{formatPeso(lineTotal)}</Text>
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnMinus]}
              onPress={() =>
                updateLine(item.key, {
                  quantity: stepQuantity(item.quantity, -1, item.order, maxStock, item.stockUnit),
                })
              }
            >
              <Text style={styles.qtyBtnMinusText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>
              {item.order?.format === 'weight' ? item.quantity.toFixed(2) : Math.round(item.quantity)}
            </Text>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnPlus]}
              onPress={() =>
                updateLine(item.key, {
                  quantity: stepQuantity(item.quantity, 1, item.order, maxStock, item.stockUnit),
                })
              }
            >
              <Text style={styles.qtyBtnPlusText}>+</Text>
            </TouchableOpacity>
          </View>
          {item.order?.format === 'choice' && item.order.unitOptions?.length ? (
            <View style={styles.unitRow}>
              {item.order.unitOptions.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.unitChip, item.orderUnit === opt.key && styles.unitChipOn]}
                  onPress={() => updateLine(item.key, { orderUnit: opt.key })}
                >
                  <Text style={[styles.unitChipText, item.orderUnit === opt.key && styles.unitChipTextOn]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  if (lines.length === 0) {
    return (
      <View style={shopUi.screenBg}>
        <PageHeader title="My cart" subtitle="Your bag is empty" />
        <View style={styles.empty}>
        <Text style={styles.emptyHint}>Browse the shop and tap + Add on any product.</Text>
        <TouchableOpacity style={shopUi.pillBtn} onPress={() => navigation.navigate(ROUTES.HOME)}>
          <Text style={shopUi.pillBtnText}>Browse shop</Text>
        </TouchableOpacity>
        </View>
      </View>
    );
  }

  const footer = (
    <View style={styles.summaryBlock}>
      <View style={shopUi.summaryRow}>
        <Text style={shopUi.summaryLabel}>Product</Text>
        <Text style={shopUi.summaryValue}>
          {lines.length} item{lines.length > 1 ? 's' : ''}
        </Text>
      </View>
      <View style={shopUi.summaryRow}>
        <Text style={shopUi.summaryLabel}>Subtotal</Text>
        <Text style={shopUi.summaryValue}>{formatPeso(totals.subtotal)}</Text>
      </View>
      <View style={shopUi.totalRow}>
        <Text style={shopUi.totalLabel}>TOTAL</Text>
        <Text style={shopUi.totalValue}>{formatPeso(totals.subtotal)}</Text>
      </View>
    </View>
  );

  return (
    <View style={shopUi.screenBg}>
      <PageHeader title="My cart" subtitle={`${lines.length} item${lines.length > 1 ? 's' : ''} in your bag`} />
      <FlatList
        data={lines}
        keyExtractor={item => item.key}
        renderItem={renderItem}
        ListFooterComponent={footer}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 72 }]}
        showsVerticalScrollIndicator={false}
      />
      <View style={[styles.checkoutBar, { paddingBottom: bottomPad }]}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={goCheckout} activeOpacity={0.9}>
          <Text style={styles.checkoutBtnText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pageTitle: {
    fontFamily: FONT,
    fontSize: 20,
    fontWeight: '300',
    color: COLORS.text,
    textAlign: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  list: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm },
  lineCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  removeX: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeXText: { fontSize: 22, color: COLORS.textMuted, fontWeight: '300' },
  thumb: { width: 88, height: 88, borderRadius: RADIUS.md },
  thumbPh: { backgroundColor: COLORS.cream2, alignItems: 'center', justifyContent: 'center' },
  thumbPhText: { fontWeight: '800', color: COLORS.textMuted, fontSize: 12 },
  lineBody: { flex: 1, marginLeft: SPACING.md, paddingRight: SPACING.lg },
  lineName: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  lineMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  linePrice: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginTop: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.sm, gap: SPACING.sm },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnMinus: { backgroundColor: COLORS.gold },
  qtyBtnPlus: { backgroundColor: COLORS.accent },
  qtyBtnMinusText: { fontSize: 18, fontWeight: '700', color: COLORS.navy2 },
  qtyBtnPlusText: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  qtyNum: { fontSize: 15, fontWeight: '800', minWidth: 28, textAlign: 'center' },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: SPACING.sm },
  unitChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitChipOn: { backgroundColor: COLORS.navy2, borderColor: COLORS.navy2 },
  unitChipText: { fontSize: 11, fontWeight: '600', color: COLORS.text },
  unitChipTextOn: { color: COLORS.white },
  summaryBlock: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    backgroundColor: COLORS.cream,
  },
  checkoutBtn: {
    backgroundColor: COLORS.navy2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 4,
    alignItems: 'center',
  },
  checkoutBtnText: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    alignItems: 'center',
    paddingTop: SPACING.xxl,
  },
  emptyHint: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.xl,
  },
});

export default CartScreen;
