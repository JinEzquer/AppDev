import { CommonActions, createNavigationContainerRef } from '@react-navigation/native';
import { ROUTES } from '../utils';

export const navigationRef = createNavigationContainerRef();

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
