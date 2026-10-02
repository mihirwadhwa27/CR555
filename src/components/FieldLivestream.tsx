/**
 * Field Livestream Player Component
 * Automatically pulls from TBA webcasts + Option to add/switch YouTube Live or Twitch link
 * Defaults to YouTube Live for official FRC streams
 * Team 1002 CircuitRunners
 */

import React, { useState, useEffect } from 'react';
import { Tv, ExternalLink, Settings, Radio, Check, Link2, Youtube, Play, Film, RefreshCw } from 'lucide-react';
import { usePitState, Selectors } from '../store';

interface FieldLivestreamProps {
  compact?: boolean;
}

export const FieldLivestream: React.FC<FieldLivestreamProps> = ({ compact = false }) => {
  const theme = usePitState(Selectors.themeConfig);
  const activeEvent = usePitState(Selectors.activeEvent);

  // Default to YouTube Live
  const [streamType, setStreamType] = useState<'youtube' | 'twitch'>('youtube');
  const [streamIdOrUrl, setStreamIdOrUrl] = useState<string>('UCr_x7a303YmQ61V81kP0gqQ'); // Official FIRST Robotics channel
  const [customInput, setCustomInput] = useState<string>('');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [streamTitle, setStreamTitle] = useState<string>(
    activeEvent?.name ? `${activeEvent.name} • YouTube Live` : 'FRC Arena Field • YouTube Live'
  );

  // Automatically check & pull webcast from TBA event on mount/update (prioritize YouTube)
  useEffect(() => {
    if (activeEvent?.webcasts && activeEvent.webcasts.length > 0) {
      // Look for YouTube stream first
      const ytWebcast = activeEvent.webcasts.find((w) => w.type === 'youtube');
      if (ytWebcast && (ytWebcast.channel || (ytWebcast as any).file)) {
        const chan = (ytWebcast.channel || (ytWebcast as any).file || '').trim();
        setStreamType('youtube');
        setStreamIdOrUrl(chan || 'UCr_x7a303YmQ61V81kP0gqQ');
        setStreamTitle(ytWebcast.name || `${activeEvent.shortName || activeEvent.name} YouTube Live`);
      } else {
        const primaryWebcast = activeEvent.webcasts[0];
        const streamChannel = (primaryWebcast?.channel || (primaryWebcast as any)?.file || '').trim();
        if (primaryWebcast?.type === 'twitch') {
          setStreamType('twitch');
          setStreamIdOrUrl(streamChannel || 'firstinspires');
          setStreamTitle(primaryWebcast?.name || `${activeEvent.shortName || activeEvent.name} Twitch Live`);
        } else {
          setStreamType('youtube');
          setStreamIdOrUrl(streamChannel || 'UCr_x7a303YmQ61V81kP0gqQ');
          setStreamTitle(primaryWebcast?.name || `${activeEvent.shortName || activeEvent.name} Live Stream`);
        }
      }
    } else if (activeEvent?.name) {
      setStreamTitle(`${activeEvent.shortName || activeEvent.name} • YouTube Live`);
    }
  }, [activeEvent]);

  // Handle parsing user inputted link (Twitch URL or YouTube URL / Channel ID)
  const handleApplyCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const trimmed = customInput.trim();

    // YouTube parsing: youtube.com/watch?v=XYZ, youtu.be/XYZ, youtube.com/live/XYZ, or channel URL
    if (trimmed.includes('youtu.be/')) {
      const videoId = trimmed.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) {
        setStreamType('youtube');
        setStreamIdOrUrl(videoId);
        setStreamTitle(`YouTube Live: ${videoId}`);
        setShowConfig(false);
        setCustomInput('');
        return;
      }
    }

    if (trimmed.includes('youtube.com/watch')) {
      const urlParams = new URLSearchParams(trimmed.split('?')[1]);
      const v = urlParams.get('v');
      if (v) {
        setStreamType('youtube');
        setStreamIdOrUrl(v);
        setStreamTitle(`YouTube Live: ${v}`);
        setShowConfig(false);
        setCustomInput('');
        return;
      }
    }

    if (trimmed.includes('youtube.com/live/')) {
      const videoId = trimmed.split('youtube.com/live/')[1]?.split('?')[0];
      if (videoId) {
        setStreamType('youtube');
        setStreamIdOrUrl(videoId);
        setStreamTitle(`YouTube Live: ${videoId}`);
        setShowConfig(false);
        setCustomInput('');
        return;
      }
    }

    if (trimmed.includes('youtube.com/channel/')) {
      const channelId = trimmed.split('youtube.com/channel/')[1]?.split('/')[0]?.split('?')[0];
      if (channelId) {
        setStreamType('youtube');
        setStreamIdOrUrl(channelId);
        setStreamTitle(`YouTube Channel Live: ${channelId}`);
        setShowConfig(false);
        setCustomInput('');
        return;
      }
    }

    // Twitch parsing: twitch.tv/firstinspires or channel name
    if (trimmed.includes('twitch.tv/')) {
      const channel = trimmed.split('twitch.tv/')[1]?.split('?')[0]?.replace(/\//g, '');
      if (channel) {
        setStreamType('twitch');
        setStreamIdOrUrl(channel);
        setStreamTitle(`Twitch: ${channel}`);
        setShowConfig(false);
        setCustomInput('');
        return;
      }
    }

    // Fallback: If it's pure word without slash, assume YT ID or twitch channel
    if (!trimmed.includes('/') && !trimmed.includes('.')) {
      if (streamType === 'twitch') {
        setStreamIdOrUrl(trimmed);
        setStreamTitle(`Twitch: ${trimmed}`);
      } else {
        setStreamIdOrUrl(trimmed);
        setStreamTitle(`YouTube Live: ${trimmed}`);
      }
      setShowConfig(false);
      setCustomInput('');
    }
  };

  const getEmbedUrl = () => {
    const safeStreamId = (typeof streamIdOrUrl === 'string' ? streamIdOrUrl : '').trim() || 'UCr_x7a303YmQ61V81kP0gqQ';
    if (streamType === 'twitch') {
      const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      return `https://player.twitch.tv/?channel=${encodeURIComponent(safeStreamId)}&parent=${currentHost}&autoplay=true&muted=true`;
    }

    // YouTube: handle whether it's a channel ID or specific video ID
    if (safeStreamId.startsWith('UC') || safeStreamId.length > 15) {
      return `https://www.youtube.com/embed/live_stream?channel=${encodeURIComponent(safeStreamId)}&autoplay=1&mute=1&playsinline=1`;
    }
    return `https://www.youtube.com/embed/${encodeURIComponent(safeStreamId)}?autoplay=1&mute=1&playsinline=1&rel=0`;
  };

  return (
    <div
      className="w-full h-full rounded-2xl p-3 sm:p-4 border flex flex-col justify-between shadow-xs overflow-hidden"
      style={{
        backgroundColor: theme.tokens.secondary,
        borderColor: theme.tokens.border,
      }}
    >
      {/* Stream Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <span className="font-bold text-white uppercase tracking-wider truncate">
            {streamTitle}
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
            {streamType === 'twitch' ? 'TWITCH' : 'YT LIVE'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Configure Stream Source (YouTube Live / Twitch link or TBA auto-sync)"
          >
            <Settings size={13} />
          </button>
          <a
            href={
              streamType === 'twitch'
                ? `https://twitch.tv/${encodeURIComponent((typeof streamIdOrUrl === 'string' ? streamIdOrUrl : 'firstinspires').trim())}`
                : typeof streamIdOrUrl === 'string' && streamIdOrUrl.startsWith('UC')
                ? `https://youtube.com/channel/${encodeURIComponent(streamIdOrUrl.trim())}/live`
                : `https://youtube.com/watch?v=${encodeURIComponent((typeof streamIdOrUrl === 'string' ? streamIdOrUrl : 'UCr_x7a303YmQ61V81kP0gqQ').trim())}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded-md text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
            title="Open stream on YouTube / Twitch in new tab"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Configuration Popover / Overlay */}
      {showConfig && (
        <div className="my-2 p-3 rounded-xl bg-zinc-900 border border-zinc-700 space-y-2.5 text-xs font-mono animate-fade-in shrink-0">
          <div className="flex items-center justify-between text-zinc-300 font-bold">
            <span className="flex items-center gap-1.5">
              <Radio size={13} className="text-amber-400" />
              <span>Stream Source</span>
            </span>
            <span className="text-[10px] text-zinc-400">Default: YouTube Live</span>
          </div>

          {/* Type Selector */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => {
                setStreamType('youtube');
                setStreamIdOrUrl('UCr_x7a303YmQ61V81kP0gqQ');
                setStreamTitle('FIRST Robotics YouTube Live');
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                streamType === 'youtube'
                  ? 'bg-red-950/80 border-red-700 text-red-200 font-bold'
                  : 'bg-black/30 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Youtube size={13} />
              <span>YouTube Live</span>
            </button>
            <button
              onClick={() => {
                setStreamType('twitch');
                setStreamIdOrUrl('firstinspires');
                setStreamTitle('Twitch: firstinspires');
              }}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                streamType === 'twitch'
                  ? 'bg-purple-950/80 border-purple-700 text-purple-200 font-bold'
                  : 'bg-black/30 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio size={13} />
              <span>Twitch Live</span>
            </button>
          </div>

          {/* Quick TBA Webcasts from Event */}
          {activeEvent?.webcasts && activeEvent.webcasts.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 uppercase">Event Webcasts (TBA):</span>
              <div className="flex flex-wrap gap-1.5">
                {activeEvent.webcasts.map((wb, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setStreamType(wb.type === 'twitch' ? 'twitch' : 'youtube');
                      setStreamIdOrUrl(wb.channel);
                      setStreamTitle(wb.name || `${wb.type.toUpperCase()}: ${wb.channel}`);
                      setShowConfig(false);
                    }}
                    className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-mono flex items-center gap-1 border border-zinc-700 cursor-pointer"
                  >
                    <span>{wb.name || `${wb.type}: ${wb.channel}`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Link Input */}
          <form onSubmit={handleApplyCustomStream} className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Paste YouTube Live URL (youtube.com/...) or Twitch Link..."
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-black border border-zinc-700 text-zinc-200 text-xs font-mono focus:border-amber-400 outline-hidden"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs transition-colors cursor-pointer"
            >
              Apply
            </button>
          </form>
        </div>
      )}

      {/* Real Live Video Embed Screen */}
      <div className="w-full aspect-video max-h-[280px] sm:max-h-[320px] my-2 relative rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-inner flex flex-col mx-auto">
        <iframe
          src={getEmbedUrl()}
          title="Field Livestream"
          className="w-full h-full border-0 absolute inset-0 z-10"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      {/* Footer status */}
      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400 shrink-0">
        <span className="truncate">{activeEvent?.name || activeEvent?.shortName || 'Tournament'} • Field Livestream</span>
        <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ONLINE
        </span>
      </div>
    </div>
  );
};
