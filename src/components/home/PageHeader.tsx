// @ts-nocheck
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPE } from '../../utils';

const PageHeader = ({ title, subtitle }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + SPACING.md }]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: { ...TYPE.greeting },
  sub: { ...TYPE.greetingSub },
});

export default PageHeader;
