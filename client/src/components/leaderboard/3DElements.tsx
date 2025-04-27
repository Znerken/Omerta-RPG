import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { User } from '@shared/schema';
import { useLocation } from 'wouter';

// Trophy component that floats and rotates
export function Trophy(props: { position: [number, number, number], scale?: number, color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { position, scale = 1, color = '#FFD700' } = props;
  
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Float 
      speed={2} 
      rotationIntensity={0.2} 
      floatIntensity={0.5}
      position={position}
    >
      <mesh ref={meshRef} scale={scale} castShadow>
        <cylinderGeometry args={[0.4, 0.6, 0.3, 32]} />
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
        
        {/* Cup base */}
        <mesh position={[0, 0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.4, 0.7, 32]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
        </mesh>
        
        {/* Cup handles */}
        <mesh position={[0.4, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.15, 0.05, 16, 32, Math.PI]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
        </mesh>
        
        <mesh position={[-0.4, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.15, 0.05, 16, 32, Math.PI]} />
          <meshStandardMaterial color={color} metalness={0.8} roughness={0.3} />
        </mesh>
      </mesh>
    </Float>
  );
}

// Animated Player Card component
export function PlayerCard(props: { 
  player: any, 
  index: number, 
  position: [number, number, number],
  selected: boolean,
  onClick: () => void,
  delay?: number
}) {
  const { player, index, position, selected, onClick, delay = 0 } = props;
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const targetPos = useRef(new THREE.Vector3(...position));
  const initialPos = useRef(new THREE.Vector3(position[0], position[1] - 10, position[2]));
  
  // Create a spotlight effect for the selected card
  useEffect(() => {
    if (groupRef.current) {
      if (selected) {
        // Move forward slightly when selected
        targetPos.current.z = position[2] + 0.5;
      } else {
        targetPos.current.z = position[2];
      }
    }
  }, [selected, position]);
  
  useFrame((_, delta) => {
    if (groupRef.current) {
      // Animate position
      groupRef.current.position.lerp(targetPos.current, 0.1);
      
      // Slight hover effect
      if (hovered && !selected) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          0.2,
          0.1
        );
        groupRef.current.position.z = THREE.MathUtils.lerp(
          groupRef.current.position.z,
          position[2] + 0.2,
          0.1
        );
      } else if (!selected) {
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          0,
          0.1
        );
        groupRef.current.position.z = THREE.MathUtils.lerp(
          groupRef.current.position.z,
          position[2],
          0.1
        );
      }
    }
  });
  
  // Rank color based on position
  const getRankColor = (rank: number) => {
    if (rank === 0) return "#FFD700"; // Gold
    if (rank === 1) return "#C0C0C0"; // Silver
    if (rank === 2) return "#CD7F32"; // Bronze
    return "#FFFFFF"; // White for others
  };
  
  // Get background color based on rank
  const getCardColor = (rank: number) => {
    if (rank === 0) return "#422006";
    if (rank === 1) return "#2E2E2E";
    if (rank === 2) return "#3E2723";
    return "#1A1A2E";
  };
  
  // Animation for entering cards
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(initialPos.current);
      
      // Animate in with delay based on rank
      setTimeout(() => {
        targetPos.current = new THREE.Vector3(...position);
      }, delay);
    }
  }, [delay, position]);
  
  // Calculate a simple glow intensity based on rank
  const glowIntensity = Math.max(0, 3 - index) * 0.5;
  
  return (
    <group 
      ref={groupRef} 
      position={initialPos.current.toArray()} 
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Card backing */}
      <mesh castShadow receiveShadow scale={selected ? 1.05 : 1}>
        <boxGeometry args={[2.5, 1.2, 0.1]} />
        <meshStandardMaterial 
          color={getCardColor(index)} 
          roughness={0.3} 
          metalness={0.4}
          emissive={getCardColor(index)}
          emissiveIntensity={selected ? 0.2 : hovered ? 0.1 : 0}
        />
      </mesh>
      
      {/* Rank number */}
      <Text
        position={[-1, 0, 0.06]}
        fontSize={0.4}
        color={getRankColor(index)}
        anchorX="center"
        anchorY="middle"
      >
        #{index + 1}
      </Text>
      
      {/* Player name */}
      <Text
        position={[0.5, 0.2, 0.06]}
        fontSize={0.2}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.5}
      >
        {player.username}
      </Text>
      
      {/* Player level */}
      <Text
        position={[0.2, -0.1, 0.06]}
        fontSize={0.15}
        color="#BBBBBB"
        anchorX="center"
        anchorY="middle"
      >
        Level {player.level}
      </Text>
      
      {/* Player stats (cash, respect, etc) */}
      <Text
        position={[0.7, -0.1, 0.06]}
        fontSize={0.15}
        color="#8BC34A"
        anchorX="center"
        anchorY="middle"
      >
        ${player.cash?.toLocaleString()}
      </Text>
      
      {/* Border glow for top 3 */}
      {index < 3 && (
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[2.6, 1.3, 0.01]} />
          <meshBasicMaterial 
            color={getRankColor(index)} 
            opacity={0.3 + glowIntensity} 
            transparent
          />
        </mesh>
      )}
    </group>
  );
}

// Enhanced 2D Leaderboard
export function FallbackLeaderboard({ players, activeTab }: { players: any[], activeTab: string }) {
  const [, navigate] = useLocation();

  // Function to navigate to player profile
  const goToProfile = (playerId: number) => {
    navigate(`/player/${playerId}`);
  };

  return (
    <div className="bg-dark-surface/90 p-5 rounded-md h-[calc(100vh-14rem)] overflow-auto border border-dark-lighter/50 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-red-600 uppercase tracking-wider">
        {activeTab} Leaderboard
      </h2>
      
      <div className="space-y-4">
        {players.slice(0, 20).map((player, i) => (
          <motion.div 
            key={player.id}
            className={`flex items-center p-4 rounded-md ${
              i === 0 ? 'bg-gradient-to-r from-amber-900/30 to-amber-700/20 border border-amber-600/30 shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
              i === 1 ? 'bg-gradient-to-r from-slate-800/40 to-slate-700/20 border border-slate-400/20' :
              i === 2 ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/10 border border-amber-700/20' :
              'bg-dark-lighter/30 border border-dark-lighter/40 hover:bg-dark-lighter/40 transition-colors'
            }`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Rank indicator */}
            <div className={`h-14 w-14 flex items-center justify-center rounded-md mr-4 font-bold text-xl ${
              i === 0 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-black ring-1 ring-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' :
              i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-black ring-1 ring-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.3)]' :
              i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-900 text-black ring-1 ring-amber-600 shadow-[0_0_8px_rgba(180,83,9,0.3)]' :
              'bg-dark-surface text-gray-300 ring-1 ring-gray-700/50'
            }`}>
              {i + 1}
            </div>
            
            {/* Profile & player info - main content */}
            <div className="flex flex-1 items-center">
              {/* Profile image - will use avatar if available, otherwise a placeholder */}
              <div 
                className={`h-16 w-16 rounded-md overflow-hidden mr-4 border cursor-pointer ${
                  i === 0 ? 'border-amber-500/60' :
                  i === 1 ? 'border-slate-400/60' :
                  i === 2 ? 'border-amber-700/60' :
                  'border-gray-700/40'
                } hover:ring-2 hover:ring-primary/50 transition-all duration-200`}
                onClick={() => goToProfile(player.id)}
                title={`View ${player.username}'s profile`}
              >
                <div className="h-full w-full bg-dark-surface flex items-center justify-center">
                  {player.avatar ? (
                    <img 
                      src={player.avatar} 
                      alt={`${player.username}'s avatar`} 
                      className="h-full w-full object-cover"
                    />
                  ) : player.id === 1 ? (
                    // Show extortionist avatar for player id 1
                    <img 
                      src="/images/avatars/mobster1.jpg" 
                      alt={`${player.username}'s avatar`} 
                      className="h-full w-full object-cover"
                    />
                  ) : player.id === 7 ? (
                    // Show tester avatar for player id 7
                    <img 
                      src="/images/avatars/mobster2.jpg" 
                      alt={`${player.username}'s avatar`} 
                      className="h-full w-full object-cover"
                    />
                  ) : player.id === 9 ? (
                    // Show Toffe avatar for player id 9
                    <img 
                      src="/images/avatars/mobster3.jpg" 
                      alt={`${player.username}'s avatar`} 
                      className="h-full w-full object-cover"
                    />
                  ) : player.id === 10 ? (
                    // Show yaboi avatar for player id 10
                    <img 
                      src="/images/avatars/mobster4.jpg" 
                      alt={`${player.username}'s avatar`} 
                      className="h-full w-full object-cover"
                    />
                  ) : player.id === 11 ? (
                    // Show TEST123 avatar for player id 11
                    <img 
                      src="/images/avatars/mobster5.jpg" 
                      alt={`${player.username}'s avatar`} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // Default placeholder for other players
                    <div className={`text-3xl font-bold ${
                      i === 0 ? 'text-amber-500' :
                      i === 1 ? 'text-slate-400' :
                      i === 2 ? 'text-amber-700' :
                      'text-gray-600'
                    }`}>
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Player details */}
              <div className="flex-1">
                <div 
                  className={`text-lg font-bold cursor-pointer hover:underline ${
                    i === 0 ? 'text-amber-400' :
                    i === 1 ? 'text-slate-300' :
                    i === 2 ? 'text-amber-600' :
                    'text-gray-300'
                  }`}
                  onClick={() => goToProfile(player.id)}
                  title={`View ${player.username}'s profile`}
                >
                  {player.username}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-2">
                  <span className="inline-block px-2 py-0.5 bg-dark-surface rounded-sm text-gray-400">
                    Level {player.level}
                  </span>
                  {player.respect && (
                    <span className="inline-block px-2 py-0.5 bg-amber-950/60 rounded-sm text-amber-500/90">
                      {player.respect.toLocaleString()} Respect
                    </span>
                  )}
                </div>
                
                {/* Stats bars */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 max-w-md">
                  {player.strength && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-14">STR:</span>
                      <div className="h-1 bg-dark-surface rounded-sm flex-1 ml-1">
                        <div 
                          className="h-full bg-red-600/80 rounded-sm" 
                          style={{ width: `${Math.min(100, player.strength)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {player.stealth && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-14">STL:</span>
                      <div className="h-1 bg-dark-surface rounded-sm flex-1 ml-1">
                        <div 
                          className="h-full bg-blue-600/80 rounded-sm" 
                          style={{ width: `${Math.min(100, player.stealth)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {player.charisma && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-14">CHA:</span>
                      <div className="h-1 bg-dark-surface rounded-sm flex-1 ml-1">
                        <div 
                          className="h-full bg-purple-600/80 rounded-sm" 
                          style={{ width: `${Math.min(100, player.charisma)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {player.intelligence && (
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 w-14">INT:</span>
                      <div className="h-1 bg-dark-surface rounded-sm flex-1 ml-1">
                        <div 
                          className="h-full bg-green-600/80 rounded-sm" 
                          style={{ width: `${Math.min(100, player.intelligence)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Player money and XP */}
              <div className="text-right">
                <div className={`font-mono text-lg font-bold ${
                  i === 0 ? 'text-green-400' :
                  i === 1 ? 'text-green-500' :
                  i === 2 ? 'text-green-500' :
                  'text-green-600'
                }`}>
                  ${player.cash?.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 flex items-center justify-end mt-1">
                  <span className="mr-1 font-medium">{player.xp?.toLocaleString()}</span>
                  <span className="text-xs text-gray-400">XP</span>
                </div>
                
                {/* Gang tag if available */}
                {player.gang && (
                  <div className="mt-2 inline-block px-2 py-0.5 rounded-sm bg-dark-surface text-gray-400 text-xs border border-gray-700/50">
                    {player.gang}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// We've removed the 3D option entirely as requested
// This file now only contains the enhanced 2D leaderboard component