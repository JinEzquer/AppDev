// @ts-nocheck
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import CustomButton from '../components/CustomButton';
import { authSyncUser } from '../app/actions';
import CustomTextInput from '../components/CustomTextInput';
import { getCustomerProfile, updateCustomerProfile } from '../app/api/customer';
import { COLORS, SPACING } from '../utils';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { data: authData } = useSelector(state => state.auth);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await getCustomerProfile(authData.token);
        const profile = response?.data?.profile;
        if (mounted && profile) {
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setUsername(profile.username || '');
          setEmail(profile.email || '');
        }
      } catch (err) {
        Alert.alert('Error', err?.message || 'Could not load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [authData?.token]);

  const handleSave = async () => {
    if (!username.trim() || username.trim().length < 3) {
      Alert.alert('Invalid username', 'Username must be at least 3 characters.');
      return;
    }
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Name required', 'Enter your first and last name.');
      return;
    }
    setSaving(true);
    try {
      const response = await updateCustomerProfile(authData.token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
      });
      const updated = response?.data?.profile;
      if (updated) {
        dispatch(
          authSyncUser({
            firstName: updated.firstName,
            lastName: updated.lastName,
            username: updated.username,
            isVerified: updated.isVerified,
            verified: updated.isVerified,
          }),
        );
      }
      Alert.alert('Saved', 'Your profile was updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Update failed', err?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.hint}>Email cannot be changed here. Contact support if needed.</Text>
      <CustomTextInput label="Email" value={email} editable={false} />
      <CustomTextInput label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" />
      <CustomTextInput label="First name" value={firstName} onChangeText={setFirstName} />
      <CustomTextInput label="Last name" value={lastName} onChangeText={setLastName} />
      <CustomButton
        label={saving ? 'SAVING…' : 'SAVE CHANGES'}
        onPress={handleSave}
        disabled={saving}
        containerStyle={styles.saveBtn}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.lg, lineHeight: 20 },
  saveBtn: { marginTop: SPACING.lg },
});

export default EditProfileScreen;
