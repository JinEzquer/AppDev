// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import CustomButton from '../components/CustomButton';
import {
  createCustomerPayment,
  getCustomerOrder,
  getCustomerPayments,
} from '../app/api/customer';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING, requireVerifiedCustomer } from '../utils';
import { formatDeliveryWhen } from '../utils/deliverySchedule';
import { formatPeso } from '../utils/productOrder';

const PAYMENT_METHODS = [
  { value: 'gcash', label: 'GCash' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
];

const statusLabel = status => {
  switch (status) {
    case 'APPROVED':
      return 'Approved';
    case 'CANCELED':
      return 'Canceled';
    default:
      return 'Pending approval';
  }
};

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const orderId = route?.params?.orderId;
  const { data: authData } = useSelector(state => state.auth);
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [payModal, setPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('gcash');
  const [payReference, setPayReference] = useState('');
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    if (!authData?.token || !orderId) return;
    setLoading(true);
    setError(null);
    try {
      const [orderRes, payRes] = await Promise.all([
        getCustomerOrder(authData.token, orderId),
        getCustomerPayments(authData.token),
      ]);
      setOrder(orderRes?.data?.order ?? null);
      setPayments(payRes?.data?.payments ?? []);
    } catch (err) {
      setError(err?.message || 'Unable to load order');
    } finally {
      setLoading(false);
    }
  }, [authData?.token, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const orderPayments = useMemo(
    () => payments.filter(p => Number(p.orderId) === Number(orderId)),
    [payments, orderId],
  );

  const isPaid = orderPayments.some(p => p.status === 'completed');
  const canPay = order && order.status !== 'CANCELED' && !isPaid;

  const handlePay = async () => {
    if (!requireVerifiedCustomer(navigation, authData, 'pay for orders')) {
      return;
    }
    setPaying(true);
    try {
      const response = await createCustomerPayment(authData.token, {
        orderId: Number(orderId),
        method: payMethod,
        reference: payReference.trim() || undefined,
      });
      setPayModal(false);
      Alert.alert('Payment recorded', response?.message || 'Thank you for your payment.');
      load();
    } catch (err) {
      Alert.alert('Payment failed', err?.message || 'Please try again.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error || 'Order not found'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerCard}>
          <Text style={styles.orderId}>Order #{order.id}</Text>
          <Text style={styles.status}>{statusLabel(order.status)}</Text>
          <Text style={styles.date}>
            {order.orderDate ? new Date(order.orderDate).toLocaleString() : ''}
          </Text>
          <Text style={styles.total}>Total: {formatPeso(order.total)}</Text>
          {isPaid ? (
            <View style={styles.paidBadge}>
              <Text style={styles.paidText}>Paid</Text>
            </View>
          ) : null}
        </View>

        {order.delivery ? (
          <>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <View style={styles.lineCard}>
              {order.delivery.scheduledAt ? (
                <Text style={styles.lineMeta}>
                  When: {formatDeliveryWhen(order.delivery.scheduledAt)}
                </Text>
              ) : null}
              {order.delivery.address ? (
                <Text style={styles.lineMeta}>Address: {order.delivery.address}</Text>
              ) : null}
              {order.delivery.contactPhone ? (
                <Text style={styles.lineMeta}>Phone: {order.delivery.contactPhone}</Text>
              ) : null}
              {order.delivery.notes ? (
                <Text style={styles.lineMeta}>Notes: {order.delivery.notes}</Text>
              ) : null}
            </View>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Items</Text>
        {(order.items ?? []).map((line, idx) => (
          <View key={`${line.productId}-${idx}`} style={styles.lineCard}>
            <Text style={styles.lineName}>{line.productName || 'Product'}</Text>
            <Text style={styles.lineMeta}>
              {line.quantityLabel || `Qty ${line.quantity}`} · {line.priceLabel || 'unit price'}{' '}
              {formatPeso(line.price)} = {formatPeso(line.subtotal)}
            </Text>
          </View>
        ))}

        {orderPayments.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Payments</Text>
            {orderPayments.map(p => (
              <View key={p.id} style={styles.lineCard}>
                <Text style={styles.lineName}>
                  {p.method} · {formatPeso(p.amount)}
                </Text>
                <Text style={styles.lineMeta}>
                  {p.paidAt ? new Date(p.paidAt).toLocaleString() : ''}
                  {p.reference ? ` · Ref: ${p.reference}` : ''}
                </Text>
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

      {canPay ? (
        <View style={styles.footer}>
          <CustomButton label="PAY NOW" onPress={() => setPayModal(true)} />
        </View>
      ) : null}

      <Modal visible={payModal} animationType="slide" transparent onRequestClose={() => setPayModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pay for order #{order.id}</Text>
            <Text style={styles.modalAmount}>Amount: {formatPeso(order.total)}</Text>
            <Text style={styles.label}>Payment method</Text>
            <View style={styles.methodRow}>
              {PAYMENT_METHODS.map(m => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.methodChip, payMethod === m.value && styles.methodChipActive]}
                  onPress={() => setPayMethod(m.value)}
                >
                  <Text
                    style={[styles.methodChipText, payMethod === m.value && styles.methodChipTextActive]}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Reference (optional)</Text>
            <TextInput
              style={styles.input}
              value={payReference}
              onChangeText={setPayReference}
              placeholder="GCash ref, receipt no."
              placeholderTextColor={COLORS.textMuted}
            />
            <CustomButton
              label={paying ? 'PROCESSING…' : 'CONFIRM PAYMENT'}
              onPress={handlePay}
              disabled={paying}
            />
            <CustomButton
              label="CLOSE"
              variant="secondary"
              onPress={() => setPayModal(false)}
              containerStyle={{ marginTop: SPACING.sm }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundWarm },
  scroll: { padding: SPACING.lg, paddingBottom: 120 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  orderId: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  status: { fontSize: 14, fontWeight: '600', color: COLORS.accent, marginTop: SPACING.xs },
  date: { fontSize: 13, color: COLORS.textMuted, marginTop: SPACING.xs },
  total: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: SPACING.md },
  paidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    marginTop: SPACING.md,
  },
  paidText: { color: '#166534', fontWeight: '700', fontSize: 13 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm },
  lineCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lineName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  lineMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: SPACING.xs },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  modalAmount: { fontSize: 16, color: COLORS.text, marginVertical: SPACING.md },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: 15,
    marginBottom: SPACING.md,
  },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  methodChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.chipBg,
  },
  methodChipActive: { backgroundColor: COLORS.primary },
  methodChipText: { color: COLORS.textMuted, fontWeight: '600', fontSize: 13 },
  methodChipTextActive: { color: COLORS.white },
  error: { color: COLORS.accent, textAlign: 'center' },
});

export default OrderDetailScreen;
