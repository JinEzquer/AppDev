// @ts-nocheck
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING } from '../../utils';

const AuthField = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  icon,
}) => {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.row}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {secureTextEntry ? (
        <TouchableOpacity onPress={() => setHidden(h => !h)} hitSlop={10}>
          <Text style={styles.eye}>{hidden ? 'Show' : 'Hide'}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cream,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    minHeight: 52,
    marginBottom: SPACING.md,
  },
  icon: { fontSize: 16, marginRight: SPACING.sm },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
  },
  eye: { fontSize: 12, fontWeight: '600', color: COLORS.navy2, paddingLeft: SPACING.sm },
});

export default AuthField;
