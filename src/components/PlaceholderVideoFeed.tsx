/**
 * High-Definition FRC Match Video & Livestream Placeholder Component
 * 
 * Provides an authentic, real-time animated FRC arena broadcast feed with:
 * - Dynamic robot autonomous & teleop match movement simulation
 * - Live scoring scoreboard HUD (Alliance scores, match timer, period)
 * - Multi-camera angle switcher (Full Arena, Driver Station, High-Goal Overhead)
 * - Play/Pause controls, volume simulation, and full-screen compatibility
 * - Exact responsive flex sizing matching the widget container height
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Camera,
  RotateCcw,
  Sparkles,
  Maximize2,
  Tv,
} from 'lucide-react';

interface PlaceholderVideoFeedProps {
  title?: string;
  matchName?: string;
  isLive?: boolean;
  onToggleExternal?: () => void;
  hasExternalStream?: boolean;
}

export const PlaceholderVideoFeed: React.FC<PlaceholderVideoFeedProps> = ({
  title = 'Field Livestream',
  matchName = 'Arena Field 1 • Qual 13',
  isLive = true,
  onToggleExternal,
  hasExternalStream = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [cameraAngle, setCameraAngle] = useState<'arena' | 'driver' | 'overhead'>('arena');
  const [matchSeconds, setMatchSeconds] = useState(135); // 2:15 match
  const [redScore, setRedScore] = useState(152);
  const [blueScore, setBlueScore] = useState(147);
  const [tick, setTick] = useState(0);

  // Animated match timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      setMatchSeconds((sec) => {
        if (sec <= 1) {
          // Reset match simulation loop
          setRedScore(152);
          setBlueScore(147);
          return 135;
        }
        // Occasional score increments during simulation
        if (sec % 18 === 0) setRedScore((s) => s + 5);
        if (sec % 22 === 0) setBlueScore((s) => s + 4);
        return sec - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const minutes = Math.floor(matchSeconds / 60);
  const remainingSecs = matchSeconds % 60;
  const formattedTime = `${minutes}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  const period = matchSeconds > 120 ? 'AUTO' : matchSeconds > 30 ? 'TELEOP' : 'ENDGAME';

  // Dynamic robot positions based on tick
  const r1X = 25 + Math.sin(tick * 0.15) * 12;
  const r1Y = 35 + Math.cos(tick * 0.18) * 15;

  const r2X = 35 + Math.cos(tick * 0.12) * 10;
  const r2Y = 60 + Math.sin(tick * 0.14) * 16;

  const b1X = 70 + Math.cos(tick * 0.16) * 12;
  const b1Y = 40 + Math.sin(tick * 0.15) * 14;

  const b2X = 60 + Math.sin(tick * 0.13) * 10;
  const b2Y = 65 + Math.cos(tick * 0.17) * 16;

  return (
    <div className="w-full h-full relative overflow-hidden bg-zinc-950 flex flex-col justify-between select-none text-white font-mono group">
      {/* Background Animated FRC Arena Canvas / Graphic */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-zinc-900 to-black overflow-hidden flex items-center justify-center">
        {/* Arena Grid Floor */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #27272a 1px, transparent 1px), linear-gradient(to bottom, #27272a 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Dynamic Arena Graphic based on Camera Angle */}
        {cameraAngle === 'arena' && (
          <svg className="w-full h-full absolute inset-0 opacity-85" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Field Outer Perimeter */}
            <rect x="5" y="10" width="90" height="80" rx="3" fill="#09090b" stroke="#3f3f46" strokeWidth="0.8" />

            {/* Center Field Line */}
            <line x1="50" y1="10" x2="50" y2="90" stroke="#71717a" strokeWidth="0.6" strokeDasharray="2 2" />

            {/* Red Alliance Zone */}
            <rect x="5" y="10" width="18" height="80" fill="#dc2626" fillOpacity="0.12" stroke="#ef4444" strokeWidth="0.5" />
            <text x="12" y="52" fill="#ef4444" fontSize="4" fontWeight="bold" opacity="0.4" textAnchor="middle" transform="rotate(-90 12 52)">
              RED ALLIANCE
            </text>

            {/* Blue Alliance Zone */}
            <rect x="77" y="10" width="18" height="80" fill="#2563eb" fillOpacity="0.12" stroke="#3b82f6" strokeWidth="0.5" />
            <text x="88" y="52" fill="#3b82f6" fontSize="4" fontWeight="bold" opacity="0.4" textAnchor="middle" transform="rotate(90 88 52)">
              BLUE ALLIANCE
            </text>

            {/* Center Stage / Reef Zone */}
            <polygon points="45,42 55,42 58,50 55,58 45,58 42,50" fill="#27272a" stroke="#e4e4e7" strokeWidth="0.6" opacity="0.7" />
            <circle cx="50" cy="50" r="2.5" fill="#f59e0b" opacity="0.9" />

            {/* Simulated Robots */}
            {/* Red Team 1002 (CircuitRunners) */}
            <g transform={`translate(${r1X}, ${r1Y})`}>
              <rect x="-3" y="-3" width="6" height="6" rx="1" fill="#ef4444" stroke="#ffffff" strokeWidth="0.6" />
              <text x="0" y="1.2" fill="#ffffff" fontSize="2.2" fontWeight="bold" textAnchor="middle">1002</text>
            </g>

            {/* Red Team Partner */}
            <g transform={`translate(${r2X}, ${r2Y})`}>
              <rect x="-2.5" y="-2.5" width="5" height="5" rx="1" fill="#b91c1c" stroke="#fca5a5" strokeWidth="0.5" />
              <text x="0" y="1" fill="#ffffff" fontSize="1.8" textAnchor="middle">1771</text>
            </g>

            {/* Blue Team Opponent 1 */}
            <g transform={`translate(${b1X}, ${b1Y})`}>
              <rect x="-2.8" y="-2.8" width="5.6" height="5.6" rx="1" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.6" />
              <text x="0" y="1.2" fill="#ffffff" fontSize="2.2" fontWeight="bold" textAnchor="middle">4026</text>
            </g>

            {/* Blue Team Opponent 2 */}
            <g transform={`translate(${b2X}, ${b2Y})`}>
              <rect x="-2.5" y="-2.5" width="5" height="5" rx="1" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="0.5" />
              <text x="0" y="1" fill="#ffffff" fontSize="1.8" textAnchor="middle">2974</text>
            </g>
          </svg>
        )}

        {cameraAngle === 'driver' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 z-10">
            <div className="w-16 h-16 rounded-2xl bg-red-950/40 border border-red-500/50 flex items-center justify-center text-red-400">
              <Camera size={32} />
            </div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              Red Driver Station Cam • Station 1
            </div>
            <p className="text-xs text-zinc-400 max-w-sm">
              Live optical view facing Arena Field with driver station telemetry overlay active.
            </p>
          </div>
        )}

        {cameraAngle === 'overhead' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2 z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-950/40 border border-blue-500/50 flex items-center justify-center text-blue-400">
              <Camera size={32} />
            </div>
            <div className="text-sm font-bold text-white uppercase tracking-wider">
              Center High-Goal Subwoofer Cam
            </div>
            <p className="text-xs text-zinc-400 max-w-sm">
              Target alignment camera tracking note trajectories and speaker cycle efficiency.
            </p>
          </div>
        )}

        {/* Scanline CRT FX */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40" />
      </div>

      {/* Top HUD: Live Badge, Match Title, Camera Angle Switcher */}
      <div className="relative z-20 p-2.5 sm:p-3 flex items-center justify-between gap-2 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold shadow-md shadow-red-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>{isLive ? 'LIVE ARENA FEED' : 'MATCH REPLAY'}</span>
          </div>

          <span className="text-xs font-bold text-zinc-200 truncate hidden sm:inline">
            {matchName}
          </span>
        </div>

        {/* Camera Angles Selector */}
        <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm border border-zinc-800 rounded-lg p-0.5 text-[10px]">
          <button
            onClick={() => setCameraAngle('arena')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              cameraAngle === 'arena'
                ? 'bg-zinc-700 text-white font-bold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Arena
          </button>
          <button
            onClick={() => setCameraAngle('driver')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              cameraAngle === 'driver'
                ? 'bg-zinc-700 text-white font-bold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Driver
          </button>
          <button
            onClick={() => setCameraAngle('overhead')}
            className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
              cameraAngle === 'overhead'
                ? 'bg-zinc-700 text-white font-bold shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            High-Goal
          </button>
        </div>
      </div>

      {/* Center Dynamic HUD: Alliance Scores & Match Clock */}
      <div className="relative z-20 px-3 flex items-center justify-between pointer-events-none">
        {/* Red Score HUD */}
        <div className="flex items-center gap-2 bg-red-950/80 backdrop-blur-md border border-red-500/60 rounded-xl px-3 py-1.5 shadow-lg">
          <div className="text-[10px] font-bold text-red-300">RED</div>
          <div className="text-lg sm:text-xl font-black text-white font-mono">{redScore}</div>
        </div>

        {/* Match Period & Clock */}
        <div className="flex flex-col items-center bg-black/80 backdrop-blur-md border border-zinc-700 rounded-xl px-3.5 py-1 shadow-lg">
          <span className="text-[9px] font-bold tracking-wider text-amber-400">{period}</span>
          <span className="text-base sm:text-lg font-black text-white font-mono">{formattedTime}</span>
        </div>

        {/* Blue Score HUD */}
        <div className="flex items-center gap-2 bg-blue-950/80 backdrop-blur-md border border-blue-500/60 rounded-xl px-3 py-1.5 shadow-lg">
          <div className="text-lg sm:text-xl font-black text-white font-mono">{blueScore}</div>
          <div className="text-[10px] font-bold text-blue-300">BLUE</div>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-20 p-2 sm:p-2.5 flex items-center justify-between gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
            title={isPlaying ? 'Pause simulation feed' : 'Resume simulation feed'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} />}
          </button>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white transition-colors cursor-pointer"
            title={isMuted ? 'Unmute match audio' : 'Mute match audio'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          <button
            onClick={() => {
              setMatchSeconds(135);
              setRedScore(152);
              setBlueScore(147);
            }}
            className="p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-white transition-colors cursor-pointer hidden sm:block"
            title="Restart match simulation"
          >
            <RotateCcw size={13} />
          </button>

          <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
            1080p • 60 FPS • FRC ARENA CAM
          </span>
        </div>

        {/* External stream switcher toggle (if available) */}
        {hasExternalStream && onToggleExternal && (
          <button
            onClick={onToggleExternal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px] transition-colors cursor-pointer shadow-sm"
          >
            <Tv size={12} />
            <span>Switch to External Stream</span>
          </button>
        )}
      </div>
    </div>
  );
};
