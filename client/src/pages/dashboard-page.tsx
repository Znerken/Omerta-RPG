import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getSession, getCurrentUser } from '@/lib/supabase';
import { Link } from 'wouter';

export default function DashboardPage() {
  const { gameUser: user, signOut, supabaseUser } = useSupabaseAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const queryClient = useQueryClient();
  const [directUserData, setDirectUserData] = useState<any>(null);
  
  // Always fetch user data directly on load
  useEffect(() => {
    async function fetchDirectUserData() {
      try {
        console.log("Directly fetching user data from API");
        const res = await apiRequest('GET', '/api/user');
        if (res.ok) {
          const userData = await res.json();
          console.log("Directly fetched user data:", userData);
          setDirectUserData(userData);
          // Update global state
          queryClient.setQueryData(['/api/user'], userData);
        } else {
          console.log("Failed to fetch user data directly:", res.status);
        }
      } catch (err) {
        console.error("Error fetching user data directly:", err);
      }
    }
    
    fetchDirectUserData();
  }, [queryClient]);
  
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
      gameUserId: user?.id || directUserData?.id,
      username: user?.username || directUserData?.username,
      email: supabaseUser?.email || user?.email || directUserData?.email
    });
  }, [user, supabaseUser, directUserData, queryClient]);

  // Use data from any available source (for component rendering)
  const userData = user || directUserData;
  
  // Calculate stats and properties with fallbacks to avoid errors
  const level = userData?.level || 1;
  const xp = userData?.xp || 0;
  const cash = userData?.cash || 0;
  const xpPercentage = Math.min(100, Math.round((xp / (level * 100)) * 100));
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header section */}
      <header className="bg-black/40 border-b border-gray-800 shadow-lg">
        <div className="container mx-auto p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-500 to-red-300 bg-clip-text text-transparent">
            OMERTÀ
          </h1>
          {userData && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm">
                <span className="text-green-400">${cash.toLocaleString()}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-white text-sm rounded transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {!userData && (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your profile...</p>
          </div>
        </div>
      )}

      {userData && (
        <div className="container mx-auto p-4">
          {/* Player profile card */}
          <div className="bg-black/30 rounded-lg p-6 mb-8 border border-gray-800">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-black/60 to-red-900/30 flex items-center justify-center border-2 border-red-900/30">
                {userData.avatar ? (
                  <img src={userData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className="text-red-400 text-5xl">👤</div>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white">{userData.username}</h2>
                <p className="text-gray-400 mb-2">Level {level}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between text-xs mb-1 text-gray-400">
                    <span>XP: {xp}</span>
                    <span>{xpPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full" 
                      style={{ width: `${xpPercentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4 text-center">
                  <div className="bg-black/30 p-3 rounded-lg border border-gray-800 min-w-[100px]">
                    <div className="text-green-400 text-xl">💰</div>
                    <div className="font-bold">${cash.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Cash</div>
                  </div>
                  
                  <div className="bg-black/30 p-3 rounded-lg border border-gray-800 min-w-[100px]">
                    <div className="text-purple-400 text-xl">👑</div>
                    <div className="font-bold">{userData.respect || 0}</div>
                    <div className="text-xs text-gray-500">Respect</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Gameplay options */}
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Quick Actions</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Link href="/crimes">
              <a className="bg-black/30 border border-gray-800 hover:border-red-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-red-400 text-3xl mb-2">🔫</div>
                <h3 className="font-medium">Crimes</h3>
              </a>
            </Link>
            
            <Link href="/training">
              <a className="bg-black/30 border border-gray-800 hover:border-yellow-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-yellow-400 text-3xl mb-2">💪</div>
                <h3 className="font-medium">Training</h3>
              </a>
            </Link>
            
            <Link href="/drugs">
              <a className="bg-black/30 border border-gray-800 hover:border-emerald-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-emerald-400 text-3xl mb-2">💊</div>
                <h3 className="font-medium">Drugs</h3>
              </a>
            </Link>
            
            <Link href="/banking">
              <a className="bg-black/30 border border-gray-800 hover:border-blue-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-blue-400 text-3xl mb-2">🏦</div>
                <h3 className="font-medium">Banking</h3>
              </a>
            </Link>
            
            <Link href="/casino">
              <a className="bg-black/30 border border-gray-800 hover:border-purple-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-purple-400 text-3xl mb-2">🎰</div>
                <h3 className="font-medium">Casino</h3>
              </a>
            </Link>
            
            <Link href="/gang">
              <a className="bg-black/30 border border-gray-800 hover:border-orange-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-orange-400 text-3xl mb-2">👨‍👨‍👦‍👦</div>
                <h3 className="font-medium">Family</h3>
              </a>
            </Link>
          </div>

          {/* Secondary actions */}
          <h2 className="text-xl font-semibold mb-4 text-gray-300">Other Activities</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Link href="/locations">
              <a className="bg-black/30 border border-gray-800 hover:border-indigo-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-indigo-400 text-3xl mb-2">🗺️</div>
                <h3 className="font-medium">Locations</h3>
              </a>
            </Link>
            
            <Link href="/messages">
              <a className="bg-black/30 border border-gray-800 hover:border-pink-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-pink-400 text-3xl mb-2">💬</div>
                <h3 className="font-medium">Messages</h3>
              </a>
            </Link>
            
            <Link href="/inventory">
              <a className="bg-black/30 border border-gray-800 hover:border-amber-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-amber-400 text-3xl mb-2">🎒</div>
                <h3 className="font-medium">Inventory</h3>
              </a>
            </Link>
            
            <Link href="/achievements">
              <a className="bg-black/30 border border-gray-800 hover:border-green-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-green-400 text-3xl mb-2">🏆</div>
                <h3 className="font-medium">Achievements</h3>
              </a>
            </Link>
            
            <Link href="/leaderboard">
              <a className="bg-black/30 border border-gray-800 hover:border-teal-900/50 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-teal-400 text-3xl mb-2">📊</div>
                <h3 className="font-medium">Leaderboard</h3>
              </a>
            </Link>
            
            <Link href="/profile">
              <a className="bg-black/30 border border-gray-800 hover:border-gray-700 rounded-lg p-4 flex flex-col items-center text-center hover:bg-black/50 transition-colors">
                <div className="text-gray-400 text-3xl mb-2">👤</div>
                <h3 className="font-medium">Profile</h3>
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}