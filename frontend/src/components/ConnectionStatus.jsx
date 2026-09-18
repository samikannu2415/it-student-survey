// src/components/ConnectionStatus.jsx
// Floating pill badge showing WebSocket connection health.

import React from 'react';
import { Wifi, WifiOff, Loader } from 'lucide-react';

const STATUS_CONFIG = {
  open: {
    icon:   <Wifi size={13} />,
    label:  'LIVE',
    color:  'text-success',
    border: 'border-success/40',
    bg:     'color-mix(in srgb, var(--success) 10%, transparent)',
    dot:    'bg-success animate-live-dot',
  },
  connecting: {
    icon:   <Loader size={13} className="animate-spin" />,
    label:  'CONNECTING',
    color:  'text-accent',
    border: 'border-accent/40',
    bg:     'color-mix(in srgb, var(--accent) 10%, transparent)',
    dot:    'bg-accent',
  },
  closed: {
    icon:   <WifiOff size={13} />,
    label:  'RECONNECTING',
    color:  'text-accent-4',
    border: 'border-accent-4/40',
    bg:     'color-mix(in srgb, var(--accent-4) 10%, transparent)',
    dot:    'bg-accent-4',
  },
  error: {
    icon:   <WifiOff size={13} />,
    label:  'OFFLINE',
    color:  'text-danger',
    border: 'border-danger/40',
    bg:     'color-mix(in srgb, var(--danger) 10%, transparent)',
    dot:    'bg-danger animate-live-dot',
  },
};

export default function ConnectionStatus({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.connecting;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold
                  transition-all duration-500 ${cfg.color} ${cfg.border}`}
      style={{ background: cfg.bg }}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.icon}
      <span className="hidden sm:inline">{cfg.label}</span>
    </div>
  );
}
