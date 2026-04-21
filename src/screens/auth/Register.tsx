// @ts-nocheck
import { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import { COLORS, IMG, ROUTES, SPACING } from '../../utils';
import { authLogin } from '../../app/actions';
import { userRegister } from '../../app/api/auth';

const Register = () => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailAdd, setEmailAdd] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const canSubmit = useMemo(
    () =>
      username.trim().length >= 3 &&
      fullName.trim().length > 0 &&
      emailAdd.includes('@') &&
      password.length >= 6 &&
      password === confirmPassword &&
      !isSubmitting,
    [username, fullName, emailAdd, password, confirmPassword, isSubmitting],
  );

  const handleRegister = async () => {
    if (!canSubmit) return;
    const [firstName, ...rest] = fullName.trim().split(' ');
    const lastName = rest.join(' ');
    setIsSubmitting(true);
    try {
      const result = await userRegister({
        username: username.trim(),
        email: emailAdd.trim(),
        password,
        firstName: firstName || '',
        lastName: lastName || '',
      });
      if (result.success) {
        dispatch(authLogin({ username: emailAdd.trim(), password }));
        navigation.navigate(ROUTES.LOGIN);
      } else {
        Alert.alert('Registration Failed', result.error || 'Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.logoContainer}>
        <Image source={IMG.LOGO} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.formContainer}>
        <CustomTextInput label="Username" value={username} onChangeText={setUsername} />
        <CustomTextInput label="Full Name" value={fullName} onChangeText={setFullName} />
        <CustomTextInput label="Email Address" value={emailAdd} onChangeText={setEmailAdd} />
        <CustomTextInput label="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <CustomTextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>
      <CustomButton label={isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'} onPress={handleRegister} />
      <View style={styles.loginRow}>
        <Text>Already have an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.LOGIN)}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: { padding: SPACING.lg, backgroundColor: COLORS.background },
  logoContainer: { alignItems: 'center', marginBottom: SPACING.lg },
  logo: { width: 140, height: 140 },
  formContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.lg },
  loginText: { color: COLORS.accent, marginLeft: SPACING.sm, fontWeight: '700' },
});

export default Register;
