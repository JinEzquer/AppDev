import { Platform } from 'react-native';

// Android emulator must use 10.0.2.2 to reach host machine.
const DEFAULT_ANDROID_EMULATOR_MERCURE_URL = 'http://10.0.2.2:8000/.well-known/mercure';
const DEFAULT_LOCAL_MERCURE_URL = 'http://127.0.0.1:8000/.well-known/mercure';

export function getDefaultWebSocketUrl(): string {
  return Platform.OS === 'android' ? DEFAULT_ANDROID_EMULATOR_MERCURE_URL : DEFAULT_LOCAL_MERCURE_URL;
}

