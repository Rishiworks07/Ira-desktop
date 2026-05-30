/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import DesktopEnv from './components/DesktopEnv';
import { IraConfig, DEFAULT_CONFIG } from './types';

export default function App() {
  const [config, setConfig] = useState<IraConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      if (window.electronAPI) {
        const settings = await window.electronAPI.loadSettings();
        if (settings && settings.onboarded) {
          // Merge with DEFAULT_CONFIG to ensure new properties exist
          const mergedConfig = { ...DEFAULT_CONFIG, ...settings };
          setConfig(mergedConfig);
        }
      } else {
        // Fallback for browser dev mode
        const onboarded = localStorage.getItem('ira_onboarded') === 'true';
        const storedConfig = localStorage.getItem('ira_config');
        if (onboarded && storedConfig) {
          try { setConfig(JSON.parse(storedConfig)); } catch (e) { localStorage.removeItem('ira_onboarded'); }
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  const handleOnboardingComplete = (newConfig: IraConfig) => {
    if (window.electronAPI) {
      window.electronAPI.saveSettings(newConfig);
    } else {
      localStorage.setItem('ira_onboarded', 'true');
      localStorage.setItem('ira_config', JSON.stringify(newConfig));
    }
    setConfig(newConfig);
  };

  const handleLogout = () => {
    if (window.electronAPI) {
      window.electronAPI.saveSettings(null);
    } else {
      localStorage.removeItem('ira_onboarded');
      localStorage.removeItem('ira_config');
      localStorage.removeItem('ira_orb_position');
    }
    setConfig(null);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-zinc-500">Warming up IRA Core Systems...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <DesktopEnv 
      config={config} 
      onLogout={handleLogout} 
    />
  );
}

