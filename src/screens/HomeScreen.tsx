// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import PromoVideoBanner from '../components/home/PromoVideoBanner';
import ShopSearchBar from '../components/ShopSearchBar';
import { useCartFly } from '../context/CartFlyContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useProductCatalog } from '../hooks/useProductCatalog';
import { websocketClient } from '../services/websocket/client';
import { COLORS, ROUTES, SPACING, resolveAssetUrl } from '../utils';
import { resolveProductOrder } from '../utils/productOrder';

function categoryLabel(cat) {
  if (!cat) return '';
  if (typeof cat === 'string') return cat;
  return cat.name ?? '';
}

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - SPACING.lg * 2 - SPACING.md) / 2;
const H_CARD_W = 152;

// ─── Brand tokens (Patrick's Cold Cuts palette) ───────────────────────────────
const BRAND = {
  navy:    '#07103A',
  navy2:   '#0D1E5A',
  red:     '#C8173A',
  redDark: '#a01030',
  cream:   '#F9F5EE',
  cream2:  '#F2EBE0',
  gold:    '#C9A84C',
  goldL:   '#E8D08A',
  muted:   '#4A5070',
  white:   '#ffffff',
  navyBg:  'rgba(7,16,58,0.06)',
};

const EMOJI_MAP = {
  seafood: '🦐',
  meats: '🥩',
  'meats-&-poultry': '🥩',
  poultry: '🍗',
  'ice-cream': '🍦',
  'ready-meals': '🍱',
  vegetables: '🥦',
  dairy: '🧀',
  snacks: '🍿',
  platters: '🍽️',
  frozen: '❄️',
  deli: '🥓',
  fruit: '🍎',
  default: '📦',
};

function emojiForCategory(label) {
  const key = (label || '').toLowerCase().replace(/\s+/g, '-');
  return EMOJI_MAP[key] ?? EMOJI_MAP[label?.toLowerCase()] ?? EMOJI_MAP.default;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const GreetingHeader = ({ cartCount }: { cartCount?: number }) => {
  const navigation = useNavigation();

  return (
    <View style={hdr.row}>
      <View>
        <Text style={hdr.greeting}>Good day</Text>
        <Text style={hdr.sub}>What would you like today?</Text>
      </View>
      <TouchableOpacity
        style={hdr.cartBtn}
        onPress={() => navigation.navigate(ROUTES.CART)}
        activeOpacity={0.75}
      >
        <Text style={hdr.cartIcon}>🛒</Text>
        {cartCount > 0 && (
          <View style={hdr.badge}>
            <Text style={hdr.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const hdr = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg, paddingBottom: SPACING.sm },
  greeting: { fontSize: 22, fontWeight: '700', color: BRAND.navy, letterSpacing: -0.3 },
  sub:      { fontSize: 13, color: BRAND.muted, marginTop: 2 },
  cartBtn:  { width: 44, height: 44, borderRadius: 22, backgroundColor: BRAND.navy, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  cartIcon: { fontSize: 20 },
  badge:    { position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: 9, backgroundColor: BRAND.red, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: BRAND.cream },
  badgeText:{ fontSize: 10, fontWeight: '700', color: BRAND.white },
});

// ─── Section header ───────────────────────────────────────────────────────────
const SectionHdr = ({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) => (
  <View style={sec.row}>
    <Text style={sec.title}>{title}</Text>
    {actionLabel && (
      <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
        <Text style={sec.action}>{actionLabel}</Text>
      </TouchableOpacity>
    )}
  </View>
);

const sec = StyleSheet.create({
  row:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: 12, marginTop: 4 },
  title:  { fontSize: 17, fontWeight: '700', color: BRAND.navy },
  action: { fontSize: 12, fontWeight: '600', color: BRAND.red, letterSpacing: 0.2 },
});

// ─── Category pill ────────────────────────────────────────────────────────────
const CategoryPill = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => {
  const emoji = label === 'All' ? '🛍️' : emojiForCategory(label);
  return (
    <TouchableOpacity
      style={[cat.pill, active && cat.pillActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={cat.emoji}>{emoji}</Text>
      <Text style={[cat.label, active && cat.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const cat = StyleSheet.create({
  pill:       { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: BRAND.white, borderWidth: 1, borderColor: 'rgba(7,16,58,0.08)', marginRight: 10, minWidth: 72, gap: 4 },
  pillActive: { backgroundColor: BRAND.navy, borderColor: BRAND.navy },
  emoji:      { fontSize: 22 },
  label:      { fontSize: 11, fontWeight: '600', color: BRAND.muted, textAlign: 'center' },
  labelActive:{ color: BRAND.white },
});

// ─── Popular product card (horizontal list) ───────────────────────────────────
function measureAddPress(ref, onAdd) {
  const node = ref?.current;
  if (node && typeof node.measureInWindow === 'function') {
    node.measureInWindow((x, y, w, h) => {
      onAdd?.({ x: x + w / 2, y: y + h / 2 });
    });
    return;
  }
  onAdd?.({ x: SCREEN_W / 2, y: 360 });
}

const PopularCard = ({ product, isFavorite, onToggleFavorite, onPress, onAdd }: any) => {
  const price = Number(product.price ?? 0);
  const inStock = product.inStock || Number(product.stockQuantity) > 0;
  const addRef = useRef(null);

  return (
    <TouchableOpacity style={pop.card} onPress={onPress} activeOpacity={0.85}>
      {/* Image area */}
      <View style={pop.imgWrap}>
        {resolveAssetUrl(product.image) ? (
          <Image source={{ uri: resolveAssetUrl(product.image) }} style={pop.img} resizeMode="cover" />
        ) : (
          <View style={[pop.img, pop.imgPlaceholder]}>
            <Text style={pop.phEmoji}>❄️</Text>
          </View>
        )}
        <TouchableOpacity style={pop.fav} onPress={onToggleFavorite} activeOpacity={0.7}>
          <Text style={pop.heart}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        {!inStock && (
          <View style={pop.outBadge}>
            <Text style={pop.outText}>OUT</Text>
          </View>
        )}
      </View>
      {/* Info */}
      <View style={pop.body}>
        <Text style={pop.name} numberOfLines={2}>{product.name}</Text>
        <Text style={pop.price}>₱{price.toLocaleString()}</Text>
        <View ref={addRef} collapsable={false}>
          <TouchableOpacity
            style={[pop.addBtn, !inStock && pop.addBtnDisabled]}
            onPress={() => measureAddPress(addRef, onAdd)}
            activeOpacity={0.8}
            disabled={!inStock}
          >
            <Text style={pop.addText}>{inStock ? '+ Add' : 'N/A'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const pop = StyleSheet.create({
  card:          { width: H_CARD_W, backgroundColor: BRAND.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(7,16,58,0.07)', marginRight: 12 },
  imgWrap:       { position: 'relative', height: 110, backgroundColor: BRAND.cream2 },
  img:           { width: '100%', height: '100%' },
  imgPlaceholder:{ alignItems: 'center', justifyContent: 'center' },
  phEmoji:       { fontSize: 30 },
  heart:         { fontSize: 14 },
  fav:           { position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  outBadge:      { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  outText:       { fontSize: 9, fontWeight: '700', color: BRAND.white, letterSpacing: 0.8 },
  body:          { padding: 10, gap: 4 },
  name:          { fontSize: 12, fontWeight: '600', color: BRAND.navy, lineHeight: 16 },
  price:         { fontSize: 13, fontWeight: '700', color: BRAND.navy },
  addBtn:        { backgroundColor: BRAND.red, borderRadius: 8, paddingVertical: 6, alignItems: 'center', marginTop: 2 },
  addBtnDisabled:{ backgroundColor: BRAND.muted },
  addText:       { fontSize: 11, fontWeight: '700', color: BRAND.white },
});

// ─── Grid product card ────────────────────────────────────────────────────────
const GridCard = ({ product, isFavorite, onToggleFavorite, onPress, onAdd }: any) => {
  const price = Number(product.price ?? 0);
  const inStock = product.inStock || Number(product.stockQuantity) > 0;
  const addRef = useRef(null);

  return (
    <TouchableOpacity style={[grid.card, { width: CARD_W }]} onPress={onPress} activeOpacity={0.85}>
      <View style={grid.imgWrap}>
        {resolveAssetUrl(product.image) ? (
          <Image source={{ uri: resolveAssetUrl(product.image) }} style={grid.img} resizeMode="cover" />
        ) : (
          <View style={[grid.img, grid.imgPlaceholder]}>
            <Text style={grid.phEmoji}>❄️</Text>
          </View>
        )}
        <TouchableOpacity style={grid.fav} onPress={onToggleFavorite} activeOpacity={0.7}>
          <Text style={grid.heart}>{isFavorite ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        {categoryLabel(product.category) ? (
          <View style={grid.catBadge}>
            <Text style={grid.catText} numberOfLines={1}>
              {categoryLabel(product.category)}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={grid.body}>
        <Text style={grid.name} numberOfLines={2}>{product.name}</Text>
        <View style={grid.footer}>
          <Text style={grid.price}>₱{price.toLocaleString()}</Text>
          <View ref={addRef} collapsable={false}>
            <TouchableOpacity
              style={[grid.addBtn, !inStock && grid.addBtnDisabled]}
              onPress={() => measureAddPress(addRef, onAdd)}
              activeOpacity={0.8}
              disabled={!inStock}
            >
              <Text style={grid.addText}>{inStock ? '+ Add' : '—'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const grid = StyleSheet.create({
  card:          { backgroundColor: BRAND.white, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(7,16,58,0.07)', marginBottom: SPACING.md },
  imgWrap:       { position: 'relative', height: 130, backgroundColor: BRAND.cream2 },
  img:           { width: '100%', height: '100%' },
  imgPlaceholder:{ alignItems: 'center', justifyContent: 'center' },
  phEmoji:       { fontSize: 34 },
  heart:         { fontSize: 14 },
  fav:           { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.88)', alignItems: 'center', justifyContent: 'center' },
  catBadge:      { position: 'absolute', top: 8, left: 8, backgroundColor: BRAND.white, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  catText:       { fontSize: 9, fontWeight: '700', color: BRAND.red, letterSpacing: 0.6, textTransform: 'uppercase', maxWidth: 70 },
  body:          { padding: 12, gap: 6 },
  name:          { fontSize: 13, fontWeight: '600', color: BRAND.navy, lineHeight: 18 },
  footer:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price:         { fontSize: 15, fontWeight: '800', color: BRAND.navy },
  addBtn:        { backgroundColor: BRAND.red, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnDisabled:{ backgroundColor: BRAND.muted },
  addText:       { fontSize: 11, fontWeight: '700', color: BRAND.white },
});

// ─── Stats strip ──────────────────────────────────────────────────────────────
const StatsStrip = () => (
  <View style={stats.wrap}>
    {[
      { num: '20+', label: 'Years\nin Business' },
      { num: '1K+', label: 'Happy\nCustomers' },
      { num: '500+', label: 'Products\nStocked' },
    ].map((s, i) => (
      <View key={i} style={[stats.item, i < 2 && stats.divider]}>
        <Text style={stats.num}>{s.num}</Text>
        <Text style={stats.label}>{s.label}</Text>
      </View>
    ))}
  </View>
);

const stats = StyleSheet.create({
  wrap:   { flexDirection: 'row', marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, backgroundColor: BRAND.navy, borderRadius: 16, overflow: 'hidden' },
  item:   { flex: 1, paddingVertical: 16, alignItems: 'center' },
  divider:{ borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.1)' },
  num:    { fontSize: 20, fontWeight: '800', color: BRAND.gold, lineHeight: 24 },
  label:  { fontSize: 10, fontWeight: '500', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 3, lineHeight: 14 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
const HomeScreen = () => {
  const navigation = useNavigation();
  const listRef = useRef(null);
  const { addLine, lines } = useCart();
  const { flyToCart } = useCartFly();
  const { toggleFavorite, isFavorite } = useFavorites();
  const catalog = useProductCatalog();
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [lastWsMessage, setLastWsMessage] = useState('Waiting for messages...');

  useEffect(() => {
    setWsStatus(websocketClient.getState() === 'open' ? 'connected' : 'connecting');

    const offOpen = websocketClient.onOpen(() => {
      setWsStatus('connected');
      websocketClient.send({ type: 'hello', from: 'Jean Patrick T. Ezquer', screen: 'HomeScreen' });
    });
    const offClose = websocketClient.onClose(() => setWsStatus('disconnected'));
    const offError = websocketClient.onError(() => setWsStatus('disconnected'));
    const offMessage = websocketClient.onMessage(payload => {
      setLastWsMessage(payload);
      try {
        const parsed = JSON.parse(payload);
        if (parsed?.type === 'catalog_changed') {
          catalog.loadProducts(true);
        }
      } catch {
        // ignore non-JSON message payload
      }
    });

    return () => {
      offOpen();
      offClose();
      offError();
      offMessage();
    };
  }, [catalog.loadProducts]);

  useFocusEffect(
    useCallback(() => {
      catalog.loadProducts(true);
    }, [catalog.loadProducts]),
  );

  const popular = useMemo(() => catalog.filtered.slice(0, 10), [catalog.filtered]);
  const cartCount = useMemo(
    () => lines?.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0) ?? 0,
    [lines],
  );

  const handleQuickAdd = useCallback(
    (product: any, origin?: { x: number; y: number }) => {
      if (!product.inStock && Number(product.stockQuantity) <= 0) {
        Alert.alert('Out of stock', 'This item is not available right now.');
        return;
      }
      const order = resolveProductOrder(product);
      const unit = order.unitOptions?.[0]?.key ?? order.unit ?? 'pcs';
      addLine(product, order.min ?? 1, unit);
      if (origin) {
        flyToCart(origin);
      }
    },
    [addLine, flyToCart],
  );

  const scrollToProducts = () => listRef.current?.scrollToOffset?.({ offset: 700, animated: true });
  const sendWsPing = () => {
    const sent = websocketClient.send({
      type: 'ping',
      at: new Date().toISOString(),
      from: 'Jean Patrick T. Ezquer',
    });
    if (!sent) {
      Alert.alert('WebSocket', 'Socket not connected yet.');
    }
  };

  const renderPopular = useCallback(
    ({ item }: any) => (
      <PopularCard
        product={item}
        isFavorite={isFavorite(item.id)}
        onToggleFavorite={() => toggleFavorite(item.id)}
        onPress={() => navigation.navigate(ROUTES.PRODUCT_DETAIL, { productId: item.id })}
        onAdd={origin => handleQuickAdd(item, origin)}
      />
    ),
    [navigation, isFavorite, toggleFavorite, handleQuickAdd],
  );

  const renderGrid = useCallback(
    ({ item }: any) => (
      <GridCard
        product={item}
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
      <View style={s.centered}>
        <ActivityIndicator size="large" color={BRAND.red} />
        <Text style={s.loadingText}>Loading products…</Text>
      </View>
    );
  }

  const listHeader = (
    <View>
      {/* Greeting */}
      <GreetingHeader cartCount={cartCount} />

      {/* Search */}
      <View style={s.searchWrap}>
        <ShopSearchBar
          value={catalog.search}
          onChangeText={catalog.setSearch}
          sortBy={catalog.sortBy}
          onSortChange={catalog.setSortBy}
        />
      </View>

      {/* WebSocket status */}
      <View style={s.wsCard}>
        <View style={s.wsRow}>
          <Text style={s.wsTitle}>Live Socket</Text>
          <Text
            style={[
              s.wsStatus,
              wsStatus === 'connected'
                ? s.wsConnected
                : wsStatus === 'connecting'
                  ? s.wsConnecting
                  : s.wsDisconnected,
            ]}
          >
            {wsStatus.toUpperCase()}
          </Text>
        </View>
        <Text style={s.wsMessage} numberOfLines={2}>
          {lastWsMessage}
        </Text>
        <TouchableOpacity style={s.wsButton} onPress={sendWsPing} activeOpacity={0.85}>
          <Text style={s.wsButtonText}>Send Test Ping</Text>
        </TouchableOpacity>
      </View>

      {/* Promo banner */}
      <PromoVideoBanner onPress={scrollToProducts} />

      {/* Stats strip */}
      <StatsStrip />

      {/* Categories */}
      <SectionHdr title="Categories" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.catList}
        style={{ marginBottom: SPACING.md }}
      >
        {catalog.categories.map(cat => {
          const label = categoryLabel(cat);
          if (!label) return null;
          return (
            <CategoryPill
              key={label}
              label={label}
              active={catalog.category === label}
              onPress={() => catalog.setCategory(catalog.category === label ? 'All' : label)}
            />
          );
        })}
      </ScrollView>

      {/* Popular */}
      {popular.length > 0 && (
        <>
          <SectionHdr
            title="Popular products"
            actionLabel="See all ›"
            onAction={scrollToProducts}
          />
          <FlatList
            horizontal
            data={popular}
            keyExtractor={item => `pop-${item.id}`}
            renderItem={renderPopular}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.hList}
          />
        </>
      )}

      {/* All products header */}
      <SectionHdr title="All products" />
      {catalog.error ? <Text style={s.error}>{catalog.error}</Text> : null}
    </View>
  );

  return (
    <View style={s.container}>
      <FlatList
        ref={listRef}
        data={catalog.filtered}
        keyExtractor={item => String(item.id)}
        renderItem={renderGrid}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.list}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            refreshing={catalog.refreshing}
            onRefresh={() => catalog.loadProducts(true)}
            tintColor={BRAND.red}
            colors={[BRAND.red]}
          />
        }
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <Text style={s.emptyTitle}>No products found</Text>
            <Text style={s.emptyText}>Try a different search or category.</Text>
          </View>
        }
      />
    </View>
  );
};

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BRAND.cream },
  centered:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.cream, gap: 12 },
  loadingText:  { fontSize: 13, color: BRAND.muted, marginTop: 4 },
  searchWrap:   { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  wsCard:       { marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: BRAND.white, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(7,16,58,0.08)', padding: 12, gap: 8 },
  wsRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wsTitle:      { fontSize: 13, fontWeight: '700', color: BRAND.navy },
  wsStatus:     { fontSize: 11, fontWeight: '700' },
  wsConnected:  { color: '#0f9d58' },
  wsConnecting: { color: BRAND.gold },
  wsDisconnected:{ color: BRAND.red },
  wsMessage:    { fontSize: 11, color: BRAND.muted },
  wsButton:     { alignSelf: 'flex-start', backgroundColor: BRAND.navy, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  wsButtonText: { fontSize: 11, color: BRAND.white, fontWeight: '700' },
  catList:      { paddingHorizontal: SPACING.lg, paddingBottom: 4 },
  hList:        { paddingLeft: SPACING.lg, paddingBottom: SPACING.lg },
  list:         { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  row:          { justifyContent: 'space-between' },
  error:        { color: BRAND.red, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm, fontSize: 13 },
  emptyWrap:    { alignItems: 'center', paddingTop: 48, paddingBottom: 80 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: BRAND.navy, marginBottom: 6, marginTop: 48 },
  emptyText:    { fontSize: 13, color: BRAND.muted },
});

export default HomeScreen;
