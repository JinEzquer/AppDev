import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authLogout } from '../app/actions';
import { setSessionExpiredHandler } from '../app/api/client';
import { navigationRef } from '../navigations/navigationRef';
import { ROUTES } from '../utils';

/** Logs out and opens sign-in when any API call returns 401 (expired JWT). */
export default function SessionExpiredHandler() {
  const dispatch = useDispatch();

  useEffect(() => {
    setSessionExpiredHandler(() => {
      dispatch(authLogout());
      const go = () => {
        if (!navigationRef.isReady()) {
          return false;
        }
        navigationRef.navigate(ROUTES.LOGIN, {
          message: 'Your session expired. Please sign in again.',
        });
        return true;
      };
      if (!go()) {
        setTimeout(go, 200);
      }
    });

    return () => setSessionExpiredHandler(null);
  }, [dispatch]);

  return null;
}
