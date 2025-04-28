import React from 'react';

export const BrassKnucklesIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main brass body */}
      <rect 
        x="20" 
        y="40" 
        width="60" 
        height="20" 
        rx="5" 
        fill="url(#brass-gradient)" 
        stroke="#8B6914" 
        strokeWidth="1.5" 
      />
      
      {/* Finger holes */}
      <circle cx="30" cy="50" r="7" fill="#333" stroke="#8B6914" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="7" fill="#333" stroke="#8B6914" strokeWidth="1.5" />
      <circle cx="70" cy="50" r="7" fill="#333" stroke="#8B6914" strokeWidth="1.5" />
      
      {/* Ridge details on the brass */}
      <line x1="20" y1="45" x2="80" y2="45" stroke="#8B6914" strokeWidth="0.5" />
      <line x1="20" y1="55" x2="80" y2="55" stroke="#8B6914" strokeWidth="0.5" />
      
      {/* Highlights */}
      <path 
        d="M22,42 Q50,38 78,42" 
        fill="none" 
        stroke="rgba(255,255,255,0.3)" 
        strokeWidth="1" 
      />
      
      {/* Define the brass gradient */}
      <defs>
        <linearGradient id="brass-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D6B86C" />
          <stop offset="50%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const SwitchbladeIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Handle */}
      <rect 
        x="25" 
        y="40" 
        width="30" 
        height="15" 
        rx="2" 
        fill="url(#handle-gradient)" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      
      {/* Blade */}
      <path 
        d="M55,47.5 L80,35 L85,40 L55,47.5" 
        fill="url(#blade-gradient)" 
        stroke="#555" 
        strokeWidth="0.5" 
      />
      
      {/* Handle details */}
      <rect x="27" y="42" width="26" height="1" fill="#333" />
      <rect x="27" y="45" width="26" height="1" fill="#333" />
      <rect x="27" y="48" width="26" height="1" fill="#333" />
      <rect x="27" y="51" width="26" height="1" fill="#333" />
      
      {/* Blade reflection */}
      <line 
        x1="57" 
        y1="46.5" 
        x2="82" 
        y2="37" 
        stroke="rgba(255,255,255,0.5)" 
        strokeWidth="0.5" 
      />
      
      {/* Define the gradients */}
      <defs>
        <linearGradient id="handle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3A3A" />
          <stop offset="50%" stopColor="#2A2A2A" />
          <stop offset="100%" stopColor="#1A1A1A" />
        </linearGradient>
        <linearGradient id="blade-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#CCC" />
          <stop offset="50%" stopColor="#AAA" />
          <stop offset="100%" stopColor="#888" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const SkiMaskIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mask outline */}
      <path 
        d="M30,30 C30,20 70,20 70,30 L70,70 C70,80 30,80 30,70 Z" 
        fill="url(#mask-gradient)" 
        stroke="#222" 
        strokeWidth="1" 
      />
      
      {/* Eye holes */}
      <ellipse cx="40" cy="45" rx="7" ry="5" fill="#111" />
      <ellipse cx="60" cy="45" rx="7" ry="5" fill="#111" />
      
      {/* Mouth hole */}
      <ellipse cx="50" cy="60" rx="10" ry="4" fill="#111" />
      
      {/* Texture lines */}
      <path 
        d="M30,35 C40,37 60,37 70,35" 
        fill="none" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      <path 
        d="M30,50 C40,52 60,52 70,50" 
        fill="none" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      <path 
        d="M30,65 C40,67 60,67 70,65" 
        fill="none" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      
      {/* Define the gradient */}
      <defs>
        <linearGradient id="mask-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#333" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const TommyGunIcon: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gun body */}
      <rect 
        x="20" 
        y="45" 
        width="60" 
        height="8" 
        rx="1" 
        fill="url(#gun-body-gradient)" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      
      {/* Barrel */}
      <rect 
        x="65" 
        y="46.5" 
        width="25" 
        height="5" 
        rx="1" 
        fill="url(#barrel-gradient)" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      
      {/* Drum magazine */}
      <ellipse 
        cx="40" 
        cy="55" 
        rx="8" 
        ry="8" 
        fill="url(#magazine-gradient)" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      
      {/* Handle */}
      <path 
        d="M25,53 L25,65 L35,65 L35,53" 
        fill="url(#handle-gradient)" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      
      {/* Front grip */}
      <rect 
        x="50" 
        y="53" 
        width="5" 
        height="10" 
        rx="1" 
        fill="url(#grip-gradient)" 
        stroke="#222" 
        strokeWidth="0.5" 
      />
      
      {/* Details and highlights */}
      <line 
        x1="65" 
        y1="48" 
        x2="88" 
        y2="48" 
        stroke="#333" 
        strokeWidth="0.5" 
      />
      <line 
        x1="65" 
        y1="50" 
        x2="88" 
        y2="50" 
        stroke="#333" 
        strokeWidth="0.5" 
      />
      <circle cx="40" cy="55" r="5" fill="none" stroke="#333" strokeWidth="0.5" />
      
      {/* Define the gradients */}
      <defs>
        <linearGradient id="gun-body-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#444" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>
        <linearGradient id="barrel-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#555" />
          <stop offset="100%" stopColor="#333" />
        </linearGradient>
        <linearGradient id="magazine-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#444" />
          <stop offset="100%" stopColor="#222" />
        </linearGradient>
        <linearGradient id="handle-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#654321" />
        </linearGradient>
        <linearGradient id="grip-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B4513" />
          <stop offset="100%" stopColor="#654321" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const getItemIcon = (itemName: string, className?: string) => {
  switch (itemName) {
    case 'Brass Knuckles':
      return <BrassKnucklesIcon className={className} />;
    case 'Switchblade':
      return <SwitchbladeIcon className={className} />;
    case 'Ski Mask':
      return <SkiMaskIcon className={className} />;
    case 'Tommy Gun':
      return <TommyGunIcon className={className} />;
    default:
      return null;
  }
};