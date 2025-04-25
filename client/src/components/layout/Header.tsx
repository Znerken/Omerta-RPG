import { useState } from "react";
import { Bell, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const [notifications, setNotifications] = useState(3);
  const [dailyReward, setDailyReward] = useState(true);

  const handleCollectDailyReward = () => {
    // TODO: API call to collect daily reward
    setDailyReward(false);
  };

  return (
    <header className="bg-dark-surface flex-shrink-0 border-b border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-heading lg:hidden">MAFIA EMPIRE</h1>
          
          <div className="flex items-center space-x-4">
            {/* Daily Reward */}
            {dailyReward && (
              <Button 
                variant="outline" 
                className="relative bg-secondary bg-opacity-20 text-secondary border-secondary hover:bg-secondary hover:text-white"
                onClick={handleCollectDailyReward}
              >
                <Gift className="h-4 w-4 mr-2" />
                <span>Daily Reward</span>
                <Badge className="absolute -top-1 -right-1 bg-primary text-white w-4 h-4 flex items-center justify-center p-0">
                  1
                </Badge>
              </Button>
            )}
            
            {/* Notifications */}
            <Button variant="ghost" className="relative text-gray-300 hover:text-white">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-primary text-white w-4 h-4 flex items-center justify-center p-0">
                  {notifications}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
