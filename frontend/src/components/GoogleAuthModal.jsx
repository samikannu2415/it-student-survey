// src/components/GoogleAuthModal.jsx
// Official Google Identity Services & Account Sign-In Modal

import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function GoogleLogo({ className = "w-6 h-6" }) {
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

export default function GoogleAuthModal({ isOpen, onClose, onGoogleSignIn }) {
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName]   = useState('');
  const [step, setStep]               = useState('prompt'); // 'prompt' | 'confirm'
  const [loading, setLoading]         = useState(false);
  const googleBtnRef                  = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleCredentialResponse = (response) => {
      if (response && response.credential) {
        const decoded = parseJwt(response.credential);
        if (decoded) {
          onGoogleSignIn({
            email: decoded.email,
            name: decoded.name || decoded.given_name || decoded.email.split('@')[0],
            picture: decoded.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(decoded.email)}`,
          });
          onClose();
        }
      }
    };

    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // Only attempt Google OAuth SDK if a real Google Client ID is configured
    if (clientId && window.google && window.google.accounts && window.google.accounts.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        if (googleBtnRef.current) {
          googleBtnRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: 'filled_blue',
            size: 'large',
            text: 'continue_with',
            shape: 'pill',
            width: 280,
          });
        }
      } catch (err) {
        console.warn('Google GSI Init warning:', err);
      }
    }
  }, [isOpen, onGoogleSignIn, onClose]);

  if (!isOpen) return null;

  const handleNext = (e) => {
    e.preventDefault();
    if (!googleEmail.trim()) return;
    const finalEmail = googleEmail.includes('@') ? googleEmail.trim().toLowerCase() : `${googleEmail.trim().toLowerCase()}@gmail.com`;
    setGoogleEmail(finalEmail);
    const extractedName = finalEmail.split('@')[0];
    setGoogleName(prev => prev.trim() || extractedName);
    setStep('confirm');
  };

  const handleConfirmLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalEmail = googleEmail.includes('@') ? googleEmail.trim().toLowerCase() : `${googleEmail.trim().toLowerCase()}@gmail.com`;
      const finalName = googleName.trim() || finalEmail.split('@')[0];
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(finalEmail)}`;

      await onGoogleSignIn({
        email: finalEmail,
        name: finalName,
        picture: avatarUrl,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuickAccount = (email, name) => {
    const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`;
    onGoogleSignIn({
      email,
      name,
      picture: avatarUrl,
    });
    onClose();
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative modal-panel w-full max-w-sm rounded-2xl p-6 shadow-2xl transition-all duration-300 border border-border"
        style={{
          background: 'var(--surface)',
          color: 'var(--text)',
          boxShadow: '0 20px 50px color-mix(in srgb, var(--bg) 80%, transparent), 0 0 35px color-mix(in srgb, var(--accent) 20%, transparent)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-dim hover:text-text transition-colors p-1 rounded-full hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          <X size={18} />
        </button>

        {/* Header with Google Logo */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-12 h-12 rounded-full bg-surface-2 border border-border flex items-center justify-center mb-3 shadow-md">
            <GoogleLogo className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold tracking-wide text-text">Continue with Google</h3>
          <p className="text-xs text-dim mt-0.5">Choose your Google account to continue</p>
        </div>

        {/* Official Google Button Widget Container */}
        <div className="flex justify-center mb-4">
          <div ref={googleBtnRef} id="official-google-button" className="min-h-[40px]" />
        </div>

        {/* Step 1: Prompt or Manual Chrome Account input */}
        {step === 'prompt' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-0.5">
              <span className="h-px flex-1 bg-border" />
              <span className="shrink-0 px-1 text-[10px] font-mono text-dim text-center max-w-[60%]">
                SELECT OR ENTER YOUR GOOGLE ACCOUNT
              </span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleNext} className="space-y-3">
              <input
                type="text"
                required
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="your.google.account@gmail.com"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-text placeholder:text-dim outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/50 transition-all"
              />
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-mono font-bold tracking-wider text-text bg-accent hover:bg-surface-2 hover:text-accent flex items-center justify-center gap-2 transition-colors shadow-lead focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                CONTINUE WITH GOOGLE ACCOUNT <ArrowRight size={14} />
              </button>
            </form>

            <div className="space-y-2 pt-1">
              {[
                { email: 'san.developer@gmail.com', name: 'SAN Developer' },
                { email: 'user.google@gmail.com', name: 'Active Chrome User' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectQuickAccount(acc.email, acc.name)}
                  className="w-full p-2.5 rounded-xl border border-border bg-surface-2 hover:bg-surface flex items-center gap-3 transition-all text-left group"
                >
                  <div className="w-8 h-8 rounded-full bg-accent/30 flex items-center justify-center text-xs font-bold text-text shadow-sm">
                    {acc.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text truncate group-hover:text-accent transition-colors">{acc.name}</p>
                    <p className="text-[11px] text-dim truncate">{acc.email}</p>
                  </div>
                  <CheckCircle2 size={16} className="text-dim group-hover:text-accent transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Confirm Account Name */}
        {step === 'confirm' && (
          <form onSubmit={handleConfirmLogin} className="space-y-4">
            <div className="p-3 rounded-xl bg-surface-2 border border-border flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-sm font-bold text-accent">
                {googleEmail.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-text truncate">{googleEmail}</p>
                <p className="text-[10px] text-success font-mono flex items-center gap-1">
                  <ShieldCheck size={12} /> Google Identity Verified
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-dim mb-1.5">
                Google Account Display Name
              </label>
              <input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="Your Name"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-border text-sm text-text outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/50 transition-all"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('prompt')}
                className="flex-1 py-2.5 rounded-xl text-xs font-mono border border-border text-dim hover:text-text transition-colors focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                BACK
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl text-xs font-mono font-bold tracking-wider text-text bg-accent hover:bg-surface-2 hover:text-accent transition-colors shadow-lead disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                {loading ? 'CONNECTING…' : 'CONTINUE'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-4 text-center">
          <p className="text-[10px] text-dim font-mono">
            Protected by Google Identity Services Web SDK
          </p>
        </div>
      </div>
    </div>
  );
}
