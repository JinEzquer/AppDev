import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigation from './MainNav';

const AppNav = () => {
  return (
    <NavigationContainer>
      <MainNavigation />
    </NavigationContainer>
  );
};

export default AppNav;
