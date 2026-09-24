/**
 * Apple-Style Modular Segment Container
 * 
 * Features:
 * - Direct drag-to-rearrange across the grid
 * - Corner drag-to-resize handle adjusting BOTH Width AND Height simultaneously
 * - Interactive Drag & Size Menu with one-click width & height presets
 * - Direct inline pixel height binding (195px, 290px, 390px, 585px, 780px)
 * - Smooth Apple aesthetic with "-" remove badge during layout customization
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Minus,
  ChevronUp,
  ChevronDown,
  GripHorizontal,
  Move,
  Maximize2,
  Sliders,
  Check,
  X,
  Sparkles,
  BoxSelect,
  Trash2,
} from 'lucide-react';
import {
  ColSpan,
  HeightMultiplier,
  colSpanToClass,
  getSegmentHeightPx,
  heightMultiplierToRowSpan,
} from '../hooks/useModularLayout';
import { usePitState, Selectors } from '../store';

const SPAN_LEVELS: ColSpan[] = [
  'sixth',
  'quarter',
  'third',
  'half',
  'two-thirds',
  'three-quarters',
  'five-sixths',
  'full',
];

const SPAN_LABELS: Record<ColSpan, string> = {
  sixth: '1/6',
  quarter: '1/4',
  third: '1/3',
  half: '1/2',
  'two-thirds': '2/3',
  'three-quarters': '3/4',
  'five-sixths': '5/6',
  full: '100% Full',
};

const HEIGHT_LEVELS: HeightMultiplier[] = [0.5, 0.75, 1, 1.5, 2];
const HEIGHT_LABELS: Record<HeightMultiplier, string> = {
  0.5: '0.5 Unit (~62px • 1 Row)',
  0.75: '0.75 Unit (~95px)',
  1: '1 Unit (Standard • ~132px • 2 Rows)',
  1.5: '1.5 Units (~202px • 3 Rows)',
  2: '2 Units (Tall • ~272px • Fits 2 Stacked Cells)',
};

interface ModularSegmentProps {
  id: string;
  title: string;
  colSpan: ColSpan;
  heightMultiplier?: HeightMultiplier;
  collapsed?: boolean;
  isSpacer?: boolean;
  isCustomizing: boolean;
  onReorder?: (sourceId: string, targetId: string) => void;
  onChangeColSpan?: (span: ColSpan) => void;
  onChangeHeightMultiplier?: (multiplier: HeightMultiplier) => void;
  onToggleCollapse?: () => void;
  onToggleVisibility?: () => void;
  onRemoveSpacer?: () => void;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}

export const ModularSegment: React.FC<ModularSegmentProps> = ({
  id,
  title,
  colSpan,
  heightMultiplier = 1,
  collapsed = false,
  isSpacer = false,
  isCustomizing,
  onReorder,
  onChangeColSpan,
  onChangeHeightMultiplier,
  onToggleCollapse,
  onToggleVisibility,
  onRemoveSpacer,
  rightAction,
  children,
}) => {
  const theme = usePitState(Selectors.themeConfig);
  const containerRef = useRef<HTMLDivElement>(null);
  const sizeMenuRef = useRef<HTMLDivElement>(null);

  // Drag-to-Rearrange state
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDraggingSelf, setIsDraggingSelf] = useState(false);

  // Drag-to-Resize state (BOTH Width AND Height)
  const [isResizing, setIsResizing] = useState(false);
  const [resizePreviewSpan, setResizePreviewSpan] = useState<ColSpan | null>(null);
  const [resizePreviewHeight, setResizePreviewHeight] = useState<HeightMultiplier | null>(null);
  const resizeStartXRef = useRef<number>(0);
  const resizeStartYRef = useRef<number>(0);
  const resizeInitialSpanRef = useRef<ColSpan>(colSpan);
  const resizeInitialHeightRef = useRef<HeightMultiplier>(heightMultiplier || 1);

  // Interactive Size & Drag Menu popover
  const [showSizeMenu, setShowSizeMenu] = useState(false);

  // Close size menu on outside click
  useEffect(() => {
    if (!showSizeMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) {
        setShowSizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSizeMenu]);

  // HTML5 Drag-to-rearrange handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingSelf(true);
  };

  const handleDragEnd = () => {
    setIsDraggingSelf(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsDraggingSelf(false);
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== id && onReorder) {
      onReorder(sourceId, id);
    }
  };

  // Corner Drag-to-Resize: BOTH Width AND Height adjust via dragging
  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    resizeStartXRef.current = e.clientX;
    resizeStartYRef.current = e.clientY;
    resizeInitialSpanRef.current = colSpan;
    resizeInitialHeightRef.current = (heightMultiplier || 1) as HeightMultiplier;

    setResizePreviewSpan(colSpan);
    setResizePreviewHeight((heightMultiplier || 1) as HeightMultiplier);

    const initialSpanIdx = SPAN_LEVELS.indexOf(colSpan);
    const initialHeightIdx = HEIGHT_LEVELS.indexOf((heightMultiplier || 1) as HeightMultiplier);

    const onPointerMove = (moveEv: PointerEvent) => {
      const deltaX = moveEv.clientX - resizeStartXRef.current;
      const deltaY = moveEv.clientY - resizeStartYRef.current;

      const stepX = 65;
      const xOffset = Math.round(deltaX / stepX);
      const newSpanIdx = Math.max(0, Math.min(SPAN_LEVELS.length - 1, initialSpanIdx + xOffset));
      setResizePreviewSpan(SPAN_LEVELS[newSpanIdx]);

      const stepY = 60;
      const yOffset = Math.round(deltaY / stepY);
      const newHeightIdx = Math.max(0, Math.min(HEIGHT_LEVELS.length - 1, initialHeightIdx + yOffset));
      setResizePreviewHeight(HEIGHT_LEVELS[newHeightIdx]);
    };

    const onPointerUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      const deltaX = upEv.clientX - resizeStartXRef.current;
      const deltaY = upEv.clientY - resizeStartYRef.current;

      setIsResizing(false);
      setResizePreviewSpan(null);
      setResizePreviewHeight(null);

      // Minimal movement (< 10px) acts as a click to toggle the Size Menu
      if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        setShowSizeMenu((prev) => !prev);
        return;
      }

      const stepX = 65;
      const stepY = 60;
      const xOffset = Math.round(deltaX / stepX);
      const yOffset = Math.round(deltaY / stepY);

      const finalSpanIdx = Math.max(0, Math.min(SPAN_LEVELS.length - 1, initialSpanIdx + xOffset));
      const finalHeightIdx = Math.max(0, Math.min(HEIGHT_LEVELS.length - 1, initialHeightIdx + yOffset));

      const finalSpan = SPAN_LEVELS[finalSpanIdx];
      const finalHeight = HEIGHT_LEVELS[finalHeightIdx];

      if (onChangeColSpan) onChangeColSpan(finalSpan);
      if (onChangeHeightMultiplier) onChangeHeightMultiplier(finalHeight);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const activeSpan = resizePreviewSpan || colSpan;
  const activeHeightMultiplier = resizePreviewHeight || heightMultiplier || 1;
  const activeHeightPx = getSegmentHeightPx(activeHeightMultiplier);
  const activeRowSpan = collapsed ? 1 : heightMultiplierToRowSpan(activeHeightMultiplier);

  // If this is an intentional spacer and user is NOT customizing, render completely empty space in the grid
  if (isSpacer && !isCustomizing) {
    return (
      <div
        id={`segment-${id}`}
        className={`pointer-events-none transition-all duration-200 h-full ${colSpanToClass(activeSpan)}`}
        style={{
          gridRow: `span ${activeRowSpan}`,
          minHeight: `${activeRowSpan * 185 + (activeRowSpan - 1) * 12}px`,
        }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      id={`segment-${id}`}
      draggable={isCustomizing}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group transition-all duration-200 w-full flex flex-col h-full ${colSpanToClass(activeSpan)} ${
        isDraggingSelf ? 'opacity-40 scale-[0.98]' : ''
      } ${
        isDragOver ? 'ring-2 ring-blue-500/80 rounded-2xl shadow-xl shadow-blue-500/10' : ''
      }`}
      style={{
        gridRow: `span ${activeRowSpan}`,
      }}
    >
      {/* Remove Button in Edit Mode */}
      {isCustomizing && (
        <button
          onClick={isSpacer && onRemoveSpacer ? onRemoveSpacer : onToggleVisibility}
          className="absolute -top-2.5 -left-2 z-30 w-6 h-6 rounded-full bg-zinc-800 text-zinc-300 hover:text-white hover:bg-red-500/90 border border-zinc-600 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
          title={isSpacer ? 'Delete empty space' : 'Remove widget from grid'}
        >
          <Minus size={13} strokeWidth={3} />
        </button>
      )}

      {/* Segment Header */}
      <div
        className={`flex items-center justify-between mb-1 px-0.5 gap-2 select-none shrink-0 ${
          isCustomizing ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {isCustomizing && (
            <div className="flex items-center text-zinc-400 opacity-60 group-hover:opacity-100 transition-opacity">
              <GripHorizontal size={14} />
            </div>
          )}

          {isSpacer ? (
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              <BoxSelect size={14} className="text-amber-400" />
              <span>Empty Space</span>
            </div>
          ) : (
            <h2
              className="text-base sm:text-lg font-bold tracking-tight theme-dynamic-text truncate"
              style={{ color: theme.tokens.foreground }}
            >
              {title}
            </h2>
          )}

          {/* Sizing Menu Trigger */}
          {isCustomizing && (
            <div className="relative shrink-0" ref={sizeMenuRef}>
              <button
                onClick={() => setShowSizeMenu(!showSizeMenu)}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 text-[10px] font-mono transition-colors cursor-pointer text-zinc-300 hover:text-white"
                title="Open Drag & Size Menu (Adjust Width & Height)"
              >
                <Move size={10} className="text-zinc-400" />
                <span className="font-semibold text-zinc-200">
                  {SPAN_LABELS[colSpan]} • {heightMultiplier}x
                </span>
                <ChevronDown size={11} className="text-zinc-500" />
              </button>

              {/* Popover Menu */}
              {showSizeMenu && (
                <div
                  className="absolute top-full left-0 mt-1.5 z-40 w-72 p-3.5 rounded-2xl bg-zinc-900/95 border border-zinc-700 shadow-2xl backdrop-blur-md text-xs font-mono space-y-3 animate-fade-in"
                  style={{
                    backgroundColor: `${theme.tokens.secondary}f5`,
                    borderColor: theme.tokens.border,
                  }}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                    <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
                      <Sliders size={13} className="text-amber-400" />
                      <span>{isSpacer ? 'Empty Space Sizing' : 'Widget Sizing Menu'}</span>
                    </div>
                    <button
                      onClick={() => setShowSizeMenu(false)}
                      className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </div>

                  {/* Width Controls */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Width (Columns):</span>
                      <span className="text-amber-400 font-bold">{SPAN_LABELS[colSpan]}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {SPAN_LEVELS.map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            if (onChangeColSpan) onChangeColSpan(s);
                          }}
                          className={`px-1.5 py-1 rounded-lg text-[10px] border transition-all cursor-pointer text-center ${
                            colSpan === s
                              ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-xs'
                              : 'bg-black/40 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                          }`}
                        >
                          {SPAN_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Height Controls */}
                  <div className="space-y-1.5 pt-1 border-t border-zinc-800/80">
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Height (Vertical Scale):</span>
                      <span className="text-amber-400 font-bold">{HEIGHT_LABELS[heightMultiplier as HeightMultiplier]}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {HEIGHT_LEVELS.map((h) => (
                        <button
                          key={h}
                          onClick={() => {
                            if (onChangeHeightMultiplier) onChangeHeightMultiplier(h);
                          }}
                          className={`px-1.5 py-1 rounded-lg text-[10px] border text-center transition-all cursor-pointer ${
                            heightMultiplier === h
                              ? 'bg-amber-500 text-black font-bold border-amber-400 shadow-xs'
                              : 'bg-black/40 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800'
                          }`}
                        >
                          {h}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                    <div className="text-[10px] text-zinc-500 uppercase font-semibold">Grid & Stacking Shortcuts</div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <button
                        onClick={() => {
                          if (onChangeColSpan) onChangeColSpan('full');
                        }}
                        className="px-2 py-1 rounded bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 transition-colors cursor-pointer font-semibold text-center"
                      >
                        Fill Row (100%)
                      </button>
                      <button
                        onClick={() => {
                          if (onChangeColSpan) onChangeColSpan('half');
                        }}
                        className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors cursor-pointer text-center"
                      >
                        50% Width (6 Cols)
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px] pt-1">
                      <button
                        onClick={() => {
                          if (onChangeHeightMultiplier) onChangeHeightMultiplier(1);
                        }}
                        className={`px-2 py-1 rounded border text-center transition-colors cursor-pointer ${
                          heightMultiplier === 1
                            ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        title="Standard 1-Unit Height (Stack 2 of these next to a 2-unit tall card)"
                      >
                        1 Unit (Stackable)
                      </button>
                      <button
                        onClick={() => {
                          if (onChangeHeightMultiplier) onChangeHeightMultiplier(2);
                        }}
                        className={`px-2 py-1 rounded border text-center transition-colors cursor-pointer ${
                          heightMultiplier === 2
                            ? 'bg-amber-500/30 border-amber-400 text-amber-200 font-bold'
                            : 'bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:bg-zinc-700'
                        }`}
                        title="Tall 2-Units Height (Allows 2 cells to stack directly to left or right)"
                      >
                        2 Units (Tall)
                      </button>
                    </div>
                  </div>

                  {isSpacer && onRemoveSpacer && (
                    <div className="pt-2 border-t border-zinc-800/80">
                      <button
                        onClick={onRemoveSpacer}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 text-xs transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>Delete Empty Space</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action & Collapse */}
        <div className="flex items-center gap-2 text-xs font-mono shrink-0">
          {rightAction}

          {!isSpacer && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title={collapsed ? 'Expand widget' : 'Collapse widget'}
            >
              {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          )}

          {isSpacer && isCustomizing && onRemoveSpacer && (
            <button
              onClick={onRemoveSpacer}
              className="p-1 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800/60 transition-colors cursor-pointer"
              title="Delete empty space block"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Segment Body Container */}
      {!collapsed && (
        <div
          className="relative flex-1 flex flex-col w-full h-full min-h-0 transition-all duration-200"
          style={{
            minHeight: `${Math.max(54, activeRowSpan * 62 + (activeRowSpan - 1) * 8 - 10)}px`,
          }}
        >
          {isSpacer ? (
            <div className="w-full h-full rounded-2xl border-2 border-dashed border-zinc-700/70 bg-zinc-950/30 flex flex-col items-center justify-center text-center p-4 select-none">
              <BoxSelect size={28} className="text-zinc-500 mb-2 opacity-70" />
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Empty Grid Space
              </div>
              <div className="text-[11px] text-zinc-500 font-mono mt-1">
                {SPAN_LABELS[activeSpan]} Width • {HEIGHT_LABELS[activeHeightMultiplier as HeightMultiplier]}
              </div>
              <div className="text-[10px] text-zinc-600 mt-2 max-w-xs">
                Visible only in edit mode • Drag corner or use sizing menu to customize whitespace
              </div>
            </div>
          ) : (
            children
          )}

          {/* Corner Drag-to-Resize Handle */}
          {isCustomizing && (
            <div
              onPointerDown={handleResizePointerDown}
              className="absolute bottom-1 right-1 z-20 w-7 h-7 flex items-end justify-end p-1.5 rounded-br-xl transition-all select-none cursor-nwse-resize opacity-95 bg-blue-600/90 hover:bg-blue-500 border-r-2 border-b-2 border-blue-300 shadow-lg"
              title="Drag corner to adjust BOTH Width and Height • Click to open Size Menu"
            >
              <div className="flex flex-col gap-0.5 items-end pointer-events-none">
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Resizing Floating Indicator */}
          {isResizing && (
            <div className="absolute inset-0 z-30 pointer-events-none rounded-2xl bg-black/40 backdrop-blur-[2px] border-2 border-dashed border-blue-400/80 flex items-center justify-center animate-fade-in">
              <div className="px-4 py-2.5 rounded-xl bg-zinc-900/95 border border-zinc-700 shadow-2xl text-xs font-mono text-blue-400 font-bold flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Width:</span>
                  <span className="text-white bg-blue-600/40 border border-blue-500/50 px-2 py-0.5 rounded">
                    {SPAN_LABELS[activeSpan]}
                  </span>
                </div>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-zinc-400">Height:</span>
                  <span className="text-amber-300 bg-amber-500/30 border border-amber-400/50 px-2 py-0.5 rounded">
                    {HEIGHT_LABELS[activeHeightMultiplier as HeightMultiplier]}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
