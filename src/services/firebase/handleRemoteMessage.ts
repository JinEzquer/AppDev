import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { displayLocalNotification } from './notifications';

/** Title/body from FCM notification block or data payload (backend sends both). */
export function getRemoteMessageContent(
  message: FirebaseMessagingTypes.RemoteMessage,
): { title: string; body: string } | null {
  const title =
    message.notification?.title ??
    (typeof message.data?.title === 'string' ? message.data.title : null) ??
    "Patrick's Cold Cuts";

  const body =
    message.notification?.body ??
    (typeof message.data?.body === 'string' ? message.data.body : null);

  if (!body) {
    return null;
  }

  return { title, body };
}

/** Shows order status alerts in the status bar (foreground + background handler). */
export async function showRemoteMessageNotification(
  message: FirebaseMessagingTypes.RemoteMessage,
): Promise<boolean> {
  const content = getRemoteMessageContent(message);
  if (!content) {
    return false;
  }

  await displayLocalNotification(content.title, content.body);
  return true;
}
