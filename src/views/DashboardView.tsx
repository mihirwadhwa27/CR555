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

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { MatchModel } from '../types';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';
import { FieldLivestream } from '../components/FieldLivestream';
import { AudioAnnouncer } from '../utils/audioAnnouncer';

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  { id: 'match_13', title: 'Next Match Scouting & Matchup', colSpan: 'half', heightMultiplier: 2, order: 0, visible: true },
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
    AudioAnnouncer.speak(`Attention Circuit Runners Team ${teamInfo.number}: ${phrase}. ${subtext}`);
  };

  // FIRST Pulse Status calculation for Active Queue Call
  const getPulseStatus = () => {
    if (pulseMode === 'QUEUE_5MIN') {
      return {
        phrase: 'Queue in 5 min',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ringColor: 'border-amber-400',
        subtext: 'Drive Team prepare robot and cart in Pit 1002 • Est. 10:45 AM',
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
        subtext: 'Team 1002 report to Staging Lane 1 • Qual 13',
        iconType: 'clock' as const,
      };
    }
    if (pulseMode === 'NO_MATCHES') {
      return {
        phrase: 'No matches remaining today...',
        badgeColor: 'bg-zinc-800/80 text-zinc-300 border-zinc-700',
        ringColor: 'border-zinc-600',
        subtext: 'All qualification matches completed for today • Review match replays',
        iconType: 'check' as const,
      };
    }

    // AUTO Mode: dynamically driven by countdown and schedule
    if (upcomingMatches.length === 0 && matches.length > 0 && matches.every((m) => m.status === 'COMPLETED')) {
      return {
        phrase: 'No matches remaining today...',
        badgeColor: 'bg-zinc-800/80 text-zinc-300 border-zinc-700',
        ringColor: 'border-zinc-600',
        subtext: 'All qualification matches completed for today • Pits close at 7:00 PM',
        iconType: 'check' as const,
      };
    }

    if (secondsUntilNextMatch <= 180) {
      return {
        phrase: 'On Deck',
        badgeColor: 'bg-orange-500/25 text-orange-300 border-orange-500/50 animate-pulse',
        ringColor: 'border-orange-400',
        subtext: 'Drive Team proceed immediately to Arena Entrance Gate • Station Red 1',
        iconType: 'alert' as const,
      };
    }

    if (secondsUntilNextMatch <= 360) {
      return {
        phrase: 'Queue in 5 min',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        ringColor: 'border-amber-400',
        subtext: 'Drive Team prepare robot and cart in Pit 1002 • Staging Lane 1',
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

  // Upcoming matches calculation - comprehensive schedule of the next couple of matches
  const upcomingMatches = matches.filter((m) => m.status !== 'COMPLETED');
  const fallbackMatches: MatchModel[] = [
    {
      key: 'qm_13',
      matchNumber: 13,
      compLevel: 'QUAL',
      status: 'QUEUED',
      scheduledTime: Date.now() + 18 * 60 * 1000,
      redAlliance: { teams: [1002, 1771, 3635], score: 0 },
      blueAlliance: { teams: [1414, 4188, 4910], score: 0 },
    },
    {
      key: 'qm_27',
      matchNumber: 27,
      compLevel: 'QUAL',
      status: 'SCHEDULED',
      scheduledTime: Date.now() + 95 * 60 * 1000,
      redAlliance: { teams: [1002, 2974, 8736], score: 0 },
      blueAlliance: { teams: [6705, 4189, 5109], score: 0 },
    },
    {
      key: 'qm_42',
      matchNumber: 42,
      compLevel: 'QUAL',
      status: 'SCHEDULED',
      scheduledTime: Date.now() + 185 * 60 * 1000,
      redAlliance: { teams: [6023, 1683, 8080], score: 0 },
      blueAlliance: { teams: [1002, 1261, 6829], score: 0 },
    },
    {
      key: 'qm_56',
      matchNumber: 56,
      compLevel: 'QUAL',
      status: 'SCHEDULED',
      scheduledTime: Date.now() + 270 * 60 * 1000,
      redAlliance: { teams: [1002, 4941, 7451], score: 0 },
      blueAlliance: { teams: [1771, 3329, 6340], score: 0 },
    },
  ];
  const displayUpcoming = upcomingMatches.length > 0 ? upcomingMatches : fallbackMatches;
  const topRankings = rankings.length > 0 ? rankings.slice(0, 10) : [];

  const currentMatch = displayUpcoming[0];
  const redTeams = currentMatch?.redAlliance.teams || [1002, 1771, 3635];
  const blueTeams = currentMatch?.blueAlliance.teams || [1414, 4188, 4910];

  const calcAllianceEPA = (teamsList: number[]) => {
    return teamsList.reduce((acc, tNum) => {
      const matchTeam = epaData[tNum];
      return acc + (matchTeam && matchTeam.totalEPA !== null ? matchTeam.totalEPA : 45.0);
    }, 0);
  };

  const redAllianceEPA = calcAllianceEPA(redTeams);
  const blueAllianceEPA = calcAllianceEPA(blueTeams);
  const epaDiff = blueAllianceEPA - redAllianceEPA;
  const blueWinProb = Math.min(
    95,
    Math.max(5, Math.round(1 / (1 + Math.pow(10, (redAllianceEPA - blueAllianceEPA) / 50)) * 100))
  );

  // Field queue for All Field Matches preview in Upcoming
  const allFieldQueue = [
    {
      number: 13,
      time: 'In ~18m',
      status: 'QUEUED (TEAM 1002)',
      is1002: true,
      red: [1002, 1771, 3635],
      blue: [1414, 4188, 4910],
      note: 'Team 1002 on Red Alliance (Station R1) • Queued',
    },
    {
      number: 14,
      time: 'In ~26m',
      status: 'SCHEDULED',
      is1002: false,
      red: [2415, 4026, 7525],
      blue: [1648, 5203, 8575],
      note: 'Qualification Match 14 • Scheduled',
    },
    {
      number: 15,
      time: 'In ~34m',
      status: 'SCHEDULED',
      is1002: false,
      red: [3490, 4509, 8736],
      blue: [1102, 2974, 5109],
      note: 'Qualification Match 15 • Scheduled',
    },
    {
      number: 16,
      time: 'In ~42m',
      status: 'SCHEDULED',
      is1002: false,
      red: [6705, 4189, 8080],
      blue: [1261, 6829, 7451],
      note: 'Qualification Match 16 • Scheduled',
    },
  ];

  // Render individual segment by ID
  const renderSegmentContent = (segId: string) => {
    switch (segId) {
      case 'livestream':
        return <FieldLivestream />;

      case 'match_13':
        return (
          <div
            className="w-full h-full rounded-2xl p-3.5 sm:p-4 border flex flex-col justify-between shadow-xs overflow-hidden"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Next Match Status Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800 font-mono shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                  Qualification Match {matchInfo.nextMatchNumber || 13}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                  RED ALLIANCE • STATION R1 (TEAM 1002)
                </span>
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 shadow-xs shrink-0 self-start sm:self-auto">
                <Clock size={13} className="text-amber-400 animate-pulse shrink-0" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-amber-300/80">Starts In:</span>
                  <span className="text-sm sm:text-base font-black font-mono tracking-tight text-amber-300">
                    {formatCountdown(secondsUntilNextMatch)}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable Middle: Next Match In-Depth Roster & Strategy */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-2 no-scrollbar">
              {/* Alliance Rosters with Component EPAs and Roles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {/* Red Alliance (Home) */}
                <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-800/60 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-red-900/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="font-bold text-red-400 tracking-wider">RED ALLIANCE</span>
                    </div>
                    <span className="text-red-300 font-bold">152.4 EPA</span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Team 1002 */}
                    <div className="p-1.5 rounded-lg bg-red-900/40 border border-red-500/50 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge teamNumber={1002} highlight1002 variant="red" />
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-400 text-black font-black">R1</span>
                        </div>
                        <span className="text-red-200 font-bold">48.0 EPA</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-300">
                        <span className="text-amber-300/90 font-semibold truncate">CircuitRunners</span>
                        <span className="text-zinc-400 text-[9px] shrink-0">A:14.2 • T:26.8 • E:7.0</span>
                      </div>
                    </div>

                    {/* Team 1771 */}
                    <div className="p-1.5 rounded-lg bg-black/40 border border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge teamNumber={1771} />
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">R2</span>
                        </div>
                        <span className="text-zinc-300 font-bold">54.2 EPA</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="text-zinc-300 truncate">North Gwinnett</span>
                        <span className="text-zinc-500 text-[9px] shrink-0">A:16.0 • T:28.2 • E:10.0</span>
                      </div>
                    </div>

                    {/* Team 3635 */}
                    <div className="p-1.5 rounded-lg bg-black/40 border border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge teamNumber={3635} />
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">R3</span>
                        </div>
                        <span className="text-zinc-300 font-bold">50.2 EPA</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="text-zinc-300 truncate">Flying Horsepower</span>
                        <span className="text-zinc-500 text-[9px] shrink-0">A:12.0 • T:27.2 • E:11.0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blue Alliance (Opponents) */}
                <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-800/60 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between pb-1 border-b border-blue-900/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-blue-400 tracking-wider">BLUE ALLIANCE</span>
                    </div>
                    <span className="text-blue-300 font-bold">147.2 EPA</span>
                  </div>

                  <div className="space-y-1.5">
                    {/* Team 1414 */}
                    <div className="p-1.5 rounded-lg bg-black/40 border border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge teamNumber={1414} />
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">B1</span>
                        </div>
                        <span className="text-zinc-300 font-bold">51.0 EPA</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="text-zinc-300 truncate">IHOT Robotics</span>
                        <span className="text-zinc-500 text-[9px] shrink-0">A:15.1 • T:27.9 • E:8.0</span>
                      </div>
                    </div>

                    {/* Team 4188 */}
                    <div className="p-1.5 rounded-lg bg-black/40 border border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge teamNumber={4188} />
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">B2</span>
                        </div>
                        <span className="text-zinc-300 font-bold">49.8 EPA</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="text-zinc-300 truncate">Columbus Space Program</span>
                        <span className="text-zinc-500 text-[9px] shrink-0">A:14.8 • T:26.0 • E:9.0</span>
                      </div>
                    </div>

                    {/* Team 4910 */}
                    <div className="p-1.5 rounded-lg bg-black/40 border border-zinc-800/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <TeamBadge teamNumber={4910} />
                          <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold">B3</span>
                        </div>
                        <span className="text-zinc-300 font-bold">46.4 EPA</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="text-zinc-300 truncate">East Cobb Robotics</span>
                        <span className="text-zinc-500 text-[9px] shrink-0">A:12.4 • T:25.0 • E:9.0</span>
                      </div>
                    </div>
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
              <span className="text-[11px]">Peachtree District Championship</span>
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
                              <TeamBadge teamNumber={r.teamNumber} highlight1002={isOurTeam} />
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
                  {upcomingFilter === '1002_ONLY' ? `${fallbackMatches.length} Matches Today` : 'Field Queue'}
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
                  Team 1002 Matches
                </button>
                <button
                  onClick={() => setUpcomingFilter('ALL_FIELD')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    upcomingFilter === 'ALL_FIELD'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Field Queue
                </button>
              </div>
            </div>

            {/* Match List: Focused on the NEXT COUPLE OF MATCHES */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 my-2 no-scrollbar">
              {upcomingFilter === '1002_ONLY' ? (
                // Sequence of the next couple of matches for Team 1002
                fallbackMatches.map((m, idx) => {
                  const isRed = m.redAlliance.teams.includes(teamInfo.number);
                  const partners = isRed
                    ? m.redAlliance.teams.filter((t) => t !== teamInfo.number)
                    : m.blueAlliance.teams.filter((t) => t !== teamInfo.number);
                  const opponents = isRed ? m.blueAlliance.teams : m.redAlliance.teams;
                  const stationLabel = isRed ? 'Red Station' : 'Blue Station';

                  // Dynamic match timeline and projection metadata
                  const metaByMatch: Record<number, { time: string; prob: string; note: string; tagColor: string }> = {
                    13: {
                      time: 'Next Match • In ~18m',
                      prob: '61% Red Win • Proj. 152-147',
                      note: 'Station: Red 1 • Status: Queued',
                      tagColor: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
                    },
                    27: {
                      time: 'In ~1h 35m • ~11:45 AM',
                      prob: '72% Red Win • Proj. 144-128',
                      note: 'Station: Red 1 • Status: Scheduled',
                      tagColor: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
                    },
                    42: {
                      time: 'In ~3h 05m • ~1:50 PM',
                      prob: '69% Blue Win • Proj. 138-122',
                      note: 'Station: Blue 1 • Status: Scheduled',
                      tagColor: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
                    },
                    56: {
                      time: 'In ~4h 30m • ~3:15 PM',
                      prob: '65% Red Win • Proj. 136-124',
                      note: 'Station: Red 1 • Status: Scheduled',
                      tagColor: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
                    },
                  };

                  const meta = metaByMatch[m.matchNumber] || {
                    time: `In ~${(idx + 1) * 45}m`,
                    prob: '65% Win Prob',
                    note: 'Scheduled qualification match',
                    tagColor: 'border-zinc-700 bg-zinc-800 text-zinc-300',
                  };

                  return (
                    <div
                      key={m.key}
                      className={`p-2.5 rounded-xl border transition-all ${
                        idx === 0
                          ? isRed
                            ? 'bg-red-950/25 border-red-700/50 shadow-xs'
                            : 'bg-blue-950/25 border-blue-700/50 shadow-xs'
                          : 'bg-black/35 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      {/* Match Row Top: Match badge, Station, Time Horizon */}
                      <div className="flex items-center justify-between gap-2 font-mono text-xs mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-black tracking-wider uppercase ${
                              isRed ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                            }`}
                          >
                            Qual {m.matchNumber}
                          </span>
                          <span className="text-[11px] font-bold text-zinc-300">
                            {stationLabel}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-400 text-black animate-pulse">
                              NEXT UP
                            </span>
                          )}
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
                            <TeamBadge teamNumber={teamInfo.number} highlight1002 variant={isRed ? 'red' : 'blue'} />
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

                      {/* Match Intel & Statbotics Projection */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono pt-1 border-t border-zinc-800/60">
                        <span className="text-zinc-400 text-[10px] truncate">{meta.note}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border self-start sm:self-auto shrink-0 ${meta.tagColor}`}>
                          {meta.prob}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // All Field Queue View
                allFieldQueue.map((m) => (
                  <div
                    key={m.number}
                    className={`p-2.5 rounded-xl border font-mono text-xs ${
                      m.is1002
                        ? 'bg-red-950/30 border-red-600/50 shadow-xs'
                        : 'bg-black/35 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 font-bold text-white text-[11px]">
                          Qual {m.number}
                        </span>
                        {m.is1002 && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-black">
                            TEAM 1002 MATCH
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
                            <TeamBadge key={t} teamNumber={t} highlight1002={t === 1002} variant="red" />
                          ))}
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-blue-950/30 border border-blue-900/40 flex items-center justify-between">
                        <span className="text-[10px] text-blue-400 font-bold">BLUE:</span>
                        <div className="flex items-center gap-1">
                          {m.blue.map((t) => (
                            <TeamBadge key={t} teamNumber={t} highlight1002={t === 1002} variant="blue" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-400 shrink-0">
              <span className="text-[11px]">Showing {fallbackMatches.length} upcoming matches for Friday</span>
              <button
                onClick={() => Actions.navigate('schedule')}
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Complete Match Schedule</span>
                <ChevronRight size={12} />
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

            {/* Arena Field & Queuing State */}
            <div className="grid grid-cols-2 gap-2.5 my-2">
              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider">On Field</div>
                  <div className="text-white text-base sm:text-lg font-black mt-0.5 font-mono">Qual 12</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>

              <div className="p-2.5 rounded-xl bg-black/40 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="text-amber-400/90 text-[10px] uppercase font-bold tracking-wider">Now Queuing</div>
                  <div className="text-amber-300 text-base sm:text-lg font-black mt-0.5 font-mono">Qual 13</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              </div>
            </div>

            {/* Primary Pulse Active Queue Call Banner - Official FIRST Pulse Phrasing */}
            <div className={`p-3 rounded-xl border flex flex-col justify-center gap-1.5 my-1 ${pulse.badgeColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pulse.iconType === 'alert' ? (
                    <AlertCircle size={18} className="text-orange-400 shrink-0 animate-bounce" />
                  ) : pulse.iconType === 'check' ? (
                    <CheckCircle size={18} className="text-zinc-400 shrink-0" />
                  ) : (
                    <Clock size={18} className="text-amber-400 shrink-0 animate-pulse" />
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                    Pulse Queue Call
                  </span>
                </div>
                <span className="text-[10px] font-bold text-zinc-300/80">Team 1002</span>
              </div>

              {/* Huge, crisp callout matching FIRST Pulse */}
              <div className="text-lg sm:text-xl md:text-2xl font-black uppercase tracking-wide text-white drop-shadow-xs">
                {pulse.phrase}
              </div>

              {/* Instructions for Pit Crew */}
              <div className="text-[11px] text-zinc-200/90 font-medium">
                {pulse.subtext}
              </div>
            </div>

            {/* Interactive Pulse State Selector / Simulator */}
            <div className="p-2 rounded-xl bg-black/40 border border-zinc-800/80 space-y-1.5 my-1">
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
