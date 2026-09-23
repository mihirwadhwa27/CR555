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
    name: 'CircuitRunners Terminal Matrix',
    description: 'Reference Team 1002 OLED terminal display with high-contrast matrix lime',
    font: 'Roboto',
    tokens: DEFAULT_THEME_TOKENS,
  },
  {
    id: 'circuitrunners-gold',
    name: '1002 Gold & Navy',
    description: 'Official Team 1002 CircuitRunners Gold, Deep Navy, and Amber accents',
    font: 'Inter',
    tokens: {
      background: '#0a0e17',
      secondary: '#131b2b',
      foreground: '#f59e0b',
      mutedForeground: '#92610d',
      accent: '#fcd34d',
      accentForeground: '#1e293b',
      border: '#29384d',
      secondaryBorder: '#1c2738',
      destructive: '#ef4444',
    },
  },
  {
    id: 'blue-alliance',
    name: 'FIRST Blue Alliance',
    description: 'Vibrant royal blue and high-visibility ice cyan for drive team scouting',
    font: 'Space Grotesk',
    tokens: {
      background: '#07101e',
      secondary: '#0f1d35',
      foreground: '#38bdf8',
      mutedForeground: '#0284c7',
      accent: '#60a5fa',
      accentForeground: '#0a101d',
      border: '#1e3a5f',
      secondaryBorder: '#142740',
      destructive: '#f43f5e',
    },
  },
  {
    id: 'red-alliance',
    name: 'FIRST Red Alliance',
    description: 'Deep charcoal and bold crimson coral for red alliance pit stations',
    font: 'Inter',
    tokens: {
      background: '#160b0e',
      secondary: '#261217',
      foreground: '#fb7185',
      mutedForeground: '#be123c',
      accent: '#f43f5e',
      accentForeground: '#ffffff',
      border: '#4c1d24',
      secondaryBorder: '#36151a',
      destructive: '#e11d48',
    },
  },
  {
    id: 'stealth-dark',
    name: 'Stealth OLED Monochrome',
    description: 'Ultra-low eye strain dark monochrome display for dimly lit arena pits',
    font: 'JetBrains Mono',
    tokens: {
      background: '#0a0a0a',
      secondary: '#171717',
      foreground: '#f4f4f5',
      mutedForeground: '#71717a',
      accent: '#27272a',
      accentForeground: '#ffffff',
      border: '#2e2e33',
      secondaryBorder: '#202024',
      destructive: '#f87171',
    },
  },
  {
    id: 'cyber-cyan',
    name: 'Cyberpunk Arena Glow',
    description: 'Electric cyan and violet neon accents for ultra-crowded arena venues',
    font: 'Space Grotesk',
    tokens: {
      background: '#080d14',
      secondary: '#101a28',
      foreground: '#38bdf8',
      mutedForeground: '#0284c7',
      accent: '#a855f7',
      accentForeground: '#ffffff',
      border: '#1e293b',
      secondaryBorder: '#0f172a',
      destructive: '#f43f5e',
    },
  },
  {
    id: 'pit-light',
    name: 'Daylight Pit High-Visibility',
    description: 'Clean high-contrast light display for sunny outdoor or bright convention halls',
    font: 'Inter',
    tokens: {
      background: '#f8fafc',
      secondary: '#ffffff',
      foreground: '#0f172a',
      mutedForeground: '#475569',
      accent: '#16a34a',
      accentForeground: '#ffffff',
      border: '#cbd5e1',
      secondaryBorder: '#e2e8f0',
      destructive: '#dc2626',
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

export interface ApplicationState {
  config: {
    teamNumber: number;
    verifiedTeamName: string;
    selectedEventKey: string;
    recentEvents: Array<{ key: string; name: string; year: number }>;
    tenFootMode: boolean;
    tbaApiKey: string;
    nexusApiKey: string;
    corsProxyUrl: string;
    nexusManualEventKey: string;
    theme: ThemeConfig;
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
    isThemeModalOpen: boolean;
    isStrategyModalOpen: boolean;
    isStrategyUnlocked: boolean;
    replayMode: {
      isActive: boolean;
      matchKey: string | null;
    };
  };
}
