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

    // 1. If Google Client ID is configured, trigger official Google OAuth Popup
    if (clientId && window.google && window.google.accounts && window.google.accounts.oauth2) {
      return new Promise((resolve, reject) => {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse && tokenResponse.access_token) {
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                  });
                  const profile = await res.json();
                  const googleUser = {
                    id: profile.sub || 'google_' + Math.random().toString(36).substring(2, 10),
                    email: profile.email,
                    username: profile.name || profile.email.split('@')[0],
                    avatar: profile.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile.email)}`,
                    provider: 'google',
                    joinedAt: new Date().toISOString(),
                  };
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(googleUser));
                  setUser(googleUser);
                  resolve(googleUser);
                } catch (err) {
                  reject(new Error('Failed to fetch Google profile: ' + err.message));
                }
              } else {
                reject(new Error('Google sign-in was cancelled'));
              }
            },
            error_callback: (error) => {
              reject(new Error(error.message || 'Google OAuth failed'));
            },
          });
          client.requestAccessToken();
        } catch (err) {
          reject(err);
        }
      });
    }

    // 2. If user passed custom profile directly
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

    // 3. If no Client ID configured
    throw new Error('Please add REACT_APP_GOOGLE_CLIENT_ID in frontend/.env to enable real Google Login');
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
