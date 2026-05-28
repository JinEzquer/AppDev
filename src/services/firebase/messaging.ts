import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import { getRemoteMessageContent, showRemoteMessageNotification } from './handleRemoteMessage';
import { displayLocalNotification } from './notifications';

const FCM_TOKEN_KEY = 'fcm_token';

function logFcm(message: string, extra?: unknown): void {
  if (extra !== undefined) {
    console.warn(`[FCM] ${message}`, extra);
  } else {
    console.warn(`[FCM] ${message}`);
  }
}

export async function getStoredFcmToken(): Promise<string | null> {
  return AsyncStorage.getItem(FCM_TOKEN_KEY);
}

async function storeFcmToken(token: string): Promise<void> {
  await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    logFcm(`POST_NOTIFICATIONS result: ${result}`);
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return false;
    }
  }

  // Mainly for iOS; on Android this is usually authorized once POST_NOTIFICATIONS is granted.
  const authStatus = await messaging().requestPermission();
  const allowed =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  logFcm(`requestPermission status: ${authStatus} (allowed=${allowed})`);
  return allowed;
}

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    const allowed = await requestNotificationPermission();
    if (!allowed) {
      logFcm('Notifications not allowed — enable in Android Settings → Apps → Ezquerdev → Notifications');
      return null;
    }

    const token = await messaging().getToken();
    if (!token) {
      logFcm('getToken() returned empty — emulator needs Google Play image + Google Play services');
      return null;
    }

    await storeFcmToken(token);
    logFcm('Device token ready — use Profile → Copy FCM token (do not copy from logcat; line breaks break it)');
    return token;
  } catch (err) {
    logFcm('Failed to get FCM token', err);
    return null;
  }
}

export function listenForTokenRefresh(onToken: (token: string) => void): () => void {
  return messaging().onTokenRefresh(async token => {
    await storeFcmToken(token);
    logFcm('Token refreshed:', token);
    onToken(token);
  });
}

export function listenForForegroundMessages(
  onMessage?: (message: FirebaseMessagingTypes.RemoteMessage) => void,
): () => void {
  return messaging().onMessage(async remoteMessage => {
    logFcm('Foreground message received', {
      messageId: remoteMessage.messageId ?? 'unknown',
      notification: remoteMessage.notification,
      data: remoteMessage.data,
    });

    onMessage?.(remoteMessage);

    try {
      const shown = await showRemoteMessageNotification(remoteMessage);
      if (shown) {
        logFcm('Foreground notification displayed in status bar');
      } else {
        logFcm('Foreground message had no title/body', getRemoteMessageContent(remoteMessage));
      }
    } catch (err) {
      logFcm('Failed to display foreground notification', err);
    }
  });
}

/** Shows a local notification to verify channel + permissions (no FCM needed). */
export async function showTestLocalNotification(): Promise<void> {
  await displayLocalNotification(
    "Patrick's Cold Cuts",
    'Local test — if you see this, notifications work on this device.',
  );
  logFcm('Local test notification displayed');
}

export function listenForNotificationOpen(
  onOpen: (message: FirebaseMessagingTypes.RemoteMessage) => void,
): () => void {
  const unsubscribe = messaging().onNotificationOpenedApp(onOpen);
  messaging()
    .getInitialNotification()
    .then(message => {
      if (message) onOpen(message);
    })
    .catch(() => {});
  return unsubscribe;
}
