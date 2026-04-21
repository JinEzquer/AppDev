// @ts-nocheck
import { applyMiddleware, combineReducers, createStore } from 'redux';
import createSagaMiddleware from 'redux-saga';
import auth from './auth';

const sagaMiddleware = createSagaMiddleware();

const rootReducer = combineReducers({
  auth,
});

export default () => {
  const store = createStore(rootReducer, applyMiddleware(sagaMiddleware));
  const runSaga = sagaMiddleware.run;
  return { store, runSaga };
};
