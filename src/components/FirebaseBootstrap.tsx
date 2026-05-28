import type { ReactNode } from 'react';
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { useSelector } from 'react-redux';
import { registerDeviceFcmToken } from '../app/api/customer';
import {
  ensureNotificationChannel,
  handleNotificationNavigation,
  listenForForegroundMessages,
  listenForNotificationOpen,
  listenForTokenRefresh,
  logAppEvent,
  registerForPushNotifications,
  setAnalyticsUserId,
  syncFcmTokenToBackend,
} from '../services/firebase';
import { bootstrapWebSocketFromBackend } from '../services/websocket/bootstrap';

type Props = {
  children: ReactNode;
};

type AuthSlice = {
  auth?: {
    token?: string | null;
    user?: { id?: number | string };
  };
};

/** Initializes Firebase Analytics + FCM once the app mounts. */
export default function FirebaseBootstrap({ children }: Props) {
  const authToken = useSelector((state: AuthSlice) => state.auth?.token ?? null);
  const userId = useSelector((state: AuthSlice) =>
    state.auth?.user?.id != null ? String(state.auth.user.id) : null,
  );

  useEffect(() => {
    setAnalyticsUserId(userId);
  }, [userId]);

  useEffect(() => {
    if (authToken) {
      syncFcmTokenToBackend(authToken);
    }
  }, [authToken]);

  useEffect(() => {
    let unsubToken = () => {};
    let unsubForeground = () => {};
    let unsubOpen = () => {};

    (async () => {
      try {
        await ensureNotificationChannel();

        const token = await registerForPushNotifications();
        if (token) {
          await logAppEvent('fcm_token_registered');
          if (authToken) {
            await syncFcmTokenToBackend(authToken);
          }
        }

        unsubToken = listenForTokenRefresh(async newToken => {
          if (authToken) {
            try {
              await registerDeviceFcmToken(authToken, newToken);
            } catch (err) {
              console.warn('[FCM] Token refresh sync failed', err);
            }
          }
        });

        unsubForeground = listenForForegroundMessages();
        unsubOpen = listenForNotificationOpen(message => {
          logAppEvent('notification_opened', {
            message_id: message.messageId ?? 'unknown',
            order_id: message.data?.orderId ?? '',
          });
          handleNotificationNavigation(message);
        });

        const initial = await messaging().getInitialNotification();
        if (initial) {
          handleNotificationNavigation(initial);
        }

        // Realtime socket is optional; run after notifications are ready.
        await bootstrapWebSocketFromBackend(authToken);
      } catch (err) {
        console.warn('[FCM] Bootstrap failed', err);
      }
    })();

    return () => {
      unsubToken();
      unsubForeground();
      unsubOpen();
    };
  }, [authToken]);

  return children;
}
