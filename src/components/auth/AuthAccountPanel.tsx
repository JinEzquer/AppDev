// @ts-nocheck
import { Image, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, ROUTES, SPACING, getLogoSource } from '../../utils';
import { authStyles } from './authStyles';

const AuthAccountPanel = ({
  headline = 'Your account',
  subheadline,
  loginMessage,
  afterLogin,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={authStyles.screen}
      contentContainerStyle={[
        authStyles.scrollContent,
        { paddingTop: insets.top + SPACING.xl, flexGrow: 1, justifyContent: 'center' },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Image source={getLogoSource()} style={authStyles.logo} resizeMode="contain" />
      <Text style={authStyles.headline}>{headline}</Text>
      <Text style={authStyles.subheadline}>{subheadline}</Text>

      <TouchableOpacity
        style={authStyles.primaryBtn}
        onPress={() =>
          navigation.navigate(ROUTES.LOGIN, {
            message: loginMessage || 'Sign in to continue',
            afterLogin,
          })
        }
        activeOpacity={0.88}
      >
        <Text style={authStyles.primaryBtnText}>Sign in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.secondaryBtn}
        onPress={() => navigation.navigate(ROUTES.REGISTER)}
        activeOpacity={0.88}
      >
        <Text style={authStyles.secondaryBtnText}>Create an account</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={authStyles.secondaryBtn}
        onPress={() => navigation.navigate(ROUTES.HOME)}
        activeOpacity={0.88}
      >
        <Text style={authStyles.secondaryBtnText}>Continue browsing</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AuthAccountPanel;
