import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAchievements } from '@/hooks/use-achievements';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, Shield, Briefcase, Target, Heart, Skull, CheckCircle } from 'lucide-react';

// Define achievement interface
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

// CategoryIcon component to render appropriate icon based on category
const CategoryIcon = ({ category }: { category: string }) => {
  switch (category.toLowerCase()) {
    case 'crime':
      return <Briefcase className="h-5 w-5 text-red-500" />;
    case 'combat':
      return <Skull className="h-5 w-5 text-orange-500" />;
    case 'wealth':
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 'social':
      return <Heart className="h-5 w-5 text-pink-500" />;
    case 'skill':
      return <Target className="h-5 w-5 text-blue-500" />;
    case 'prestige':
      return <Star className="h-5 w-5 text-purple-500" />;
    default:
      return <Shield className="h-5 w-5 text-green-500" />;
  }
};

export default function AchievementsPage() {
  const { toast } = useToast();
  const { refreshAchievements } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Fetch all achievements
  const { data: achievements, isLoading, isError, refetch } = useQuery<Achievement[]>({
    queryKey: ['/api/achievements'],
  });

  // Get unique categories from achievements
  const categories = achievements 
    ? ['all', ...new Set(achievements.map(a => a.category))]
    : ['all'];

  // Filter achievements by selected category
  const filteredAchievements = achievements
    ? selectedCategory === 'all' 
      ? achievements 
      : achievements.filter(a => a.category === selectedCategory)
    : [];

  // Get unviewed achievements for notification badge
  const unlockedCount = achievements?.filter(a => a.unlocked).length || 0;
  const totalCount = achievements?.length || 0;
  const unviewedCount = achievements?.filter(a => a.unlocked && !a.viewed).length || 0;

  // Mark achievement as viewed
  const handleViewAchievement = async (id: number) => {
    try {
      const result = await apiRequest('POST', `/api/achievements/${id}/view`);
      if (result.ok) {
        refetch();
        refreshAchievements(); // Also refresh the achievements context
      }
    } catch (error) {
      console.error('Error marking achievement as viewed:', error);
    }
  };

  // When component mounts, mark any new achievements as viewed
  useEffect(() => {
    const markNewAchievementsAsViewed = async () => {
      if (achievements) {
        const unviewedAchievements = achievements.filter(a => a.unlocked && !a.viewed);
        
        if (unviewedAchievements.length > 0) {
          // Show toast for each unviewed achievement
          unviewedAchievements.forEach(achievement => {
            toast({
              title: `Achievement Unlocked: ${achievement.name}`,
              description: achievement.description,
              variant: 'success',
            });
            
            // Mark as viewed
            handleViewAchievement(achievement.id);
          });
        }
      }
    };

    markNewAchievementsAsViewed();
  }, [achievements]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container mx-auto p-4">
      <Card className="dark:bg-black/60 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-3xl font-bold">Achievements</CardTitle>
                <CardDescription>
                  Your criminal accomplishments and milestones
                </CardDescription>
              </div>
              <div className="flex flex-col items-end">
                <Badge className="py-1 px-2 mb-2 text-sm">
                  <Trophy className="h-4 w-4 mr-1" />
                  {unlockedCount} / {totalCount} Unlocked
                </Badge>
                {unviewedCount > 0 && (
                  <Badge className="bg-red-500 hover:bg-red-600 py-1 px-2 text-sm">
                    {unviewedCount} New
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" className="w-full" onValueChange={setSelectedCategory}>
              <TabsList className="w-full overflow-x-auto flex-wrap bg-black/70">
                {categories.map(category => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="capitalize flex items-center space-x-1"
                  >
                    {category !== 'all' && <CategoryIcon category={category} />}
                    {category === 'all' ? 'All Categories' : category}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={selectedCategory} className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Card key={i} className="bg-black/40 border-gray-800">
                        <CardHeader className="pb-2">
                          <Skeleton className="h-5 w-3/4" />
                          <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardContent>
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                        <CardFooter>
                          <Skeleton className="h-9 w-full" />
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : isError ? (
                  <div className="text-center py-8">
                    <p className="text-red-500">Failed to load achievements. Try again later.</p>
                    <Button variant="outline" onClick={() => refetch()} className="mt-4">
                      Retry
                    </Button>
                  </div>
                ) : filteredAchievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAchievements.map(achievement => (
                      <Card 
                        key={achievement.id} 
                        className={`transition-all border-2 ${
                          achievement.unlocked 
                            ? 'bg-black/70 border-yellow-500/70' 
                            : 'bg-black/80 border-gray-700 opacity-70'
                        }`}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-xl font-semibold">
                              {achievement.name}
                            </CardTitle>
                            <div className="flex items-center space-x-2">
                              <CategoryIcon category={achievement.category} />
                              {achievement.unlocked && (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              )}
                            </div>
                          </div>
                          <CardDescription className="text-sm italic">
                            {achievement.category} achievement
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                          <p className="text-sm mb-3">{achievement.description}</p>
                          {achievement.unlocked ? (
                            <div className="text-xs text-gray-400">
                              Unlocked: {new Date(achievement.unlockedAt!).toLocaleDateString()}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-400">
                              Requirement: {achievement.requirementType} reaches {achievement.requirementValue}
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="flex flex-wrap gap-2 pt-0">
                          {achievement.cashReward > 0 && (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              ${achievement.cashReward.toLocaleString()}
                            </Badge>
                          )}
                          {achievement.xpReward > 0 && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              {achievement.xpReward} XP
                            </Badge>
                          )}
                          {achievement.respectReward > 0 && (
                            <Badge variant="outline" className="text-purple-400 border-purple-400">
                              {achievement.respectReward} Respect
                            </Badge>
                          )}
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No achievements found in this category.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
}