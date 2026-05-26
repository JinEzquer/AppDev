// @ts-nocheck
import { Text } from 'react-native';
import { authStyles } from './authStyles';

export function AuthHeadline({ text }) {
  const words = text.split(' ');
  return (
    <Text style={authStyles.headline}>
      {words.map((word, i) =>
        i === 0 ? (
          <Text key={i} style={authStyles.headlineGold}>
            {word}{' '}
          </Text>
        ) : (
          <Text key={i}>{word} </Text>
        ),
      )}
    </Text>
  );
}

export default AuthHeadline;
