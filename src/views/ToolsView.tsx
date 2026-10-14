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

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldCheck,
  Activity,
  Play,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Zap,
  Cpu,
  Shuffle,
  RefreshCw,
  Award,
  XCircle,
  AlertTriangle,
  BarChart3,
  Layers,
  ArrowRight,
  Sliders,
  Tv,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { ToolRecordModel } from '../types';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';
import { TeamBadge } from '../components/TeamBadge';
import {
  QualityControlService,
  QualityControlReport,
  QualityControlPassResult,
  getRandomQcTeams,
} from '../services/qualityControl';

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  {
    id: 'qc_lab',
    title: 'Quality Control & Simulation Lab',
    colSpan: 'full',
    heightMultiplier: 1.5,
    order: 0,
    visible: true,
  },
  {
    id: 'active_loans',
    title: 'Active Equipment Loans',
    colSpan: 'two-thirds',
    order: 1,
    visible: true,
  },
  {
    id: 'new_loan',
    title: 'New Equipment Loan',
    colSpan: 'third',
    order: 2,
    visible: true,
  },
  {
    id: 'history_log',
    title: 'Returned Ledger History',
    colSpan: 'full',
    heightMultiplier: 1,
    order: 3,
    visible: true,
  },
];

export const ToolsView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const toolLoans = usePitState(Selectors.toolLoans);
  const demoMode = usePitState(Selectors.demoMode);
  const teamInfo = usePitState(Selectors.teamInfo);
  const activeEvent = usePitState(Selectors.activeEvent);

  const [searchQuery, setSearchQuery] = useState('');
  const [toolName, setToolName] = useState('');
  const [borrowerTeam, setBorrowerTeam] = useState<number | ''>('');
  const [borrowerContact, setBorrowerContact] = useState('');
  const [notes, setNotes] = useState('');

  // Quality Control state
  const [qcPassCount, setQcPassCount] = useState<number>(10);
  const [isRunningQc, setIsRunningQc] = useState<boolean>(false);
  const [qcProgress, setQcProgress] = useState<{ completed: number; total: number; currentTeam?: number } | null>(null);
  const [qcReport, setQcReport] = useState<QualityControlReport | null>(null);
  const [expandedPassId, setExpandedPassId] = useState<number | null>(null);
  const [qcActiveTab, setQcActiveTab] = useState<'QC_RUNNER' | 'SIMULATION_CONTROLS'>('QC_RUNNER');
  const [simTeamInput, setSimTeamInput] = useState<string>(String(teamInfo.number || 1002));

  // Initialize with a clean 5-pass run on mount so the user has immediate insights
  useEffect(() => {
    let isMounted = true;
    QualityControlService.runMultiPassQC(5).then((report) => {
      if (isMounted) {
        setQcReport(report);
        if (report.passes.length > 0) {
          setExpandedPassId(report.passes[0].passNumber);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRunMultiPassQC = async (passesToRun: number = qcPassCount) => {
    setIsRunningQc(true);
    setQcProgress({ completed: 0, total: passesToRun });
    try {
      const report = await QualityControlService.runMultiPassQC(
        passesToRun,
        undefined,
        (completed, total, currentPass) => {
          setQcProgress({ completed, total, currentTeam: currentPass.teamNumber });
        }
      );
      setQcReport(report);
      if (report.passes.length > 0) {
        setExpandedPassId(report.passes[0].passNumber);
      }
    } finally {
      setIsRunningQc(false);
      setQcProgress(null);
    }
  };

  const handleRunQuickActiveTeamQC = async () => {
    setIsRunningQc(true);
    setQcProgress({ completed: 0, total: 1 });
    try {
      const targetTeam = teamInfo.number || 1002;
      const report = await QualityControlService.runMultiPassQC(1, [targetTeam]);
      setQcReport(report);
      setExpandedPassId(1);
    } finally {
      setIsRunningQc(false);
      setQcProgress(null);
    }
  };

  const handleLoadSimTeam = (teamNum: number) => {
    Actions.enableDemoMode(teamNum, activeEvent?.key || '2026gacmp', 0);
    setSimTeamInput(String(teamNum));
  };

  const handleAdvanceSimulation = () => {
    Actions.advanceSimulatedCompetition();
  };

  const handleResetSimulation = () => {
    Actions.resetSimulatedCompetition();
  };

  const handleDisableSimulation = () => {
    Actions.disableDemoMode();
  };

  const handlePickRandomTeam = () => {
    const randoms = getRandomQcTeams(1);
    if (randoms.length > 0) {
      setSimTeamInput(String(randoms[0]));
      Actions.enableDemoMode(randoms[0], activeEvent?.key || '2026gacmp', 0);
    }
  };

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
      case 'qc_lab':
        return (
          <div
            className="w-full h-full rounded-2xl border p-4 sm:p-5 shadow-xs flex flex-col overflow-hidden text-xs font-mono"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            {/* Top Toolbar / Tab Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Competition Quality Control & Simulation Lab
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      LIVE ENGINE
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 font-sans">
                    Automated multi-pass FRC assertions with randomized team cohorts & synchronized simulation
                  </div>
                </div>
              </div>

              {/* View Mode Selector Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/40 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setQcActiveTab('QC_RUNNER')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    qcActiveTab === 'QC_RUNNER'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <BarChart3 size={13} />
                  <span>Multi-Pass QC Suite</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQcActiveTab('SIMULATION_CONTROLS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                    qcActiveTab === 'SIMULATION_CONTROLS'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sliders size={13} />
                  <span>Competition Simulator</span>
                  {demoMode?.enabled && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            {qcActiveTab === 'QC_RUNNER' ? (
              <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-4 no-scrollbar">
                {/* Control Action Bar */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider mr-1">
                      Pass Count:
                    </span>
                    {[5, 10, 20].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setQcPassCount(count)}
                        disabled={isRunningQc}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          qcPassCount === count
                            ? 'bg-zinc-800 text-white border-zinc-600'
                            : 'bg-black/30 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {count} Passes
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRunMultiPassQC(qcPassCount)}
                      disabled={isRunningQc}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                    >
                      <RefreshCw size={13} className={isRunningQc ? 'animate-spin' : ''} />
                      <span>{isRunningQc ? 'Executing Quality Controls...' : `Run ${qcPassCount} Random Team Passes`}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRunQuickActiveTeamQC}
                      disabled={isRunningQc}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                    >
                      <Zap size={13} className="text-amber-400" />
                      <span>Test Current Team ({teamInfo.number || 1002})</span>
                    </button>
                  </div>
                </div>

                {/* Progress Notification */}
                {isRunningQc && qcProgress && (
                  <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <RefreshCw size={14} className="text-blue-400 animate-spin" />
                      <span className="text-zinc-200">
                        Running pass {qcProgress.completed + 1} of {qcProgress.total}...
                        {qcProgress.currentTeam && ` Testing Team ${qcProgress.currentTeam}`}
                      </span>
                    </div>
                    <span className="text-blue-300 font-bold">
                      {Math.round(((qcProgress.completed) / qcProgress.total) * 100)}% Complete
                    </span>
                  </div>
                )}

                {/* KPI Metrics Summary Cards */}
                {qcReport && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between">
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Pass Rate
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl sm:text-2xl font-black text-emerald-400">
                          {qcReport.passRate}%
                        </span>
                        <span className="text-[10px] text-emerald-500 font-bold">
                          {qcReport.successfulPasses}/{qcReport.totalPasses} Passed
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between">
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Total Assertions
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl sm:text-2xl font-black text-white">
                          {qcReport.passedChecks}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          / {qcReport.totalChecks} checks
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between">
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Average Latency
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                          {qcReport.averagePassLatencyMs}ms
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          per pass
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-black/40 border border-zinc-800 flex flex-col justify-between">
                      <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                        Tested Cohorts
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-xl sm:text-2xl font-black text-blue-400">
                          {qcReport.testedTeams.length}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Distinct Teams
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tested Teams Pills Bar */}
                {qcReport && qcReport.testedTeams.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-black/30 border border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                      Tested Teams:
                    </span>
                    {qcReport.testedTeams.map((tNum) => (
                      <button
                        key={tNum}
                        type="button"
                        onClick={() => handleLoadSimTeam(tNum)}
                        title={`Click to load Team ${tNum} into live competition simulation`}
                        className="px-2 py-0.5 rounded-md bg-zinc-800/90 hover:bg-blue-600 text-zinc-300 hover:text-white border border-zinc-700/80 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Team {tNum}</span>
                        <ArrowRight size={10} className="opacity-50" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Pass-by-Pass Results Accordion */}
                {qcReport && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        Pass Breakdown & Assertion Verifications ({qcReport.passes.length})
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Click row to toggle check details • Click "Simulate" to apply team live
                      </span>
                    </div>

                    {qcReport.passes.map((pass) => {
                      const isExpanded = expandedPassId === pass.passNumber;
                      return (
                        <div
                          key={pass.passNumber}
                          className="rounded-xl bg-zinc-900/90 border border-zinc-800 overflow-hidden transition-all"
                        >
                          {/* Row Header */}
                          <div
                            onClick={() => setExpandedPassId(isExpanded ? null : pass.passNumber)}
                            className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-lg bg-black/50 border border-zinc-800 flex items-center justify-center font-bold text-[11px] text-zinc-400">
                                #{pass.passNumber}
                              </span>
                              <div className="flex items-center gap-2">
                                <TeamBadge teamNumber={pass.teamNumber} />
                                <span className="font-bold text-white text-xs">{pass.teamName}</span>
                                <span className="text-zinc-500 text-[11px]">({pass.teamLocation})</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <span className="text-[10px] text-zinc-500 font-mono">
                                {pass.durationMs}ms
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                                  pass.success
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                    : 'bg-red-500/15 text-red-300 border-red-500/30'
                                }`}
                              >
                                {pass.success ? (
                                  <>
                                    <CheckCircle2 size={11} />
                                    <span>{pass.passedChecks}/{pass.totalChecks} PASS</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={11} />
                                    <span>{pass.failedChecks} FAILED</span>
                                  </>
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLoadSimTeam(pass.teamNumber);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                title={`Simulate competition for Team ${pass.teamNumber}`}
                              >
                                <Play size={10} />
                                <span>Simulate</span>
                              </button>

                              <div className="text-zinc-500 p-0.5">
                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </div>
                            </div>
                          </div>

                          {/* Expanded 10 Checks Grid */}
                          {isExpanded && (
                            <div className="p-3 bg-black/40 border-t border-zinc-800 space-y-2">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {pass.checks.map((chk) => (
                                  <div
                                    key={chk.id}
                                    className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800/80 flex items-start gap-2.5 text-xs"
                                  >
                                    <div className="mt-0.5 shrink-0">
                                      {chk.passed ? (
                                        <CheckCircle2 size={14} className="text-emerald-400" />
                                      ) : (
                                        <XCircle size={14} className="text-red-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-bold text-zinc-200 text-[11px]">
                                          {chk.name}
                                        </span>
                                        <span className="text-[10px] text-zinc-500 font-mono">
                                          {chk.durationMs}ms
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-zinc-400 font-sans mt-0.5 leading-tight">
                                        {chk.message}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* SIMULATION_CONTROLS TAB */
              <div className="flex-1 overflow-y-auto my-2 pr-1 space-y-4 no-scrollbar">
                {/* Active Simulation Status Card */}
                <div
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    demoMode?.enabled
                      ? 'bg-blue-950/30 border-blue-800/60'
                      : 'bg-black/30 border-zinc-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {demoMode?.enabled ? 'Simulated Competition Active' : 'Live Real-Data Mode'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          demoMode?.enabled
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {demoMode?.enabled ? 'SIMULATOR ON' : 'STANDBY'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 font-sans">
                      {demoMode?.enabled
                        ? `Operating active simulated competition for Team ${teamInfo.number || 1002} at ${demoMode.eventKey || '2026gacmp'} (Step ${(demoMode.stepIndex ?? 0) + 1} of 3)`
                        : 'Real external API data pipeline active. Toggle simulated competition below to verify matches and queue.'}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {demoMode?.enabled ? (
                      <button
                        type="button"
                        onClick={handleDisableSimulation}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                      >
                        <RotateCcw size={13} />
                        <span>Return to Live Sync</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLoadSimTeam(teamInfo.number || 1002)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
                      >
                        <Play size={13} />
                        <span>Launch Simulation</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step Progressor & Actions Deck */}
                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">
                      Simulation State Controller
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      Current Step: #{(demoMode?.stepIndex ?? 0) + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handleAdvanceSimulation}
                      className="p-3 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                    >
                      <Play size={16} />
                      <span>Advance Competition Match</span>
                      <span className="text-[10px] font-normal opacity-80">
                        Completes queued match & progresses schedule
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetSimulation}
                      className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer border border-zinc-700"
                    >
                      <RotateCcw size={16} className="text-amber-400" />
                      <span>Reset to Step 0</span>
                      <span className="text-[10px] font-normal opacity-80">
                        Restores initial tournament schedule
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePickRandomTeam}
                      className="p-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-800/60 font-bold text-xs flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Shuffle size={16} className="text-purple-400" />
                      <span>Pick Random FRC Team</span>
                      <span className="text-[10px] font-normal opacity-80">
                        Simulate with a new random team
                      </span>
                    </button>
                  </div>
                </div>

                {/* Custom Team Number Input */}
                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                  <span className="font-bold text-white text-xs uppercase tracking-wider block">
                    Simulate Any Custom FRC Team
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="e.g. 254, 1678, 1771, 1002"
                      value={simTeamInput}
                      onChange={(e) => setSimTeamInput(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-zinc-800 text-white text-xs font-mono outline-hidden focus:border-zinc-600"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const num = Number(simTeamInput);
                        if (num > 0) handleLoadSimTeam(num);
                      }}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Simulate Team</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>

                {/* Subsystem Data Synchronization Matrix */}
                <div className="p-4 rounded-xl bg-black/40 border border-zinc-800 space-y-3">
                  <span className="font-bold text-white text-xs uppercase tracking-wider block">
                    Synchronized Subsystem Status Matrix
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {[
                      { title: 'Match Schedule & Alliances', desc: '3v3 Distinct teams, chronological timestamps', status: 'ACTIVE' },
                      { title: 'Event Standings & Records', desc: 'Real Win/Loss ratio & Ranking Score formula', status: 'ACTIVE' },
                      { title: 'Queuing Lane & Station Color', desc: 'Active field match & countdown clock synchronization', status: 'ACTIVE' },
                      { title: 'Match 13 xP Model', desc: 'Auto + Teleop + Endgame xP sum verified', status: 'ACTIVE' },
                      { title: 'Playoff Double-Elim Bracket', desc: '8 dynamic alliances with real picks', status: 'ACTIVE' },
                      { title: 'Video Replay Scrubber', desc: 'Indexed match videos with YouTube player', status: 'ACTIVE' },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-start gap-2.5"
                      >
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-200 text-xs">{item.title}</span>
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-500/20 text-emerald-300">
                              {item.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-400 font-sans mt-0.5 leading-tight">
                            {item.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

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
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Returned</span>
                      </span>
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
