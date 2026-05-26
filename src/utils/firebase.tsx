/**
 * Firebase is configured natively via android/app/google-services.json.
 * Import @react-native-firebase modules where needed (e.g. messaging, analytics).
 */
import firebase from '@react-native-firebase/app';

export function isFirebaseReady(): boolean {
  return firebase.apps.length > 0;
}
