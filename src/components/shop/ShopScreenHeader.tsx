// @ts-nocheck
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPE } from '../../utils';

/** Centered title + back — cart / checkout style (reference UI). */
const ShopScreenHeader = ({ title, onBack }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + SPACING.sm }]}>
      <TouchableOpacity onPress={onBack} style={styles.back} hitSlop={12}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  back: { width: 40, alignItems: 'flex-start' },
  backIcon: { fontSize: 22, fontWeight: '700', color: COLORS.navy2 },
  title: { ...TYPE.sectionTitle },
});

export default ShopScreenHeader;
