// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCustomerProducts } from '../app/api/customer';

export function useProductCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  const loadProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const response = await getCustomerProducts({ limit: 50 });
      setProducts(response?.data?.products ?? []);
    } catch (err) {
      setError(err?.message || 'Unable to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const categories = useMemo(() => {
    const names = new Set();
    products.forEach(p => {
      const c = p.category;
      const name = typeof c === 'string' ? c : c?.name;
      if (name) names.add(name);
    });
    return ['All', ...Array.from(names)];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = products.filter(p => {
      const catName =
        typeof p.category === 'string' ? p.category : p.category?.name ?? '';
      const matchCat = category === 'All' || !category || catName === category;
      const matchSearch =
        !q ||
        p.name?.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });

    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_desc') {
      list = [...list].sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'name') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return list;
  }, [products, search, category, sortBy]);

  return {
    products,
    loading,
    refreshing,
    error,
    search,
    setSearch,
    category,
    setCategory,
    sortBy,
    setSortBy,
    categories,
    filtered,
    loadProducts,
  };
}
