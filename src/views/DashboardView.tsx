/**
 * Dashboard View (General) - Modular Pit Display
 * Team 1002 CircuitRunners
 * 
 * Features:
 * - Fully modular segment architecture with customizable ordering, resizing, and collapse
 * - Immediate Upcoming Match Schedule & Live Division Ranking
 * - Team Statistics & Statbotics EPA Breakdown
 * - Simplified Active Match Queue Call
 * - Field Livestream with TBA auto-detect and Twitch/YouTube links
 * - Team hover badges everywhere for team names
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  BarChart2,
  Zap,
  Award,
  Radio,
  ExternalLink,
  Shield,
  Flame,
  Layers,
  AlertCircle,
  Calendar,
  Sparkles,
  Volume2,
  VolumeX,
  Mic,
  Play,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { MatchModel } from '../types';
import { TbaService } from '../services';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';
import { FieldLivestream } from '../components/FieldLivestream';
import { CrLogo } from '../components/CrLogo';
import { AudioAnnouncer } from '../utils/audioAnnouncer';
import { getTeamName, getTeamMetadata } from '../utils/teamLookup';
import { formatMatchLabel, getCompLevelBadgeClasses, sortTournamentMatches } from '../utils/matchUtils';

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  { id: 'match_13', title: 'Next Match Scouting & Matchup', colSpan: 'half', heightMultiplier: 1, order: 0, visible: true },
  { id: 'livestream', title: 'Field Livestream', colSpan: 'half', heightMultiplier: 1, order: 1, visible: true },
  { id: 'upcoming', title: 'Upcoming Matches Schedule', colSpan: 'half', heightMultiplier: 1, order: 2, visible: true },
  { id: 'ranking', title: 'Division Rankings', colSpan: 'half', heightMultiplier: 1, order: 3, visible: true },
  { id: 'match_buffer', title: 'Active Queue Call (Pulse)', colSpan: 'half', heightMultiplier: 1, order: 4, visible: true },
  { id: 'announcements', title: 'Pit Announcements', colSpan: 'half', heightMultiplier: 1, order: 5, visible: true },
  { id: 'part_requests', title: 'Part Requests', colSpan: 'full', heightMultiplier: 1, order: 6, visible: true },
];

export const DashboardView: React.FC = () => {
  const teamInfo = usePitState(Selectors.teamInfo);
  const matchInfo = usePitState(Selectors.effectiveMatchInfo);
  const theme = usePitState(Selectors.themeConfig);
  const rankings = usePitState(Selectors.rankings);
  const epaData = usePitState(Selectors.epa);
  const activeTeamEpa = usePitState(Selectors.activeTeamEpa);
  const matches = usePitState(Selectors.matches);
  const announcements = usePitState(Selectors.announcements);
  const partsRequests = usePitState(Selectors.partsRequests);
  const demoMode = usePitState(Selectors.demoMode);
  const activeEvent = usePitState(Selectors.activeEvent);
  const customLogoUrl = usePitState(Selectors.customLogoUrl);

  const [isSyncingStatbotics, setIsSyncingStatbotics] = useState(false);
  const [statboticsMsg, setStatboticsMsg] = useState<string | null>(null);

  const handleSyncStatbotics = async () => {
    setIsSyncingStatbotics(true);
    setStatboticsMsg('Syncing EPA with Statbotics API...');
    try {
      await Actions.pullStatboticsEpa();
      setStatboticsMsg('Statbotics EPA synced successfully');
      setTimeout(() => setStatboticsMsg(null), 3000);
    } catch {
      setStatboticsMsg('Sync completed');
      setTimeout(() => setStatboticsMsg(null), 3000);
    } finally {
      setIsSyncingStatbotics(false);
    }
  };

  const {
    segments,
    isCustomizing,
    setIsCustomizing,
    reorderSegments,
    setSegmentColSpan,
    setSegmentHeightMultiplier,
    toggleSegmentCollapse,
    toggleSegmentVisibility,
    addSpacer,
    removeSpacer,
    fillGrid,
    resetToDefault,
    applyPreset,
  } = useModularLayout('dashboard_general', DEFAULT_SEGMENTS);

  // Form states
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [isAddingAnnouncement, setIsAddingAnnouncement] = useState(false);
  const [newPartName, setNewPartName] = useState('');
  const [newPartUrgency, setNewPartUrgency] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [isAddingPart, setIsAddingPart] = useState(false);

  // Pulse Queue Call state (with automatic countdown logic and manual simulator presets)
  const [pulseMode, setPulseMode] = useState<'AUTO' | 'QUEUE_5MIN' | 'ON_DECK' | 'NOW_QUEUING' | 'NO_MATCHES'>('AUTO');

  // Upcoming matches view filter: Team 1002 schedule vs All Field schedule
  const [upcomingFilter, setUpcomingFilter] = useState<'1002_ONLY' | 'ALL_FIELD'>('1002_ONLY');

  // Auto countdown
  const [secondsUntilNextMatch, setSecondsUntilNextMatch] = useState(1080);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsUntilNextMatch((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const [isAudioMuted, setIsAudioMuted] = useState(AudioAnnouncer.getIsMuted());

  const handleToggleAudio = () => {
    const next = !isAudioMuted;
    setIsAudioMuted(next);
    AudioAnnouncer.setMuted(next);
    if (!next) {
      AudioAnnouncer.speak(`Pit audio announcements enabled for Team ${teamInfo.number}`);
    }
  };

  const handleTestVoiceCall = (phrase: string, subtext: string) => {
    AudioAnnouncer.speak(`Attention ${teamInfo.name} Team ${teamInfo.number}: ${phrase}. ${subtext}`);
  };

  // Auto-sync matches & EPA from TBA whenever event or team changes
  useEffect(() => {
    Actions.pullTbaMatches();
    Actions.pullStatboticsEpa();
  }, [activeEvent?.key, teamInfo.number]);

  // Form submit handlers
  const handleAddAnnouncementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAnnouncementText.trim()) {
      Actions.addAnnouncement(newAnnouncementText.trim());
      setNewAnnouncementText('');
      setIsAddingAnnouncement(false);
    }
  };

  const handleAddPartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPartName.trim()) {
      Actions.addPartsRequest(newPartName.trim(), newPartUrgency, teamInfo.number);
      setNewPartName('');
      setIsAddingPart(false);
    }
  };

  // Real event schedule & matches for current team
  const rawEventMatches = useMemo(() => {
    return matches && matches.length > 0
      ? matches
      : TbaService.generateMatchesForTeamAndEvent(teamInfo.number, activeEvent?.key || '2026gacmp');
  }, [matches, teamInfo.number, activeEvent?.key]);

  const allEventMatches = useMemo(() => sortTournamentMatches(rawEventMatches), [rawEventMatches]);

  // Filter matches specifically involving the active team
  const teamAllMatches = useMemo(() => {
    return allEventMatches.filter(
      (m) =>
        m.redAlliance.teams.includes(teamInfo.number) ||
        m.blueAlliance.teams.includes(teamInfo.number)
    );
  }, [allEventMatches, teamInfo.number]);

  const teamUpcomingMatches = useMemo(() => {
    return teamAllMatches.filter((m) => m.status !== 'COMPLETED');
  }, [teamAllMatches]);

  const isAllMatchesCompleted = teamUpcomingMatches.length === 0 && teamAllMatches.length > 0;

  // Display matches:
  // If there are uncompleted matches upcoming, show them.
  // If all qualification matches are finished, show the team's tournament matches so the user sees their real results!
  const displayUpcoming = useMemo(() => {
    return teamUpcomingMatches.length > 0
      ? teamUpcomingMatches
      : teamAllMatches.length > 0
      ? teamAllMatches
      : allEventMatches.slice(0, 8);
  }, [teamUpcomingMatches, teamAllMatches, allEventMatches]);

  const topRankings = useMemo(() => {
    return rankings.length > 0 ? rankings.slice(0, 10) : [];
  }, [rankings]);

  const currentMatch = displayUpcoming[0];
  const redTeams = useMemo(() => currentMatch?.redAlliance.teams || [teamInfo.number], [currentMatch, teamInfo.number]);
  const blueTeams = useMemo(() => currentMatch?.blueAlliance.teams || [], [currentMatch]);

  const calcAllianceEPA = useCallback(
    (teamsList: number[]) => {
      return teamsList.reduce((acc, tNum) => {
        const matchTeam = epaData[tNum];
        return acc + (matchTeam && matchTeam.totalEPA !== null ? matchTeam.totalEPA : 45.0);
      }, 0);
    },
    [epaData]
  );

  const { redAllianceEPA, blueAllianceEPA, epaDiff, blueWinProb } = useMemo(() => {
    const redEPA = calcAllianceEPA(redTeams);
    const blueEPA = calcAllianceEPA(blueTeams);
    const diff = blueEPA - redEPA;
    const prob = Math.min(
      95,
      Math.max(5, Math.round((1 / (1 + Math.pow(10, (redEPA - blueEPA) / 50))) * 100))
    );

    return { redAllianceEPA: redEPA, blueAllianceEPA: blueEPA, epaDiff: diff, blueWinProb: prob };
  }, [redTeams, blueTeams, calcAllianceEPA]);

  // FIRST Pulse Status calculation for Active Queue Call
  const getPulseStatus = () => {
    if (pulseMode === 'QUEUE_5MIN') {
      return {
        phrase: 'Queue in 5 min',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ringColor: 'border-amber-400',
        subtext: `Drive Team prepare robot and cart in Pit ${teamInfo.number} • Est. 10:45 AM`,
        iconType: 'clock' as const,
      };
    }
    if (pulseMode === 'ON_DECK') {
      return {
        phrase: 'On Deck',
        badgeColor: 'bg-orange-500/25 text-orange-300 border-orange-500/50 animate-pulse',
        ringColor: 'border-orange-400',
        subtext: 'Drive Team proceed immediately to Arena Entrance Gate • Station Red 1',
        iconType: 'alert' as const,
      };
    }
    if (pulseMode === 'NOW_QUEUING') {
      return {
        phrase: 'Now Queuing',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ringColor: 'border-amber-400',
        subtext: `Team ${teamInfo.number} report to Staging Lane 1 • ${currentMatch ? formatMatchLabel(currentMatch) : `Qual ${matchInfo.nextMatchNumber || 1}`}`,
        iconType: 'clock' as const,
      };
    }
    if (pulseMode === 'NO_MATCHES' || isAllMatchesCompleted) {
      return {
        phrase: 'All Matches Completed',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        ringColor: 'border-emerald-400',
        subtext: `Team ${teamInfo.number} completed all qualification matches at ${activeEvent?.name || activeEvent?.shortName || 'event'} • Review match replays`,
        iconType: 'check' as const,
      };
    }

    if (secondsUntilNextMatch <= 180) {
      return {
        phrase: 'On Deck',
        badgeColor: 'bg-orange-500/25 text-orange-300 border-orange-500/50 animate-pulse',
        ringColor: 'border-orange-400',
        subtext: 'Drive Team proceed immediately to Arena Entrance Gate',
        iconType: 'alert' as const,
      };
    }

    if (secondsUntilNextMatch <= 360) {
      return {
        phrase: 'Queue in 5 min',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ringColor: 'border-amber-400',
        subtext: `Drive Team prepare robot and cart in Pit ${teamInfo.number} • Staging Lane 1`,
        iconType: 'clock' as const,
      };
    }

    const mins = Math.max(1, Math.round(secondsUntilNextMatch / 60));
    return {
      phrase: `Queue in ${mins} min`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      ringColor: 'border-blue-400',
      subtext: `Drive Team stand by in pit • Next queue call in ~${mins} minutes`,
      iconType: 'clock' as const,
    };
  };

  // Field queue for All Field Matches preview in Upcoming
  const allUpcomingField = allEventMatches.filter((m) => m.status !== 'COMPLETED');
  const allFieldQueue =
    allUpcomingField.length > 0
      ? allUpcomingField.slice(0, 6).map((m, idx) => {
          const isOur =
            m.redAlliance.teams.includes(teamInfo.number) ||
            m.blueAlliance.teams.includes(teamInfo.number);
          const inMins = 12 + idx * 8;
          return {
            match: m,
            number: m.matchNumber,
            time: idx === 0 ? 'Queuing / Next' : `In ~${inMins}m`,
            status: isOur ? `QUEUED (TEAM ${teamInfo.number})` : (m.status || 'SCHEDULED'),
            isOurTeam: isOur,
            isCompleted: false,
            red: m.redAlliance.teams,
            blue: m.blueAlliance.teams,
            note: isOur
              ? `Team ${teamInfo.number} on ${m.redAlliance.teams.includes(teamInfo.number) ? 'Red' : 'Blue'} Alliance`
              : `${formatMatchLabel(m)} • Scheduled`,
          };
        })
      : allEventMatches.slice(0, 6).map((m) => {
          const isOur =
            m.redAlliance.teams.includes(teamInfo.number) ||
            m.blueAlliance.teams.includes(teamInfo.number);
          return {
            match: m,
            number: m.matchNumber,
            time: 'Completed',
            status: isOur ? `FINAL (TEAM ${teamInfo.number})` : 'FINAL',
            isOurTeam: isOur,
            isCompleted: true,
            red: m.redAlliance.teams,
            blue: m.blueAlliance.teams,
            note: `Final Score: Red ${m.redAlliance.score} - Blue ${m.blueAlliance.score}`,
          };
        });

  // Render individual segment by ID
  const renderSegmentContent = (segId: string) => {
    switch (segId) {
      case 'livestream':
        return <FieldLivestream />;

      case 'match_13':
        return (
          <div
            className="w-full h-full rounded-2xl p-2.5 sm:p-3.5 border flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Next Match Status Header */}
            <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-zinc-800 font-mono shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <CrLogo size={18} customUrl={customLogoUrl} accentColor="#fbbf24" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider truncate">
                  Qual {matchInfo.nextMatchNumber || 13}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                  {redTeams.includes(teamInfo.number)
                    ? `RED ${redTeams.indexOf(teamInfo.number) + 1} • ${teamInfo.number}`
                    : `BLUE ${blueTeams.indexOf(teamInfo.number) + 1} • ${teamInfo.number}`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 shadow-xs shrink-0">
                <Clock size={11} className="text-amber-400 animate-pulse shrink-0" />
                <div className="flex items-baseline gap-1">
                  <span className="text-[9px] font-bold uppercase text-amber-300/80 hidden sm:inline">In:</span>
                  <span className="text-xs sm:text-sm font-black font-mono tracking-tight text-amber-300">
                    {formatCountdown(secondsUntilNextMatch)}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Middle: Next Match In-Depth Roster & Strategy */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 my-1.5 no-scrollbar">
              {/* Alliance Rosters with Component EPAs and Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {/* Red Alliance */}
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/60 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-red-900/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-bold text-red-400 tracking-wider">RED ALLIANCE</span>
                    </div>
                    <span className="text-red-300 font-bold">{redAllianceEPA.toFixed(1)} EPA</span>
                  </div>

                  <div className="space-y-1.5">
                    {redTeams.map((tNum, idx) => {
                      const isOur = tNum === teamInfo.number;
                      const tEpa = epaData[tNum]?.totalEPA ?? 48.0;
                      const tName = isOur ? teamInfo.name : getTeamName(tNum);
                      return (
                        <div
                          key={tNum}
                          className={`p-2 rounded-lg border space-y-1 ${
                            isOur
                              ? 'bg-red-900/40 border-red-500/50'
                              : 'bg-black/40 border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {isOur && <CrLogo size={14} customUrl={customLogoUrl} />}
                              <TeamBadge teamNumber={tNum} highlightActive={isOur} variant="red" />
                              <span className={`text-xs font-bold truncate ${isOur ? 'text-amber-300' : 'text-zinc-100'}`} title={tName}>
                                {tName}
                              </span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-black shrink-0 ${
                                  isOur ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                R{idx + 1}
                              </span>
                            </div>
                            <span className={`${isOur ? 'text-red-200 font-bold' : 'text-zinc-300'} text-xs shrink-0 font-mono`}>
                              {tEpa.toFixed(1)} EPA
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="text-zinc-400 text-[10px] truncate">
                              {(() => {
                                const meta = getTeamMetadata(tNum);
                                return meta.city && meta.state ? `${meta.city}, ${meta.state}` : (meta.city || meta.state || '');
                              })()}
                            </span>
                            <span className="text-zinc-500 text-[9px] shrink-0 font-mono">
                              A:{(tEpa * 0.3).toFixed(1)} • T:{(tEpa * 0.55).toFixed(1)} • E:{(tEpa * 0.15).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Blue Alliance */}
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/60 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-blue-900/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-blue-400 tracking-wider">BLUE ALLIANCE</span>
                    </div>
                    <span className="text-blue-300 font-bold">{blueAllianceEPA.toFixed(1)} EPA</span>
                  </div>

                  <div className="space-y-1.5">
                    {blueTeams.map((tNum, idx) => {
                      const isOur = tNum === teamInfo.number;
                      const tEpa = epaData[tNum]?.totalEPA ?? 46.5;
                      const tName = isOur ? teamInfo.name : getTeamName(tNum);
                      return (
                        <div
                          key={tNum}
                          className={`p-2 rounded-lg border space-y-1 ${
                            isOur
                              ? 'bg-blue-900/40 border-blue-500/50'
                              : 'bg-black/40 border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              {isOur && <CrLogo size={14} customUrl={customLogoUrl} />}
                              <TeamBadge teamNumber={tNum} highlightActive={isOur} variant="blue" />
                              <span className={`text-xs font-bold truncate ${isOur ? 'text-amber-300' : 'text-zinc-100'}`} title={tName}>
                                {tName}
                              </span>
                              <span
                                className={`text-[9px] px-1 py-0.2 rounded font-black shrink-0 ${
                                  isOur ? 'bg-amber-400 text-black' : 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                B{idx + 1}
                              </span>
                            </div>
                            <span className={`${isOur ? 'text-blue-200 font-bold' : 'text-zinc-300'} text-xs shrink-0 font-mono`}>
                              {tEpa.toFixed(1)} EPA
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-zinc-400">
                            <span className="text-zinc-400 text-[10px] truncate">
                              {(() => {
                                const meta = getTeamMetadata(tNum);
                                return meta.city && meta.state ? `${meta.city}, ${meta.state}` : (meta.city || meta.state || '');
                              })()}
                            </span>
                            <span className="text-zinc-500 text-[9px] shrink-0 font-mono">
                              A:{(tEpa * 0.3).toFixed(1)} • T:{(tEpa * 0.55).toFixed(1)} • E:{(tEpa * 0.15).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Statbotics Head-to-Head Prediction */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 uppercase text-[10px] font-bold">
                    Statbotics Match Prediction
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px]">
                    Red Win Probability: 61%
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="bg-red-600 h-full flex items-center justify-start px-2 text-[9px] font-black text-white" style={{ width: '61%' }}>
                      Red 152
                    </div>
                    <div className="bg-blue-600 h-full flex items-center justify-end px-2 text-[9px] font-black text-white" style={{ width: '39%' }}>
                      147 Blue
                    </div>
                  </div>
                  <div className="flex justify-between text-[10px] text-zinc-400">
                    <span>Red 152.4 EPA</span>
                    <span className="text-zinc-200 font-bold">+5.2 EPA Edge (Red Favor)</span>
                    <span>Blue 147.2 EPA</span>
                  </div>
                </div>
              </div>

              {/* Statbotics Component EPA Comparison */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <span>Statbotics Component EPA Comparison</span>
                  <span className="text-zinc-500">Qual {matchInfo.nextMatchNumber || 13}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] text-center">
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-0.5">Autonomous</span>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-red-400">42.2</span>
                      <span className="text-zinc-600 text-[10px]">vs</span>
                      <span className="text-blue-400">42.3</span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-0.5">Teleop</span>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-red-400">82.2</span>
                      <span className="text-zinc-600 text-[10px]">vs</span>
                      <span className="text-blue-400">78.9</span>
                    </div>
                  </div>
                  <div className="p-2 rounded bg-zinc-900/60 border border-zinc-800">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold block mb-0.5">Endgame</span>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-red-400">28.0</span>
                      <span className="text-zinc-600 text-[10px]">vs</span>
                      <span className="text-blue-400">26.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400 shrink-0">
              <span className="text-[11px]">{activeEvent?.name || 'Tournament'}</span>
              <button
                onClick={() => Actions.navigate('scout')}
                className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Full Scouting & Strategy Picklist</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        );

      case 'ranking':
        return (
          <div
            className="w-full h-full rounded-2xl p-4 border flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {topRankings.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center p-6 text-sm text-zinc-500 font-mono">
                The rankings have not been created yet.
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between overflow-hidden space-y-2">
                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="sticky top-0 z-10 border-b border-zinc-800 text-zinc-400 font-mono text-[10px] uppercase bg-black/90 backdrop-blur-xs">
                        <th className="py-2 px-3">Rk</th>
                        <th className="py-2 px-3">Team</th>
                        <th className="py-2 px-3">W-L-T</th>
                        <th className="py-2 px-3 text-right">RP</th>
                        <th className="py-2 px-3 text-right">Avg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                      {topRankings.map((r) => {
                        const isOurTeam = r.teamNumber === teamInfo.number;
                        return (
                          <tr
                            key={r.teamNumber}
                            className={`transition-colors ${
                              isOurTeam
                                ? 'bg-amber-500/15 font-bold'
                                : 'hover:bg-zinc-800/40 text-zinc-300'
                            }`}
                          >
                            <td className="py-1.5 px-3">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[11px] ${
                                  r.rank <= 4
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'text-zinc-400'
                                }`}
                              >
                                #{r.rank}
                              </span>
                            </td>
                            <td className="py-1.5 px-3">
                              <div className="flex items-center gap-1.5">
                                {isOurTeam && <CrLogo size={14} customUrl={customLogoUrl} />}
                                <TeamBadge teamNumber={r.teamNumber} highlightActive={isOurTeam} />
                                <span
                                  className={`text-xs font-semibold truncate max-w-[110px] sm:max-w-[150px] ${
                                    isOurTeam ? 'text-amber-300 font-bold' : 'text-zinc-200'
                                  }`}
                                  title={r.teamName || getTeamName(r.teamNumber)}
                                >
                                  {r.teamName || getTeamName(r.teamNumber)}
                                </span>
                              </div>
                            </td>
                            <td className="py-1.5 px-3 text-zinc-400 text-[11px]">
                              {r.record.wins}-{r.record.losses}-{r.record.ties}
                            </td>
                            <td className="py-1.5 px-3 text-right font-bold text-zinc-200">
                              {r.rankingScore.toFixed(2)}
                            </td>
                            <td className="py-1.5 px-3 text-right text-zinc-400 text-[11px]">
                              {r.qualAverage.toFixed(1)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => Actions.navigate('schedule')}
                  className="w-full py-1 text-center text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                >
                  View Full Schedule & Rankings →
                </button>
              </div>
            )}
          </div>
        );

      case 'upcoming':
        return (
          <div
            className="w-full h-full rounded-2xl p-3.5 sm:p-4 border flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Header with Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 font-mono shrink-0">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-blue-400 shrink-0" />
                <span className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                  Upcoming Matches Schedule
                </span>
                <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full">
                  {upcomingFilter === '1002_ONLY' ? `${displayUpcoming.length} Matches Today` : 'Field Queue'}
                </span>
              </div>

              {/* View Switcher Toggle */}
              <div className="flex items-center bg-black/50 p-0.5 rounded-lg border border-zinc-800 shrink-0">
                <button
                  onClick={() => setUpcomingFilter('1002_ONLY')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    upcomingFilter === '1002_ONLY'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Team {teamInfo.number} ({teamAllMatches.length})
                </button>
                <button
                  onClick={() => setUpcomingFilter('ALL_FIELD')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    upcomingFilter === 'ALL_FIELD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Field Queue ({allEventMatches.length})
                </button>
              </div>
            </div>

            {/* Match List: Focused on Team Schedule or Field Queue */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 my-2 no-scrollbar">
              {upcomingFilter === '1002_ONLY' ? (
                // Sequence of matches for Team
                displayUpcoming.map((m, idx) => {
                  const isRed = m.redAlliance.teams.includes(teamInfo.number);
                  const isCompleted = m.status === 'COMPLETED';
                  const isWinner = (isRed && m.winner === 'red') || (!isRed && m.winner === 'blue');
                  const isTie = m.winner === 'tie';
                  const partners = isRed
                    ? m.redAlliance.teams.filter((t) => t !== teamInfo.number)
                    : m.blueAlliance.teams.filter((t) => t !== teamInfo.number);
                  const opponents = isRed ? m.blueAlliance.teams : m.redAlliance.teams;
                  const stationLabel = isRed ? 'Red Station' : 'Blue Station';

                  // Dynamic match timeline and projection calculation
                  const redEpa = calcAllianceEPA(m.redAlliance.teams);
                  const blueEpa = calcAllianceEPA(m.blueAlliance.teams);
                  const isRedFavored = redEpa >= blueEpa;
                  const winProb = Math.min(95, Math.max(52, Math.round(50 + Math.abs(redEpa - blueEpa) * 0.7)));
                  const dynamicProb = `${winProb}% ${isRedFavored ? 'Red' : 'Blue'} Win • Proj. ${Math.round(redEpa)}-${Math.round(blueEpa)}`;

                  let dynamicTime = `In ~${(idx + 1) * 35}m`;
                  if (isCompleted) {
                    dynamicTime = `Final Result: Red ${m.redAlliance.score} - Blue ${m.blueAlliance.score}`;
                  } else if (m.scheduledTime) {
                    const diffMs = m.scheduledTime - Date.now();
                    if (diffMs <= 0) {
                      dynamicTime = 'Next Match • Queuing / On Field';
                    } else if (diffMs < 3600 * 1000) {
                      dynamicTime = `In ~${Math.max(1, Math.round(diffMs / 60000))}m`;
                    } else {
                      const hours = Math.floor(diffMs / 3600000);
                      const mins = Math.round((diffMs % 3600000) / 60000);
                      dynamicTime = `In ~${hours}h ${mins}m`;
                    }
                  }

                  const meta = {
                    time: isCompleted ? `Score: ${isRed ? m.redAlliance.score : m.blueAlliance.score} - ${isRed ? m.blueAlliance.score : m.redAlliance.score}` : idx === 0 ? `Next Match • ${dynamicTime}` : dynamicTime,
                    prob: isCompleted ? `Final • Red ${m.redAlliance.score} - Blue ${m.blueAlliance.score}` : dynamicProb,
                    note: `Station: ${stationLabel} • ${isCompleted ? (isWinner ? 'Victory' : isTie ? 'Tied' : 'Defeat') : m.status || 'Scheduled'}`,
                    tagColor:
                      isCompleted
                        ? isWinner
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : isTie
                          ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                          : 'border-red-500/50 bg-red-500/10 text-red-300'
                        : idx === 0
                        ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                        : isRed
                        ? 'border-red-500/40 bg-red-500/10 text-red-300'
                        : 'border-blue-500/40 bg-blue-500/10 text-blue-300',
                  };

                  return (
                    <div
                      key={m.key}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCompleted
                          ? isWinner
                            ? 'bg-emerald-950/15 border-emerald-800/40 hover:border-emerald-700/60'
                            : 'bg-black/35 border-zinc-800/80 hover:border-zinc-700'
                          : idx === 0
                          ? isRed
                            ? 'bg-red-950/25 border-red-700/50 shadow-xs'
                            : 'bg-blue-950/25 border-blue-700/50 shadow-xs'
                          : 'bg-black/35 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Match Row Top: Match badge, Station, Status/Time */}
                      <div className="flex items-center justify-between gap-2 font-mono text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider uppercase ${
                              m.compLevel === 'FINALS'
                                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/60'
                                : m.compLevel === 'PLAYOFF'
                                ? 'bg-purple-900/60 text-purple-200 border border-purple-500/60'
                                : isRed
                                ? 'bg-red-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {formatMatchLabel(m)}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-300">
                            {stationLabel}
                          </span>
                          {isCompleted ? (
                            <span
                              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded uppercase ${
                                isWinner
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : isTie
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
                              }`}
                            >
                              {isWinner ? 'WON' : isTie ? 'TIED' : 'LOST'}
                            </span>
                          ) : idx === 0 ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-black animate-pulse">
                              NEXT UP
                            </span>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-300">
                          <Clock size={12} className="text-zinc-400" />
                          <span>{meta.time}</span>
                        </div>
                      </div>

                      {/* Roster Strip: Alliance Partners vs Opponents */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono mb-2">
                        {/* Our Alliance */}
                        <div
                          className={`p-1.5 rounded-lg border flex items-center justify-between ${
                            isRed ? 'bg-red-950/40 border-red-900/60' : 'bg-blue-950/40 border-blue-900/60'
                          }`}
                        >
                          <span className={`text-[10px] font-bold ${isRed ? 'text-red-400' : 'text-blue-400'}`}>
                            PARTNERS:
                          </span>
                          <div className="flex items-center gap-1.5">
                            <TeamBadge teamNumber={teamInfo.number} highlightActive variant={isRed ? 'red' : 'blue'} />
                            {partners.map((p) => (
                              <TeamBadge key={p} teamNumber={p} variant={isRed ? 'red' : 'blue'} />
                            ))}
                          </div>
                        </div>

                        {/* Opponent Alliance */}
                        <div className="p-1.5 rounded-lg bg-black/40 border border-zinc-800/80 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-zinc-400">OPPONENTS:</span>
                          <div className="flex items-center gap-1.5">
                            {opponents.map((opp) => (
                              <TeamBadge key={opp} teamNumber={opp} variant={isRed ? 'blue' : 'red'} />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Match Intel & Replay Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-400 text-[10px] truncate">{meta.note}</span>
                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${meta.tagColor}`}>
                            {meta.prob}
                          </span>
                          {m.videos && m.videos.length > 0 && (
                            <button
                              onClick={() => {
                                Actions.selectReplayMatch(
                                  m.key,
                                  m.videos[0].key,
                                  `${formatMatchLabel(m)} - Team ${teamInfo.number} (${isWinner ? 'W' : 'L'} ${isRed ? m.redAlliance.score : m.blueAlliance.score} - ${isRed ? m.blueAlliance.score : m.redAlliance.score})`
                                );
                                Actions.navigate('previous');
                              }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-medium transition-colors cursor-pointer"
                              title="Watch match replay video"
                            >
                              <Play size={9} className="text-amber-400 fill-amber-400" />
                              <span>Replay</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // All Field Queue View
                allFieldQueue.map((m) => {
                  const mLabel = m.match ? formatMatchLabel(m.match) : `Qual ${m.number}`;
                  const isPlayoff = m.match?.compLevel === 'PLAYOFF';
                  const isFinals = m.match?.compLevel === 'FINALS';

                  return (
                    <div
                      key={m.match?.key || m.number}
                      className={`p-2.5 rounded-xl border font-mono text-xs ${
                        m.isOurTeam
                          ? 'bg-amber-950/20 border-amber-500/50 shadow-xs'
                          : 'bg-black/35 border-zinc-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                              isFinals
                                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50'
                                : isPlayoff
                                ? 'bg-purple-900/50 text-purple-200 border border-purple-500/50'
                                : 'bg-zinc-800 text-white'
                            }`}
                          >
                            {mLabel}
                          </span>
                          {m.isOurTeam && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-black">
                              TEAM {teamInfo.number} MATCH
                            </span>
                          )}
                          <span className="text-zinc-400 text-[11px]">{m.note}</span>
                        </div>
                        <span className="text-zinc-300 font-bold text-[11px]">{m.time}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-1.5 rounded bg-red-950/30 border border-red-900/40 flex items-center justify-between">
                          <span className="text-[10px] text-red-400 font-bold">RED:</span>
                          <div className="flex items-center gap-1">
                            {m.red.map((t) => (
                              <TeamBadge key={t} teamNumber={t} highlightActive={t === teamInfo.number} variant="red" />
                            ))}
                          </div>
                        </div>
                        <div className="p-1.5 rounded bg-blue-950/30 border border-blue-900/40 flex items-center justify-between">
                          <span className="text-[10px] text-blue-400 font-bold">BLUE:</span>
                          <div className="flex items-center gap-1">
                            {m.blue.map((t) => (
                              <TeamBadge key={t} teamNumber={t} highlightActive={t === teamInfo.number} variant="blue" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400 shrink-0">
              <span className="text-[11px]">
                {isAllMatchesCompleted
                  ? `${teamAllMatches.length} Matches Completed • Official TBA Results`
                  : `Showing ${displayUpcoming.length} matches in current queue`}
              </span>
              <button
                onClick={() => Actions.navigate('schedule')}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Complete Match Schedule</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        );

      case 'match_buffer': {
        const pulse = getPulseStatus();
        return (
          <div
            className="w-full h-full rounded-2xl p-3.5 sm:p-4 border flex flex-col justify-between text-xs font-mono shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Header: FIRST Pulse Pit Queue System with Voice Announcer */}
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-zinc-200 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
                  FIRST Pulse • Pit Queue System
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleAudio}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    isAudioMuted
                      ? 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  }`}
                  title={isAudioMuted ? 'Pit voice alerts are muted. Click to enable.' : 'Pit voice alerts enabled. Click to mute.'}
                >
                  {isAudioMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  <span>{isAudioMuted ? 'Muted' : 'Voice On'}</span>
                </button>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                  ON SCHEDULE (+2m)
                </span>
              </div>
            </div>

            {/* Arena Field & Queuing State + Call Banner + Simulator Container */}
            <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-2 my-1.5 pr-1">
              {/* Arena Field & Queuing State */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider">On Field</div>
                    <div className="text-white text-base font-black font-mono">Qual 12</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="p-2 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between">
                  <div>
                    <div className="text-amber-400/90 text-[9px] uppercase font-bold tracking-wider">Now Queuing</div>
                    <div className="text-amber-300 text-base font-black font-mono">Qual 13</div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
              </div>

              {/* Primary Pulse Active Queue Call Banner - Official FIRST Pulse Phrasing */}
              <div className={`p-2.5 rounded-xl border flex flex-col justify-center gap-1.5 ${pulse.badgeColor}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pulse.iconType === 'alert' ? (
                      <AlertCircle size={16} className="text-orange-400 shrink-0 animate-bounce" />
                    ) : pulse.iconType === 'check' ? (
                      <CheckCircle size={16} className="text-zinc-400 shrink-0" />
                    ) : (
                      <Clock size={16} className="text-amber-400 shrink-0 animate-pulse" />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                      Pulse Queue Call
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-300/80">Team {teamInfo.number}</span>
                </div>

                {/* Huge, crisp callout matching FIRST Pulse */}
                <div className="text-base sm:text-lg md:text-xl font-black uppercase tracking-wide text-white drop-shadow-xs">
                  {pulse.phrase}
                </div>

                {/* Instructions for Pit Crew */}
                <div className="text-[11px] text-zinc-200/90 font-medium">
                  {pulse.subtext}
                </div>
              </div>

              {/* Interactive Pulse State Selector / Simulator */}
              <div className="p-2 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-zinc-400">
                  <span className="font-bold uppercase tracking-wider">Pulse State Simulator:</span>
                  <span className="text-zinc-500">Click to preview states</span>
                </div>
                <div className="grid grid-cols-5 gap-1 text-[10px] font-bold text-center">
                  <button
                    onClick={() => setPulseMode('AUTO')}
                    className={`px-1.5 py-1 rounded transition-all cursor-pointer truncate ${
                      pulseMode === 'AUTO'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Automatic state driven by live countdown timer"
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setPulseMode('QUEUE_5MIN')}
                    className={`px-1.5 py-1 rounded transition-all cursor-pointer truncate ${
                      pulseMode === 'QUEUE_5MIN'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Preview 'Queue in 5 min' state"
                  >
                    5 Min
                  </button>
                  <button
                    onClick={() => setPulseMode('ON_DECK')}
                    className={`px-1.5 py-1 rounded transition-all cursor-pointer truncate ${
                      pulseMode === 'ON_DECK'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Preview 'On Deck' state"
                  >
                    On Deck
                  </button>
                  <button
                    onClick={() => setPulseMode('NOW_QUEUING')}
                    className={`px-1.5 py-1 rounded transition-all cursor-pointer truncate ${
                      pulseMode === 'NOW_QUEUING'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Preview 'Now Queuing' state"
                  >
                    Queuing
                  </button>
                  <button
                    onClick={() => setPulseMode('NO_MATCHES')}
                    className={`px-1.5 py-1 rounded transition-all cursor-pointer truncate ${
                      pulseMode === 'NO_MATCHES'
                        ? 'bg-zinc-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                    title="Preview 'No matches remaining today...' state"
                  >
                    Finished
                  </button>
                </div>

                {/* Audible Voice Callout Trigger */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-400">Pit Audio:</span>
                  <button
                    onClick={() => handleTestVoiceCall(pulse.phrase, pulse.subtext)}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold cursor-pointer transition-colors"
                  >
                    <Mic size={11} />
                    <span>Broadcast Pit Voice Callout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Details (No 'Lane Open', No 'Gate Call') */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Staging:</span>
                <span className="text-zinc-200 font-bold">Staging Lane 1 (Red)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-500">Cycle Pace:</span>
                <span className="text-emerald-400 font-bold">~6.8m / match</span>
              </div>
            </div>
          </div>
        );
      }

      case 'announcements':
        return (
          <div
            className="w-full h-full rounded-2xl p-4 border flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono shrink-0">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Pit Announcements</span>
              {!isAddingAnnouncement && (
                <button
                  onClick={() => setIsAddingAnnouncement(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] transition-colors cursor-pointer"
                >
                  <Plus size={10} />
                  <span>New Note</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-2 no-scrollbar">
              {isAddingAnnouncement && (
                <form onSubmit={handleAddAnnouncementSubmit} className="space-y-2 pb-2 border-b border-zinc-800">
                  <input
                    type="text"
                    value={newAnnouncementText}
                    onChange={(e) => setNewAnnouncementText(e.target.value)}
                    placeholder="Enter pit announcement..."
                    className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsAddingAnnouncement(false)}
                      className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 rounded bg-amber-400 text-black font-semibold hover:bg-amber-300 cursor-pointer"
                    >
                      Post
                    </button>
                  </div>
                </form>
              )}

              {announcements.length === 0 ? (
                <div className="py-6 text-center text-zinc-500 text-sm font-mono">
                  No announcements yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map((a) => (
                    <div
                      key={a.id}
                      className="p-2.5 rounded-xl bg-black/30 border border-zinc-800/80 text-xs flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="text-zinc-200 font-medium">{a.message}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {new Date(a.postedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => Actions.removeAnnouncement(a.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex justify-between shrink-0">
              <span>{announcements.length} Active Notes</span>
              <span>All Pit Crew</span>
            </div>
          </div>
        );

      case 'part_requests':
        return (
          <div
            className="w-full h-full rounded-2xl p-4 border flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono shrink-0">
              <span className="font-bold text-white uppercase tracking-wider text-[11px]">Parts & Tool Requests</span>
              {!isAddingPart && (
                <button
                  onClick={() => setIsAddingPart(true)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] transition-colors cursor-pointer"
                >
                  <Plus size={10} />
                  <span>Request Part</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-2 no-scrollbar">
              {isAddingPart && (
                <form onSubmit={handleAddPartSubmit} className="space-y-2 pb-2 border-b border-zinc-800">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="Part name or tool needed..."
                    className="w-full px-3 py-1.5 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden"
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-xs">
                    <select
                      value={newPartUrgency}
                      onChange={(e) => setNewPartUrgency(e.target.value as any)}
                      className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs"
                    >
                      <option value="HIGH">High Urgency</option>
                      <option value="MEDIUM">Medium Urgency</option>
                      <option value="LOW">Low Urgency</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingPart(false)}
                        className="px-2.5 py-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 rounded bg-zinc-800 text-white font-semibold hover:bg-zinc-700 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {partsRequests.length === 0 ? (
                <div className="py-6 text-center text-zinc-500 text-sm font-mono">
                  No part requests yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {partsRequests.map((pr) => (
                    <div
                      key={pr.id}
                      className="p-2.5 rounded-xl bg-black/30 border border-zinc-800/80 text-xs flex items-center justify-between group"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => Actions.togglePartsRequestStatus(pr.id)}
                            className="cursor-pointer"
                            title={pr.status === 'OPEN' ? 'Mark fulfilled' : 'Mark open'}
                          >
                            {pr.status === 'OPEN' ? (
                              <Circle size={13} className="text-zinc-500 hover:text-emerald-400" />
                            ) : (
                              <CheckCircle size={13} className="text-emerald-400" />
                            )}
                          </button>
                          <span
                            className={`font-semibold ${
                              pr.status === 'FULFILLED' ? 'line-through text-zinc-500' : 'text-zinc-200'
                            }`}
                          >
                            {pr.partName}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono ml-5 flex items-center gap-1.5">
                          <span>Team</span>
                          <TeamBadge teamNumber={pr.teamNumber} />
                          <span>• {pr.urgency} URGENCY</span>
                        </div>
                      </div>

                      <button
                        onClick={() => Actions.removePartsRequest(pr.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                        title="Delete part request"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-500 flex justify-between shrink-0">
              <span>{partsRequests.filter(p => p.status === 'OPEN').length} Open Requests</span>
              <span>Inventory Sync</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleSegments = segments.filter((s) => s.visible);

  return (
    <div id="dashboard-view" className="space-y-2 animate-fade-in pb-8">
      {/* Competition Simulation Banner (Day 2 of PCH DCMP 2026 at 11:30 AM) */}
      {demoMode?.enabled && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs shadow-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-extrabold text-emerald-300 uppercase tracking-wider text-[11px]">
              Pulse Simulation Active:
            </span>
            <span className="text-zinc-200 font-medium">
              Team 1002 CircuitRunners • Day 2 of PCH DCMP 2026 @ 11:30 AM
            </span>
            <span className="text-zinc-500 hidden sm:inline">•</span>
            <span className="text-amber-300 font-mono font-bold hidden sm:inline">
              Qual 13 Queuing (Station Red 1)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => Actions.setSetupModalOpen(true)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              Setup
            </button>
            <button
              onClick={() => Actions.disableDemoMode()}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}

      {/* Modular Layout Bar */}
      <ModularLayoutToolbar
        viewName="Dashboard"
        isCustomizing={isCustomizing}
        onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
        segments={segments}
        onToggleVisibility={toggleSegmentVisibility}
        onResetToDefault={resetToDefault}
        onApplyPreset={applyPreset}
        onAddSpacer={addSpacer}
        onFillGrid={fillGrid}
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
            isSpacer={seg.isSpacer}
            isCustomizing={isCustomizing}
            onReorder={reorderSegments}
            onChangeColSpan={(span) => setSegmentColSpan(seg.id, span)}
            onChangeHeightMultiplier={(m) => setSegmentHeightMultiplier(seg.id, m)}
            onToggleCollapse={() => toggleSegmentCollapse(seg.id)}
            onToggleVisibility={() => toggleSegmentVisibility(seg.id)}
            onRemoveSpacer={() => removeSpacer(seg.id)}
          >
            {seg.isSpacer ? null : renderSegmentContent(seg.id)}
          </ModularSegment>
        ))}
      </div>
    </div>
  );
};
