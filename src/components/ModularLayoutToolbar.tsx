/**
 * Apple-Style Modular Layout Toolbar
 * 
 * Provides clean widget customization controls:
 * - "Edit Widgets" / "Done" mode toggle
 * - Visual guidance: "Drag cards to rearrange • Drag bottom-right corner to resize"
 * - Instant bento presets and hidden widget restoration
 */

import React from 'react';
import { SlidersHorizontal, RotateCcw, Check, Plus, Sparkles, LayoutGrid, Maximize, BoxSelect } from 'lucide-react';
import { SegmentConfig } from '../hooks/useModularLayout';
import { usePitState, Selectors } from '../store';

interface ModularLayoutToolbarProps {
  viewName: string;
  isCustomizing: boolean;
  onToggleCustomizing: () => void;
  segments: SegmentConfig[];
  onToggleVisibility: (id: string) => void;
  onResetToDefault: () => void;
  onApplyPreset: (preset: 'default' | 'equal' | 'stacked' | 'fill' | 'quad' | 'bento') => void;
  onAddSpacer?: () => void;
  onFillGrid?: () => void;
}

export const ModularLayoutToolbar: React.FC<ModularLayoutToolbarProps> = ({
  viewName,
  isCustomizing,
  onToggleCustomizing,
  segments,
  onToggleVisibility,
  onResetToDefault,
  onApplyPreset,
  onAddSpacer,
  onFillGrid,
}) => {
  const theme = usePitState(Selectors.themeConfig);

  const hiddenSegments = segments.filter((s) => !s.visible && !s.isSpacer);

  return (
    <div className="flex flex-col gap-2 mb-4 select-none">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-400 font-mono">
          <LayoutGrid size={13} className="text-zinc-500" />
          <span className="font-semibold text-zinc-300">{viewName}</span>
          <span className="text-zinc-600">•</span>
          <span className="text-[11px] text-zinc-400">Modular Widget Layout</span>
        </div>

        <button
          onClick={onToggleCustomizing}
          className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer shadow-sm ${
            isCustomizing
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
              : 'bg-zinc-900/90 border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-500 hover:bg-zinc-800'
          }`}
          title="Toggle widget rearrange & corner resizing mode"
        >
          {isCustomizing ? (
            <>
              <Check size={13} strokeWidth={2.5} />
              <span>Done</span>
            </>
          ) : (
            <>
              <SlidersHorizontal size={12} />
              <span>Edit Layout</span>
            </>
          )}
        </button>
      </div>

      {isCustomizing && (
        <div
          className="p-3.5 rounded-2xl border space-y-3 animate-fade-in text-xs font-mono shadow-xl backdrop-blur-md"
          style={{
            backgroundColor: `${theme.tokens.secondary}fa`,
            borderColor: theme.tokens.border,
          }}
        >
          {/* Apple-Style Helper Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/80 text-[11px]">
            <div className="flex items-center gap-2 text-blue-400">
              <Sparkles size={14} className="shrink-0" />
              <span className="text-zinc-300 font-sans">
                <strong>Modular Grid Mode:</strong> Drag cards to rearrange • Drag corner to resize • Add empty spaces • Auto-fill grid.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onResetToDefault}
                className="flex items-center gap-1 text-zinc-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                <RotateCcw size={11} />
                <span>Reset Grid</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            {/* Quick Actions: Add Spacer & Total Grid Fill */}
            <div className="flex items-center gap-2 flex-wrap">
              {onAddSpacer && (
                <button
                  onClick={onAddSpacer}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-800/90 border border-zinc-700 text-amber-300 hover:text-amber-200 hover:bg-zinc-700 transition-colors cursor-pointer text-xs font-bold"
                  title="Insert an adjustable empty space tile in the grid"
                >
                  <BoxSelect size={13} />
                  <span>+ Empty Space</span>
                </button>
              )}

              {onFillGrid && (
                <button
                  onClick={onFillGrid}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:text-white hover:bg-blue-600/50 transition-colors cursor-pointer text-xs font-bold"
                  title="Auto-stretch visible segments so every row spans 100% (12 columns) without empty ragged space"
                >
                  <Maximize size={13} />
                  <span>Total Grid Fill</span>
                </button>
              )}
            </div>

            {/* Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-zinc-500 text-[11px]">Presets:</span>
              <button
                onClick={() => onApplyPreset('bento')}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 hover:text-white hover:bg-amber-500/30 transition-colors cursor-pointer text-xs font-semibold"
                title="Tall 2-unit card on left with two stacked 1-unit cards directly to the right"
              >
                Bento (Tall + Stacked)
              </button>
              <button
                onClick={() => onApplyPreset('default')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                Standard
              </button>
              <button
                onClick={() => onApplyPreset('equal')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                1/3s
              </button>
              <button
                onClick={() => onApplyPreset('quad')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                50/50
              </button>
              <button
                onClick={() => onApplyPreset('fill')}
                className="px-2.5 py-1 rounded-lg bg-blue-900/40 border border-blue-700/60 text-blue-300 hover:text-white hover:border-blue-500 transition-colors cursor-pointer font-bold"
                title="100% filled rows without gaps"
              >
                Fill 100%
              </button>
              <button
                onClick={() => onApplyPreset('stacked')}
                className="px-2.5 py-1 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
              >
                Stack
              </button>
            </div>

            {/* Hidden Widgets Restoration Tray */}
            {hiddenSegments.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-500 text-[11px]">Hidden Widgets:</span>
                {hiddenSegments.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onToggleVisibility(s.id)}
                    className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer text-[11px]"
                    title="Click to restore widget to grid"
                  >
                    <Plus size={11} className="text-blue-400" />
                    <span>{s.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
