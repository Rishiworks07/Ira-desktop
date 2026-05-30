/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Command, CornerDownLeft, VolumeX, Keyboard, RefreshCw, X, AlertCircle, CheckCircle } from 'lucide-react';
import { IraConfig, IraState } from '../types';

interface FloatingOrbProps {
  config: IraConfig;
  iraState: IraState;
  onExecuteCommand: (userInput: string) => Promise<string>;
  onTriggerInput: () => void;
  onCancelInput: () => void;
  openAppWindow: (appName: any) => void;
}

export default function FloatingOrb({
  config,
  iraState: propIraState,
  onExecuteCommand,
  onTriggerInput,
  onCancelInput,
  openAppWindow,
}: FloatingOrbProps) {
  const [iraState, setIraState] = useState<IraState>(propIraState);
  const [commandInput, setCommandInput] = useState('');
  const [spokenFeedback, setSpokenFeedback] = useState<string | null>(null);
  
  // Command history queue
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // Drag position memory
  const [orbPosition, setOrbPosition] = useState({ x: 0, y: 0 });

  const inputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes
  useEffect(() => {
    setIraState(propIraState);
  }, [propIraState]);

  // Persist drag position
  useEffect(() => {
    const savedPos = localStorage.getItem('ira_orb_position');
    if (savedPos) {
      try {
        setOrbPosition(JSON.parse(savedPos));
      } catch (e) {
        // use default state
      }
    }
  }, []);

  // Global Keyboard listener for global summoning (Ctrl + Space)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Capture Control + Space
      const isCtrlSpace = e.ctrlKey && e.code === 'Space';
      
      if (isCtrlSpace) {
        e.preventDefault();
        if (iraState === 'active') {
          handleCollapse();
        } else {
          handleExpand();
        }
      }

      if (e.key === 'Escape' && iraState === 'active') {
        handleCollapse();
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [iraState]);

  // Command history navigator (Up/Down arrows)
  const handleKeyNavigation = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setCommandInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setCommandInput(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setCommandInput('');
      }
    }
  };

  const handleExpand = () => {
    onTriggerInput();
    setIraState('active');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
  };

  const handleCollapse = () => {
    onCancelInput();
    setIraState('idle');
    setCommandInput('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const query = commandInput.trim();
    setIraState('processing');

    // Add to history list
    setHistory(prev => [query, ...prev.slice(0, 19)]);
    setHistoryIdx(-1);

    const feedback = await onExecuteCommand(query);
    setSpokenFeedback(feedback);
    setIraState('success');

    // Reset spoken bubble overlay timer
    setTimeout(() => {
      setIraState('idle');
    }, 2500);

    setCommandInput('');
  };

  // Build glowing drop shadow configurations matching current aesthetics theme
  const getOrbGlowClass = () => {
    switch (config.theme) {
      case 'neon':
        return 'bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-rose-400 shadow-[0_0_40px_rgba(244,63,94,0.7)]';
      case 'light':
        return 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-500 shadow-[0_0_25px_rgba(99,102,241,0.3)]';
      case 'minimal':
        return 'bg-black border border-zinc-500 shadow-none';
      case 'glass':
        return 'bg-gradient-to-tr from-cyan-400 via-sky-500 to-indigo-500 shadow-[0_0_30px_rgba(56,189,248,0.5)]';
      case 'dark':
      default:
        return 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_35px_rgba(168,85,247,0.6)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none font-sans">
      
      {/* DRAGGABLE FLOATING ORB */}
      <AnimatePresence>
        {iraState !== 'active' && (
          <motion.div
            drag
            dragMomentum={false}
            dragElastic={0.1}
            style={{ x: orbPosition.x, y: orbPosition.y }}
            onDragEnd={(_, info) => {
              const newPos = { x: orbPosition.x + info.offset.x, y: orbPosition.y + info.offset.y };
              setOrbPosition(newPos);
              localStorage.setItem('ira_orb_position', JSON.stringify(newPos));
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            className="absolute bottom-24 right-20 pointer-events-auto cursor-grab active:cursor-grabbing z-50 flex flex-col items-center gap-1.5"
            id="ira-floating-orb-wrapper"
          >
            {/* Spoken spoken response box pointer */}
            {spokenFeedback && (iraState === 'success' || iraState === 'idle') && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="mb-3 px-4 py-3 bg-zinc-950/90 border border-white/10 text-white text-xs rounded-2xl shadow-2xl max-w-[280px] pointer-events-none text-center font-medium leading-relaxed"
              >
                {spokenFeedback}
              </motion.div>
            )}

            {/* Pulsing Outer halo circles */}
            {iraState === 'idle' && (
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.35, 0, 0.35],
                }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute inset-[-12px] rounded-full border border-indigo-400/30"
              />
            )}

            {/* Actual Orb Canvas element of IRA */}
            <motion.div
              onClick={handleExpand}
              whileHover={{ scale: 1.15 }}
              animate={
                iraState === 'processing'
                  ? { rotate: 360 }
                  : iraState === 'error'
                  ? { x: [0, -6, 6, -6, 6, 0] }
                  : { scale: [1, 1.04, 1] }
              }
              transition={
                iraState === 'processing'
                  ? { repeat: Infinity, duration: 1.5, ease: 'linear' }
                  : iraState === 'error'
                  ? { duration: 0.4 }
                  : { repeat: Infinity, duration: 3, ease: 'easeInOut' }
              }
              className={`w-14 h-14 rounded-full flex items-center justify-center relative active:scale-95 transition-all text-white ${getOrbGlowClass()}`}
              id="ira-glowing-core-orb"
            >
              {iraState === 'processing' ? (
                <RefreshCw className="w-5 h-5 text-white animate-spin" />
              ) : iraState === 'error' ? (
                <AlertCircle className="w-6 h-6 text-red-100" />
              ) : iraState === 'success' ? (
                <CheckCircle className="w-6 h-6 text-emerald-100" />
              ) : (
                <Sparkles className="w-5.5 h-5.5 text-white animate-pulse" />
              )}
            </motion.div>

            {/* Hover Indicator tooltip info */}
            <motion.span
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="text-[10px] bg-black/60 backdrop-blur border border-white/5 text-zinc-400 px-2 py-0.5 rounded-md pointer-events-none select-none font-mono tracking-tighter"
            >
              Click or Ctrl+Space
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL EXPANDED comando BAR MOCK MODAL */}
      <AnimatePresence>
        {iraState === 'active' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 bg-black/45 backdrop-blur-sm pointer-events-auto z-50 flex items-center justify-center p-4 select-none"
            onClick={handleCollapse}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              exit={{ y: 20 }}
              transition={{ type: 'spring', damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-zinc-950/90 border border-white/10 rounded-2xl shadow-2xl glass-panel overflow-hidden flex flex-col gap-4 p-4 pointer-events-auto"
            >
              <form onSubmit={handleSubmit} className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-xl px-4 py-3">
                <Command className="w-4 h-4 text-indigo-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  onKeyDown={handleKeyNavigation}
                  placeholder={`Hi ${config.user_name}, type naturally to send mail, note thoughts, schedule events or set timers...`}
                  className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none font-sans"
                />
                
                {/* Enter execution indicators */}
                <button
                  type="submit"
                  disabled={!commandInput.trim()}
                  className="p-1 px-2.5 rounded-lg bg-zinc-900 border border-white/5 text-zinc-400 text-xs hover:text-white flex items-center gap-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span>Execute</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Action shortcut tips or macro commands */}
              <div className="flex flex-col gap-1.5 pt-1.5">
                <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 block mb-1">Instant Voice / Tool Matches</span>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div
                    onClick={() => setCommandInput("mail irfan updated meeting looks good")}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-indigo-500/20 rounded-xl cursor-pointer transition flex items-center gap-2"
                  >
                    <div className="h-5 w-5 rounded bg-red-500/10 flex items-center justify-center text-[10px] text-red-400 font-bold font-mono">@</div>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-300">Mail Update</h4>
                      <p className="text-[9px] text-zinc-500">"mail irfan meeting looks good"</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setCommandInput("remind me in 20 seconds to stretch")}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-emerald-500/20 rounded-xl cursor-pointer transition flex items-center gap-2"
                  >
                    <div className="h-5 w-5 rounded bg-emerald-500/10 flex items-center justify-center text-[10px] text-emerald-400 font-bold font-mono">⏰</div>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-300">Set Timer Alarms</h4>
                      <p className="text-[9px] text-zinc-500">"remind me in 20 sec..."</p>
                    </div>
                  </div>

                  <div
                    onClick={() => setCommandInput("note startup thought for ambient overlay")}
                    className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-amber-500/20 rounded-xl cursor-pointer transition flex items-center gap-2"
                  >
                    <div className="h-5 w-5 rounded bg-amber-500/10 flex items-center justify-center text-[10px] text-amber-400 font-bold font-mono">📝</div>
                    <div>
                      <h4 className="text-[11px] font-bold text-zinc-300">Capture Note</h4>
                      <p className="text-[9px] text-zinc-500">"note startup thought..."</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-3 pt-3 border-t border-white/5 font-mono">
                  <span>Press <kbd className="px-1 py-0.5 bg-zinc-900 rounded font-bold">Esc</kbd> to exit command bar</span>
                  <span>Supports Arrow Up/Down navigate history</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
