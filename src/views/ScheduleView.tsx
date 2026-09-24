/**
 * Unified Match Schedule & Video Replay Studio (Dense TBA Beta Format)
 * PitFUSION 2.0 - Team 1002 CircuitRunners
 * 
 * Features:
 * - Seamlessly merges Interactive Match Video Replay Theater with Complete Match Schedule
 * - Direct YouTube replay player with Autonomous (0:00), Teleop (0:15), and Endgame (2:00) scrubbers
 * - Dense vertical match table with tight columns matching official TBA tournament layout
 * - Full support for Qualifications (Qual 1..N), Playoffs (Playoff 1..13 matching double-elimination bracket), and Finals (Finals 1..3)
 * - Scope switcher: Team [Number] Only vs All Event Matches vs Replays Only
 * - Instant video replay triggers on any schedule row
 * - Quick Replay Playlist & Tournament Standing metrics
 * - Modular segment layout supporting custom column spans, height multipliers, collapsing, and reordering
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  ExternalLink,
  PlayCircle,
  RefreshCw,
  Search,
  Trophy,
  Filter,
  CheckCircle2,
  Clock,
  Film,
  Play,
  RotateCcw,
  Rewind,
  FastForward,
  Tv,
  Zap,
  Layers,
  Sparkles,
  Users,
  Youtube,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { MatchModel } from '../types';
import { TbaService } from '../services';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';
import { formatMatchLabel, getCompLevelBadgeClasses, sortTournamentMatches } from '../utils/matchUtils';
import { getTeamName, getTeamMetadata } from '../utils/teamLookup';

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  {
    id: 'video_screen',
    title: 'Match Video Replay Theater',
    colSpan: 'two-thirds',
    heightMultiplier: 1.5,
    order: 0,
    visible: true,
  },
  {
    id: 'replays_playlist',
    title: 'Match Replays Playlist',
    colSpan: 'third',
    heightMultiplier: 1.5,
    order: 1,
    visible: true,
  },
  {
    id: 'match_table',
    title: 'Complete Match Schedule Table',
    colSpan: 'two-thirds',
    heightMultiplier: 1.5,
    order: 2,
    visible: true,
  },
  {
    id: 'schedule_stats',
    title: 'Tournament Standings & Schedule Controls',
    colSpan: 'third',
    heightMultiplier: 1.5,
    order: 3,
    visible: true,
  },
];

export const ScheduleView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const activeEvent = usePitState(Selectors.activeEvent);
  const teamInfo = usePitState(Selectors.teamInfo);
  const fullSchedule = usePitState((s) => s.activeEvent.schedule);
  const allRankings = usePitState((s) => s.activeEvent.rankings);
  const videoReplay = usePitState(Selectors.videoReplay);
  const teamRanking = allRankings.find((r) => r.teamNumber === teamInfo.number);

  const [scheduleScope, setScheduleScope] = useState<'TEAM_ONLY' | 'ALL' | 'VIDEOS_ONLY'>('TEAM_ONLY');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const [videoTimestampOffset, setVideoTimestampOffset] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

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
  } = useModularLayout('schedule_view_unified', DEFAULT_SEGMENTS);

  // Automatically sync TBA matches when event or team changes
  useEffect(() => {
    Actions.pullTbaMatches();
  }, [activeEvent.key, teamInfo.number]);

  // Combine store matches with live generated matches for this exact team/event
  const rawMatches: MatchModel[] = useMemo(() => {
    return fullSchedule && fullSchedule.length > 0
      ? fullSchedule
      : TbaService.generateMatchesForTeamAndEvent(teamInfo.number, activeEvent.key);
  }, [fullSchedule, teamInfo.number, activeEvent.key]);

  const matches = useMemo(() => sortTournamentMatches(rawMatches), [rawMatches]);

  const teamMatches = useMemo(() => {
    return matches.filter(
      (m) =>
        m.redAlliance.teams.includes(teamInfo.number) ||
        m.blueAlliance.teams.includes(teamInfo.number)
    );
  }, [matches, teamInfo.number]);

  const completedWithVideos = useMemo(() => {
    return matches.filter((m) => m.videos && m.videos.length > 0);
  }, [matches]);

  const scopeFiltered = useMemo(() => {
    if (scheduleScope === 'TEAM_ONLY') return teamMatches;
    if (scheduleScope === 'VIDEOS_ONLY') return completedWithVideos;
    return matches;
  }, [scheduleScope, matches, teamMatches, completedWithVideos]);

  const displayedMatches = useMemo(() => {
    if (!searchQuery.trim()) return scopeFiltered;
    const q = searchQuery.toLowerCase().trim();
    return scopeFiltered.filter((m) => {
      const label = formatMatchLabel(m).toLowerCase();
      const shortLabel = formatMatchLabel(m, true).toLowerCase();
      const allTeams = [...m.redAlliance.teams, ...m.blueAlliance.teams].join(' ');
      return label.includes(q) || shortLabel.includes(q) || allTeams.includes(q);
    });
  }, [scopeFiltered, searchQuery]);

  // Current active match object for the video replay player
  const currentVideoMatch = useMemo(() => {
    return (
      matches.find((m) => m.key === videoReplay.activeMatchKey) ||
      completedWithVideos.find((m) => m.redAlliance.teams.includes(teamInfo.number) || m.blueAlliance.teams.includes(teamInfo.number)) ||
      completedWithVideos[0] ||
      matches[0]
    );
  }, [matches, videoReplay.activeMatchKey, completedWithVideos, teamInfo.number]);

  const handleSelectReplayMatch = (m: MatchModel, jumpTime: number = 0) => {
    setVideoTimestampOffset(jumpTime);
    const videoKey = m.videos && m.videos.length > 0 ? m.videos[0].key : '';
    const isBlue = m.blueAlliance.teams.includes(teamInfo.number);
    const isWinner = (isBlue && m.winner === 'blue') || (!isBlue && m.winner === 'red');
    const scoreStr = m.redAlliance.score !== null && m.blueAlliance.score !== null ? `(${isWinner ? 'W' : 'L'} ${isBlue ? m.blueAlliance.score : m.redAlliance.score} - ${isBlue ? m.redAlliance.score : m.blueAlliance.score})` : '';

    Actions.selectReplayMatch(
      m.key,
      videoKey,
      `${formatMatchLabel(m)} • Team ${teamInfo.number} ${scoreStr}`
    );
  };

  const handleJumpPhase = (seconds: number) => {
    setVideoTimestampOffset(seconds);
  };

  const handleSyncTba = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await Actions.pullTbaMatches();
      if (res) {
        setSyncMessage(res.message);
        setTimeout(() => setSyncMessage(null), 4000);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const formatShortTime = (timestamp?: number) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const completedCount = teamMatches.filter((m) => m.status === 'COMPLETED').length;
  const totalTeamMatches = teamMatches.length;

  const activeVideoKey = currentVideoMatch?.videos && currentVideoMatch.videos.length > 0 ? currentVideoMatch.videos[0].key : videoReplay.youtubeId;

  const renderSegmentContent = (segId: string) => {
    switch (segId) {
      case 'video_screen': {
        const isCurrentMatchTeam = currentVideoMatch && (currentVideoMatch.redAlliance.teams.includes(teamInfo.number) || currentVideoMatch.blueAlliance.teams.includes(teamInfo.number));
        const isRed = currentVideoMatch?.redAlliance.teams.includes(teamInfo.number);
        const isBlue = currentVideoMatch?.blueAlliance.teams.includes(teamInfo.number);
        const redWon = currentVideoMatch?.winner === 'red';
        const blueWon = currentVideoMatch?.winner === 'blue';
        const isTie = currentVideoMatch?.winner === 'tie';

        return (
          <div
            className="w-full h-full rounded-2xl border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Player Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center">
                  <Film size={14} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      {currentVideoMatch ? formatMatchLabel(currentVideoMatch) : 'Match Replay Theater'}
                    </span>
                    {currentVideoMatch && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${getCompLevelBadgeClasses(currentVideoMatch.compLevel, isCurrentMatchTeam, currentVideoMatch.key).badgeBg} ${getCompLevelBadgeClasses(currentVideoMatch.compLevel, isCurrentMatchTeam, currentVideoMatch.key).text}`}>
                        {currentVideoMatch.compLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-400 text-[10px] truncate">
                    {activeEvent.name || 'FIRST Robotics Competition'}
                  </div>
                </div>
              </div>

              {/* Match Score Strip */}
              {currentVideoMatch && currentVideoMatch.redAlliance.score !== null && currentVideoMatch.blueAlliance.score !== null && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 border border-zinc-800">
                  <div className={`flex items-center gap-1 font-bold ${redWon ? 'text-red-400' : 'text-zinc-300'}`}>
                    <span className="text-[10px] text-zinc-500 uppercase">Red</span>
                    <span className="text-sm">{currentVideoMatch.redAlliance.score}</span>
                  </div>
                  <span className="text-zinc-600 font-bold">-</span>
                  <div className={`flex items-center gap-1 font-bold ${blueWon ? 'text-blue-400' : 'text-zinc-300'}`}>
                    <span className="text-sm">{currentVideoMatch.blueAlliance.score}</span>
                    <span className="text-[10px] text-zinc-500 uppercase">Blue</span>
                  </div>
                  {isCurrentMatchTeam && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded text-[10px] font-black ${
                      (isRed && redWon) || (isBlue && blueWon)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isTie
                        ? 'bg-zinc-700 text-zinc-300'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {(isRed && redWon) || (isBlue && blueWon) ? 'VICTORY' : isTie ? 'TIE' : 'DEFEAT'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Video Iframe Viewport */}
            <div className="relative w-full flex-1 min-h-[220px] max-h-[420px] bg-black rounded-xl overflow-hidden my-2.5 border border-zinc-800 shadow-inner flex items-center justify-center">
              {activeVideoKey ? (
                <iframe
                  key={`${activeVideoKey}-${videoTimestampOffset}`}
                  src={`https://www.youtube.com/embed/${activeVideoKey}?autoplay=1&start=${videoTimestampOffset}&rel=0&enablejsapi=1`}
                  title={currentVideoMatch ? formatMatchLabel(currentVideoMatch) : 'Match Replay'}
                  className="w-full h-full absolute inset-0 border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 gap-2.5 p-6 text-center">
                  <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500">
                    <Tv size={28} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-200">
                      Individual Match Recording Pending TBA Archive
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Match video is being processed or event is currently live.
                    </p>
                  </div>
                  {activeEvent?.webcasts && activeEvent.webcasts.length > 0 && (
                    <button
                      onClick={() => {
                        const yt = activeEvent.webcasts.find((w) => w.type === 'youtube') || activeEvent.webcasts[0];
                        Actions.selectReplayMatch(
                          currentVideoMatch ? currentVideoMatch.key : 'live',
                          yt.channel,
                          `${activeEvent.name || 'Event'} • YouTube Live Stream`
                        );
                      }}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Youtube size={13} />
                      <span>Switch to Event YouTube Live Stream</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Replay Scrubbing & Phase Control Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800 shrink-0">
              {/* Match Phase Jump Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-500 text-[10px] uppercase font-bold mr-1 hidden sm:inline">Jump:</span>
                <button
                  onClick={() => handleJumpPhase(0)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    videoTimestampOffset === 0
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                  title="Jump to Autonomous Start (0:00)"
                >
                  <Rewind size={11} />
                  <span>Auto (0:00)</span>
                </button>
                <button
                  onClick={() => handleJumpPhase(15)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    videoTimestampOffset === 15
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                  title="Jump to Teleop Period (0:15)"
                >
                  <Play size={10} />
                  <span>Teleop (0:15)</span>
                </button>
                <button
                  onClick={() => handleJumpPhase(120)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    videoTimestampOffset === 120
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                  }`}
                  title="Jump to Endgame Period (2:00)"
                >
                  <FastForward size={11} />
                  <span>Endgame (2:00)</span>
                </button>
              </div>

              {/* YouTube Link & Refresh */}
              <div className="flex items-center gap-2">
                {activeVideoKey && (
                  <a
                    href={`https://www.youtube.com/watch?v=${activeVideoKey}&t=${videoTimestampOffset}s`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-[11px] font-bold transition-colors"
                  >
                    <span>Open in YouTube</span>
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'replays_playlist': {
        return (
          <div
            className="w-full h-full rounded-2xl border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Film size={14} className="text-amber-400" />
                <span className="font-bold text-white text-xs sm:text-sm">Available Replays</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                {completedWithVideos.length} Replays
              </span>
            </div>

            {/* Scrollable Replay Cards */}
            <div className="flex-1 overflow-y-auto my-2 space-y-2 pr-1 no-scrollbar">
              {completedWithVideos.length === 0 ? (
                <div className="p-6 text-center text-zinc-500">
                  <Film size={24} className="mx-auto mb-2 opacity-50" />
                  <p>No video replays loaded for this event yet.</p>
                </div>
              ) : (
                completedWithVideos.map((m) => {
                  const isSelected = m.key === currentVideoMatch?.key;
                  const isOurMatch = m.redAlliance.teams.includes(teamInfo.number) || m.blueAlliance.teams.includes(teamInfo.number);
                  const is1002Red = m.redAlliance.teams.includes(teamInfo.number);
                  const is1002Blue = m.blueAlliance.teams.includes(teamInfo.number);
                  const redWon = m.winner === 'red';
                  const blueWon = m.winner === 'blue';
                  const isTie = m.winner === 'tie';

                  let badgeColor = 'bg-zinc-800 text-zinc-300';
                  if (isOurMatch) {
                    const won = (is1002Red && redWon) || (is1002Blue && blueWon);
                    badgeColor = isTie ? 'bg-zinc-700 text-zinc-200' : won ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                  }

                  return (
                    <div
                      key={m.key}
                      onClick={() => handleSelectReplayMatch(m)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-400/15 border-amber-500/60 shadow-xs'
                          : 'bg-black/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                          <Play size={10} className={isSelected ? 'text-amber-400 fill-amber-400' : 'text-zinc-400'} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white truncate text-xs">
                              {formatMatchLabel(m)}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${getCompLevelBadgeClasses(m.compLevel, isOurMatch, m.key).badgeBg} ${getCompLevelBadgeClasses(m.compLevel, isOurMatch, m.key).text}`}>
                              {formatMatchLabel(m, true)}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            <span className={redWon ? 'text-red-400 font-bold' : 'text-zinc-400'}>
                              {m.redAlliance.score}
                            </span>
                            <span className="text-zinc-600">-</span>
                            <span className={blueWon ? 'text-blue-400 font-bold' : 'text-zinc-400'}>
                              {m.blueAlliance.score}
                            </span>
                            {isOurMatch && (
                              <span className={`px-1 rounded text-[9px] font-black ${badgeColor}`}>
                                {(is1002Red && redWon) || (is1002Blue && blueWon) ? 'W' : isTie ? 'T' : 'L'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-500 font-mono shrink-0">
                        {formatShortTime(m.actualTime || m.scheduledTime)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-500 text-center shrink-0">
              Click any match to launch instant high-definition video playback
            </div>
          </div>
        );
      }

      case 'match_table': {
        return (
          <div
            className="w-full h-full rounded-2xl border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Header Toolbar: Scope Selector & Search Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-zinc-800 shrink-0">
              {/* Scope Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-zinc-800 overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setScheduleScope('TEAM_ONLY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    scheduleScope === 'TEAM_ONLY'
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Team {teamInfo.number} ({teamMatches.length})
                </button>
                <button
                  onClick={() => setScheduleScope('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    scheduleScope === 'ALL'
                      ? 'bg-zinc-700 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Matches ({matches.length})
                </button>
                <button
                  onClick={() => setScheduleScope('VIDEOS_ONLY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    scheduleScope === 'VIDEOS_ONLY'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Film size={11} />
                  <span>With Replays ({completedWithVideos.length})</span>
                </button>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-64">
                <Search size={13} className="absolute left-2.5 top-2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search (e.g. Q12, P3, F1, 1002)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 rounded-lg bg-black/50 border border-zinc-800 text-zinc-200 text-xs outline-hidden focus:border-zinc-600 font-mono"
                />
              </div>
            </div>

            {/* Dense TBA-Style Tournament Match Table */}
            <div className="flex-1 overflow-y-auto my-2 pr-1 no-scrollbar">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="sticky top-0 z-10 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase bg-black/90 backdrop-blur-xs">
                    <th className="py-2 px-2 text-center w-14">Match</th>
                    <th className="py-2 px-2 w-16 hidden sm:table-cell">Time</th>
                    <th className="py-2 px-2">Red Alliance</th>
                    <th className="py-2 px-2">Blue Alliance</th>
                    <th className="py-2 px-2 text-center w-20">Scores</th>
                    <th className="py-2 px-2 text-center w-12 hidden md:table-cell">Diff</th>
                    <th className="py-2 px-2 text-center w-16">Watch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {displayedMatches.map((m) => {
                    const is1002Red = m.redAlliance.teams.includes(teamInfo.number);
                    const is1002Blue = m.blueAlliance.teams.includes(teamInfo.number);
                    const isOurMatch = is1002Red || is1002Blue;
                    const isSelectedInPlayer = m.key === currentVideoMatch?.key;

                    const redWon =
                      m.status === 'COMPLETED' &&
                      m.redAlliance.score !== null &&
                      m.blueAlliance.score !== null &&
                      m.redAlliance.score > m.blueAlliance.score;
                    const blueWon =
                      m.status === 'COMPLETED' &&
                      m.redAlliance.score !== null &&
                      m.blueAlliance.score !== null &&
                      m.blueAlliance.score > m.redAlliance.score;
                    const isTie =
                      m.status === 'COMPLETED' &&
                      m.redAlliance.score !== null &&
                      m.blueAlliance.score !== null &&
                      m.redAlliance.score === m.blueAlliance.score;

                    let ourResult: 'W' | 'L' | 'T' | null = null;
                    let diffText = '--';
                    if (m.status === 'COMPLETED' && m.redAlliance.score !== null && m.blueAlliance.score !== null) {
                      const diff = Math.abs(m.redAlliance.score - m.blueAlliance.score);
                      if (isOurMatch) {
                        const won = (is1002Red && redWon) || (is1002Blue && blueWon);
                        ourResult = isTie ? 'T' : won ? 'W' : 'L';
                        diffText = `${ourResult === 'W' ? '+' : ourResult === 'L' ? '-' : ''}${diff}`;
                      } else {
                        diffText = `${diff}`;
                      }
                    }

                    const badgeStyle = getCompLevelBadgeClasses(m.compLevel, isOurMatch, m.key);
                    const shortLabel = formatMatchLabel(m, true);
                    const fullLabel = formatMatchLabel(m);

                    const hasVideo = m.videos && m.videos.length > 0;

                    return (
                      <tr
                        key={m.key || `m-${m.matchNumber}-${m.compLevel}`}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          isSelectedInPlayer
                            ? 'bg-amber-400/15'
                            : isOurMatch
                            ? 'bg-amber-400/5'
                            : ''
                        }`}
                      >
                        {/* Match Label */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] border ${badgeStyle.badgeBg} ${badgeStyle.border} ${badgeStyle.text}`}
                            title={fullLabel}
                          >
                            {shortLabel}
                          </span>
                        </td>

                        {/* Scheduled / Actual Time */}
                        <td className="py-1.5 px-2 text-zinc-400 text-[10px] whitespace-nowrap hidden sm:table-cell">
                          {formatShortTime(m.actualTime || m.scheduledTime)}
                        </td>

                        {/* Red Alliance */}
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {m.redAlliance.teams.map((t) => (
                              <TeamBadge
                                key={t}
                                teamNumber={t}
                                highlightActive={t === teamInfo.number}
                                variant={redWon ? 'red' : 'default'}
                              />
                            ))}
                          </div>
                        </td>

                        {/* Blue Alliance */}
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {m.blueAlliance.teams.map((t) => (
                              <TeamBadge
                                key={t}
                                teamNumber={t}
                                highlightActive={t === teamInfo.number}
                                variant={blueWon ? 'blue' : 'default'}
                              />
                            ))}
                          </div>
                        </td>

                        {/* Scores */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          {m.status === 'COMPLETED' ? (
                            <div className="flex items-center justify-center gap-1 text-[11px]">
                              <span className={redWon ? 'font-bold text-red-400' : 'text-zinc-400'}>
                                {m.redAlliance.score}
                              </span>
                              <span className="text-zinc-600">-</span>
                              <span className={blueWon ? 'font-bold text-blue-400' : 'text-zinc-400'}>
                                {m.blueAlliance.score}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500">Upcoming</span>
                          )}
                        </td>

                        {/* Diff */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap hidden md:table-cell">
                          <span
                            className={`text-[10px] font-bold ${
                              ourResult === 'W'
                                ? 'text-emerald-400'
                                : ourResult === 'L'
                                ? 'text-rose-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            {diffText}
                          </span>
                        </td>

                        {/* Video Replay Action */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          {hasVideo ? (
                            <button
                              onClick={() => handleSelectReplayMatch(m)}
                              className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer ${
                                isSelectedInPlayer
                                  ? 'bg-amber-400 text-black shadow-xs'
                                  : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-amber-400'
                              }`}
                              title={`Watch high-definition replay for ${fullLabel}`}
                            >
                              <PlayCircle size={12} />
                              <span>Play</span>
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-[10px]">--</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Status */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
              <span>Showing {displayedMatches.length} tournament matches</span>
              <span>All TBA Replays Synced</span>
            </div>
          </div>
        );
      }

      case 'schedule_stats': {
        return (
          <div
            className="w-full h-full rounded-2xl border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="space-y-3.5">
              {/* Event & Team Header */}
              <div className="pb-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm truncate max-w-[200px]">
                    Team {teamInfo.number} • {teamInfo.name}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px]">
                    TOURNAMENT
                  </span>
                </div>
                <div className="text-zinc-400 text-xs truncate">
                  {activeEvent.name || 'Tournament Schedule'}
                </div>
              </div>

              {/* Standing Metric Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Current Rank</div>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    {teamRanking?.rank ? `#${teamRanking.rank}` : allRankings.length > 0 ? 'Unranked' : '#3'}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    of {allRankings.length || 38} teams
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Record (W-L-T)</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                    {teamRanking
                      ? `${teamRanking.record.wins}-${teamRanking.record.losses}-${teamRanking.record.ties}`
                      : '0-0-0'}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    RP: {teamRanking?.rankingScore ? teamRanking.rankingScore.toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>

              {/* Schedule Completion Progress Bar */}
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Matches Played</span>
                  <span className="font-bold text-amber-400">
                    {completedCount} / {totalTeamMatches}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all rounded-full"
                    style={{
                      width: `${totalTeamMatches > 0 ? (completedCount / totalTeamMatches) * 100 : 80}%`,
                    }}
                  />
                </div>
              </div>

              {/* Force Sync Action */}
              <div className="space-y-2">
                <button
                  onClick={handleSyncTba}
                  disabled={isSyncing}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Refreshing from TBA...' : 'Force Refresh Matches & Replays'}</span>
                </button>
                {syncMessage && (
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center text-[10px]">
                    {syncMessage}
                  </div>
                )}
              </div>
            </div>

            {/* TBA Link */}
            <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-zinc-400 text-[11px]">
              <a
                href={`https://beta.thebluealliance.com/event/${activeEvent.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
              >
                <span>View Event on TBA</span>
                <ExternalLink size={11} />
              </a>
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
    <div id="schedule-view" className="space-y-2 animate-fade-in pb-8">
      {/* Modular Layout Bar */}
      <ModularLayoutToolbar
        viewName="Schedule & Replays"
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
