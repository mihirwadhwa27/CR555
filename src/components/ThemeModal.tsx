/**
 * Theme Modal Component
 * Distinct FRC Pit Theme Customizer & Design System Studio
 */

import React, { useState } from 'react';
import {
  X,
  Link as LinkIcon,
  Check,
  Palette,
  Type,
  Sparkles,
  RotateCcw,
  Sliders,
  ShieldCheck,
  AlertCircle,
  Copy,
  Download,
} from 'lucide-react';
import { usePitState, Actions, Selectors } from '../store';
import { ThemeFont, ThemeTokens, THEME_PRESETS } from '../types';
import { ThemeService, calculateContrastRatio } from '../services';

export const ThemeModal: React.FC = () => {
  const isOpen = usePitState(Selectors.isThemeModalOpen);
  const theme = usePitState(Selectors.themeConfig);
  const teamInfo = usePitState(Selectors.teamInfo);
  const activeEvent = usePitState(Selectors.activeEvent);
  const [activeSubTab, setActiveSubTab] = useState<'presets' | 'palette' | 'typography'>('presets');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    Actions.setThemeModalOpen(false);
  };

  const handleShareUrl = () => {
    const encoded = ThemeService.encodeThemeForSharing(theme);
    const url = `${window.location.origin}${window.location.pathname}#theme=${encoded}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(theme, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2200);
  };

  const contrastRatio = calculateContrastRatio(
    theme.tokens.background,
    theme.tokens.foreground
  );

  const surfaceTokens: Array<{ key: keyof ThemeTokens; label: string; desc: string }> = [
    { key: 'background', label: 'Pit Canvas', desc: 'Main full-bleed background' },
    { key: 'secondary', label: 'Card Surface', desc: 'Container backgrounds' },
    { key: 'border', label: 'Primary Border', desc: 'Outer structural borders' },
    { key: 'secondaryBorder', label: 'Inner Border', desc: 'Internal dividers & badges' },
  ];

  const contentTokens: Array<{ key: keyof ThemeTokens; label: string; desc: string }> = [
    { key: 'foreground', label: 'Primary Text', desc: 'Key headings & numbers' },
    { key: 'mutedForeground', label: 'Muted Text', desc: 'Labels, captions, & subtext' },
  ];

  const accentTokens: Array<{ key: keyof ThemeTokens; label: string; desc: string }> = [
    { key: 'accent', label: 'Accent Highlight', desc: 'Brand highlight & status glow' },
    { key: 'accentForeground', label: 'Accent Text', desc: 'Text on top of accent' },
    { key: 'destructive', label: 'Urgent / Fault', desc: 'Alerts and battery low' },
  ];

  return (
    <div
      id="theme-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
      onClick={handleClose}
    >
      <div
        id="theme-modal-card"
        className="w-full max-w-2xl rounded-2xl p-5 sm:p-6 shadow-2xl transition-all border my-8"
        style={{
          backgroundColor: '#12141a',
          borderColor: '#262c38',
          color: '#f1f5f9',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg border"
              style={{
                backgroundColor: theme.tokens.secondary,
                borderColor: theme.tokens.border,
                color: theme.tokens.accent,
              }}
            >
              <Palette size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                CR555 Theme Studio
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Team Presets
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Customize high-visibility colors and typography for your pit display.
              </p>
            </div>
          </div>

          <button
            id="close-theme-modal-btn"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Display HUD Preview Card */}
        <div className="my-4 p-4 rounded-xl border relative overflow-hidden transition-all shadow-inner"
          style={{
            backgroundColor: theme.tokens.background,
            borderColor: theme.tokens.border,
            fontFamily: theme.font === 'System' ? 'sans-serif' : theme.font,
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: theme.tokens.border }}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: theme.tokens.accent }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.tokens.foreground }}>
                Team 1002 • CircuitRunners
              </span>
            </div>
            <div
              className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: theme.tokens.secondary,
                borderColor: theme.tokens.secondaryBorder,
                color: theme.tokens.foreground,
              }}
            >
              LIVE PIT PREVIEW
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            {/* Countdown preview box */}
            <div
              className="p-2.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: theme.tokens.secondary,
                borderColor: theme.tokens.border,
              }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: theme.tokens.mutedForeground }}>
                Time to Field
              </span>
              <div className="text-xl font-black font-mono tracking-tight" style={{ color: theme.tokens.foreground }}>
                14:28
              </div>
              <span className="text-[10px]" style={{ color: theme.tokens.accent }}>
                ● On Schedule
              </span>
            </div>

            {/* Next Match preview */}
            <div
              className="p-2.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: theme.tokens.secondary,
                borderColor: theme.tokens.border,
              }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: theme.tokens.mutedForeground }}>
                Next Match
              </span>
              <div className="text-base font-bold" style={{ color: theme.tokens.foreground }}>
                Qual 42
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold" style={{ color: '#38bdf8' }}>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Blue Alliance
              </div>
            </div>

            {/* Legibility / Contrast ratio gauge */}
            <div
              className="p-2.5 rounded-lg border flex flex-col justify-between"
              style={{
                backgroundColor: theme.tokens.secondary,
                borderColor: theme.tokens.border,
              }}
            >
              <span className="text-[10px] font-bold uppercase" style={{ color: theme.tokens.mutedForeground }}>
                10-Foot Legibility
              </span>
              <div className="flex items-center gap-1.5">
                {contrastRatio >= 7.0 ? (
                  <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                )}
                <span className="text-sm font-bold font-mono" style={{ color: theme.tokens.foreground }}>
                  {contrastRatio.toFixed(1)}:1
                </span>
              </div>
              <span
                className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded text-center ${
                  contrastRatio >= 7.0
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : contrastRatio >= 4.5
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {contrastRatio >= 7.0 ? 'AAA High Visibility' : contrastRatio >= 4.5 ? 'AA Standard' : 'Low Contrast'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold mb-4">
          <button
            onClick={() => setActiveSubTab('presets')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'presets'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sparkles size={14} />
            FRC Presets
          </button>
          <button
            onClick={() => setActiveSubTab('palette')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'palette'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Sliders size={14} />
            Color Palette
          </button>
          <button
            onClick={() => setActiveSubTab('typography')}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeSubTab === 'typography'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Type size={14} />
            Typography
          </button>
        </div>

        {/* TAB 1: Curated FRC Presets */}
        {activeSubTab === 'presets' && (
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {THEME_PRESETS.map((preset) => {
              const isSelected = theme.presetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => Actions.applyThemePreset(preset.id, preset.tokens, preset.font)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                      : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-100">{preset.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {preset.font}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-0.5">
                          <Check size={12} /> ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{preset.description}</p>
                  </div>

                  {/* Swatch preview dots */}
                  <div className="flex items-center gap-1.5 pl-3 shrink-0">
                    <span
                      className="w-5 h-5 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: preset.tokens.background }}
                      title="Background"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: preset.tokens.secondary }}
                      title="Secondary"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: preset.tokens.foreground }}
                      title="Foreground"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: preset.tokens.accent }}
                      title="Accent"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Palette Customizer */}
        {activeSubTab === 'palette' && (
          <div className="space-y-4 max-h-72 overflow-y-auto pr-1 text-xs">
            {/* Quick Action Helpers */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
              <span className="text-zinc-400 font-medium">Quick Presets:</span>
              <button
                onClick={() => {
                  Actions.updateThemeToken('background', '#000000');
                  Actions.updateThemeToken('secondary', '#0c0c0c');
                  Actions.updateThemeToken('border', '#222222');
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
              >
                OLED Pure Black
              </button>
              <button
                onClick={() => {
                  Actions.updateThemeToken('foreground', '#5dd62c');
                  Actions.updateThemeToken('accent', '#5dd62c');
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-emerald-400 transition-colors"
              >
                Circuit Lime
              </button>
              <button
                onClick={() => {
                  Actions.updateThemeToken('foreground', '#f59e0b');
                  Actions.updateThemeToken('accent', '#fcd34d');
                }}
                className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-400 transition-colors"
              >
                Team Gold
              </button>
            </div>

            {/* Surfaces Group */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Surfaces & Borders
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {surfaceTokens.map((item) => (
                  <div key={item.key} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-200">{item.label}</div>
                      <div className="text-[10px] text-zinc-500">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-400">{theme.tokens[item.key]}</span>
                      <input
                        type="color"
                        value={theme.tokens[item.key]}
                        onChange={(e) => Actions.updateThemeToken(item.key, e.target.value)}
                        className="w-7 h-7 rounded border border-zinc-700 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Typography & Accent Group */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Typography & Accents
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[...contentTokens, ...accentTokens].map((item) => (
                  <div key={item.key} className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-zinc-200">{item.label}</div>
                      <div className="text-[10px] text-zinc-500">{item.desc}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-400">{theme.tokens[item.key]}</span>
                      <input
                        type="color"
                        value={theme.tokens[item.key]}
                        onChange={(e) => Actions.updateThemeToken(item.key, e.target.value)}
                        className="w-7 h-7 rounded border border-zinc-700 cursor-pointer bg-transparent"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Typography Selection */}
        {activeSubTab === 'typography' && (
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 text-xs">
            <p className="text-zinc-400">
              Select the typographic archetype for numbers, team statistics, and match countdown timers:
            </p>
            {(['Roboto', 'Inter', 'JetBrains Mono', 'Space Grotesk', 'Orbitron', 'Chakra Petch', 'System'] as ThemeFont[]).map((font) => (
              <div
                key={font}
                onClick={() => Actions.setThemeFont(font)}
                className={`p-3.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                  theme.font === font
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-zinc-100">{font}</div>
                  <div
                    className="text-xs text-zinc-400 mt-1"
                    style={{ fontFamily: font === 'System' ? 'sans-serif' : font }}
                  >
                    FRC {teamInfo.number} • {activeEvent?.shortName || activeEvent?.name || 'Tournament'} • Qual 42 • 14:28 Remaining
                  </div>
                </div>
                {theme.font === font && (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check size={14} /> Selected
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleShareUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              {copiedLink ? <Check size={13} className="text-emerald-400" /> : <LinkIcon size={13} />}
              {copiedLink ? 'Link Copied!' : 'Share Link'}
            </button>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white transition-colors"
            >
              {copiedJson ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
              {copiedJson ? 'JSON Copied!' : 'Copy JSON'}
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => Actions.resetThemeToDefault()}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <RotateCcw size={13} />
              Reset Default
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-2 text-xs font-bold rounded-lg shadow-md transition-all hover:brightness-110 active:scale-95 bg-white text-black"
            >
              Done & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
