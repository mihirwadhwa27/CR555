# PitFUSION 2.0 - Complete Architecture & System Code Map

An end-to-end architectural blueprint and comprehensive code map of PitFUSION 2.0, detailing how data flows from external APIs (The Blue Alliance, Nexus, Statbotics), passes through central state and multi-tab broadcast channels, and powers modular frontend views.

---

## 1. High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EXTERNAL DATA SOURCES                                  │
│                                                                                        │
│   ┌─────────────────────┐      ┌─────────────────────┐      ┌──────────────────────┐   │
│   │  The Blue Alliance  │      │     Nexus Queue     │      │   Statbotics EPA     │   │
│   │  (Schedules/Videos) │      │   (Arena Staging)   │      │ (Predictions/Prob)   │   │
│   └──────────┬──────────┘      └──────────┬──────────┘      └──────────┬───────────┘   │
└──────────────┼────────────────────────────┼────────────────────────────┼───────────────┘
               │                            │                            │
               ▼                            ▼                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SERVICES & NETWORKING LAYER (services.ts)                       │
│                                                                                        │
│   ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────────┐   │
│   │      TbaService       │  │     NexusService      │  │     StatboticsService    │   │
│   │ • API v3 & Proxy Fall │  │ • Webhook & Polling   │  │ • Team & Year EPA        │   │
│   │ • Realistic Fallbacks │  │ • Staging Lane Status │  │ • Win Probability Calc   │   │
│   │ • YouTube Replay Keys │  │ • Est. Match Delays   │  │ • Auto/Teleop/Endgame EPA│   │
│   └──────────┬────────────┘  └──────────┬────────────┘  └──────────┬───────────────┘   │
│              │                          │                          │                   │
│              └──────────────────────────┼──────────────────────────┘                   │
│                                         ▼                                              │
│                             ┌───────────────────────┐                                  │
│                             │     CacheManager      │                                  │
│                             │ • LocalStorage Cache  │                                  │
│                             │ • In-Memory TTL Cache │                                  │
│                             └──────────┬────────────┘                                  │
└────────────────────────────────────────┼───────────────────────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         CENTRAL REACTIVE STORE (store.ts)                              │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                             ApplicationState                                   │   │
│   │  • config: { teamNumber, verifiedTeamName, selectedEventKey, theme, ... }      │   │
│   │  • activeEvent: { schedule, rankings, epa, queue, metadata, playoffs, ... }    │   │
│   │  • ui: { activeTab, selectedScheduleMatchKey, countdownSeconds, ... }          │   │
│   │  • overrides: { nextMatchNumber, allianceColor, queueState }                   │   │
│   │  • videoReplay: { activeMatchKey, youtubeId, isPlaying, currentTime, ... }     │   │
│   │  • telemetry: { tba, nexus, statbotics, logs }                                 │   │
│   └────────────────────────────────────────┬───────────────────────────────────────┘   │
│                                            │                                           │
│                 ┌──────────────────────────┴──────────────────────────┐                │
│                 ▼                                                     ▼                │
│   ┌──────────────────────────┐                         ┌───────────────────────────┐   │
│   │         Actions          │                         │         Selectors         │   │
│   │ • setTeamNumber(num)     │                         │ • countdownSeconds        │   │
│   │ • selectEvent(key)       │                         │ • nextUpcomingMatch       │   │
│   │ • setNextMatchNumber(n)  │                         │ • effectiveMatchInfo      │   │
│   │ • setPulseSimulator(m)   │                         │ • activeTeamEpa           │   │
│   │ • selectScheduleMatch(k) │                         │ • themeConfig / teamInfo  │   │
│   └─────────────┬────────────┘                         └───────────────────────────┘   │
└─────────────────┼──────────────────────────────────────────────────────────────────────┘
                  │
                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   MULTI-WINDOW BROADCAST CHANNEL (DisplayBroadcast)                    │
│                                                                                        │
│   ┌───────────────────────┐   BroadcastChannel('pitfusion_sync')   ┌───────────────────┐│
│   │   Primary Pit Screen  │ ◄────────────────────────────────────► │  Mobile Controller ││
│   │   (Driven Display)    │   Messages: NAVIGATE, VIDEO_COMMAND,   │  (Deck & Sim)     ││
│   │                       │   MODE_TOGGLE, MATCH_OVERRIDE, THEME   │                   ││
│   └───────────────────────┘                                        └───────────────────┘│
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          │
                                          ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND VIEWS & COMPONENT TREE                                │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                           Top Navigation (TopNav.tsx)                          │   │
│   │ • CrLogo Emblem       • Navigation Tab Bar     • Dynamic Island Status Pill    │   │
│   │ • 12h/24h Pit Clock   • Driven Screen Toggle   • Team & Event Switcher Modal   │   │
│   └────────────────────────────────────────┬───────────────────────────────────────┘   │
│                                            │                                           │
│     ┌───────────────┬──────────────────────┼───────────────────────┬──────────────┐    │
│     ▼               ▼                      ▼                       ▼              ▼    │
│ ┌────────────┐┌─────────────┐       ┌─────────────┐         ┌─────────────┐┌─────────┐ │
│ │ Dashboard  ││   Schedule  │       │  Playoffs   │         │ Controller  ││Settings │ │
│ │    View    ││     View    │       │    View     │         │    Deck     ││  & Scout│ │
│ ├────────────┤├─────────────┤       ├─────────────┤         ├─────────────┤├─────────┤ │
│ │• Next Match││• Video Replay│      │• Upper &    │         │• Remote Nav ││• Config │ │
│ │  Scouting  ││  Theater    │       │  Lower DE   │         │• Live Scrub ││• Themes │ │
│ │• Queue Call││• Full Table │       │  Bracket    │         │• Pulse Sim  ││• API Key│ │
│ │• Rankings  ││• Auto Scroll│       │• Alliance   │         │• Pit Audio  ││• Storage│ │
│ │• Livestream││• Filter/Diff│       │  Inspectors │         │  Announcer  ││• Tools  │ │
│ └────────────┘└─────────────┘       └─────────────┘         └─────────────┘└─────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure & File Responsibilities

| Path | Primary Responsibility |
| :--- | :--- |
| `src/store.ts` | Central reactive store (`pitStore`), state interfaces, immutable actions, selector hooks, tab countdown ticker, and broadcast listener. |
| `src/services.ts` | API networking clients for The Blue Alliance (`TbaService`), Nexus (`NexusService`), Statbotics (`StatboticsService`), multi-tier caching (`CacheManager`), and persistence (`StorageService`). |
| `src/types.ts` | Strict TypeScript data contracts for matches, alliances, EPAs, queues, playoffs, themes, and broadcast messages. |
| `src/components/TopNav.tsx` | Global top navigation bar featuring pit clock, theme switcher, team presets, and Apple Dynamic Island Live Activity pill. |
| `src/components/apple/LiveActivityPill.tsx` | Apple Dynamic Island pill with fluid boundary containment, synchronized match countdown, station pill, and expansion modal. |
| `src/components/ModularSegment.tsx` | Reorderable, resizable bento-box segment card with draggable handles, Apple frosted glass aesthetic, and visibility toggles. |
| `src/components/FieldLivestream.tsx` | Multi-stream video player supporting Twitch and YouTube live broadcasts with aspect-ratio preservation. |
| `src/components/TeamBadge.tsx` | Uniform team number badges with hover tooltips displaying team name, city, state, and station highlighting. |
| `src/components/PulseSetupModal.tsx` | First-run onboarding modal for selecting teams, competition events, and testing presets. |
| `src/components/ThemeModal.tsx` | Color token customizer and preset selector (CircuitRunners Green, High-Contrast OLED, Cyberpunk, etc.). |
| `src/components/ArchitectureModal.tsx` | Interactive in-app System Architecture & Code Map viewer. |
| `src/views/DashboardView.tsx` | Primary pit overview dashboard (Next Match Scouting, Active Queue Call, Rankings table, Announcements, Parts). |
| `src/views/ScheduleView.tsx` | Complete event match table with scope filtering (Team Only / All / Replays), search, and YouTube replay theater. |
| `src/views/PlayoffsView.tsx` | Authentic 14-match double-elimination tournament bracket with alliance inspector and instant replay loading. |
| `src/views/ControllerView.tsx` | Mobile and tablet companion controller for coaches to scrub video, trigger pit voice announcements, and test pulse states. |
| `src/views/SettingsView.tsx` | System preferences, TBA API key configuration, service ping diagnostics, team emblem customizer, and data reset. |
| `src/views/ScoutView.tsx` | PIN-protected team strategy and private match scouting records. |
| `src/views/ToolsView.tsx` | Tool checkout ledger for lending tools to neighboring teams in the pit lane. |
| `src/utils/teamLookup.ts` | Complete preloaded directory of FRC teams (`FRC_TEAM_DIRECTORY`) with official nicknames, cities, and states. |
| `src/utils/audioAnnouncer.ts` | SpeechSynthesis engine for voice callouts when teams are placed on deck or called to queuing. |
| `src/utils/matchUtils.ts` | Tournament sorting algorithm, match labeling (`Qual 13`, `Semi 1-1`, `Finals 2`), and alliance color utilities. |

---

## 3. Data Lifecycle Walkthrough

### A. Match Data Ingestion
1. **Trigger**: When an event is selected (`Actions.selectEvent(eventKey)`) or team is changed (`Actions.setTeamNumber(teamNumber)`), `Actions.pullTbaMatches()` is dispatched.
2. **Fetch Strategy**:
   - Tries server proxy route `/api/tba/event/:key/matches`.
   - If static (e.g. GitHub Pages), uses direct client fetch with `X-TBA-Auth-Key` if configured.
   - If offline or unauthenticated, generates authentic match schedules tailored to that event roster using `TbaService.generateMatchesForTeamAndEvent`.
3. **Storage & Normalization**: The matches are parsed into `MatchModel[]` structures, and cached in `CacheManager` with a 5-minute TTL.
4. **State Update**: Stored in `state.activeEvent.schedule`.

### B. Countdown & Active Queue Call Lifecycle
1. **Clock Tick**: Every second, `store.ts` ticks `countdownSeconds` down by 1.
2. **Next Match Derivation**:
   - `Selectors.nextUpcomingMatch` finds the team's first uncompleted match (or honors manual user selection in `overrides.nextMatchNumber`).
   - If completed, status resolves to `FINAL` (`0m 00s`).
3. **UI Synchronization**:
   - `LiveActivityPill` displays the ticking countdown and station color.
   - `DashboardView` displays the exact identical formatted time (`formatCountdown`).
   - `ControllerView` displays the queue timer.

### C. Multi-Window Broadcast Lifecycle
1. When a user on a mobile tablet clicks `ON_DECK` in `ControllerView`:
   - `Actions.setPulseSimulatorState('ON_DECK')` updates local state.
   - `DisplayBroadcastService.broadcast('MODE_TOGGLE', { queueState: 'ON_DECK', countdownSeconds: 120 })` sends a message on the browser's `BroadcastChannel('pitfusion_sync')`.
   - All other open browser tabs (pit monitor, truss display) receive the message and instantly update their pills and queue callout banners simultaneously.
