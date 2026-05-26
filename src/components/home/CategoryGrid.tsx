// @ts-nocheck
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW, SPACING } from '../../utils';

const CATEGORY_ICONS = {
  frozen: '❄️',
  meat: '🥩',
  cold: '🥓',
  deli: '🧀',
  dairy: '🥛',
  snack: '🍿',
  vegetable: '🥦',
  fruit: '🍎',
  default: '📦',
};

function iconForCategory(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('frozen')) return CATEGORY_ICONS.frozen;
  if (n.includes('meat') || n.includes('cut') || n.includes('beef') || n.includes('pork'))
    return CATEGORY_ICONS.meat;
  if (n.includes('cold') || n.includes('ham') || n.includes('sausage')) return CATEGORY_ICONS.cold;
  if (n.includes('deli') || n.includes('cheese')) return CATEGORY_ICONS.deli;
  if (n.includes('dairy')) return CATEGORY_ICONS.dairy;
  if (n.includes('snack')) return CATEGORY_ICONS.snack;
  if (n.includes('veg')) return CATEGORY_ICONS.vegetable;
  if (n.includes('fruit')) return CATEGORY_ICONS.fruit;
  return CATEGORY_ICONS.default;
}

function labelOf(cat) {
  if (!cat || cat === 'All') return '';
  if (typeof cat === 'string') return cat;
  return cat.name ?? '';
}

const CategoryGrid = ({ categories, activeCategory, onSelect }) => {
  const items = categories.map(labelOf).filter(Boolean).slice(0, 4);
  if (items.length === 0) return null;

  return (
    <View style={styles.grid}>
      {items.map(label => {
        const active = activeCategory === label;
        return (
          <TouchableOpacity
            key={label}
            style={[styles.cell, active && styles.cellActive]}
            onPress={() => onSelect(label)}
            activeOpacity={0.88}
          >
            <Text style={styles.emoji}>{iconForCategory(label)}</Text>
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={2}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const GAP = SPACING.md;
const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: GAP,
  },
  cell: {
    width: '47%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.soft,
  },
  cellActive: {
    borderColor: COLORS.gold,
    backgroundColor: COLORS.cream2,
  },
  emoji: { fontSize: 32, marginBottom: SPACING.sm },
  label: {
    fontFamily: FONT,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  labelActive: { color: COLORS.navy2, fontWeight: '700' },
});

export default CategoryGrid;
