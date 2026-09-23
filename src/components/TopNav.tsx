/**
 * Top Navigation Bar for Pit Display (Pulse for FRC Style)
 */

import React, { useEffect, useState } from 'react';
import {
  Palette,
  Settings,
  Maximize2,
  Minimize2,
  Box,
  X,
  Check,
  Clock,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { NavigationTab } from '../types';

interface NavItem {
  id: NavigationTab;
  label: string;
  isPrivate?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'General' },
  { id: 'tools', label: 'Ledger' },
  { id: 'schedule', label: 'Complete Schedule' },
  { id: 'previous', label: 'Event Review (TBA)' },
  { id: 'playoffs', label: 'Playoffs' },
  { id: 'controller', label: 'Controller' },
  { id: 'scout', label: 'Strategy', isPrivate: true },
];

export const TopNav: React.FC = () => {
  const currentTab = usePitState(Selectors.currentTab);
  const teamInfo = usePitState(Selectors.teamInfo);
  const activeEvent = usePitState(Selectors.activeEvent);
  const theme = usePitState(Selectors.themeConfig);
  const isStrategyUnlocked = usePitState(Selectors.isStrategyUnlocked);

  // Live Competition / Arena Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [use24Hour, setUse24Hour] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Modal for quick team switcher
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [tempTeamNumber, setTempTeamNumber] = useState(teamInfo.number.toString());

  const handleTabClick = (item: NavItem) => {
    if (item.isPrivate && !isStrategyUnlocked) {
      Actions.setStrategyModalOpen(true);
      return;
    }
    Actions.navigate(item.id);
  };

  const handleApplyTeam = (numStr: string) => {
    const num = parseInt(numStr, 10);
    if (!isNaN(num) && num > 0) {
      Actions.setTeamNumber(num);
    }
    setIsTeamModalOpen(false);
  };

  return (
    <>
      <header
        id="pulse-header"
        className="sticky top-0 z-40 border-b select-none transition-colors"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        <div className="max-w-[1920px] mx-auto px-2.5 sm:px-5 h-13 sm:h-14 flex items-center justify-between gap-3">
          {/* Brand & Main Navigation Links */}
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
            {/* Logo */}
            <div
              className="flex items-center gap-2 cursor-pointer shrink-0"
              onClick={() => Actions.navigate('dashboard')}
              title="Return to General Dashboard"
            >
              <div
                className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs"
                style={{
                  backgroundColor: `${theme.tokens.foreground}20`,
                  color: theme.tokens.foreground,
                  border: `1px solid ${theme.tokens.secondaryBorder}`,
                }}
              >
                <Box size={16} />
              </div>
              <div className="leading-tight">
                <div
                  className="font-extrabold text-base tracking-tight"
                  style={{ color: theme.tokens.foreground }}
                >
                  Pulse.
                </div>
                <div className="text-[10px] text-zinc-400 font-medium tracking-wide -mt-1">
                  pit display
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2 text-xs font-semibold">
              {NAV_ITEMS.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    onClick={() => handleTabClick(item)}
                    className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'font-bold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    style={
                      isActive
                        ? {
                            color: theme.tokens.foreground,
                            backgroundColor: `${theme.tokens.foreground}15`,
                          }
                        : undefined
                    }
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls: Live Clock, Team Selector & Discreet Icons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Live Arena / Pit Clock */}
            <div
              onClick={() => setUse24Hour(!use24Hour)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 border border-zinc-800 font-mono text-zinc-200 cursor-pointer hover:border-zinc-700 transition-colors shadow-xs select-none"
              title="Arena Pit Clock (click to toggle 12h/24h format)"
            >
              <Clock size={13} className="text-amber-400 animate-pulse shrink-0" />
              <span className="font-bold text-xs tracking-wider text-white">
                {currentTime.toLocaleTimeString([], {
                  hour12: !use24Hour,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
              <span className="text-[9px] text-zinc-400 uppercase hidden lg:inline border-l border-zinc-800 pl-1.5">
                {currentTime.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Pill: Reselect Team */}
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-800 bg-black/40 text-zinc-300 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer"
              title="Switch FRC Team Number"
            >
              Team {teamInfo.number}
            </button>

            {/* Small Subtle Icons: Theme & Settings */}
            <button
              id="open-theme-btn"
              onClick={() => Actions.setThemeModalOpen(true)}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="Display Theme Settings"
              aria-label="Theme Settings"
            >
              <Palette size={16} />
            </button>

            <button
              id="open-settings-btn"
              onClick={() => Actions.navigate('settings')}
              className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="System Settings"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Reselect Team Modal */}
      {isTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div
            className="w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4"
            style={{
              backgroundColor: theme.tokens.secondary,
              borderColor: theme.tokens.border,
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-white">Reselect FRC Team</h3>
              <button
                onClick={() => setIsTeamModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Change the active pit display team to highlight matches and calculate Statbotics EPAs.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { number: 1002, name: 'CircuitRunners' },
                { number: 2910, name: 'Jack in the Bot' },
                { number: 1678, name: 'Citrus Circuits' },
                { number: 254, name: 'The Cheesy Poofs' },
              ].map((t) => (
                <button
                  key={t.number}
                  onClick={() => handleApplyTeam(t.number.toString())}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-colors cursor-pointer ${
                    teamInfo.number === t.number
                      ? 'bg-zinc-900 border-zinc-600 text-white font-bold'
                      : 'bg-black/30 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                  }`}
                >
                  <div className="font-bold">Team {t.number}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{t.name}</div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Custom Team Number:
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={tempTeamNumber}
                  onChange={(e) => setTempTeamNumber(e.target.value)}
                  placeholder="e.g. 1002"
                  className="flex-1 px-3 py-1.5 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-zinc-200 outline-hidden"
                />
                <button
                  onClick={() => handleApplyTeam(tempTeamNumber)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:text-white"
                >
                  Set Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
