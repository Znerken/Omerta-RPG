import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Zap, 
  Heart, 
  Clock, 
  Lock, 
  Unlock, 
  Info,
  Navigation 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Location {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  difficulty: string;
  type: string;
  rewards: {
    cash: number;
    xp: number;
    respect: number;
    special_item_id?: number | null;
  };
  cooldown_hours: number;
  last_completed?: string | null;
  unlocked: boolean;
  image_url?: string | null;
}

interface ChallengeMapProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  playerPosition?: { lat: number; lng: number } | null;
  onRefreshLocation: () => void;
  isLoadingLocation: boolean;
}

const ChallengeMap: React.FC<ChallengeMapProps> = ({
  locations,
  onLocationSelect,
  playerPosition,
  onRefreshLocation,
  isLoadingLocation
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [mapSize, setMapSize] = useState({ width: 0, height: 0 });
  const [hoveredLocation, setHoveredLocation] = useState<Location | null>(null);
  
  // Set the map size on component mount and window resize
  useEffect(() => {
    const updateMapSize = () => {
      if (mapRef.current) {
        setMapSize({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight
        });
      }
    };
    
    updateMapSize();
    window.addEventListener('resize', updateMapSize);
    
    return () => {
      window.removeEventListener('resize', updateMapSize);
    };
  }, []);

  // Convert GPS coordinates to map position
  const coordsToMapPosition = (lat: number, lng: number) => {
    // These would be set based on the bounds of your game's virtual world map
    const MAP_MIN_LAT = 40.7;
    const MAP_MAX_LAT = 40.8;
    const MAP_MIN_LNG = -74.0;
    const MAP_MAX_LNG = -73.9;
    
    // Normalize to 0-1 range
    const normalizedX = (lng - MAP_MIN_LNG) / (MAP_MAX_LNG - MAP_MIN_LNG);
    const normalizedY = 1 - (lat - MAP_MIN_LAT) / (MAP_MAX_LAT - MAP_MIN_LAT); // Invert Y for screen coords
    
    // Convert to pixel coordinates
    return {
      x: normalizedX * mapSize.width,
      y: normalizedY * mapSize.height
    };
  };

  // Calculate if a location is available (not on cooldown)
  const isLocationAvailable = (location: Location) => {
    if (!location.last_completed) return true;
    
    const lastCompletedDate = new Date(location.last_completed);
    const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
    const now = new Date();
    
    return now.getTime() - lastCompletedDate.getTime() > cooldownMs;
  };

  // Calculate time until a location is available again
  const getTimeUntilAvailable = (location: Location) => {
    if (!location.last_completed) return null;
    
    const lastCompletedDate = new Date(location.last_completed);
    const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
    const availableDate = new Date(lastCompletedDate.getTime() + cooldownMs);
    const now = new Date();
    
    if (now >= availableDate) return null;
    
    const diffMs = availableDate.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHrs}h ${diffMins}m`;
  };

  // Handle clicking a location pin
  const handleLocationClick = (location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  };

  // Get icon based on location type
  const getLocationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'drugs':
        return <div className="bg-green-700/80 p-1 rounded-full"><MapPin className="h-5 w-5 text-white" /></div>;
      case 'crime':
        return <div className="bg-red-700/80 p-1 rounded-full"><MapPin className="h-5 w-5 text-white" /></div>;
      case 'training':
        return <div className="bg-blue-700/80 p-1 rounded-full"><MapPin className="h-5 w-5 text-white" /></div>;
      case 'secret':
        return <div className="bg-purple-700/80 p-1 rounded-full"><MapPin className="h-5 w-5 text-white" /></div>;
      default:
        return <div className="bg-gray-700/80 p-1 rounded-full"><MapPin className="h-5 w-5 text-white" /></div>;
    }
  };

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-md">
      {/* Background Map Image */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-center bg-cover paper-texture relative"
        style={{ 
          backgroundImage: `url('/assets/mafia-city-map.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Location Pins */}
        {locations.map((location) => {
          const position = coordsToMapPosition(location.latitude, location.longitude);
          const isAvailable = isLocationAvailable(location);
          const isUnlocked = location.unlocked;
          
          return (
            <TooltipProvider key={location.id} delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 z-10 ${
                      !isUnlocked ? 'opacity-60' : isAvailable ? 'opacity-100' : 'opacity-70'
                    }`}
                    style={{ 
                      left: position.x, 
                      top: position.y 
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLocationClick(location)}
                    onMouseEnter={() => setHoveredLocation(location)}
                    onMouseLeave={() => setHoveredLocation(null)}
                  >
                    {isUnlocked ? (
                      getLocationIcon(location.type)
                    ) : (
                      <div className="bg-gray-800/80 p-1 rounded-full">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                    )}
                    
                    {/* Pulsing effect for available locations */}
                    {isUnlocked && isAvailable && (
                      <motion.div
                        className="absolute top-0 left-0 w-full h-full rounded-full bg-white"
                        initial={{ opacity: 0.3, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="px-2 py-1 text-center">
                    <p className="font-bold text-sm">{location.name}</p>
                    {!isUnlocked ? (
                      <p className="text-xs text-muted-foreground">Locked</p>
                    ) : !isAvailable ? (
                      <p className="text-xs text-yellow-300">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {getTimeUntilAvailable(location)}
                      </p>
                    ) : (
                      <p className="text-xs text-green-300">Available</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
        
        {/* Player Position Pin */}
        {playerPosition && (
          <motion.div
            className="absolute w-6 h-6 bg-blue-600 rounded-full border-2 border-white shadow-lg z-20 transform -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{ 
              left: coordsToMapPosition(playerPosition.lat, playerPosition.lng).x,
              top: coordsToMapPosition(playerPosition.lat, playerPosition.lng).y
            }}
          >
            <motion.div
              className="absolute top-0 left-0 w-full h-full rounded-full bg-blue-400"
              initial={{ opacity: 0.4, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>
        )}
        
        {/* Location Detail Popup */}
        {hoveredLocation && (
          <div
            className="absolute bottom-4 left-4 max-w-sm z-30 glass-effect"
            style={{ 
              opacity: selectedLocation?.id === hoveredLocation.id ? 1 : 0.9 
            }}
          >
            <Card className="p-3 border-0 bg-transparent">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-bold">{hoveredLocation.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {hoveredLocation.description}
                  </p>
                </div>
                <Badge variant={hoveredLocation.unlocked ? "outline" : "secondary"}>
                  {hoveredLocation.unlocked ? (
                    <Unlock className="h-3 w-3 mr-1" />
                  ) : (
                    <Lock className="h-3 w-3 mr-1" />
                  )}
                  {hoveredLocation.difficulty}
                </Badge>
              </div>
              
              {hoveredLocation.unlocked && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {hoveredLocation.rewards.cash > 0 && (
                    <Badge variant="outline" className="bg-card/30">
                      <DollarSign className="h-3 w-3 mr-1 text-green-400" />
                      ${hoveredLocation.rewards.cash}
                    </Badge>
                  )}
                  {hoveredLocation.rewards.xp > 0 && (
                    <Badge variant="outline" className="bg-card/30">
                      <Zap className="h-3 w-3 mr-1 text-blue-400" />
                      {hoveredLocation.rewards.xp} XP
                    </Badge>
                  )}
                  {hoveredLocation.rewards.respect > 0 && (
                    <Badge variant="outline" className="bg-card/30">
                      <Heart className="h-3 w-3 mr-1 text-red-400" />
                      +{hoveredLocation.rewards.respect}
                    </Badge>
                  )}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
      
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                onClick={onRefreshLocation}
                disabled={isLoadingLocation}
              >
                <Navigation className={`h-4 w-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">Update your location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
              >
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="space-y-2 p-1">
                <p className="text-xs font-medium">Map Legend:</p>
                <div className="flex gap-2">
                  <div className="bg-red-700/80 p-1 rounded-full">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs">Crime</span>
                </div>
                <div className="flex gap-2">
                  <div className="bg-green-700/80 p-1 rounded-full">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs">Drugs</span>
                </div>
                <div className="flex gap-2">
                  <div className="bg-blue-700/80 p-1 rounded-full">
                    <MapPin className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs">Training</span>
                </div>
                <div className="flex gap-2">
                  <div className="bg-gray-800/80 p-1 rounded-full">
                    <Lock className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-xs">Locked</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default ChallengeMap;