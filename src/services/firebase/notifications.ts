import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform } from 'react-native';

export const NOTIFICATION_CHANNEL_ID = 'ezquerdev_default';

export async function ensureNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  await notifee.createChannel({
    id: NOTIFICATION_CHANNEL_ID,
    name: 'Orders & updates',
    description: 'Notifications from Patricks Cold Cuts',
    importance: AndroidImportance.HIGH,
  });
}

export async function displayLocalNotification(title: string, body: string): Promise<void> {
  await ensureNotificationChannel();

  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: NOTIFICATION_CHANNEL_ID,
      smallIcon: 'ic_notification',
      pressAction: { id: 'default' },
    },
  });
}
