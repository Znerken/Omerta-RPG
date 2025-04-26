import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MafiaLayout } from "@/components/layout/mafia-layout";
import { Skeleton } from "@/components/ui/skeleton";
import ChallengeMap from "@/components/challenges/ChallengeMap";

// Location types
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

export default function LocationsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("map");
  
  // Fetch locations
  const { 
    data: locations,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<LocationChallenge[]>({
    queryKey: ["/api/locations"],
    retry: 1,
    refetchOnWindowFocus: false
  });
  
  // Handle location permission requests
  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'denied') {
          toast({
            title: "Location Permission Denied",
            description: "This feature requires location access to work properly.",
            variant: "destructive"
          });
        }
      });
    }
  }, []);
  
  // Filter locations by type
  const getFilteredLocations = (type: string) => {
    if (!locations) return [];
    return locations.filter(location => location.type === type);
  };
  
  // Handlers
  const handleRefresh = () => {
    refetch();
  };
  
  return (
    <MafiaLayout title="Territory Map" description="Take control of territories across the city to earn rewards. Visit locations in the real world, complete challenges, and build your criminal empire.">
      <div className="container mx-auto p-4">
        
        <Tabs defaultValue="map" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="map">Territory Map</TabsTrigger>
              <TabsTrigger value="hideouts">Hideouts</TabsTrigger>
              <TabsTrigger value="businesses">Businesses</TabsTrigger>
              <TabsTrigger value="special">Special</TabsTrigger>
            </TabsList>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
            </Button>
          </div>
          
          {isError ? (
            <div className="p-6 bg-red-500/20 rounded-lg border border-red-500/30 mb-4">
              <h3 className="text-lg font-bold">Error loading locations</h3>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : "Something went wrong. Please try again."}
              </p>
              <Button variant="destructive" size="sm" className="mt-2" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[300px] w-full rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-8 w-40" />
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                </div>
              </div>
            </div>
          ) : (
            <>
              <TabsContent value="map" className="pt-2">
                <ChallengeMap 
                  locations={locations || []} 
                  onRefresh={handleRefresh} 
                />
              </TabsContent>
              
              <TabsContent value="hideouts" className="pt-2">
                <ChallengeMap 
                  locations={getFilteredLocations("hideout")} 
                  onRefresh={handleRefresh} 
                />
              </TabsContent>
              
              <TabsContent value="businesses" className="pt-2">
                <ChallengeMap 
                  locations={getFilteredLocations("business")} 
                  onRefresh={handleRefresh} 
                />
              </TabsContent>
              
              <TabsContent value="special" className="pt-2">
                <ChallengeMap 
                  locations={getFilteredLocations("special")} 
                  onRefresh={handleRefresh} 
                />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </MafiaLayout>
  );
}