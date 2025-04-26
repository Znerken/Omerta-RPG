import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Timer,
  Trophy,
  Check,
  XCircle,
  DollarSign,
  Star
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LocationChallenge {
  id: number;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type: string;
  difficulty: string;
  rewards: {
    cash: number;
    xp: number;
    respect: number;
    special_item_id: number | null;
  };
  cooldown_hours: number;
  unlocked: boolean;
  image_url: string | null;
  last_completed?: Date | null;
}

interface ChallengeMapProps {
  locations: LocationChallenge[];
  onRefresh: () => void;
}

const ChallengeMap: React.FC<ChallengeMapProps> = ({ locations, onRefresh }) => {
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<LocationChallenge | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<number | null>(null);
  const [inProgress, setInProgress] = useState<boolean>(false);

  // Get user location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          
          // Send location to server
          updateServerLocation(latitude, longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location Error",
            description: "Unable to get your location. Some features may be limited.",
            variant: "destructive"
          });
          
          // Use default location for demo purposes
          setUserLocation({ latitude: 40.7128, longitude: -74.0060 }); // New York City
          updateServerLocation(40.7128, -74.0060);
        }
      );
    } else {
      toast({
        title: "Location Not Supported",
        description: "Your browser does not support geolocation.",
        variant: "destructive"
      });
    }
  }, []);

  // Update server with user location
  const updateServerLocation = async (latitude: number, longitude: number) => {
    try {
      const response = await apiRequest("POST", "/api/location/update", {
        latitude,
        longitude
      });
      
      const data = await response.json();
      console.log("Server location updated:", data);
      
      if (data.nearbyLocations?.length > 0) {
        toast({
          title: "Nearby Locations",
          description: `Found ${data.nearbyLocations.length} nearby locations!`,
        });
      }
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  // Format distance to be more readable
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  };

  // Start a challenge
  const startChallenge = async (locationId: number) => {
    try {
      setInProgress(true);
      const response = await apiRequest("POST", `/api/locations/${locationId}/start`);
      
      if (response.ok) {
        const data = await response.json();
        setActiveChallenge(locationId);
        toast({
          title: "Challenge Started",
          description: "Complete the objective to earn rewards!",
        });
      } else {
        const error = await response.json();
        
        if (error.error === "Too far from location") {
          toast({
            title: "Too Far Away",
            description: `You need to be within ${error.maxDistance}km of this location. Current distance: ${formatDistance(error.distance)}.`,
            variant: "destructive"
          });
        } else if (error.error === "Location on cooldown") {
          toast({
            title: "On Cooldown",
            description: `This location is on cooldown for ${error.remainingHours} more hour(s).`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Error",
            description: error.error || "Failed to start challenge",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error starting challenge:", error);
      toast({
        title: "Error",
        description: "Failed to start challenge",
        variant: "destructive"
      });
    } finally {
      setInProgress(false);
    }
  };

  // Complete a challenge
  const completeChallenge = async (locationId: number) => {
    try {
      setInProgress(true);
      const response = await apiRequest("POST", `/api/locations/${locationId}/complete`);
      
      if (response.ok) {
        const data = await response.json();
        setActiveChallenge(null);
        toast({
          title: "Challenge Completed!",
          description: `Earned $${data.rewards.cash}, ${data.rewards.xp} XP, and ${data.rewards.respect} respect.`,
          variant: "success"
        });
        
        // Refresh locations
        onRefresh();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to complete challenge",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast({
        title: "Error",
        description: "Failed to complete challenge",
        variant: "destructive"
      });
    } finally {
      setInProgress(false);
    }
  };

  const isLocationAvailable = (location: LocationChallenge): boolean => {
    if (!location.unlocked) return false;
    
    if (location.last_completed) {
      const lastCompleted = new Date(location.last_completed);
      const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
      const now = new Date();
      
      if (now.getTime() - lastCompleted.getTime() < cooldownMs) {
        return false;
      }
    }
    
    return true;
  };

  const getCooldownRemaining = (location: LocationChallenge): string => {
    if (!location.last_completed) return "Available";
    
    const lastCompleted = new Date(location.last_completed);
    const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
    const now = new Date();
    const remainingMs = Math.max(0, cooldownMs - (now.getTime() - lastCompleted.getTime()));
    
    if (remainingMs <= 0) return "Available";
    
    const remainingHrs = Math.ceil(remainingMs / (1000 * 60 * 60));
    const remainingMins = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (remainingHrs > 0) {
      return `${remainingHrs} hour(s) remaining`;
    } else {
      return `${remainingMins} minute(s) remaining`;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Territory Map</h2>
        <div className="bg-black/20 rounded-lg p-4 min-h-[300px] relative">
          <div className="mb-4 text-center">
            {userLocation ? (
              <p className="text-sm">Your location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}</p>
            ) : (
              <p className="text-sm">Obtaining your location...</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locations.map(location => {
              const distance = userLocation 
                ? calculateDistance(
                    userLocation.latitude, 
                    userLocation.longitude, 
                    location.latitude, 
                    location.longitude
                  ) 
                : null;
              
              const isNearby = distance !== null && distance <= 1; // Within 1km
              const isAvailable = isLocationAvailable(location);
              
              return (
                <Card 
                  key={location.id}
                  className={`cursor-pointer transition-transform duration-200 ${
                    selectedLocation?.id === location.id ? 'ring-2 ring-primary' : ''
                  } ${!location.unlocked ? 'opacity-60' : ''}`}
                  onClick={() => setSelectedLocation(location)}
                >
                  <CardContent className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold truncate">{location.name}</h3>
                      <Badge variant={location.difficulty === "easy" ? "default" : location.difficulty === "medium" ? "secondary" : "destructive"}>
                        {location.difficulty}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center mt-2 mb-2 text-xs text-muted-foreground gap-1">
                      <MapPin size={14} />
                      {distance ? (
                        <span className={isNearby ? 'text-green-500' : ''}>
                          {formatDistance(distance)} away
                        </span>
                      ) : (
                        <span>Distance unknown</span>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <div className="text-xs flex items-center gap-1">
                        <Timer size={14} />
                        <span className={isAvailable ? 'text-green-500' : 'text-red-500'}>
                          {getCooldownRemaining(location)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold mb-4">Location Details</h2>
        {selectedLocation ? (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">{selectedLocation.name}</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant={selectedLocation.difficulty === "easy" ? "default" : selectedLocation.difficulty === "medium" ? "secondary" : "destructive"}>
                        {selectedLocation.difficulty}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Difficulty: {selectedLocation.difficulty}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <p className="text-sm text-muted-foreground mb-4">{selectedLocation.description}</p>
              
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-black/20 p-3 rounded-lg">
                  <h4 className="text-xs uppercase tracking-wider mb-2">Location</h4>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span className="text-sm">
                      {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                    </span>
                  </div>
                </div>
                
                <div className="bg-black/20 p-3 rounded-lg">
                  <h4 className="text-xs uppercase tracking-wider mb-2">Cooldown</h4>
                  <div className="flex items-center gap-2">
                    <Timer size={16} />
                    <span className="text-sm">
                      {selectedLocation.cooldown_hours} hours
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/20 p-3 rounded-lg mb-4">
                <h4 className="text-xs uppercase tracking-wider mb-2">Rewards</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex items-center gap-1">
                    <DollarSign size={16} className="text-green-500" />
                    <span className="text-sm">${selectedLocation.rewards.cash}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-yellow-500" />
                    <span className="text-sm">{selectedLocation.rewards.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy size={16} className="text-purple-500" />
                    <span className="text-sm">{selectedLocation.rewards.respect} Respect</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                {!selectedLocation.unlocked ? (
                  <Button disabled variant="secondary" className="w-full">
                    <XCircle className="mr-2 h-4 w-4" />
                    Locked
                  </Button>
                ) : !isLocationAvailable(selectedLocation) ? (
                  <Button disabled className="w-full">
                    <Timer className="mr-2 h-4 w-4" />
                    {getCooldownRemaining(selectedLocation)}
                  </Button>
                ) : activeChallenge === selectedLocation.id ? (
                  <Button 
                    onClick={() => completeChallenge(selectedLocation.id)} 
                    className="w-full" 
                    disabled={inProgress}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Complete Challenge
                  </Button>
                ) : (
                  <Button 
                    onClick={() => startChallenge(selectedLocation.id)} 
                    variant="outline" 
                    className="w-full"
                    disabled={inProgress || Boolean(activeChallenge)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Start Challenge
                  </Button>
                )}
              </div>
              
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">Select a location to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChallengeMap;