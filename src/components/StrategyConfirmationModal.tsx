/**
 * Strategy Tab Confirmation Modal
 * Built in the spirit of FIRST Gracious Professionalism:
 * Simple operator confirmation before showing private strategy on public pit monitors.
 */

import React from 'react';
import { ShieldAlert, CheckCircle, ArrowLeft } from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';

export const StrategyConfirmationModal: React.FC = () => {
  const isOpen = usePitState(Selectors.isStrategyModalOpen);
  const theme = usePitState(Selectors.themeConfig);

  if (!isOpen) return null;

  return (
    <div
      id="strategy-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <div
        id="strategy-modal-card"
        className="w-full max-w-md rounded-2xl p-6 shadow-2xl transition-all"
        style={{
          backgroundColor: '#161a22',
          border: '1px solid #30363d',
          color: theme.tokens.foreground,
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert size={26} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-100">Private Strategy Notice</h3>
            <p className="text-xs text-zinc-400">Team 1002 Operational Guard</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 leading-relaxed mb-6">
          This section contains Team 1002 internal match watchlists, team classifications, and
          scouting notes. Confirm you wish to display strategic notes on this screen.
        </p>

        <div className="flex items-center justify-end gap-3">
          <button
            id="cancel-strategy-btn"
            onClick={() => Actions.setStrategyModalOpen(false)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft size={14} />
            Cancel
          </button>
          <button
            id="confirm-strategy-btn"
            onClick={() => Actions.confirmStrategyAccess()}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg shadow-md transition-all hover:brightness-110 active:scale-95"
            style={{
              backgroundColor: theme.tokens.foreground,
              color: '#101010',
            }}
          >
            <CheckCircle size={14} />
            Display Strategy
          </button>
        </div>
      </div>
    </div>
  );
};
