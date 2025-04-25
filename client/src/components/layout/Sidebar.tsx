import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn, getInitials, formatCurrency } from "@/lib/utils";
import { 
  LayoutDashboard, 
  User, 
  Briefcase, 
  Dumbbell, 
  Users, 
  FolderLock, 
  ShoppingBag, 
  MessageSquare, 
  Trophy, 
  LogOut 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SidebarProps {
  isMobile?: boolean;
  onItemClick?: () => void;
}

export function Sidebar({ isMobile = false, onItemClick }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="text-xl" /> },
    { href: "/profile", label: "Profile", icon: <User className="text-xl" /> },
    { href: "/crimes", label: "Crimes", icon: <Briefcase className="text-xl" /> },
    { href: "/training", label: "Training", icon: <Dumbbell className="text-xl" /> },
    { href: "/gang", label: "Gang", icon: <Users className="text-xl" /> },
    { href: "/jail", label: "Jail", icon: <FolderLock className="text-xl" /> },
    { href: "/inventory", label: "Inventory", icon: <ShoppingBag className="text-xl" /> },
    { href: "/messages", label: "Messages", icon: <MessageSquare className="text-xl" /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Trophy className="text-xl" /> },
  ];

  const handleNavClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex flex-col h-full py-6 overflow-y-auto bg-dark-surface">
      {!isMobile && (
        <div className="px-4 flex items-center mb-8">
          <h1 className="text-2xl font-heading text-secondary tracking-wide">MAFIA EMPIRE</h1>
        </div>
      )}
      
      <div className="px-4 mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <span className="font-heading text-xl">{user ? getInitials(user.username) : ""}</span>
          </div>
          <div>
            <h3 className="font-medium text-lg">{user.username}</h3>
            <span className="text-gray-400 text-sm flex items-center">
              <Trophy className="h-4 w-4 mr-1" /> Level {user.level}
            </span>
          </div>
        </div>
        
        <div className="bg-dark-lighter p-3 rounded-md">
          <div className="flex justify-between mb-1">
            <span className="text-xs text-gray-400">XP</span>
            <span className="text-xs text-gray-400">{user.xp} / {100 * Math.pow(user.level, 2)}</span>
          </div>
          <Progress className="h-2 bg-dark" value={(user.xp / (100 * Math.pow(user.level, 2))) * 100} />
          
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <div className="text-secondary font-mono text-lg font-bold">{formatCurrency(user.cash)}</div>
              <div className="text-xs text-gray-400">Cash</div>
            </div>
            <div>
              <div className="text-primary font-mono text-lg font-bold">{user.respect}</div>
              <div className="text-xs text-gray-400">Respect</div>
            </div>
          </div>
        </div>
      </div>
      
      <nav className="px-2 flex-1 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center space-x-3 p-2 rounded-md transition-colors",
              location === item.href ? "bg-dark-lighter" : "hover:bg-dark-lighter"
            )}
            onClick={handleNavClick}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      
      <div className="px-2 mt-6 pt-6 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-2 text-red-400 hover:bg-red-900 hover:bg-opacity-20 rounded-md"
        >
          <LogOut className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
