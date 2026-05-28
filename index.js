/**
 * @format
 */

import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { showRemoteMessageNotification } from './src/services/firebase/handleRemoteMessage';

// Show order approved/rejected alerts when app is in background.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  try {
    await showRemoteMessageNotification(remoteMessage);
  } catch (err) {
    console.warn('[FCM] Background notification failed', err);
  }
});

AppRegistry.registerComponent(appName, () => App);
