import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Coins, History, BarChart, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CasinoLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  userBalance: number;
}

export function CasinoLayout({ children, activeTab, onTabChange, userBalance }: CasinoLayoutProps) {
  // Define navigation items
  const navItems = [
    { id: 'games', label: 'Games', icon: <Package className="w-5 h-5" /> },
    { id: 'bets', label: 'History', icon: <History className="w-5 h-5" /> },
    { id: 'stats', label: 'Stats', icon: <BarChart className="w-5 h-5" /> },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Casino Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-black z-0 overflow-hidden"
        style={{ 
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(60, 0, 0, 0.15) 0%, transparent 45%), 
                            radial-gradient(circle at 80% 80%, rgba(60, 0, 0, 0.1) 0%, transparent 65%)` 
        }}
      >
        {/* Decorative patterns */}
        <div className="absolute inset-0 opacity-5" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '80px 80px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Balance Bar */}
        <div className="mb-8 bg-black/40 backdrop-blur-md rounded-lg border border-amber-900/30 shadow-lg overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center bg-gradient-to-r from-amber-900/60 to-transparent">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-amber-900/50 border border-amber-500/50 mr-4">
                <Coins className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-amber-100">CASINO ROYALE</h2>
                <p className="text-amber-300/80 text-sm">Test your luck, Don</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-amber-200/70">Your Balance</p>
              <div className="text-2xl font-mono font-bold text-amber-400">
                ${userBalance.toLocaleString()}
              </div>
            </div>
          </div>
          <nav className="px-4 pb-1">
            <ul className="flex space-x-2">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "relative px-4 py-2 text-sm font-medium rounded-t-lg transition-colors",
                      activeTab === item.id
                        ? "text-amber-200"
                        : "text-gray-400 hover:text-amber-200/70"
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main content area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-4"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}