/**
 * OrbApp.tsx
 * Root component for the standalone Floating Orb Electron window.
 * Loads user config from localStorage and renders the orb.
 */
import { useState, useEffect } from 'react';
import { IraConfig, DEFAULT_CONFIG } from './types';
import StandaloneOrb from './components/StandaloneOrb';

export default function OrbApp() {
  const [config, setConfig] = useState<IraConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    let cleanupListener: (() => void) | undefined;

    async function loadConfig() {
      if (window.electronAPI) {
        const settings = await window.electronAPI.loadSettings();
        if (settings) {
          setConfig({ ...DEFAULT_CONFIG, ...settings });
        }
        
        // Listen for live updates from Settings Panel
        cleanupListener = window.electronAPI.onSettingsUpdated((newSettings) => {
          setConfig({ ...DEFAULT_CONFIG, ...newSettings });
        });
      }
      const storedConfig = localStorage.getItem('ira_config');
      if (storedConfig && !window.electronAPI) {
        try { setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) }); } catch { /* use default */ }
      }
    }
    
    loadConfig();

    return () => {
      if (cleanupListener) cleanupListener();
    };
  }, []);

  return <StandaloneOrb config={config} />;
}
