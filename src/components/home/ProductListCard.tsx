// @ts-nocheck
import { useRef } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW, SPACING, TYPE, resolveAssetUrl } from '../../utils';
import { formatPeso, resolveProductOrder } from '../../utils/productOrder';

const ProductListCard = ({
  product,
  width = 168,
  isFavorite,
  onToggleFavorite,
  onPress,
  onAdd,
  variant = 'horizontal',
}) => {
  const imageUri = resolveAssetUrl(product.image);
  const order = resolveProductOrder(product);
  const unitShort = order.priceLabel?.replace(/^Price per /i, '') || order.unitShort || 'each';
  const isGrid = variant === 'grid';
  const addRef = useRef(null);

  const handleAddPress = () => {
    const node = addRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, w, h) => {
        onAdd?.({ x: x + w / 2, y: y + h / 2 });
      });
    } else {
      onAdd?.();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: isGrid ? width : width }, isGrid && styles.cardGrid]}
      activeOpacity={0.92}
      onPress={onPress}
    >
      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Text style={styles.phEmoji}>❄️</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.heartBtn}
          onPress={() => onToggleFavorite?.()}
          hitSlop={10}
        >
          <Text style={[styles.heart, isFavorite && styles.heartOn]}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.priceLine}>
          {formatPeso(product.price)} <Text style={styles.unit}>/{unitShort}</Text>
        </Text>
        <View ref={addRef} collapsable={false}>
          <TouchableOpacity style={styles.addBtn} onPress={handleAddPress} activeOpacity={0.9}>
          <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    marginRight: SPACING.md,
    ...SHADOW.card,
  },
  cardGrid: { marginRight: 0 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 110 },
  placeholder: {
    backgroundColor: COLORS.cream2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phEmoji: { fontSize: 30 },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.soft,
  },
  heart: { fontSize: 14 },
  heartOn: {},
  body: { padding: SPACING.md },
  name: { ...TYPE.productName, fontSize: 14, marginBottom: 4, minHeight: 36 },
  priceLine: { ...TYPE.productPrice, marginBottom: SPACING.sm },
  unit: { fontWeight: '500', fontSize: 12 },
  addBtn: {
    backgroundColor: COLORS.navy2,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  addText: {
    fontFamily: FONT,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});

export default ProductListCard;
