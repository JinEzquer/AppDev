import { Platform } from 'react-native';

// Android emulator must use 10.0.2.2 to reach host machine.
const DEFAULT_ANDROID_EMULATOR_WS_URL = 'ws://10.0.2.2:8080';
const DEFAULT_LOCAL_WS_URL = 'ws://127.0.0.1:8080';

export function getDefaultWebSocketUrl(): string {
  return Platform.OS === 'android' ? DEFAULT_ANDROID_EMULATOR_WS_URL : DEFAULT_LOCAL_WS_URL;
}

