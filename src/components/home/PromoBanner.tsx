// @ts-nocheck
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW, SPACING, getLogoSource } from '../../utils';

const PromoBanner = ({ onPress }) => (
  <TouchableOpacity style={styles.wrap} activeOpacity={0.92} onPress={onPress}>
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.title}>Premium cold cuts</Text>
        <Text style={styles.sub}>Crafted with precision — delivered fresh to your door</Text>
        <View style={styles.cta}>
          <Text style={styles.ctaText}>Shop now ›</Text>
        </View>
      </View>
      <View style={styles.right}>
        <Image source={getLogoSource()} style={styles.heroImg} resizeMode="contain" />
      </View>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    borderRadius: RADIUS.xl,
    ...SHADOW.card,
  },
  card: {
    flexDirection: 'row',
    minHeight: 140,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    backgroundColor: COLORS.navy,
  },
  left: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
  },
  title: {
    fontFamily: FONT,
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  sub: {
    fontFamily: FONT,
    fontSize: 12,
    color: 'rgba(249,245,238,0.85)',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  ctaText: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy,
  },
  right: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(201,168,76,0.18)',
  },
  heroImg: { width: 72, height: 72 },
});

export default PromoBanner;
