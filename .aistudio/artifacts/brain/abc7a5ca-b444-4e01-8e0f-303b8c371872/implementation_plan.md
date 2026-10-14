# Match 13 Rating Engine & Telemetry Integration Plan

Transition PitFUSION's analytics backbone from Statbotics to the **Match 13 system** (https://www.match13.com/docs/api), providing robust team xP ratings, match forecasts, server-side caching with rate-limit compliance, in-app API key configuration, and unified telemetry health monitoring.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Architectural Decisions from Clarification Interview**:
> - **API Key Configuration**: Users can enter their Match 13 API key directly in a dedicated UI Settings modal, stored in browser `localStorage`, and proxied securely through the Node/Express backend (`/api/match13/*`) with Bearer token authentication.
> - **Rating Migration**: Completely replace Statbotics EPA ratings with **Match 13 xP ratings** (`totalXP`, `autoXP`, `teleopXP`, `endgameXP`, global/district rank, and percentile metrics) throughout all views (Dashboard, Controller, Match Cards, Team Profile, and Telemetry).
> - **Telemetry Service Monitoring**: Replace the Statbotics service tile in the Telemetry Drawer and Controller View with **Match 13** health checks (`api.match13.com`), measuring live latency, rate-limit quotas (60 req/min, 1,000 req/hr), and connection status.
> - **Team Origin Refinement**: Suppress the active/host team's origin in the top-left badge (since the team already knows their own location), while preserving and emphasizing opponent and international team origins on match alliance cards.

---

### 1. Overview & Core Concept

- **What It Does**: Integrates the official Match 13 read-only API (`api.match13.com`) into PitFUSION to pull team xP ratings, historical event trajectories, and match outcome forecasts. Replaces unstable Statbotics endpoints with Match 13's high-uptime infrastructure.
- **Target Audience / Persona**: FRC drive teams, pit scouts, strategy leads, and pit display monitors requiring accurate, dependable performance ratings and match forecasts during regional and district competitions.
- **Key Value**: Eliminates competition-day downtime caused by Statbotics outages, adds predictive match win probabilities and expected point spreads from Match 13, respects Match 13's rate limits (60 req/min), and keeps telemetry green in the pit.

---

### 2. User Experience & Visual Design

#### A. Match 13 API Key & Settings Modal
- **Direct Configuration in Setup Modal & Top Nav**:
  - Add a **"Match 13 Integration"** card to `PulseSetupModal.tsx` and an API key entry field with an eye toggle (`Show/Hide`) and status test button (`Test Connection`).
  - Add a quick-access gear icon in `TopNav.tsx` or a dedicated status trigger in the Telemetry Drawer.
  - When no key is entered yet, show an unobtrusive badge: `Match 13: Demo Baseline Active (Click to add key)`.
  - Store the key securely in browser `localStorage` under `pitfusion_match13_api_key` and automatically send it via an `x-match13-key` header to our local server proxy.

#### B. Dashboard & Match Cards: Transition from EPA to xP
- **Match 13 xP Metric Badges**:
  - Replace all `EPA` labels with `xP` (e.g. `Total xP: 48.2`, `Auto: 14.5`, `Teleop: 26.1`, `Endgame: 7.6`).
  - Provide a clean unboxed text layout with typographic dots (`Total xP 48.2 · Rank #12 · 94th %ile`) adhering strictly to zero-pill guidelines.
  - Tabular formatting (`font-mono tabular-nums`) across all ratings to guarantee vertical decimal alignment.
- **Match Forecast Probability**:
  - Display Match 13 win probability on upcoming match cards (e.g., `Red Alliance 64% win probability · Projected 112 - 98`).
  - Visual delta bar showing predicted alliance xP differential with high-contrast accessibility colors (Red vs Blue).

#### C. Polished Telemetry Console & Diagnostics Drawer
- **Match 13 Service Tile**:
  - Replace `Statbotics` in `telemetry: { tba, nexus, match13 }`.
  - Display live service health: `Online`, `Latency: 48ms`, `Rate: 2/60 req/min`, `Endpoint: api.match13.com`.
  - Include an interactive `Ping Service` button triggering `/api/match13/ping` to verify connection and key validity.
- **Troubleshooting & Quota Feedback**:
  - When hitting rate limits (HTTP 429), parse the `Retry-After` header and show a countdown badge: `Rate limited · cooling down (14s)`.
  - If unauthorized (HTTP 401), prompt user to update their API key in Settings.

#### D. Team Origin Display Rules
- **Host Team Header**: In `TopNav.tsx` and top overview banner, omit the host team's city/state to eliminate redundancy.
- **Alliance & Opponent Cards**: Retain origin indicators for all opponent teams (e.g., `Marietta, GA, USA` or `Istanbul, Turkey`), ensuring scouts quickly recognize visiting and international teams.

---

### 3. Key Product Decisions & Trade-Offs

#### Decision 1: Server-Side Proxy (`server.ts`) vs Direct Browser Calls
- **Chosen Approach**: Route all Match 13 requests through Express backend proxy endpoints (`/api/match13/team/:team/ratings`, `/api/match13/matches/forecast/:eventKey`, `/api/match13/ping`).
- **Why**: The Match 13 documentation explicitly states: *"The API is designed to be called from a server, as it does not send CORS headers, preventing direct calls from a browser."* A server proxy avoids CORS blocks, secures API key headers, handles `Retry-After` rate-limiting gracefully, and caches responses in memory.
- **Alternatives Considered**: Direct client `fetch()` rejected because browser CORS preflight will fail.

#### Decision 2: In-Memory Server Caching & Rate-Limit Guard
- **Chosen Approach**: 60-second in-memory cache for live season data (matching Match 13's `Cache-Control: max-age=60`) plus a local token bucket limiter (max 50 requests/min to stay safely under Match 13's 60 req/min cap).
- **Why**: Eliminates 429 rate limit errors when multiple pit displays or browser tabs are open at the same event.
- **Alternatives Considered**: No caching rejected because querying all 6 teams in a match simultaneously would quickly burn through the rate allowance.

#### Decision 3: Standardized xP Data Model with Baseline Fallback
- **Chosen Approach**: Define `Match13TeamRating` and `Match13MatchForecast` models. If the server is offline or the user is using the app on a static deployment (e.g., GitHub Pages without API key), automatically fall back to pre-compiled verified 2026 team xP baselines for the 5 target teams (`1002`, `118`, `9483`, `2046`, `973`).
- **Why**: Ensures zero broken cards or crashing renders even with network drops in high-interference arenas.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER CLIENT                                 │
│                                                                             │
│  ┌───────────────────────┐  ┌─────────────────────┐  ┌───────────────────┐  │
│  │     DashboardView     │  │   ControllerView    │  │  ScheduleView     │  │
│  │ (xP Badges & Forecast)│  │ (Match 13 Telemetry)│  │ (Alliance Totals) │  │
│  └───────────┬───────────┘  └──────────┬──────────┘  └─────────┬─────────┘  │
│              │                         │                       │            │
│              ▼                         ▼                       ▼            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │             State Store (`store.ts`) & `services.ts`                  │  │
│  │   • telemetry.match13: { status, latencyMs, rateLimitRemaining }      │  │
│  │   • teamRatings: Record<number, Match13TeamRating>                    │  │
│  │   • matchForecasts: Record<string, Match13MatchForecast>             │  │
│  │   • localStorage: 'pitfusion_match13_api_key'                         │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ HTTP /api/match13/* (x-match13-key)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPRESS SERVER (`server.ts`)                        │
│                                                                             │
│  ┌───────────────────────────┐         ┌─────────────────────────────────┐  │
│  │   Proxy & Rate Limiter    │ ──────> │  Memory Cache (`node-cache` /   │  │
│  │ (Max 50 req/min per key)  │         │  TTL 60s for live season data)  │  │
│  └─────────────┬─────────────┘         └─────────────────────────────────┘  │
│                │                                                            │
│                │ Authorization: Bearer <API_KEY>                            │
│                ▼                                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                Match 13 Remote API (`api.match13.com`)                 │  │
│  │   • GET /team/:team/year/:year (xP rating & breakdown)                │  │
│  │   • GET /team/:team/events (Team rating change across events)         │  │
│  │   • GET /event/:event/forecasts (Match forecasts & win probabilities) │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Core Data Entities

1. **`Match13TeamRating`**:
   - `teamNumber: number`
   - `teamName: string`
   - `totalXP: number`
   - `autoXP: number`
   - `teleopXP: number`
   - `endgameXP: number`
   - `rank: number`
   - `districtRank?: number`
   - `percentile: number`
   - `winRate: number`
   - `matchesPlayed: number`
   - `ratingChange: number`
   - `seasonYear: number`

2. **`Match13MatchForecast`**:
   - `matchKey: string`
   - `redWinProbability: number` (0.00 – 1.00)
   - `blueWinProbability: number`
   - `predictedRedScore: number`
   - `predictedBlueScore: number`
   - `predictedRedXP: number`
   - `predictedBlueXP: number`
   - `confidence: 'HIGH' | 'MEDIUM' | 'LOW'`

3. **`TelemetryState`**:
   - `match13: { status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'RATE_LIMITED'; latencyMs: number; consecutiveFailures: number; lastChecked: string; quotaRemaining: number }`

#### Interactive Component & State Mapping

- **`PulseSetupModal.tsx`**: Adds Match 13 API Key input, verification indicator, and documentation link.
- **`server.ts`**: Implements `/api/match13/ping`, `/api/match13/team/:team`, `/api/match13/team/:team/events`, and `/api/match13/event/:event/forecasts`.
- **`services.ts`**: Replaces `StatboticsService` with `Match13Service`, managing client requests, fallback baselines, and caching.
- **`store.ts`**: Updates telemetry state schema and health ping routines to probe Match 13 instead of Statbotics.
- **`ControllerView.tsx` & `DashboardView.tsx`**: Replaces Statbotics references with Match 13 xP rating cards and health indicators.
- **`TopNav.tsx`**: Removes active team origin from the top left header while keeping opponent origins intact.
