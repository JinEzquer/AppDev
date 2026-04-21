// @ts-nocheck
import { all } from 'redux-saga/effects';
import { userLogin } from './auth';

export default function* rootSaga() {
  yield all([userLogin()]);
}
