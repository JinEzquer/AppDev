import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import { ROUTES } from '../utils';

export const navigationRef = createNavigationContainerRef();

/** Open order detail when user taps a push notification. */
export function navigateToOrderFromNotification(orderId: string | number | undefined): void {
  if (orderId == null || orderId === '') {
    return;
  }

  const id = typeof orderId === 'number' ? orderId : parseInt(String(orderId), 10);
  if (!Number.isFinite(id) || id <= 0) {
    return;
  }

  const go = () => {
    if (!navigationRef.isReady()) {
      return false;
    }
    navigationRef.navigate(ROUTES.ORDER_DETAIL, { orderId: id });
    return true;
  };

  if (go()) {
    return;
  }

  setTimeout(() => go(), 100);
  setTimeout(() => go(), 400);
  setTimeout(() => go(), 1000);
}

export function resetToHome() {
  const reset = () => {
    if (!navigationRef.isReady()) {
      return false;
    }
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: ROUTES.HOME }],
      }),
    );
    return true;
  };

  if (reset()) {
    return;
  }

  setTimeout(() => reset(), 50);
  setTimeout(() => reset(), 200);
  setTimeout(() => reset(), 600);
}
