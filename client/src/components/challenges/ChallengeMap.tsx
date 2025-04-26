import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Building, 
  Warehouse, 
  Home, 
  Star, 
  Clock, 
  DollarSign, 
  Award, 
  Heart,
  Lock,
  CheckCircle,
  TimerReset,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistance, formatDistanceToNow } from "date-fns";

// Types
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

export default function ChallengeMap({ locations, onRefresh }: ChallengeMapProps) {
  const { toast } = useToast();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyLocations, setNearbyLocations] = useState<LocationChallenge[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationChallenge | null>(null);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [completingChallenge, setCompletingChallenge] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Check for geolocation availability
  useEffect(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support location services.",
        variant: "destructive"
      });
      return;
    }
    
    // Request location
    getLocation();
  }, []);
  
  // Get user's location
  const getLocation = () => {
    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        
        // Update server with user's location and get nearby locations
        try {
          const response = await apiRequest('POST', '/api/locations/update', { latitude, longitude });
          const data = await response.json();
          if (data.nearbyLocations) {
            setNearbyLocations(data.nearbyLocations);
          }
        } catch (error) {
          console.error("Failed to update location:", error);
        } finally {
          setUpdatingLocation(false);
        }
      },
      (error) => {
        setUpdatingLocation(false);
        toast({
          title: "Location Error",
          description: getGeolocationErrorMessage(error),
          variant: "destructive"
        });
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };
  
  // Helper to get error message
  const getGeolocationErrorMessage = (error: GeolocationPositionError) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Location access was denied. Please enable location services for this site.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable. Please try again later.";
      case error.TIMEOUT:
        return "Request to get location timed out. Please try again.";
      default:
        return "An unknown error occurred.";
    }
  };
  
  // Check if location is available (not on cooldown)
  const isLocationAvailable = (location: LocationChallenge): boolean => {
    if (!location.last_completed) return true;
    
    const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
    const lastCompleted = new Date(location.last_completed);
    const now = new Date();
    
    return (now.getTime() - lastCompleted.getTime()) >= cooldownMs;
  };
  
  // Get cooldown remaining time
  const getCooldownRemaining = (location: LocationChallenge): string => {
    if (!location.last_completed) return "";
    
    const cooldownMs = location.cooldown_hours * 60 * 60 * 1000;
    const lastCompleted = new Date(location.last_completed);
    const now = new Date();
    const timeElapsed = now.getTime() - lastCompleted.getTime();
    
    if (timeElapsed >= cooldownMs) return "Available now";
    
    const remainingTime = cooldownMs - timeElapsed;
    const futureDate = new Date(now.getTime() + remainingTime);
    return `in ${formatDistanceToNow(futureDate, { addSuffix: false })}`;
  };
  
  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of Earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI/180);
  };
  
  // Format distance for display
  const formatDistance = (distanceKm: number): string => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  };
  
  // Get type icon
  const getLocationIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'hideout':
        return <Home className="h-5 w-5" />;
      case 'business':
        return <Building className="h-5 w-5" />;
      case 'warehouse':
        return <Warehouse className="h-5 w-5" />;
      case 'special':
        return <Star className="h-5 w-5 text-yellow-500" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };
  
  // Get difficulty color
  const getDifficultyColor = (difficulty: string): string => {
    switch(difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'expert':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };
  
  // Start/complete a challenge
  const handleStartChallenge = async (locationId: number) => {
    setCompletingChallenge(true);
    try {
      // Start the challenge
      const startResponse = await apiRequest('POST', `/api/locations/${locationId}/start`);
      
      if (!startResponse.ok) {
        const error = await startResponse.json();
        if (error.error === "Too far from location") {
          toast({
            title: "Too Far Away",
            description: `You must be within ${error.maxDistance}km of the location. Current distance: ${error.distance.toFixed(2)}km.`,
            variant: "destructive"
          });
        } else if (error.error === "Location on cooldown") {
          toast({
            title: "Location on Cooldown",
            description: `This location is on cooldown. Available in ${error.remainingHours} hours.`,
            variant: "destructive"
          });
        } else {
          toast({
            title: "Challenge Error",
            description: error.error || "An error occurred",
            variant: "destructive"
          });
        }
        setCompletingChallenge(false);
        return;
      }
      
      // Complete the challenge
      const completeResponse = await apiRequest('POST', `/api/locations/${locationId}/complete`);
      
      if (!completeResponse.ok) {
        const error = await completeResponse.json();
        toast({
          title: "Challenge Error",
          description: error.error || "An error occurred",
          variant: "destructive"
        });
        setCompletingChallenge(false);
        return;
      }
      
      // Show success
      const result = await completeResponse.json();
      toast({
        title: "Challenge Completed!",
        description: `Earned: $${result.rewards.cash}, ${result.rewards.xp} XP, ${result.rewards.respect} Respect`,
        variant: "default"
      });
      
      // Refresh data
      onRefresh();
      
    } catch (error) {
      console.error("Challenge error:", error);
      toast({
        title: "Challenge Error",
        description: "Failed to complete challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCompletingChallenge(false);
    }
  };
  
  // Get distance to location
  const getDistanceToLocation = (location: LocationChallenge): string | null => {
    if (!userLocation) return null;
    
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      location.latitude,
      location.longitude
    );
    
    return formatDistance(distance);
  };
  
  return (
    <div>
      {/* Location Status Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            {userLocation ? 'Your Territory Status' : 'Location Services'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {userLocation 
              ? `Current location: ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`
              : 'Please enable location services to see nearby territories'}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={getLocation}
          disabled={updatingLocation}
        >
          {updatingLocation ? <RefreshCw className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4 mr-2" />}
          {updatingLocation ? 'Updating...' : 'Update Location'}
        </Button>
      </div>
      
      {/* Map container */}
      <div ref={mapContainerRef} className="relative mb-8 bg-black/20 rounded-lg p-6 h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-opacity-50 flex items-center justify-center">
          <h2 className="text-xl font-semibold text-white">Interactive Territory Map</h2>
          <p className="text-muted-foreground text-sm">Coming soon...</p>
        </div>
      </div>
      
      {/* Nearby locations */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">
          {nearbyLocations.length > 0 
            ? 'Nearby Territories' 
            : userLocation 
              ? 'No territories nearby' 
              : 'Update your location to see nearby territories'}
        </h3>
        
        {nearbyLocations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyLocations.map(location => (
              <Card key={location.id} className="overflow-hidden hover:shadow-lg transition-all duration-300">
                <CardHeader className="bg-black/30">
                  <div className="flex justify-between">
                    <Badge variant="outline" className={getDifficultyColor(location.difficulty)}>
                      {location.difficulty}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getLocationIcon(location.type)}
                      {location.type}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2">{location.name}</CardTitle>
                  <CardDescription>
                    {location.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      <span>${location.rewards.cash}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-500" />
                      <span>{location.rewards.xp} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>{location.rewards.respect} Respect</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>{location.cooldown_hours}h cooldown</span>
                    </div>
                  </div>
                  
                  {!location.unlocked ? (
                    <div className="p-2 rounded-md bg-black/20 flex items-center gap-2 text-sm">
                      <Lock className="h-4 w-4" /> 
                      <span>This location is locked</span>
                    </div>
                  ) : !isLocationAvailable(location) ? (
                    <div className="p-2 rounded-md bg-black/20 flex items-center gap-2 text-sm">
                      <TimerReset className="h-4 w-4" />
                      <span>Available {getCooldownRemaining(location)}</span>
                    </div>
                  ) : null}
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <div className="text-sm text-muted-foreground">
                    {getDistanceToLocation(location) && (
                      <span>Distance: {getDistanceToLocation(location)}</span>
                    )}
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!location.unlocked || !isLocationAvailable(location) || completingChallenge}
                    onClick={() => handleStartChallenge(location.id)}
                  >
                    {completingChallenge ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Complete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* All locations */}
      <div className="space-y-6 mt-10">
        <h3 className="text-xl font-semibold">All Territories ({locations.length})</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(location => (
            <Card key={location.id} className="overflow-hidden">
              <CardHeader className="bg-black/20">
                <div className="flex justify-between">
                  <Badge variant="outline" className={getDifficultyColor(location.difficulty)}>
                    {location.difficulty}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getLocationIcon(location.type)}
                    {location.type}
                  </Badge>
                </div>
                <CardTitle className="mt-2">{location.name}</CardTitle>
                <CardDescription>
                  {location.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span>${location.rewards.cash}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-blue-500" />
                    <span>{location.rewards.xp} XP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span>{location.rewards.respect} Respect</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span>{location.cooldown_hours}h cooldown</span>
                  </div>
                </div>
                
                {!location.unlocked ? (
                  <div className="p-2 rounded-md bg-black/20 flex items-center gap-2 text-sm">
                    <Lock className="h-4 w-4" /> 
                    <span>This location is locked</span>
                  </div>
                ) : !isLocationAvailable(location) ? (
                  <div className="p-2 rounded-md bg-black/20 flex items-center gap-2 text-sm">
                    <TimerReset className="h-4 w-4" />
                    <span>Available {getCooldownRemaining(location)}</span>
                  </div>
                ) : null}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  {getDistanceToLocation(location) && (
                    <span>Distance: {getDistanceToLocation(location)}</span>
                  )}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!location.unlocked || !isLocationAvailable(location) || !userLocation}
                  onClick={() => handleStartChallenge(location.id)}
                >
                  {completingChallenge ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                  Target
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}