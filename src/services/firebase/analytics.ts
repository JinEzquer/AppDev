import analytics from '@react-native-firebase/analytics';

export async function logScreenView(screenName: string): Promise<void> {
  if (!screenName) return;
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch {
    // Analytics is optional; never block navigation.
  }
}

export async function logAppEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): Promise<void> {
  if (!name) return;
  try {
    await analytics().logEvent(name, params);
  } catch {
    // ignore
  }
}

export async function setAnalyticsUserId(userId: string | null): Promise<void> {
  try {
    await analytics().setUserId(userId);
  } catch {
    // ignore
  }
}
