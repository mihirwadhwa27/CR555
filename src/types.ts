/**
 * PitFUSION 2.0 - Unified Type Definitions
 * Team 1002 CircuitRunners FRC Pit Display System
 */

// ==========================================
// 1. THEME ENGINE TYPES
// ==========================================

export interface ThemeTokens {
  background: string;        // Main screen background
  secondary: string;         // Card & modal surface background
  foreground: string;        // Primary high-contrast text & accent lines
  mutedForeground: string;   // Secondary descriptions & labels
  accent: string;            // Highlights, primary buttons, pills
  accentForeground: string;  // Text on accent backgrounds
  border: string;            // Primary container borders
  secondaryBorder: string;   // Inner dividers & secondary card borders
  destructive: string;       // Warnings, cancellations, errors
}

export type ThemeFont = 'Roboto' | 'Inter' | 'JetBrains Mono' | 'Space Grotesk' | 'Orbitron' | 'Chakra Petch' | 'System';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  font: ThemeFont;
  tokens: ThemeTokens;
}

export interface ThemeConfig {
  version: 2;
  activeMode: 'default' | 'presets' | 'edit';
  presetId: string;
  font: ThemeFont;
  tokens: ThemeTokens;
}

export const DEFAULT_THEME_TOKENS: ThemeTokens = {
  background: '#101010',
  secondary: '#202020',
  foreground: '#5dd62c',
  mutedForeground: '#337418',
  accent: '#f8f8f8',
  accentForeground: '#49bc6a',
  border: '#414141',
  secondaryBorder: '#3e3e3e',
  destructive: '#fa7087',
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'circuitrunners-green',
    name: 'Team 1002: CircuitRunners',
    description: 'Official CircuitRunners green (#1fd655), deep dark OLED background, and circuit accents',
    font: 'Roboto',
    tokens: DEFAULT_THEME_TOKENS,
  },
  {
    id: 'team-1833',
    name: 'Team 1833: Team BEAN',
    description: 'Team BEAN signature vibrant botanical green (#22c55e), clean white foreground, and dark forest surfaces',
    font: 'Inter',
    tokens: {
      background: '#07140b',
      secondary: '#0e2415',
      foreground: '#f0fdf4',
      mutedForeground: '#4ade80',
      accent: '#22c55e',
      accentForeground: '#052e16',
      border: '#14532d',
      secondaryBorder: '#166534',
      destructive: '#f87171',
    },
  },
  {
    id: 'team-1771',
    name: 'Team 1771: North Gwinnett Robotics',
    description: 'Championship Bulldog crimson red (#dc2626), high-contrast white text, and midnight obsidian',
    font: 'Orbitron',
    tokens: {
      background: '#0d0708',
      secondary: '#1c0c0e',
      foreground: '#ffffff',
      mutedForeground: '#f87171',
      accent: '#ef4444',
      accentForeground: '#ffffff',
      border: '#450a0a',
      secondaryBorder: '#5f0f15',
      destructive: '#f43f5e',
    },
  },
  {
    id: 'team-2974',
    name: 'Team 2974: Walton Robotics',
    description: 'Walton Raider bold royal blue (#2563eb), crisp white text, and crimson red accents',
    font: 'Space Grotesk',
    tokens: {
      background: '#060c18',
      secondary: '#0c1830',
      foreground: '#ffffff',
      mutedForeground: '#93c5fd',
      accent: '#3b82f6',
      accentForeground: '#ffffff',
      border: '#1d4ed8',
      secondaryBorder: '#1e3a8a',
      destructive: '#ef4444',
    },
  },
  {
    id: 'team-8736',
    name: 'Team 8736: The Mechanisms',
    description: 'The Mechanisms electric cobalt blue (#0284c7), ice cyan highlights, and pure white content',
    font: 'Chakra Petch',
    tokens: {
      background: '#06111d',
      secondary: '#0a1f36',
      foreground: '#ffffff',
      mutedForeground: '#7dd3fc',
      accent: '#0284c7',
      accentForeground: '#ffffff',
      border: '#075985',
      secondaryBorder: '#0c4a6e',
      destructive: '#f43f5e',
    },
  },
];

// ==========================================
// 2. FRC DOMAIN MODELS
// ==========================================

export interface TeamModel {
  number: number;
  name: string;
  schoolName?: string;
  city: string;
  stateProv: string;
  country: string;
  rookieYear: number;
}

export interface EventSummaryModel {
  key: string;
  name: string;
  shortName: string;
  city: string;
  stateProv: string;
  startDate: string;
  endDate: string;
  year: number;
  category: 'CURRENT' | 'UPCOMING' | 'COMPLETED';
}

export interface EventModel extends EventSummaryModel {
  week?: number;
  districtKey?: string;
  timezone: string;
  webcasts: StreamModel[];
}

export interface AllianceTeamList {
  teams: number[];
  score: number | null;
  epaSum?: number;
}

export interface MatchModel {
  key: string;
  matchNumber: number;
  compLevel: 'QUAL' | 'PLAYOFF' | 'FINALS';
  setNumber?: number;
  scheduledTime: number;
  estimatedTime?: number;
  actualTime?: number;
  redAlliance: AllianceTeamList;
  blueAlliance: AllianceTeamList;
  winner?: 'red' | 'blue' | 'tie' | null;
  status: 'SCHEDULED' | 'QUEUED' | 'ON_FIELD' | 'IN_PROGRESS' | 'COMPLETED';
  videos?: Array<{ type: 'youtube'; key: string }>;
}

export interface RankingModel {
  rank: number;
  teamNumber: number;
  teamName: string;
  record: {
    wins: number;
    losses: number;
    ties: number;
  };
  rankingScore: number;
  matchesPlayed: number;
  qualAverage?: number;
}

export interface QueueStateModel {
  currentMatchNumber: number | null;
  currentCompLevel: 'QUAL' | 'PLAYOFF' | 'FINALS';
  nowQueuingMatchNumber: number | null;
  statusText: string;
  updatedAt: number;
  isEstimated: boolean;
}

export interface StreamModel {
  channel: string;
  type: 'youtube' | 'twitch' | 'iframe';
  name?: string;
}

export interface TeamEPAModel {
  teamNumber: number;
  teamName?: string;
  totalEPA: number | null;
  autoEPA: number | null;
  teleopEPA: number | null;
  endgameEPA: number | null;
  unitlessEPA?: number | null;
  normEPA?: number | null;
  rank?: number;
  eventRank?: number;
  eventPercentile?: number;
  districtRank?: number;
  worldRank?: number;
  worldPercentile?: number;
  maxEPA?: number;
  meanEPA?: number;
  stdDev?: number;
  winRate?: number;
  wins?: number;
  losses?: number;
  ties?: number;
  lastUpdated?: string | number;
  seasonYear?: number;
}

export interface ManualBreakModel {
  id: string;
  eventKey: string;
  label: string;
  startTime: number;
  endTime: number;
  notes?: string;
}

export interface ToolRecordModel {
  id: string;
  name: string;
  borrowerTeamNumber: number;
  borrowerContact: string;
  borrowedAt: number;
  returnedAt: number | null;
  status: 'BORROWED' | 'RETURNED';
  notes?: string;
}

export type TeamClassification = 'COMPETITOR' | 'BUBBLE' | 'THREAT' | 'WATCH';
export type ContactStatus = 'NOT_CONTACTED' | 'CONTACTED' | 'FOLLOW_UP' | 'CONFIRMED';

export interface StrategyNoteModel {
  id: string;
  teamNumber: number;
  author: string;
  note: string;
  timestamp: number;
}

export interface WatchedMatchModel {
  matchKey: string;
  reason: string;
  addedAt: number;
}

export interface AnnouncementModel {
  id: string;
  message: string;
  postedAt: number;
}

export interface PartsRequestModel {
  id: string;
  partName: string;
  teamNumber: number;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'FULFILLED';
  requestedAt: number;
}

export interface PlayoffAlliance {
  number: number;
  name: string;
  picks: number[];
  status?: string;
}

export interface PlayoffMatchResult {
  matchKey: string;
  matchName: string;
  redAllianceNumber: number;
  blueAllianceNumber: number;
  redScore: number | null;
  blueScore: number | null;
  winner: 'red' | 'blue' | null;
}

export interface PlayoffStateModel {
  alliances: PlayoffAlliance[];
  matches: PlayoffMatchResult[];
  bracketType: 'DOUBLE_ELIM_8';
}

// ==========================================
// 3. APPLICATION STATE & TELEMETRY
// ==========================================

export type NavigationTab =
  | 'dashboard'
  | 'watch'
  | 'schedule'
  | 'previous'
  | 'playoffs'
  | 'controller'
  | 'tools'
  | 'settings'
  | 'scout';

export type ServiceStatus =
  | 'LIVE'
  | 'RECENT'
  | 'CACHED'
  | 'STALE'
  | 'FALLBACK'
  | 'UNAVAILABLE'
  | 'ERROR';

export interface ServiceHealth {
  status: ServiceStatus;
  lastSuccessTimestamp: number | null;
  lastAttemptTimestamp: number | null;
  consecutiveFailures: number;
  httpStatus: number | null;
  errorMessage: string | null;
}

export interface VideoReplayState {
  activeMatchKey: string;
  youtubeId: string;
  matchTitle: string;
  isPlaying: boolean;
  currentTime: number; // seconds
  duration: number;
  playbackRate: number;
  gamePhase: 'auto' | 'teleop' | 'endgame' | 'all';
  commandNonce: number;
  commandType?: 'seek' | 'play' | 'pause' | 'rate' | 'phase';
  commandValue?: any;
}

export interface PitAlertModel {
  id: string;
  message: string;
  severity: 'urgent' | 'warning' | 'info';
  timestamp: number;
  active: boolean;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: number;
  service: 'TBA' | 'NEXUS' | 'STATBOTICS' | 'SYSTEM';
  status: 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
  latencyMs?: number;
}

export interface NexusMatchTime {
  estimatedStartTime?: number;
  estimatedQueueTime?: number;
  actualStartTime?: number;
}

export interface NexusScheduledMatch {
  label: string;
  status?: string;
  times?: NexusMatchTime;
  redTeams?: number[];
  blueTeams?: number[];
}

export interface NexusAnnouncement {
  id?: string;
  announcement?: string;
  message?: string;
  postedTime?: number;
}

export interface NexusPartsRequest {
  id?: string;
  teamNumber?: number;
  part?: string;
  partName?: string;
  status?: string;
  urgency?: 'HIGH' | 'MEDIUM' | 'LOW';
  requestedTime?: number;
}

export interface NexusEventSummary {
  eventKey: string;
  dataAsOfTime: number;
  nowQueuing: string | null;
  scheduledMatches?: NexusScheduledMatch[];
  announcements?: NexusAnnouncement[];
  partsRequests?: NexusPartsRequest[];
}

export interface ApplicationState {
  config: {
    teamNumber: number;
    verifiedTeamName: string;
    verifiedTeamCity?: string;
    verifiedTeamState?: string;
    selectedEventKey: string;
    recentEvents: Array<{ key: string; name: string; year: number }>;
    tenFootMode: boolean;
    tbaApiKey: string;
    nexusApiKey: string;
    nexusWebhookToken?: string;
    corsProxyUrl: string;
    nexusManualEventKey: string;
    theme: ThemeConfig;
    customLogoUrl?: string;
    demoMode?: {
      enabled: boolean;
      dayLabel: string;
      timeString: string;
      simulatedTimeOffset: number;
      eventKey: string;
      teamNumber: number;
    };
  };

  activeEvent: {
    metadata: EventModel | null;
    schedule: MatchModel[];
    rankings: RankingModel[];
    queue: QueueStateModel | null;
    playoffs: PlayoffStateModel | null;
    announcements: AnnouncementModel[];
    partsRequests: PartsRequestModel[];
    epa: Record<number, TeamEPAModel>;
    streams: StreamModel[];
  };

  userOperations: {
    manualBreaks: Record<string, ManualBreakModel[]>;
    toolLoans: ToolRecordModel[];
    strategy: {
      teamClassifications: Record<number, TeamClassification>;
      teamNotes: Record<number, StrategyNoteModel[]>;
      matchWatchlist: Record<string, WatchedMatchModel>;
      contactRecords: Record<number, ContactStatus>;
    };
  };

  overrides: {
    eventKey: string | null;
    currentMatchNumber: number | null;
    nextMatchNumber: number | null;
    allianceColor: 'red' | 'blue' | null;
    queueState: string | null;
    streamUrl: string | null;
    tournamentPhase: 'qual' | 'playoff' | null;
  };

  telemetry: {
    tba: ServiceHealth;
    nexus: ServiceHealth;
    statbotics: ServiceHealth;
  };

  videoReplay: VideoReplayState;
  telemetryLogs: TelemetryLogEntry[];

  ui: {
    activeTab: NavigationTab;
    remoteTargetTab: NavigationTab;
    isDrivenScreen: boolean;
    isSetupModalOpen: boolean;
    isThemeModalOpen: boolean;
    isStrategyModalOpen: boolean;
    isStrategyUnlocked: boolean;
    replayMode: {
      isActive: boolean;
      matchKey: string | null;
    };
  };
}
