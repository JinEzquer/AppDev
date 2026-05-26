// @ts-nocheck
import AuthAccountPanel from './auth/AuthAccountPanel';

const GuestPrompt = ({ title, message, loginMessage, afterLogin }) => (
  <AuthAccountPanel
    headline={title || 'Sign in required'}
    subheadline={message}
    loginMessage={loginMessage}
    afterLogin={afterLogin}
  />
);

export default GuestPrompt;
