import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { PostSummary } from '@/lib/wp';

const STORAGE_KEY = 'nacionalidadsimple-favorites';

type FavoritesContextValue = {
  favorites: PostSummary[];
  isFavorite: (slug: string) => boolean;
  toggleFavorite: (post: PostSummary) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

/** Sólo guardamos los campos de resumen, no el HTML completo. */
function toSummary({ id, type, slug, link, date, title, excerpt, image, categories, sticky }: PostSummary) {
  return { id, type, slug, link, date, title, excerpt, image, categories, sticky };
}

export function FavoritesProvider({ children }: PropsWithChildren) {
  const [favorites, setFavorites] = useState<PostSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value) setFavorites(JSON.parse(value) as PostSummary[]);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)).catch(() => {});
  }, [favorites, loaded]);

  const isFavorite = useCallback(
    (slug: string) => favorites.some((post) => post.slug === slug),
    [favorites]
  );

  const toggleFavorite = useCallback((post: PostSummary) => {
    setFavorites((current) =>
      current.some((item) => item.slug === post.slug)
        ? current.filter((item) => item.slug !== post.slug)
        : [toSummary(post), ...current]
    );
  }, []);

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite }),
    [favorites, isFavorite, toggleFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites debe usarse dentro de <FavoritesProvider>');
  return context;
}
