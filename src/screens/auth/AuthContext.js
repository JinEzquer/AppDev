import React, { createContext, useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userLogin as userLoginApi, getProfile } from '../../app/api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const login = async (username, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // send username to API (previously used `email`)
      const data = await userLoginApi({ username, password });
      console.log('AuthContext - API returned data:', data);

      // Accept responses that either include an explicit success flag
      // or return a token (common backend pattern).
      const loginSucceeded = Boolean(
        data && (data.success === true || data.token || data.access)
      );

      if (loginSucceeded) {
        // persist token if present
        const token = data.token || data.access || null;
        if (token) {
          try {
            await AsyncStorage.setItem('authToken', token);
            console.log('AuthContext - token persisted');
          } catch (e) {
            console.warn('AuthContext - failed to persist token', e);
          }
        }

        // if API returned user, use it; otherwise attempt to fetch profile
        let userInfo = data.user || null;
        if (!userInfo && token) {
          try {
            const profile = await getProfile(token);
            userInfo = profile || null;
          } catch (e) {
            console.warn('AuthContext - failed to fetch profile', e);
          }
        }

        console.log('AuthContext - Setting user:', userInfo);
        setIsLoggedIn(true);
        setUser(userInfo);
        setError(null);
        return { success: true, data };
      } else {
        const message = data?.message || data?.detail || 'Login failed';
        console.log('AuthContext - Login failed:', message);
        setError(message);
        return { success: false, error: message };
      }
    } catch (err) {
      const errorMessage = err?.message || 'Invalid credentials. Please check your username and password.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      console.log('AuthContext - token removed');
    } catch (e) {
      console.warn('AuthContext - failed to remove token', e);
    }
    setIsLoggedIn(false);
    setUser(null);
    setError(null);
    console.log('AuthContext - logged out');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, user, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
