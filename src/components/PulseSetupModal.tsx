/**
 * Pulse Pit Display Setup Screen
 * 
 * Provides first-run onboarding and quick configuration for:
 * 1. FRC Team selection & verification (Only 1002 is a preset, others via number input)
 * 2. Competition Event selection (Pulled dynamically from The Blue Alliance)
 * 3. Opt-in to Demo Mode (Team 1002 on Day 2 of PCH DCMP 2026 at 11:30 AM)
 * 
 * Persists completion in localStorage so it does not pop up on every reload,
 * while remaining accessible at all times via navigation or settings.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  X,
  Play,
  Check,
  Sparkles,
  Calendar,
  Users,
  Layers,
  Loader2,
  MapPin,
  Key,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { TbaService } from '../services';
import { CrLogo } from './CrLogo';

// Quick selection presets for configured team themes (or type any team number below)
const TEAM_PRESETS = [
  { number: 1002, name: 'CircuitRunners Robotics', location: 'Marietta, GA', isHost: true },
  { number: 1833, name: 'Team BEAN', location: 'Cumming, GA', isHost: false },
  { number: 1771, name: 'North Gwinnett Robotics', location: 'Suwanee, GA', isHost: false },
  { number: 2974, name: 'Walton Robotics', location: 'Marietta, GA', isHost: false },
  { number: 8736, name: 'The Mechanisms', location: 'Marietta, GA', isHost: false },
];

export const PulseSetupModal: React.FC = () => {
  const isOpen = usePitState(Selectors.isSetupModalOpen);
  const currentTeam = usePitState(Selectors.teamInfo);
  const currentEvent = usePitState(Selectors.activeEvent);
  const currentConfig = usePitState(Selectors.config);
  const demoMode = usePitState(Selectors.demoMode);

  const [selectedTeamNumber, setSelectedTeamNumber] = useState<number>(currentTeam.number || 1002);
  const [selectedTeamName, setSelectedTeamName] = useState<string>(currentTeam.name || 'CircuitRunners Robotics');
  const [selectedEventKey, setSelectedEventKey] = useState<string>(currentEvent?.key || '2026gacmp');
  const [selectedEventName, setSelectedEventName] = useState<string>(currentEvent?.name || 'Peachtree District Championship 2026');
  const [isDemoModeOptedIn, setIsDemoModeOptedIn] = useState<boolean>(demoMode?.enabled ?? false);
  const [isCustomEventInput, setIsCustomEventInput] = useState<boolean>(false);
  const [customEventKey, setCustomEventKey] = useState<string>('');
  const [tbaApiKeyInput, setTbaApiKeyInput] = useState<string>('');

  // Dynamically pulled competition events for the selected team from TBA
  const [teamEvents, setTeamEvents] = useState<
    Array<{
      key: string;
      name: string;
      shortName: string;
      city: string;
      stateProv: string;
      startDate: string;
      endDate: string;
    }>
  >([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);

  // Synchronize state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedTeamNumber(currentTeam.number || 1002);
      setSelectedTeamName(currentTeam.name || 'CircuitRunners Robotics');
      setSelectedEventKey(currentEvent?.key || '2026gacmp');
      setSelectedEventName(currentEvent?.name || 'Peachtree District Championship 2026');
      setIsDemoModeOptedIn(demoMode?.enabled ?? false);
      setTbaApiKeyInput(
        currentConfig.tbaApiKey && !currentConfig.tbaApiKey.includes('PublicPreviewKey')
          ? currentConfig.tbaApiKey
          : ''
      );
    }
  }, [isOpen, currentTeam.number, currentTeam.name, currentEvent?.key, currentEvent?.name, demoMode?.enabled, currentConfig.tbaApiKey]);

  // Pull competition events and verified team name from The Blue Alliance whenever selectedTeamNumber changes
  useEffect(() => {
    if (!selectedTeamNumber || selectedTeamNumber <= 0) return;
    setIsLoadingEvents(true);
    const year = new Date().getFullYear();
    const apiKey = currentConfig.tbaApiKey;

    // Immediately fetch verified team nickname from TBA
    TbaService.pullTeamInfoFromTba(selectedTeamNumber, apiKey).then((info) => {
      if (info && (info.nickname || info.name)) {
        setSelectedTeamName(info.nickname || info.name);
      }
    });

    TbaService.pullEventsForTeamFromTba(selectedTeamNumber, year, apiKey)
      .then((events) => {
        setTeamEvents(events);
        setIsLoadingEvents(false);
        // If current selectedEventKey is not in the team's events, auto-select the first event
        if (events.length > 0 && !events.some((e) => e.key === selectedEventKey)) {
          setSelectedEventKey(events[0].key);
          setSelectedEventName(events[0].name);
        }
      })
      .catch((err) => {
        console.warn('Failed loading events from TBA:', err);
        setIsLoadingEvents(false);
      });
  }, [selectedTeamNumber, currentConfig.tbaApiKey]);

  // Lookup team preset name or resolve via TBA
  const handleTeamChange = (num: number) => {
    setSelectedTeamNumber(num);
    const resolved = TbaService.resolveTeamNickname(num);
    setSelectedTeamName(resolved);

    // If live API is configured, pull newest team details
    TbaService.pullTeamInfoFromTba(num, currentConfig.tbaApiKey).then((info) => {
      if (info && info.nickname) {
        setSelectedTeamName(info.nickname);
      }
    });
  };

  const handleToggleDemoMode = (optIn: boolean) => {
    setIsDemoModeOptedIn(optIn);
    if (optIn) {
      setSelectedTeamNumber(1002);
      setSelectedTeamName('CircuitRunners Robotics');
      setSelectedEventKey('2026gacmp');
      setSelectedEventName('Peachtree District Championship 2026');
      setIsCustomEventInput(false);
    }
  };

  const handleSaveAndLaunch = () => {
    if (tbaApiKeyInput.trim() && tbaApiKeyInput.trim() !== currentConfig.tbaApiKey) {
      Actions.setTbaApiKey(tbaApiKeyInput.trim());
    }

    if (isDemoModeOptedIn) {
      Actions.completeSetup({
        teamNumber: 1002,
        teamName: 'CircuitRunners Robotics',
        eventKey: '2026gacmp',
        eventName: 'Peachtree District Championship 2026',
        demoMode: true,
      });
    } else {
      const finalEventKey = isCustomEventInput && customEventKey.trim() ? customEventKey.trim() : selectedEventKey;
      const matched = teamEvents.find((e) => e.key === finalEventKey);
      const finalEventName = matched?.name || selectedEventName || finalEventKey;

      Actions.completeSetup({
        teamNumber: selectedTeamNumber,
        teamName: selectedTeamName,
        eventKey: finalEventKey,
        eventName: finalEventName,
        demoMode: false,
      });
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pitfusion_setup_completed', 'true');
      } catch {
        // ignore
      }
    }
    Actions.setSetupModalOpen(false);
  };

  const formatDates = (start: string, end: string) => {
    if (!start) return '';
    try {
      const s = new Date(start + 'T00:00:00');
      const e = end ? new Date(end + 'T00:00:00') : s;
      const sMonth = s.toLocaleDateString([], { month: 'short' });
      const sDay = s.getDate();
      const eDay = e.getDate();
      const year = s.getFullYear();
      if (s.getMonth() === e.getMonth()) {
        return `${sMonth} ${sDay}-${eDay}, ${year}`;
      }
      const eMonth = e.toLocaleDateString([], { month: 'short' });
      return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${year}`;
    } catch {
      return `${start} - ${end}`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="pulse-setup-card"
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-6 pb-4 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <CrLogo size={36} customUrl={currentConfig.customLogoUrl} accentColor="#fbbf24" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight font-mono text-white flex items-center gap-1.5">
                  CR555<span className="text-amber-400">.</span>
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-amber-300 border border-amber-500/30">
                  CircuitRunners Pit Display
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                555 Timer Architecture • Team 1002 Pit Operations & Telemetry
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Dismiss Setup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Setup Options */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
          {/* DEMO MODE OPT-IN SECTION */}
          <div
            onClick={() => handleToggleDemoMode(!isDemoModeOptedIn)}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
              isDemoModeOptedIn
                ? 'bg-emerald-950/30 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/70'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isDemoModeOptedIn
                      ? 'bg-emerald-500 text-black'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      Opt-in to Demo Mode
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Preloads <strong>Team 1002 on Day 2 of PCH DCMP 2026 at 11:30 AM</strong> with live queuing and match feeds.
                  </p>
                </div>
              </div>

              {/* Interactive Toggle Pill */}
              <div
                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
                  isDemoModeOptedIn ? 'bg-emerald-500' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-xs ${
                    isDemoModeOptedIn ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* TEAM SELECTION SECTION */}
          <div className={`space-y-3 transition-opacity ${isDemoModeOptedIn ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Users size={14} className="text-emerald-400" />
                <span>1. Select Your FRC Team</span>
              </label>
              {isDemoModeOptedIn && (
                <span className="text-[11px] text-emerald-400 font-mono">
                  Locked to Team 1002 in Demo Mode
                </span>
              )}
            </div>

            {/* Manual Team Number Input */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-zinc-500">
                  FRC #
                </span>
                <input
                  type="number"
                  min="1"
                  max="99999"
                  value={selectedTeamNumber || ''}
                  onChange={(e) => handleTeamChange(parseInt(e.target.value, 10) || 0)}
                  disabled={isDemoModeOptedIn}
                  placeholder="e.g. 1002 or 1771"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-16 pr-4 py-2.5 text-sm font-mono font-bold text-white focus:outline-hidden focus:border-emerald-500 transition-colors disabled:opacity-50"
                />
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium shrink-0 min-w-[140px] text-center">
                {selectedTeamName || 'Unknown Team'}
              </div>
            </div>

            {/* Quick Preset (Only 1002 is a preset) */}
            <div className="space-y-1.5">
              <div className="text-[11px] text-zinc-500 font-medium">Quick Preset:</div>
              <div className="flex flex-wrap gap-1.5">
                {TEAM_PRESETS.map((team) => (
                  <button
                    key={team.number}
                    type="button"
                    onClick={() => handleTeamChange(team.number)}
                    disabled={isDemoModeOptedIn}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedTeamNumber === team.number
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-xs'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    <span className="font-bold">{team.number}</span>
                    <span className="text-[11px] opacity-80">{team.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 font-mono">
                      PRESET
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EVENT SELECTION SECTION - PULLED FROM THE BLUE ALLIANCE */}
          <div className={`space-y-3 transition-opacity ${isDemoModeOptedIn ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-400" />
                <span>2. Select Competition Event (From The Blue Alliance)</span>
              </label>
              {isLoadingEvents ? (
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin text-emerald-400" />
                  Syncing TBA...
                </span>
              ) : isDemoModeOptedIn ? (
                <span className="text-[11px] text-emerald-400 font-mono">
                  Locked to PCH DCMP 2026 in Demo Mode
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400 font-mono">
                  {teamEvents.length} events found for Team {selectedTeamNumber}
                </span>
              )}
            </div>

            {/* Event Cards Pulled From TBA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {teamEvents.map((ev) => {
                const isSelected = !isCustomEventInput && selectedEventKey === ev.key;
                return (
                  <button
                    key={ev.key}
                    type="button"
                    onClick={() => {
                      setSelectedEventKey(ev.key);
                      setSelectedEventName(ev.name);
                      setIsCustomEventInput(false);
                    }}
                    disabled={isDemoModeOptedIn}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-emerald-950/20 border-emerald-500/70 shadow-xs'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-white line-clamp-1">{ev.name}</span>
                        {isSelected && <Check size={14} className="text-emerald-400 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-emerald-300/80 font-mono mt-0.5">
                        {formatDates(ev.startDate, ev.endDate)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin size={10} className="text-zinc-500" />
                        {ev.city ? `${ev.city}, ${ev.stateProv}` : ev.stateProv}
                      </span>
                      <span className="text-zinc-500 uppercase font-semibold">{ev.key}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Event Option */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsCustomEventInput(!isCustomEventInput)}
                className="text-xs text-zinc-400 hover:text-zinc-200 underline cursor-pointer"
              >
                {isCustomEventInput ? '← Use team events list' : '+ Enter custom TBA event key'}
              </button>

              {isCustomEventInput && (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={customEventKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomEventKey(val);
                      setSelectedEventKey(val);
                    }}
                    placeholder="e.g. 2026gaalb or 2026gacmp"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-zinc-500">
                    Any valid event key from The Blue Alliance (e.g. 2026gaalb for PCH Albany 2026).
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* THE BLUE ALLIANCE API KEY (OPTIONAL FOR GITHUB PAGES) */}
          <div className="space-y-2 p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Key size={14} className="text-amber-400" />
                <span>3. The Blue Alliance (TBA) API Key</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-normal">Optional</span>
              </label>
              <a
                href="https://www.thebluealliance.com/account"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-amber-400 hover:underline"
              >
                Get Free Read Key ↗
              </a>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              On static hosts like GitHub Pages, entering your free TBA Read Key enables 100% live browser match schedules, scores, video replays, and division rankings directly from FIRST servers.
            </p>
            <input
              type="password"
              value={tbaApiKeyInput}
              onChange={(e) => setTbaApiKeyInput(e.target.value)}
              placeholder="Paste your TBA v3 API Key (or leave blank for built-in roster)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-hidden focus:border-amber-400"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-zinc-800/80 bg-zinc-900/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 text-center sm:text-left">
            <Layers size={13} className="text-zinc-500 shrink-0" />
            <span>Accessible anytime via <strong>Setup</strong> in the top bar.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDismiss}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              Skip
            </button>
            <button
              type="button"
              id="pulse-setup-launch-btn"
              onClick={handleSaveAndLaunch}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              {isDemoModeOptedIn ? (
                <>
                  <Play size={14} className="fill-black" />
                  <span>Launch Demo (Day 2 • 11:30 AM)</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Save & Launch Pit Display</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
