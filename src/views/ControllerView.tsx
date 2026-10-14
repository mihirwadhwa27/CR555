/**
 * Pit Operations Controller & Debug Console
 * Team 1002 CircuitRunners
 * 
 * Provides full remote control over what screen the pit display shows,
 * interactive match video scrubbing & rewinding, live TBA match video pulling,
 * real-time API telemetry diagnostics, and pit broadcast alerts.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  LayoutDashboard,
  Calendar,
  Trophy,
  Target,
  Wrench,
  Settings,
  Shuffle,
  BarChart3,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { NavigationTab, MatchModel } from '../types';
import { QualityControlService, getRandomQcTeams } from '../services/qualityControl';

export const ControllerView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const currentTab = usePitState(Selectors.currentTab);
  const isDrivenScreen = usePitState(Selectors.isDrivenScreen);
  const remoteTargetTab = usePitState(Selectors.remoteTargetTab);
  const activeEvent = usePitState(Selectors.activeEvent);
  const matchInfo = usePitState(Selectors.effectiveMatchInfo);
  const tenFootMode = usePitState(Selectors.tenFootMode);
  const telemetry = usePitState(Selectors.telemetrySummary);
  const videoReplay = usePitState(Selectors.videoReplay);
  const telemetryLogs = usePitState(Selectors.telemetryLogs);
  const matches = usePitState(Selectors.matches);
  const replayMatches = usePitState(Selectors.replayMatches);
  const teamInfo = usePitState(Selectors.teamInfo);
  const pulseMode = usePitState(Selectors.pulseSimulatorState);
  const countdownSeconds = usePitState(Selectors.countdownSeconds);
  const demoMode = usePitState(Selectors.demoMode);

  // Local controller states
  const [customEventKey, setCustomEventKey] = useState(activeEvent?.key || '2026gacmp');
  const [isPullingTba, setIsPullingTba] = useState(false);
  const [tbaPullSuccess, setTbaPullSuccess] = useState<string | null>(null);
  const [manualMatchOverride, setManualMatchOverride] = useState('');
  const [qcStatusMessage, setQcStatusMessage] = useState<string | null>(null);
  const [isRunningControllerQc, setIsRunningControllerQc] = useState(false);
  const [simTeamInput, setSimTeamInput] = useState(String(teamInfo.number || 1002));

  const previewIframeRef = useRef<HTMLIFrameElement>(null);

  const sendIframeMessage = (func: string, args: any[] = []) => {
    try {
      previewIframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    } catch (e) {
      console.warn('Iframe postMessage error:', e);
    }
  };

  useEffect(() => {
    if (!videoReplay.commandType) return;
    if (videoReplay.commandType === 'rate') {
      sendIframeMessage('setPlaybackRate', [videoReplay.playbackRate]);
    } else if (videoReplay.commandType === 'play') {
      sendIframeMessage('playVideo', []);
    } else if (videoReplay.commandType === 'pause') {
      sendIframeMessage('pauseVideo', []);
    } else if (videoReplay.commandType === 'seek') {
      sendIframeMessage('seekTo', [videoReplay.currentTime, true]);
    }
  }, [videoReplay.commandNonce, videoReplay.commandType, videoReplay.playbackRate, videoReplay.currentTime]);

  // Page switcher options with open-source icons
  const displayPages: Array<{ id: NavigationTab; title: string; desc: string; icon: React.ReactNode }> = [
    { id: 'dashboard', title: 'Pit Dashboard', desc: 'Active countdown, queue status, current ranking', icon: <LayoutDashboard size={20} className="text-amber-400" /> },
    { id: 'schedule', title: 'Match Schedule', desc: 'Full event match timeline & upcoming alliances', icon: <Calendar size={20} className="text-blue-400" /> },
    { id: 'previous', title: 'Video Replays', desc: 'Completed match scores & video playback scrubber', icon: <Film size={20} className="text-purple-400" /> },
    { id: 'playoffs', title: 'Playoff Bracket', desc: 'Alliance selection & double-elimination tree', icon: <Trophy size={20} className="text-amber-400" /> },
    { id: 'scout', title: 'Strategy & Scouting', desc: 'Team classifications, picklist & notes', icon: <Target size={20} className="text-rose-400" /> },
    { id: 'tools', title: 'Tool Loan Registry', desc: 'Inventory borrowing & return tracker', icon: <Wrench size={20} className="text-orange-400" /> },
    { id: 'settings', title: 'System Settings', desc: 'API keys, display settings, and preferences', icon: <Settings size={20} className="text-zinc-400" /> },
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

  const handleRunQcInController = async () => {
    setIsRunningControllerQc(true);
    setQcStatusMessage('Executing 10-Pass QC across random teams...');
    try {
      const report = await QualityControlService.runMultiPassQC(10);
      setQcStatusMessage(
        `QC Complete: ${report.passRate}% Pass Rate (${report.passedChecks}/${report.totalChecks} checks across ${report.testedTeams.length} random teams)`
      );
      setTimeout(() => setQcStatusMessage(null), 8000);
    } catch (e: any) {
      setQcStatusMessage(`QC Error: ${e.message}`);
    } finally {
      setIsRunningControllerQc(false);
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
            onClick={() => window.open(window.location.href.split('#')[0] + '?driven=true#dashboard', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer"
            title="Open a dedicated Driven Display screen in a new window/tab for the pit TV"
          >
            <ExternalLink size={13} />
            Launch Driven Screen
          </button>
          <button
            onClick={() => Actions.toggleDrivenScreen()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              isDrivenScreen
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title="Toggle whether this screen is also driven by remote controller commands"
          >
            <Tv size={13} />
            {isDrivenScreen ? 'This Screen: Driven (ON)' : 'Make This Screen Driven'}
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
              Display Screen Director (Control Driven Pit Screen)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">Driven Screen Showing:</span>
            <span className="font-mono font-bold text-blue-400 px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 uppercase">
              {remoteTargetTab || 'dashboard'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs text-blue-200">
          <div className="flex items-center gap-2">
            <Radio size={14} className="text-blue-400 animate-pulse shrink-0" />
            <span>
              <strong>Independent Controller Active:</strong> Pressing any view below targets and changes your <strong>Driven Screen</strong> while this Controller remains open.
            </span>
          </div>
          <button
            onClick={() => window.open(window.location.href.split('#')[0] + '?driven=true#dashboard', '_blank')}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 underline shrink-0 cursor-pointer"
          >
            <ExternalLink size={12} />
            Launch Driven Screen in New Window
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {displayPages.map((page) => {
            const isActiveOnDriven = (remoteTargetTab || 'dashboard') === page.id;
            return (
              <button
                key={page.id}
                onClick={() => handleSwitchDisplayPage(page.id)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all group cursor-pointer ${
                  isActiveOnDriven
                    ? 'border-blue-500 bg-blue-500/15 shadow-md ring-1 ring-blue-500/40'
                    : 'border-zinc-800 bg-black/40 hover:border-zinc-700 hover:bg-black/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{page.icon}</span>
                  {isActiveOnDriven ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500 text-white">
                      ACTIVE ON DRIVEN SCREEN
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-blue-300">
                      Drive Screen →
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

      {/* SECTION: Simulated Competition & Quality Control Deck */}
      <div
        className="rounded-2xl p-5 border shadow-sm space-y-4"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Simulated Competition & Quality Controls
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    demoMode?.enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {demoMode?.enabled ? 'SIMULATOR ACTIVE' : 'LIVE DATA MODE'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Run randomized quality control sweeps and step through live competition states for any FRC team.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRunQcInController}
              disabled={isRunningControllerQc}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              <BarChart3 size={13} className={isRunningControllerQc ? 'animate-spin' : ''} />
              <span>{isRunningControllerQc ? 'Testing Passes...' : 'Run 10-Pass QC Suite'}</span>
            </button>
            {demoMode?.enabled ? (
              <button
                onClick={() => Actions.disableDemoMode()}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
              >
                <RotateCcw size={13} />
                <span>Disable Sim</span>
              </button>
            ) : (
              <button
                onClick={() => Actions.enableDemoMode(teamInfo.number || 1002, activeEvent?.key || '2026gacmp', 0)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Play size={13} />
                <span>Enable Sim</span>
              </button>
            )}
          </div>
        </div>

        {qcStatusMessage && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-2 text-xs font-mono text-blue-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              <span>{qcStatusMessage}</span>
            </div>
            <button
              onClick={() => setQcStatusMessage(null)}
              className="text-zinc-400 hover:text-white cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Quick Simulation Stepper */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Competition Match Progression
              </div>
              <div className="text-[11px] text-zinc-400 font-sans">
                Advance tournament matches to complete queued matches and recompute standings.
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => Actions.advanceSimulatedCompetition()}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Play size={12} />
                <span>Next Match Step</span>
              </button>
              <button
                onClick={() => Actions.resetSimulatedCompetition()}
                className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs cursor-pointer"
                title="Reset simulation to initial step"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Random Team Selector */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Random Team Cohort Test
              </div>
              <div className="text-[11px] text-zinc-400 font-sans">
                Instantly swap active simulation to an authentic randomized FRC team.
              </div>
            </div>
            <button
              onClick={() => {
                const randoms = getRandomQcTeams(1);
                if (randoms.length > 0) {
                  Actions.enableDemoMode(randoms[0], activeEvent?.key || '2026gacmp', 0);
                  setSimTeamInput(String(randoms[0]));
                }
              }}
              className="w-full py-2 rounded-lg bg-purple-900/50 hover:bg-purple-900/70 text-purple-200 border border-purple-800/60 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Shuffle size={12} className="text-purple-400" />
              <span>Pick Random Team & Simulate</span>
            </button>
          </div>

          {/* Direct Team Number Switcher */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                Custom Team Simulator
              </div>
              <div className="text-[11px] text-zinc-400 font-sans">
                Specify any FRC number (e.g. 254, 1678, 1771, 1002) to verify full telemetry.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Team #"
                value={simTeamInput}
                onChange={(e) => setSimTeamInput(e.target.value)}
                className="w-24 px-2.5 py-1.5 rounded-lg bg-black/60 border border-zinc-800 text-white text-xs font-mono outline-hidden focus:border-zinc-600"
              />
              <button
                onClick={() => {
                  const num = Number(simTeamInput);
                  if (num > 0) {
                    Actions.enableDemoMode(num, activeEvent?.key || '2026gacmp', 0);
                  }
                }}
                className="flex-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer border border-zinc-700"
              >
                Apply Team
              </button>
            </div>
          </div>
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
                  ref={previewIframeRef}
                  onLoad={() => {
                    if (videoReplay.playbackRate && videoReplay.playbackRate !== 1.0) {
                      sendIframeMessage('setPlaybackRate', [videoReplay.playbackRate]);
                    }
                  }}
                  src={`https://www.youtube.com/embed/${videoReplay.youtubeId}?autoplay=${
                    videoReplay.isPlaying ? 1 : 0
                  }&start=${Math.floor(videoReplay.currentTime)}&rel=0&enablejsapi=1&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
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
                  onClick={() => {
                    Actions.sendVideoCommand('rate', rate);
                    sendIframeMessage('setPlaybackRate', [rate]);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    videoReplay.playbackRate === rate
                      ? 'bg-emerald-500 text-black font-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                  title={`Set video analysis speed to ${rate}x`}
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
            <div className="flex items-center gap-1.5 flex-wrap">
              {['2026gadal', '2026joh', '2026tuis', '2026wabon', '2026cacv', '2026gacmp'].map((key) => (
                <button
                  key={key}
                  onClick={() => setCustomEventKey(key)}
                  className={`px-2 py-1 rounded text-xs font-mono transition-colors ${
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

        {/* Pulse State Simulator Controller */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 space-y-2 font-mono">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                pulseMode === 'NO_MATCHES' ? 'bg-emerald-400' :
                pulseMode === 'NOW_QUEUING' ? 'bg-amber-400 animate-pulse' :
                pulseMode === 'ON_DECK' ? 'bg-orange-500 animate-pulse' :
                'bg-blue-400'
              }`} />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Pulse State Simulator:
              </span>
              <span className="text-[11px] text-zinc-400">
                (Updates all pages, displays & top navigation pill in real-time)
              </span>
            </div>
            <span className="text-xs font-bold text-amber-400 tabular-nums">
              {pulseMode === 'NO_MATCHES' ? 'Done' : `${Math.floor(countdownSeconds / 60)}m ${countdownSeconds % 60 < 10 ? '0' : ''}${countdownSeconds % 60}s`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs font-bold text-center">
            {(
              [
                { id: 'AUTO', label: 'Auto (Countdown)', bg: 'bg-blue-600' },
                { id: 'QUEUE_5MIN', label: 'Queue 5m', bg: 'bg-amber-600' },
                { id: 'ON_DECK', label: 'On Deck (2m)', bg: 'bg-orange-600' },
                { id: 'NOW_QUEUING', label: 'Now Queuing (30s)', bg: 'bg-rose-600' },
                { id: 'NO_MATCHES', label: 'Matches Done', bg: 'bg-emerald-600' },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => Actions.setPulseSimulatorState(item.id)}
                className={`px-2 py-2 rounded-lg transition-all cursor-pointer truncate ${
                  pulseMode === item.id
                    ? `${item.bg} text-white shadow-md ring-1 ring-white/30`
                    : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                }`}
              >
                {item.label}
              </button>
            ))}
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
            Available Match Replays for Team {teamInfo.number}:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {matches.map((m) => {
              const hasVideo = m.videos && m.videos.length > 0;
              const isSelected = videoReplay.activeMatchKey === m.key;
              const isBlue = m.blueAlliance.teams.includes(teamInfo.number);
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
                Actions.pingService('match13');
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
                The Blue Alliance API v3
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                {telemetry.tba.status}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono truncate">
              https://www.thebluealliance.com/api/v3
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
                Ping TBA Service
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
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                telemetry.nexus.status === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : telemetry.nexus.status === 'RECENT'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}>
                {telemetry.nexus.status} {telemetry.nexus.httpStatus ? `(${telemetry.nexus.httpStatus})` : ''}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono truncate">
              https://frc.nexus/api/v1/event
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500">Live Status:</span>
              <span className="font-mono text-zinc-300 font-bold">
                {telemetry.nexus.errorMessage ? 'Key Required / Error' : 'Ready'}
              </span>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => Actions.pingService('nexus')}
                className="flex-1 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                Ping Nexus
              </button>
              <button
                onClick={() => Actions.syncNexusData()}
                className="flex-1 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-[11px] font-bold text-emerald-300 transition-colors cursor-pointer"
              >
                Sync Queue
              </button>
            </div>
          </div>

          {/* Match 13 Telemetry */}
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-200">
                <ShieldCheck size={14} className="text-emerald-400" />
                Match 13 System Engine
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                telemetry.match13?.status === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : telemetry.match13?.status === 'RECENT'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-zinc-700/40 text-zinc-300 border-zinc-700'
              }`}>
                {telemetry.match13?.status || 'LIVE'}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono truncate">
              https://api.match13.com
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500">xP Ratings & Forecasts:</span>
              <span className="font-mono text-zinc-300 font-bold">Active Proxy</span>
            </div>
            <div className="pt-2">
              <button
                onClick={() => Actions.pingService('match13')}
                className="w-full py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-semibold text-zinc-200 transition-colors cursor-pointer"
              >
                Ping Match 13 Service
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
                          : log.service === 'MATCH13' || log.service === 'STATBOTICS'
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
