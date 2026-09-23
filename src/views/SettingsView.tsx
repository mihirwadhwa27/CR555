import React, { useState } from 'react';
import { Settings, Key, Globe, Shield, Database, RotateCcw, Check } from 'lucide-react';
import { usePitState, pitStore, Selectors, Actions } from '../store';
import { StorageService } from '../services';

export const SettingsView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const teamInfo = usePitState(Selectors.teamInfo);
  const config = usePitState((s) => s.config);
  const [clearedNotice, setClearedNotice] = useState(false);

  const handleUpdateApiKey = (key: string) => {
    pitStore.setState((s) => ({
      ...s,
      config: {
        ...s.config,
        tbaApiKey: key,
      },
    }));
  };

  const handleClearCache = () => {
    StorageService.purgeCacheEntries();
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 2500);
  };

  return (
    <div
      id="settings-view"
      className="rounded-2xl p-6 border shadow-sm space-y-6"
      style={{
        backgroundColor: theme.tokens.secondary,
        borderColor: theme.tokens.border,
      }}
    >
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Settings size={22} style={{ color: theme.tokens.foreground }} />
          <h2 className="text-xl font-bold text-white">System Settings & API Configuration</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Keys Configuration */}
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2 text-zinc-200 font-semibold text-sm">
            <Key size={16} style={{ color: theme.tokens.foreground }} />
            The Blue Alliance (TBA) API Key
          </div>
          <p className="text-xs text-zinc-400">
            Shipped with default Team 1002 read-only key. You can input an operator override below.
          </p>

          <input
            id="tba-api-key-input"
            type="password"
            value={config.tbaApiKey}
            onChange={(e) => handleUpdateApiKey(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden"
            placeholder="TBA v3 API Key"
          />
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              {clearedNotice ? <Check size={13} className="text-emerald-400" /> : <RotateCcw size={13} />}
              {clearedNotice ? 'Cache Cleared!' : 'Clear API Cache'}
            </button>
            <button
              onClick={() => Actions.setThemeModalOpen(true)}
              className="px-3 py-2 rounded-lg text-xs font-semibold border transition-all"
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
