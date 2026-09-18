// src/pages/AuthPage.jsx
// Live polling login / signup page with a clean corporate design.

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, User, Eye, EyeOff, Radio } from 'lucide-react';

// ─── Animated background particles ────────────────────────────────────────────
function AuthParticles() {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 4 === 0 ? 'var(--accent)' : i % 4 === 1 ? 'var(--accent-2)' : i % 4 === 2 ? 'var(--accent-3)' : 'var(--accent-4)',
            opacity: Math.random() * 0.4 + 0.1,
            animation: `float-bob ${4 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 6}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Floating input field ─────────────────────────────────────────────────────
function InputField({ id, label, type = 'text', value, onChange, placeholder, icon: Icon, accentColor = 'cyan', autoFocus = false }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword && showPw ? 'text' : type;

  const accent = {
    cyan:    { border: 'color-mix(in srgb, var(--accent) 50%, transparent)', glow: 'color-mix(in srgb, var(--accent) 50%, transparent)', text: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 6%, var(--surface-2))' },
    purple:  { border: 'color-mix(in srgb, var(--accent-2) 50%, transparent)', glow: 'color-mix(in srgb, var(--accent-2) 50%, transparent)', text: 'var(--accent-2)', bg: 'color-mix(in srgb, var(--accent-2) 6%, var(--surface-2))' },
    magenta: { border: 'color-mix(in srgb, var(--accent-3) 50%, transparent)', glow: 'color-mix(in srgb, var(--accent-3) 50%, transparent)', text: 'var(--accent-3)', bg: 'color-mix(in srgb, var(--accent-3) 6%, var(--surface-2))' },
  }[accentColor];

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-mono uppercase tracking-widest mb-2" style={{ color: accent.text, opacity: 0.7 }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: accent.text, opacity: 0.5 }}>
            <Icon size={16} />
          </div>
        )}
        <input
          id={id}
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full py-3 rounded-xl text-sm text-text placeholder:text-dim outline-none border transition-all duration-300"
          style={{
            paddingLeft: Icon ? '2.75rem' : '1rem',
            paddingRight: isPassword ? '3rem' : '1rem',
            background: accent.bg,
            borderColor: 'var(--border)',
          }}
          onFocus={e => {
            e.target.style.borderColor = accent.border;
            e.target.style.boxShadow = `0 0 0 2px ${accent.glow}`;
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--border)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(p => !p)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-text transition-colors"
            tabIndex={-1}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Google Icon ──────────────────────────────────────────────────────────────
function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

// ─── Main Auth Page ───────────────────────────────────────────────────────────
export default function AuthPage() {
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [mode, setMode]     = useState('login'); // 'login' | 'signup' | 'forgot'
  const [loading, setLoading] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup fields
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail]       = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirm, setSignupConfirm]   = useState('');

  // Forgot password fields
  const [forgotEmail, setForgotEmail]     = useState('');
  const [forgotSent, setForgotSent]       = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email: loginEmail, password: loginPassword });
      toast.success('Welcome back! 🚀', { icon: '⚡' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      toast.success(`Signed in as ${user.username} (${user.email})! 🚀`, { icon: '⚡' });
    } catch (err) {
      toast.error(err.message, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupPassword !== signupConfirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup({ username: signupUsername, email: signupEmail, password: signupPassword });
      toast.success('Account created! Welcome aboard 🛸');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotSent(true);
      toast.success('Password reset link sent to your email! 📩');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <AuthParticles />

      {/* Logo / Brand */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 22%, transparent), color-mix(in srgb, var(--accent-2) 22%, transparent))',
            border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
            boxShadow: '0 0 40px color-mix(in srgb, var(--accent) 30%, transparent)',
          }}
        >
          <Radio size={32} className="text-accent" />
        </div>
        <h1
          className="text-2xl font-black tracking-widest text-transparent bg-clip-text"
          style={{
            fontFamily: "'Orbitron', sans-serif",
            backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 50%, var(--accent-3) 100%)',
          }}
        >
          LIVEPOLL
        </h1>
        <p className="text-xs text-dim font-mono tracking-widest mt-1">LIVE POLLING PLATFORM</p>
      </div>

      {/* Card */}
      <div className="relative z-10 glass-panel w-full max-w-md p-8">

        {/* Tab switcher */}
        {mode !== 'forgot' && (
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {[
              { key: 'login', label: 'ACCESS' },
              { key: 'signup', label: 'CREATE' },
            ].map(tab => (
              <button
                key={tab.key}
                id={`auth-tab-${tab.key}`}
                onClick={() => setMode(tab.key)}
                className="flex-1 py-2.5 rounded-lg text-xs font-mono tracking-widest transition-all duration-300"
                style={
                  mode === tab.key
                    ? {
                        background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent-2) 18%, transparent))',
                        border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                        color: 'var(--accent)',
                        boxShadow: '0 0 20px color-mix(in srgb, var(--accent) 22%, transparent)',
                      }
                    : { color: 'var(--text-dim)', border: '1px solid transparent' }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* ── LOGIN FORM ── */}
        {mode === 'login' && (
          <form id="login-form" onSubmit={handleLogin} className="space-y-5">
            {/* Continue with Google button */}
            <button
              id="google-login-btn"
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl flex items-center justify-center gap-3 font-mono text-xs font-semibold text-text transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/50"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 15px color-mix(in srgb, var(--bg) 50%, transparent)',
              }}
            >
              <GoogleIcon className="w-5 h-5" />
              <span>CONTINUE WITH GOOGLE</span>
            </button>

            <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="shrink-0 px-1 text-[10px] font-mono tracking-widest text-dim">
                OR WITH EMAIL
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <InputField
              id="login-email"
              label="Email"
              type="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              placeholder="you@example.com"
              icon={Mail}
              accentColor="cyan"
              autoFocus
            />
            <InputField
              id="login-password"
              label="Password"
              type="password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              placeholder="••••••••"
              icon={Lock}
              accentColor="purple"
            />

            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setForgotSent(false);
                  setMode('forgot');
                }}
                className="text-xs font-mono text-dim hover:text-accent transition-colors"
              >
                Forgot password?
              </button>
            </div>

            <div className="divider-glow" />

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full btn-neon-cyan py-3.5 font-display tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem' }}
            >
              <Zap size={16} />
              {loading ? 'AUTHENTICATING…' : 'CONTINUE'}
            </button>

            <p className="text-center text-xs text-dim font-mono">
              No account?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="text-accent hover:text-accent-2 transition-colors"
              >
                Create
              </button>
            </p>
          </form>
        )}

        {/* ── FORGOT PASSWORD FORM ── */}
        {mode === 'forgot' && (
          <form id="forgot-form" onSubmit={handleForgot} className="space-y-5">
            <div>
              <h3
                className="text-lg font-bold tracking-wider text-accent mb-1"
                style={{ fontFamily: "'Orbitron', sans-serif" }}
              >
                RESET PASSWORD
              </h3>
              <p className="text-xs text-dim font-mono leading-relaxed">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            {forgotSent ? (
              <div
                className="p-4 rounded-xl text-center space-y-3"
                style={{ background: 'color-mix(in srgb, var(--success) 8%, var(--surface-2))', border: '1px solid color-mix(in srgb, var(--success) 35%, transparent)' }}
              >
                <div className="text-2xl">📩</div>
                <p className="text-xs font-mono text-text leading-relaxed">
                  A reset link has been dispatched to <span className="text-accent font-bold">{forgotEmail}</span>. Check your inbox!
                </p>
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="w-full btn-neon-cyan py-2 text-xs font-mono tracking-widest mt-2"
                >
                  BACK TO ACCESS
                </button>
              </div>
            ) : (
              <>
                <InputField
                  id="forgot-email"
                  label="Registered Email"
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  icon={Mail}
                  accentColor="cyan"
                  autoFocus
                />

                <div className="divider-glow" />

                <button
                  id="forgot-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full btn-neon-cyan py-3.5 font-display tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem' }}
                >
                  <Zap size={16} />
                  {loading ? 'SENDING LINK…' : 'SEND RESET LINK'}
                </button>

                <p className="text-center text-xs text-dim font-mono">
                  Remember your password?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-accent hover:text-accent-2 transition-colors"
                  >
                    Back to access
                  </button>
                </p>
              </>
            )}
          </form>
        )}

        {/* ── SIGNUP FORM ── */}
        {mode === 'signup' && (
          <form id="signup-form" onSubmit={handleSignup} className="space-y-4">
            <InputField
              id="signup-username"
              label="Username"
              value={signupUsername}
              onChange={e => setSignupUsername(e.target.value)}
              placeholder="Your username"
              icon={User}
              accentColor="cyan"
              autoFocus
            />
            <InputField
              id="signup-email"
              label="Email"
              type="email"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              placeholder="you@example.com"
              icon={Mail}
              accentColor="purple"
            />
            <InputField
              id="signup-password"
              label="Password"
              type="password"
              value={signupPassword}
              onChange={e => setSignupPassword(e.target.value)}
              placeholder="Min. 6 characters"
              icon={Lock}
              accentColor="magenta"
            />
            <InputField
              id="signup-confirm"
              label="Confirm Password"
              type="password"
              value={signupConfirm}
              onChange={e => setSignupConfirm(e.target.value)}
              placeholder="Repeat password"
              icon={Lock}
              accentColor="magenta"
            />

            <div className="divider-glow" />

            <button
              id="signup-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full btn-neon-purple py-3.5 font-display tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.8rem' }}
            >
              <Zap size={16} />
              {loading ? 'CREATING…' : 'CREATE'}
            </button>

            <p className="text-center text-xs text-dim font-mono">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-accent hover:text-accent-2 transition-colors"
              >
                Access
              </button>
            </p>
          </form>
        )}
      </div>

      {/* Bottom tagline */}
      <p className="relative z-10 mt-8 text-xs text-dim font-mono tracking-widest text-center">
        REAL-TIME POLLS · ZERO ADS · PRIVACY-FIRST
      </p>
    </div>
  );
}
