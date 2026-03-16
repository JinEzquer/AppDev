import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';
import { Provider } from 'react-redux';

import { AuthProvider } from './src/screens/auth/AuthContext';
import AppNav from './src/navigations';
import configureStore from './src/app/reducers';
import rootSaga from './src/app/sagas';

const store = configureStore();
store.runSaga(rootSaga);

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store.store}>
          <AuthProvider>
            <View style={{ flex: 1 }}>
              <AppNav />
            </View>
          </AuthProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;