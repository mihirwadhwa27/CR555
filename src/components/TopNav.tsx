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
  SlidersHorizontal,
  Sparkles,
  Tv,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { NavigationTab } from '../types';
import { CrLogo } from './CrLogo';

interface NavItem {
  id: NavigationTab;
  label: string;
  isPrivate?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'General' },
  { id: 'schedule', label: 'Schedule & Videos' },
  { id: 'playoffs', label: 'Playoffs' },
  { id: 'tools', label: 'Ledger' },
  { id: 'controller', label: 'Controller' },
  { id: 'scout', label: 'Strategy', isPrivate: true },
];

export const TopNav: React.FC = () => {
  const currentTab = usePitState(Selectors.currentTab);
  const teamInfo = usePitState(Selectors.teamInfo);
  const activeEvent = usePitState(Selectors.activeEvent);
  const theme = usePitState(Selectors.themeConfig);
  const isStrategyUnlocked = usePitState(Selectors.isStrategyUnlocked);
  const demoMode = usePitState(Selectors.demoMode);
  const customLogoUrl = usePitState(Selectors.customLogoUrl);
  const isDrivenScreen = usePitState(Selectors.isDrivenScreen);

  // Live Competition / Arena Clock (with Demo Mode simulation support)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [use24Hour, setUse24Hour] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      if (demoMode?.enabled && typeof demoMode.simulatedTimeOffset === 'number') {
        setCurrentTime(new Date(Date.now() + demoMode.simulatedTimeOffset));
      } else {
        setCurrentTime(new Date());
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [demoMode?.enabled, demoMode?.simulatedTimeOffset]);

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
            {/* CR555 CircuitRunners Logo & Brand */}
            <div
              className="flex items-center gap-2.5 cursor-pointer shrink-0 group"
              onClick={() => Actions.navigate('dashboard')}
              title="CR555 - Team 1002 CircuitRunners Pit Display"
            >
              <div className="relative transition-transform duration-200 group-hover:scale-105">
                <CrLogo size={28} customUrl={customLogoUrl} accentColor={theme.tokens.accent || '#fbbf24'} />
              </div>
              <div className="leading-tight">
                <div
                  className="font-extrabold text-base tracking-tight font-mono flex items-center gap-1"
                  style={{ color: theme.tokens.foreground }}
                >
                  <span>CR555</span>
                  <span className="text-[10px] font-bold px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    1002
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-medium tracking-wide -mt-0.5">
                  circuitrunners pit
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

          {/* Right Action Controls: Live Clock, Demo Pill, Setup, Team Selector & Discreet Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Arena / Pit Clock */}
            <div
              onClick={() => setUse24Hour(!use24Hour)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-black/60 border border-zinc-800 font-mono text-zinc-200 cursor-pointer hover:border-zinc-700 transition-colors shadow-xs select-none"
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
                {demoMode?.enabled ? 'Day 2 • Sat' : currentTime.toLocaleDateString([], {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Active Demo Mode Pill (Pulse Simulation) */}
            {demoMode?.enabled && (
              <button
                onClick={() => Actions.setSetupModalOpen(true)}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer shadow-xs"
                title="Demo Mode: Day 2 • 11:30 AM (Click to change)"
              >
                <Sparkles size={11} className="text-emerald-400 shrink-0" />
                <span>DEMO: Day 2 @ 11:30 AM</span>
              </button>
            )}

            {/* Driven Screen Mode Button */}
            <button
              id="make-driven-screen-btn"
              onClick={() => Actions.toggleDrivenScreen()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                isDrivenScreen
                  ? 'border-blue-500/60 bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 ring-1 ring-blue-500/40'
                  : 'border-zinc-800 bg-zinc-900/90 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
              title={
                isDrivenScreen
                  ? 'Driven Display: ACTIVE • This screen is automatically controlled by the Pit Operations Controller. Click to make this screen independent.'
                  : 'Make This Screen the Driven One • Click so this screen follows remote commands from the Pit Operations Controller.'
              }
            >
              <Tv size={13} className={isDrivenScreen ? 'text-blue-400 animate-pulse shrink-0' : 'text-zinc-400 shrink-0'} />
              <span className="hidden sm:inline font-mono">
                {isDrivenScreen ? 'Driven Screen: ON' : 'Make Driven Screen'}
              </span>
              <span className="sm:hidden font-mono text-[10px]">
                {isDrivenScreen ? 'Driven' : 'Follow'}
              </span>
            </button>

            {/* Pulse Setup Wizard Button */}
            <button
              id="pulse-setup-trigger-btn"
              onClick={() => Actions.setSetupModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:border-emerald-500/50 hover:text-white transition-all cursor-pointer shadow-xs"
              title="Open Pulse Setup Screen (Team, Event, Demo Mode)"
            >
              <SlidersHorizontal size={13} className="text-emerald-400 shrink-0" />
              <span className="font-medium">Setup</span>
            </button>

            {/* Pill: Active Team & Location */}
            <button
              onClick={() => Actions.setSetupModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-xs font-semibold border border-zinc-800 bg-black/50 text-zinc-200 hover:border-zinc-700 hover:text-white transition-colors cursor-pointer shadow-xs group"
              title={`Team ${teamInfo.number}: ${teamInfo.name} (${teamInfo.location || 'USA'}) - Click to change in Setup`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform shrink-0" />
              <span className="font-mono font-bold text-amber-400">{teamInfo.number}</span>
              <span className="text-zinc-200 font-medium max-w-[110px] sm:max-w-[160px] truncate">{teamInfo.name}</span>
              {teamInfo.location && (
                <span className="hidden md:inline text-[10px] text-zinc-400 font-sans pl-1.5 border-l border-zinc-800 shrink-0">
                  {teamInfo.location}
                </span>
              )}
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
                { number: 1002, name: 'CircuitRunners Robotics' },
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
