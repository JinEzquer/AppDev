import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

import AppNav from './src/navigations';

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <AppNav />
      </View>
    </GestureHandlerRootView>
  );
};

export default App;