/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Command, ArrowRight, Check, Key, Mail, Moon, Sun, Monitor, Eye } from 'lucide-react';
import { IraConfig, IraTheme } from '../types';

interface OnboardingProps {
  onComplete: (config: IraConfig) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<IraTheme>('dark');
  const [shortcut, setShortcut] = useState('ControlSpace'); // represents Ctrl + Space
  const [aiProvider, setAiProvider] = useState<'gemini' | 'groq' | 'openai' | 'claude'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);

  const handleNext = () => {
    if (step === 2 && !userName.trim()) return;
    if (step < 7) {
      setStep(step + 1);
    } else {
      const finalConfig: IraConfig = {
        user_name: userName.trim() || 'Guest',
        theme: selectedTheme,
        orb_color: 'purple',
        orb_size: 40,
        orb_position: 'bottom-right',
        idle_opacity: 0.8,
        shortcut: shortcut === 'ControlSpace' ? 'Ctrl + Space' : shortcut,
        voice_wake_word: false,
        launch_at_startup: false,
        ai_provider: aiProvider,
        api_key: apiKey,
        gmail_connected: gmailConnected,
        onboarded: true,
        contacts: [],
      };
      localStorage.setItem('ira_onboarded', 'true');
      localStorage.setItem('ira_config', JSON.stringify(finalConfig));
      onComplete(finalConfig);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const themes: { id: IraTheme; name: string; desc: string; colors: string }[] = [
    { id: 'dark', name: 'Dark Slate', desc: 'Sleek, deep indigo & graphite workspace', colors: 'from-slate-900 to-indigo-950 border-violet-500/30' },
    { id: 'light', name: 'Alabaster', desc: 'Crisp, premium warm off-white minimalist', colors: 'from-stone-50 to-orange-50/50 border-amber-600/20' },
    { id: 'glass', name: 'Frosted Glass', desc: 'Subtle translucent crystalline layers', colors: 'from-zinc-900/60 to-slate-900/40 border-white/15' },
    { id: 'neon', name: 'Tokyo Cyberpunk', desc: 'Glow obsidian canvas with sharp accents', colors: 'from-black to-fuchsia-950/20 border-fuchsia-500/50' },
    { id: 'minimal', name: 'Absolute Monochrome', desc: 'Clean, ink & paper industrial grid', colors: 'from-zinc-950 to-zinc-900 border-zinc-700' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black font-sans selection:bg-indigo-500/30">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(217,70,239,0.08),transparent_50%)]" />

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 flex flex-col items-center max-w-xl text-center px-6"
            id="onboarding-welcome"
          >
            {/* Ambient pulsing sphere representing IRA */}
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                filter: [
                  'drop-shadow(0 0 20px rgba(129,140,248,0.4))',
                  'drop-shadow(0 0 35px rgba(244,114,182,0.5))',
                  'drop-shadow(0 0 20px rgba(129,140,248,0.4))',
                ],
              }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 mb-10 flex items-center justify-center shadow-lg"
            >
              <Sparkles className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-5xl font-bold tracking-tight text-white font-display mb-4">
              Hi, I’m <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">IRA</span>.
            </h1>
            <p className="text-zinc-400 text-lg mb-8 leading-relaxed max-w-md">
              I’m an ambient, intelligent AI desktop companion. I float above your apps to execute quick actions, drafts, notes and reminders instantly.
            </p>

            <button
              onClick={handleNext}
              id="btn-welcome-start"
              className="group flex items-center gap-2 px-8 py-4 bg-white hover:bg-zinc-100 text-black font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-xl active:scale-95"
            >
              Initialize Command Engine
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 max-w-md w-full px-8 py-10 bg-zinc-900/85 glass-panel rounded-3xl"
            id="onboarding-name"
          >
            <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">01 / Setup</span>
            <h2 className="text-3xl font-bold text-white font-display mt-2 mb-3">What should I call you?</h2>
            <p className="text-zinc-400 text-sm mb-6">This makes our desktop environment interactions feel warm and customized.</p>

            <div className="mb-8">
              <input
                type="text"
                autoFocus
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name... (e.g. Rishi)"
                onKeyDown={(e) => e.key === 'Enter' && userName.trim() && handleNext()}
                className="w-full bg-black/60 border border-zinc-800 focus:border-indigo-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-600 outline-none transition-all text-lg font-medium shadow-inner"
              />
            </div>

            <div className="flex justify-between items-center">
              <button onClick={handleBack} className="text-zinc-500 hover:text-zinc-300 text-sm transition">Back</button>
              <button
                disabled={!userName.trim()}
                onClick={handleNext}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-6 py-3 rounded-xl transition"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 max-w-xl w-full px-8 py-10 bg-zinc-900/85 glass-panel rounded-3xl"
            id="onboarding-theme"
          >
            <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">02 / Aesthetics</span>
            <h2 className="text-3xl font-bold text-white font-display mt-2 mb-2">Pulsing Theme</h2>
            <p className="text-zinc-400 text-sm mb-6">Pick an interface theme that pairs perfectly with your desk setup.</p>

            <div className="flex flex-col gap-3 mb-8 max-h-[300px] overflow-y-auto pr-1">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all ${
                    selectedTheme === theme.id
                      ? `bg-gradient-to-r ${theme.colors} text-white`
                      : 'bg-zinc-950/60 hover:bg-zinc-900/80 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {theme.id === 'light' ? (
                        <Sun className={`w-5 h-5 ${selectedTheme === theme.id ? 'text-amber-500' : 'text-zinc-500'}`} />
                      ) : theme.id === 'glass' ? (
                        <Monitor className="w-5 h-5 text-indigo-400" />
                      ) : (
                        <Moon className={`w-5 h-5 ${selectedTheme === theme.id ? 'text-violet-400' : 'text-zinc-500'}`} />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{theme.name}</h4>
                      <p className="text-xs text-zinc-400 mt-0.5">{theme.desc}</p>
                    </div>
                  </div>
                  {selectedTheme === theme.id && (
                    <div className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <button onClick={handleBack} className="text-zinc-500 hover:text-zinc-300 text-sm transition">Back</button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 max-w-md w-full px-8 py-10 bg-zinc-900/85 glass-panel rounded-3xl"
            id="onboarding-shortcut"
          >
            <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">03 / Speed</span>
            <h2 className="text-3xl font-bold text-white font-display mt-2 mb-2">Global Shortcut</h2>
            <p className="text-zinc-400 text-sm mb-6">IRA is designed to be summoned instantly from anywhere using your keyboard.</p>

            <div className="mb-8 p-5 bg-black/60 rounded-2xl border border-zinc-800 text-center">
              <span className="text-zinc-500 text-xs uppercase tracking-widest font-mono">Current Key Binding</span>
              <div className="flex items-center justify-center gap-1.5 mt-3 mb-2">
                <kbd className="px-3.5 py-2 bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-lg text-sm font-mono font-bold shadow shadow-black">Ctrl</kbd>
                <span className="text-zinc-600 font-bold">+</span>
                <kbd className="px-4 py-2 bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-lg text-sm font-mono font-bold shadow shadow-black">Space</kbd>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Pressing Ctrl + Space toggles IRA's glowing command bar on this screen.</p>
            </div>

            <div className="flex justify-between items-center">
              <button onClick={handleBack} className="text-zinc-500 hover:text-zinc-300 text-sm transition">Back</button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition"
              >
                Set Blueprint
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 max-w-md w-full px-8 py-10 bg-zinc-900/85 glass-panel rounded-3xl"
            id="onboarding-provider"
          >
            <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">04 / Intelligence</span>
            <h2 className="text-3xl font-bold text-white font-display mt-2 mb-2">AI Provider</h2>
            <p className="text-zinc-400 text-sm mb-6">Select your default engine or use your own custom provider key.</p>

            <div className="flex flex-col gap-3 mb-6">
              <div
                onClick={() => setAiProvider('default')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  aiProvider === 'default'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold">IRA Default AI (Secure Server Proxy)</span>
                  </div>
                  <div className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold">Recommended</div>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 pl-6">Instant setup using our secure server-side Gemini 3.5 AI. Free under our standard plan.</p>
              </div>

              <div
                onClick={() => setAiProvider('openai')}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  aiProvider === 'openai'
                    ? 'border-indigo-500 bg-indigo-500/10 text-white'
                    : 'border-zinc-800 bg-zinc-950 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold">OpenAI / GPT-4o Mini</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 pl-6">Bring your own OpenAI API Key to route intelligence through custom models.</p>
              </div>
            </div>

            {aiProvider !== 'default' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 overflow-hidden"
              >
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-your-custom-token..."
                    className="w-full bg-black/60 border border-zinc-800 focus:border-indigo-500 rounded-lg px-3 py-2.5 text-xs text-white placeholder-zinc-700 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 px-2 py-1.5 rounded bg-zinc-900 text-zinc-400 hover:text-white text-xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            <div className="flex justify-between items-center">
              <button onClick={handleBack} className="text-zinc-500 hover:text-zinc-300 text-sm transition">Back</button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="relative z-10 max-w-md w-full px-8 py-10 bg-zinc-900/85 glass-panel rounded-3xl"
            id="onboarding-accounts"
          >
            <span className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">05 / Integration</span>
            <h2 className="text-3xl font-bold text-white font-display mt-2 mb-2">Gmail Connector</h2>
            <p className="text-zinc-400 text-sm mb-6">Connect your mail accounts to allow IRA to draft and summarize emails seamlessly.</p>

            <div className="mb-6">
              <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Gmail Sandbox Link</h4>
                    <p className="text-xs text-zinc-500">Enable actual sandbox sandbox email sync.</p>
                  </div>
                </div>
                <button
                  onClick={() => setGmailConnected(!gmailConnected)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                    gmailConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
                >
                  {gmailConnected ? 'Connected!' : 'Link'}
                </button>
              </div>
            </div>

            <p className="text-zinc-500 text-xs text-center mb-6">Note: If skipped, IRA operates in Sandbox Simulator mode with simulated contacts, drafts and emails.</p>

            <div className="flex justify-between items-center">
              <button onClick={handleNext} className="text-zinc-500 hover:text-zinc-300 text-sm transition">Skip Integration</button>
              <button
                onClick={handleNext}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-6 py-3 rounded-xl transition"
              >
                Complete Sync
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 7 && (
          <motion.div
            key="step7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative z-10 flex flex-col items-center max-w-md text-center px-6"
            id="onboarding-finished"
          >
            {/* Pulsing ring animation */}
            <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ repeat: Infinity, duration: 2.5 }}
                className="absolute inset-0 rounded-full border border-indigo-500/40"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0.1, 0.8] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-2 rounded-full border border-pink-500/30"
              />
              <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-indigo-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Check className="w-8 h-8 text-white stroke-[2.5]" />
              </div>
            </div>

            <h2 className="text-4xl font-bold text-white font-display mb-3">IRA is Ready!</h2>
            <p className="text-zinc-400 text-md leading-relaxed mb-8 max-w-sm">
              Press <kbd className="px-2 py-1 bg-zinc-800 text-zinc-200 rounded font-mono text-xs font-semibold mx-1">Ctrl + Space</kbd> at any time inside the virtual workspace to command me. Let's make small things instant.
            </p>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:opacity-90 text-white font-medium rounded-full shadow-lg shadow-indigo-500/20 active:scale-95 transition"
            >
              Enter Workspace Desktop
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
