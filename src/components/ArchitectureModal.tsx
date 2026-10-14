import React, { useState } from 'react';
import {
  X,
  Layers,
  Cpu,
  Radio,
  Share2,
  Database,
  ArrowRight,
  Tv,
  Eye,
  CheckCircle2,
  Copy,
  Check,
  FileCode,
  Sparkles,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState<'map' | 'services' | 'state' | 'views'>('map');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyDiagram = () => {
    const text = `
+----------------------------------------------------------------------------------------+
|                                 EXTERNAL DATA SOURCES                                  |
|   +---------------------+      +---------------------+      +----------------------+   |
|   |  The Blue Alliance  |      |     Nexus Queue     |      |   Match 13 Engine    |   |
|   |  (Schedules/Videos) |      |   (Arena Staging)   |      |  (xP Ratings/FCast)  |   |
|   +----------+----------+      +----------+----------+      +----------+-----------+   |
+--------------+----------------------------+----------------------------+---------------+
               |                            |                            |
               v                            v                            v
+----------------------------------------------------------------------------------------+
|                        SERVICES & NETWORKING LAYER (services.ts)                       |
|   +-----------------------+  +-----------------------+  +--------------------------+   |
|   |      TbaService       |  |     NexusService      |  |     Match13Service       |   |
|   | . API v3 & Proxy Fall |  | . Webhook & Polling   |  | . Team xP & Forecasts    |   |
|   | . Realistic Fallbacks |  | . Staging Lane Status |  | . Live Server Proxy (/api|   |
|   | . YouTube Replay Keys |  | . Est. Match Delays   |  | . Auto/Teleop/Endgame xP |   |
|   +----------+------------+  +----------+------------+  +----------+---------------+   |
|              |                          |                          |                   |
|              +--------------------------+--------------------------+                   |
|                                         v                                              |
|                             +-----------------------+                                  |
|                             |     CacheManager      |                                  |
|                             | . LocalStorage Cache  |                                  |
|                             | . In-Memory TTL Cache |                                  |
|                             +----------+------------+                                  |
+----------------------------------------+-----------------------------------------------+
                                         |
                                         v
+----------------------------------------------------------------------------------------+
|                         CENTRAL REACTIVE STORE (store.ts)                              |
|   +--------------------------------------------------------------------------------+   |
|   |                             ApplicationState                                   |   |
|   |  . config: { teamNumber, verifiedTeamName, selectedEventKey, theme, ... }      |   |
|   |  . activeEvent: { schedule, rankings, epa, queue, metadata, playoffs, ... }    |   |
|   |  . ui: { activeTab, selectedScheduleMatchKey, countdownSeconds, ... }          |   |
|   |  . overrides: { nextMatchNumber, allianceColor, queueState }                   |   |
|   |  . videoReplay: { activeMatchKey, youtubeId, isPlaying, currentTime, ... }     |   |
|   |  . telemetry: { tba, nexus, match13, logs }                                    |   |
|   +----------------------------------------+---------------------------------------+   |
|                                            |                                           |
|                 +--------------------------+--------------------------+                |
|                 v                                                     v                |
|   +--------------------------+                         +---------------------------+   |
|   |         Actions          |                         |         Selectors         |   |
|   | . setTeamNumber(num)     |                         | . countdownSeconds        |   |
|   | . selectEvent(key)       |                         | . nextUpcomingMatch       |   |
|   | . setNextMatchNumber(n)  |                         | . effectiveMatchInfo      |   |
|   | . setPulseSimulator(m)   |                         | . activeTeamEpa           |   |
|   | . selectScheduleMatch(k) |                         | . themeConfig / teamInfo  |   |
|   +-------------+------------+                         +---------------------------+   |
+-----------------+----------------------------------------------------------------------+
                  |
                  v
+----------------------------------------------------------------------------------------+
|                   MULTI-WINDOW BROADCAST CHANNEL (DisplayBroadcast)                    |
|   +-----------------------+   BroadcastChannel('pitfusion_sync')   +-------------------+|
|   |   Primary Pit Screen  | <------------------------------------> |  Mobile Controller ||
|   |   (Driven Display)    |   Messages: NAVIGATE, VIDEO_COMMAND,   |  (Deck & Sim)     ||
|   |                       |   MODE_TOGGLE, MATCH_OVERRIDE, THEME   |                   ||
|   +-----------------------+                                        +-------------------+|
+-----------------------------------------+----------------------------------------------+
                                          |
                                          v
+----------------------------------------------------------------------------------------+
|                         FRONTEND VIEWS & COMPONENT TREE                                |
|   +--------------------------------------------------------------------------------+   |
|   |                           Top Navigation (TopNav.tsx)                          |   |
|   | . CrLogo Emblem       . Navigation Tab Bar     . Dynamic Island Status Pill    |   |
|   | . 12h/24h Pit Clock   . Driven Screen Toggle   . Team & Event Switcher Modal   |   |
|   +----------------------------------------+---------------------------------------+   |
|                                            |                                           |
|     +---------------+----------------------+-----------------------+--------------+    |
|     v               v                      v                       v              v    |
| +------------++-------------+       +-------------+         +-------------++---------+ |
| | Dashboard  ||   Schedule  |       |  Playoffs   |         | Controller  ||Settings | |
| |    View    ||     View    |       |    View     |         |    Deck     ||  & Scout| |
| +------------++-------------+       +-------------+         +-------------++---------+ |
| |. Next Match||. Video Replay|      |. Upper &    |         |. Remote Nav ||. Config | |
| |  Scouting  ||  Theater    |       |  Lower DE   |         |. Live Scrub ||. Themes | |
| |. Queue Call||. Full Table |       |  Bracket    |         |. Pulse Sim  ||. API Key| |
| |. Rankings  ||. Auto Scroll|       |. Alliance   |         |. Pit Audio  ||. Storage| |
| |. Livestream||. Filter/Diff|       |  Inspectors |         |  Announcer  ||. Tools  | |
| +------------++-------------+       +-------------+         +-------------++---------+ |
+----------------------------------------------------------------------------------------+
`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] bg-zinc-950 border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Apple Inset Grabber Handle */}
        <div className="w-12 h-1 rounded-full bg-white/20 mx-auto mt-2.5 mb-1" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>PitFUSION 2.0 System Architecture & Code Map</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Full End-to-End Map
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Visual pipeline showing external APIs, central store, broadcast channel, and views
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-black/50 border-b border-zinc-800 text-xs font-mono shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveSection('map')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'map'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Layers size={13} />
            <span>Full System Map</span>
          </button>
          <button
            onClick={() => setActiveSection('services')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'services'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Cpu size={13} />
            <span>Services & APIs</span>
          </button>
          <button
            onClick={() => setActiveSection('state')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'state'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Database size={13} />
            <span>Store & Broadcast Sync</span>
          </button>
          <button
            onClick={() => setActiveSection('views')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'views'
                ? 'bg-amber-400 text-black shadow-xs'
                : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Tv size={13} />
            <span>Views & Subsystems</span>
          </button>

          <button
            onClick={handleCopyDiagram}
            className="ml-auto px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-[11px] font-mono text-zinc-300 border border-zinc-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy ASCII Architecture Map"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied Diagram' : 'Copy Map'}</span>
          </button>
        </div>

        {/* Content Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
          {activeSection === 'map' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-black/90 border border-zinc-800 shadow-inner overflow-x-auto">
                <pre className="font-mono text-[10px] sm:text-xs text-amber-300/95 leading-relaxed selection:bg-amber-500 selection:text-black">
{`┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 EXTERNAL DATA SOURCES                                  │
│                                                                                        │
│   ┌─────────────────────┐      ┌─────────────────────┐      ┌──────────────────────┐   │
│   │  The Blue Alliance  │      │     Nexus Queue     │      │   Match 13 Engine    │   │
│   │  (Schedules/Videos) │      │   (Arena Staging)   │      │  (xP Ratings/FCast)  │   │
│   └──────────┬──────────┘      └──────────┬──────────┘      └──────────┬───────────┘   │
└──────────────┼────────────────────────────┼────────────────────────────┼───────────────┘
               │                            │                            │
               ▼                            ▼                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        SERVICES & NETWORKING LAYER (services.ts)                       │
│                                                                                        │
│   ┌───────────────────────┐  ┌───────────────────────┐  ┌──────────────────────────┐   │
│   │      TbaService       │  │     NexusService      │  │     Match13Service       │   │
│   │ • API v3 & Proxy Fall │  │ • Webhook & Polling   │  │ • Team xP & Forecasts    │   │
│   │ • Realistic Fallbacks │  │ • Staging Lane Status │  │ • Live Server Proxy (/api│   │
│   │ • YouTube Replay Keys │  │ • Est. Match Delays   │  │ • Auto/Teleop/Endgame xP │   │
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
│   │  • telemetry: { tba, nexus, match13, logs }                                    │   │
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
└────────────────────────────────────────────────────────────────────────────────────────┘`}
                </pre>
              </div>

              {/* Quick Pipeline Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400">
                    <Radio size={14} />
                    <span>1. Ingestion Pipeline</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Data arrives from TBA API v3, Nexus queues, and Match 13 (api.match13.com). Network requests are proxied and cached with TTLs in CacheManager.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400">
                    <Database size={14} />
                    <span>2. Observable Store</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    A single centralized store (pitStore) manages state. Actions mutate data immutably, and Selectors notify only subscribed components.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                    <Share2 size={14} />
                    <span>3. Cross-Screen Sync</span>
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    BroadcastChannel synchronizes multiple displays in real-time. Driven screens follow controller clicks and video scrub actions instantly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'services' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* TBA Service Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">TbaService (The Blue Alliance)</span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-mono text-[10px]">
                      REST API v3
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    Pulls authentic match schedules, qualification rankings, event metadata, and match replay video keys.
                  </p>
                  <ul className="list-disc list-inside text-zinc-400 space-y-1">
                    <li>3 fetch strategies: Express proxy, client CORS, and dynamic generator</li>
                    <li>Guaranteed real YouTube replay keys for completed matches</li>
                    <li>Automatic fallback for offline pit environments</li>
                  </ul>
                </div>

                {/* Match 13 Engine Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Match13Service (xP & Forecast Engine)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[10px]">
                      xP Ratings & Forecasts
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    Retrieves official Match 13 team performance ratings (xP) and predictive match outcome forecasts.
                  </p>
                  <ul className="list-disc list-inside text-zinc-400 space-y-1">
                    <li>Total xP, Auto xP, Teleop xP, and Endgame xP metric breakdowns</li>
                    <li>Head-to-head match win probabilities and predicted alliance scores</li>
                    <li>Server-side proxy (/api/match13/*) with token bucket rate limiting (60 req/min)</li>
                  </ul>
                </div>

                {/* Nexus Service Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">NexusService (Arena Queue)</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-mono text-[10px]">
                      Queue Telemetry
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    Monitors live competition queuing status, delays, and staging announcements.
                  </p>
                  <ul className="list-disc list-inside text-zinc-400 space-y-1">
                    <li>Tracks current on-field match and now-queuing match</li>
                    <li>Calculates estimated match buffer and on-deck warnings</li>
                    <li>Supports webhook ingestion and periodic polling</li>
                  </ul>
                </div>

                {/* Audio Announcer Card */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">AudioAnnouncer (Pit Voice)</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-mono text-[10px]">
                      Web Speech API
                    </span>
                  </div>
                  <p className="text-zinc-400">
                    Synthesizes real-time spoken pit callouts for critical match queuing events.
                  </p>
                  <ul className="list-disc list-inside text-zinc-400 space-y-1">
                    <li>Voice callouts for Queue in 5m, On Deck, and Gate Proceed</li>
                    <li>Deduplicates rapid queue triggers</li>
                    <li>Obeys mute toggle and volume persistence</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'state' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <h3 className="font-bold text-sm text-white">Central Reactive State Model (`store.ts`)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 font-mono text-[11px] space-y-1">
                    <div className="text-amber-400 font-bold">State Properties</div>
                    <div className="text-zinc-300">• config: teamNumber, eventKey, theme</div>
                    <div className="text-zinc-300">• activeEvent: schedule, rankings, queue</div>
                    <div className="text-zinc-300">• ui: activeTab, countdownSeconds, selectedKey</div>
                    <div className="text-zinc-300">• overrides: nextMatchNumber, queueState</div>
                    <div className="text-zinc-300">• videoReplay: activeKey, isPlaying, scrubTime</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/50 border border-zinc-800 font-mono text-[11px] space-y-1">
                    <div className="text-emerald-400 font-bold">Core Actions</div>
                    <div className="text-zinc-300">• setNextMatchNumber(num, alliance)</div>
                    <div className="text-zinc-300">• setPulseSimulatorState(mode)</div>
                    <div className="text-zinc-300">• selectScheduleMatch(matchKey)</div>
                    <div className="text-zinc-300">• selectEvent(key, name)</div>
                    <div className="text-zinc-300">• applyThemePreset(presetId)</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <h3 className="font-bold text-sm text-white">Multi-Screen Synchronization (`DisplayBroadcastService`)</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Utilizes the native browser BroadcastChannel (`BroadcastChannel('pitfusion_sync')`) to keep multiple windows, monitors, and mobile controllers aligned with zero latency:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800">
                    <span className="text-blue-400 font-bold">NAVIGATE</span>
                    <p className="text-zinc-400 text-[10px] mt-0.5">Driven screens follow remote tab changes</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800">
                    <span className="text-amber-400 font-bold">VIDEO_COMMAND</span>
                    <p className="text-zinc-400 text-[10px] mt-0.5">Scrub, pause, seek, and phase jump across displays</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-zinc-800">
                    <span className="text-emerald-400 font-bold">MODE_TOGGLE</span>
                    <p className="text-zinc-400 text-[10px] mt-0.5">Broadcasts simulated queue states to all pills</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'views' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="font-bold text-white text-sm">DashboardView (Pit HUD)</span>
                  <p className="text-zinc-400">
                    Modular bento layout featuring "Next Match Scouting & Matchup", Active Queue Call banner, Division Rankings, Livestream, and Announcements.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="font-bold text-white text-sm">ScheduleView (Match Theater)</span>
                  <p className="text-zinc-400">
                    Full tournament match table with scope filtering (Team / All / Replays), search, and high-definition YouTube replay player with game phase jump controls.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="font-bold text-white text-sm">PlayoffsView (Double Elimination)</span>
                  <p className="text-zinc-400">
                    Authentic TBA-style 14-match upper and lower double-elimination bracket with alliance inspectors and instant replay integration.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="font-bold text-white text-sm">ControllerView (Mobile Deck)</span>
                  <p className="text-zinc-400">
                    Compact touch deck for coaches to trigger pit audio announcements, test pulse simulator states, scrub match replays, and steer driven screens.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-black/40 shrink-0 text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">
            PitFUSION 2.0 • Architecture Map v2.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold cursor-pointer transition-colors"
          >
            Close Map
          </button>
        </div>
      </div>
    </div>
  );
};
