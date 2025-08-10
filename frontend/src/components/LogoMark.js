import React from 'react';

export default function LogoMark({ size = 28 }) {
  return (
    <div
      aria-label="RealtimeResume"
      className="inline-flex items-center justify-center rounded-xl shadow-card ring-1 ring-black/5 overflow-hidden"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="rrGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#b97a43"/>
            <stop offset="100%" stopColor="#7d4c2b"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="32" height="32" rx="9" fill="#faf7f2"/>
        <rect x="1" y="1" width="30" height="30" rx="8" fill="url(#rrGrad)" opacity="0.12"/>
        <text x="50%" y="57%" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="14" fontWeight="700" fill="#7d4c2b">RR</text>
      </svg>
    </div>
  );
}
