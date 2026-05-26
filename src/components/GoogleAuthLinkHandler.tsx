// @ts-nocheck
import { useEffect, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import { useDispatch } from 'react-redux';
import { authLoginGoogleComplete } from '../app/actions';
import { resetToHome } from '../navigations/navigationRef';
import { parseGoogleAuthRedirect } from '../utils/googleOAuth';

/** Intercepts ezquerdev://google-auth before React Navigation treats it as a screen name. */
export default function GoogleAuthLinkHandler({ children }) {
  const dispatch = useDispatch();
  const handledRef = useRef(false);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url?.includes('google-auth') || handledRef.current) {
        return;
      }

      try {
        const result = parseGoogleAuthRedirect(url);
        if (!result?.token) {
          return;
        }

        handledRef.current = true;
        try {
          if (await InAppBrowser.isAvailable()) {
            await InAppBrowser.close();
          }
        } catch {
          // ignore
        }

        dispatch(
          authLoginGoogleComplete({
            token: result.token,
            user: result.user,
          }),
        );
        resetToHome();
      } catch (err) {
        const msg = err?.message || 'Google sign-in failed.';
        Alert.alert('Google sign-in failed', msg);
      }
    };

    Linking.getInitialURL().then(handleUrl).catch(() => {});

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [dispatch]);

  return children;
}
