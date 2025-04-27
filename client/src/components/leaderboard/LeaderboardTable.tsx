import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, User } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LeaderboardTableProps {
  defaultTab?: string;
}

export function LeaderboardTable({ defaultTab = "level" }: LeaderboardTableProps) {
  const { user } = useAuth();
  
  const { data: levelLeaderboard, isLoading: isLoadingLevel } = useQuery({
    queryKey: ["/api/leaderboard?type=level"],
  });
  
  const { data: cashLeaderboard, isLoading: isLoadingCash } = useQuery({
    queryKey: ["/api/leaderboard?type=cash"],
  });
  
  const { data: respectLeaderboard, isLoading: isLoadingRespect } = useQuery({
    queryKey: ["/api/leaderboard?type=respect"],
  });
  
  const { data: gangLeaderboard, isLoading: isLoadingGangs } = useQuery({
    queryKey: ["/api/leaderboard?type=gangs"],
  });

  const renderUserTable = (data: any[], valueKey: string, valuePrefix: string = "", isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          No data available
        </div>
      );
    }

    return (
      <Table>
        <TableHeader className="bg-dark-lighter">
          <TableRow>
            <TableHead className="text-left text-sm font-medium text-gray-400">Rank</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Player</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Level</TableHead>
            <TableHead className="text-right text-sm font-medium text-gray-400">{valueKey === 'cash' ? 'Cash' : (valueKey === 'respect' ? 'Respect' : 'XP')}</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Gang</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-800">
          {data.map((player, index) => {
            const isCurrentUser = user && player.id === user.id;
            return (
              <TableRow 
                key={player.id} 
                className={`hover:bg-dark-lighter ${isCurrentUser ? 'bg-dark-lighter/50' : ''}`}
              >
                <TableCell className="py-3 px-4 font-mono font-bold text-secondary">#{index + 1}</TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex items-center">
                    <Link href={`/player/${player.id}`}>
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        className={cn(
                          "relative flex items-center justify-center cursor-pointer",
                          isCurrentUser ? "animate-pulse-slow" : ""
                        )}
                      >
                        {/* Animated Glow Effect */}
                        <div className={cn(
                          "absolute inset-0 rounded-full",
                          isCurrentUser 
                            ? "bg-gradient-to-r from-gold-400 to-gold-600 animate-pulse-slow animate-glow" 
                            : index === 0 
                              ? "bg-gradient-to-r from-gold-400 to-gold-600 animate-pulse-slow"
                              : index === 1 
                                ? "bg-gradient-to-r from-silver-300 to-silver-500 animate-pulse-slow"
                                : index === 2 
                                  ? "bg-gradient-to-r from-bronze-300 to-bronze-600 animate-pulse-slow"
                                  : "bg-gradient-to-r from-slate-700 to-slate-900"
                        )} 
                        style={{ 
                          filter: isCurrentUser ? "blur(6px)" : index < 3 ? "blur(4px)" : "blur(2px)",
                          opacity: isCurrentUser ? 0.8 : index < 3 ? 0.7 : 0.3,
                          transform: "scale(1.2)",
                        }}/>
                        
                        {/* Avatar Frame */}
                        <div className={cn(
                          "absolute inset-0 rounded-full border-2",
                          isCurrentUser 
                            ? "border-gold-500"
                            : index < 3 
                              ? index === 0 
                                ? "border-gold-500" 
                                : index === 1 
                                  ? "border-silver-400" 
                                  : "border-bronze-500"
                              : "border-slate-600"
                        )} 
                        style={{ transform: "scale(1.05)" }}/>
                        
                        {/* Avatar Image */}
                        <div className="h-10 w-10 relative z-10 overflow-hidden rounded-full">
                          {player.avatar ? (
                            <img 
                              src={player.avatar} 
                              alt={player.username} 
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <div className={cn(
                              "h-full w-full flex items-center justify-center rounded-full text-white",
                              index === 0 
                                ? "bg-gradient-to-br from-gold-400 to-gold-600" 
                                : index === 1 
                                  ? "bg-gradient-to-br from-silver-300 to-silver-500" 
                                  : index === 2 
                                    ? "bg-gradient-to-br from-bronze-300 to-bronze-600"
                                    : "bg-gradient-to-br from-slate-700 to-slate-900"
                            )}>
                              {getInitials(player.username)}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    </Link>
                    <Link href={`/player/${player.id}`} className="ml-2 hover:underline">
                      <span className={isCurrentUser ? 'font-medium' : ''}>
                        {player.username}
                        {isCurrentUser && (
                          <Badge className="ml-2 bg-secondary text-black">YOU</Badge>
                        )}
                      </span>
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">Level {player.level}</TableCell>
                <TableCell className="py-3 px-4 font-mono text-right">
                  {valueKey === 'cash' 
                    ? formatCurrency(player[valueKey]) 
                    : `${valuePrefix}${player[valueKey].toLocaleString()}`}
                </TableCell>
                <TableCell className="py-3 px-4">
                  {player.gangId ? (
                    <Badge variant="outline" className="bg-primary bg-opacity-20 text-primary">
                      Gang Name
                    </Badge>
                  ) : (
                    <span className="text-gray-500 text-sm">No Gang</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  const renderGangTable = (data: any[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          No gangs available
        </div>
      );
    }

    return (
      <Table>
        <TableHeader className="bg-dark-lighter">
          <TableRow>
            <TableHead className="text-left text-sm font-medium text-gray-400">Rank</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Gang</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Tag</TableHead>
            <TableHead className="text-right text-sm font-medium text-gray-400">Bank Balance</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Members</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-800">
          {data.map((gang, index) => (
            <TableRow key={gang.id} className="hover:bg-dark-lighter">
              <TableCell className="py-3 px-4 font-mono font-bold text-secondary">#{index + 1}</TableCell>
              <TableCell className="py-3 px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center mr-2">
                    <span className="text-sm font-heading">{gang.tag}</span>
                  </div>
                  <span>{gang.name}</span>
                </div>
              </TableCell>
              <TableCell className="py-3 px-4">{gang.tag}</TableCell>
              <TableCell className="py-3 px-4 font-mono text-right">{formatCurrency(gang.bankBalance)}</TableCell>
              <TableCell className="py-3 px-4">
                <Badge variant="outline" className="bg-dark-lighter">
                  {/* This would normally come from the API */}
                  {Math.floor(Math.random() * 10) + 1} Members
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="bg-dark-lighter mb-4">
        <TabsTrigger value="level">Level</TabsTrigger>
        <TabsTrigger value="cash">Cash</TabsTrigger>
        <TabsTrigger value="respect">Respect</TabsTrigger>
        <TabsTrigger value="gangs">Gangs</TabsTrigger>
      </TabsList>
      
      <TabsContent value="level" className="rounded-lg overflow-hidden bg-dark-surface">
        {renderUserTable(levelLeaderboard || [], 'xp', '', isLoadingLevel)}
      </TabsContent>
      
      <TabsContent value="cash" className="rounded-lg overflow-hidden bg-dark-surface">
        {renderUserTable(cashLeaderboard || [], 'cash', '', isLoadingCash)}
      </TabsContent>
      
      <TabsContent value="respect" className="rounded-lg overflow-hidden bg-dark-surface">
        {renderUserTable(respectLeaderboard || [], 'respect', '', isLoadingRespect)}
      </TabsContent>
      
      <TabsContent value="gangs" className="rounded-lg overflow-hidden bg-dark-surface">
        {renderGangTable(gangLeaderboard || [], isLoadingGangs)}
      </TabsContent>
    </Tabs>
  );
}
