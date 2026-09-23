/**
 * Complete Match Schedule View (Dense TBA Beta Format)
 * 
 * Features:
 * - 3-Column modular framework with standard widget height (390px) and full-width height options (0.5x, 1x, 2x)
 * - Ultra-dense vertical match table with tight columns and minimal whitespace (matching TBA layout)
 * - Team 1002 highlighted with high-contrast accent badges
 * - Scope switcher: Team 1002 Only vs All Event Matches
 * - Team name hover tooltips on every team number
 * - Instant video replay triggers
 */

import React, { useState } from 'react';
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
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { MatchModel } from '../types';
import { SAMPLE_1002_MATCHES } from '../services';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  {
    id: 'match_table',
    title: 'Match Schedule Table',
    colSpan: 'two-thirds',
    order: 0,
    visible: true,
  },
  {
    id: 'schedule_stats',
    title: 'Team 1002 Standing & Controls',
    colSpan: 'third',
    order: 1,
    visible: true,
  },
];

export const ScheduleView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const activeEvent = usePitState(Selectors.activeEvent);
  const teamInfo = usePitState(Selectors.teamInfo);
  const fullSchedule = usePitState((s) => s.activeEvent.schedule);
  const allRankings = usePitState((s) => s.activeEvent.rankings);
  const teamRanking = allRankings.find((r) => r.teamNumber === teamInfo.number);

  const [scheduleScope, setScheduleScope] = useState<'1002_ONLY' | 'ALL'>('1002_ONLY');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

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
  } = useModularLayout('schedule_view', DEFAULT_SEGMENTS);

  // Combine store matches with sample matches
  const matches: MatchModel[] =
    fullSchedule && fullSchedule.length > 0 ? fullSchedule : SAMPLE_1002_MATCHES;

  const team1002Matches = matches.filter(
    (m) =>
      m.redAlliance.teams.includes(teamInfo.number) ||
      m.blueAlliance.teams.includes(teamInfo.number)
  );

  const activeMatches = scheduleScope === '1002_ONLY' ? team1002Matches : matches;

  const displayedMatches = activeMatches.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchStr = `q${m.matchNumber} qual ${m.matchNumber}`.toLowerCase();
    const allTeams = [...m.redAlliance.teams, ...m.blueAlliance.teams].join(' ');
    return matchStr.includes(q) || allTeams.includes(q);
  });

  const handleSyncTba = async () => {
    setIsSyncing(true);
    try {
      await Actions.pullTbaMatches();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleWatchReplay = (match: MatchModel) => {
    const videoKey = match.videos && match.videos.length > 0 ? match.videos[0].key : 'dQw4w9WgXcQ';
    Actions.playVideo(videoKey, `Qual ${match.matchNumber} - ${activeEvent.name}`);
    Actions.navigate('watch');
  };

  const formatShortTime = (timestamp?: number) => {
    if (!timestamp) return '--:--';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const completedCount = team1002Matches.filter((m) => m.status === 'COMPLETED').length;
  const total1002Matches = team1002Matches.length;

  const renderSegmentContent = (segId: string) => {
    switch (segId) {
      case 'match_table':
        return (
          <div
            className="w-full h-full rounded-2xl border p-4 shadow-xs flex flex-col justify-between overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Header / Filter Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800 shrink-0">
              {/* Scope Switcher */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-zinc-800">
                <button
                  onClick={() => setScheduleScope('1002_ONLY')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleScope === '1002_ONLY'
                      ? 'bg-amber-400 text-black shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Team 1002 Only ({team1002Matches.length})
                </button>
                <button
                  onClick={() => setScheduleScope('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    scheduleScope === 'ALL'
                      ? 'bg-zinc-700 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Event Matches ({matches.length})
                </button>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-60">
                <Search size={13} className="absolute left-2.5 top-2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter match # or team..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 rounded-lg bg-black/50 border border-zinc-800 text-zinc-200 text-xs outline-hidden focus:border-zinc-600 font-mono"
                />
              </div>
            </div>

            {/* Dense Match Schedule Table (Matching TBA Format) */}
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
                    <th className="py-2 px-2 text-center w-14">Video</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {displayedMatches.map((m) => {
                    const is1002Red = m.redAlliance.teams.includes(teamInfo.number);
                    const is1002Blue = m.blueAlliance.teams.includes(teamInfo.number);
                    const isOurMatch = is1002Red || is1002Blue;

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

                    return (
                      <tr
                        key={m.key || `m-${m.matchNumber}`}
                        className={`hover:bg-zinc-800/40 transition-colors ${
                          isOurMatch ? 'bg-amber-400/5' : ''
                        }`}
                      >
                        {/* Match Number */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              isOurMatch
                                ? 'bg-amber-400 text-black shadow-xs'
                                : 'bg-zinc-800 text-zinc-300'
                            }`}
                          >
                            Q{m.matchNumber}
                          </span>
                        </td>

                        {/* Scheduled Time */}
                        <td className="py-1.5 px-2 text-zinc-400 text-[10px] whitespace-nowrap hidden sm:table-cell">
                          {formatShortTime(m.scheduledTime)}
                        </td>

                        {/* Red Alliance */}
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1 flex-wrap">
                            {m.redAlliance.teams.map((t) => (
                              <TeamBadge
                                key={t}
                                teamNumber={t}
                                highlight1002={t === teamInfo.number}
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
                                highlight1002={t === teamInfo.number}
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

                        {/* Video Replay */}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleWatchReplay(m)}
                            className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-amber-400 transition-colors cursor-pointer inline-flex items-center justify-center"
                            title={`Watch replay for Qual ${m.matchNumber}`}
                          >
                            <PlayCircle size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Status */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
              <span>Showing {displayedMatches.length} matches</span>
              <span>The Blue Alliance Sync Active</span>
            </div>
          </div>
        );

      case 'schedule_stats':
        return (
          <div
            className="w-full h-full rounded-2xl border p-4 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="space-y-4">
              {/* Event & Team Header */}
              <div className="pb-3 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-white text-sm">Team 1002 Standing</span>
                  <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold text-[10px]">
                    QUAL ROUNDS
                  </span>
                </div>
                <div className="text-zinc-400 text-xs truncate">
                  {activeEvent.name || 'Peachtree District Championship'}
                </div>
              </div>

              {/* Standing Metric Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Current Rank</div>
                  <div className="text-2xl font-bold text-white mt-0.5">
                    #{teamRanking?.rank || 3}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    of {allRankings.length || 38} teams
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                  <div className="text-zinc-400 text-[10px] uppercase">Record (W-L-T)</div>
                  <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                    {teamRanking?.record.wins || 8}-{teamRanking?.record.losses || 2}-{teamRanking?.record.ties || 0}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    RP: {teamRanking?.rankingScore.toFixed(2) || '2.80'}
                  </div>
                </div>
              </div>

              {/* Qualification Progress Bar */}
              <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-300">Schedule Completion</span>
                  <span className="font-bold text-amber-400">
                    {completedCount} / {total1002Matches} Matches
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all rounded-full"
                    style={{
                      width: `${total1002Matches > 0 ? (completedCount / total1002Matches) * 100 : 80}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sync Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleSyncTba}
                  disabled={isSyncing}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} />
                  <span>{isSyncing ? 'Refreshing from TBA...' : 'Force TBA Schedule Sync'}</span>
                </button>
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

      default:
        return null;
    }
  };

  const visibleSegments = segments.filter((s) => s.visible);

  return (
    <div id="schedule-view" className="space-y-2 animate-fade-in pb-8">
      {/* Modular Layout Bar */}
      <ModularLayoutToolbar
        viewName="Match Schedule"
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
          gridAutoRows: 'minmax(185px, auto)',
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
