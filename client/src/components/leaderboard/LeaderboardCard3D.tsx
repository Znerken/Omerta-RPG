import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeaderboardScene } from './3DElements';
import { 
  TrophyIcon, 
  DollarSignIcon, 
  StarIcon, 
  UsersIcon, 
  RefreshCwIcon, 
  ArrowLeftIcon, 
  ArrowRightIcon
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
  const [view3D, setView3D] = useState<boolean>(true);
  
  // Get the right data for the active tab
  const getTabData = () => {
    switch (activeTab) {
      case 'level':
        return { data: levelData, loading: isLevelLoading };
      case 'cash':
        return { data: cashData, loading: isCashLoading };
      case 'respect':
        return { data: respectData, loading: isRespectLoading };
      case 'gangs':
        return { data: gangData, loading: isGangLoading };
      default:
        return { data: levelData, loading: isLevelLoading };
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
      <Card className="bg-dark-surface w-full h-[500px] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <RefreshCwIcon className="animate-spin h-12 w-12 text-primary mb-4" />
          <p className="text-gray-400">Loading leaderboard data...</p>
        </motion.div>
      </Card>
    );
  }
  
  // Empty data placeholder
  if (!data || data.length === 0) {
    return (
      <Card className="bg-dark-surface w-full h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center text-center px-4">
          <TrophyIcon className="h-16 w-16 text-gray-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">No data available</h3>
          <p className="text-gray-400 max-w-md">
            There's no leaderboard data available for this category yet.
            Be the first to claim your spot at the top!
          </p>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="bg-dark-surface w-full overflow-hidden">
      <CardHeader className="pb-2 relative">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center text-xl">
            <TrophyIcon className="h-5 w-5 mr-2 text-primary" />
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Leaderboard
          </CardTitle>
          
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setView3D(!view3D)}
            >
              {view3D ? '2D View' : '3D View'}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
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
        </div>
        
        {/* Tab navigation */}
        <div className="flex mt-4 space-x-1 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "secondary" : "ghost"}
              size="sm"
              className={`h-9 px-3 ${activeTab === tab.id ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              <span className="ml-2">{tab.label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${view3D ? '3d' : '2d'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {view3D ? (
              // 3D Visualization
              <div className="relative">
                <LeaderboardScene 
                  players={data} 
                  activeTab={activeTab}
                />
                
                {/* Overlay navigation buttons for mobile */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
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
              </div>
            ) : (
              // 2D Table view with animations
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-dark-lighter">
                    <tr>
                      <th className="px-4 py-3 text-sm font-medium text-gray-400">Rank</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-400">Player</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-400">Level</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-400 text-right">
                        {activeTab === 'cash' ? 'Cash' : (activeTab === 'respect' ? 'Respect' : 'XP')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {data.slice(0, 10).map((player, index) => (
                      <motion.tr
                        key={player.id}
                        className="hover:bg-dark-lighter"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          delay: index * 0.05,
                          duration: 0.3
                        }}
                      >
                        <td className="px-4 py-3 font-mono font-bold">
                          <span className={
                            index === 0 ? "text-yellow-400" : 
                            index === 1 ? "text-gray-300" : 
                            index === 2 ? "text-amber-700" : 
                            "text-secondary"
                          }>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="relative">
                              <div className={`h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white ${
                                index < 3 ? 'ring-2 ring-opacity-60 ' + 
                                (index === 0 ? 'ring-yellow-400' : 
                                index === 1 ? 'ring-gray-300' : 
                                'ring-amber-700') : ''
                              }`}>
                                {player.avatar ? (
                                  <img 
                                    src={player.avatar} 
                                    alt={player.username} 
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  player.username.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              {index < 3 && (
                                <motion.div
                                  className="absolute inset-0 rounded-full"
                                  animate={{ 
                                    boxShadow: [
                                      `0 0 0 rgba(${index === 0 ? '255, 215, 0' : index === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.7)`, 
                                      `0 0 10px rgba(${index === 0 ? '255, 215, 0' : index === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.7)`,
                                      `0 0 0 rgba(${index === 0 ? '255, 215, 0' : index === 1 ? '192, 192, 192' : '205, 127, 50'}, 0.7)`
                                    ] 
                                  }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                  }}
                                />
                              )}
                            </div>
                            <span className="ml-3 font-medium">{player.username}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">Level {player.level}</td>
                        <td className="px-4 py-3 font-mono text-right">
                          {activeTab === 'cash' 
                            ? `$${player.cash.toLocaleString()}`
                            : (activeTab === 'respect' 
                              ? player.respect.toLocaleString()
                              : player.xp.toLocaleString()
                            )
                          }
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}