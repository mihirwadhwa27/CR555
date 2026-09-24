/**
 * Watch View - Match Video Replay Studio (Modular Layout)
 * Team 1002 CircuitRunners
 * 
 * Supports interactive match video playback, rewinding, phase jumping (Auto/Teleop/Endgame),
 * and pulling latest completed match videos from The Blue Alliance (TBA).
 * Fully modular segments with resizable column spans and reordering.
 */

import React, { useState, useEffect } from 'react';
import {
  Film,
  Play,
  Pause,
  RotateCcw,
  Rewind,
  FastForward,
  Trophy,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Tv,
  Zap,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { MatchModel } from '../types';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';
import { PlaceholderVideoFeed } from '../components/PlaceholderVideoFeed';
import { formatMatchLabel, sortTournamentMatches } from '../utils/matchUtils';

const DEFAULT_WATCH_SEGMENTS: SegmentConfig[] = [
  { id: 'video_screen', title: 'Match Video Replay', colSpan: 'two-thirds', heightMultiplier: 1.5, order: 0, visible: true },
  { id: 'match_selector', title: 'Completed Matches Playlist', colSpan: 'third', heightMultiplier: 1.5, order: 1, visible: true },
  { id: 'phase_controls', title: 'Playback Controls', colSpan: 'half', heightMultiplier: 1, order: 2, visible: true },
  { id: 'match_summary', title: 'Scorecard & Match Telemetry', colSpan: 'half', heightMultiplier: 1, order: 3, visible: true },
];

export const PreviousView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const teamInfo = usePitState(Selectors.teamInfo);
  const videoReplay = usePitState(Selectors.videoReplay);
  const activeEvent = usePitState(Selectors.activeEvent);
  const matches = usePitState(Selectors.matches);
  const [isPulling, setIsPulling] = useState(false);
  const [pullMessage, setPullMessage] = useState<string | null>(null);

  // Automatically sync TBA replays when event or team changes
  useEffect(() => {
    Actions.pullTbaMatches();
  }, [activeEvent?.key, teamInfo.number]);

  // Modular Layout Hook
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
  } = useModularLayout('watch_replay_studio', DEFAULT_WATCH_SEGMENTS);

  const rawCompletedMatches = matches.filter((m) => m.status === 'COMPLETED');
  const completedMatches = sortTournamentMatches(rawCompletedMatches);

  const handlePullTba = async () => {
    setIsPulling(true);
    setPullMessage(null);
    try {
      const res = await Actions.pullTbaMatches();
      if (res) {
        setPullMessage(res.message);
        setTimeout(() => setPullMessage(null), 4000);
      }
    } finally {
      setIsPulling(false);
    }
  };

  const handleSelectMatch = (m: MatchModel) => {
    if (m.videos && m.videos.length > 0) {
      const isBlue = m.blueAlliance.teams.includes(teamInfo.number);
      const isWinner = (isBlue && m.winner === 'blue') || (!isBlue && m.winner === 'red');
      const scoreStr = isWinner ? 'W' : 'L';
      Actions.selectReplayMatch(
        m.key,
        m.videos[0].key,
        `${formatMatchLabel(m)} - Team ${teamInfo.number} (${scoreStr} ${isBlue ? m.blueAlliance.score : m.redAlliance.score} - ${isBlue ? m.redAlliance.score : m.blueAlliance.score})`
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Find currently selected match object
  const activeMatch = matches.find((m) => m.key === videoReplay.activeMatchKey) || completedMatches[0];

  const renderSegmentContent = (segId: string) => {
    switch (segId) {
      case 'video_screen':
        return (
          <div
            className="w-full h-full rounded-2xl border overflow-hidden flex flex-col shadow-xs"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Header info */}
            <div className="p-3 bg-black/40 border-b border-zinc-800 flex items-center justify-between text-xs font-mono shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="font-bold text-white truncate max-w-[220px] sm:max-w-[420px]">
                  {videoReplay.matchTitle || 'Match Video Feed'}
                </span>
                {videoReplay.youtubeId && (
                  <a
                    href={`https://www.youtube.com/watch?v=${videoReplay.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white bg-zinc-800/90 px-2 py-0.5 rounded border border-zinc-700 transition-colors ml-1"
                    title="Open replay in YouTube"
                  >
                    <ExternalLink size={10} />
                    <span>Watch External</span>
                  </a>
                )}
              </div>
              <span className="text-zinc-500 text-[10px]">Official Match Video</span>
            </div>

            {/* Video Player - Proportional 16:9 responsive frame */}
            <div className="w-full aspect-video max-h-[360px] sm:max-h-[400px] bg-black relative flex flex-col items-center justify-center overflow-hidden mx-auto">
              {videoReplay.youtubeId ? (
                <iframe
                  key={videoReplay.youtubeId}
                  src={`https://www.youtube.com/embed/${videoReplay.youtubeId}?autoplay=1&playsinline=1&rel=0`}
                  title={videoReplay.matchTitle}
                  className="w-full h-full border-0 absolute inset-0 z-10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <PlaceholderVideoFeed
                  title={videoReplay.matchTitle || 'Match Replay Archive'}
                  matchName={videoReplay.matchTitle || `${activeEvent?.name || activeEvent?.shortName || 'Tournament'} • Match Replay Feed`}
                  isLive={false}
                />
              )}
            </div>
          </div>
        );

      case 'match_selector':
        return (
          <div
            className="w-full h-full rounded-2xl p-4 border flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono shrink-0">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                Available Match Replays
              </span>
              <button
                onClick={handlePullTba}
                disabled={isPulling}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Sync replays from TBA"
              >
                <RefreshCw size={11} className={isPulling ? 'animate-spin text-amber-400' : ''} />
                <span>Sync</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-2 no-scrollbar">
              {completedMatches.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs font-mono">
                  No completed matches recorded yet.
                </div>
              ) : (
                completedMatches.map((m) => {
                  const isSelected = m.key === videoReplay.activeMatchKey;
                  const isBlue = m.blueAlliance.teams.includes(teamInfo.number);
                  const isWinner =
                    (isBlue && m.winner === 'blue') || (!isBlue && m.winner === 'red');
                  const hasVideo = m.videos && m.videos.length > 0;

                  return (
                    <div
                      key={m.key}
                      onClick={() => handleSelectMatch(m)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs font-mono ${
                        isSelected
                          ? 'bg-amber-400/10 border-amber-400/80 shadow-xs'
                          : 'bg-black/30 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{formatMatchLabel(m)}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              isWinner
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {isWinner ? 'WON' : 'LOST'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Score: {m.redAlliance.score} - {m.blueAlliance.score}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasVideo ? (
                          <span className="text-amber-400">
                            <Play size={14} />
                          </span>
                        ) : (
                          <span className="text-zinc-600 text-[10px]">No TBA Vid</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      case 'phase_controls':
        return (
          <div
            className="w-full h-full rounded-2xl p-4 border shadow-xs space-y-3 overflow-y-auto no-scrollbar"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => Actions.sendVideoCommand('seek', 0)}
                  className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 cursor-pointer"
                  title="Replay from 0:00"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  onClick={() => Actions.sendVideoCommand('seek', videoReplay.currentTime - 10)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  <Rewind size={13} />
                  -10s
                </button>
                <button
                  onClick={() => Actions.sendVideoCommand(videoReplay.isPlaying ? 'pause' : 'play')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-xs cursor-pointer"
                >
                  {videoReplay.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  <span>{videoReplay.isPlaying ? 'Pause' : 'Play'}</span>
                </button>
                <button
                  onClick={() => Actions.sendVideoCommand('seek', videoReplay.currentTime + 10)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-xs font-bold text-zinc-300 cursor-pointer"
                >
                  +10s
                  <FastForward size={13} />
                </button>
              </div>

              {/* Playback speed options */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-zinc-500 text-[11px]">Speed:</span>
                {[0.5, 1.0, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => Actions.sendVideoCommand('rate', spd)}
                    className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                      videoReplay.playbackRate === spd
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'match_summary':
        if (!activeMatch) {
          return (
            <div className="p-6 text-center text-xs text-zinc-500 font-mono">
              Select a match to view match outcome and score breakdown.
            </div>
          );
        }

        const isBlue = activeMatch.blueAlliance.teams.includes(teamInfo.number);
        const blueScore = activeMatch.blueAlliance.score || 0;
        const redScore = activeMatch.redAlliance.score || 0;
        const winner = activeMatch.winner;

        return (
          <div
            className="rounded-2xl p-4 border shadow-xs space-y-3"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-white">
                Match Outcome • Qual {activeMatch.matchNumber}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                  winner === 'blue'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : winner === 'red'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {winner ? `${winner} Alliance Victory` : 'Completed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div
                className={`p-3 rounded-xl border ${
                  isBlue ? 'bg-blue-950/40 border-blue-600/50' : 'bg-black/30 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between text-blue-400 font-bold mb-2">
                  <span>BLUE ALLIANCE</span>
                  <span className="text-base text-white">{blueScore}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeMatch.blueAlliance.teams.map((t) => (
                    <TeamBadge key={t} teamNumber={t} variant="blue" />
                  ))}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  !isBlue ? 'bg-red-950/40 border-red-600/50' : 'bg-black/30 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between text-red-400 font-bold mb-2">
                  <span>RED ALLIANCE</span>
                  <span className="text-base text-white">{redScore}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeMatch.redAlliance.teams.map((t) => (
                    <TeamBadge key={t} teamNumber={t} variant="red" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleSegments = segments.filter((s) => s.visible);

  return (
    <div id="watch-studio-view" className="space-y-2 animate-fade-in pb-8">
      {/* Modular Toolbar */}
      <ModularLayoutToolbar
        viewName="Watch & Video Replay Studio"
        isCustomizing={isCustomizing}
        onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
        segments={segments}
        onToggleVisibility={toggleSegmentVisibility}
        onResetToDefault={resetToDefault}
        onApplyPreset={applyPreset}
      />

      {pullMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{pullMessage}</span>
        </div>
      )}

      {/* Modular Grid with Dense Auto-Flow for Multidimensional Stacking */}
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
