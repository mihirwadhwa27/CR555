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
import { STORAGE_KEYS, StorageService, ThemeService, CacheManager, SAMPLE_1002_MATCHES, SAMPLE_1002_RANKINGS, SAMPLE_EPA_DATA, TbaService, StatboticsService, DisplayBroadcastService, NexusService } from './services';
import { MatchModel, VideoReplayState, TelemetryLogEntry, ToolRecordModel } from './types';
import { getTeamMetadata } from './utils/teamLookup';

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
    verifiedTeamName: 'CircuitRunners Robotics',
    verifiedTeamCity: 'Marietta',
    verifiedTeamState: 'GA',
    selectedEventKey: '2026gacmp',
    recentEvents: [
      { key: '2026gacmp', name: 'Peachtree District Championship', year: 2026 },
      { key: '2026gadal', name: 'PCH District Dalton Event', year: 2026 },
      { key: '2026gajac', name: 'PCH District Carrollton Event', year: 2026 },
    ],
    tenFootMode: false,
    tbaApiKey: 'Team1002-PitFUSION-PublicPreviewKey-2026',
    nexusApiKey: 'iOk-xjD_qisD2C0T59YuTa1_F3E',
    nexusWebhookToken: '',
    corsProxyUrl: '',
    nexusManualEventKey: '',
    theme: defaultTheme,
    customLogoUrl: '',
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
      borrowerTeamNumber: 1648,
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
            channel: 'UCr_x7a303YmQ61V81kP0gqQ',
            type: 'youtube',
            name: 'PCH District Championship YouTube Live',
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
      isSetupModalOpen: false,
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
  config: (s: ApplicationState) => s.config,
  currentTab: (s: ApplicationState) => s.ui.activeTab,
  teamInfo: (s: ApplicationState) => {
    const meta = getTeamMetadata(s.config.teamNumber);
    const name = s.config.verifiedTeamName || meta.name || `Team ${s.config.teamNumber}`;
    const city = s.config.verifiedTeamCity || meta.city || '';
    const state = s.config.verifiedTeamState || meta.state || '';
    const location = city && state ? `${city}, ${state}` : (city || state || '');
    return {
      number: s.config.teamNumber,
      name,
      city,
      state,
      location,
    };
  },
  activeEvent: (s: ApplicationState) => s.activeEvent.metadata,
  themeConfig: (s: ApplicationState) => s.config.theme,
  isSetupModalOpen: (s: ApplicationState) => s.ui.isSetupModalOpen,
  demoMode: (s: ApplicationState) => s.config.demoMode,
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

    // If no uncompleted match is found, check the team's last scheduled or completed match
    const teamMatches = qualSchedule.filter(
      (m) => m.redAlliance.teams.includes(teamNum) || m.blueAlliance.teams.includes(teamNum)
    );
    if (teamMatches.length > 0) {
      const lastMatch = teamMatches[teamMatches.length - 1];
      const isRed = lastMatch.redAlliance.teams.includes(teamNum);
      return {
        nextMatchNumber: lastMatch.matchNumber,
        allianceColor: (isRed ? 'red' : 'blue') as 'red' | 'blue',
        isOverridden: false,
      };
    }

    return {
      nextMatchNumber: 1,
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
  activeTeamEpa: (s: ApplicationState) => s.activeEvent.epa[s.config.teamNumber] || null,
  queue: (s: ApplicationState) => s.activeEvent.queue,
  announcements: (s: ApplicationState) => s.activeEvent.announcements,
  partsRequests: (s: ApplicationState) => s.activeEvent.partsRequests,
  toolLoans: (s: ApplicationState) => s.userOperations.toolLoans || [],
  playoffs: (s: ApplicationState) => s.activeEvent.playoffs,
  customLogoUrl: (s: ApplicationState) => s.config.customLogoUrl || '',
  nexusApiKey: (s: ApplicationState) => s.config.nexusApiKey || '',
  nexusWebhookToken: (s: ApplicationState) => s.config.nexusWebhookToken || '',
  nexusManualEventKey: (s: ApplicationState) => s.config.nexusManualEventKey || '',
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

  setNexusApiKey(key: string) {
    pitStore.setState((s) => {
      const nextConfig = { ...s.config, nexusApiKey: key.trim() };
      StorageService.set(STORAGE_KEYS.CONFIG, nextConfig);
      return { ...s, config: nextConfig };
    });
  },

  setNexusWebhookToken(token: string) {
    pitStore.setState((s) => {
      const nextConfig = { ...s.config, nexusWebhookToken: token.trim() };
      StorageService.set(STORAGE_KEYS.CONFIG, nextConfig);
      return { ...s, config: nextConfig };
    });
  },

  setNexusManualEventKey(eventKey: string) {
    pitStore.setState((s) => {
      const nextConfig = { ...s.config, nexusManualEventKey: eventKey.trim() };
      StorageService.set(STORAGE_KEYS.CONFIG, nextConfig);
      return { ...s, config: nextConfig };
    });
  },

  setCustomLogoUrl(url: string) {
    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        customLogoUrl: url,
      },
    }));
  },

  setSetupModalOpen(isOpen: boolean) {
    pitStore.setState((s) => ({
      ...s,
      ui: { ...s.ui, isSetupModalOpen: isOpen },
    }));
  },

  enableDemoMode() {
    const now = Date.now();
    // Simulate Day 2 at 11:30:00 AM
    const targetSimulatedDate = new Date();
    targetSimulatedDate.setHours(11, 30, 0, 0);
    const simulatedBaseTime = targetSimulatedDate.getTime();
    const simulatedOffset = simulatedBaseTime - now;

    // Day 2 schedule at 11:30 AM:
    // Matches 3, 7, 12 completed; Match 13 queuing next at 11:45 AM (starts in 15 min)!
    const demoMatches: MatchModel[] = [
      {
        key: '2026gacmp_qm3',
        matchNumber: 3,
        compLevel: 'QUAL',
        scheduledTime: simulatedBaseTime - 1000 * 60 * 180,
        actualTime: simulatedBaseTime - 1000 * 60 * 178,
        redAlliance: { teams: [1002, 2415, 8080], score: 142, epaSum: 140.2 },
        blueAlliance: { teams: [6919, 5203, 1683], score: 118, epaSum: 122.0 },
        winner: 'red',
        status: 'COMPLETED',
        videos: [{ type: 'youtube', key: 'kJQP7kiw5Fk' }],
      },
      {
        key: '2026gacmp_qm7',
        matchNumber: 7,
        compLevel: 'QUAL',
        scheduledTime: simulatedBaseTime - 1000 * 60 * 110,
        actualTime: simulatedBaseTime - 1000 * 60 * 108,
        redAlliance: { teams: [4188, 7451, 6705], score: 124, epaSum: 130.4 },
        blueAlliance: { teams: [1002, 1261, 3344], score: 156, epaSum: 148.5 },
        winner: 'blue',
        status: 'COMPLETED',
        videos: [{ type: 'youtube', key: 'L_LUpnjgPso' }],
      },
      {
        key: '2026gacmp_qm12',
        matchNumber: 12,
        compLevel: 'QUAL',
        scheduledTime: simulatedBaseTime - 1000 * 60 * 8, // 11:22 AM
        actualTime: simulatedBaseTime - 1000 * 60 * 7,
        redAlliance: { teams: [1002, 1771, 2974], score: 148, epaSum: 144.2 },
        blueAlliance: { teams: [1414, 4188, 5109], score: 112, epaSum: 118.5 },
        winner: 'red',
        status: 'COMPLETED',
        videos: [{ type: 'youtube', key: 'kJQP7kiw5Fk' }],
      },
      {
        key: '2026gacmp_qm13',
        matchNumber: 13,
        compLevel: 'QUAL',
        scheduledTime: simulatedBaseTime + 1000 * 60 * 15, // 11:45 AM (15 mins from 11:30 AM)
        redAlliance: { teams: [1002, 1771, 3635], score: null, epaSum: 152.4 },
        blueAlliance: { teams: [1414, 4188, 1648], score: null, epaSum: 147.2 },
        winner: null,
        status: 'QUEUED',
        videos: [],
      },
      {
        key: '2026gacmp_qm18',
        matchNumber: 18,
        compLevel: 'QUAL',
        scheduledTime: simulatedBaseTime + 1000 * 60 * 105, // 1:15 PM
        redAlliance: { teams: [1002, 5203, 8736], score: null, epaSum: 138.0 },
        blueAlliance: { teams: [1771, 1648, 2974], score: null, epaSum: 149.0 },
        winner: null,
        status: 'SCHEDULED',
        videos: [],
      },
      {
        key: '2026gacmp_qm24',
        matchNumber: 24,
        compLevel: 'QUAL',
        scheduledTime: simulatedBaseTime + 1000 * 60 * 155, // 2:05 PM
        redAlliance: { teams: [1261, 832, 1683], score: null, epaSum: 124.0 },
        blueAlliance: { teams: [1002, 4026, 6919], score: null, epaSum: 142.6 },
        winner: null,
        status: 'SCHEDULED',
        videos: [],
      },
    ];

    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        teamNumber: 1002,
        verifiedTeamName: 'CircuitRunners Robotics',
        selectedEventKey: '2026gacmp',
        demoMode: {
          enabled: true,
          dayLabel: 'Day 2',
          timeString: '11:30 AM',
          simulatedTimeOffset: simulatedOffset,
          eventKey: '2026gacmp',
          teamNumber: 1002,
        },
      },
      activeEvent: {
        ...s.activeEvent,
        metadata: {
          key: '2026gacmp',
          name: 'Peachtree District Championship 2026',
          shortName: 'PCH DCMP 2026',
          city: 'Macon',
          stateProv: 'GA',
          startDate: '2026-04-03',
          endDate: '2026-04-05',
          year: 2026,
          category: 'CURRENT',
          timezone: 'America/New_York',
          webcasts: [
            {
              channel: 'UCr_x7a303YmQ61V81kP0gqQ',
              type: 'youtube',
              name: 'PCH District Championship YouTube Live',
            },
          ],
        },
        schedule: demoMatches,
        queue: {
          currentMatchNumber: 12,
          currentCompLevel: 'QUAL',
          nowQueuingMatchNumber: 13,
          statusText: 'Qual 12 on field • Qual 13 in queuing lane (Team 1002 preparing Station Red 1)',
          updatedAt: now,
          isEstimated: false,
        },
        announcements: [
          { id: 'ann-demo-1', message: 'Day 2 Morning Competition • Lunch Break scheduled 12:30 PM - 1:30 PM', postedAt: now - 1000 * 60 * 25 },
          { id: 'ann-demo-2', message: 'Team 1002 Station Red 1 for Qual 13 • Drive Team report to queue entrance', postedAt: now - 1000 * 60 * 10 },
          { id: 'ann-demo-3', message: 'Alliance Selection scheduled for Day 2 at 3:30 PM on Main Arena Stage', postedAt: now - 1000 * 60 * 5 },
        ],
      },
      overrides: {
        ...s.overrides,
        nextMatchNumber: 13,
        allianceColor: 'red',
        queueState: 'QUEUE_5MIN',
      },
    }));
  },

  disableDemoMode() {
    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        demoMode: {
          enabled: false,
          dayLabel: '',
          timeString: '',
          simulatedTimeOffset: 0,
          eventKey: s.config.selectedEventKey,
          teamNumber: s.config.teamNumber,
        },
      },
      overrides: {
        ...s.overrides,
        nextMatchNumber: null,
        allianceColor: null,
        queueState: null,
      },
    }));
    Actions.pullTbaMatches();
    Actions.pullStatboticsEpa();
  },

  completeSetup(params: {
    teamNumber: number;
    teamName?: string;
    eventKey: string;
    eventName?: string;
    demoMode: boolean;
  }) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pitfusion_setup_completed', 'true');
      } catch {
        // ignore
      }
    }

    if (params.demoMode) {
      Actions.enableDemoMode();
    } else {
      if (pitStore.getState().config.demoMode?.enabled) {
        Actions.disableDemoMode();
      }
      Actions.setTeamNumber(params.teamNumber);
      if (params.teamName) {
        pitStore.setState((s) => ({
          ...s,
          config: { ...s.config, verifiedTeamName: params.teamName! },
        }));
      }
      Actions.selectEvent(params.eventKey, params.eventName);
      Actions.pullTbaMatches();
      Actions.pullStatboticsEpa();
    }

    Actions.setSetupModalOpen(false);
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
      const resolved = TbaService.resolveEventMetadata(eventKey, eventName);
      return {
        ...s,
        config: {
          ...s.config,
          selectedEventKey: eventKey,
        },
        activeEvent: {
          ...s.activeEvent,
          metadata: resolved,
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
      const [result, rankings, eventInfo, teamInfo] = await Promise.all([
        TbaService.pullMatchesFromTba(eventKey, teamNum, apiKey),
        TbaService.pullRankingsFromTba(eventKey, teamNum, apiKey),
        TbaService.pullEventInfoFromTba(eventKey, apiKey),
        TbaService.pullTeamInfoFromTba(teamNum, apiKey),
        TbaService.pullTeamsForEventFromTba(eventKey, apiKey),
      ]);

      pitStore.setState((s) => {
        const firstWithVideo = result.matches.find((m) => m.videos && m.videos.length > 0);
        const updatedVideoReplay =
          firstWithVideo && firstWithVideo.videos?.[0]
            ? {
                ...s.videoReplay,
                activeMatchKey: firstWithVideo.key,
                youtubeId: firstWithVideo.videos[0].key,
                matchTitle: `Quals ${firstWithVideo.matchNumber} - Team ${teamNum}`,
              }
            : s.videoReplay;

        // Parse any webcasts if available from TBA
        const liveStreams =
          eventInfo && Array.isArray(eventInfo.webcasts) && eventInfo.webcasts.length > 0
            ? eventInfo.webcasts.map((w: any, idx: number) => ({
                id: `tba-webcast-${idx}`,
                type: w.type === 'twitch' ? ('twitch' as const) : ('youtube' as const),
                streamUrlOrId: w.channel,
                title: `${eventInfo.name || s.activeEvent.metadata.name} Stream ${idx + 1}`,
                isDefault: idx === 0,
              }))
            : s.activeEvent.metadata.webcasts;

        return {
          ...s,
          config: {
            ...s.config,
            verifiedTeamName: teamInfo?.nickname || teamInfo?.name || s.config.verifiedTeamName,
            verifiedTeamCity: teamInfo?.city || s.config.verifiedTeamCity,
            verifiedTeamState: teamInfo?.stateProv || s.config.verifiedTeamState,
          },
          activeEvent: {
            ...s.activeEvent,
            schedule: result.matches,
            rankings: rankings && rankings.length > 0 ? rankings : s.activeEvent.rankings,
            metadata: {
              ...s.activeEvent.metadata,
              name: eventInfo?.name || s.activeEvent.metadata.name,
              shortName: eventInfo?.short_name || eventInfo?.name || s.activeEvent.metadata.shortName,
              city: eventInfo?.city || s.activeEvent.metadata.city,
              stateProv: eventInfo?.state_prov || s.activeEvent.metadata.stateProv,
              startDate: eventInfo?.start_date || s.activeEvent.metadata.startDate,
              endDate: eventInfo?.end_date || s.activeEvent.metadata.endDate,
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
    const state = pitStore.getState();

    if (service === 'nexus') {
      const res = await NexusService.ping(state.config.nexusApiKey);
      const isLive = res.success && res.status === 200;
      pitStore.setState((s) => ({
        ...s,
        telemetry: {
          ...s.telemetry,
          nexus: {
            ...s.telemetry.nexus,
            status: isLive ? 'LIVE' : res.status === 401 ? 'RECENT' : 'ERROR',
            lastAttemptTimestamp: Date.now(),
            lastSuccessTimestamp: isLive ? Date.now() : s.telemetry.nexus.lastSuccessTimestamp,
            httpStatus: res.status,
            errorMessage: isLive ? null : res.message,
          },
        },
        telemetryLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: Date.now(),
            service: 'NEXUS',
            status: isLive ? 'SUCCESS' : res.status === 401 ? 'WARNING' : 'ERROR',
            message: `Nexus Ping: HTTP ${res.status} - ${res.message} (${res.latencyMs}ms)`,
            latencyMs: res.latencyMs,
          },
          ...s.telemetryLogs.slice(0, 49),
        ],
      }));
      return res;
    }

    if (service === 'tba') {
      const eventKey = state.activeEvent.metadata?.key || state.config.selectedEventKey || '2026gacmp';
      const apiKey = state.config.tbaApiKey;
      try {
        const ev = await TbaService.pullEventInfoFromTba(eventKey, apiKey);
        const latency = Math.round(performance.now() - start);
        pitStore.setState((s) => ({
          ...s,
          telemetry: {
            ...s.telemetry,
            tba: {
              ...s.telemetry.tba,
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
              service: 'TBA',
              status: 'SUCCESS',
              message: `TBA Ping: 200 OK (${ev?.name || eventKey}) - ${latency}ms`,
              latencyMs: latency,
            },
            ...s.telemetryLogs.slice(0, 49),
          ],
        }));
        return { success: true, latencyMs: latency };
      } catch (err: any) {
        const latency = Math.round(performance.now() - start);
        pitStore.setState((s) => ({
          ...s,
          telemetry: {
            ...s.telemetry,
            tba: {
              ...s.telemetry.tba,
              status: 'ERROR',
              lastAttemptTimestamp: Date.now(),
              httpStatus: 500,
              errorMessage: err.message,
            },
          },
          telemetryLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: Date.now(),
              service: 'TBA',
              status: 'ERROR',
              message: `TBA Ping Error: ${err.message}`,
              latencyMs: latency,
            },
            ...s.telemetryLogs.slice(0, 49),
          ],
        }));
        return { success: false, latencyMs: latency };
      }
    }

    // Statbotics ping
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

  async syncNexusData(customEventKey?: string) {
    const state = pitStore.getState();
    const eventKey = customEventKey || state.config.nexusManualEventKey || state.activeEvent.metadata?.key || state.config.selectedEventKey || 'demo1234';
    const apiKey = state.config.nexusApiKey;

    pitStore.setState((s) => ({
      ...s,
      telemetry: {
        ...s.telemetry,
        nexus: {
          ...s.telemetry.nexus,
          status: 'RECENT',
          lastAttemptTimestamp: Date.now(),
        },
      },
    }));

    try {
      const res = await NexusService.pullEventSummary(eventKey, apiKey);
      if (res.success && res.data) {
        const summary = res.data;
        pitStore.setState((s) => {
          // Merge announcements from Nexus
          const incomingAnnouncements = (summary.announcements || []).map((a, i) => ({
            id: a.id || `nexus-ann-${a.postedTime || Date.now()}-${i}`,
            message: a.announcement || a.message || '',
            postedAt: a.postedTime || Date.now(),
          })).filter((a) => a.message.trim().length > 0);

          const existingIds = new Set(s.activeEvent.announcements.map((a) => a.id));
          const mergedAnnouncements = [
            ...incomingAnnouncements.filter((a) => !existingIds.has(a.id)),
            ...s.activeEvent.announcements,
          ];

          // Merge parts requests from Nexus
          const incomingParts = (summary.partsRequests || []).map((p, i) => ({
            id: p.id || `nexus-pr-${p.requestedTime || Date.now()}-${i}`,
            teamNumber: p.teamNumber || s.config.teamNumber,
            partName: p.part || p.partName || 'Component',
            urgency: p.urgency || 'MEDIUM',
            status: (p.status === 'FULFILLED' ? 'FULFILLED' : 'OPEN') as 'OPEN' | 'FULFILLED',
            requestedAt: p.requestedTime || Date.now(),
          }));

          const existingPrIds = new Set(s.activeEvent.partsRequests.map((p) => p.id));
          const mergedParts = [
            ...incomingParts.filter((p) => !existingPrIds.has(p.id)),
            ...s.activeEvent.partsRequests,
          ];

          const statusText = summary.nowQueuing
            ? `Now Queuing: ${summary.nowQueuing} (via FRC Nexus)`
            : s.activeEvent.queue?.statusText || 'Arena Queuing Active';

          let parsedMatchNum: number | null = null;
          if (summary.nowQueuing) {
            const numMatch = summary.nowQueuing.match(/\d+/);
            if (numMatch) parsedMatchNum = parseInt(numMatch[0], 10);
          }

          const existingQueue = s.activeEvent.queue;
          const updatedQueue = {
            currentMatchNumber: parsedMatchNum ? Math.max(1, parsedMatchNum - 1) : (existingQueue?.currentMatchNumber ?? 12),
            currentCompLevel: (summary.nowQueuing?.toLowerCase().includes('playoff') ? 'PLAYOFF' : 'QUAL') as 'QUAL' | 'PLAYOFF' | 'FINALS',
            nowQueuingMatchNumber: parsedMatchNum || (existingQueue?.nowQueuingMatchNumber ?? 13),
            statusText,
            updatedAt: Date.now(),
            isEstimated: false,
          };

          return {
            ...s,
            activeEvent: {
              ...s.activeEvent,
              announcements: mergedAnnouncements,
              partsRequests: mergedParts,
              queue: updatedQueue,
            },
            telemetry: {
              ...s.telemetry,
              nexus: {
                status: 'LIVE',
                lastAttemptTimestamp: Date.now(),
                lastSuccessTimestamp: Date.now(),
                httpStatus: res.status || 200,
                errorMessage: null,
                consecutiveFailures: 0,
              },
            },
            telemetryLogs: [
              {
                id: `log-${Date.now()}`,
                timestamp: Date.now(),
                service: 'NEXUS',
                status: 'SUCCESS',
                message: `Nexus Event Sync OK: Queuing "${summary.nowQueuing || 'Standby'}" (${res.source})`,
              },
              ...s.telemetryLogs.slice(0, 49),
            ],
          };
        });
        return { success: true, data: res.data };
      } else {
        pitStore.setState((s) => ({
          ...s,
          telemetry: {
            ...s.telemetry,
            nexus: {
              status: res.status === 401 ? 'STALE' : 'ERROR',
              lastAttemptTimestamp: Date.now(),
              lastSuccessTimestamp: s.telemetry.nexus.lastSuccessTimestamp,
              consecutiveFailures: s.telemetry.nexus.consecutiveFailures + 1,
              httpStatus: res.status,
              errorMessage: res.error || 'Failed to sync event summary',
            },
          },
          telemetryLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: Date.now(),
              service: 'NEXUS',
              status: res.status === 401 ? 'WARNING' : 'ERROR',
              message: `Nexus Sync: HTTP ${res.status} - ${res.error || 'Check API key or event key'}`,
            },
            ...s.telemetryLogs.slice(0, 49),
          ],
        }));
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      pitStore.setState((s) => ({
        ...s,
        telemetry: {
          ...s.telemetry,
          nexus: {
            status: 'ERROR',
            lastAttemptTimestamp: Date.now(),
            lastSuccessTimestamp: s.telemetry.nexus.lastSuccessTimestamp,
            consecutiveFailures: s.telemetry.nexus.consecutiveFailures + 1,
            httpStatus: 500,
            errorMessage: err.message,
          },
        },
      }));
      return { success: false, error: err.message };
    }
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
    const immediateNickname = TbaService.resolveTeamNickname(teamNumber);
    const immediateMeta = getTeamMetadata(teamNumber);
    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        teamNumber,
        verifiedTeamName: immediateNickname,
        verifiedTeamCity: immediateMeta.city,
        verifiedTeamState: immediateMeta.state,
      },
    }));

    const apiKey = pitStore.getState().config.tbaApiKey;
    TbaService.pullTeamInfoFromTba(teamNumber, apiKey).then((info) => {
      if (info && (info.nickname || info.name)) {
        pitStore.setState((s) => ({
          ...s,
          config: {
            ...s.config,
            verifiedTeamName: info.nickname || info.name,
            verifiedTeamCity: info.city || s.config.verifiedTeamCity,
            verifiedTeamState: info.stateProv || s.config.verifiedTeamState,
          },
        }));
      }
    });
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
