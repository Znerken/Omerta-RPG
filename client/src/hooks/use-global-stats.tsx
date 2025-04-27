import { createContext, ReactNode, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { queryClient } from '@/lib/queryClient';
import { useToast } from './use-toast';
import { useWebSocketContext } from './use-websocket-context';

// Define types for user stats
export type UserStats = {
  cash: number;
  xp: number;
  level: number;
  respect: number;
};

// Define the context type for global stats
type GlobalStatsContextType = {
  stats: UserStats;
  updateStats: (newStats: Partial<UserStats>) => void;
  refreshStats: () => void;
  isLoading: boolean;
};

// Create the context with default values
const GlobalStatsContext = createContext<GlobalStatsContextType | null>(null);

/**
 * Provider component for global stats management
 */
export function GlobalStatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { socket, isConnected } = useWebSocketContext();
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize stats from the user object
  const [stats, setStats] = useState<UserStats>({
    cash: user?.cash || 0,
    xp: user?.xp || 0,
    level: user?.level || 1,
    respect: user?.respect || 0,
  });

  // Update stats in state and cache
  const updateStats = useCallback((newStats: Partial<UserStats>) => {
    setStats(prevStats => ({
      ...prevStats,
      ...newStats,
    }));

    // Also update the user data in the query cache
    queryClient.setQueryData(['/api/user'], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        ...newStats,
      };
    });
  }, []);

  // Refresh stats from the API
  const refreshStats = useCallback(async () => {
    setIsLoading(true);
    try {
      await queryClient.invalidateQueries({ 
        queryKey: ['/api/user'],
        refetchType: 'active' // Only fetch if query is active
      });
      
      // Get the latest user data from cache after the refresh
      const userData = queryClient.getQueryData(['/api/user']) as any;
      if (userData) {
        setStats({
          cash: userData.cash || 0,
          xp: userData.xp || 0,
          level: userData.level || 1,
          respect: userData.respect || 0,
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to refresh stats',
        description: 'Unable to get the latest stats. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Keep stats in sync with user data
  useEffect(() => {
    if (user) {
      setStats({
        cash: user.cash || 0,
        xp: user.xp || 0,
        level: user.level || 1,
        respect: user.respect || 0,
      });
    }
  }, [user]);

  // Listen for WebSocket events to update stats in real-time
  useEffect(() => {
    if (!isConnected) return;

    const handleStatsUpdate = (event: Event) => {
      const message = (event as CustomEvent).detail;
      
      if (message.type === 'stats_update') {
        updateStats(message.data);
      } else if (message.type === 'cash_transaction') {
        updateStats({ cash: message.data.newBalance });
      } else if (message.type === 'xp_gain') {
        updateStats({ 
          xp: message.data.newXp,
          level: message.data.newLevel || stats.level
        });
      }
    };

    // Listen for our custom WebSocket events
    document.addEventListener('websocket-message', handleStatsUpdate);
    
    return () => {
      document.removeEventListener('websocket-message', handleStatsUpdate);
    };
  }, [isConnected, updateStats, stats.level]);

  return (
    <GlobalStatsContext.Provider
      value={{
        stats,
        updateStats,
        refreshStats,
        isLoading
      }}
    >
      {children}
    </GlobalStatsContext.Provider>
  );
}

/**
 * Hook to access global stats
 */
export function useGlobalStats() {
  const context = useContext(GlobalStatsContext);
  if (!context) {
    throw new Error('useGlobalStats must be used within a GlobalStatsProvider');
  }
  return context;
}