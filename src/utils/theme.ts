/**
 * Patrick's Cold Cuts — web palette on a clean grocery-style mobile layout.
 */
import { Platform } from 'react-native';

export const COLORS = {
  navy: '#07103A',
  navy2: '#0D1E5A',
  red: '#C8173A',
  redDark: '#A01030',
  cream: '#F9F5EE',
  cream2: '#F2EBE0',
  gold: '#C9A84C',
  white: '#FFFFFF',
  text: '#1A2040',
  textMuted: '#6B7280',
  border: '#E8E4DC',
  chipBg: '#F2EBE0',
  success: '#0F6E56',
  successBg: '#E1F5EE',
  surface: '#FFFFFF',

  primary: '#0D1E5A',
  primaryDark: '#07103A',
  accent: '#C8173A',
  background: '#F9F5EE',
  backgroundWarm: '#F9F5EE',
};

export const FONT = Platform.select({
  ios: 'System',
  android: 'sans-serif',
  default: 'System',
});

export const SHADOW = {
  card: {
    shadowColor: '#07103A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const TYPE = {
  greeting: {
    fontFamily: FONT,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  greetingSub: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.textMuted,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy2,
  },
  productName: {
    fontFamily: FONT,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  productPrice: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  eyebrow: {
    fontFamily: FONT,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  brand: {
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  body: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
  },
  label: {
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  title: {
    fontFamily: FONT,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  button: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  navLabel: {
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: '600',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export function bottomNavContentPadding(bottomInset = 0): number {
  return 64 + Math.max(bottomInset, 8) + 16;
}
