// @ts-nocheck
import { StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW, SPACING, TYPE } from '../../utils';

export const shopUi = StyleSheet.create({
  screenBg: { flex: 1, backgroundColor: COLORS.background },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.card,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.soft,
  },
  sectionTitle: {
    ...TYPE.sectionTitle,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  pillBtn: {
    backgroundColor: COLORS.navy2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnText: {
    ...TYPE.button,
    color: COLORS.white,
    textTransform: 'none',
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs + 2,
  },
  summaryLabel: { fontSize: 14, color: COLORS.textMuted, fontFamily: FONT },
  summaryValue: { fontSize: 14, fontWeight: '600', color: COLORS.text, fontFamily: FONT },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: COLORS.text, fontFamily: FONT },
  totalValue: { fontSize: 18, fontWeight: '700', color: COLORS.red, fontFamily: FONT },
});
