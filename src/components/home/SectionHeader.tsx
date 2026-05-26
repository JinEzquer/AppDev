// @ts-nocheck
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, SPACING, TYPE } from '../../utils';

const SectionHeader = ({ title, actionLabel, onAction }) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {actionLabel && onAction ? (
      <TouchableOpacity onPress={onAction} hitSlop={8}>
        <Text style={styles.action}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  title: { ...TYPE.sectionTitle },
  action: { ...TYPE.sectionLink },
});

export default SectionHeader;
