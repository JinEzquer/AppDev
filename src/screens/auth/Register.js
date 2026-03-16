import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import { COLORS, IMG, ROUTES, SPACING } from '../../utils';
import { useAuth } from './AuthContext';
import { userRegister } from '../../app/api/auth';

const isValidEmail = (value) => {
  const email = value.trim();
  // pragmatic email validation for client-side UX
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Register = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailAdd, setEmailAdd] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigation = useNavigation();
  const { login } = useAuth();

  const canSubmit = useMemo(() => {
    return (
      username.trim().length >= 3 &&
      fullName.trim().length > 0 &&
      isValidEmail(emailAdd) &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      !isSubmitting
    );
  }, [username, confirmPassword, emailAdd, fullName, isSubmitting, password]);

  const handleRegister = async () => {
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    const email = emailAdd.trim();

    if (!username.trim() || username.trim().length < 3) {
      Alert.alert('Invalid username', 'Username must be at least 3 characters long.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Missing info', 'Please enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);

      const result = await userRegister({
        username: username.trim(),
        email,
        password,
        firstName,
        lastName,
        phoneNumber: ''
      });

      if (result.success) {
        // Auto-login after successful registration
        const loginResult = await login(email, password);
        if (!loginResult.success) {
          Alert.alert('Registration successful', 'Account created! Please login with your credentials.');
          navigation.navigate(ROUTES.LOGIN);
        }
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again.');
      }
    } catch (e) {
      Alert.alert('Registration failed', e.message || 'Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Image source={IMG.LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Use a real email address so you can log in later.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <CustomTextInput
            label={'Username'}
            placeholder={'Enter Username'}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <CustomTextInput
            label={'Full Name'}
            placeholder={'Enter Full Name'}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <CustomTextInput
            label={'Email Address'}
            placeholder={'Enter Email Address'}
            value={emailAdd}
            onChangeText={setEmailAdd}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <CustomTextInput
            label={'Password'}
            placeholder={'Enter Password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="next"
          />
          <CustomTextInput
            label={'Confirm Password'}
            placeholder={'Re-enter Password'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        <CustomButton
          label={isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          containerStyle={[styles.registerButton, !canSubmit && styles.disabled]}
          textStyle={styles.registerButtonText}
          onPress={handleRegister}
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  registerButton: {
    marginTop: SPACING.sm,
  },
  disabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
  },
  loginPrompt: {
    color: COLORS.text,
  },
  loginText: {
    color: COLORS.accent,
    marginLeft: SPACING.sm,
    fontWeight: '700',
  },
});

export default Register;