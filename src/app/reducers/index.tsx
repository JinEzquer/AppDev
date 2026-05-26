// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { persistReducer, persistStore } from 'redux-persist';
import createSagaMiddleware from 'redux-saga';
import auth from './auth';

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  auth,
});

const persistConfig = {
  key: 'patrick-app',
  storage: AsyncStorage,
  whitelist: ['auth'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default () => {
  const store = createStore(persistedReducer, applyMiddleware(sagaMiddleware));
  const persistor = persistStore(store);
  const runSaga = sagaMiddleware.run;
  return { store, persistor, runSaga };
};
