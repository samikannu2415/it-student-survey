// src/components/PollCard.jsx
// A single floating poll card with a polished, modern dashboard presentation.
// Displays a question, its options as interactive buttons, and live vote progress bars.

import React, { useState, useEffect, useRef } from 'react';
import { castVote } from '../api/polls';
import toast from 'react-hot-toast';

// Poll options cycle: accent → accent-2 → accent-3 → accent-4
const OPTION_COLORS = [
  {
    border:  'border-accent/50',
    text:    'text-accent',
    bar:     'bg-accent',
    ring:    'ring-accent/50',
    bgHover: 'hover:bg-accent/10',
    fill:    'color-mix(in srgb, var(--accent) 10%, transparent)',
  },
  {
    border:  'border-accent-2/50',
    text:    'text-accent-2',
    bar:     'bg-accent-2',
    ring:    'ring-accent-2/50',
    bgHover: 'hover:bg-accent-2/10',
    fill:    'color-mix(in srgb, var(--accent-2) 10%, transparent)',
  },
  {
    border:  'border-accent-3/50',
    text:    'text-accent-3',
    bar:     'bg-accent-3',
    ring:    'ring-accent-3/50',
    bgHover: 'hover:bg-accent-3/10',
    fill:    'color-mix(in srgb, var(--accent-3) 10%, transparent)',
  },
  {
    border:  'border-accent-4/50',
    text:    'text-accent-4',
    bar:     'bg-accent-4',
    ring:    'ring-accent-4/50',
    bgHover: 'hover:bg-accent-4/10',
    fill:    'color-mix(in srgb, var(--accent-4) 10%, transparent)',
  },
];

function ProgressBar({ percentage, colorClass, labelClass, label }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef(null);
  const prevRef = useRef(0);

  useEffect(() => {
    const target = percentage;
    const start  = prevRef.current;
    const duration = 700;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const t       = Math.min(elapsed / duration, 1);
      const ease    = 1 - Math.pow(1 - t, 3);
      const current = start + (target - start) * ease;
      setDisplayed(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [percentage]);

  return (
    <div className="space-y-1.5">
      <div className="progress-track">
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${colorClass} transition-none`}
          style={{ width: `${displayed}%` }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-60"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--text) 28%, transparent) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }}
          />
        </div>
      </div>
      <div className="flex justify-between text-xs font-mono">
        <span className={labelClass}>{label}</span>
        <span className="text-dim">{Math.round(displayed)}%</span>
      </div>
    </div>
  );
}

export default function PollCard({ poll, onVoted }) {
  const [voted, setVoted]       = useState(null);
  const [voting, setVoting]     = useState(false);
  const [localPoll, setLocalPoll] = useState(poll);

  useEffect(() => {
    setLocalPoll(poll);
  }, [poll]);

  const options = localPoll?.options || [];
  const totalVotes = options.reduce((s, o) => s + (o.votes || 0), 0);
  const maxVotes = options.reduce((m, o) => Math.max(m, o.votes || 0), 0);

  const handleVote = async (optionID) => {
    if (voted || voting) return;
    setVoting(true);

    try {
      if (localPoll?.id?.startsWith('demo-')) {
        const updated = {
          ...localPoll,
          options: localPoll.options.map((opt) =>
            opt.id === optionID ? { ...opt, votes: (opt.votes || 0) + 1 } : opt
          ),
        };
        setLocalPoll(updated);
        setVoted(optionID);
        onVoted?.(updated);
        toast.success('Vote cast! 🚀', { icon: '⚡' });
        return;
      }

      const updated = await castVote({ poll_id: localPoll.id, option_id: optionID });
      setLocalPoll(updated);
      setVoted(optionID);
      onVoted?.(updated);
      toast.success('Vote cast! 🚀', { icon: '⚡' });
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="glass-panel p-6 animate-float-in">
      <div className="flex items-start justify-between gap-3 mb-5">
        <h2
          className="font-display text-lg font-bold leading-tight text-text flex-1 min-w-0 text-left"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          {localPoll.question}
        </h2>
        <div className="live-badge shrink-0 animate-glow-pulse self-start">
          <span
            className="w-2 h-2 rounded-full bg-success animate-live-dot"
            aria-hidden="true"
          />
          LIVE
        </div>
      </div>

      <div className="divider-glow mb-5" />

      <div className="space-y-3 mb-6">
        {options.map((opt, idx) => {
          const color      = OPTION_COLORS[idx % OPTION_COLORS.length];
          const pct        = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
          const isSelected = voted === opt.id;
          const isLeading  = maxVotes > 0 && (opt.votes || 0) === maxVotes;

          return (
            <div key={opt.id} className="space-y-2">
              <button
                id={`vote-btn-${opt.id}`}
                onClick={() => handleVote(opt.id)}
                disabled={!!voted || voting}
                className={[
                  'w-full text-left px-4 py-3 rounded-xl text-sm font-semibold',
                  'border transition-all duration-300',
                  'flex items-center justify-between gap-3',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
                  color.border,
                  color.text,
                  color.bgHover,
                  voted
                    ? isSelected
                      ? `ring-2 ${color.ring} bg-surface-2`
                      : 'opacity-50 cursor-default'
                    : 'cursor-pointer hover:-translate-y-0.5 active:translate-y-0 hover:bg-surface-2',
                  isLeading ? 'glow-lead' : '',
                ].join(' ')}
                style={{
                  background: isSelected ? color.fill : undefined,
                  boxShadow: isLeading ? '0 0 24px rgba(124, 92, 255, 0.35)' : undefined,
                }}
              >
                <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
                  <span
                    className={`w-2.5 h-2.5 rounded-full border-2 ${color.border} ${
                      isSelected ? `bg-current ${color.text} animate-live-dot` : ''
                    } shrink-0`}
                  />
                  <span className="truncate sm:whitespace-normal break-words leading-snug">
                    {opt.text}
                  </span>
                </span>
                <span className="font-mono text-xs text-dim shrink-0">
                  {opt.votes.toLocaleString()} votes
                </span>
              </button>

              {voted && (
                <ProgressBar
                  percentage={pct}
                  colorClass={color.bar}
                  labelClass={color.text}
                  label={opt.text}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-dim font-mono">
        <span>
          {totalVotes.toLocaleString()} total votes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-live-dot" />
          Real-time
        </span>
      </div>
    </div>
  );
}
