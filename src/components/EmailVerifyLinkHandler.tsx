// @ts-nocheck
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { authLoginEmailVerifyComplete } from '../app/actions';
import { resetToHome } from '../navigations/navigationRef';
import { extractLoginFromUrl, subscribeToEmailVerifyLinks } from '../utils/emailVerifyDeepLink';

/** Gmail opens the app with ezquerdev://verify-email?jwt=… or ?token=… */
export default function EmailVerifyLinkHandler({ children }) {
  const dispatch = useDispatch();
  const doneRef = useRef(false);

  useEffect(() => {
    const handleUrl = async url => {
      if (doneRef.current) return;
      try {
        const result = await extractLoginFromUrl(url);
        if (!result?.token) return;
        doneRef.current = true;
        dispatch(
          authLoginEmailVerifyComplete({
            token: result.token,
            user: { ...result.user, verified: true, isVerified: true },
          }),
        );
        resetToHome();
      } catch {
        // VerifyEmailScreen finishAndEnterShop handles fallback.
      }
    };

    return subscribeToEmailVerifyLinks(handleUrl);
  }, [dispatch]);

  return children;
}
