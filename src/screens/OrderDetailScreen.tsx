// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import {
  getCustomerOrder,
  getCustomerPayments,
} from '../app/api/customer';
import { useNavigation } from '@react-navigation/native';
import { COLORS, RADIUS, SPACING } from '../utils';
import { formatDeliveryWhen } from '../utils/deliverySchedule';
import { formatPeso } from '../utils/productOrder';
import { websocketClient } from '../services/websocket/client';

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

  useEffect(() => {
    const timer = setInterval(() => {
      load();
    }, 8000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const offMessage = websocketClient.onMessage(payload => {
      try {
        const parsed = JSON.parse(payload);
        if (parsed?.type !== 'order_status_changed') {
          return;
        }
        if (Number(parsed?.orderId) !== Number(orderId)) {
          return;
        }
        load();
      } catch {
        // ignore non-JSON payload
      }
    });

    return () => offMessage();
  }, [load, orderId]);

  const orderPayments = useMemo(
    () => payments.filter(p => Number(p.orderId) === Number(orderId)),
    [payments, orderId],
  );

  const isPaid = orderPayments.some(p => p.status === 'completed');

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
            <Text style={styles.sectionTitle}>Payment</Text>
            {orderPayments.map(p => (
              <View key={p.id} style={styles.lineCard}>
                <Text style={styles.lineName}>
                  {p.method?.charAt(0).toUpperCase() + p.method?.slice(1)} · {formatPeso(p.amount)}
                  {' · '}
                  <Text style={p.status === 'completed' ? styles.statusPaid : styles.statusPending}>
                    {p.status === 'completed' ? 'Paid' : 'Pending confirmation'}
                  </Text>
                </Text>
                {p.reference ? (
                  <Text style={styles.lineMeta}>Ref: {p.reference}</Text>
                ) : null}
                {p.paidAt ? (
                  <Text style={styles.lineMeta}>{new Date(p.paidAt).toLocaleString()}</Text>
                ) : null}
              </View>
            ))}
          </>
        ) : null}
      </ScrollView>

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
  error: { color: COLORS.accent, textAlign: 'center' },
  statusPaid: { color: COLORS.success, fontWeight: '700' },
  statusPending: { color: COLORS.gold, fontWeight: '700' },
});

export default OrderDetailScreen;
