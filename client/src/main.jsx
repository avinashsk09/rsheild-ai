import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ── Strict Zoom Lock (Desktop & Mobile) ──────────────────────────
if (typeof window !== 'undefined') {
  // 1. Block desktop wheel zoom (Ctrl + Mouse Wheel / Trackpad Pinch)
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 2. Block keyboard zoom shortcuts (Ctrl + Plus, Ctrl + Minus, Ctrl + 0)
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (
        e.key === '+' ||
        e.key === '-' ||
        e.key === '=' ||
        e.key === '_' ||
        e.key === '0' ||
        e.keyCode === 187 ||
        e.keyCode === 189 ||
        e.keyCode === 107 ||
        e.keyCode === 109 ||
        e.keyCode === 48 ||
        e.keyCode === 96
      ) {
        e.preventDefault();
      }
    }
  });

  // 3. Block iOS / Safari gesture zoom (gesturestart, gesturechange, gestureend)
  window.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
  window.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

  // 4. Block multi-touch pinch-to-zoom on touchscreens & mobile
  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // 5. Block mobile double-tap to zoom
  let lastTouchEnd = 0;
  window.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        // Only prevent default if not tapping an interactive form input
        const tag = (e.target && e.target.tagName) || '';
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);


