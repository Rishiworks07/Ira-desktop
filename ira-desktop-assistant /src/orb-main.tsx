/**
 * orb-main.tsx
 * Standalone entry point for the Floating Orb Electron window.
 * Renders the FloatingOrb in its own isolated window.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import OrbApp from './OrbApp';

const root = document.getElementById('orb-root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <OrbApp />
    </StrictMode>
  );
}
