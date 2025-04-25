import { useWebSocketContext } from "@/hooks/use-websocket-context";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const { isConnected } = useWebSocketContext();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            variant="outline" 
            className={`px-2 py-1 text-xs cursor-default transition-all duration-200 ${
              isConnected 
                ? "border-green-500 bg-green-500/10 text-green-500" 
                : "border-red-500 bg-red-500/10 text-red-500"
            }`}
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isConnected 
            ? "You are connected to the server. Your online status is visible to friends." 
            : "You are disconnected. Your status appears offline to others."
          }</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}