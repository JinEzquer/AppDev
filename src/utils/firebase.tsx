/**
 * Firebase helpers (Analytics + Cloud Messaging).
 * Native config: android/app/google-services.json
 */
export {
  getStoredFcmToken,
  listenForForegroundMessages,
  listenForNotificationOpen,
  listenForTokenRefresh,
  logAppEvent,
  logScreenView,
  registerForPushNotifications,
  requestNotificationPermission,
  setAnalyticsUserId,
} from '../services/firebase';

import firebase from '@react-native-firebase/app';

export function isFirebaseReady(): boolean {
  return firebase.apps.length > 0;
}
