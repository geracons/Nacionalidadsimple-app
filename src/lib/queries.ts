import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { getContentBySlug, listCategories, listPosts } from '@/lib/wp';

const PAGE_SIZE = 10;

export function usePosts({ category, search }: { category?: number; search?: string } = {}) {
  return useInfiniteQuery({
    queryKey: ['posts', { category: category ?? null, search: search ?? '' }],
    queryFn: ({ pageParam, signal }) =>
      listPosts({ page: pageParam, perPage: PAGE_SIZE, category, search }, signal),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });
}

export function usePost(slug: string) {
  return useQuery({
    queryKey: ['post', slug],
    queryFn: ({ signal }) => getContentBySlug(slug, signal),
    enabled: Boolean(slug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: ({ signal }) => listCategories(signal),
    staleTime: 1000 * 60 * 60,
  });
}
