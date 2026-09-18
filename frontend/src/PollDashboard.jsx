// src/PollDashboard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Live Polling Dashboard
//
// Features:
//   • Landing header with quick poll creation and engagement stats.
//   • Top navigation bar with access and join buttons (modal triggers).
//   • User profile & avatar display when logged in.
//   • Real-time WebSocket vote syncing.
//   • Search & filter for polls.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap,
  RefreshCw,
  Radio,
  LogOut,
  LogIn,
  UserPlus,
  PlusCircle,
  TrendingUp,
  Search,
  Sparkles,
  BarChart3
} from 'lucide-react';

import { useWebSocket }     from './hooks/useWebSocket';
import { listPolls }        from './api/polls';
import PollCard             from './components/PollCard';
import CreatePollModal      from './components/CreatePollModal';
import ConnectionStatus     from './components/ConnectionStatus';
import AuthModal            from './components/AuthModal';
import { useAuth }          from './context/AuthContext';

// ─── Floating Particle Background ─────────────────────────────────────────
function Particles() {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full opacity-25"
          style={{
            width:  `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            left:   `${Math.random() * 100}%`,
            top:    `${Math.random() * 100}%`,
            background: i % 4 === 0 ? 'var(--accent)' : i % 4 === 1 ? 'var(--accent-2)' : i % 4 === 2 ? 'var(--accent-3)' : 'var(--accent-4)',
            animation: `float-bob ${4 + Math.random() * 5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────
function EmptyState({ onCreate }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-12 sm:py-16 gap-5 animate-float-in glass-panel p-6 sm:p-8 text-center">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full opacity-20 animate-spin-slow"
          style={{
            background: 'conic-gradient(from 0deg, var(--accent), var(--accent-2), var(--accent-3), var(--accent-4), var(--accent))',
          }}
        />
        <Radio size={32} className="text-accent relative z-10" />
      </div>

      <div className="space-y-1.5 max-w-md">
        <p
          className="text-xl font-bold text-text"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          NO ACTIVE POLLS YET
        </p>
        <p className="text-xs text-dim font-mono">
          Be the first to launch a question and watch live votes stream in real-time!
        </p>
      </div>

      <button
        id="empty-create-btn"
        onClick={onCreate}
        className="btn-neon-cyan px-7 py-3 font-display tracking-widest flex items-center gap-2"
        style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem' }}
      >
        <PlusCircle size={16} /> CREATE A POLL NOW
      </button>
    </div>
  );
}

const DEMO_POLL = {
  id: 'demo-poll-language-choice',
  question: 'Which coding language would you choose if you could learn only ONE?',
  options: [
    { id: 'python', text: 'Python 🐍', votes: 0 },
    { id: 'java', text: 'Java ☕', votes: 0 },
    { id: 'cpp', text: 'C++ ⚡', votes: 0 },
    { id: 'javascript', text: 'JavaScript 🌐', votes: 0 },
  ],
};

// ─── Poll Dashboard Component ─────────────────────────────────────────────
export default function PollDashboard() {
  const [polls, setPolls]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [authModalMode, setAuthModalMode]     = useState(null); // 'login' | 'signup' | null
  const [refreshing, setRefreshing]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterTab, setFilterTab]       = useState('all'); // 'all' | 'popular'

  const { user, logout }                = useAuth();
  const { message: wsMessage, status: wsStatus } = useWebSocket();

  // ── Fetch active polls ───────────────────────────────────────────────
  const fetchPolls = useCallback(async () => {
    try {
      const data = await listPolls();
      const nextPolls = Array.isArray(data) && data.length > 0 ? data : [DEMO_POLL];
      setPolls(nextPolls);
    } catch (err) {
      console.error('Failed to load polls:', err);
      setPolls([DEMO_POLL]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPolls(); }, [fetchPolls]);

  // ── Manual refresh ───────────────────────────────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPolls();
    setTimeout(() => setRefreshing(false), 500);
  };

  // ── WebSocket live update ────────────────────────────────────────────
  useEffect(() => {
    if (!wsMessage) return;
    const { poll_id, options } = wsMessage;
    if (!poll_id || !options) return;

    setPolls(prev =>
      prev.map(p =>
        (p.id === poll_id) ? { ...p, options } : p
      )
    );
  }, [wsMessage]);

  const handlePollCreated = useCallback((newPoll) => {
    setPolls(prev => [newPoll, ...prev]);
  }, []);

  const handleVoted = useCallback((updatedPoll) => {
    setPolls(prev => prev.map(p => p.id === updatedPoll.id ? updatedPoll : p));
  }, []);

  // Compute live global metrics
  const totalVotesAcrossAllPolls = useMemo(() => {
    return polls.reduce((sum, p) => {
      const pVotes = (p.options || []).reduce((s, o) => s + (o.votes || 0), 0);
      return sum + pVotes;
    }, 0);
  }, [polls]);

  // Filtered polls
  const displayedPolls = useMemo(() => {
    let result = [...polls];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.question?.toLowerCase().includes(q) ||
        p.options?.some(o => o.text?.toLowerCase().includes(q))
      );
    }
    if (filterTab === 'popular') {
      result.sort((a, b) => {
        const votesA = (a.options || []).reduce((s, o) => s + (o.votes || 0), 0);
        const votesB = (b.options || []).reduce((s, o) => s + (o.votes || 0), 0);
        return votesB - votesA;
      });
    }
    return result;
  }, [polls, searchQuery, filterTab]);

  return (
    <div className="relative min-h-screen z-10 flex flex-col">
      <Particles />

      {/* ── Top Navigation Bar (Menu Bar) ─────────────────────────────── */}
      <header
        className="sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between gap-2"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(148,163,184,0.3)',
          boxShadow: '0 8px 22px rgba(15, 23, 42, 0.04)',
        }}
      >
        {/* Brand Logo */}
        <div
          className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent), color-mix(in srgb, var(--accent-2) 22%, transparent))',
              border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
              boxShadow: '0 0 16px color-mix(in srgb, var(--accent) 28%, transparent)',
            }}
          >
            <Radio size={18} className="text-accent" />
          </div>
          <div>
            <h1
              className="text-base font-black tracking-widest text-slate-900"
              style={{
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              PULSEPOLL
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest -mt-1 hidden sm:block">LIVE OPINIONS</p>
          </div>
        </div>

        {/* Center/Right Nav Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <ConnectionStatus status={wsStatus} />

          <button
            id="refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-dim hover:text-accent transition-colors p-2 rounded-xl hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent/50"
            title="Refresh active polls"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>

          {/* "+ New Poll" CTA Button */}
          <button
            id="nav-create-poll-btn"
            onClick={() => setShowCreateModal(true)}
            className="btn-neon-cyan px-4 py-2 text-xs font-display tracking-widest flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-accent/50"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <PlusCircle size={14} />
            <span className="hidden sm:inline">CREATE POLL</span>
            <span className="sm:hidden">POLL</span>
          </button>

          {/* ── AUTH MENU BUTTONS ── */}
          {user ? (
            /* Logged in state */
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-border">
              <img
                src={user.avatar}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-accent/40 shadow-sm"
              />
              <span className="text-xs font-mono text-text hidden md:block max-w-[120px] truncate">
                {user.username}
              </span>
              <button
                id="logout-btn"
                onClick={logout}
                title="Log out"
                className="text-dim hover:text-danger transition-colors p-2 rounded-xl hover:bg-danger/10 focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-border">
              <button
                id="nav-login-btn"
                onClick={() => setAuthModalMode('login')}
                className="px-3 py-1.5 text-xs font-mono text-text hover:text-accent hover:bg-surface-2 rounded-lg transition-colors flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                <LogIn size={14} />
                <span className="hidden sm:inline">Access</span>
              </button>

              <button
                id="nav-signup-btn"
                onClick={() => setAuthModalMode('signup')}
                className="btn-neon-purple px-3.5 py-1.5 text-xs font-mono font-semibold tracking-wider flex items-center gap-1.5"
              >
                <UserPlus size={14} />
                <span className="hidden sm:inline">Join</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── HEROIC LANDING SECTION ───────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 py-8 md:py-16 text-center max-w-5xl mx-auto w-full space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono text-blue-700 bg-blue-50 border border-blue-100">
          <Sparkles size={14} className="text-blue-600" />
          <span>Real-time Polling Engine · Powered by WebSocket</span>
        </div>

        <h2
          className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight tracking-tight"
          style={{ fontFamily: "'Orbitron', sans-serif" }}
        >
          Create instant polls.{' '}
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
            }}
          >
            Gather live votes.
          </span>
        </h2>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
          Create customized polls in seconds, share with your audience, and watch live responses tally in real time.
        </p>

        {/* Hero Actions & Metrics */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-neon-cyan px-8 py-3.5 font-display text-sm tracking-widest flex items-center gap-2.5"
            style={{ fontFamily: "'Orbitron', sans-serif" }}
          >
            <Zap size={16} />
            CREATE A LIVE POLL
          </button>

          {!user && (
            <button
              onClick={() => setAuthModalMode('signup')}
              className="px-6 py-3.5 rounded-xl border border-border text-text hover:text-accent hover:border-accent/40 text-xs font-mono tracking-wider transition-all hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              Get started →
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto pt-6">
          <div className="glass-panel p-4 text-center">
            <p className="text-2xl font-bold font-mono text-blue-700">{polls.length}</p>
            <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Active Polls</p>
          </div>
          <div className="glass-panel p-4 text-center">
            <p className="text-2xl font-bold font-mono text-cyan-600">{totalVotesAcrossAllPolls.toLocaleString()}</p>
            <p className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Total Votes</p>
          </div>
        </div>
      </section>

      {/* ── POLLS LISTING SECTION ─────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 pb-20 flex-1 w-full space-y-6">
        
        {/* Section Header with Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <h3
              className="text-xl sm:text-2xl font-black text-text flex items-center gap-2"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <BarChart3 className="text-accent" size={22} />
              EXPLORE POLLS
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold text-accent bg-accent/10 border border-accent/25">
              {displayedPolls.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dim" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search polls..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs text-text placeholder:text-dim bg-surface border border-border outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-surface p-0.5 rounded-xl border border-border text-xs font-mono">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-lg transition-colors ${filterTab === 'all' ? 'bg-accent/20 text-accent font-bold' : 'text-dim hover:text-text'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab('popular')}
                className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 ${filterTab === 'popular' ? 'bg-accent-2/20 text-accent-2 font-bold' : 'text-dim hover:text-text'}`}
              >
                <TrendingUp size={12} /> Popular
              </button>
            </div>
          </div>
        </div>

        {/* Polls Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="glass-panel h-64 animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayedPolls.length === 0 ? (
              <EmptyState onCreate={() => setShowCreateModal(true)} />
            ) : (
              displayedPolls.map((poll, idx) => (
                <div
                  key={poll.id}
                  className="animate-float-in"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <PollCard
                    poll={poll}
                    onVoted={handleVoted}
                  />
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-border py-8 text-center text-xs text-dim font-mono">
        <p>PULSEPOLL LIVE POLLING PLATFORM · REAL-TIME WEBSOCKET · REACT & GO</p>
      </footer>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showCreateModal && (
        <CreatePollModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handlePollCreated}
        />
      )}

      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
        />
      )}
    </div>
  );
}
