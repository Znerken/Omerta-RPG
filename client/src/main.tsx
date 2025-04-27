import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-supabase';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupabaseProvider, SupabaseLoadingGuard } from './providers/supabase-provider';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Render the application with providers
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SupabaseProvider>
      <QueryClientProvider client={queryClient}>
        <SupabaseLoadingGuard>
          <App />
        </SupabaseLoadingGuard>
      </QueryClientProvider>
    </SupabaseProvider>
  </React.StrictMode>
);