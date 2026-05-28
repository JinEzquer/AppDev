// @ts-nocheck
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import GuestPrompt from '../components/GuestPrompt';
import PageHeader from '../components/home/PageHeader';
import { getCustomerOrders, getCustomerPayments } from '../app/api/customer';
import { COLORS, RADIUS, ROUTES, SHADOW, SPACING, TYPE } from '../utils';
import { formatPeso } from '../utils/productOrder';
import { formatDeliveryWhen } from '../utils/deliverySchedule';

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

const HistoryScreen = () => {
  const navigation = useNavigation();
  const { data: authData } = useSelector(state => state.auth);
  const isGuest = !authData?.token;
  const [orders, setOrders] = useState([]);
  const [paidOrderIds, setPaidOrderIds] = useState(new Set());
  const [loading, setLoading] = useState(!isGuest);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (!authData?.token) return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const [ordersRes, paymentsRes] = await Promise.all([
          getCustomerOrders(authData.token),
          getCustomerPayments(authData.token),
        ]);
        setOrders(ordersRes?.data?.orders ?? []);
        const paid = new Set(
          (paymentsRes?.data?.payments ?? [])
            .filter(p => p.status === 'completed')
            .map(p => Number(p.orderId)),
        );
        setPaidOrderIds(paid);
      } catch (err) {
        setError(err?.message || 'Unable to load orders');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authData?.token],
  );

  useEffect(() => {
    if (!isGuest) loadOrders();
  }, [loadOrders, isGuest]);

  useFocusEffect(
    useCallback(() => {
      if (!isGuest) {
        loadOrders(true);
      }
    }, [isGuest, loadOrders]),
  );

  useEffect(() => {
    if (isGuest) return;
    const timer = setInterval(() => {
      loadOrders(true);
    }, 8000);
    return () => clearInterval(timer);
  }, [isGuest, loadOrders]);

  if (isGuest) {
    return (
      <GuestPrompt
        title="Your orders"
        message="Sign in to see orders you have placed. You can browse and add items without an account until checkout."
        loginMessage="Sign in to view your orders"
        afterLogin={{ screen: ROUTES.HISTORY }}
      />
    );
  }

  const renderItem = ({ item }) => {
    const firstItem = item.items?.[0];
    const isPaid = paidOrderIds.has(Number(item.id));
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate(ROUTES.ORDER_DETAIL, { orderId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <View style={styles.badges}>
            {isPaid ? <Text style={styles.paidBadge}>Paid</Text> : null}
            <Text style={styles.status}>{statusLabel(item.status)}</Text>
          </View>
        </View>
        {firstItem?.productName ? (
          <Text style={styles.productName}>
            {firstItem.productName}
            {item.items?.length > 1 ? ` +${item.items.length - 1} more` : ''}
          </Text>
        ) : null}
        <Text style={styles.total}>Total: {formatPeso(item.total ?? 0)}</Text>
        {item.delivery?.scheduledAt ? (
          <Text style={styles.delivery}>
            Delivery: {formatDeliveryWhen(item.delivery.scheduledAt)}
            {item.delivery.address ? ` · ${item.delivery.address}` : ''}
          </Text>
        ) : null}
        <Text style={styles.date}>
          {item.orderDate ? new Date(item.orderDate).toLocaleString() : ''}
        </Text>
        <Text style={styles.tapHint}>Tap for details & payment</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="My orders" subtitle="Track delivery and payments" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={orders}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No orders yet. Tap a product and order when you are ready.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.xs },
  orderId: { ...TYPE.productName, fontSize: 16 },
  badges: { alignItems: 'flex-end', gap: 4 },
  status: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  paidBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productName: { fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.xs },
  total: { fontSize: 15, fontWeight: '600', color: COLORS.accent },
  delivery: { fontSize: 12, color: COLORS.text, marginTop: SPACING.xs, lineHeight: 18 },
  date: { fontSize: 12, color: COLORS.textMuted, marginTop: SPACING.xs },
  tapHint: { fontSize: 12, color: COLORS.primary, marginTop: SPACING.sm, fontWeight: '500' },
  error: { color: COLORS.accent, paddingHorizontal: SPACING.lg },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: SPACING.xl, lineHeight: 22 },
});

export default HistoryScreen;
