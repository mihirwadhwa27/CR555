import React, { useRef, useEffect, useState } from 'react';

export interface AppleSegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

interface AppleSegmentedControlProps<T extends string> {
  options: AppleSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Apple Human Interface Guidelines Sliding Segmented Control
 * Features:
 * - Fluid sliding indicator with CSS transition
 * - Inset tactile backdrop with subtle specular border
 * - Tabular numbers and SF Pro typography conventions
 * - Haptic active press feedback
 */
export function AppleSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
  ariaLabel = 'Segmented options',
}: AppleSegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const activeIndex = options.findIndex((opt) => opt.id === value);

  useEffect(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll<HTMLButtonElement>('[data-segment-btn]');
    const activeBtn = buttons[activeIndex];
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
      });
    }
  }, [activeIndex, options, size]);

  const sizeClasses = {
    sm: 'text-xs py-1 px-2.5 gap-1',
    md: 'text-xs py-1.5 px-3 gap-1.5',
    lg: 'text-sm py-2 px-4 gap-2',
  }[size];

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center p-1 rounded-xl bg-black/60 border border-white/10 backdrop-blur-md select-none ${
        fullWidth ? 'w-full justify-between' : ''
      } ${className}`}
      style={{
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.05)',
      }}
    >
      {/* Sliding Active Pill Indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-zinc-800/95 border border-white/15 shadow-md pointer-events-none transition-all duration-200 ease-out"
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      />

      {/* Segment Buttons */}
      {options.map((option, idx) => {
        const isActive = option.id === value;
        return (
          <button
            key={option.id}
            data-segment-btn
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`relative z-10 flex items-center justify-center font-semibold tracking-tight transition-colors whitespace-nowrap cursor-pointer rounded-lg ${
              fullWidth ? 'flex-1' : ''
            } ${sizeClasses} ${
              isActive
                ? 'text-white font-bold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]'
            }`}
          >
            {option.icon && (
              <span className={`shrink-0 transition-opacity ${isActive ? 'opacity-100 text-amber-400' : 'opacity-70'}`}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold ${
                  option.badgeColor || (isActive ? 'bg-amber-400/20 text-amber-300' : 'bg-zinc-800 text-zinc-400')
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
