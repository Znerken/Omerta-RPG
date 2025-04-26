import { useQuery } from "@tanstack/react-query";

type Stats = {
  strength: number;
  stealth: number;
  charisma: number;
  intelligence: number;
};

/**
 * Hook to retrieve user stats
 */
export function useStats(userId?: number) {
  const endpoint = userId ? `/api/social/users/${userId}/stats` : "/api/user/profile";
  
  return useQuery({
    queryKey: [endpoint],
    select: (data: any) => {
      // If it's the user's own profile, data structure is different
      if (!userId) {
        return {
          strength: data.stats.strength,
          stealth: data.stats.stealth,
          charisma: data.stats.charisma,
          intelligence: data.stats.intelligence,
        };
      }
      
      // Otherwise, it's a specific structure for other users' stats
      return {
        strength: data.strength,
        stealth: data.stealth,
        charisma: data.charisma,
        intelligence: data.intelligence,
      };
    },
  });
}