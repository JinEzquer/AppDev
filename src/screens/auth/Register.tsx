// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthField from '../../components/auth/AuthField';
import AuthScreenLayout from '../../components/auth/AuthScreenLayout';
import { useDispatch } from 'react-redux';
import { ROUTES, signInWithGoogle } from '../../utils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userRegister } from '../../app/api/auth';
import { authLoginGoogleComplete } from '../../app/actions';

function getValidationMessage({ username, fullName, emailAdd, password, confirmPassword }) {
  const issues = [];
  if (username.trim().length < 3) {
    issues.push('Username: at least 3 characters');
  }
  if (!fullName.trim()) {
    issues.push('Full name is required');
  }
  if (!emailAdd.includes('@') || !emailAdd.includes('.')) {
    issues.push('Enter a valid email address');
  }
  if (password.length < 8) {
    issues.push('Password: at least 8 characters');
  } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    issues.push('Password: include a letter and a number');
  }
  if (password !== confirmPassword) {
    issues.push('Passwords must match');
  }
  return issues;
}

const Register = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailAdd, setEmailAdd] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { data: authData } = useSelector(state => state.auth);

  useEffect(() => {
    if (authData?.token) {
      navigation.navigate(ROUTES.HOME);
    }
  }, [authData?.token, navigation]);

  const validationIssues = useMemo(
    () => getValidationMessage({ username, fullName, emailAdd, password, confirmPassword }),
    [username, fullName, emailAdd, password, confirmPassword],
  );
  const canSubmit = validationIssues.length === 0 && !isSubmitting && !googleLoading;

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      dispatch(authLoginGoogleComplete({ token: result.token, user: result.user }));
    } catch (err) {
      Alert.alert('Google sign-in failed', err?.message || 'Use email registration below.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!canSubmit) {
      Alert.alert('Complete the form', validationIssues.join('\n'));
      return;
    }

    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ') || 'Customer';
    setIsSubmitting(true);
    try {
      const result = await userRegister({
        username: username.trim(),
        email: emailAdd.trim().toLowerCase(),
        password,
        firstName: firstName || username.trim(),
        lastName,
      });
      if (result.success) {
        const regEmail = emailAdd.trim().toLowerCase();
        if (result.verificationToken) {
          await AsyncStorage.setItem('@patrick_pending_verify_token', result.verificationToken);
        }
        await AsyncStorage.setItem('@patrick_pending_verify_email', regEmail);
        navigation.navigate(ROUTES.VERIFY_EMAIL, {
          email: regEmail,
          justRegistered: true,
          verificationEmailSent: result.verificationEmailSent,
          verificationToken: result.verificationToken,
        });
      } else if (result.code === 'EMAIL_PENDING_VERIFICATION') {
        const regEmail = (result.email || emailAdd).trim().toLowerCase();
        await AsyncStorage.setItem('@patrick_pending_verify_email', regEmail);
        navigation.navigate(ROUTES.VERIFY_EMAIL, {
          email: regEmail,
          justRegistered: false,
          verificationEmailSent: false,
        });
        Alert.alert(
          'Already registered',
          'This email exists but is not verified. Tap Resend on the next screen.',
        );
      } else {
        Alert.alert('Registration failed', result.error || 'Could not create account.');
      }
    } catch (err) {
      Alert.alert('Connection error', err?.message || 'Cannot reach the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      headline="Create Account"
      subheadline="Let's start your journey"
      primaryLabel="Continue"
      onPrimaryPress={handleRegister}
      primaryLoading={isSubmitting}
      primaryDisabled={!canSubmit}
      socialDivider="or signup with"
      footerText="Already have an account?"
      footerLinkLabel="Log in"
      onFooterPress={() => navigation.navigate(ROUTES.LOGIN)}
      onBack={() => navigation.goBack()}
      onGooglePress={handleGoogleSignUp}
      googleLoading={googleLoading}
    >
      <AuthField
        icon="👤"
        placeholder="Full name"
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />
      <AuthField
        icon="◎"
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
      />
      <AuthField
        icon="✉"
        placeholder="Email"
        value={emailAdd}
        onChangeText={setEmailAdd}
        keyboardType="email-address"
      />
      <AuthField
        icon="🔒"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <AuthField
        icon="🔒"
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
    </AuthScreenLayout>
  );
};

export default Register;
