import type { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { navigateToOrderFromNotification } from '../../navigations/navigationRef';

export function handleNotificationNavigation(
  message: FirebaseMessagingTypes.RemoteMessage | null | undefined,
): void {
  if (!message) {
    return;
  }

  const orderId = message.data?.orderId;
  if (orderId != null && String(orderId).trim() !== '') {
    navigateToOrderFromNotification(orderId);
  }
}
