import { USER_LOGIN_REQUEST, USER_LOGIN_COMPLETE, USER_LOGIN_ERROR, RESET_USER_LOGIN } from "../actions";

const INITIALSTATE = {
  data: null,
  isLoading: false,
  isError: false,
  error: null,
};

export default function reducer(state = INITIALSTATE, action) {
  switch (action.type) {
    case USER_LOGIN_REQUEST:
      return {
        ...state,
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      };

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

    default:
      return state;
  }
}

export const authLogin = payload => ({
  type: USER_LOGIN,
  payload,
});


export const authLogout = () => ({
  type: RESET_USER_LOGIN,
});