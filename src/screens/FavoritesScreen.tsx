// @ts-nocheck
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import PageHeader from '../components/home/PageHeader';
import ProductListCard from '../components/home/ProductListCard';
import { useCartFly } from '../context/CartFlyContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { COLORS, ROUTES, SPACING } from '../utils';
import { resolveProductOrder } from '../utils/productOrder';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - SPACING.lg * 2 - SPACING.md) / 2;

const FavoritesScreen = () => {
  const navigation = useNavigation();
  const { ids, toggleFavorite, isFavorite } = useFavorites();
  const { addLine } = useCart();
  const { flyToCart } = useCartFly();
  const catalog = useProductCatalog();

  const favorites = useMemo(
    () => catalog.products.filter(p => ids.includes(Number(p.id))),
    [catalog.products, ids],
  );

  const handleQuickAdd = useCallback(
    (product, origin) => {
      const order = resolveProductOrder(product);
      const unit = order.unitOptions?.[0]?.key ?? order.unit ?? 'pcs';
      addLine(product, order.min ?? 1, unit);
      flyToCart(origin ?? { x: SCREEN_W / 2, y: 400 });
    },
    [addLine, flyToCart],
  );

  const renderProduct = useCallback(
    ({ item }) => (
      <ProductListCard
        product={item}
        width={CARD_W}
        variant="grid"
        isFavorite={isFavorite(item.id)}
        onToggleFavorite={() => toggleFavorite(item.id)}
        onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: item.id })}
        onAdd={origin => handleQuickAdd(item, origin)}
      />
    ),
    [navigation, isFavorite, toggleFavorite, handleQuickAdd],
  );

  if (catalog.loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.navy2} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={item => String(item.id)}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <PageHeader
            title="Saved items"
            subtitle={`${favorites.length} saved item${favorites.length === 1 ? '' : 's'} — tap Saved again to remove`}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={catalog.refreshing}
            onRefresh={() => catalog.loadProducts(true)}
            tintColor={COLORS.navy2}
          />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No saved items yet. Tap the heart on any product in the shop.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  row: { justifyContent: 'space-between', marginBottom: SPACING.md },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: SPACING.xl, paddingHorizontal: SPACING.xl },
});

export default FavoritesScreen;
