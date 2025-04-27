import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function DashboardPage() {
  const { gameUser: user, signOut, supabaseUser } = useSupabaseAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const queryClient = useQueryClient();
  
  // Debug logging for authentication state
  useEffect(() => {
    console.log("Dashboard rendering. Auth state:", { 
      supabaseUser: !!supabaseUser, 
      gameUser: !!user 
    });
    
    // If we have a supabase user but no game user, try to force refresh the data
    if (supabaseUser && !user) {
      console.log("Have Supabase user but no game user - forcing refresh of user data");
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }
    
    // Collect debug info in state
    setDebugInfo({
      hasSupabaseUser: !!supabaseUser,
      hasGameUser: !!user,
      supabaseId: supabaseUser?.id,
      gameUserId: user?.id,
      username: user?.username,
      email: supabaseUser?.email || (user?.email)
    });
  }, [user, supabaseUser, queryClient]);
  
  // Emergency fallback - always show something
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center bg-gradient-to-br from-red-600 to-red-400 bg-clip-text text-transparent">OMERTÀ</h1>
      
      {/* Debug panel */}
      <div className="bg-black/40 border border-red-500 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-bold mb-3 text-red-400">Debug Information</h2>
        <div className="text-left">
          <p>Has Supabase user: {debugInfo?.hasSupabaseUser ? "Yes" : "No"}</p>
          <p>Has Game user: {debugInfo?.hasGameUser ? "Yes" : "No"}</p>
          <p>Supabase ID: {debugInfo?.supabaseId || "Not found"}</p>
          <p>Game User ID: {debugInfo?.gameUserId || "Not found"}</p>
          <p>Username: {debugInfo?.username || "Not found"}</p>
          <p>Email: {debugInfo?.email || "Not found"}</p>
        </div>
        
        <div className="mt-4">
          <button 
            onClick={() => signOut()} 
            className="bg-red-900/50 hover:bg-red-900/70 text-white px-4 py-2 rounded-md border border-red-900/50 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Show normal UI only if user exists */}
      {user && (
        <>
          <div className="bg-black/40 border border-white/10 rounded-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-black/60 to-red-900/30 flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="text-red-400 text-3xl">👤</div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{user.username}</h2>
                <p className="text-gray-400">Level {user.level}</p>
                
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>XP: {user.xp || 0}</span>
                    <span>{Math.min(100, Math.round(((user.xp || 0) / (user.level * 100)) * 100))}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full" 
                      style={{ width: `${Math.min(100, Math.round(((user.xp || 0) / (user.level * 100)) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="bg-black/30 p-3 rounded-lg border border-white/10">
                  <div className="text-green-400">💰</div>
                  <div className="font-bold">${user.cash?.toLocaleString() || 0}</div>
                  <div className="text-xs text-gray-500">Cash</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-black/50 transition-colors cursor-pointer">
              <div className="text-red-400 text-4xl mb-2">🔫</div>
              <h3 className="font-semibold">Crimes</h3>
              <p className="text-sm text-gray-400">Rob banks, steal cars</p>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-black/50 transition-colors cursor-pointer">
              <div className="text-yellow-400 text-4xl mb-2">💪</div>
              <h3 className="font-semibold">Training</h3>
              <p className="text-sm text-gray-400">Improve your skills</p>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-black/50 transition-colors cursor-pointer">
              <div className="text-emerald-400 text-4xl mb-2">💊</div>
              <h3 className="font-semibold">Drugs</h3>
              <p className="text-sm text-gray-400">Trade and produce</p>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-black/50 transition-colors cursor-pointer">
              <div className="text-blue-400 text-4xl mb-2">🏦</div>
              <h3 className="font-semibold">Banking</h3>
              <p className="text-sm text-gray-400">Manage your finances</p>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-black/50 transition-colors cursor-pointer">
              <div className="text-purple-400 text-4xl mb-2">🎰</div>
              <h3 className="font-semibold">Casino</h3>
              <p className="text-sm text-gray-400">Try your luck</p>
            </div>
            
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:bg-black/50 transition-colors cursor-pointer">
              <div className="text-orange-400 text-4xl mb-2">👨‍👨‍👦‍👦</div>
              <h3 className="font-semibold">Family</h3>
              <p className="text-sm text-gray-400">Join a crime family</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}