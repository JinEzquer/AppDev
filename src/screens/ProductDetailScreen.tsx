// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { getCustomerProduct } from '../app/api/customer';
import { useCartFly } from '../context/CartFlyContext';
import { useCart } from '../context/CartContext';
import {
  COLORS,
  RADIUS,
  ROUTES,
  SPACING,
  requireVerifiedCustomer,
  resolveAssetUrl,
} from '../utils';
import {
  calculateOrderTotal,
  clampQuantity,
  formatPeso,
  formatQuantityValue,
  getActiveUnitOption,
  resolveProductOrder,
  stepQuantity,
} from '../utils/productOrder';

const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const productId = route?.params?.productId;
  const { data: authData } = useSelector(state => state.auth);
  const { addLine, totals } = useCart();
  const { flyToCart } = useCartFly();
  const addBtnRef = useRef(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(route?.params?.quantity ?? 1);
  const [selectedUnit, setSelectedUnit] = useState('box');
  const [error, setError] = useState(null);

  const stockQty = Number(product?.stockQuantity ?? 0);
  const canOrder = Boolean(product) && product.inStock !== false && stockQty > 0;
  const order = product ? resolveProductOrder(product) : null;
  const activeUnit = order ? getActiveUnitOption(order, selectedUnit) : null;
  const priceLabel = activeUnit?.priceLabel || order?.priceLabel || 'Price';
  const quantityLabel = order?.quantityLabel || 'Quantity';
  const lineTotal = order ? calculateOrderTotal(product?.price, quantity, order) : 0;

  useEffect(() => {
    if (!product) {
      return;
    }
    const o = resolveProductOrder(product);
    setQuantity(o.min ?? 1);
    setSelectedUnit(o.unitOptions?.[0]?.key ?? o.unit ?? 'pcs');
  }, [product?.id]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getCustomerProduct(productId);
        if (mounted) setProduct(response?.data?.product ?? null);
      } catch (err) {
        if (mounted) setError(err?.message || 'Unable to load product');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [productId]);

  const stockUnit = product?.stockUnit;

  const handleAddToCart = () => {
    if (!canOrder || !product) {
      Alert.alert('Out of stock', 'This product is not available until staff adds inventory.');
      return;
    }
    addLine(product, quantity, selectedUnit);
    const node = addBtnRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, w, h) => {
        flyToCart({ x: x + w / 2, y: y + h / 2 });
      });
    } else {
      flyToCart({ x: 200, y: 500 });
    }
  };

  const handleGoToCart = () => {
    if (!authData?.token) {
      navigation.navigate(ROUTES.LOGIN, { message: 'Sign in to checkout' });
      return;
    }
    if (!requireVerifiedCustomer(navigation, authData, 'checkout')) {
      return;
    }
    navigation.navigate(ROUTES.CART);
  };

  const handleOrderNow = () => {
    if (!canOrder || !product) {
      Alert.alert('Out of stock', 'This product is not available right now.');
      return;
    }
    if (!authData?.token) {
      navigation.navigate(ROUTES.LOGIN, { message: 'Sign in to order' });
      return;
    }
    if (!requireVerifiedCustomer(navigation, authData, 'place orders')) {
      return;
    }

    const directItems = [
      {
        productId: product.id,
        quantity,
        orderUnit: selectedUnit,
        name: product.name,
        order,
        price: product.price,
        subtotal: lineTotal,
        key: `direct-${product.id}`,
      },
    ];

    navigation.navigate(ROUTES.CHECKOUT, {
      directItems,
      directTotal: lineTotal,
    });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Product not found'}</Text>
      </View>
    );
  }

  const imageUri = resolveAssetUrl(product.image);
  const unitPrice = Number(product.price ?? 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.hero} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Text style={styles.heroPlaceholderText}>Patrick&apos;s</Text>
          </View>
        )}
        <View style={styles.body}>
          <Text style={styles.name}>{product.name}</Text>
          {product.category?.name ? <Text style={styles.meta}>{product.category.name}</Text> : null}
          <Text style={styles.description}>
            {product.description || 'Premium cold cuts prepared fresh for your table.'}
          </Text>
          {product.expiryDate ? (
            <Text style={styles.meta}>Best before: {product.expiryDate}</Text>
          ) : null}

          {canOrder && order ? (
            <>
              <Text style={styles.pricePerUnit}>
                {formatPeso(unitPrice)} · {priceLabel}
              </Text>

              {order.format === 'choice' && order.unitOptions?.length ? (
                <View style={styles.unitPicker}>
                  <Text style={styles.unitPickerLabel}>Size</Text>
                  <View style={styles.unitPickerRow}>
                    {order.unitOptions.map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[
                          styles.unitChip,
                          selectedUnit === opt.key && styles.unitChipActive,
                        ]}
                        onPress={() => setSelectedUnit(opt.key)}
                      >
                        <Text
                          style={[
                            styles.unitChipText,
                            selectedUnit === opt.key && styles.unitChipTextActive,
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.qtyRow}>
                <View>
                  <Text style={styles.qtyLabel}>{quantityLabel}</Text>
                  <Text style={styles.qtyHint}>{formatQuantityValue(quantity, order, selectedUnit)}</Text>
                </View>
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setQuantity(q => stepQuantity(q, -1, order, stockQty, stockUnit))
                    }
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>
                    {order.format === 'weight' ? quantity.toFixed(2) : Math.round(quantity)}
                  </Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setQuantity(q => stepQuantity(q, 1, order, stockQty, stockUnit))
                    }
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.outOfStock}>This item is out of stock and is not available to order yet.</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>{formatPeso(lineTotal)}</Text>
        </View>
        <View style={styles.footerActions}>
          <View ref={addBtnRef} collapsable={false} style={{ flex: 1 }}>
            <TouchableOpacity
              style={[styles.orderBtn, !canOrder && styles.orderBtnDisabled]}
              onPress={handleAddToCart}
              disabled={!canOrder}
              activeOpacity={0.85}
            >
              <Text style={styles.orderBtnText}>{!canOrder ? 'OUT OF STOCK' : 'ADD TO CART'}</Text>
            </TouchableOpacity>
          </View>
          {canOrder ? (
            <TouchableOpacity style={styles.orderNowBtn} onPress={handleOrderNow} activeOpacity={0.85}>
              <Text style={styles.orderNowText}>ORDER NOW</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cartBtn} onPress={handleGoToCart} activeOpacity={0.85}>
              <Text style={styles.cartBtnText}>
                CART{totals.count > 0 ? ` (${totals.count})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWarm },
  scroll: { paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  hero: { width: '100%', height: 200 },
  heroPlaceholder: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderText: { color: COLORS.white, fontWeight: '700', fontSize: 18 },
  body: { padding: SPACING.lg },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  meta: { fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.xs },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 22, marginTop: SPACING.md },
  pricePerUnit: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  unitPicker: { marginTop: SPACING.lg },
  unitPickerLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  unitPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  unitChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  unitChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  unitChipText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  unitChipTextActive: { color: COLORS.white },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
  },
  qtyLabel: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  qtyHint: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: COLORS.white, fontSize: 20, fontWeight: '600' },
  qtyValue: { fontSize: 18, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  outOfStock: {
    marginTop: SPACING.xl,
    fontSize: 14,
    color: COLORS.accent,
    fontWeight: '600',
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
  },
  priceBox: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    minWidth: 100,
  },
  priceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)' },
  priceValue: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  footerActions: { flex: 1, flexDirection: 'row', gap: SPACING.sm },
  orderBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cartBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtnText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  orderNowBtn: {
    backgroundColor: COLORS.navy2,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNowText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  orderBtnDisabled: { opacity: 0.7 },
  orderBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  error: { color: COLORS.accent, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.xs },
  modalHint: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.md, lineHeight: 20 },
});

export default ProductDetailScreen;
