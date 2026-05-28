import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import configureStore from './src/app/reducers';
import rootSaga from './src/app/sagas';
import RootNavigation from './src/navigations';
import FirebaseBootstrap from './src/components/FirebaseBootstrap';
import SessionExpiredHandler from './src/components/SessionExpiredHandler';
import { CartProvider } from './src/context/CartContext';
import { CartFlyProvider } from './src/context/CartFlyContext';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { COLORS, SPACING, getApiBaseUrl, initApiBaseUrl, isUsingRailwayApi } from './src/utils';

const { store, persistor, runSaga } = configureStore();
runSaga(rootSaga);

const App = () => {
  const [apiError, setApiError] = useState(null);

  const connectToServer = useCallback(async () => {
    setApiError(null);
    try {
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Server check timed out. Tap Try again.')), 12000),
      );
      await Promise.race([initApiBaseUrl(), timeout]);
    } catch (err) {
      setApiError(err?.message || 'Cannot reach server');
    }
  }, []);

  useEffect(() => {
    connectToServer();
  }, [connectToServer]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <Provider store={store}>
          <PersistGate
            loading={
              <View style={styles.boot}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.bootText}>Loading…</Text>
              </View>
            }
            persistor={persistor}
          >
            <CartProvider>
              <CartFlyProvider>
                <FavoritesProvider>
                  {!apiError && isUsingRailwayApi() ? (
                    <View style={styles.apiBannerOk}>
                      <Text style={styles.apiBannerOkText} numberOfLines={2}>
                        Connected to Railway — {getApiBaseUrl().replace(/^https?:\/\//, '')}
                      </Text>
                    </View>
                  ) : null}
                  {apiError ? (
                    <View style={styles.apiBanner}>
                      <Text style={styles.apiBannerText} numberOfLines={3}>
                        {apiError}
                      </Text>
                      <TouchableOpacity onPress={connectToServer}>
                        <Text style={styles.apiBannerRetry}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                  <View style={styles.appShell}>
                    <SessionExpiredHandler />
                    <FirebaseBootstrap>
                      <RootNavigation />
                    </FirebaseBootstrap>
                  </View>
                </FavoritesProvider>
              </CartFlyProvider>
            </CartProvider>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.backgroundWarm },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.backgroundWarm,
  },
  bootTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.sm },
  bootText: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 21 },
  note: {
    marginTop: SPACING.lg,
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  connectedHint: {
    marginTop: SPACING.md,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
  },
  retryText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
  appShell: { flex: 1, backgroundColor: COLORS.backgroundWarm },
  apiBanner: {
    backgroundColor: COLORS.cream2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  apiBannerText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 16 },
  apiBannerRetry: { fontSize: 12, fontWeight: '700', color: COLORS.navy2, marginTop: 4 },
  apiBannerOk: {
    backgroundColor: COLORS.successBg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  apiBannerOkText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
});

export default App;
