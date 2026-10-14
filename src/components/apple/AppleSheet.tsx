import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface AppleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  detent?: 'medium' | 'large' | 'full';
  showGrabber?: boolean;
  className?: string;
}

/**
 * Apple Human Interface Guidelines Sheet Detent Component
 * Features:
 * - Fluid slide-up animation with spring curve
 * - Inset grabber handle pill
 * - Translucent vibrancy material with backdrop blur
 * - Keyboard (Escape) & click-outside dismissal
 */
export const AppleSheet: React.FC<AppleSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  detent = 'medium',
  showGrabber = true,
  className = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const detentHeight = {
    medium: 'max-h-[60vh]',
    large: 'max-h-[85vh]',
    full: 'max-h-[96vh]',
  }[detent];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl bg-zinc-950/90 border border-white/15 text-white shadow-2xl backdrop-blur-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${detentHeight} ${className}`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Grabber Handle */}
        {showGrabber && (
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/25 hover:bg-white/40 transition-colors cursor-grab" />
          </div>
        )}

        {/* Header Bar */}
        {(title || subtitle) && (
          <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
            <div>
              {title && <h3 className="font-extrabold text-base tracking-tight text-white">{title}</h3>}
              {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};
