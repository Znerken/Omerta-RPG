import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Types
interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isLoading: boolean;
  error: string | null;
}

// Create context
const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
  error: null
});

// Global reference to prevent multiple instances
let globalSupabaseClient: SupabaseClient | null = null;

// Add a global function to reset the Supabase client
export function resetSupabaseClient() {
  globalSupabaseClient = null;
  window.__SUPABASE_CLIENT = undefined;
}

// Provider component
export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(globalSupabaseClient);
  const [isLoading, setIsLoading] = useState(globalSupabaseClient === null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if we already have a client
    if (globalSupabaseClient !== null) {
      setSupabase(globalSupabaseClient);
      setIsLoading(false);
      return;
    }
    
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        if (!response.ok) {
          throw new Error(`Failed to fetch configuration: ${response.statusText}`);
        }
        
        const config = await response.json();
        if (!config.VITE_SUPABASE_URL || !config.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Missing Supabase credentials in configuration');
        }
        
        console.log('Supabase configuration loaded successfully');
        
        // Create Supabase client only if it doesn't exist
        if (!globalSupabaseClient) {
          globalSupabaseClient = createClient(
            config.VITE_SUPABASE_URL,
            config.VITE_SUPABASE_ANON_KEY
          );
          
          // Set global window reference for other parts of the code
          window.__SUPABASE_CLIENT = globalSupabaseClient;
        }
        
        setSupabase(globalSupabaseClient);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing Supabase:', err);
        setError(err instanceof Error ? err.message : 'Unknown error initializing Supabase');
        setIsLoading(false);
      }
    };
    
    fetchConfig();
  }, []);
  
  return (
    <SupabaseContext.Provider value={{ supabase, isLoading, error }}>
      {children}
    </SupabaseContext.Provider>
  );
};

// Hook to use the Supabase context
export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

// Loading component
export const SupabaseLoadingGuard = ({ children }: { children: ReactNode }) => {
  const { isLoading, error } = useSupabase();
  
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-3xl font-bold text-white mb-4">OMERTÀ</div>
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <div className="text-white mt-4">Loading game...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-3xl font-bold text-white mb-4">OMERTÀ</div>
        <div className="text-red-500 mb-4">Failed to initialize Supabase</div>
        <div className="text-white">{error}</div>
        <button 
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/80"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
};