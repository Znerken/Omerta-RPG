import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App-supabase';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SupabaseProvider, SupabaseLoadingGuard } from './providers/supabase-provider';
import { SupabaseAuthProvider } from '@/hooks/use-supabase-auth';

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
          <SupabaseAuthProvider>
            <App />
          </SupabaseAuthProvider>
        </SupabaseLoadingGuard>
      </QueryClientProvider>
    </SupabaseProvider>
  </React.StrictMode>
);