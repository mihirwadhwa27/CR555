import React from 'react';
import { Eye, Lock, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { usePitState, Selectors, Actions } from '../store';

export const ScoutView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const teamInfo = usePitState(Selectors.teamInfo);

  return (
    <div
      id="scout-view"
      className="rounded-2xl p-6 border shadow-sm space-y-6"
      style={{
        backgroundColor: theme.tokens.secondary,
        borderColor: theme.tokens.border,
      }}
    >
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Eye size={22} style={{ color: theme.tokens.foreground }} />
          <div>
            <h2 className="text-xl font-bold text-white">Private Strategy & Scouting Console</h2>
            <p className="text-xs text-zinc-400">Team 1002 Strategy Leads & Drive Coaches</p>
          </div>
        </div>

        <button
          onClick={() => Actions.lockStrategy()}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors"
        >
          <Lock size={13} />
          Lock & Return to Dashboard
        </button>
      </div>

      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center gap-2">
        <ShieldCheck size={16} className="text-amber-400 shrink-0" />
        <span>
          Unlocked under FIRST Gracious Professionalism. Close or lock this tab when finished reviewing match notes.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-zinc-200">Team Classifications (Internal)</h3>
          <p className="text-xs text-zinc-400">
            Internal labels for alliance selection & strategy tracking:
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded bg-red-950/80 border border-red-800 text-red-300 font-semibold">
              DIRECT COMPETITOR
            </span>
            <span className="px-2.5 py-1 rounded bg-amber-950/80 border border-amber-800 text-amber-300 font-semibold">
              BUBBLE TEAM
            </span>
            <span className="px-2.5 py-1 rounded bg-orange-950/80 border border-orange-800 text-orange-300 font-semibold">
              THREAT
            </span>
            <span className="px-2.5 py-1 rounded bg-blue-950/80 border border-blue-800 text-blue-300 font-semibold">
              WATCH
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
          <h3 className="text-sm font-bold text-zinc-200">Match Watchlists & Contact Logs</h3>
          <p className="text-xs text-zinc-400">
            Enables human-directed tracking of tiebreaker matches and strategy coordinator conversations.
          </p>
          <div className="text-xs text-zinc-400 space-y-1">
            <div>• Human-controlled communication status (Not Contacted, Contacted, Follow-up).</div>
            <div>• Fully persisted in local storage across browser reloads.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
