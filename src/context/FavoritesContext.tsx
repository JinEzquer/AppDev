// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@patrick_favorites';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setIds(parsed.map(Number).filter(Boolean));
          }
        }
      })
      .catch(() => {});
  }, []);

  const persist = useCallback(next => {
    setIds(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const toggleFavorite = useCallback(
    productId => {
      const id = Number(productId);
      persist(ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
    },
    [ids, persist],
  );

  const isFavorite = useCallback(productId => ids.includes(Number(productId)), [ids]);

  const value = useMemo(
    () => ({ ids, toggleFavorite, isFavorite, count: ids.length }),
    [ids, toggleFavorite, isFavorite],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return ctx;
}
