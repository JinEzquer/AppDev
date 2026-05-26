// @ts-nocheck
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { COLORS, ROUTES, bottomNavContentPadding } from '../utils';
import HomeScreen from '../screens/HomeScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';

const Stack = createStackNavigator();

const TAB_ROUTES = [ROUTES.HOME, ROUTES.FAVORITES, ROUTES.CART, ROUTES.PROFILE];

const authScreenOptions = {
  headerStyle: { backgroundColor: COLORS.white, elevation: 0, shadowOpacity: 0 },
  headerTintColor: COLORS.navy2,
  headerTitleStyle: { fontWeight: '700', fontSize: 17, color: COLORS.text },
  headerBackTitleVisible: false,
};

const MainShell = ({ children }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const navPad = bottomNavContentPadding(insets.bottom);
  const routeName = useNavigationState(state => {
    const route = state?.routes?.[state.index];
    return route?.name;
  });
  const activeTab = TAB_ROUTES.includes(routeName) ? routeName : ROUTES.HOME;

  return (
    <View style={styles.shell}>
      <View style={[styles.content, { paddingBottom: navPad }]}>{children}</View>
      <BottomNav
        activeRoute={activeTab}
        onNavigate={target => {
          if (TAB_ROUTES.includes(target)) {
            navigation.navigate(target);
          }
        }}
      />
    </View>
  );
};

const MainNavigation = () => {
  const [initialTab] = useState(ROUTES.HOME);

  return (
    <Stack.Navigator initialRouteName={initialTab} screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.HOME}>
        {props => (
          <MainShell>
            <HomeScreen {...props} />
          </MainShell>
        )}
      </Stack.Screen>
      <Stack.Screen name={ROUTES.FAVORITES}>
        {props => (
          <MainShell>
            <FavoritesScreen {...props} />
          </MainShell>
        )}
      </Stack.Screen>
      <Stack.Screen name={ROUTES.CART}>
        {props => (
          <MainShell>
            <CartScreen {...props} />
          </MainShell>
        )}
      </Stack.Screen>
      <Stack.Screen name={ROUTES.PROFILE}>
        {props => (
          <MainShell>
            <ProfileScreen {...props} />
          </MainShell>
        )}
      </Stack.Screen>
      <Stack.Screen name={ROUTES.HISTORY}>
        {props => (
          <MainShell>
            <HistoryScreen {...props} />
          </MainShell>
        )}
      </Stack.Screen>
      <Stack.Screen
        name={ROUTES.CHECKOUT}
        component={CheckoutScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.PRODUCT_DETAIL}
        component={ProductDetailScreen}
        options={{ headerShown: true, ...authScreenOptions, title: 'Product' }}
      />
      <Stack.Screen
        name={ROUTES.ORDER_DETAIL}
        component={OrderDetailScreen}
        options={{ headerShown: true, ...authScreenOptions, title: 'Order details' }}
      />
      <Stack.Screen
        name={ROUTES.EDIT_PROFILE}
        component={EditProfileScreen}
        options={{ headerShown: true, ...authScreenOptions, title: 'Edit profile' }}
      />
      <Stack.Screen name={ROUTES.LOGIN} component={Login} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.REGISTER} component={Register} options={{ headerShown: false }} />
      <Stack.Screen
        name={ROUTES.VERIFY_EMAIL}
        component={VerifyEmailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
});

export default MainNavigation;
