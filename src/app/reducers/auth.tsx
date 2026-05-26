// @ts-nocheck
import {
  USER_LOGIN_REQUEST,
  USER_LOGIN_COMPLETE,
  USER_LOGIN_ERROR,
  RESET_USER_LOGIN,
  USER_AUTH_SYNC,
} from '../actions';

const INITIALSTATE = {
  data: null,
  isLoading: false,
  isError: false,
  error: null,
};

export default function reducer(state = INITIALSTATE, action) {
  switch (action.type) {
    case USER_LOGIN_REQUEST:
      return { ...state, data: null, isLoading: true, isError: false, error: null };
    case USER_LOGIN_COMPLETE:
      return {
        ...state,
        data: action.payload || null,
        isLoading: false,
        isError: false,
        error: null,
      };
    case USER_LOGIN_ERROR:
      return {
        ...state,
        data: null,
        isLoading: false,
        isError: true,
        error: action.error || 'Cannot Login',
      };
    case RESET_USER_LOGIN:
      return INITIALSTATE;
    case USER_AUTH_SYNC:
      if (!state.data?.token) return state;
      return {
        ...state,
        data: {
          ...state.data,
          user: {
            ...state.data.user,
            ...action.payload.user,
            verified:
              action.payload.user?.verified ??
              action.payload.user?.isVerified ??
              state.data.user?.verified,
            isVerified:
              action.payload.user?.isVerified ??
              action.payload.user?.verified ??
              state.data.user?.isVerified,
          },
        },
      };
    default:
      return state;
  }
}
