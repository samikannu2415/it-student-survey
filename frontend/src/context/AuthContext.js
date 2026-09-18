// src/context/AuthContext.js
// Mock auth context — Login/Signup stored in localStorage.
// Swap out with real JWT/OAuth later.

import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ag_user';

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = useCallback(async ({ email, password }) => {
    // Mock: any non-empty creds work. Store user info.
    if (!email.trim() || !password.trim()) throw new Error('Email and password are required');
    const mockUser = {
      id: btoa(email).replace(/=/g, ''),
      email: email.trim().toLowerCase(),
      username: email.split('@')[0],
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  }, []);

  const signup = useCallback(async ({ username, email, password }) => {
    if (!username.trim() || !email.trim() || !password.trim())
      throw new Error('All fields are required');
    if (password.length < 6) throw new Error('Password must be at least 6 characters');
    const mockUser = {
      id: btoa(email).replace(/=/g, ''),
      email: email.trim().toLowerCase(),
      username: username.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
      joinedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockUser));
    setUser(mockUser);
    return mockUser;
  }, []);

  const loginWithGoogle = useCallback(async (customProfile = null) => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    // 1. If a custom profile is passed directly, keep the existing local mock sign-in behavior.
    if (customProfile && customProfile.email) {
      const googleUser = {
        id: 'google_' + Math.random().toString(36).substring(2, 10),
        email: customProfile.email.trim().toLowerCase(),
        username: (customProfile.name || customProfile.email.split('@')[0]).trim(),
        avatar: customProfile.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customProfile.email)}`,
        provider: 'google',
        joinedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
      setUser(googleUser);
      return googleUser;
    }

    if (!clientId) {
      throw new Error('Please add REACT_APP_GOOGLE_CLIENT_ID in frontend/.env to enable real Google Login');
    }

    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      throw new Error('Google sign-in is still loading. Please try again in a moment.');
    }

    return new Promise((resolve, reject) => {
      let settled = false;

      const finish = (error, user) => {
        if (settled) return;
        settled = true;

        if (error) {
          reject(error);
          return;
        }

        resolve(user);
      };

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (!response || !response.credential) {
              finish(new Error('Google sign-in was cancelled'));
              return;
            }

            try {
              const payload = JSON.parse(
                decodeURIComponent(
                  atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
                    .split('')
                    .map((char) => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                )
              );

              const googleUser = {
                id: payload.sub || 'google_' + Math.random().toString(36).substring(2, 10),
                email: payload.email,
                username: payload.name || payload.email.split('@')[0],
                avatar: payload.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.email)}`,
                provider: 'google',
                joinedAt: new Date().toISOString(),
              };

              localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
              setUser(googleUser);
              finish(null, googleUser);
            } catch (err) {
              finish(new Error('Failed to read Google profile information.'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: false,
        });

        window.google.accounts.id.prompt((notification) => {
          if (notification && notification.isNotDisplayed()) {
            finish(new Error('Google sign-in popup was blocked. Please try again with a direct click.'));
          }
        });
      } catch (err) {
        finish(err);
      }
    });
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!email || !email.trim()) {
      throw new Error('Please enter your email address');
    }
    // Mock password reset request simulation delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    return true;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
