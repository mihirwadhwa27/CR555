/**
 * Double-Elimination Playoff Bracket View (Authentic TBA Layout)
 * Team 1002 CircuitRunners
 * 
 * Features:
 * - Left 2/3: Full Upper & Lower Double-Elimination Bracket scaled to fit 100% without scrolling
 * - Right 1/3: Match Detail Inspector, Video Replay, and Alliance Lineups
 * - Hover team tooltips on all team numbers everywhere
 * - Interactive match selection and video replay integration
 */

import React, { useState } from 'react';
import {
  Trophy,
  PlayCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
  Flame,
  Award,
  Users,
  Layers,
  CheckCircle2,
  Tv,
  Eye,
  Sliders,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';
import { getTeamName } from '../utils/teamLookup';

export interface BracketMatch {
  id: string;
  name: string; // e.g. "Match 1 (#1 vs #8)"
  shortName: string; // "M1"
  roundLabel: string;
  redAllianceNumber: number;
  blueAllianceNumber: number;
  redTeams: number[];
  blueTeams: number[];
  redScore: number | number[];
  blueScore: number | number[];
  winner: 'RED' | 'BLUE';
  videoYoutubeId?: string;
  videoYoutubeId2?: string;
  epaPred?: { red: number; blue: number; winProb: number };
}

export const ALLIANCES_DATA = [
  { number: 1, captain: 1771, pick1: 1833, pick2: 4509, epa: 168.4, status: 'CHAMPIONS' },
  { number: 2, captain: 1002, pick1: 6919, pick2: 3635, epa: 154.2, status: 'FINALISTS' },
  { number: 3, captain: 4189, pick1: 2974, pick2: 8736, epa: 142.6, status: 'LOWER R4' },
  { number: 4, captain: 4188, pick1: 1261, pick2: 8080, epa: 147.0, status: 'LOWER R5' },
  { number: 5, captain: 6705, pick1: 6829, pick2: 3344, epa: 138.8, status: 'LOWER R3' },
  { number: 6, captain: 9477, pick1: 8866, pick2: 1746, epa: 131.5, status: 'LOWER R2' },
  { number: 7, captain: 1648, pick1: 4026, pick2: 1414, epa: 139.2, status: 'LOWER R3' },
  { number: 8, captain: 6023, pick1: 1683, pick2: 5109, epa: 126.8, status: 'LOWER R2' },
];

export const UPPER_MATCHES: BracketMatch[] = [
  {
    id: 'm1',
    name: 'Match 1 (#1 vs #8)',
    shortName: 'M1',
    roundLabel: 'Upper Round 1',
    redAllianceNumber: 1,
    blueAllianceNumber: 8,
    redTeams: [1771, 1833, 4509],
    blueTeams: [6023, 1683, 5109],
    redScore: 558,
    blueScore: 273,
    winner: 'RED',
    epaPred: { red: 540, blue: 290, winProb: 98 },
  },
  {
    id: 'm2',
    name: 'Match 2 (#4 vs #5)',
    shortName: 'M2',
    roundLabel: 'Upper Round 1',
    redAllianceNumber: 4,
    blueAllianceNumber: 5,
    redTeams: [4188, 1261, 8080],
    blueTeams: [6705, 6829, 3344],
    redScore: 328,
    blueScore: 288,
    winner: 'RED',
    epaPred: { red: 335, blue: 280, winProb: 65 },
  },
  {
    id: 'm3',
    name: 'Match 3 (#2 vs #7)',
    shortName: 'M3',
    roundLabel: 'Upper Round 1',
    redAllianceNumber: 2,
    blueAllianceNumber: 7,
    redTeams: [1002, 6919, 3635],
    blueTeams: [1648, 4026, 1414],
    redScore: 470,
    blueScore: 333,
    winner: 'RED',
    epaPred: { red: 460, blue: 340, winProb: 88 },
  },
  {
    id: 'm4',
    name: 'Match 4 (#3 vs #6)',
    shortName: 'M4',
    roundLabel: 'Upper Round 1',
    redAllianceNumber: 3,
    blueAllianceNumber: 6,
    redTeams: [4189, 2974, 8736],
    blueTeams: [9477, 8866, 1746],
    redScore: 305,
    blueScore: 199,
    winner: 'RED',
    epaPred: { red: 310, blue: 210, winProb: 79 },
  },
  {
    id: 'm7',
    name: 'Match 7 (#1 vs #4)',
    shortName: 'M7',
    roundLabel: 'Upper Round 2',
    redAllianceNumber: 1,
    blueAllianceNumber: 4,
    redTeams: [1771, 1833, 4509],
    blueTeams: [4188, 1261, 8080],
    redScore: 563,
    blueScore: 342,
    winner: 'RED',
    epaPred: { red: 550, blue: 335, winProb: 94 },
  },
  {
    id: 'm8',
    name: 'Match 8 (#2 vs #3)',
    shortName: 'M8',
    roundLabel: 'Upper Round 2',
    redAllianceNumber: 2,
    blueAllianceNumber: 3,
    redTeams: [1002, 6919, 3635],
    blueTeams: [4189, 2974, 8736],
    redScore: 411,
    blueScore: 388,
    winner: 'RED',
    epaPred: { red: 440, blue: 390, winProb: 68 },
  },
  {
    id: 'm11',
    name: 'Match 11 (#1 vs #2)',
    shortName: 'M11',
    roundLabel: 'Upper Round 4 (Semi)',
    redAllianceNumber: 1,
    blueAllianceNumber: 2,
    redTeams: [1771, 1833, 4509],
    blueTeams: [1002, 6919, 3635],
    redScore: 648,
    blueScore: 358,
    winner: 'RED',
    epaPred: { red: 580, blue: 450, winProb: 82 },
  },
  {
    id: 'finals',
    name: 'Finals (#1 vs #2)',
    shortName: 'Finals',
    roundLabel: 'Championship Finals',
    redAllianceNumber: 1,
    blueAllianceNumber: 2,
    redTeams: [1771, 1833, 4509],
    blueTeams: [1002, 6919, 3635],
    redScore: [557, 529],
    blueScore: [227, 224],
    winner: 'RED',
    epaPred: { red: 560, blue: 420, winProb: 85 },
  },
];

export const LOWER_MATCHES: BracketMatch[] = [
  {
    id: 'm5',
    name: 'Match 5 (#8 vs #5)',
    shortName: 'M5',
    roundLabel: 'Lower Round 2',
    redAllianceNumber: 8,
    blueAllianceNumber: 5,
    redTeams: [6023, 1683, 5109],
    blueTeams: [6705, 6829, 3344],
    redScore: 198,
    blueScore: 285,
    winner: 'BLUE',
    epaPred: { red: 210, blue: 275, winProb: 32 },
  },
  {
    id: 'm6',
    name: 'Match 6 (#7 vs #6)',
    shortName: 'M6',
    roundLabel: 'Lower Round 2',
    redAllianceNumber: 7,
    blueAllianceNumber: 6,
    redTeams: [1648, 4026, 1414],
    blueTeams: [9477, 8866, 1746],
    redScore: 324,
    blueScore: 221,
    winner: 'RED',
    epaPred: { red: 320, blue: 230, winProb: 81 },
  },
  {
    id: 'm10',
    name: 'Match 10 (#3 vs #5)',
    shortName: 'M10',
    roundLabel: 'Lower Round 3',
    redAllianceNumber: 3,
    blueAllianceNumber: 5,
    redTeams: [4189, 2974, 8736],
    blueTeams: [6705, 6829, 3344],
    redScore: 388,
    blueScore: 310,
    winner: 'RED',
    epaPred: { red: 395, blue: 315, winProb: 74 },
  },
  {
    id: 'm9',
    name: 'Match 9 (#4 vs #7)',
    shortName: 'M9',
    roundLabel: 'Lower Round 3',
    redAllianceNumber: 4,
    blueAllianceNumber: 7,
    redTeams: [4188, 1261, 8080],
    blueTeams: [1648, 4026, 1414],
    redScore: 402,
    blueScore: 341,
    winner: 'RED',
    epaPred: { red: 410, blue: 335, winProb: 77 },
  },
  {
    id: 'm12',
    name: 'Match 12 (#3 vs #4)',
    shortName: 'M12',
    roundLabel: 'Lower Round 4',
    redAllianceNumber: 3,
    blueAllianceNumber: 4,
    redTeams: [4189, 2974, 8736],
    blueTeams: [4188, 1261, 8080],
    redScore: 372,
    blueScore: 440,
    winner: 'BLUE',
    epaPred: { red: 380, blue: 435, winProb: 38 },
  },
  {
    id: 'm13',
    name: 'Match 13 (#2 vs #4)',
    shortName: 'M13',
    roundLabel: 'Lower Round 5 (Finals Qualifier)',
    redAllianceNumber: 2,
    blueAllianceNumber: 4,
    redTeams: [1002, 6919, 3635],
    blueTeams: [4188, 1261, 8080],
    redScore: 491,
    blueScore: 396,
    winner: 'RED',
    epaPred: { red: 455, blue: 350, winProb: 78 },
  },
];

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  {
    id: 'tba_bracket',
    title: 'Double Elimination Playoff Bracket',
    colSpan: 'full', // Full-width default like Pulse and PitFusion
    heightMultiplier: 2,
    order: 0,
    visible: true,
  },
  {
    id: 'match_inspector',
    title: 'Match Inspector & Video Replay',
    colSpan: 'half',
    heightMultiplier: 1.5,
    order: 1,
    visible: true,
  },
  {
    id: 'alliance_lineups',
    title: 'Playoff Alliance Lineups',
    colSpan: 'half',
    heightMultiplier: 1.5,
    order: 2,
    visible: true,
  },
];

type BracketViewMode = 'all' | 'upper' | 'lower' | 'finals';
type BracketCardScale = 'pit_large' | 'standard';

export const PlayoffsView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const activeEvent = usePitState(Selectors.activeEvent);
  const teamInfo = usePitState(Selectors.teamInfo);

  const [selectedMatch, setSelectedMatch] = useState<BracketMatch>(UPPER_MATCHES[2]); // Default to Match 3 (Team 1002)
  const [viewMode, setViewMode] = useState<BracketViewMode>('all');
  const [cardScale, setCardScale] = useState<BracketCardScale>('pit_large');

  const {
    segments,
    isCustomizing,
    setIsCustomizing,
    reorderSegments,
    setSegmentColSpan,
    setSegmentHeightMultiplier,
    toggleSegmentCollapse,
    toggleSegmentVisibility,
    resetToDefault,
    applyPreset,
  } = useModularLayout('playoffs_view_pulse', DEFAULT_SEGMENTS);

  const handlePlayVideo = (e: React.MouseEvent, match: BracketMatch, videoId?: string) => {
    e.stopPropagation();
    const vid = videoId || match.videoYoutubeId;
    if (vid) {
      Actions.playVideo(vid, `${match.name} - ${activeEvent?.name || 'Peachtree'}`);
      Actions.navigate('schedule');
    }
  };

  // High-Visibility Pulse/PitFusion Inspired Bracket Card
  const renderBracketCard = (match: BracketMatch) => {
    const isSelected = selectedMatch?.id === match.id;
    const is1002Red = match.redTeams.includes(teamInfo.number);
    const is1002Blue = match.blueTeams.includes(teamInfo.number);
    const has1002 = is1002Red || is1002Blue;
    const isFinals = Array.isArray(match.redScore);
    const isPitLarge = cardScale === 'pit_large';

    return (
      <div
        key={match.id}
        onClick={() => setSelectedMatch(match)}
        className={`w-full rounded-xl border font-mono shadow-md transition-all cursor-pointer overflow-hidden select-none ${
          isSelected
            ? 'ring-2 ring-blue-400 border-blue-400 shadow-blue-500/20'
            : has1002
            ? 'border-amber-400 shadow-amber-500/25 ring-1 ring-amber-400/50'
            : 'border-zinc-700/80 hover:border-zinc-500 bg-[#121318]'
        }`}
        style={{ backgroundColor: '#111216' }}
      >
        {/* Match Header Bar */}
        <div className="px-2.5 py-1.5 flex items-center justify-between bg-[#181920] border-b border-zinc-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-white font-black text-xs shrink-0">
              {match.shortName}
            </span>
            <span className="text-zinc-400 text-[11px] truncate font-semibold">
              {match.roundLabel.replace(' (Semi)', '').replace(' (Finals Qualifier)', '')}
            </span>
            {has1002 && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400 text-black shrink-0 tracking-wide">
                1002
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {match.epaPred && (
              <span className="text-[10px] font-bold text-zinc-400 hidden sm:inline-block">
                Prob: <strong className="text-zinc-200">{match.epaPred.winProb}%</strong>
              </span>
            )}
            {match.videoYoutubeId && (
              <button
                onClick={(e) => handlePlayVideo(e, match, match.videoYoutubeId)}
                className="text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer p-0.5"
                title="Play Video Replay"
              >
                <PlayCircle size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Red Alliance Row */}
        <div
          className={`flex items-center justify-between px-2.5 ${
            isPitLarge ? 'py-2 sm:py-2.5' : 'py-1.5'
          } border-b border-[#3b1216] transition-colors ${
            match.winner === 'RED'
              ? 'bg-[#3b1216] text-white font-bold'
              : 'bg-[#290d10] opacity-80 hover:opacity-100 text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-black shrink-0 ${
                match.winner === 'RED'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'bg-red-950 text-red-400 border border-red-800/80'
              }`}
            >
              #{match.redAllianceNumber}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {match.redTeams.map((team) => (
                <TeamBadge key={team} teamNumber={team} variant="red" highlight1002 />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 shrink-0">
            {match.winner === 'RED' && <Trophy size={13} className="text-amber-400 shrink-0" />}
            <span
              className={`font-black font-mono tracking-tight ${
                isPitLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              } ${match.winner === 'RED' ? 'text-white' : 'text-zinc-400'}`}
            >
              {isFinals ? (
                <span>
                  {(match.redScore as number[])[0]}-{(match.redScore as number[])[1]}
                </span>
              ) : (
                <span>{match.redScore}</span>
              )}
            </span>
          </div>
        </div>

        {/* Blue Alliance Row */}
        <div
          className={`flex items-center justify-between px-2.5 ${
            isPitLarge ? 'py-2 sm:py-2.5' : 'py-1.5'
          } transition-colors ${
            match.winner === 'BLUE'
              ? 'bg-[#10223f] text-white font-bold'
              : 'bg-[#0b1629] opacity-80 hover:opacity-100 text-zinc-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`px-1.5 py-0.5 rounded text-[11px] font-black shrink-0 ${
                match.winner === 'BLUE'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'bg-blue-950 text-blue-400 border border-blue-800/80'
              }`}
            >
              #{match.blueAllianceNumber}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {match.blueTeams.map((team) => (
                <TeamBadge key={team} teamNumber={team} variant="blue" highlight1002 />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 pl-2 shrink-0">
            {match.winner === 'BLUE' && <Trophy size={13} className="text-amber-400 shrink-0" />}
            <span
              className={`font-black font-mono tracking-tight ${
                isPitLarge ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
              } ${match.winner === 'BLUE' ? 'text-white' : 'text-zinc-400'}`}
            >
              {isFinals ? (
                <span>
                  {(match.blueScore as number[])[0]}-{(match.blueScore as number[])[1]}
                </span>
              ) : (
                <span>{match.blueScore}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderSegmentContent = (segId: string) => {
    switch (segId) {
      case 'tba_bracket':
        return (
          <div
            className="w-full h-full rounded-2xl border p-3 sm:p-4 flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: '#0a0b0e',
              borderColor: theme.tokens.border,
            }}
          >
            {/* Bracket Control Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 text-xs font-mono shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-amber-400 uppercase tracking-wider text-xs">
                  8-Alliance Double Elimination
                </span>
                <span className="text-[11px] text-zinc-400 font-medium hidden md:inline">
                  • Click match card to inspect telemetry
                </span>
              </div>

              {/* View Modes & Size Scaling (Pulse / PitFusion inspired) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* View Mode Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-zinc-800">
                  {[
                    { id: 'all', label: 'Full Tree' },
                    { id: 'upper', label: 'Upper Bracket' },
                    { id: 'lower', label: 'Lower Bracket' },
                    { id: 'finals', label: 'Finals' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setViewMode(tab.id as BracketViewMode)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        viewMode === tab.id
                          ? 'bg-amber-400 text-black shadow-xs'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sizing Toggle: Pit Display vs Standard */}
                <button
                  onClick={() => setCardScale(cardScale === 'pit_large' ? 'standard' : 'pit_large')}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    cardScale === 'pit_large'
                      ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle between Pit Display large card sizing and Standard compact"
                >
                  <Eye size={12} />
                  <span>{cardScale === 'pit_large' ? 'Pit Display (Large)' : 'Standard Size'}</span>
                </button>
              </div>
            </div>

            {/* Bracket Structure Container */}
            <div className="flex-1 overflow-y-auto overflow-x-auto pr-1 my-2 no-scrollbar space-y-4">
              {/* ========================================= */}
              {/* 1. UPPER BRACKET                          */}
              {/* ========================================= */}
              {(viewMode === 'all' || viewMode === 'upper') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80 text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    <span className="flex items-center gap-1.5 text-blue-400">
                      <Shield size={13} />
                      <span>Upper Bracket (Winners Path)</span>
                    </span>
                    <div className="grid grid-cols-4 w-full max-w-4xl pl-6 text-center text-[11px] text-zinc-500 font-mono hidden md:grid">
                      <div>Round 1 (Quarterfinals)</div>
                      <div>Round 2</div>
                      <div>Round 4 (Semifinals)</div>
                      <div>Finals Matchup</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start min-w-[720px] md:min-w-0">
                    {/* Upper Round 1 (4 matches) */}
                    <div className="space-y-2.5">
                      <div className="md:hidden text-[11px] font-bold text-zinc-400 uppercase">
                        Upper Round 1
                      </div>
                      {renderBracketCard(UPPER_MATCHES[0])}
                      {renderBracketCard(UPPER_MATCHES[1])}
                      {renderBracketCard(UPPER_MATCHES[2])}
                      {renderBracketCard(UPPER_MATCHES[3])}
                    </div>

                    {/* Upper Round 2 (2 matches) */}
                    <div className="space-y-2.5 md:pt-8">
                      <div className="md:hidden text-[11px] font-bold text-zinc-400 uppercase">
                        Upper Round 2
                      </div>
                      {renderBracketCard(UPPER_MATCHES[4])}
                      <div className="h-6 hidden md:block" />
                      {renderBracketCard(UPPER_MATCHES[5])}
                    </div>

                    {/* Upper Round 4 (1 match) */}
                    <div className="space-y-2.5 md:pt-24">
                      <div className="md:hidden text-[11px] font-bold text-zinc-400 uppercase">
                        Upper Round 4 (Semi)
                      </div>
                      {renderBracketCard(UPPER_MATCHES[6])}
                    </div>

                    {/* Finals Series (1 match card) */}
                    <div className="space-y-2.5 md:pt-24">
                      <div className="md:hidden text-[11px] font-bold text-amber-400 uppercase">
                        Championship Finals
                      </div>
                      <div className="p-1 rounded-xl border border-amber-500/50 bg-amber-950/20 shadow-lg">
                        {renderBracketCard(UPPER_MATCHES[7])}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Divider between Upper & Lower in All View */}
              {viewMode === 'all' && (
                <div className="py-2">
                  <div className="h-px bg-zinc-800 w-full" />
                </div>
              )}

              {/* ========================================= */}
              {/* 2. LOWER BRACKET                          */}
              {/* ========================================= */}
              {(viewMode === 'all' || viewMode === 'lower') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-zinc-800/80 text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Flame size={13} />
                      <span>Lower Bracket (Elimination Path)</span>
                    </span>
                    <div className="grid grid-cols-4 w-full max-w-4xl pl-6 text-center text-[11px] text-zinc-500 font-mono hidden md:grid">
                      <div>Lower Round 2</div>
                      <div>Lower Round 3</div>
                      <div>Lower Round 4</div>
                      <div>Lower Round 5 (Finals Qualifier)</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-start min-w-[720px] md:min-w-0">
                    {/* Lower Round 2 (2 matches) */}
                    <div className="space-y-2.5">
                      <div className="md:hidden text-[11px] font-bold text-zinc-400 uppercase">
                        Lower Round 2
                      </div>
                      {renderBracketCard(LOWER_MATCHES[0])}
                      {renderBracketCard(LOWER_MATCHES[1])}
                    </div>

                    {/* Lower Round 3 (2 matches) */}
                    <div className="space-y-2.5">
                      <div className="md:hidden text-[11px] font-bold text-zinc-400 uppercase">
                        Lower Round 3
                      </div>
                      {renderBracketCard(LOWER_MATCHES[2])}
                      {renderBracketCard(LOWER_MATCHES[3])}
                    </div>

                    {/* Lower Round 4 (1 match) */}
                    <div className="space-y-2.5 md:pt-10">
                      <div className="md:hidden text-[11px] font-bold text-zinc-400 uppercase">
                        Lower Round 4
                      </div>
                      {renderBracketCard(LOWER_MATCHES[4])}
                    </div>

                    {/* Lower Round 5 (1 match) */}
                    <div className="space-y-2.5 md:pt-10">
                      <div className="md:hidden text-[11px] font-bold text-zinc-400 uppercase">
                        Lower Round 5 (Qualifier)
                      </div>
                      {renderBracketCard(LOWER_MATCHES[5])}
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================= */}
              {/* 3. FINALS SERIES ONLY VIEW                */}
              {/* ========================================= */}
              {viewMode === 'finals' && (
                <div className="max-w-xl mx-auto space-y-4 py-4">
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
                      <Trophy size={14} />
                      <span>{activeEvent?.name || 'Tournament'} Finals</span>
                    </div>
                    <h3 className="text-lg font-black text-white font-mono">Alliance 1 vs Alliance 2</h3>
                  </div>
                  <div className="p-2 rounded-2xl border border-amber-500/50 bg-amber-950/20 shadow-xl">
                    {renderBracketCard(UPPER_MATCHES[7])}
                  </div>
                </div>
              )}
            </div>

            {/* Bracket Bottom Status */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400 shrink-0">
              <span>{activeEvent?.name || 'Tournament'} • 8-Alliance Double Elimination</span>
              <div className="flex items-center gap-3">
                <span className="text-amber-400 font-bold">Team {teamInfo.number} (Alliance 2 Finalists)</span>
                <span className="text-emerald-400 font-bold">BRACKET COMPLETE</span>
              </div>
            </div>
          </div>
        );

      case 'match_inspector':
        const isFinals = Array.isArray(selectedMatch.redScore);
        return (
          <div
            className="w-full h-full rounded-2xl border p-4 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div>
                  <div className="font-black text-white text-base">{selectedMatch.name}</div>
                  <div className="text-xs text-zinc-400 font-semibold">{selectedMatch.roundLabel}</div>
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                  {selectedMatch.winner === 'RED' ? 'RED WIN' : 'BLUE WIN'}
                </span>
              </div>

              {/* Red Alliance Card */}
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/60 space-y-2">
                <div className="flex items-center justify-between text-red-300 font-bold">
                  <span className="text-xs sm:text-sm">Alliance #{selectedMatch.redAllianceNumber} (RED)</span>
                  <span className="text-lg font-black text-white font-mono">
                    {isFinals
                      ? `${(selectedMatch.redScore as number[])[0]} - ${(selectedMatch.redScore as number[])[1]}`
                      : selectedMatch.redScore}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] text-zinc-400 uppercase font-semibold">Teams & Rosters:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMatch.redTeams.map((t) => (
                      <TeamBadge key={t} teamNumber={t} variant="red" highlight1002 />
                    ))}
                  </div>
                </div>
              </div>

              {/* Blue Alliance Card */}
              <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 space-y-2">
                <div className="flex items-center justify-between text-blue-300 font-bold">
                  <span className="text-xs sm:text-sm">Alliance #{selectedMatch.blueAllianceNumber} (BLUE)</span>
                  <span className="text-lg font-black text-white font-mono">
                    {isFinals
                      ? `${(selectedMatch.blueScore as number[])[0]} - ${(selectedMatch.blueScore as number[])[1]}`
                      : selectedMatch.blueScore}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[11px] text-zinc-400 uppercase font-semibold">Teams & Rosters:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMatch.blueTeams.map((t) => (
                      <TeamBadge key={t} teamNumber={t} variant="blue" highlight1002 />
                    ))}
                  </div>
                </div>
              </div>

              {/* Statbotics Projected Win Probability */}
              {selectedMatch.epaPred && (
                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-300 font-bold">
                    <span>Statbotics Win Expectancy</span>
                    <span className="text-amber-400 font-bold">
                      Red {selectedMatch.epaPred.winProb}% • Blue {100 - selectedMatch.epaPred.winProb}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-blue-900/60 overflow-hidden flex">
                    <div
                      className="bg-red-500 h-full transition-all"
                      style={{ width: `${selectedMatch.epaPred.winProb}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Video Action Bar */}
            <div className="pt-2 border-t border-zinc-800 space-y-1.5">
              {selectedMatch.videoYoutubeId && (
                <button
                  onClick={(e) => handlePlayVideo(e, selectedMatch)}
                  className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
                >
                  <PlayCircle size={15} />
                  <span>Launch Match Video Replay</span>
                </button>
              )}
            </div>
          </div>
        );

      case 'alliance_lineups': {
        const allianceSegment = segments.find((s) => s.id === 'alliance_lineups');
        const isFullWidth = allianceSegment?.colSpan === 'full' || allianceSegment?.colSpan === 'five-sixths';

        return (
          <div
            className="w-full h-full rounded-2xl border p-3 sm:p-4 shadow-xs flex flex-col overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-amber-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Playoff Alliances (Selection Order & Rosters)
                </span>
              </div>
              <span className="text-zinc-500 text-[11px] hidden sm:inline">
                {activeEvent?.name || 'Tournament'}
              </span>
            </div>

            {/* Scrollable Alliance Grid */}
            <div
              className={`flex-1 min-h-0 overflow-y-auto pr-1 my-2 no-scrollbar grid gap-2.5 ${
                isFullWidth
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {ALLIANCES_DATA.map((alliance) => {
                const isOurTeam =
                  alliance.captain === teamInfo.number || alliance.pick1 === teamInfo.number || alliance.pick2 === teamInfo.number;
                return (
                  <div
                    key={alliance.number}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between gap-2 transition-all ${
                      isOurTeam
                        ? 'bg-amber-950/40 border-amber-400/90 shadow-md ring-1 ring-amber-400/30'
                        : 'bg-black/40 border-zinc-800/90 hover:border-zinc-700'
                    }`}
                  >
                    {/* Alliance Number & Status */}
                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-white text-xs truncate">
                          Alliance #{alliance.number}
                        </span>
                        {isOurTeam && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400 text-black tracking-wide shrink-0">
                            {teamInfo.number}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap ${
                          alliance.status === 'CHAMPIONS'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : alliance.status === 'FINALISTS'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-800 text-zinc-400 border border-zinc-700/60'
                        }`}
                      >
                        {alliance.status}
                      </span>
                    </div>

                    {/* Team Badges with Captain indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>Captain • Pick 1 • Pick 2:</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <TeamBadge teamNumber={alliance.captain} highlight1002={alliance.captain === teamInfo.number} />
                        <TeamBadge teamNumber={alliance.pick1} highlight1002={alliance.pick1 === teamInfo.number} />
                        <TeamBadge teamNumber={alliance.pick2} highlight1002={alliance.pick2 === teamInfo.number} />
                      </div>
                    </div>

                    {/* Footer Info: EPA */}
                    <div className="text-[11px] text-zinc-400 flex justify-between pt-1 border-t border-zinc-800/60 font-mono">
                      <span>Alliance EPA:</span>
                      <span className="text-zinc-200 font-bold">{alliance.epa}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Footer */}
            <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0">
              <span>8 Alliances • 24 Teams</span>
              <span className="text-amber-400 font-bold">Alliance #2 (Captain {teamInfo.number})</span>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const visibleSegments = segments.filter((s) => s.visible);

  return (
    <div id="playoffs-view" className="space-y-2 animate-fade-in pb-8">
      {/* Top Banner Toolbar */}
      <div
        className="rounded-xl px-3 py-2 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Trophy size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs sm:text-sm">
                Double Elimination Playoff Bracket
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                FINALISTS (ALLIANCE 2)
              </span>
            </div>
            <div className="text-zinc-400 text-[11px] font-mono">
              {activeEvent?.name || 'Tournament'} • 8-Alliance Double Elimination
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-lg bg-black/40 border border-zinc-800 text-xs text-zinc-300">
            <span className="text-zinc-500 mr-1.5">Team {teamInfo.number} Alliance:</span>
            <span className="text-amber-400 font-bold">Alliance #2 (Captain)</span>
          </div>
        </div>
      </div>

      {/* Modular Layout Bar */}
      <ModularLayoutToolbar
        viewName="Playoffs Bracket"
        isCustomizing={isCustomizing}
        onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
        segments={segments}
        onToggleVisibility={toggleSegmentVisibility}
        onResetToDefault={resetToDefault}
        onApplyPreset={applyPreset}
      />

      {/* Grid with Dense Auto-Flow for Multidimensional Stacking */}
      <div
        className="grid grid-cols-12 gap-2 sm:gap-3 items-stretch"
        style={{
          gridAutoFlow: 'dense',
          gridAutoRows: 'minmax(62px, auto)',
        }}
      >
        {visibleSegments.map((seg) => (
          <ModularSegment
            key={seg.id}
            id={seg.id}
            title={seg.title}
            colSpan={seg.colSpan}
            heightMultiplier={seg.heightMultiplier}
            collapsed={seg.collapsed}
            isCustomizing={isCustomizing}
            onReorder={reorderSegments}
            onChangeColSpan={(span) => setSegmentColSpan(seg.id, span)}
            onChangeHeightMultiplier={(m) => setSegmentHeightMultiplier(seg.id, m)}
            onToggleCollapse={() => toggleSegmentCollapse(seg.id)}
            onToggleVisibility={() => toggleSegmentVisibility(seg.id)}
          >
            {renderSegmentContent(seg.id)}
          </ModularSegment>
        ))}
      </div>
    </div>
  );
};
