import { registerDeviceFcmToken } from '../../app/api/customer';
import { getStoredFcmToken, registerForPushNotifications } from './messaging';

/** Sends the device FCM token to Symfony when the user is logged in. */
export async function syncFcmTokenToBackend(authToken: string | null | undefined): Promise<void> {
  if (!authToken) {
    return;
  }

  try {
    let fcmToken = await getStoredFcmToken();
    if (!fcmToken) {
      fcmToken = await registerForPushNotifications();
    }
    if (!fcmToken) {
      return;
    }

    await registerDeviceFcmToken(authToken, fcmToken);
    console.warn('[FCM] Device token saved on server (push notifications enabled for this account).');
  } catch (err) {
    console.warn('[FCM] Failed to sync token to backend', err);
  }
}
