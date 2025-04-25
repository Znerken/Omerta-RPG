import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Dumbbell, CircleDollarSign } from "lucide-react";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";

interface ActivityItem {
  id: number;
  type: 'crime' | 'training' | 'gang' | 'jail' | 'other';
  title: string;
  result: 'success' | 'failed' | 'completed' | 'jailed';
  reward?: {
    cash?: number;
    xp?: number;
    stat?: string;
    statValue?: number;
  };
  timestamp: Date;
}

interface ActivityTableProps {
  activities: ActivityItem[];
  limit?: number;
  loading?: boolean;
}

export function ActivityTable({ activities, limit, loading = false }: ActivityTableProps) {
  const displayActivities = limit ? activities.slice(0, limit) : activities;

  const getActivityIcon = (type: string, result: string) => {
    switch (type) {
      case 'crime':
        return (
          <span className={`w-8 h-8 rounded-full bg-dark-lighter flex items-center justify-center mr-3 ${
            result === 'success' ? 'text-success' : result === 'jailed' ? 'text-danger' : 'text-warning'
          }`}>
            <Briefcase className="h-4 w-4" />
          </span>
        );
      case 'training':
        return (
          <span className="w-8 h-8 rounded-full bg-dark-lighter flex items-center justify-center mr-3 text-blue-500">
            <Dumbbell className="h-4 w-4" />
          </span>
        );
      case 'gang':
        return (
          <span className="w-8 h-8 rounded-full bg-dark-lighter flex items-center justify-center mr-3 text-purple-500">
            <CircleDollarSign className="h-4 w-4" />
          </span>
        );
      default:
        return (
          <span className="w-8 h-8 rounded-full bg-dark-lighter flex items-center justify-center mr-3">
            <Briefcase className="h-4 w-4" />
          </span>
        );
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return (
          <Badge variant="outline" className="bg-success bg-opacity-20 text-success">
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-danger bg-opacity-20 text-danger">
            Failed
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-info bg-opacity-20 text-info">
            Completed
          </Badge>
        );
      case 'jailed':
        return (
          <Badge variant="outline" className="bg-danger bg-opacity-20 text-danger">
            Jailed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-surface rounded-lg p-4 flex justify-center items-center min-h-[200px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-32 bg-dark-lighter rounded mb-4"></div>
          <div className="h-64 w-full bg-dark-lighter rounded"></div>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-dark-surface rounded-lg p-4 text-center text-gray-400">
        No recent activity to display
      </div>
    );
  }

  return (
    <div className="bg-dark-surface rounded-lg overflow-hidden">
      <Table>
        <TableHeader className="bg-dark-lighter">
          <TableRow>
            <TableHead className="text-left text-sm font-medium text-gray-400">Activity</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Result</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Reward</TableHead>
            <TableHead className="text-left text-sm font-medium text-gray-400">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-800">
          {displayActivities.map((activity) => (
            <TableRow key={activity.id} className="hover:bg-dark-lighter">
              <TableCell className="py-3 px-4">
                <div className="flex items-center">
                  {getActivityIcon(activity.type, activity.result)}
                  <span>{activity.title}</span>
                </div>
              </TableCell>
              <TableCell className="py-3 px-4">
                {getResultBadge(activity.result)}
              </TableCell>
              <TableCell className="py-3 px-4">
                {activity.reward ? (
                  <div className="flex flex-col">
                    {activity.reward.cash !== undefined && (
                      <span className="text-green-500">{formatCurrency(activity.reward.cash)}</span>
                    )}
                    {activity.reward.xp !== undefined && (
                      <span className="text-blue-500 text-xs">+{activity.reward.xp} XP</span>
                    )}
                    {activity.reward.stat && (
                      <span className="text-gray-300">+{activity.reward.statValue} {activity.reward.stat}</span>
                    )}
                  </div>
                ) : activity.result === 'jailed' ? (
                  <span className="text-danger">Jailed (15m)</span>
                ) : null}
              </TableCell>
              <TableCell className="py-3 px-4 text-sm text-gray-400">
                {formatRelativeTime(activity.timestamp)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
