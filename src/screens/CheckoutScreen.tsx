// @ts-nocheck
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import ShopScreenHeader from '../components/shop/ShopScreenHeader';
import { shopUi } from '../components/shop/shopUi';
import { createCustomerOrder } from '../app/api/customer';
import { useCart } from '../context/CartContext';
import { COLORS, RADIUS, ROUTES, SPACING, requireVerifiedCustomer } from '../utils';
import { buildDeliveryScheduledAt, defaultDeliveryDate } from '../utils/deliverySchedule';
import { formatPeso, formatQuantityValue } from '../utils/productOrder';

const PAYMENT_OPTIONS = [
  { key: 'gcash', label: 'GCash', sub: 'Pay after order is approved' },
  { key: 'card', label: 'Card', sub: 'Complete payment in Orders' },
  { key: 'cash', label: 'Cash on delivery', sub: 'Pay when delivered' },
];

const CheckoutScreen = () => {
  const navigation = useNavigation();
  const { data: authData } = useSelector(state => state.auth);
  const { lines, totals, clearCart } = useCart();
  const [ordering, setOrdering] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(defaultDeliveryDate());
  const [deliveryTime, setDeliveryTime] = useState('14:00');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('gcash');

  const placeOrder = async () => {
    if (!authData?.token) {
      navigation.navigate(ROUTES.LOGIN, { message: 'Sign in to checkout' });
      return;
    }
    if (!requireVerifiedCustomer(navigation, authData, 'place orders')) {
      return;
    }

    const scheduledAt = buildDeliveryScheduledAt(deliveryDate, deliveryTime);
    if (!scheduledAt) {
      Alert.alert('Invalid date/time', 'Use YYYY-MM-DD and HH:MM (24-hour).');
      return;
    }
    if (new Date(scheduledAt) <= new Date()) {
      Alert.alert('Invalid time', 'Choose a future delivery date and time.');
      return;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert('Address required', 'Enter your delivery address.');
      return;
    }
    if (!deliveryPhone.trim()) {
      Alert.alert('Phone required', 'Enter a contact phone for delivery.');
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
      });
      const newOrderId = response?.data?.order?.id;
      clearCart();
      Alert.alert('Order placed', response?.message || 'Your order is pending approval.', [
        {
          text: 'View order',
          onPress: () =>
            navigation.navigate(
              newOrderId ? ROUTES.ORDER_DETAIL : ROUTES.HISTORY,
              newOrderId ? { orderId: newOrderId } : undefined,
            ),
        },
        { text: 'OK', onPress: () => navigation.navigate(ROUTES.HISTORY) },
      ]);
    } catch (err) {
      Alert.alert('Order failed', err?.message || 'Please try again.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <View style={shopUi.screenBg}>
      <ShopScreenHeader title="Checkout" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={shopUi.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardIcon}>📍</Text>
            <Text style={styles.cardTitle}>Address</Text>
            <TouchableOpacity>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.addressText}>
            {deliveryAddress.trim() || 'Enter your delivery address below'}
          </Text>
          {deliveryPhone ? <Text style={styles.addressSub}>{deliveryPhone}</Text> : null}
        </View>

        <TouchableOpacity style={shopUi.rowCard} activeOpacity={0.9}>
          <Text style={styles.rowIcon}>🚚</Text>
          <View style={styles.rowTextCol}>
            <Text style={styles.rowTitle}>Delivery schedule</Text>
            <Text style={styles.rowSub}>
              {deliveryDate} · {deliveryTime}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <View style={shopUi.card}>
          <Text style={shopUi.sectionTitle}>Delivery details</Text>
          <Field label="Date (YYYY-MM-DD)" value={deliveryDate} onChange={setDeliveryDate} />
          <Field label="Time (HH:MM)" value={deliveryTime} onChange={setDeliveryTime} />
          <Field label="Street address" value={deliveryAddress} onChange={setDeliveryAddress} multiline />
          <Field label="Phone" value={deliveryPhone} onChange={setDeliveryPhone} keyboard="phone-pad" />
          <Field label="Notes (optional)" value={deliveryNotes} onChange={setDeliveryNotes} />
        </View>

        <Text style={[shopUi.sectionTitle, styles.payTitle]}>Payment method</Text>
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

        <View style={[shopUi.card, styles.summaryCard]}>
          <Text style={shopUi.sectionTitle}>Order summary</Text>
          {lines.map(line => (
            <View key={line.key} style={shopUi.summaryRow}>
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
            <Text style={shopUi.summaryValue}>{formatPeso(totals.subtotal)}</Text>
          </View>
          <View style={shopUi.summaryRow}>
            <Text style={shopUi.summaryLabel}>Shipping</Text>
            <Text style={[shopUi.summaryValue, styles.freeShip]}>Included</Text>
          </View>
          <View style={shopUi.totalRow}>
            <Text style={shopUi.totalLabel}>TOTAL PAYMENT</Text>
            <Text style={shopUi.totalValue}>{formatPeso(totals.subtotal)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
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
      <TextInputLike
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        keyboard={keyboard}
      />
    </View>
  );
}

function TextInputLike({ value, onChangeText, multiline, keyboard }) {
  return (
    <TextInput
      style={[fieldStyles.input, multiline && fieldStyles.inputMulti]}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor={COLORS.textMuted}
      multiline={multiline}
      keyboardType={keyboard}
    />
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
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  cardIcon: { fontSize: 18, marginRight: SPACING.sm },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: COLORS.text },
  editLink: { fontSize: 14, fontWeight: '700', color: COLORS.navy2 },
  addressText: { fontSize: 14, color: COLORS.text, lineHeight: 20 },
  addressSub: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  rowIcon: { fontSize: 22, marginRight: SPACING.md },
  rowTextCol: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  chevron: { fontSize: 22, color: COLORS.textMuted },
  payTitle: { paddingHorizontal: 0 },
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
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.navy2,
  },
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
});

export default CheckoutScreen;
