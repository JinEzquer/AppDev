// @ts-nocheck
import { takeLatest, call, put, fork, select } from 'redux-saga/effects';
import { clearDeviceFcmToken } from '../api/customer';
import {
  USER_LOGIN,
  USER_LOGIN_REQUEST,
  USER_LOGIN_COMPLETE,
  USER_LOGIN_ERROR,
  RESET_USER_LOGIN,
} from '../actions';
import { userLogin as userLoginApi } from '../api/auth';
import { syncFcmTokenToBackend } from '../../services/firebase/syncFcmToken';

export function* userLoginAsync(action) {
  try {
    yield put({ type: USER_LOGIN_REQUEST });
    const data = yield call(userLoginApi, action.payload);
    yield put({ type: USER_LOGIN_COMPLETE, payload: data });
    if (data?.token) {
      yield call(syncFcmTokenToBackend, data.token);
    }
  } catch (error) {
    yield put({ type: USER_LOGIN_ERROR, error: error?.message || 'Login failed' });
  }
}

export function* userLogoutAsync() {
  try {
    const jwt = yield select((state: { auth?: { token?: string } }) => state.auth?.token);
    if (jwt) {
      yield call(clearDeviceFcmToken, jwt);
    }
  } catch {
    // Best-effort: logout still proceeds if the API is unreachable.
  }
}

export function* watchLogin() {
  yield takeLatest(USER_LOGIN, userLoginAsync);
}

export function* watchLogout() {
  yield takeLatest(RESET_USER_LOGIN, userLogoutAsync);
}

export function* userLogin() {
  yield fork(watchLogin);
  yield fork(watchLogout);
}
