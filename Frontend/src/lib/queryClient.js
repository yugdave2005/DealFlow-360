import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 3 * 60 * 1000, // 3 minutes fresh cache
      gcTime: 15 * 60 * 1000,    // 15 minutes garbage collection persistence
      refetchOnWindowFocus: false,
      refetchOnMount: false,     // Render immediately from cache on route changes
      refetchOnReconnect: false,
      retry: 1,
      placeholderData: (previousData) => previousData, // Seamless UI during background fetches
    },
    mutations: {
      retry: 0,
    },
  },
});
