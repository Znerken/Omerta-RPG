import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useNotification } from '@/hooks/use-notification';

// Achievement interface matching schema.ts
interface Achievement {
  id: number;
  name: string;
  description: string;
  category: string;
  requirementType: string;
  requirementValue: number;
  cashReward: number;
  xpReward: number;
  respectReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  viewed: boolean;
}

interface AchievementsContextType {
  unviewedCount: number;
  hasNewAchievements: boolean;
  loading: boolean;
  refreshAchievements: () => void;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export function AchievementsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Fetch unviewed achievements
  const { 
    data: unviewedAchievements, 
    isLoading, 
    refetch 
  } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements/unviewed'],
    enabled: !!user,
    staleTime: 30000, // 30 seconds
  });

  // Derived state
  const unviewedCount = unviewedAchievements?.length || 0;
  const hasNewAchievements = unviewedCount > 0;

  // Refresh achievements data
  const refreshAchievements = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    refetch();
  };

  // Show notifications for new achievements when they're loaded
  useEffect(() => {
    if (unviewedAchievements && unviewedAchievements.length > 0) {
      unviewedAchievements.forEach(achievement => {
        addNotification(
          `Achievement Unlocked: ${achievement.name}`,
          achievement.description,
          'success',
          { achievementId: achievement.id }
        );
      });
    }
  }, [unviewedAchievements, addNotification]);

  return (
    <AchievementsContext.Provider
      value={{
        unviewedCount,
        hasNewAchievements,
        loading: isLoading,
        refreshAchievements,
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
}

export function useAchievements() {
  const context = useContext(AchievementsContext);
  if (context === undefined) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
}