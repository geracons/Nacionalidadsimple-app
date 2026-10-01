import { useQueryClient, type InfiniteData } from '@tanstack/react-query';

import type { PostSummary, PostsPage } from '@/lib/wp';

/**
 * Busca el resumen de una entrada en las listas ya cargadas.
 * Permite pintar título e imagen al instante mientras llega el contenido completo.
 */
export function useCachedSummary(slug: string): PostSummary | undefined {
  const queryClient = useQueryClient();
  const lists = queryClient.getQueriesData<InfiniteData<PostsPage>>({ queryKey: ['posts'] });
  for (const [, data] of lists) {
    for (const page of data?.pages ?? []) {
      const found = page.posts.find((post) => post.slug === slug);
      if (found) return found;
    }
  }
  return undefined;
}
