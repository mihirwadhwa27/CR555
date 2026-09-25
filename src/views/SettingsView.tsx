import React, { useState, useRef } from 'react';
import {
  Settings,
  Key,
  Globe,
  Shield,
  Database,
  RotateCcw,
  Check,
  Sparkles,
  SlidersHorizontal,
  Upload,
  Image,
  Link,
  Trash2,
  Layers,
  MapPin,
  Radio,
  ExternalLink,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { usePitState, pitStore, Selectors, Actions } from '../store';
import { StorageService, STORAGE_KEYS } from '../services';
import { CrLogo } from '../components/CrLogo';

export const SettingsView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const teamInfo = usePitState(Selectors.teamInfo);
  const activeEvent = usePitState(Selectors.activeEvent);
  const config = usePitState((s) => s.config);
  const telemetry = usePitState((s) => s.telemetry);
  const customLogoUrl = usePitState(Selectors.customLogoUrl);
  const demoMode = usePitState(Selectors.demoMode);

  const [clearedNotice, setClearedNotice] = useState(false);
  const [logoInputUrl, setLogoInputUrl] = useState(customLogoUrl || '');
  const [logoSuccessNotice, setLogoSuccessNotice] = useState(false);
  const [isPingingNexus, setIsPingingNexus] = useState(false);
  const [nexusPingResult, setNexusPingResult] = useState<any>(null);
  const [isSyncingNexus, setIsSyncingNexus] = useState(false);
  const [nexusSyncResult, setNexusSyncResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateApiKey = (key: string) => {
    pitStore.setState((s) => {
      const next = { ...s.config, tbaApiKey: key.trim() };
      StorageService.set(STORAGE_KEYS.CONFIG, next);
      return { ...s, config: next };
    });
  };

  const handleUpdateNexusApiKey = (key: string) => {
    Actions.setNexusApiKey(key);
  };

  const handleUpdateNexusEventKey = (evKey: string) => {
    Actions.setNexusManualEventKey(evKey);
  };

  const handleTestNexus = async () => {
    setIsPingingNexus(true);
    setNexusPingResult(null);
    try {
      const res = await Actions.pingService('nexus');
      setNexusPingResult(res);
    } finally {
      setIsPingingNexus(false);
    }
  };

  const handleSyncNexusNow = async () => {
    setIsSyncingNexus(true);
    setNexusSyncResult(null);
    try {
      const res = await Actions.syncNexusData();
      if (res.success) {
        setNexusSyncResult(`Synced successfully! Now Queuing: ${res.data?.nowQueuing || 'Standby'}`);
      } else {
        setNexusSyncResult(`Sync failed: ${res.error || 'Check key and event'}`);
      }
    } finally {
      setIsSyncingNexus(false);
      setTimeout(() => setNexusSyncResult(null), 5000);
    }
  };

  const handleClearCache = () => {
    StorageService.purgeCacheEntries();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  const handleSaveLogoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    Actions.setCustomLogoUrl(logoInputUrl.trim());
    setLogoSuccessNotice(true);
    setTimeout(() => setLogoSuccessNotice(false), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (result) {
        setLogoInputUrl(result);
        Actions.setCustomLogoUrl(result);
        setLogoSuccessNotice(true);
        setTimeout(() => setLogoSuccessNotice(false), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogo = () => {
    setLogoInputUrl('');
    Actions.setCustomLogoUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      id="settings-view"
      className="rounded-2xl p-6 border shadow-sm space-y-6 max-w-[1400px] mx-auto"
      style={{
        backgroundColor: theme.tokens.secondary,
        borderColor: theme.tokens.border,
      }}
    >
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <CrLogo size={28} customUrl={customLogoUrl} accentColor={theme.tokens.accent || '#fbbf24'} />
          <div>
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <span>CR555 Settings & Team Branding</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                555 Timer Edition
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Team 1002 CircuitRunners Pit Display Configuration</p>
          </div>
        </div>

        <button
          onClick={() => Actions.setSetupModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-colors cursor-pointer"
        >
          <SlidersHorizontal size={14} />
          <span>Launch Setup Wizard</span>
        </button>
      </div>

      {/* CR555 Team Branding & Custom Logo Management */}
      <div className="p-5 rounded-xl bg-black/50 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Image size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>CircuitRunners Official Logo (CR)</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {customLogoUrl ? 'Custom Image Active' : 'Default 555 IC Chip Active'}
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Use our built-in 555 timer chip vector emblem or upload/link your official CircuitRunners graphic.
              </p>
            </div>
          </div>

          {customLogoUrl && (
            <button
              onClick={handleResetLogo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition-colors cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Reset to 555 IC Vector</span>
            </button>
          )}
        </div>

        {/* Live Logo Preview Across Sizes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
              Active CR Logo Preview
            </span>
            <div className="p-4 rounded-2xl bg-black/60 border border-zinc-700/80 flex items-center justify-center min-h-[90px] min-w-[90px] shadow-inner">
              <CrLogo size={64} customUrl={customLogoUrl} accentColor={theme.tokens.accent || '#fbbf24'} />
            </div>
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-1">
                <CrLogo size={24} customUrl={customLogoUrl} accentColor={theme.tokens.accent || '#fbbf24'} />
                <span>24px</span>
              </div>
              <div className="flex items-center gap-1">
                <CrLogo size={32} customUrl={customLogoUrl} accentColor={theme.tokens.accent || '#fbbf24'} />
                <span>32px</span>
              </div>
              <div className="flex items-center gap-1">
                <CrLogo size={44} customUrl={customLogoUrl} accentColor={theme.tokens.accent || '#fbbf24'} />
                <span>44px</span>
              </div>
            </div>
          </div>

          {/* Upload or Link Form */}
          <div className="lg:col-span-2 space-y-3">
            <form onSubmit={handleSaveLogoUrl} className="space-y-2">
              <label className="text-xs font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Link size={13} className="text-amber-400" />
                <span>Custom Logo URL (PNG, SVG, WebP, or Data URL)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={logoInputUrl}
                  onChange={(e) => setLogoInputUrl(e.target.value)}
                  placeholder="https://circuitrunners.com/assets/logo.png"
                  className="flex-1 px-3 py-2 rounded-lg bg-black border border-zinc-700 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:border-amber-400 outline-hidden"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-colors cursor-pointer shrink-0"
                >
                  Save URL
                </button>
              </div>
            </form>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="cr-logo-file-input"
              />
              <label
                htmlFor="cr-logo-file-input"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
              >
                <Upload size={13} className="text-amber-400" />
                <span>Upload Logo File from Device</span>
              </label>

              {logoSuccessNotice && (
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                  <Check size={14} />
                  <span>Logo saved and applied across CR555!</span>
                </span>
              )}
            </div>

            {/* Where the CR Logo appears in CR555 */}
            <div className="mt-3 p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 space-y-1.5">
              <span className="text-zinc-200 font-bold uppercase tracking-wider flex items-center gap-1">
                <Layers size={12} className="text-amber-400" />
                <span>Where the CR Logo Appears Across CR555:</span>
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-zinc-400 pt-1">
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Top Navigation Bar:</strong> Left header brand beside "CR555"</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Next Match Scouting:</strong> Beside match header & Team 1002 badge</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Division Rankings:</strong> Next to Team 1002 row in rankings table</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Setup Wizard Modal:</strong> Station configuration banner</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>System Footer:</strong> Bottom live event status indicator</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Browser Favicon:</strong> 555 timer SVG chip tab icon</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Pulse Pit Setup Status Banner */}
      <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Active Pit Station Profile</h3>
            {demoMode?.enabled && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Demo Mode Active: Day 2 • 11:30 AM
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Configured for <strong>Team {teamInfo.number} {teamInfo.name}</strong> at <strong>{activeEvent?.name || config.selectedEventKey}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {demoMode?.enabled ? (
            <button
              onClick={() => Actions.disableDemoMode()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer"
            >
              Exit Demo
            </button>
          ) : (
            <button
              onClick={() => Actions.enableDemoMode()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
            >
              <Sparkles size={13} />
              <span>Enable 1002 Day 2 Demo</span>
            </button>
          )}
          <button
            onClick={() => Actions.setSetupModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700 hover:border-zinc-500 text-zinc-200 transition-colors cursor-pointer"
          >
            Reconfigure
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Blue Alliance (TBA) Configuration */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
              <Key size={16} style={{ color: theme.tokens.foreground }} />
              The Blue Alliance (TBA) API Key
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
              Status: {telemetry.tba.status}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Shipped with default Team {teamInfo.number} key. You can input an operator override below.
          </p>

          <input
            id="tba-api-key-input"
            type="password"
            value={config.tbaApiKey}
            onChange={(e) => handleUpdateApiKey(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden focus:border-amber-400"
            placeholder="TBA v3 API Key"
          />
        </div>

        {/* FRC Nexus (Queuing, Announcements & Parts Requests) */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
              <Radio size={16} className="text-emerald-400" />
              FRC Nexus (Live Queuing & Pits)
            </div>
            <a
              href="https://frc.nexus/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
            >
              <span>frc.nexus/api</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <p className="text-xs text-zinc-400">
            Enables real-time match queuing status, official event announcements, and parts requests from FRC Nexus.
          </p>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">Nexus-Api-Key (Pull):</label>
              <input
                id="nexus-api-key-input"
                type="password"
                value={config.nexusApiKey || ''}
                onChange={(e) => handleUpdateNexusApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden focus:border-amber-400"
                placeholder="Enter Nexus-Api-Key (from frc.nexus/api)"
              />
            </div>

            {/* Nexus Push Webhook Config */}
            <div className="pt-1 pb-1 border-t border-b border-zinc-800/80 my-2 space-y-2">
              <div className="text-[11px] font-bold text-amber-400 font-mono flex items-center justify-between">
                <span>Nexus Push (Webhook Receiver):</span>
                <span className="text-[10px] text-zinc-500 font-normal">Instant field updates</span>
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">Your Webhook URL (Paste into frc.nexus/api):</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/api/nexus/webhook`}
                    className="w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-mono bg-black/60 border-zinc-700 text-amber-300 select-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-mono text-zinc-400 block mb-0.5">Nexus-Token (Push Verification Secret from frc.nexus):</label>
                <input
                  id="nexus-webhook-token-input"
                  type="password"
                  value={config.nexusWebhookToken || ''}
                  onChange={(e) => Actions.setNexusWebhookToken(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden focus:border-amber-400"
                  placeholder="Paste Nexus-Token from frc.nexus/api webhooks"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-zinc-400 block mb-1">
                Nexus Event Key (Defaults to {activeEvent?.key || config.selectedEventKey || 'demo1234'}):
              </label>
              <input
                id="nexus-event-key-input"
                type="text"
                value={config.nexusManualEventKey || ''}
                onChange={(e) => handleUpdateNexusEventKey(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden focus:border-amber-400"
                placeholder="e.g. 2024casf or demo1234"
              />
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleTestNexus}
                disabled={isPingingNexus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors cursor-pointer"
              >
                <Activity size={13} className={isPingingNexus ? 'animate-spin text-amber-400' : 'text-emerald-400'} />
                <span>{isPingingNexus ? 'Testing Ping...' : 'Test Connection'}</span>
              </button>

              <button
                type="button"
                onClick={handleSyncNexusNow}
                disabled={isSyncingNexus}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-colors cursor-pointer"
              >
                <Radio size={13} className={isSyncingNexus ? 'animate-pulse' : ''} />
                <span>{isSyncingNexus ? 'Syncing...' : 'Sync Queuing Now'}</span>
              </button>
            </div>

            {/* Test or Sync Feedback */}
            {nexusPingResult && (
              <div
                className={`p-2.5 rounded-lg text-xs font-mono flex items-start gap-2 border ${
                  nexusPingResult.status === 200
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : nexusPingResult.status === 401
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                    : 'bg-red-950/40 border-red-500/40 text-red-300'
                }`}
              >
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold">
                    HTTP {nexusPingResult.status} ({nexusPingResult.latencyMs}ms)
                  </div>
                  <div className="text-[11px] opacity-90">{nexusPingResult.message}</div>
                </div>
              </div>
            )}

            {nexusSyncResult && (
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200">
                {nexusSyncResult}
              </div>
            )}
          </div>
        </div>

        {/* Storage & Diagnostics */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
            <Database size={16} style={{ color: theme.tokens.foreground }} />
            Local Cache & Storage
          </div>
          <p className="text-xs text-zinc-400">
            Manage browser-side storage and cached payloads for offline resilience.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleClearCache}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              {clearedNotice ? <Check size={13} className="text-emerald-400" /> : <RotateCcw size={13} />}
              {clearedNotice ? 'Cache Cleared!' : 'Clear API Cache'}
            </button>
            <button
              onClick={() => Actions.setThemeModalOpen(true)}
              className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
              style={{
                borderColor: theme.tokens.border,
                color: theme.tokens.foreground,
              }}
            >
              Open Theme Editor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
