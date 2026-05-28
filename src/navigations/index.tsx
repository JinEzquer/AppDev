// @ts-nocheck
import { DefaultTheme, NavigationContainer, getStateFromPath as defaultGetStateFromPath } from '@react-navigation/native';
import { RAILWAY_API_URL } from '../config/apiTarget';
import EmailVerifyLinkHandler from '../components/EmailVerifyLinkHandler';
import GoogleAuthLinkHandler from '../components/GoogleAuthLinkHandler';
import { logScreenView } from '../services/firebase';
import { COLORS } from '../utils';
import MainNav from './MainNav';
import { navigationRef } from './navigationRef';

/** Do not map google-auth deep links to a screen (handled by GoogleAuthLinkHandler). */
function getStateFromPath(path, options) {
  if (!path || path.startsWith('google-auth') || path.includes('google-auth')) {
    return undefined;
  }
  return defaultGetStateFromPath(path, options);
}

const linking = {
  prefixes: [
    'ezquerdev://',
    RAILWAY_API_URL,
    'http://127.0.0.1:8000',
    'http://10.0.2.2:8000',
    'http://localhost:8000',
  ],
  getStateFromPath,
};

const navTheme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.navy2,
    background: COLORS.cream,
    card: COLORS.navy2,
    text: COLORS.text,
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

/** Guests browse the shop; sign-in is only required to order or view account. */
export default () => (
  <GoogleAuthLinkHandler>
    <EmailVerifyLinkHandler>
      <NavigationContainer
        ref={navigationRef}
        theme={navTheme}
        linking={linking}
        onStateChange={() => {
          const route = navigationRef.getCurrentRoute();
          if (route?.name) {
            logScreenView(route.name);
          }
        }}
      >
        <MainNav />
      </NavigationContainer>
    </EmailVerifyLinkHandler>
  </GoogleAuthLinkHandler>
);
