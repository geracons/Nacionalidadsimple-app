import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useEffect, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

const DAY = 1000 * 60 * 60 * 24;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Lo guardado se muestra al instante y se refresca en segundo plano.
      staleTime: 1000 * 60 * 5,
      gcTime: DAY * 7,
      retry: 2,
    },
  },
});

// Cachea las respuestas en el dispositivo para abrir la app al instante y leer sin conexión.
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'nacionalidadsimple-cache',
  throttleTime: 2000,
});

export function QueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: DAY * 7,
        buster: 'v1',
        dehydrateOptions: {
          // Sólo persistimos lo que se cargó bien.
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}>
      {children}
    </PersistQueryClientProvider>
  );
}
