/**
 * Team Number Badge with Hover Tooltip (Showing Team Name Everywhere)
 * Team 1002 CircuitRunners
 */

import React, { useState } from 'react';
import { getTeamName, getTeamFullInfo, FRC_TEAM_DIRECTORY } from '../utils/teamLookup';

interface TeamBadgeProps {
  teamNumber: number;
  highlight1002?: boolean;
  variant?: 'red' | 'blue' | 'neutral' | 'gold' | 'plain';
  className?: string;
  showNameBelow?: boolean;
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  teamNumber,
  highlight1002 = true,
  variant = 'neutral',
  className = '',
  showNameBelow = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const is1002 = teamNumber === 1002;
  const teamName = getTeamName(teamNumber);
  const teamMeta = FRC_TEAM_DIRECTORY[teamNumber];

  let colorClasses = 'bg-zinc-800/90 text-zinc-200 border-zinc-700/80';
  if (is1002 && highlight1002) {
    colorClasses = 'bg-amber-400 text-black border-amber-300 font-bold shadow-xs';
  } else if (variant === 'red') {
    colorClasses = 'bg-red-950/80 text-red-200 border-red-800/80';
  } else if (variant === 'blue') {
    colorClasses = 'bg-blue-950/80 text-blue-200 border-blue-800/80';
  } else if (variant === 'gold') {
    colorClasses = 'bg-amber-400/20 text-amber-300 border-amber-400/40';
  } else if (variant === 'plain') {
    colorClasses = 'bg-transparent text-inherit border-transparent';
  }

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={getTeamFullInfo(teamNumber)}
    >
      <span
        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-mono border transition-all cursor-help ${colorClasses} ${className}`}
      >
        {teamNumber}
      </span>

      {/* Floating Hover Tooltip */}
      {isHovered && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 pointer-events-none whitespace-nowrap rounded-md bg-zinc-900/95 text-white px-2 py-1 text-[10px] font-sans font-medium border border-zinc-700 shadow-xl shadow-black/80 flex flex-col items-center gap-0.5 animate-fade-in">
          <span className="font-bold text-amber-300">{teamName}</span>
          {teamMeta?.city && (
            <span className="text-zinc-400 text-[9px]">
              {teamMeta.city}, {teamMeta.state}
            </span>
          )}
          {/* Tooltip triangle */}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-zinc-900" />
        </span>
      )}

      {showNameBelow && (
        <span className="block text-[9px] text-zinc-400 truncate max-w-[80px]">
          {teamName}
        </span>
      )}
    </span>
  );
};
