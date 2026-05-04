import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 1,
      onError: (error) => {
        if (process.env.NODE_ENV === 'development') {
          console.error("Mutation error:", error);
        }
        // console.error("Mutation error:", error);
      },
    },

    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});

export function handleRefresh() {
  const allQueries = queryClient.getQueryCache().getAll();
  const freshQueries = allQueries.filter((q) => q.isActive());
  freshQueries.forEach((query) => {
    queryClient.invalidateQueries({
      queryKey: query.queryKey,
    });
  });
}
