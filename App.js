import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

import { AuthProvider } from './src/screens/auth/AuthContext';
import AppNav from './src/navigations';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <View style={{ flex: 1 }}>
          <AppNav />
        </View>
      </AuthProvider>
    </GestureHandlerRootView>
  );
};

export default App;