// @ts-nocheck
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import CustomButton from '../../components/CustomButton';
import CustomTextInput from '../../components/CustomTextInput';
import { IMG, ROUTES } from '../../utils';
import { authLogin } from '../../app/actions';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { isLoading, isError, error } = useSelector(state => state.auth);

  useEffect(() => {
    if (isError && error) Alert.alert('Cannot LogIn', error);
  }, [isError, error]);

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Invalid Credentials', 'Please enter valid username and password');
      return;
    }
    dispatch(authLogin({ username, password }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={IMG.LOGO} style={styles.logo} resizeMode="contain" />
      </View>
      <View style={styles.formContainer}>
        <CustomTextInput label="Username" placeholder="Enter Username" value={username} onChangeText={setUsername} />
        <CustomTextInput
          label="Password"
          placeholder="Enter Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="blue" style={styles.loader} />
      ) : (
        <CustomButton label="LOGIN" containerStyle={styles.loginButton} onPress={handleLogin} />
      )}
      <View style={styles.registerRow}>
        <Text>Create an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate(ROUTES.REGISTER)} disabled={isLoading}>
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  logoContainer: { marginBottom: 24 },
  logo: { width: 160, height: 160 },
  formContainer: { width: '100%', marginBottom: 16 },
  loginButton: { backgroundColor: 'blue', borderRadius: 10, marginVertical: 20, width: '80%' },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  registerText: { color: 'red', marginLeft: 10, fontWeight: 'bold' },
  loader: { marginVertical: 20 },
});

export default Login;
