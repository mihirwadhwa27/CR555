import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Clock,
  Radio,
  ChevronDown,
  ChevronUp,
  Calendar,
  Zap,
} from 'lucide-react';
import { usePitState, Selectors, Actions } from '../../store';
import { formatMatchLabel } from '../../utils/matchUtils';
import { TbaService } from '../../services';

interface LiveActivityPillProps {
  compact?: boolean;
  className?: string;
}

/**
 * Apple Dynamic Island & Live Activity Style Arena Pill
 * Features:
 * - Fluid container with zero outer clipping or overlap
 * - Synchronized live countdown identical to Home Dashboard
 * - Dynamic synchrony with "Next Match Scouting & Matchup"
 * - Inset floating Apple Live Activity expansion card
 * - Strict tabular numbers (font-mono / tabular-nums)
 */
export const LiveActivityPill: React.FC<LiveActivityPillProps> = ({
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const matchInfo = usePitState(Selectors.effectiveMatchInfo);
  const nextMatchFromStore = usePitState(Selectors.nextUpcomingMatch);
  const queue = usePitState(Selectors.queue);
  const teamInfo = usePitState(Selectors.teamInfo);
  const matches = usePitState(Selectors.matches);
  const activeEvent = usePitState(Selectors.activeEvent);
  const countdownSeconds = usePitState(Selectors.countdownSeconds);
  const pulseMode = usePitState(Selectors.pulseSimulatorState);

  // Close dropdown on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsExpanded(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const effectiveMatches = useMemo(() => {
    return matches && matches.length > 0
      ? matches
      : TbaService.generateMatchesForTeamAndEvent(teamInfo.number, activeEvent?.key || '2026gacmp');
  }, [matches, teamInfo.number, activeEvent?.key]);

  // Find the exact active next match (matching "Next Match Scouting & Matchup")
  const nextMatch = useMemo(() => {
    if (nextMatchFromStore) return nextMatchFromStore;
    if (matchInfo.nextMatchNumber) {
      const found = effectiveMatches.find((m) => m.matchNumber === matchInfo.nextMatchNumber);
      if (found) return found;
    }
    // Search team matches
    const teamMatches = effectiveMatches.filter(
      (m) =>
        m.redAlliance.teams.includes(teamInfo.number) ||
        m.blueAlliance.teams.includes(teamInfo.number)
    );
    const uncompleted = teamMatches.find((m) => m.status !== 'COMPLETED');
    if (uncompleted) return uncompleted;
    return teamMatches[0] || effectiveMatches[0];
  }, [nextMatchFromStore, matchInfo.nextMatchNumber, effectiveMatches, teamInfo.number]);

  const isRed = useMemo(() => {
    if (nextMatch) {
      return nextMatch.redAlliance.teams.includes(teamInfo.number);
    }
    return matchInfo.allianceColor === 'red';
  }, [nextMatch, teamInfo.number, matchInfo.allianceColor]);

  const matchNumber = nextMatch?.matchNumber || matchInfo.nextMatchNumber || 13;

  // Exact synchronized formatting identical to Home Page Dashboard
  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const isUrgent = countdownSeconds <= 300; // Under 5 minutes = urgent on-deck

  const allianceBg = isRed
    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
    : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

  const handleOpenSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextMatch?.key) {
      Actions.selectScheduleMatch(nextMatch.key);
    } else {
      Actions.navigate('schedule');
    }
    setIsExpanded(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Dynamic Island Compact Pill Bar - Self-contained with zero outside overlays */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={`group relative flex items-center justify-between gap-2.5 px-3 py-1 rounded-full border transition-all duration-200 backdrop-blur-2xl bg-black/95 text-white shadow-md overflow-hidden cursor-pointer select-none ${
          isUrgent
            ? 'border-amber-400/80 shadow-[inset_0_0_8px_rgba(251,191,36,0.2)]'
            : 'border-white/15 hover:border-white/30'
        } ${isExpanded ? 'border-amber-400/70 bg-zinc-950' : ''}`}
        style={{
          boxShadow: isUrgent
            ? '0 2px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)'
            : '0 2px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
        title={`Next Match Q${matchNumber} • Click to toggle Live Activity`}
      >
        {/* Left: Alliance Dot & Match Label */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isRed ? 'bg-rose-500 shadow-rose-500/50' : 'bg-blue-500 shadow-blue-500/50'
            } ${isUrgent ? 'animate-pulse' : ''}`}
          />
          <span className="font-extrabold text-[11px] tracking-tight uppercase font-mono flex items-center gap-1">
            <span className="text-zinc-400 text-[10px] hidden sm:inline">Next</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800/90 text-amber-400 font-bold border border-zinc-700/80 text-[11px]">
              Q{matchNumber}
            </span>
          </span>
        </div>

        {/* Center: Alliance Station Badge */}
        <span
          className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border font-mono tracking-wider shrink-0 ${allianceBg}`}
        >
          {isRed ? 'RED' : 'BLUE'}
        </span>

        {/* Right: Unified Tabular Countdown Timer & Chevron */}
        <div className="flex items-center gap-1.5 font-mono shrink-0">
          <Clock size={11} className={isUrgent ? 'text-amber-400 animate-pulse' : 'text-zinc-400'} />
          <span
            className={`text-xs font-bold tabular-nums tracking-wider ${
              isUrgent ? 'text-amber-300 font-extrabold' : 'text-white'
            }`}
          >
            {pulseMode === 'NO_MATCHES' || (nextMatch?.status === 'COMPLETED' && pulseMode === 'AUTO')
              ? 'FINAL'
              : formatCountdown(countdownSeconds)}
          </span>
          <span className="text-zinc-500 group-hover:text-zinc-300 transition-colors ml-0.5">
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </div>
      </button>

      {/* Expanded Mode: Floating Apple Live Activity Card Popover */}
      {isExpanded && (
        <div
          className="absolute right-0 top-full mt-2.5 z-50 w-80 sm:w-96 rounded-3xl bg-zinc-950/95 backdrop-blur-2xl border border-white/20 p-4 sm:p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
          style={{
            boxShadow: '0 20px 48px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Apple Inset Grabber Handle */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto -mt-1 mb-2" />

          {/* Header Strip: Match & Live Status */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRed ? 'bg-rose-500 shadow-rose-500/50' : 'bg-blue-500 shadow-blue-500/50'
                } shadow-md`}
              />
              <span className="font-extrabold text-sm text-white uppercase tracking-tight">
                {nextMatch ? formatMatchLabel(nextMatch) : `Qual ${matchNumber}`}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
              <Clock size={11} className="animate-pulse" />
              <span>
                {pulseMode === 'NO_MATCHES'
                  ? 'All Matches Completed'
                  : pulseMode === 'NOW_QUEUING'
                  ? 'Now Queuing'
                  : pulseMode === 'ON_DECK'
                  ? 'On Deck'
                  : countdownSeconds > 0
                  ? `In ${formatCountdown(countdownSeconds)}`
                  : 'ON DECK NOW'}
              </span>
            </div>
          </div>

          {/* Queue & Staging Banner */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Radio size={14} className="text-emerald-400 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="text-zinc-400 font-medium">Arena Queuing: </span>
                <span className="font-bold text-white font-mono">
                  {queue?.nowQueuingMatchNumber ? `Match ${queue.nowQueuingMatchNumber}` : 'On Schedule'}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              {pulseMode === 'NO_MATCHES'
                ? 'COMPLETED'
                : pulseMode === 'NOW_QUEUING'
                ? 'REPORT TO GATE'
                : pulseMode === 'ON_DECK' || isUrgent
                ? 'STAGE AT QUEUE'
                : 'IN PIT STAGING'}
            </span>
          </div>

          {/* Alliance Breakdown */}
          {nextMatch && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Red Alliance */}
              <div
                className={`p-2.5 rounded-2xl border ${
                  isRed ? 'bg-rose-950/40 border-rose-500/50' : 'bg-zinc-900/60 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-rose-400 mb-1.5">
                  <span>RED ALLIANCE</span>
                  {isRed && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/25 text-rose-300 font-black">
                      OUR STATION
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 font-mono font-bold text-white text-xs flex-wrap">
                  {nextMatch.redAlliance.teams.map((t) => (
                    <span
                      key={t}
                      className={`px-1.5 py-0.5 rounded ${
                        t === teamInfo.number
                          ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                          : 'bg-black/60 text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Blue Alliance */}
              <div
                className={`p-2.5 rounded-2xl border ${
                  !isRed ? 'bg-blue-950/40 border-blue-500/50' : 'bg-zinc-900/60 border-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-blue-400 mb-1.5">
                  <span>BLUE ALLIANCE</span>
                  {!isRed && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/25 text-blue-300 font-black">
                      OUR STATION
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 font-mono font-bold text-white text-xs flex-wrap">
                  {nextMatch.blueAlliance.teams.map((t) => (
                    <span
                      key={t}
                      className={`px-1.5 py-0.5 rounded ${
                        t === teamInfo.number
                          ? 'bg-amber-400 text-black font-extrabold shadow-xs'
                          : 'bg-black/60 text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
            <button
              type="button"
              onClick={handleOpenSchedule}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer py-1"
            >
              <Calendar size={13} />
              <span>Open in Match Schedule →</span>
            </button>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-300 cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
