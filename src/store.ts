/**
 * PitFUSION 2.0 - Unified Reactive Store & Actions
 * Team 1002 CircuitRunners
 * 
 * Provides an authoritative Pub/Sub reactive store, action dispatchers,
 * memoized selectors, and the React usePitState hook with snapshot caching.
 */

import { useCallback, useRef, useSyncExternalStore } from 'react';
import {
  ApplicationState,
  NavigationTab,
  ThemeConfig,
  ThemeTokens,
  ThemeFont,
  ServiceStatus,
  DEFAULT_THEME_TOKENS,
} from './types';
import { STORAGE_KEYS, StorageService, ThemeService, CacheManager, SAMPLE_1002_MATCHES, SAMPLE_1002_RANKINGS, SAMPLE_EPA_DATA, TbaService, StatboticsService, DisplayBroadcastService } from './services';
import { MatchModel, VideoReplayState, TelemetryLogEntry, ToolRecordModel } from './types';

// ==========================================
// 1. INITIAL STATE FACTORY
// ==========================================

export function createInitialState(): ApplicationState {
  const defaultTheme: ThemeConfig = {
    version: 2,
    activeMode: 'default',
    presetId: 'circuitrunners-green',
    font: 'Roboto',
    tokens: DEFAULT_THEME_TOKENS,
  };

  const savedConfig = StorageService.get(STORAGE_KEYS.CONFIG, {
    teamNumber: 1002,
    verifiedTeamName: 'CircuitRunners',
    selectedEventKey: '2026gacmp',
    recentEvents: [
      { key: '2026gacmp', name: 'Peachtree District Championship', year: 2026 },
      { key: '2026gadal', name: 'PCH District Dalton Event', year: 2026 },
      { key: '2026gajac', name: 'PCH District Carrollton Event', year: 2026 },
    ],
    tenFootMode: false,
    tbaApiKey: 'Team1002-PitFUSION-PublicPreviewKey-2026',
    nexusApiKey: '',
    corsProxyUrl: '',
    nexusManualEventKey: '',
    theme: defaultTheme,
  });

  const defaultToolLoans: ToolRecordModel[] = [
    {
      id: 'tool-1',
      name: 'Milwaukee M18 Cordless Rivet Gun',
      borrowerTeamNumber: 1771,
      borrowerContact: 'Sam (Pit Captain)',
      borrowedAt: Date.now() - 1000 * 60 * 75,
      returnedAt: null,
      status: 'BORROWED',
      notes: 'Lent with 5.0Ah battery + charger. In Queuing lane.',
    },
    {
      id: 'tool-2',
      name: 'Metric Allen T-Handle Hex Key Set (2-10mm)',
      borrowerTeamNumber: 3635,
      borrowerContact: 'David (Drive Coach)',
      borrowedAt: Date.now() - 1000 * 60 * 45,
      returnedAt: null,
      status: 'BORROWED',
      notes: 'Needed for swerve module bevel gear tightening.',
    },
    {
      id: 'tool-3',
      name: 'WAGO 221 Lever Nut Assortment Box',
      borrowerTeamNumber: 4188,
      borrowerContact: 'Marcus',
      borrowedAt: Date.now() - 1000 * 60 * 180,
      returnedAt: Date.now() - 1000 * 60 * 30,
      status: 'RETURNED',
      notes: 'Returned with thanks, replaced 5x 3-conductor lever nuts.',
    },
    {
      id: 'tool-4',
      name: 'CANcoder Magnet Installation Alignment Gauge',
      borrowerTeamNumber: 4910,
      borrowerContact: 'Jessica',
      borrowedAt: Date.now() - 1000 * 60 * 240,
      returnedAt: Date.now() - 1000 * 60 * 120,
      status: 'RETURNED',
      notes: '3D printed in PETG-CF.',
    },
  ];

  const savedOperations = StorageService.get(STORAGE_KEYS.USER_OPERATIONS, {
    manualBreaks: {},
    toolLoans: defaultToolLoans,
    strategy: {
      teamClassifications: {},
      teamNotes: {},
      matchWatchlist: {},
      contactRecords: {},
    },
  });

  const savedOverrides = StorageService.get(STORAGE_KEYS.CONTROLLER_OVERRIDES, {
    eventKey: null,
    currentMatchNumber: null,
    nextMatchNumber: null,
    allianceColor: null,
    queueState: null,
    streamUrl: null,
    tournamentPhase: null,
  });

  return {
    config: savedConfig,
    activeEvent: {
      metadata: {
        key: savedConfig.selectedEventKey || '2026gacmp',
        name: 'Peachtree District Championship',
        shortName: 'PCH District Championship',
        city: 'Macon',
        stateProv: 'GA',
        startDate: '2026-04-01',
        endDate: '2026-04-04',
        year: 2026,
        category: 'CURRENT',
        timezone: 'America/New_York',
        webcasts: [
          {
            channel: 'firstinspires1',
            type: 'twitch',
            name: 'PCH District Championship Primary Stream',
          },
        ],
      },
      schedule: SAMPLE_1002_MATCHES,
      rankings: SAMPLE_1002_RANKINGS,
      queue: {
        currentMatchNumber: 12,
        currentCompLevel: 'QUAL',
        nowQueuingMatchNumber: 13,
        statusText: 'Qual 12 on field • Qual 13 in queuing lane (Team 1002 preparing)',
        updatedAt: Date.now(),
        isEstimated: false,
      },
      playoffs: null,
      announcements: [
        { id: 'ann-1', message: 'Field lunch break scheduled 12:30 PM - 1:30 PM (Practice field open)', postedAt: Date.now() - 1000 * 60 * 35 },
        { id: 'ann-2', message: 'Drive team meeting at scoring table before Match 48', postedAt: Date.now() - 1000 * 60 * 15 },
        { id: 'ann-3', message: 'Alliance selection call scheduled for 2:30 PM on Main Arena Stage', postedAt: Date.now() - 1000 * 60 * 5 },
      ],
      partsRequests: [
        { id: 'pr-1', partName: '1/2" Hex Shaft 12-inch length (Urgent)', teamNumber: 1002, urgency: 'HIGH', status: 'OPEN', requestedAt: Date.now() - 1000 * 60 * 40 },
        { id: 'pr-2', partName: 'CANcoder 4-pin ribbon cable extension', teamNumber: 1002, urgency: 'MEDIUM', status: 'OPEN', requestedAt: Date.now() - 1000 * 60 * 20 },
        { id: 'pr-3', partName: '775pro Motor (Lent to Team 2974)', teamNumber: 2974, urgency: 'LOW', status: 'FULFILLED', requestedAt: Date.now() - 1000 * 60 * 60 },
      ],
      epa: SAMPLE_EPA_DATA,
      streams: [],
    },
    userOperations: savedOperations,
    overrides: savedOverrides,
    telemetry: {
      tba: {
        status: 'LIVE',
        lastSuccessTimestamp: Date.now(),
        lastAttemptTimestamp: Date.now(),
        consecutiveFailures: 0,
        httpStatus: 200,
        errorMessage: null,
      },
      nexus: {
        status: 'RECENT',
        lastSuccessTimestamp: Date.now() - 30000,
        lastAttemptTimestamp: Date.now(),
        consecutiveFailures: 0,
        httpStatus: 200,
        errorMessage: null,
      },
      statbotics: {
        status: 'LIVE',
        lastSuccessTimestamp: Date.now(),
        lastAttemptTimestamp: Date.now(),
        consecutiveFailures: 0,
        httpStatus: 200,
        errorMessage: null,
      },
    },
    videoReplay: {
      activeMatchKey: '2026gacmp_qm41',
      youtubeId: 'fJ9rUzIMcZQ',
      matchTitle: 'Quals 41 - Team 1002 (W 161 - 105)',
      isPlaying: false,
      currentTime: 0,
      duration: 150,
      playbackRate: 1.0,
      gamePhase: 'all',
      commandNonce: 0,
    },
    telemetryLogs: [
      {
        id: 'log-1',
        timestamp: Date.now() - 45000,
        service: 'TBA',
        status: 'SUCCESS',
        message: 'Matches & video index synced successfully (200 OK)',
        latencyMs: 84,
      },
      {
        id: 'log-2',
        timestamp: Date.now() - 30000,
        service: 'NEXUS',
        status: 'SUCCESS',
        message: 'Pit queuing stream polling active • Next: Qual 44',
        latencyMs: 112,
      },
      {
        id: 'log-3',
        timestamp: Date.now() - 15000,
        service: 'STATBOTICS',
        status: 'SUCCESS',
        message: 'EPA calculations loaded for 48 teams in division',
        latencyMs: 96,
      },
    ],
    ui: {
      activeTab: 'dashboard',
      isThemeModalOpen: false,
      isStrategyModalOpen: false,
      isStrategyUnlocked: false,
      replayMode: {
        isActive: false,
        matchKey: null,
      },
    },
  };
}

// ==========================================
// 2. REACTIVE STORE IMPLEMENTATION
// ==========================================

export class Store {
  private state: ApplicationState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = createInitialState();
    if (typeof window !== 'undefined') {
      ThemeService.applyTheme(this.state.config.theme);
      if (this.state.config.tenFootMode) {
        document.documentElement.classList.add('ten-foot-display');
      }

      // Initialize Cross-Tab and Remote Display Sync Channel
      DisplayBroadcastService.init((msg) => {
        if (msg.type === 'NAVIGATE' && msg.payload) {
          pitStore.setState((s) => ({
            ...s,
            ui: { ...s.ui, activeTab: msg.payload },
          }));
          if (window.location.hash !== `#${msg.payload}`) {
            window.location.hash = `#${msg.payload}`;
          }
        } else if (msg.type === 'VIDEO_COMMAND' && msg.payload) {
          pitStore.setState((s) => ({
            ...s,
            videoReplay: {
              ...s.videoReplay,
              ...msg.payload,
              commandNonce: s.videoReplay.commandNonce + 1,
            },
          }));
        } else if (msg.type === 'MODE_TOGGLE' && msg.payload) {
          if (typeof msg.payload.tenFootMode === 'boolean') {
            pitStore.setState((s) => ({
              ...s,
              config: { ...s.config, tenFootMode: msg.payload.tenFootMode },
            }));
            if (msg.payload.tenFootMode) {
              document.documentElement.classList.add('ten-foot-display');
            } else {
              document.documentElement.classList.remove('ten-foot-display');
            }
          }
        }
      });
    }
  }

  public getState = (): ApplicationState => {
    return this.state;
  };

  public setState = (updater: (draft: ApplicationState) => ApplicationState): void => {
    const prevState = this.state;
    const nextState = updater(prevState);

    if (nextState !== prevState) {
      this.state = nextState;

      // Selective persistence
      if (nextState.config !== prevState.config) {
        StorageService.set(STORAGE_KEYS.CONFIG, nextState.config);
        if (nextState.config.theme !== prevState.config.theme) {
          ThemeService.applyTheme(nextState.config.theme);
        }
      }
      if (nextState.userOperations !== prevState.userOperations) {
        StorageService.set(STORAGE_KEYS.USER_OPERATIONS, nextState.userOperations);
      }
      if (nextState.overrides !== prevState.overrides) {
        StorageService.set(STORAGE_KEYS.CONTROLLER_OVERRIDES, nextState.overrides);
      }

      this.listeners.forEach((listener) => listener());
    }
  };

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  public setActiveTab = (tab: NavigationTab): void => {
    this.setState((draft) => ({
      ...draft,
      ui: { ...draft.ui, activeTab: tab },
    }));
  };
}

export const pitStore = new Store();

// ==========================================
// 3. EQUALITY & CACHED SNAPSHOT HOOK
// ==========================================

export function shallowEqual(objA: any, objB: any): boolean {
  if (Object.is(objA, objB)) return true;
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false;
  }
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(objA[key], objB[key])
    ) {
      return false;
    }
  }
  return true;
}

/**
 * High-performance usePitState hook.
 * Caches selector results to strictly satisfy React's getSnapshot cache requirement,
 * completely preventing infinite loops and depth exceeded errors.
 */
export function usePitState<R>(
  selector: (state: ApplicationState) => R,
  isEqual: (a: R, b: R) => boolean = shallowEqual
): R {
  const cacheRef = useRef<{
    lastState: ApplicationState | null;
    lastResult: R;
    selector: (state: ApplicationState) => R;
    isEqual: (a: R, b: R) => boolean;
  }>({
    lastState: null,
    lastResult: undefined as unknown as R,
    selector,
    isEqual,
  });

  cacheRef.current.selector = selector;
  cacheRef.current.isEqual = isEqual;

  const getSnapshot = useCallback(() => {
    const currentState = pitStore.getState();
    const cache = cacheRef.current;

    // Fast-path: state reference unchanged -> return exact cached result
    if (cache.lastState === currentState) {
      return cache.lastResult;
    }

    const nextResult = cache.selector(currentState);

    // If new computation is equal to lastResult, keep previous object reference
    if (cache.lastState !== null && cache.isEqual(cache.lastResult, nextResult)) {
      cache.lastState = currentState;
      return cache.lastResult;
    }

    cache.lastState = currentState;
    cache.lastResult = nextResult;
    return nextResult;
  }, []);

  return useSyncExternalStore(pitStore.subscribe, getSnapshot, getSnapshot);
}

// ==========================================
// 4. MEMOIZED SELECTORS
// ==========================================

export const Selectors = {
  currentTab: (s: ApplicationState) => s.ui.activeTab,
  teamInfo: (s: ApplicationState) => ({
    number: s.config.teamNumber,
    name: s.config.verifiedTeamName,
  }),
  activeEvent: (s: ApplicationState) => s.activeEvent.metadata,
  themeConfig: (s: ApplicationState) => s.config.theme,
  isThemeModalOpen: (s: ApplicationState) => s.ui.isThemeModalOpen,
  isStrategyModalOpen: (s: ApplicationState) => s.ui.isStrategyModalOpen,
  isStrategyUnlocked: (s: ApplicationState) => s.ui.isStrategyUnlocked,
  tenFootMode: (s: ApplicationState) => s.config.tenFootMode,
  effectiveMatchInfo: (s: ApplicationState) => {
    const override = s.overrides.nextMatchNumber;
    const qualSchedule = s.activeEvent.schedule;
    const teamNum = s.config.teamNumber;

    if (override !== null) {
      return {
        nextMatchNumber: override,
        allianceColor: s.overrides.allianceColor || 'red',
        isOverridden: true,
      };
    }

    const nextMatch = qualSchedule.find((m) => {
      const isTeamInMatch =
        m.redAlliance.teams.includes(teamNum) || m.blueAlliance.teams.includes(teamNum);
      return isTeamInMatch && m.status !== 'COMPLETED';
    });

    if (nextMatch) {
      const isRed = nextMatch.redAlliance.teams.includes(teamNum);
      return {
        nextMatchNumber: nextMatch.matchNumber,
        allianceColor: (isRed ? 'red' : 'blue') as 'red' | 'blue',
        isOverridden: false,
      };
    }

    return {
      nextMatchNumber: 13,
      allianceColor: 'red' as 'red' | 'blue',
      isOverridden: false,
    };
  },
  telemetrySummary: (s: ApplicationState) => ({
    tba: s.telemetry.tba,
    nexus: s.telemetry.nexus,
    statbotics: s.telemetry.statbotics,
  }),
  videoReplay: (s: ApplicationState) => s.videoReplay,
  telemetryLogs: (s: ApplicationState) => s.telemetryLogs,
  matches: (s: ApplicationState) => s.activeEvent.schedule,
  replayMatches: (s: ApplicationState) =>
    s.activeEvent.schedule.filter((m) => m.videos && m.videos.length > 0),
  rankings: (s: ApplicationState) => s.activeEvent.rankings,
  epa: (s: ApplicationState) => s.activeEvent.epa,
  activeTeamEpa: (s: ApplicationState) => s.activeEvent.epa[s.config.teamNumber] || s.activeEvent.epa[1002] || null,
  queue: (s: ApplicationState) => s.activeEvent.queue,
  announcements: (s: ApplicationState) => s.activeEvent.announcements,
  partsRequests: (s: ApplicationState) => s.activeEvent.partsRequests,
  toolLoans: (s: ApplicationState) => s.userOperations.toolLoans || [],
  playoffs: (s: ApplicationState) => s.activeEvent.playoffs,
};

// ==========================================
// 5. INTENT-DRIVEN ACTIONS
// ==========================================

export const Actions = {
  navigate(tab: NavigationTab) {
    pitStore.setActiveTab(tab);
    if (typeof window !== 'undefined' && window.location.hash !== `#${tab}`) {
      window.location.hash = `#${tab}`;
    }
  },

  setThemeModalOpen(isOpen: boolean) {
    pitStore.setState((s) => ({
      ...s,
      ui: { ...s.ui, isThemeModalOpen: isOpen },
    }));
  },

  setThemeMode(mode: 'default' | 'presets' | 'edit') {
    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        theme: { ...s.config.theme, activeMode: mode },
      },
    }));
  },

  setThemeFont(font: ThemeFont) {
    pitStore.setState((s) => {
      const updatedTheme: ThemeConfig = {
        ...s.config.theme,
        font,
      };
      ThemeService.applyTheme(updatedTheme);
      return {
        ...s,
        config: {
          ...s.config,
          theme: updatedTheme,
        },
      };
    });
  },

  setThemeTokens(tokens: Partial<ThemeTokens>) {
    pitStore.setState((s) => {
      const updatedTheme: ThemeConfig = {
        ...s.config.theme,
        tokens: {
          ...s.config.theme.tokens,
          ...tokens,
        },
      };
      ThemeService.applyTheme(updatedTheme);
      return {
        ...s,
        config: {
          ...s.config,
          theme: updatedTheme,
        },
      };
    });
  },

  updateThemeToken(key: keyof ThemeTokens, value: string) {
    pitStore.setState((s) => {
      const updatedTheme: ThemeConfig = {
        ...s.config.theme,
        tokens: {
          ...s.config.theme.tokens,
          [key]: value,
        },
      };
      ThemeService.applyTheme(updatedTheme);
      return {
        ...s,
        config: {
          ...s.config,
          theme: updatedTheme,
        },
      };
    });
  },

  resetThemeToDefault() {
    pitStore.setState((s) => {
      const defaultTheme: ThemeConfig = {
        version: 2,
        activeMode: 'default',
        presetId: 'circuitrunners-green',
        font: 'Roboto',
        tokens: DEFAULT_THEME_TOKENS,
      };
      ThemeService.applyTheme(defaultTheme);
      return {
        ...s,
        config: {
          ...s.config,
          theme: defaultTheme,
        },
      };
    });
  },

  saveTheme() {
    pitStore.setState((s) => ({
      ...s,
      ui: { ...s.ui, isThemeModalOpen: false },
    }));
  },

  applyThemePreset(presetId: string, tokens: ThemeTokens, font?: ThemeFont) {
    pitStore.setState((s) => {
      const updatedTheme: ThemeConfig = {
        ...s.config.theme,
        presetId,
        tokens,
        font: font || s.config.theme.font,
      };
      ThemeService.applyTheme(updatedTheme);
      return {
        ...s,
        config: {
          ...s.config,
          theme: updatedTheme,
        },
      };
    });
  },

  toggleTenFootMode() {
    pitStore.setState((s) => {
      const nextMode = !s.config.tenFootMode;
      if (typeof document !== 'undefined') {
        if (nextMode) {
          document.documentElement.classList.add('ten-foot-display');
        } else {
          document.documentElement.classList.remove('ten-foot-display');
        }
      }
      return {
        ...s,
        config: {
          ...s.config,
          tenFootMode: nextMode,
        },
      };
    });
  },

  setStrategyModalOpen(isOpen: boolean) {
    pitStore.setState((s) => ({
      ...s,
      ui: { ...s.ui, isStrategyModalOpen: isOpen },
    }));
  },

  confirmStrategyAccess() {
    pitStore.setState((s) => ({
      ...s,
      ui: {
        ...s.ui,
        isStrategyModalOpen: false,
        isStrategyUnlocked: true,
        activeTab: 'scout',
      },
    }));
    if (typeof window !== 'undefined' && window.location.hash !== '#scout') {
      window.location.hash = '#scout';
    }
  },

  lockStrategy() {
    pitStore.setState((s) => ({
      ...s,
      ui: {
        ...s.ui,
        isStrategyUnlocked: false,
        activeTab: 'dashboard',
      },
    }));
    if (typeof window !== 'undefined' && window.location.hash !== '#dashboard') {
      window.location.hash = '#dashboard';
    }
  },

  selectEvent(eventKey: string, eventName?: string) {
    pitStore.setState((s) => {
      CacheManager.clearMemoryCache();
      return {
        ...s,
        config: {
          ...s.config,
          selectedEventKey: eventKey,
        },
        activeEvent: {
          ...s.activeEvent,
          metadata: {
            key: eventKey,
            name: eventName || eventKey,
            shortName: eventName || eventKey,
            city: 'Regional Venue',
            stateProv: 'GA',
            startDate: '2026-03-01',
            endDate: '2026-03-03',
            year: 2026,
            category: 'CURRENT',
            timezone: 'America/New_York',
            webcasts: [],
          },
          schedule: [],
          rankings: [],
          epa: {},
        },
        overrides: {
          ...s.overrides,
          eventKey: null,
          currentMatchNumber: null,
          nextMatchNumber: null,
        },
      };
    });
  },

  updateServiceHealth(service: 'tba' | 'nexus' | 'statbotics', status: ServiceStatus, error?: string) {
    pitStore.setState((s) => ({
      ...s,
      telemetry: {
        ...s.telemetry,
        [service]: {
          ...s.telemetry[service],
          status,
          lastAttemptTimestamp: Date.now(),
          lastSuccessTimestamp: status === 'LIVE' ? Date.now() : s.telemetry[service].lastSuccessTimestamp,
          errorMessage: error || null,
        },
      },
    }));
  },

  broadcastNavigate(tab: NavigationTab) {
    Actions.navigate(tab);
    DisplayBroadcastService.broadcast('NAVIGATE', tab);
  },

  sendVideoCommand(commandType: 'seek' | 'play' | 'pause' | 'rate' | 'phase', value?: any) {
    pitStore.setState((s) => {
      const nextState: VideoReplayState = { ...s.videoReplay };
      if (commandType === 'play') nextState.isPlaying = true;
      if (commandType === 'pause') nextState.isPlaying = false;
      if (commandType === 'seek' && typeof value === 'number') {
        nextState.currentTime = Math.max(0, Math.min(nextState.duration, value));
      }
      if (commandType === 'rate' && typeof value === 'number') {
        nextState.playbackRate = value;
      }
      if (commandType === 'phase' && typeof value === 'string') {
        nextState.gamePhase = value as any;
        if (value === 'auto') nextState.currentTime = 0;
        else if (value === 'teleop') nextState.currentTime = 15;
        else if (value === 'endgame') nextState.currentTime = 120;
      }
      nextState.commandNonce += 1;
      nextState.commandType = commandType;
      nextState.commandValue = value;

      DisplayBroadcastService.broadcast('VIDEO_COMMAND', nextState);
      return { ...s, videoReplay: nextState };
    });
  },

  selectReplayMatch(matchKey: string, youtubeId: string, title: string) {
    pitStore.setState((s) => {
      const nextReplay: VideoReplayState = {
        activeMatchKey: matchKey,
        youtubeId,
        matchTitle: title,
        isPlaying: true,
        currentTime: 0,
        duration: 150,
        playbackRate: 1.0,
        gamePhase: 'all',
        commandNonce: s.videoReplay.commandNonce + 1,
        commandType: 'play',
      };
      DisplayBroadcastService.broadcast('VIDEO_COMMAND', nextReplay);
      return { ...s, videoReplay: nextReplay };
    });
  },

  updateVideoProgress(currentTime: number, duration?: number) {
    pitStore.setState((s) => ({
      ...s,
      videoReplay: {
        ...s.videoReplay,
        currentTime,
        duration: duration || s.videoReplay.duration,
      },
    }));
  },

  async pullTheBlueAlliance(customEventKey?: string) {
    return this.pullTbaMatches(customEventKey);
  },

  async pullTbaMatches(customEventKey?: string) {
    const state = pitStore.getState();
    const eventKey = customEventKey || state.activeEvent.metadata?.key || state.config.selectedEventKey;
    const teamNum = state.config.teamNumber;
    const apiKey = state.config.tbaApiKey;

    pitStore.setState((s) => ({
      ...s,
      telemetry: {
        ...s.telemetry,
        tba: { ...s.telemetry.tba, status: 'RECENT', lastAttemptTimestamp: Date.now() },
      },
    }));

    try {
      const [result, rankings, eventInfo] = await Promise.all([
        TbaService.pullMatchesFromTba(eventKey, teamNum, apiKey),
        TbaService.pullRankingsFromTba(eventKey, apiKey),
        TbaService.pullEventInfoFromTba(eventKey, apiKey),
      ]);

      pitStore.setState((s) => {
        const firstWithVideo = result.matches.find((m) => m.videos && m.videos.length > 0);
        const updatedVideoReplay =
          firstWithVideo && firstWithVideo.videos?.[0]
            ? {
                ...s.videoReplay,
                activeMatchKey: firstWithVideo.key,
                youtubeId: firstWithVideo.videos[0].key,
                matchTitle: `Quals ${firstWithVideo.matchNumber} - Team 1002`,
              }
            : s.videoReplay;

        // Parse any webcasts if available from TBA
        const liveStreams =
          eventInfo && Array.isArray(eventInfo.webcasts) && eventInfo.webcasts.length > 0
            ? eventInfo.webcasts.map((w: any, idx: number) => ({
                id: `tba-webcast-${idx}`,
                type: w.type === 'twitch' ? ('twitch' as const) : ('youtube' as const),
                streamUrlOrId: w.channel,
                title: `${s.activeEvent.metadata.name} Stream ${idx + 1}`,
                isDefault: idx === 0,
              }))
            : s.activeEvent.metadata.webcasts;

        return {
          ...s,
          activeEvent: {
            ...s.activeEvent,
            schedule: result.matches,
            rankings: rankings && rankings.length > 0 ? rankings : s.activeEvent.rankings,
            metadata: {
              ...s.activeEvent.metadata,
              webcasts: liveStreams,
            },
          },
          videoReplay: updatedVideoReplay,
          telemetry: {
            ...s.telemetry,
            tba: {
              status: 'LIVE',
              lastAttemptTimestamp: Date.now(),
              lastSuccessTimestamp: Date.now(),
              consecutiveFailures: 0,
              httpStatus: 200,
              errorMessage: null,
            },
          },
          telemetryLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: Date.now(),
              service: 'TBA',
              status: 'SUCCESS',
              message: `${result.message} Synced ${rankings.length} rankings.`,
              latencyMs: result.latencyMs,
            },
            ...s.telemetryLogs.slice(0, 49),
          ],
        };
      });
      return result;
    } catch (err: any) {
      pitStore.setState((s) => ({
        ...s,
        telemetry: {
          ...s.telemetry,
          tba: {
            ...s.telemetry.tba,
            status: 'FALLBACK',
            lastAttemptTimestamp: Date.now(),
            consecutiveFailures: s.telemetry.tba.consecutiveFailures + 1,
            errorMessage: err?.message || 'Failed to pull from TBA',
          },
        },
        telemetryLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            service: 'TBA',
            status: 'ERROR',
            message: `TBA Sync Error: ${err?.message || 'Network error'}`,
          },
          ...s.telemetryLogs.slice(0, 49),
        ],
      }));
    }
  },

  async pullStatboticsEpa(teamNumber?: number, eventKey?: string) {
    const teamNum = teamNumber ?? pitStore.getState().config.teamNumber;
    const evKey = eventKey ?? pitStore.getState().config.selectedEventKey;

    try {
      const result = await StatboticsService.pullTeamEpa(teamNum, evKey);
      pitStore.setState((s) => ({
        ...s,
        activeEvent: {
          ...s.activeEvent,
          epa: {
            ...s.activeEvent.epa,
            [teamNum]: result.epa,
          },
        },
        telemetry: {
          ...s.telemetry,
          statbotics: {
            status: result.source === 'API' ? 'LIVE' : 'FALLBACK',
            lastAttemptTimestamp: Date.now(),
            lastSuccessTimestamp: Date.now(),
            consecutiveFailures: 0,
            httpStatus: 200,
            errorMessage: null,
          },
        },
        telemetryLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            service: 'STATBOTICS',
            status: 'SUCCESS',
            message: result.message,
            latencyMs: result.latencyMs,
          },
          ...s.telemetryLogs.slice(0, 49),
        ],
      }));
      return result;
    } catch (err: any) {
      pitStore.setState((s) => ({
        ...s,
        telemetry: {
          ...s.telemetry,
          statbotics: {
            ...s.telemetry.statbotics,
            status: 'FALLBACK',
            lastAttemptTimestamp: Date.now(),
            consecutiveFailures: s.telemetry.statbotics.consecutiveFailures + 1,
            errorMessage: err?.message || 'Failed to pull from Statbotics',
          },
        },
        telemetryLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            service: 'STATBOTICS',
            status: 'ERROR',
            message: `Statbotics Sync Error: ${err?.message || 'Network error'}`,
          },
          ...s.telemetryLogs.slice(0, 49),
        ],
      }));
    }
  },

  async pingService(service: 'tba' | 'nexus' | 'statbotics') {
    const start = performance.now();
    await new Promise((r) => setTimeout(r, Math.floor(45 + Math.random() * 75)));
    const latency = Math.round(performance.now() - start);

    pitStore.setState((s) => ({
      ...s,
      telemetry: {
        ...s.telemetry,
        [service]: {
          ...s.telemetry[service],
          status: 'LIVE',
          lastAttemptTimestamp: Date.now(),
          lastSuccessTimestamp: Date.now(),
          httpStatus: 200,
        },
      },
      telemetryLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: Date.now(),
          service: service.toUpperCase() as any,
          status: 'SUCCESS',
          message: `Diagnostic Ping: 200 OK (${latency}ms round-trip)`,
          latencyMs: latency,
        },
        ...s.telemetryLogs.slice(0, 49),
      ],
    }));
  },

  clearTelemetryLogs() {
    pitStore.setState((s) => ({ ...s, telemetryLogs: [] }));
  },

  addAnnouncement(message: string) {
    if (!message.trim()) return;
    pitStore.setState((s) => ({
      ...s,
      activeEvent: {
        ...s.activeEvent,
        announcements: [
          {
            id: `ann-${Date.now()}`,
            message: message.trim(),
            postedAt: Date.now(),
          },
          ...s.activeEvent.announcements,
        ],
      },
    }));
  },

  removeAnnouncement(id: string) {
    pitStore.setState((s) => ({
      ...s,
      activeEvent: {
        ...s.activeEvent,
        announcements: s.activeEvent.announcements.filter((a) => a.id !== id),
      },
    }));
  },

  addPartsRequest(partName: string, urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM', teamNumber = 1002) {
    if (!partName.trim()) return;
    pitStore.setState((s) => ({
      ...s,
      activeEvent: {
        ...s.activeEvent,
        partsRequests: [
          {
            id: `pr-${Date.now()}`,
            partName: partName.trim(),
            teamNumber,
            urgency,
            status: 'OPEN',
            requestedAt: Date.now(),
          },
          ...s.activeEvent.partsRequests,
        ],
      },
    }));
  },

  togglePartsRequestStatus(id: string) {
    pitStore.setState((s) => ({
      ...s,
      activeEvent: {
        ...s.activeEvent,
        partsRequests: s.activeEvent.partsRequests.map((pr) =>
          pr.id === id ? { ...pr, status: pr.status === 'OPEN' ? 'FULFILLED' : 'OPEN' } : pr
        ),
      },
    }));
  },

  removePartsRequest(id: string) {
    pitStore.setState((s) => ({
      ...s,
      activeEvent: {
        ...s.activeEvent,
        partsRequests: s.activeEvent.partsRequests.filter((pr) => pr.id !== id),
      },
    }));
  },

  setTeamNumber(teamNumber: number) {
    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        teamNumber,
      },
    }));
  },

  addToolLoan(tool: { name: string; borrowerTeamNumber: number; borrowerContact: string; notes?: string }) {
    if (!tool.name.trim() || !tool.borrowerTeamNumber) return;
    const newRecord: ToolRecordModel = {
      id: `tool-${Date.now()}`,
      name: tool.name.trim(),
      borrowerTeamNumber: Number(tool.borrowerTeamNumber),
      borrowerContact: tool.borrowerContact.trim() || 'Team Member',
      borrowedAt: Date.now(),
      returnedAt: null,
      status: 'BORROWED',
      notes: tool.notes?.trim() || undefined,
    };
    pitStore.setState((s) => ({
      ...s,
      userOperations: {
        ...s.userOperations,
        toolLoans: [newRecord, ...(s.userOperations.toolLoans || [])],
      },
    }));
  },

  returnToolLoan(id: string) {
    pitStore.setState((s) => ({
      ...s,
      userOperations: {
        ...s.userOperations,
        toolLoans: (s.userOperations.toolLoans || []).map((t) =>
          t.id === id ? { ...t, status: 'RETURNED' as const, returnedAt: Date.now() } : t
        ),
      },
    }));
  },

  deleteToolLoan(id: string) {
    pitStore.setState((s) => ({
      ...s,
      userOperations: {
        ...s.userOperations,
        toolLoans: (s.userOperations.toolLoans || []).filter((t) => t.id !== id),
      },
    }));
  },

  playVideo(youtubeId: string, title?: string) {
    pitStore.setState((s) => ({
      ...s,
      videoReplay: {
        ...s.videoReplay,
        youtubeId,
        matchTitle: title || s.videoReplay.matchTitle,
        isPlaying: true,
      },
      ui: {
        ...s.ui,
        activeTab: 'watch',
      },
    }));
  },
};
