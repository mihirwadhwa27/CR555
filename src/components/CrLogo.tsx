/**
 * CircuitRunners Official Running Man Vector & Custom Logo Component
 * Team 1002 CircuitRunners • Wheeler High School
 * 
 * Authentic Green Running Man with Circuit Board Trail
 */

import React from 'react';

interface CrLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'runner' | 'chip' | 'auto';
  customUrl?: string;
  accentColor?: string;
  showTrail?: boolean;
}

export const CrLogo: React.FC<CrLogoProps> = ({
  size = 28,
  className = '',
  variant = 'runner',
  customUrl,
  accentColor = '#1fd655',
  showTrail = true,
}) => {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 28;

  // Custom image URL takes precedence if provided (e.g. uploaded in Settings)
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="Team 1002 CircuitRunners"
        width={numericSize}
        height={numericSize}
        className={`object-contain ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  // Official CircuitRunners Running Man with Circuit Board Traces
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 1000 1000"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-label="CircuitRunners Team 1002"
    >
      <defs>
        <filter id="crGlow" x="-15%" y="-15%" width="130%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="8" floodColor="#1fd655" floodOpacity="0.3" />
        </filter>
        <linearGradient id="crGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#25eb61" />
          <stop offset="100%" stopColor="#12c448" />
        </linearGradient>
      </defs>

      {/* Trailing Circuit Board Traces & Vias (Left Behind Runner) */}
      {showTrail && (
        <g stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
          {/* Upper Via & Trace */}
          <circle cx="304" cy="386" r="22" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="304" cy="386" r="8" fill="#94a3b8" />
          <path d="M 304 386 L 260 386 L 210 435 L 140 435" />
          <circle cx="140" cy="435" r="20" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="140" cy="435" r="7" fill="#94a3b8" />

          {/* Mid Upper Trace */}
          <circle cx="280" cy="505" r="20" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="280" cy="505" r="7" fill="#94a3b8" />
          <path d="M 280 505 L 340 505 L 415 440 L 450 440" />

          {/* Center Trace */}
          <circle cx="236" cy="548" r="20" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="236" cy="548" r="7" fill="#94a3b8" />
          <path d="M 236 548 L 315 548 L 380 495 L 430 495" />

          {/* Lower Main Trace */}
          <circle cx="185" cy="582" r="20" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="185" cy="582" r="7" fill="#94a3b8" />
          <path d="M 185 582 L 300 582 L 365 650 L 440 650" />

          {/* Bottom Left Via */}
          <circle cx="120" cy="638" r="22" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="120" cy="638" r="8" fill="#94a3b8" />
          <path d="M 120 638 L 220 638 L 285 700 L 360 700" />

          {/* Lowest Trace Under Back Foot */}
          <circle cx="215" cy="708" r="20" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="215" cy="708" r="7" fill="#94a3b8" />
          <path d="M 215 708 L 245 768 L 330 768 L 410 768" />

          {/* Bottom Sub-circuit */}
          <circle cx="438" cy="798" r="18" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="438" cy="798" r="6" fill="#94a3b8" />
          <path d="M 438 798 L 525 798 L 575 840 L 640 840" />
          <circle cx="640" cy="840" r="18" fill="#0b0d13" stroke="#94a3b8" strokeWidth="5" />
          <circle cx="640" cy="840" r="6" fill="#94a3b8" />
        </g>
      )}

      {/* CircuitRunners Green Running Figure */}
      <g fill="url(#crGreenGrad)" filter="url(#crGlow)">
        {/* Head */}
        <circle cx="668" cy="188" r="80" />

        {/* Running Body & Limbs */}
        <path
          d="
            M 480 274
            C 525 274, 600 286, 642 334
            C 662 356, 680 392, 696 422
            L 830 422
            C 864 422, 888 446, 888 468
            C 888 492, 864 515, 830 515
            L 700 515
            C 674 515, 650 495, 638 472
            L 588 385
            L 542 530
            L 705 778
            C 736 824, 730 864, 706 886
            C 680 910, 642 898, 614 860
            L 456 595
            L 450 670
            C 450 690, 435 706, 410 706
            L 290 706
            C 255 706, 235 682, 235 658
            C 235 632, 255 610, 290 610
            L 398 610
            L 404 492
            C 404 472, 414 454, 430 438
            L 472 384
            L 384 444
            C 356 462, 324 455, 308 432
            C 292 408, 300 378, 326 358
            L 435 288
            C 450 278, 465 274, 480 274
            Z
          "
        />
      </g>
    </svg>
  );
};
