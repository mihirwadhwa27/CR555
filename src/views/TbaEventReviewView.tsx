/**
 * Event Review (The Blue Alliance) View - Maximum Webpage Viewport
 * Team 1002 CircuitRunners • Wheeler High School
 */

import React, { useState } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Globe,
  Radio,
  Maximize2,
  Minimize2,
  Layers,
  Award,
  ListOrdered,
  Calendar,
  Tv,
} from 'lucide-react';
import { usePitState, Selectors } from '../store';
import { useModularLayout, SegmentConfig } from '../hooks/useModularLayout';
import { ModularSegment } from '../components/ModularSegment';
import { ModularLayoutToolbar } from '../components/ModularLayoutToolbar';

const DEFAULT_SEGMENTS: SegmentConfig[] = [
  {
    id: 'tba_portal',
    title: 'The Blue Alliance Event Portal',
    colSpan: 'full',
    heightMultiplier: 2,
    order: 0,
    visible: true,
  },
];

type TbaSection = 'overview' | 'matches' | 'rankings' | 'playoffs' | 'insights' | 'webcasts';

export const TbaEventReviewView: React.FC = () => {
  const theme = usePitState(Selectors.themeConfig);
  const activeEvent = usePitState(Selectors.activeEvent);

  const eventKey = activeEvent?.key || '2026gacmp';
  const [activeSection, setActiveSection] = useState<TbaSection>('overview');
  const [useBeta, setUseBeta] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState(0);

  const getBaseDomain = () => (useBeta ? 'beta.thebluealliance.com' : 'www.thebluealliance.com');

  const getTbaUrl = () => {
    const domain = getBaseDomain();
    switch (activeSection) {
      case 'matches':
        return `https://${domain}/event/${eventKey}#matches`;
      case 'rankings':
        return `https://${domain}/event/${eventKey}#rankings`;
      case 'playoffs':
        return `https://${domain}/event/${eventKey}#playoffs`;
      case 'insights':
        return `https://${domain}/event/${eventKey}#insights`;
      case 'webcasts':
        return `https://${domain}/event/${eventKey}#webcasts`;
      default:
        return `https://${domain}/event/${eventKey}`;
    }
  };

  const currentUrl = getTbaUrl();

  const reloadIframe = () => {
    setIframeKey((prev) => prev + 1);
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
  } = useModularLayout('tba_review', DEFAULT_SEGMENTS);

  const visibleSegments = segments.filter((s) => s.visible);

  return (
    <div id="tba-event-review-view" className="space-y-2 animate-fade-in pb-4">
      {/* Compact Top Control Bar */}
      <div
        className="rounded-xl px-3 py-2 border shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs font-mono"
        style={{
          backgroundColor: theme.tokens.secondary,
          borderColor: theme.tokens.border,
        }}
      >
        {/* Left: Event Title & Domain Toggle */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Globe size={15} />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-white text-xs">
              {activeEvent?.name || 'Peachtree District Championship'}
            </span>
            <span className="text-[10px] text-zinc-400 font-bold">({eventKey})</span>
            <button
              onClick={() => setUseBeta(!useBeta)}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-colors cursor-pointer"
              title="Click to toggle between TBA Beta and Classic TBA"
            >
              {useBeta ? 'TBA Beta' : 'TBA Classic'}
            </button>
          </div>
        </div>

        {/* Middle: Fast Section Jump Links */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: <Layers size={11} /> },
            { id: 'matches', label: 'Matches', icon: <Calendar size={11} /> },
            { id: 'rankings', label: 'Rankings', icon: <ListOrdered size={11} /> },
            { id: 'playoffs', label: 'Playoffs', icon: <Award size={11} /> },
            { id: 'webcasts', label: 'Webcasts', icon: <Tv size={11} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSection(tab.id as TbaSection);
                setIframeKey((prev) => prev + 1);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions (Maximize, Reload, Open External) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors cursor-pointer ${
              isFullscreen
                ? 'bg-amber-400 text-black font-bold border-amber-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title={isFullscreen ? 'Exit Maximize View' : 'Maximize to full viewport height'}
          >
            {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isFullscreen ? 'Compact' : 'Maximize'}</span>
          </button>

          <button
            onClick={reloadIframe}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-xs font-mono cursor-pointer"
            title="Reload The Blue Alliance Frame"
          >
            <RefreshCw size={12} />
            <span>Reload</span>
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-xs"
            title="Open in new browser tab"
          >
            <span>Open TBA</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Modular Layout Bar */}
      {!isFullscreen && (
        <ModularLayoutToolbar
          viewName="Event Portal"
          isCustomizing={isCustomizing}
          onToggleCustomizing={() => setIsCustomizing(!isCustomizing)}
          segments={segments}
          onToggleVisibility={toggleSegmentVisibility}
          onResetToDefault={resetToDefault}
          onApplyPreset={applyPreset}
        />
      )}

      {/* Main TBA Portal Frame */}
      {isFullscreen ? (
        <div
          className="w-full rounded-2xl border shadow-xl overflow-hidden bg-zinc-950 flex flex-col"
          style={{
            height: 'calc(100vh - 130px)',
            borderColor: theme.tokens.border,
          }}
        >
          <iframe
            key={iframeKey}
            src={currentUrl}
            title={`The Blue Alliance - ${eventKey}`}
            className="w-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
          />
        </div>
      ) : (
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
              <div
                className="w-full h-full rounded-2xl border shadow-xs overflow-hidden bg-zinc-950 flex flex-col min-h-[700px]"
                style={{ borderColor: theme.tokens.border }}
              >
                <iframe
                  key={iframeKey}
                  src={currentUrl}
                  title={`The Blue Alliance - ${eventKey}`}
                  className="w-full flex-1 border-0 min-h-[680px]"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
                />
              </div>
            </ModularSegment>
          ))}
        </div>
      )}
    </div>
  );
};
