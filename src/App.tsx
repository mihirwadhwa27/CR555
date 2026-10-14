/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { RefreshCw, Sliders, Palette, Maximize2, Layers, Smartphone } from 'lucide-react';
import { usePitState, pitStore, Actions, Selectors } from './store';
import { NavigationTab } from './types';
import { ThemeService } from './services';
import { formatTimeAgo } from './utils/matchUtils';

import { TopNav } from './components/TopNav';
import { ThemeModal } from './components/ThemeModal';
import { StrategyConfirmationModal } from './components/StrategyConfirmationModal';
import { PulseSetupModal } from './components/PulseSetupModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { CrLogo } from './components/CrLogo';

import { DashboardView } from './views/DashboardView';
import { ScheduleView } from './views/ScheduleView';
import { TbaEventReviewView } from './views/TbaEventReviewView';
import { PlayoffsView } from './views/PlayoffsView';
import { ControllerView } from './views/ControllerView';
import { ToolsView } from './views/ToolsView';
import { SettingsView } from './views/SettingsView';
import { ScoutView } from './views/ScoutView';

export default function App() {
  const currentTab = usePitState(Selectors.currentTab);
  const theme = usePitState(Selectors.themeConfig);
  const isStrategyUnlocked = usePitState(Selectors.isStrategyUnlocked);
  const isArchitectureModalOpen = usePitState(Selectors.isArchitectureModalOpen);
  const teamInfo = usePitState(Selectors.teamInfo);
  const activeEvent = usePitState(Selectors.activeEvent);
  const demoMode = usePitState(Selectors.demoMode);
  const customLogoUrl = usePitState(Selectors.customLogoUrl);
  const isVerticalMode = usePitState(Selectors.isVerticalMode);
  const lastSyncedAt = usePitState(Selectors.lastSyncedAt);
  const dataFreshness = usePitState(Selectors.dataFreshness);

  // Apply theme tokens, background/foreground colors, and font family reactively across the whole DOM
  useEffect(() => {
    ThemeService.applyTheme(theme);
  }, [theme]);

  // First-run Pulse setup check: automatically opens on first visit only, persists completion
  useEffect(() => {
    try {
      const isCompleted = localStorage.getItem('pitfusion_setup_completed');
      if (!isCompleted) {
        Actions.setSetupModalOpen(true);
      }
    } catch {
      // ignore localstorage errors
    }
  }, []);

  // Connect to APIs on initial mount & periodic sync
  useEffect(() => {
    Actions.pullTbaMatches();
    Actions.pullStatboticsEpa();
    Actions.syncNexusData();

    // Fast 25s polling for real-time Nexus queuing updates
    const nexusInterval = setInterval(() => {
      Actions.syncNexusData();
    }, 25000);

    // 60s polling for TBA match scores & rankings
    const tbaInterval = setInterval(() => {
      Actions.pullTbaMatches();
    }, 60000);

    return () => {
      clearInterval(nexusInterval);
      clearInterval(tbaInterval);
    };
  }, []);

  // Hash-based routing & shared theme detection
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');

      // Check for shared theme parameter
      if (hash && typeof hash.startsWith === 'function' && hash.startsWith('theme=')) {
        const encoded = hash.replace('theme=', '');
        const decoded = ThemeService.decodeSharedTheme(encoded);
        if (decoded && decoded.tokens) {
          Actions.applyThemePreset('shared-theme', decoded.tokens, decoded.font || 'Roboto');
        }
        window.location.hash = '#dashboard';
        return;
      }

      // Standard tab routes
      const validTabs: NavigationTab[] = [
        'dashboard',
        'watch',
        'schedule',
        'previous',
        'playoffs',
        'controller',
        'tools',
        'settings',
        'scout',
      ];

      const active = pitStore.getState().ui.activeTab;

      if (validTabs.includes(hash as NavigationTab)) {
        if (hash === 'scout' && !isStrategyUnlocked) {
          Actions.setStrategyModalOpen(true);
        } else if (hash !== active) {
          Actions.navigate(hash as NavigationTab);
        }
      } else if (!hash && active !== 'dashboard') {
        Actions.navigate('dashboard');
      }
    };

    // Initial check on mount
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isStrategyUnlocked]);

  const renderActiveView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'watch':
      case 'schedule':
        return <ScheduleView />;
      case 'previous':
        return <TbaEventReviewView />;
      case 'playoffs':
        return <PlayoffsView />;
      case 'controller':
        return <ControllerView />;
      case 'tools':
        return <ToolsView />;
      case 'settings':
        return <SettingsView />;
      case 'scout':
        return isStrategyUnlocked ? <ScoutView /> : <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div
      id="pitfusion-root"
      className="min-h-screen flex flex-col font-sans antialiased transition-colors duration-200"
      style={{
        backgroundColor: theme.tokens.background,
        color: theme.tokens.foreground,
      }}
    >
      {/* Top Navigation & Status Bar */}
      <TopNav />

      {/* Primary Main Content View */}
      <main id="pitfusion-main-content" className="flex-1 max-w-[1920px] w-full mx-auto px-2 sm:px-3 py-2">
        {renderActiveView()}
      </main>

      {/* Footer / Status Bar (Pulse Pit Display Style) */}
      <footer
        id="pitfusion-footer"
        className="py-2 px-4 sm:px-6 flex flex-wrap items-center justify-between text-xs border-t transition-colors select-none"
        style={{
          borderColor: theme.tokens.border,
          color: theme.tokens.mutedForeground,
          backgroundColor: theme.tokens.secondary,
        }}
      >
        <div className="flex items-center gap-2 sm:gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5 font-mono font-bold text-zinc-100">
            <CrLogo size={16} customUrl={customLogoUrl} accentColor="#fbbf24" />
            <span>CR555</span>
          </div>
          <span className="text-zinc-600">•</span>
          <span className="font-mono text-zinc-300">
            {activeEvent?.name || activeEvent?.shortName || 'FIRST Robotics Competition'}
          </span>
          <span className="text-zinc-600">•</span>
          <span className="text-amber-400 font-bold">
            Team {teamInfo.number} {teamInfo.name}
          </span>
          {demoMode?.enabled && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              DEMO: Day 2 • 11:30 AM
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-xs">
          {/* Subtle Time-Ago Data Freshness Indicator */}
          <div
            className="flex items-center gap-1.5 font-mono text-[11px] cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => Actions.pullTheBlueAlliance()}
            title={`Data source: ${dataFreshness === 'live' ? 'Live connected' : 'Local verified cache'}. Click to re-sync.`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                dataFreshness === 'live'
                  ? 'bg-emerald-400 animate-pulse'
                  : dataFreshness === 'cached'
                  ? 'bg-amber-400'
                  : 'bg-zinc-500'
              }`}
            />
            <span
              className={
                dataFreshness === 'live'
                  ? 'text-emerald-400 font-semibold'
                  : dataFreshness === 'cached'
                  ? 'text-amber-300'
                  : 'text-zinc-400'
              }
            >
              {dataFreshness === 'live'
                ? `Live · Synced ${formatTimeAgo(lastSyncedAt)}`
                : `Cached · ${formatTimeAgo(lastSyncedAt)}`}
            </span>
          </div>

          <div className="flex items-center gap-1 text-zinc-400">
            {/* Direct Vertical HUD Toggle */}
            <button
              onClick={() => Actions.toggleVerticalMode()}
              className={`p-1 rounded transition-colors cursor-pointer ${
                isVerticalMode ? 'text-amber-400 bg-amber-500/10' : 'hover:bg-zinc-800 hover:text-white'
              }`}
              title={isVerticalMode ? 'Switch to Standard Wide Layout' : 'Switch to Vertical Pit Display HUD'}
            >
              <Smartphone size={13} />
            </button>
            <button
              onClick={() => Actions.setSetupModalOpen(true)}
              className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer text-emerald-400"
              title="Open Setup Screen (Team, Event, Demo Mode)"
            >
              <Sliders size={13} />
            </button>
            <button
              onClick={() => Actions.pullTheBlueAlliance()}
              className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="Force Sync The Blue Alliance"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={() => Actions.navigate('controller')}
              className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="Pit Controller Console"
            >
              <Sliders size={13} />
            </button>
            <button
              onClick={() => Actions.setArchitectureModalOpen(true)}
              className="p-1 rounded hover:bg-zinc-800 hover:text-amber-400 transition-colors cursor-pointer text-zinc-400"
              title="Architecture & Code Map"
            >
              <Layers size={13} />
            </button>
            <button
              onClick={() => Actions.setThemeModalOpen(true)}
              className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="Theme Settings"
            >
              <Palette size={13} />
            </button>
            <button
              onClick={() => Actions.toggleTenFootMode()}
              className="p-1 rounded hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen / 10-Foot Display"
            >
              <Maximize2 size={13} />
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PulseSetupModal />
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => Actions.setArchitectureModalOpen(false)}
      />
      <ThemeModal />
      <StrategyConfirmationModal />
    </div>
  );
}
