// @ts-nocheck
import { Alert } from 'react-native';
import { ROUTES } from './routes';

/**
 * Customers who registered with email/password must verify email before placing orders.
 * Google sign-in users are verified on the server automatically.
 */
export function isCustomerVerified(authData) {
  if (!authData?.token) return false;
  const u = authData.user;
  if (u?.verified === false || u?.isVerified === false) return false;
  if (u?.verified === true || u?.isVerified === true) return true;
  // Login API only succeeds for verified accounts; omitting the flag used to block checkout.
  return true;
}

export function promptEmailVerification(navigation, email, reason = 'place orders') {
  Alert.alert(
    'Verify your email first',
    `Check Gmail for the verification link from Patrick's Cold Cuts. After you tap the link, sign in again to ${reason}.`,
    [
      {
        text: 'Resend email',
        onPress: () =>
          navigation.navigate(ROUTES.VERIFY_EMAIL, {
            email: email || '',
          }),
      },
      { text: 'OK' },
    ],
  );
}

export function requireVerifiedCustomer(navigation, authData, reason) {
  if (!authData?.token) {
    navigation.navigate(ROUTES.LOGIN, {
      message: 'Sign in to continue',
    });
    return false;
  }
  if (!isCustomerVerified(authData)) {
    promptEmailVerification(navigation, authData.user?.email, reason);
    return false;
  }
  return true;
}
