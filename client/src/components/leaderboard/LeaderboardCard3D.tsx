import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FallbackLeaderboard } from './3DElements';
import { 
  TrophyIcon, 
  DollarSignIcon, 
  StarIcon, 
  UsersIcon, 
  RefreshCwIcon,
  Loader2Icon,
} from 'lucide-react';

interface LeaderboardCardProps {
  levelData?: any[];
  cashData?: any[];
  respectData?: any[];
  gangData?: any[];
  isLevelLoading?: boolean;
  isCashLoading?: boolean;
  isRespectLoading?: boolean;
  isGangLoading?: boolean;
  defaultTab?: string;
}

export function LeaderboardCard3D({
  levelData = [],
  cashData = [],
  respectData = [],
  gangData = [],
  isLevelLoading = false,
  isCashLoading = false,
  isRespectLoading = false,
  isGangLoading = false,
  defaultTab = "level"
}: LeaderboardCardProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  
  // Get the right data for the active tab
  const getTabData = () => {
    switch (activeTab) {
      case 'level':
        return { data: levelData || [], loading: isLevelLoading };
      case 'cash':
        return { data: cashData || [], loading: isCashLoading };
      case 'respect':
        return { data: respectData || [], loading: isRespectLoading };
      case 'gangs':
        return { data: gangData || [], loading: isGangLoading };
      default:
        return { data: levelData || [], loading: isLevelLoading };
    }
  };
  
  const { data, loading } = getTabData();
  
  // Tab config for icons and labels
  const tabs = [
    { id: 'level', label: 'Level', icon: <TrophyIcon className="h-5 w-5" /> },
    { id: 'cash', label: 'Cash', icon: <DollarSignIcon className="h-5 w-5" /> },
    { id: 'respect', label: 'Respect', icon: <StarIcon className="h-5 w-5" /> },
    { id: 'gangs', label: 'Gangs', icon: <UsersIcon className="h-5 w-5" /> },
  ];
  
  // Handle tab switching
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Loading placeholder
  if (loading) {
    return (
      <div className="relative bg-dark-surface w-full h-[600px] rounded-lg flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent" />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center z-10"
        >
          <Loader2Icon className="animate-spin h-12 w-12 text-primary mb-4" />
          <p className="text-gray-400">Loading leaderboard data...</p>
        </motion.div>
      </div>
    );
  }
  
  // Empty data placeholder
  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-surface w-full h-[600px] rounded-lg flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-primary/5 to-transparent" />
        <div className="flex flex-col items-center text-center px-4 z-10">
          <TrophyIcon className="h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">No data available</h3>
          <p className="text-gray-400 max-w-md">
            There's no leaderboard data available for this category yet.
            Be the first to claim your spot at the top!
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-transparent w-full overflow-hidden">
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Category tabs */}
        <div className="flex flex-1 bg-dark-lighter/70 backdrop-blur-sm rounded-lg p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`h-9 px-3 ${activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          ))}
        </div>
        
        {/* Refresh button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 bg-dark-lighter/70 backdrop-blur-sm rounded-lg"
          onClick={() => {
            // Refresh the current tab data
            window.queryClient.invalidateQueries({ 
              queryKey: [`/api/leaderboard?type=${activeTab}`] 
            });
          }}
        >
          <RefreshCwIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <Card className="bg-dark-surface/60 w-full border-none overflow-hidden relative">
        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <FallbackLeaderboard players={data} activeTab={activeTab} />
              
              {/* Overlay navigation buttons for mobile */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 md:hidden">
                {tabs.map((tab) => (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "outline"}
                    size="sm"
                    className={`h-8 w-8 rounded-full ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-black/50 backdrop-blur-sm text-white'}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    {tab.icon}
                  </Button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}