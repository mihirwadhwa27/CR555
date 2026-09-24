/**
 * Modular Segment Layout Hook - Flexible Grid Framework
 * 
 * Rules:
 * - 12-column grid supporting widths from 1/6 up to 1 (full width):
 *   - 'sixth' (1/6 = 2 cols)
 *   - 'third' (1/3 = 4 cols)
 *   - 'half' (1/2 = 6 cols)
 *   - 'two-thirds' (2/3 = 8 cols)
 *   - 'five-sixths' (5/6 = 10 cols)
 *   - 'full' (1 = 12 cols)
 * - Flexible height multiplier on ALL widgets:
 *   - 0.5x (195px)
 *   - 0.75x (290px)
 *   - 1x (390px - standard default)
 *   - 1.5x (585px)
 *   - 2x (780px - expanded)
 */

import { useState, useEffect } from 'react';

export type ColSpan = 'sixth' | 'quarter' | 'third' | 'half' | 'two-thirds' | 'three-quarters' | 'five-sixths' | 'full';
export type HeightMultiplier = 0.5 | 0.75 | 1 | 1.5 | 2;

export interface SegmentConfig {
  id: string;
  title: string;
  colSpan: ColSpan;
  heightMultiplier?: HeightMultiplier;
  order: number;
  visible: boolean;
  collapsed?: boolean;
  isSpacer?: boolean;
}

export function colSpanToCols(colSpan: ColSpan): number {
  switch (colSpan) {
    case 'sixth':
      return 2;
    case 'quarter':
      return 3;
    case 'third':
      return 4;
    case 'half':
      return 6;
    case 'two-thirds':
      return 8;
    case 'three-quarters':
      return 9;
    case 'five-sixths':
      return 10;
    case 'full':
    default:
      return 12;
  }
}

export function colsToColSpan(cols: number): ColSpan {
  if (cols <= 2) return 'sixth';
  if (cols <= 3) return 'quarter';
  if (cols <= 4) return 'third';
  if (cols <= 6) return 'half';
  if (cols <= 8) return 'two-thirds';
  if (cols <= 9) return 'three-quarters';
  if (cols <= 10) return 'five-sixths';
  return 'full';
}

export function colSpanToClass(colSpan: ColSpan): string {
  switch (colSpan) {
    case 'sixth':
      return 'col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-2';
    case 'quarter':
      return 'col-span-12 sm:col-span-6 md:col-span-3';
    case 'third':
      return 'col-span-12 sm:col-span-6 md:col-span-4';
    case 'half':
      return 'col-span-12 sm:col-span-6 md:col-span-6';
    case 'two-thirds':
      return 'col-span-12 md:col-span-8';
    case 'three-quarters':
      return 'col-span-12 md:col-span-9';
    case 'five-sixths':
      return 'col-span-12 md:col-span-10';
    case 'full':
    default:
      return 'col-span-12';
  }
}

export function getSegmentHeightClass(colSpan?: ColSpan, heightMultiplier: HeightMultiplier | number = 1): string {
  if (heightMultiplier === 0.5) return 'h-[62px]';
  if (heightMultiplier === 0.75) return 'h-[95px]';
  if (heightMultiplier === 1.5) return 'h-[202px]';
  if (heightMultiplier === 2) return 'h-[272px]';
  return 'h-[132px]';
}

export function heightMultiplierToRowSpan(multiplier: HeightMultiplier | number = 1): number {
  if (multiplier <= 0.5) return 1;
  if (multiplier <= 0.75) return 1;
  if (multiplier <= 1) return 2;
  if (multiplier <= 1.5) return 3;
  return 4; // 2x tall = 4 row tracks (fits 2 stacked 1x cards beside it)
}

export function rowSpanToHeightMultiplier(rowSpan: number): HeightMultiplier {
  if (rowSpan <= 1) return 0.5;
  if (rowSpan === 2) return 1;
  if (rowSpan === 3) return 1.5;
  return 2;
}

export function getSegmentHeightPx(heightMultiplier: HeightMultiplier | number = 1): number {
  if (heightMultiplier === 0.5) return 62;
  if (heightMultiplier === 0.75) return 95;
  if (heightMultiplier === 1.5) return 202;
  if (heightMultiplier === 2) return 272;
  return 132;
}

export function useModularLayout(viewKey: string, initialDefaults: SegmentConfig[]) {
  const storageKey = `pitfusion_modular_layout_${viewKey}`;

  const [segments, setSegments] = useState<SegmentConfig[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: SegmentConfig[] = JSON.parse(saved);
        const merged = initialDefaults.map((def) => {
          const match = parsed.find((p) => p.id === def.id);
          return match ? { ...def, ...match } : def;
        });
        return merged.sort((a, b) => a.order - b.order);
      }
    } catch {
      // fallback
    }
    return initialDefaults.sort((a, b) => a.order - b.order);
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(segments));
    } catch {
      // ignore
    }
  }, [segments, storageKey]);

  const moveSegment = (id: string, direction: 'up' | 'down') => {
    setSegments((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;

      const updated = [...prev];
      const temp = updated[idx];
      updated[idx] = updated[targetIdx];
      updated[targetIdx] = temp;

      return updated.map((item, i) => ({ ...item, order: i }));
    });
  };

  const reorderSegments = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    setSegments((prev) => {
      const sourceIdx = prev.findIndex((s) => s.id === sourceId);
      const targetIdx = prev.findIndex((s) => s.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const item = prev[sourceIdx];
      const without = prev.filter((s) => s.id !== sourceId);
      without.splice(targetIdx, 0, item);

      return without.map((s, i) => ({ ...s, order: i }));
    });
  };

  const setSegmentColSpan = (id: string, colSpan: ColSpan) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, colSpan } : s))
    );
  };

  const setSegmentHeightMultiplier = (id: string, heightMultiplier: HeightMultiplier) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, heightMultiplier } : s))
    );
  };

  const toggleSegmentCollapse = (id: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, collapsed: !s.collapsed } : s))
    );
  };

  const toggleSegmentVisibility = (id: string) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const addSpacer = (colSpan: ColSpan = 'third', heightMultiplier: HeightMultiplier = 1) => {
    setSegments((prev) => {
      const newSpacer: SegmentConfig = {
        id: `spacer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: 'Empty Space',
        colSpan,
        heightMultiplier,
        order: prev.length,
        visible: true,
        isSpacer: true,
      };
      return [...prev, newSpacer];
    });
  };

  const removeSpacer = (id: string) => {
    setSegments((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  /**
   * Total Grid Filling Algorithm:
   * Examines visible segments in sequence and adjusts their colSpan
   * so that every row in the 12-column grid is 100% filled with 0 remainder columns.
   */
  const fillGrid = () => {
    setSegments((prev) => {
      const visible = prev.filter((s) => s.visible);
      const hidden = prev.filter((s) => !s.visible);

      if (visible.length === 0) return prev;

      // Group visible segments into rows based on column capacity
      const rows: SegmentConfig[][] = [];
      let currentRow: SegmentConfig[] = [];
      let currentCols = 0;

      for (const seg of visible) {
        const segCols = colSpanToCols(seg.colSpan);
        if (currentCols + segCols > 12 && currentRow.length > 0) {
          rows.push(currentRow);
          currentRow = [seg];
          currentCols = segCols;
        } else {
          currentRow.push(seg);
          currentCols += segCols;
        }
      }
      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      // For each row, stretch segments proportionally so the row sum is exactly 12 cols
      const filledVisible: SegmentConfig[] = [];
      for (const row of rows) {
        const count = row.length;
        if (count === 1) {
          filledVisible.push({ ...row[0], colSpan: 'full' });
        } else if (count === 2) {
          filledVisible.push({ ...row[0], colSpan: 'half' });
          filledVisible.push({ ...row[1], colSpan: 'half' });
        } else if (count === 3) {
          filledVisible.push({ ...row[0], colSpan: 'third' });
          filledVisible.push({ ...row[1], colSpan: 'third' });
          filledVisible.push({ ...row[2], colSpan: 'third' });
        } else if (count === 4) {
          filledVisible.push({ ...row[0], colSpan: 'quarter' });
          filledVisible.push({ ...row[1], colSpan: 'quarter' });
          filledVisible.push({ ...row[2], colSpan: 'quarter' });
          filledVisible.push({ ...row[3], colSpan: 'quarter' });
        } else {
          row.forEach((item) => {
            filledVisible.push({ ...item, colSpan: count >= 6 ? 'sixth' : 'quarter' });
          });
        }
      }

      const combined = [...filledVisible, ...hidden];
      return combined.map((s, idx) => ({ ...s, order: idx }));
    });
  };

  const resetToDefault = () => {
    setSegments(initialDefaults.sort((a, b) => a.order - b.order));
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  };

  const applyPreset = (preset: 'default' | 'equal' | 'stacked' | 'fill' | 'quad' | 'bento') => {
    if (preset === 'fill') {
      fillGrid();
      return;
    }
    setSegments((prev) => {
      if (preset === 'default') {
        return initialDefaults.sort((a, b) => a.order - b.order);
      }
      if (preset === 'bento') {
        // Bento preset: Tall cell (2 units) with two 1-unit cells stacked beside it
        return prev.map((s, idx) => {
          if (idx === 0) {
            return { ...s, colSpan: 'half', heightMultiplier: 2, visible: true, collapsed: false };
          }
          if (idx === 1 || idx === 2) {
            return { ...s, colSpan: 'half', heightMultiplier: 1, visible: true, collapsed: false };
          }
          return { ...s, colSpan: 'half', heightMultiplier: 1, visible: true, collapsed: false };
        });
      }
      if (preset === 'equal') {
        return prev.map((s) => ({ ...s, colSpan: 'third', heightMultiplier: 1, visible: true, collapsed: false }));
      }
      if (preset === 'quad') {
        return prev.map((s) => ({ ...s, colSpan: 'half', heightMultiplier: 1, visible: true, collapsed: false }));
      }
      if (preset === 'stacked') {
        return prev.map((s) => ({ ...s, colSpan: 'full', heightMultiplier: 1, visible: true, collapsed: false }));
      }
      return prev;
    });
  };

  return {
    segments,
    isCustomizing,
    setIsCustomizing,
    moveSegment,
    reorderSegments,
    setSegmentColSpan,
    setSegmentHeightMultiplier,
    toggleSegmentCollapse,
    toggleSegmentVisibility,
    addSpacer,
    removeSpacer,
    fillGrid,
    resetToDefault,
    applyPreset,
  };
}
