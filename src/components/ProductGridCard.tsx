// @ts-nocheck
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SPACING, TYPE, resolveAssetUrl } from '../utils';
import { formatPeso, resolveProductOrder } from '../utils/productOrder';

function ratingForProduct(id) {
  const n = Number(id) % 5;
  return 3.5 + n * 0.3;
}

function Stars({ rating }) {
  const full = Math.round(rating);
  return (
    <Text style={styles.stars}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={i <= full ? styles.starOn : styles.starOff}>
          ★
        </Text>
      ))}
    </Text>
  );
}

const ProductGridCard = ({
  product,
  isFavorite,
  onToggleFavorite,
  onPress,
  onAdd,
  width,
}) => {
  const imageUri = resolveAssetUrl(product.image);
  const order = resolveProductOrder(product);
  const unitShort = order.priceLabel?.replace(/^Price per /i, '') || order.unitShort || 'each';
  const rating = ratingForProduct(product.id);

  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : null]}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.placeholderText}>PCC</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={e => {
            e?.stopPropagation?.();
            onToggleFavorite?.();
          }}
          hitSlop={12}
        >
          <Text style={[styles.heart, isFavorite && styles.heartOn]}>{isFavorite ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {product.category?.name || 'Product'}
        </Text>
        <Stars rating={rating} />
        <View style={styles.footer}>
          <View>
            <Text style={styles.price}>{formatPeso(product.price)}</Text>
            <Text style={styles.unit}>/{unitShort}</Text>
          </View>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={e => {
              e?.stopPropagation?.();
              onAdd?.();
            }}
            hitSlop={8}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const CARD_WIDTH_HINT = '47%';

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH_HINT,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 88 },
  placeholder: {
    backgroundColor: COLORS.cream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontWeight: '800', color: COLORS.textMuted },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.cream2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  heart: { fontSize: 18, color: COLORS.textMuted },
  heartOn: { color: COLORS.accent },
  body: { padding: SPACING.md, paddingTop: SPACING.sm },
  name: { ...TYPE.label, fontSize: 14, fontWeight: '700', color: COLORS.text },
  category: { fontFamily: FONT, fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: '500' },
  stars: { flexDirection: 'row', marginTop: 6 },
  starOn: { color: COLORS.gold, fontSize: 12 },
  starOff: { color: COLORS.border, fontSize: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  price: { fontFamily: FONT, fontSize: 16, fontWeight: '700', color: COLORS.text },
  unit: { fontSize: 11, color: COLORS.textMuted, fontWeight: '600' },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { color: COLORS.white, fontSize: 22, fontWeight: '700', marginTop: -2 },
});

export default ProductGridCard;
