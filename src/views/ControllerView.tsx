/**
 * Pit Operations Controller & Debug Console
 * Team 1002 CircuitRunners
 * 
 * Provides full remote control over what screen the pit display shows,
 * interactive match video scrubbing & rewinding, live TBA match video pulling,
 * real-time API telemetry diagnostics, and pit broadcast alerts.
 */

import React, { useState } from 'react';
import {
  Sliders,
  Tv,
  Film,
  Activity,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Download,
  Radio,
  ExternalLink,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Zap,
  ShieldCheck,
  Server,
  Layers,
  ChevronRight,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { NavigationTab, MatchModel } from '../types';

export const ControllerView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const currentTab = usePitState(Selectors.currentTab);
  const activeEvent = usePitState(Selectors.activeEvent);
  const matchInfo = usePitState(Selectors.effectiveMatchInfo);
  const tenFootMode = usePitState(Selectors.tenFootMode);
  const telemetry = usePitState(Selectors.telemetrySummary);
  const videoReplay = usePitState(Selectors.videoReplay);
  const telemetryLogs = usePitState(Selectors.telemetryLogs);
  const matches = usePitState(Selectors.matches);
  const replayMatches = usePitState(Selectors.replayMatches);

  // Local controller states
  const [customEventKey, setCustomEventKey] = useState(activeEvent?.key || '2026gacmp');
  const [isPullingTba, setIsPullingTba] = useState(false);
  const [tbaPullSuccess, setTbaPullSuccess] = useState<string | null>(null);
  const [manualMatchOverride, setManualMatchOverride] = useState('');

  // Page switcher options
  const displayPages: Array<{ id: NavigationTab; title: string; desc: string; icon: string }> = [
    { id: 'dashboard', title: 'Pit Dashboard', desc: 'Active countdown, queue status, current ranking', icon: '📊' },
    { id: 'schedule', title: 'Match Schedule', desc: 'Full event match timeline & upcoming alliances', icon: '📅' },
    { id: 'previous', title: 'Video Replays', desc: 'Completed match scores & video playback scrubber', icon: '⏪' },
    { id: 'playoffs', title: 'Playoff Bracket', desc: 'Alliance selection & double-elimination tree', icon: '🏆' },
    { id: 'scout', title: 'Strategy & Scouting', desc: 'Team classifications, picklist & notes', icon: '🎯' },
    { id: 'tools', title: 'Tool Loan Registry', desc: 'Inventory borrowing & return tracker', icon: '🔧' },
    { id: 'settings', title: 'System Settings', desc: 'API keys, display settings, and preferences', icon: '⚙️' },
  ];

  // Handlers
  const handleSwitchDisplayPage = (tab: NavigationTab) => {
    Actions.broadcastNavigate(tab);
  };

  const handlePullTba = async () => {
    setIsPullingTba(true);
    setTbaPullSuccess(null);
    try {
      const result = await Actions.pullTbaMatches(customEventKey.trim());
      if (result) {
        setTbaPullSuccess(result.message);
        setTimeout(() => setTbaPullSuccess(null), 5000);
      }
    } finally {
      setIsPullingTba(false);
    }
  };

  const handleSelectReplayMatch = (m: MatchModel) => {
    if (m.videos && m.videos.length > 0) {
      Actions.selectReplayMatch(
        m.key,
        m.videos[0].key,
        `Quals ${m.matchNumber} - Team 1002 (${m.winner === 'blue' ? 'W' : 'L'} ${m.blueAlliance.score ?? ''} - ${m.redAlliance.score ?? ''})`
      );
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div id="controller-view" className="space-y-6">
      {/* Top Banner & Control Deck Header */}
      <div
        className="rounded-2xl p-6 border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl border flex items-center justify-center"
              style={{
                backgroundColor: theme.tokens.background,
                borderColor: theme.tokens.border,
                color: theme.tokens.accent,
              }}
            >
              <Radio size={22} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                Pit Operations Controller & Debug Deck
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  REMOTE BROADCAST ACTIVE
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Command center for multi-screen pit displays, video replay rewinding, TBA sync, and live API telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => window.open(window.location.href.split('#')[0] + '#dashboard', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 border border-zinc-700 text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Open an isolated display screen for the pit TV"
          >
            <ExternalLink size={13} />
            Launch Display Screen
          </button>
          <button
            onClick={() => Actions.toggleTenFootMode()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              tenFootMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
            }`}
          >
            <Maximize2 size={13} />
            10-Foot Mode: {tenFootMode ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Display Screen Director (Remote Navigation) */}
      <div
        className="rounded-2xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Tv size={18} style={{ color: theme.tokens.foreground }} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Display Screen Director (Control Active Page)
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Active Display:</span>
            <span className="font-mono font-bold text-emerald-400 uppercase">
              {currentTab}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-400">
          Click any view below to instantaneously switch what the main pit monitor is showing. Cross-window broadcast synchronization keeps external pit TVs in lockstep with this controller.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {displayPages.map((page) => {
            const isActive = currentTab === page.id;
            return (
              <button
                key={page.id}
                onClick={() => handleSwitchDisplayPage(page.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all group cursor-pointer ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-1 ring-emerald-500/40'
                    : 'border-zinc-800 bg-black/40 hover:border-zinc-700 hover:bg-black/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{page.icon}</span>
                  {isActive ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500 text-black">
                      ACTIVE DISPLAY
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300">
                      Switch →
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-zinc-200">{page.title}</div>
                  <div className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">{page.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Video Replay Scrubber & Rewind Control Deck */}
      <div
        className="rounded-2xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Film size={18} style={{ color: theme.tokens.foreground }} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Video Replay & Rewind Scrubber Control
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Target Match:</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black border border-zinc-800 text-emerald-400">
              {videoReplay.matchTitle || 'No Match Selected'}
            </span>
            <button
              onClick={() => {
                Actions.broadcastNavigate('previous');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 text-xs text-zinc-200 hover:text-white"
            >
              Push to Display
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player Preview / Embed */}
          <div className="lg:col-span-1 rounded-xl bg-black border border-zinc-800 overflow-hidden flex flex-col">
            <div className="relative aspect-video w-full bg-zinc-950">
              {videoReplay.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${videoReplay.youtubeId}?autoplay=${
                    videoReplay.isPlaying ? 1 : 0
                  }&start=${Math.floor(videoReplay.currentTime)}&rel=0&enablejsapi=1`}
                  title="FRC Match Replay"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                  No video selected. Pull from TBA below.
                </div>
              )}
            </div>

            <div className="p-3 text-xs bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between">
              <span className="text-zinc-400 font-mono">
                {formatTime(videoReplay.currentTime)} / {formatTime(videoReplay.duration)}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                Speed: {videoReplay.playbackRate}x
              </span>
            </div>
          </div>

          {/* Interactive Scrubber & Rewind Buttons */}
          <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
            {/* Timeline Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span className="font-semibold text-zinc-200">Replay Timeline Scrubber</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {formatTime(videoReplay.currentTime)} ({Math.round((videoReplay.currentTime / videoReplay.duration) * 100)}%)
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={videoReplay.duration}
                value={videoReplay.currentTime}
                onChange={(e) => Actions.sendVideoCommand('seek', Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-2 bg-zinc-800 rounded-lg"
              />
            </div>

            {/* Rewind & Playback Controls */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 py-2 bg-black/40 p-3 rounded-xl border border-zinc-800">
              <button
                onClick={() => Actions.sendVideoCommand('seek', 0)}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="Replay from Start (0:00)"
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={() => Actions.sendVideoCommand('seek', videoReplay.currentTime - 10)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                title="Rewind 10 Seconds"
              >
                <Rewind size={15} />
                -10s
              </button>
              <button
                onClick={() => Actions.sendVideoCommand('seek', videoReplay.currentTime - 5)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                title="Rewind 5 Seconds"
              >
                <Rewind size={14} />
                -5s
              </button>

              <button
                onClick={() => Actions.sendVideoCommand(videoReplay.isPlaying ? 'pause' : 'play')}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition-transform active:scale-95 shadow-md"
              >
                {videoReplay.isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {videoReplay.isPlaying ? 'Pause' : 'Play'}
              </button>

              <button
                onClick={() => Actions.sendVideoCommand('seek', videoReplay.currentTime + 5)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                title="Fast Forward 5 Seconds"
              >
                +5s
                <FastForward size={14} />
              </button>
              <button
                onClick={() => Actions.sendVideoCommand('seek', videoReplay.currentTime + 10)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-colors"
                title="Fast Forward 10 Seconds"
              >
                +10s
                <FastForward size={15} />
              </button>
            </div>

            {/* Playback Speed Select */}
            <div className="flex items-center gap-2 text-xs pt-1">
              <span className="text-zinc-400 font-medium">Analysis Speed:</span>
              {[0.25, 0.5, 1.0, 1.5, 2.0].map((rate) => (
                <button
                  key={rate}
                  onClick={() => Actions.sendVideoCommand('rate', rate)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors ${
                    videoReplay.playbackRate === rate
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Pull Match Videos from The Blue Alliance (TBA) */}
      <div
        className="rounded-2xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Download size={18} style={{ color: theme.tokens.foreground }} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Pull Match Videos from The Blue Alliance (TBA)
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {replayMatches.length} Matches with Replays Indexed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">TBA Event Key</label>
            <input
              type="text"
              value={customEventKey}
              onChange={(e) => setCustomEventKey(e.target.value)}
              placeholder="e.g. 2026gacmp or 2026gadal"
              className="w-full px-3 py-2 rounded-lg bg-black/50 border border-zinc-700 text-xs font-mono text-zinc-100 placeholder-zinc-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">Quick Event Presets</label>
            <div className="flex items-center gap-1.5">
              {['2026gacmp', '2026gadal', '2025gacmp'].map((key) => (
                <button
                  key={key}
                  onClick={() => setCustomEventKey(key)}
                  className={`px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                    customEventKey === key
                      ? 'bg-zinc-700 text-white font-bold'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <button
              onClick={handlePullTba}
              disabled={isPullingTba}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors shadow-md disabled:opacity-50"
            >
              <RefreshCw size={14} className={isPullingTba ? 'animate-spin' : ''} />
              {isPullingTba ? 'Pulling from TBA...' : 'Pull Match Videos from TBA'}
            </button>
          </div>
        </div>

        {tbaPullSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={16} />
            <span>{tbaPullSuccess}</span>
          </div>
        )}

        {/* Available Match Replays List */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
            Available Match Replays for Team 1002:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {matches.map((m) => {
              const hasVideo = m.videos && m.videos.length > 0;
              const isSelected = videoReplay.activeMatchKey === m.key;
              const isBlue = m.blueAlliance.teams.includes(1002);
              const teamScore = isBlue ? m.blueAlliance.score : m.redAlliance.score;
              const oppScore = isBlue ? m.redAlliance.score : m.blueAlliance.score;
              const isWon = m.winner && ((isBlue && m.winner === 'blue') || (!isBlue && m.winner === 'red'));

              return (
                <div
                  key={m.key}
                  onClick={() => hasVideo && handleSelectReplayMatch(m)}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                    hasVideo ? 'cursor-pointer hover:border-zinc-600' : 'opacity-60 cursor-not-allowed'
                  } ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-zinc-800 bg-black/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold font-mono text-zinc-100">
                      Qual {m.matchNumber}
                    </span>
                    {hasVideo ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <Film size={10} /> VIDEO
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500">Upcoming</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className={isBlue ? 'text-blue-400' : 'text-rose-400'}>
                      {isBlue ? 'Blue Alliance' : 'Red Alliance'}
                    </span>
                    {teamScore !== null ? (
                      <span className={`font-bold ${isWon ? 'text-emerald-400' : 'text-zinc-400'}`}>
                        {teamScore} - {oppScore}
                      </span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </div>

                  {hasVideo && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-400">
                      <span>YouTube ID: {m.videos[0].key}</span>
                      <span className="text-emerald-400 font-bold">Select & Play</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 5: Real-Time API Telemetry & Diagnostic Suite */}
      <div
        className="rounded-2xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Activity size={18} style={{ color: theme.tokens.foreground }} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              API Telemetry & Diagnostics
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                Actions.pingService('tba');
                Actions.pingService('nexus');
                Actions.pingService('statbotics');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
            >
              <Zap size={13} className="text-amber-400" />
              Test All Endpoints
            </button>
            <button
              onClick={() => Actions.clearTelemetryLogs()}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* 3 Core Services Telemetry Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* TBA Telemetry */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                <Server size={14} className="text-blue-400" />
                The Blue Alliance Beta
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                {telemetry.tba.status}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono truncate">
              https://beta.thebluealliance.com/api/v3
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500">HTTP Status:</span>
              <span className="font-mono text-zinc-300 font-bold">200 OK</span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => Actions.pingService('tba')}
                className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors"
              >
                Ping TBA Beta Service
              </button>
            </div>
          </div>

          {/* Nexus Telemetry */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                <Clock size={14} className="text-amber-400" />
                FRC Nexus (Queuing)
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                {telemetry.nexus.status}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono truncate">
              https://frc.nexus/api/v1/event
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500">Polling Interval:</span>
              <span className="font-mono text-zinc-300 font-bold">15s Active</span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => Actions.pingService('nexus')}
                className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors"
              >
                Ping Nexus Service
              </button>
            </div>
          </div>

          {/* Statbotics Telemetry */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                <ShieldCheck size={14} className="text-emerald-400" />
                Statbotics EPA Engine
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                {telemetry.statbotics.status}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono truncate">
              https://api.statbotics.io/v3/team
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500">EPA Models:</span>
              <span className="font-mono text-zinc-300 font-bold">48 Teams Live</span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => Actions.pingService('statbotics')}
                className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors"
              >
                Ping Statbotics Service
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Event Logs */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Telemetry Event Stream:
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {telemetryLogs.length} Events Logged
            </span>
          </div>
          <div className="rounded-xl bg-black/60 border border-zinc-800 p-3 max-h-48 overflow-y-auto font-mono text-xs space-y-1.5">
            {telemetryLogs.length === 0 ? (
              <div className="text-zinc-500 text-center py-4">No events logged yet.</div>
            ) : (
              telemetryLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                        log.service === 'TBA'
                          ? 'bg-blue-500/20 text-blue-400'
                          : log.service === 'NEXUS'
                          ? 'bg-amber-500/20 text-amber-400'
                          : log.service === 'STATBOTICS'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}
                    >
                      {log.service}
                    </span>
                    <span className="text-zinc-300">{log.message}</span>
                  </div>
                  {log.latencyMs !== undefined && (
                    <span className="text-emerald-400 font-bold shrink-0">
                      {log.latencyMs}ms
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
