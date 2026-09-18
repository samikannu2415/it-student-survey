// src/App.js
// Root App — always renders PollDashboard as the heroic home page.
// Access and create-account modals are available from the navigation menu bar.

import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PollDashboard from './PollDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 20px color-mix(in srgb, var(--accent) 12%, transparent)',
          },
          success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--surface)' } },
          error:   { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface)' } },
        }}
      />
      <PollDashboard />
    </AuthProvider>
  );
}
