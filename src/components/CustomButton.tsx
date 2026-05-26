// @ts-nocheck
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING } from '../utils';

const CustomButton = ({ label, onPress, variant = 'primary', containerStyle, textStyle, disabled = false }) => {
  const isPrimary = variant === 'primary';
  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          isPrimary ? styles.primary : styles.secondary,
          disabled && styles.disabled,
        ]}
        activeOpacity={0.8}
      >
        <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText, textStyle]}>
          {label}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  primary: { backgroundColor: COLORS.navy2 },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.navy2,
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontWeight: '600' },
  primaryText: { color: COLORS.white },
  secondaryText: { color: COLORS.navy2 },
});

export default CustomButton;
