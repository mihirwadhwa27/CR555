/**
 * Tool & Equipment Lending Ledger (Modular Framework)
 * 
 * Features:
 * - Modular framework with customizable heights and widths
 * - Active equipment loans tracking with 1-click return
 * - Fast loan entry form
 * - Returned equipment history log
 * - Hover team name tooltips
 */

import React, { useState } from 'react';
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { ToolRecordModel } from '../types';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  {
    id: 'active_loans',
    title: 'Active Equipment Loans',
    colSpan: 'two-thirds',
    order: 0,
    visible: true,
  },
  {
    id: 'new_loan',
    title: 'New Equipment Loan',
    colSpan: 'third',
    order: 1,
    visible: true,
  },
  {
    id: 'history_log',
    title: 'Returned Ledger History',
    colSpan: 'full',
    heightMultiplier: 1,
    order: 2,
    visible: true,
  },
];

export const ToolsView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const toolLoans = usePitState(Selectors.toolLoans);

  const [searchQuery, setSearchQuery] = useState('');
  const [toolName, setToolName] = useState('');
  const [borrowerTeam, setBorrowerTeam] = useState<number | ''>('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [notes, setNotes] = useState('');

  const {
    segments,
    isCustomizing,
    setIsCustomizing,
    reorderSegments,
    setSegmentColSpan,
    setSegmentHeightMultiplier,
    toggleSegmentCollapse,
    toggleSegmentVisibility,
    resetToDefault,
    applyPreset,
  } = useModularLayout('tools_ledger', DEFAULT_SEGMENTS);

  const activeLoans = toolLoans.filter((t) => t.status === 'BORROWED');
  const returnedLoans = toolLoans.filter((t) => t.status === 'RETURNED');

  const filteredActive = activeLoans.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.name.toLowerCase().includes(q) ||
      t.borrowerTeamNumber.toString().includes(q) ||
      t.borrowerContact.toLowerCase().includes(q)
    );
  });

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim() || !borrowerTeam) return;

    Actions.addToolLoan({
      name: toolName.trim(),
      borrowerTeamNumber: Number(borrowerTeam),
      borrowerContact: borrowerContact.trim() || 'Drive Team Member',
      notes: notes.trim() || undefined,
    });

    setToolName('');
    setBorrowerTeam('');
    setBorrowerContact('');
    setNotes('');
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const renderSegmentContent = (segId: string) => {
    switch (segId) {
      case 'active_loans':
        return (
          <div
            className="w-full h-full rounded-2xl border p-4 shadow-xs flex flex-col overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Header Filter Bar */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                  Borrowed Items ({filteredActive.length})
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {activeLoans.length} OUT
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative w-48 sm:w-64">
                <Search size={12} className="absolute left-2.5 top-2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filter tool, team, contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-7 pr-2.5 py-1 rounded-lg bg-black/40 border border-zinc-800 text-zinc-200 text-xs outline-hidden focus:border-zinc-600"
                />
              </div>
            </div>

            {/* Active Loans List */}
            <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-2 no-scrollbar">
              {filteredActive.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                  <Wrench size={24} className="opacity-40" />
                  <span>No active tools checked out</span>
                </div>
              ) : (
                filteredActive.map((loan) => (
                  <div
                    key={loan.id}
                    className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{loan.name}</span>
                        <TeamBadge teamNumber={loan.borrowerTeamNumber} />
                        <span className="text-zinc-400">({loan.borrowerContact})</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-amber-400" />
                          <span>{formatRelativeTime(loan.borrowedAt)}</span>
                        </span>
                        {loan.notes && (
                          <span className="text-zinc-400 italic">“{loan.notes}”</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => Actions.returnToolLoan(loan.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 size={13} />
                        <span>Mark Returned</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'new_loan':
        return (
          <div
            className="w-full h-full rounded-2xl border p-4 shadow-xs flex flex-col justify-between overflow-y-auto no-scrollbar text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <form onSubmit={handleCreateLoan} className="space-y-3">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-bold">Equipment / Tool Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rivet Gun, 1/2 Hex Shaft..."
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-zinc-800 text-white outline-hidden focus:border-zinc-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-bold">Borrower Team #</label>
                  <input
                    type="number"
                    placeholder="e.g. 1771"
                    value={borrowerTeam}
                    onChange={(e) => setBorrowerTeam(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-zinc-800 text-white outline-hidden focus:border-zinc-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-bold">Contact / Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Drive Coach, Pit Lead"
                    value={borrowerContact}
                    onChange={(e) => setBorrowerContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-zinc-800 text-white outline-hidden focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1 uppercase font-bold">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Needed for Qual 45"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/50 border border-zinc-800 text-white outline-hidden focus:border-zinc-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer mt-2 shadow-md"
              >
                Log Loan Entry
              </button>
            </form>
          </div>
        );

      case 'history_log':
        return (
          <div
            className="w-full h-full rounded-2xl border p-4 shadow-xs flex flex-col overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
              <span className="font-bold text-white text-[11px] uppercase tracking-wider">
                Returned Ledger History ({returnedLoans.length})
              </span>
              <span className="text-zinc-400 text-[10px]">{returnedLoans.length} Records</span>
            </div>

            <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-1.5 no-scrollbar">
              {returnedLoans.length === 0 ? (
                <div className="h-full flex items-center justify-center text-zinc-500">
                  No returned logs yet.
                </div>
              ) : (
                returnedLoans.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 rounded-lg bg-black/30 border border-zinc-800/80 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓ Returned</span>
                      <span className="text-white font-semibold">{t.name}</span>
                      <TeamBadge teamNumber={t.borrowerTeamNumber} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 text-[10px]">
                        {t.returnedAt ? formatRelativeTime(t.returnedAt) : 'Returned'}
                      </span>
                      <button
                        onClick={() => Actions.deleteToolLoan(t.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer p-0.5"
                        title="Delete log"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const visibleSegments = segments.filter((s) => s.visible);

  return (
    <div id="tools-view" className="space-y-2 animate-fade-in pb-8">
      {/* View Header */}
      <div
        className="rounded-2xl p-4 border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Wrench size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Pit Resource & Tool Ledger</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                ACTIVE
              </span>
            </div>
            <div className="text-zinc-400 text-xs font-mono mt-0.5">
              Live tracking for tools loaned to other FRC pit teams
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-zinc-800 text-[11px] text-zinc-300">
            <span className="text-zinc-500 mr-1.5">Active Loans:</span>
            <span className="text-amber-400 font-bold">{activeLoans.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-zinc-800 text-[11px] text-zinc-300">
            <span className="text-zinc-500 mr-1.5">Returned:</span>
            <span className="text-emerald-400 font-bold">{returnedLoans.length}</span>
          </div>
        </div>
      </div>

      {/* Modular Layout Bar */}
      <ModularLayoutToolbar
        viewName="Tool Ledger"
        isCustomizing={isCustomizing}
        onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
        segments={segments}
        onToggleVisibility={toggleSegmentVisibility}
        onResetToDefault={resetToDefault}
        onApplyPreset={applyPreset}
      />

      {/* Grid with Dense Auto-Flow for Multidimensional Stacking */}
      <div
        className="grid grid-cols-12 gap-2 sm:gap-3 items-stretch"
        style={{
          gridAutoFlow: 'dense',
          gridAutoRows: 'minmax(185px, auto)',
        }}
      >
        {visibleSegments.map((seg) => (
          <ModularSegment
            key={seg.id}
            id={seg.id}
            title={seg.title}
            colSpan={seg.colSpan}
            heightMultiplier={seg.heightMultiplier}
            collapsed={seg.collapsed}
            isCustomizing={isCustomizing}
            onReorder={reorderSegments}
            onChangeColSpan={(span) => setSegmentColSpan(seg.id, span)}
            onChangeHeightMultiplier={(m) => setSegmentHeightMultiplier(seg.id, m)}
            onToggleCollapse={() => toggleSegmentCollapse(seg.id)}
            onToggleVisibility={() => toggleSegmentVisibility(seg.id)}
          >
            {renderSegmentContent(seg.id)}
          </ModularSegment>
        ))}
      </div>
    </div>
  );
};
