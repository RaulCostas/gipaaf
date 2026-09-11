import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { FilterProvider } from './context/FilterContext';
import AppRouter from './router/AppRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FilterProvider>
          <Toaster richColors position="top-right" duration={3000} />
          <AppRouter />
        </FilterProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
