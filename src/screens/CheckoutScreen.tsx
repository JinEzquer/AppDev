// @ts-nocheck
import { useRef, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import ShopScreenHeader from '../components/shop/ShopScreenHeader';
import { shopUi } from '../components/shop/shopUi';
import { createCustomerOrder } from '../app/api/customer';
import { useCart } from '../context/CartContext';
import { COLORS, RADIUS, ROUTES, SPACING, requireVerifiedCustomer } from '../utils';
import { buildDeliveryScheduledAt, defaultDeliveryDate } from '../utils/deliverySchedule';
import { formatPeso, formatQuantityValue } from '../utils/productOrder';
import { displayLocalNotification } from '../services/firebase/notifications';

const PAYMENT_OPTIONS = [
  { key: 'gcash', label: 'GCash', sub: 'Pay via GCash' },
  { key: 'cash', label: 'Cash on delivery', sub: 'Pay when delivered' },
  { key: 'card', label: 'Card', sub: 'Pay by card' },
  { key: 'bank_transfer', label: 'Bank transfer', sub: 'Pay via bank' },
];

/**
 * CheckoutScreen accepts items either from cart (default) or from route params
 * when using the "Order now" direct flow from product detail.
 *
 * route.params?.directItems  — array of { productId, quantity, orderUnit, name, price, subtotal }
 * route.params?.directTotal  — number
 */
const CheckoutScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { data: authData } = useSelector(state => state.auth);
  const { lines: cartLines, totals: cartTotals, clearCart } = useCart();

  // Direct-order mode when navigated from ProductDetail with items in params.
  const directItems = route?.params?.directItems ?? null;
  const directTotal = route?.params?.directTotal ?? 0;
  const isDirectOrder = Array.isArray(directItems) && directItems.length > 0;

  const lines = isDirectOrder ? directItems : cartLines;
  const subtotal = isDirectOrder ? directTotal : cartTotals.subtotal;

  const [ordering, setOrdering] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate());
  const [deliveryTime, setDeliveryTime] = useState('14:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [paymentReference, setPaymentReference] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const scrollRef = useRef(null);
  const deliverySectionY = useRef(0);

  const showProblem = (title, message) => {
    setCheckoutError(message);
    ToastAndroid.show(message, ToastAndroid.LONG);
    Alert.alert(title, message);
    scrollRef.current?.scrollTo({ y: Math.max(0, deliverySectionY.current - 16), animated: true });
  };

  const placeOrder = async () => {
    setCheckoutError('');

    if (!authData?.token) {
      navigation.navigate(ROUTES.LOGIN, { message: 'Sign in to checkout' });
      return;
    }
    if (!requireVerifiedCustomer(navigation, authData, 'place orders')) {
      return;
    }

    const scheduledAt = buildDeliveryScheduledAt(deliveryDate, deliveryTime);
    if (!scheduledAt) {
      showProblem('Invalid date/time', 'Use YYYY-MM-DD and HH:MM (24-hour).');
      return;
    }
    if (new Date(scheduledAt) <= new Date()) {
      showProblem('Invalid time', 'Choose a future delivery date and time.');
      return;
    }
    if (!deliveryAddress.trim()) {
      showProblem('Address required', 'Enter your delivery address.');
      return;
    }
    if (!deliveryPhone.trim()) {
      showProblem('Phone required', 'Enter a contact phone number for delivery.');
      return;
    }

    setOrdering(true);
    try {
      const response = await createCustomerOrder(authData.token, {
        items: lines.map(line => ({
          productId: line.productId,
          quantity: line.quantity,
          orderUnit: line.orderUnit,
        })),
        deliveryScheduledAt: scheduledAt,
        deliveryAddress: deliveryAddress.trim(),
        deliveryContactPhone: deliveryPhone.trim(),
        deliveryNotes: deliveryNotes.trim() || undefined,
        paymentMethod,
        paymentReference: paymentReference.trim() || undefined,
      });

      const newOrderId = response?.data?.order?.id;
      if (!isDirectOrder) {
        clearCart();
      }

      Alert.alert(
        'Order placed!',
        `Your order #${newOrderId ?? ''} is pending approval. We'll notify you once it's confirmed.`,
        [
          {
            text: 'View order',
            onPress: async () => {
              try {
                await displayLocalNotification(
                  "Patrick's Cold Cuts",
                  `Order #${newOrderId ?? ''} placed successfully and is pending approval.`,
                );
              } catch {}
              navigation.navigate(
                newOrderId ? ROUTES.ORDER_DETAIL : ROUTES.HISTORY,
                newOrderId ? { orderId: newOrderId } : undefined,
              );
            },
          },
          {
            text: 'OK',
            onPress: async () => {
              try {
                await displayLocalNotification(
                  "Patrick's Cold Cuts",
                  `Order #${newOrderId ?? ''} placed successfully and is pending approval.`,
                );
              } catch {}
              navigation.navigate(ROUTES.HISTORY);
            },
          },
        ],
      );
    } catch (err) {
      const message = err?.message || 'Please try again.';
      setCheckoutError(message);
      ToastAndroid.show(message, ToastAndroid.LONG);
      Alert.alert('Order failed', message);
    } finally {
      setOrdering(false);
    }
  };

  return (
    <View style={shopUi.screenBg}>
      <ShopScreenHeader title="Checkout" onBack={() => navigation.goBack()} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Delivery details */}
        <View
          style={shopUi.card}
          onLayout={e => {
            deliverySectionY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.sectionHeading}>🚚 Delivery details</Text>
          <Field label="Date (YYYY-MM-DD)" value={deliveryDate} onChange={setDeliveryDate} />
          <Field label="Time (HH:MM, 24-hour)" value={deliveryTime} onChange={setDeliveryTime} />
          <Field label="Street address" value={deliveryAddress} onChange={setDeliveryAddress} multiline />
          <Field label="Phone" value={deliveryPhone} onChange={setDeliveryPhone} keyboard="phone-pad" />
          <Field label="Notes (optional)" value={deliveryNotes} onChange={setDeliveryNotes} />
        </View>

        {/* Payment method */}
        <Text style={styles.sectionHeadingOutside}>💳 Payment method</Text>
        {PAYMENT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            style={[styles.payRow, paymentMethod === opt.key && styles.payRowOn]}
            onPress={() => setPaymentMethod(opt.key)}
            activeOpacity={0.85}
          >
            <View style={styles.radioOuter}>
              {paymentMethod === opt.key ? <View style={styles.radioInner} /> : null}
            </View>
            <View style={styles.payTextCol}>
              <Text style={styles.payLabel}>{opt.label}</Text>
              <Text style={styles.paySub}>{opt.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Reference field — only shown for non-cash */}
        {paymentMethod !== 'cash' ? (
          <View style={shopUi.card}>
            <Field
              label={`${paymentMethod === 'gcash' ? 'GCash' : paymentMethod === 'card' ? 'Card' : 'Bank'} reference / receipt no. (optional)`}
              value={paymentReference}
              onChange={setPaymentReference}
            />
          </View>
        ) : null}

        {/* Order summary */}
        <View style={[shopUi.card, styles.summaryCard]}>
          <Text style={shopUi.sectionTitle}>Order summary</Text>
          {lines.map((line, i) => (
            <View key={line.key ?? `${line.productId}-${i}`} style={shopUi.summaryRow}>
              <Text style={shopUi.summaryLabel} numberOfLines={1}>
                {line.name}
              </Text>
              <Text style={shopUi.summaryValue}>
                {formatQuantityValue(line.quantity, line.order, line.orderUnit)}
              </Text>
            </View>
          ))}
          <View style={shopUi.summaryRow}>
            <Text style={shopUi.summaryLabel}>Subtotal</Text>
            <Text style={shopUi.summaryValue}>{formatPeso(subtotal)}</Text>
          </View>
          <View style={shopUi.summaryRow}>
            <Text style={shopUi.summaryLabel}>Shipping</Text>
            <Text style={[shopUi.summaryValue, styles.freeShip]}>Included</Text>
          </View>
          <View style={shopUi.totalRow}>
            <Text style={shopUi.totalLabel}>TOTAL PAYMENT</Text>
            <Text style={shopUi.totalValue}>{formatPeso(subtotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {checkoutError ? (
          <Text style={styles.checkoutError} accessibilityRole="alert">
            {checkoutError}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[shopUi.pillBtn, ordering && { opacity: 0.6 }]}
          onPress={placeOrder}
          disabled={ordering || lines.length === 0}
          activeOpacity={0.9}
        >
          <Text style={shopUi.pillBtnText}>{ordering ? 'Placing order…' : 'Place Order'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function Field({ label, value, onChange, multiline, keyboard }) {
  return (
    <View style={fieldStyles.wrap}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, multiline && fieldStyles.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        keyboardType={keyboard}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  wrap: { marginBottom: SPACING.md },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: SPACING.xs },
  input: {
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMulti: { minHeight: 72, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: 120 },
  sectionHeading: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: SPACING.md },
  sectionHeadingOutside: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  payRowOn: { borderColor: COLORS.gold, backgroundColor: COLORS.cream2 },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.navy2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.navy2 },
  payTextCol: { flex: 1 },
  payLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  paySub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  summaryCard: { marginTop: SPACING.sm },
  freeShip: { color: COLORS.success, fontWeight: '700' },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    backgroundColor: COLORS.cream,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkoutError: {
    fontSize: 13,
    color: COLORS.red,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    lineHeight: 18,
  },
});

export default CheckoutScreen;
