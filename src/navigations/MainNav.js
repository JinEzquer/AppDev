import { createStackNavigator } from '@react-navigation/stack';
import { COLORS, ROUTES } from '../utils';

// screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: {
    backgroundColor: COLORS.primary,
  },
  headerTintColor: COLORS.white,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 18,
  },
};

const MainNavigation = () => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.HOME} screenOptions={screenOptions}>
      <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigation;