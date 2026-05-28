import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getCustomerOrders } from '../app/api/customer';
import { displayLocalNotification } from '../services/firebase/notifications';

type AuthSlice = {
  auth?: {
    data?: {
      token?: string | null;
    };
    token?: string | null;
  };
};

type OrderSnapshot = {
  id: number;
  status: string;
};

/**
 * Polls customer orders in background and shows a local notification when
 * an order transitions to APPROVED or CANCELED. This is a reliability fallback
 * in case realtime stream delivery is delayed.
 */
export default function OrderStatusWatcher() {
  const authToken = useSelector(
    (state: AuthSlice) => state.auth?.data?.token ?? state.auth?.token ?? null,
  );
  const knownStatusesRef = useRef<Map<number, string>>(new Map());
  const notifiedTransitionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!authToken) {
      knownStatusesRef.current.clear();
      notifiedTransitionsRef.current.clear();
      return;
    }

    let active = true;

    const poll = async () => {
      try {
        const response = await getCustomerOrders(authToken);
        const orders = (response?.data?.orders ?? []) as Array<{ id?: number; status?: string }>;
        if (!active || !Array.isArray(orders)) {
          return;
        }

        const current = new Map<number, string>();
        const normalized: OrderSnapshot[] = orders
          .map(o => ({
            id: Number(o?.id ?? 0),
            status: String(o?.status ?? '').trim().toUpperCase(),
          }))
          .filter(o => Number.isFinite(o.id) && o.id > 0 && o.status.length > 0);

        normalized.forEach(o => current.set(o.id, o.status));

        // First successful fetch: establish baseline without notifying.
        if (knownStatusesRef.current.size === 0) {
          knownStatusesRef.current = current;
          return;
        }

        for (const item of normalized) {
          const prev = knownStatusesRef.current.get(item.id);
          if (!prev || prev === item.status) {
            continue;
          }

          if (item.status === 'APPROVED' || item.status === 'CANCELED') {
            const key = `${item.id}:${item.status}`;
            if (!notifiedTransitionsRef.current.has(key)) {
              notifiedTransitionsRef.current.add(key);
              const body =
                item.status === 'APPROVED'
                  ? `Your order #${item.id} was approved.`
                  : `Your order #${item.id} was rejected.`;
              await displayLocalNotification("Patrick's Cold Cuts", body);
            }
          }
        }

        knownStatusesRef.current = current;
      } catch {
        // silent retry on next interval
      }
    };

    poll();
    const timer = setInterval(poll, 8000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [authToken]);

  return null;
}

