import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Float, ContactShadows, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { User } from '@shared/schema';

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
  return (
    <div className="bg-[#111827] bg-opacity-80 p-6 rounded-lg h-[450px] overflow-auto border border-gray-800 shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-red-600 uppercase tracking-wider">
        {activeTab} Leaderboard
      </h2>
      
      <div className="space-y-4">
        {players.slice(0, 10).map((player, i) => (
          <motion.div 
            key={player.id}
            className={`flex items-center justify-between p-4 rounded-lg ${
              i === 0 ? 'bg-gradient-to-r from-amber-900/30 to-amber-700/20 border border-amber-600/40 shadow-[0_0_15px_rgba(245,158,11,0.15)]' :
              i === 1 ? 'bg-gradient-to-r from-slate-800/40 to-slate-700/20 border border-slate-400/30' :
              i === 2 ? 'bg-gradient-to-r from-amber-900/20 to-amber-800/10 border border-amber-700/20' :
              'bg-gray-900/40 border border-gray-800/30 hover:bg-gray-800/30 transition-colors'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center">
              <div className={`w-10 h-10 flex items-center justify-center rounded-full mr-4 font-bold ${
                i === 0 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-black ring-2 ring-amber-500 ring-opacity-50 shadow-[0_0_10px_rgba(245,158,11,0.5)]' :
                i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-black ring-2 ring-slate-400 ring-opacity-50' :
                i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-black ring-2 ring-amber-600 ring-opacity-50' :
                'bg-gray-800 text-gray-300 ring-1 ring-gray-700'
              }`}>
                {i + 1}
              </div>
              <div>
                <div className={`font-medium ${
                  i === 0 ? 'text-amber-400' :
                  i === 1 ? 'text-slate-300' :
                  i === 2 ? 'text-amber-600' :
                  'text-gray-300'
                }`}>{player.username}</div>
                <div className="text-xs text-gray-500">Level {player.level}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-mono font-medium ${
                i === 0 ? 'text-green-400' :
                i === 1 ? 'text-green-500' :
                i === 2 ? 'text-green-500' :
                'text-green-600'
              }`}>${player.cash?.toLocaleString()}</div>
              <div className="text-xs text-gray-500 flex items-center justify-end">
                <span className="mr-1">{player.xp?.toLocaleString()}</span>
                <span className="text-xs text-gray-400">XP</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// 3D Leaderboard Scene
export function LeaderboardScene({ players, activeTab }: { players: any[], activeTab: string }) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [use3D, setUse3D] = useState(false);
  
  // Reset the selection when tab changes
  useEffect(() => {
    setSelectedPlayer(null);
  }, [activeTab]);

  // For now, just use the 2D version because of rendering issues
  if (!use3D) {
    return (
      <div>
        <div className="flex justify-end mb-4">
          <button 
            className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 hover:border-gray-600 transition-all shadow-md flex items-center space-x-1 hover:scale-105"
            onClick={() => setUse3D(true)}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mr-1"></span>
            <span>Try 3D View</span>
          </button>
        </div>
        <FallbackLeaderboard players={players} activeTab={activeTab} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button 
          className="px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 hover:border-gray-600 transition-all shadow-md flex items-center space-x-1 hover:scale-105"
          onClick={() => setUse3D(false)}
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1"></span>
          <span>Switch to 2D View</span>
        </button>
      </div>
      <div className="relative h-[500px]">
        <Canvas shadows dpr={[1, 2]} style={{ height: '500px' }}>
          <fog attach="fog" args={['#070b10', 5, 20]} />
          
          <PerspectiveCamera 
            makeDefault 
            position={[0, 0, 5]} 
            fov={45}
          />
          
          {/* Top 3 Trophies */}
          {players.length > 0 && (
            <>
              <Trophy position={[0, 2, 0]} scale={0.3} color="#FFD700" />
              {players.length > 1 && (
                <Trophy position={[-2, 1.6, 0]} scale={0.2} color="#C0C0C0" />
              )}
              {players.length > 2 && (
                <Trophy position={[2, 1.6, 0]} scale={0.2} color="#CD7F32" />
              )}
            </>
          )}
          
          {/* Leaderboard Title */}
          <Text
            position={[0, 3, 0]}
            fontSize={0.5}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
          >
            {activeTab.toUpperCase()} LEADERBOARD
          </Text>
          
          {/* Player Cards */}
          <group>
            {players.slice(0, Math.min(10, players.length)).map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={i}
                position={[
                  // Arrange in a curved formation
                  3.5 * Math.sin((i / Math.min(10, players.length || 1)) * Math.PI),
                  -0.6 * i + 1,
                  -2 * Math.cos((i / Math.min(10, players.length || 1)) * 0.5 * Math.PI)
                ]}
                selected={selectedPlayer === i}
                onClick={() => setSelectedPlayer(i === selectedPlayer ? null : i)}
                delay={i * 200}
              />
            ))}
          </group>
          
          {/* Environment and lighting */}
          <ambientLight intensity={0.4} />
          <spotLight 
            position={[0, 10, 0]} 
            intensity={0.6} 
            angle={0.3} 
            penumbra={1} 
            castShadow 
          />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.8}
            castShadow
          />
          
          <ContactShadows
            position={[0, -2, 0]}
            opacity={0.4}
            scale={10}
            blur={1.5}
            far={4}
          />
          
          {/* Use a simpler environment that doesn't require loading external files */}
          <color attach="background" args={['#0a0a0f']} />
        </Canvas>
      </div>
    </div>
  );
}