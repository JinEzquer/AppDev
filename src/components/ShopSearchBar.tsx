// @ts-nocheck
import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW, SPACING, TYPE } from '../utils';

const SORT_OPTIONS = [
  { key: 'default', label: 'Recommended' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A–Z' },
];

const ShopSearchBar = ({ value, onChangeText, sortBy, onSortChange }) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <>
      <View style={styles.wrap}>
        <View style={styles.searchWrap}>
          <View style={styles.searchIcon}>
            <View style={styles.searchRing} />
            <View style={styles.searchHandle} />
          </View>
          <TextInput
            style={styles.input}
            placeholder="Search for products"
            placeholderTextColor={COLORS.textMuted}
            value={value}
            onChangeText={onChangeText}
          />
          <TouchableOpacity onPress={() => setFilterOpen(true)} hitSlop={8}>
            <Text style={styles.sortBtn}>Sort</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFilterOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>Sort products</Text>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.option, sortBy === opt.key && styles.optionActive]}
                onPress={() => {
                  onSortChange(opt.key);
                  setFilterOpen(false);
                }}
              >
                <Text style={[styles.optionText, sortBy === opt.key && styles.optionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    height: 52,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.soft,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRing: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.textMuted,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchHandle: {
    width: 2,
    height: 7,
    backgroundColor: COLORS.textMuted,
    position: 'absolute',
    bottom: 0,
    right: 1,
    transform: [{ rotate: '45deg' }],
    borderRadius: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: FONT, color: COLORS.text, paddingVertical: 0 },
  sortBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.navy2,
    paddingLeft: SPACING.sm,
    fontFamily: FONT,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(7,16,58,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  sheetTitle: { ...TYPE.sectionTitle, marginBottom: SPACING.lg },
  option: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.xs,
  },
  optionActive: { backgroundColor: COLORS.cream2 },
  optionText: { fontSize: 16, color: COLORS.text, fontFamily: FONT },
  optionTextActive: { fontWeight: '700', color: COLORS.navy2 },
});

export default ShopSearchBar;
