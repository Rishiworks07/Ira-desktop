/**
 * StandaloneOrb.tsx
 * Monica-style floating orb: the Electron window is physically sized to match the UI.
 * - Collapsed: window = 100×100 px around the orb. Zero impact on other apps.
 * - Expanded: window = full screen width × card height strip at the bottom.
 * - No setIgnoreMouseEvents needed — the OS handles click isolation natively.
 * - Clicking outside the physical window goes straight to other apps.
 */

import { useState, useEffect, useRef, FormEvent, KeyboardEvent, CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Command, CornerDownLeft, RefreshCw,
  AlertCircle, CheckCircle, Mail, Timer, StickyNote, Settings2,
} from 'lucide-react';
import { IraConfig, IraState } from '../types';

interface Props { config: IraConfig; }

function getOrbGradient(theme: IraConfig['theme']) {
  switch (theme) {
    case 'neon':    return 'from-fuchsia-600 via-pink-500 to-rose-400';
    case 'light':   return 'from-indigo-500 via-purple-500 to-amber-500';
    case 'minimal': return 'from-zinc-700 to-zinc-900';
    case 'glass':   return 'from-cyan-400 via-sky-500 to-indigo-500';
    default:        return 'from-indigo-500 via-purple-500 to-pink-500';
  }
}

function getOrbShadow(theme: IraConfig['theme']) {
  switch (theme) {
    case 'neon':  return 'shadow-[0_0_40px_rgba(244,63,94,0.7)]';
    case 'glass': return 'shadow-[0_0_30px_rgba(56,189,248,0.5)]';
    default:      return 'shadow-[0_0_35px_rgba(168,85,247,0.6)]';
  }
}

const QUICK_ACTIONS = [
  { label: 'Mail Update',  example: 'mail irfan meeting looks good',          Icon: Mail,       color: 'bg-red-600 text-white border-transparent shadow-[0_0_15px_rgba(220,38,38,0.3)]' },
  { label: 'Set Timer',    example: 'remind me to stretch in 20 seconds',      Icon: Timer,      color: 'bg-emerald-500 text-white border-transparent shadow-[0_0_15px_rgba(16,185,129,0.3)]' },
  { label: 'Capture Note', example: 'note startup thought for ambient overlay', Icon: StickyNote, color: 'bg-rose-600 text-white border-transparent shadow-[0_0_15px_rgba(225,29,72,0.3)]' },
];

export default function StandaloneOrb({ config }: Props) {
  const isLinux = window.electronAPI?.platform === 'linux';

  const [iraState, setIraState]             = useState<IraState>('idle');
  const [isExpanded, setIsExpanded]         = useState(false);
  const [commandInput, setCommandInput]     = useState('');
  const [spokenFeedback, setSpokenFeedback] = useState<string | null>(null);
  const [history, setHistory]               = useState<string[]>([]);
  const [historyIdx, setHistoryIdx]         = useState(-1);

  const inputRef      = useRef<HTMLInputElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  useEffect(() => {
    // On Linux the window is always showing the command bar — toggle-command-bar
    // fires each time the window is shown, so we use it to auto-focus the input.
    const cleanup = window.electronAPI?.onToggleCommandBar(() => {
      if (isLinux) {
        // Reset state for each fresh open
        setIraState('idle');
        setCommandInput('');
        setSpokenFeedback(null);
        setHistoryIdx(-1);
        setTimeout(() => inputRef.current?.focus(), 80);
      } else {
        setIsExpanded(prev => !prev);
      }
    });
    window.electronAPI?.loadHistory().then(h => { if (Array.isArray(h)) setHistory(h); });

    // On Linux, focus the input immediately on first mount (window is already visible)
    if (isLinux) {
      setTimeout(() => inputRef.current?.focus(), 120);
    }

    return () => { cleanup?.(); };
  }, []);

  // ── Expansion side effects (non-Linux only) ──────────────────────────────────
  useEffect(() => {
    if (isLinux) return; // Linux: window visibility is managed by main process
    const pos = config.orb_position || 'bottom-right';
    if (isExpanded) {
      window.electronAPI?.orbToggled(true, pos);
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      window.electronAPI?.orbToggled(false, pos);
      setCommandInput('');
    }
  }, [isExpanded]);

  const collapse = () => {
    if (isLinux) {
      // On Linux, hide is handled by Electron (blur). We just reset UI state.
      setIraState('idle');
      setCommandInput('');
      setSpokenFeedback(null);
    } else {
      setIsExpanded(false);
    }
  };

  // ── Global ESC & Blur ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isLinux) {
          // On Linux: tell main to hide the window
          window.electronAPI?.orbToggled(false, 'bottom-right');
          collapse();
        } else if (isExpanded) {
          collapse();
        }
      }
    };
    window.addEventListener('keydown', onKey);

    const cleanupBlur = window.electronAPI?.onWindowBlurred(() => {
      collapse();
    });

    return () => {
      window.removeEventListener('keydown', onKey);
      cleanupBlur?.();
    };
  }, [isExpanded, isLinux]);

  // ── History nav ──────────────────────────────────────────────────────────────
  const handleKeyNav = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx < history.length - 1) { const idx = historyIdx + 1; setHistoryIdx(idx); setCommandInput(history[idx]); }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) { const idx = historyIdx - 1; setHistoryIdx(idx); setCommandInput(history[idx]); }
      else if (historyIdx === 0) { setHistoryIdx(-1); setCommandInput(''); }
    } else if (e.key === 'Escape') { collapse(); }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const query = commandInput.trim();
    if (!query) return;

    const newHistory = [query, ...history.filter(h => h !== query).slice(0, 49)];
    setHistory(newHistory);
    window.electronAPI?.saveHistory(newHistory);
    setHistoryIdx(-1); setCommandInput(''); setIraState('processing');
    setSpokenFeedback(null);

    try {
      let result;
      if (window.electronAPI) {
        result = await window.electronAPI.executeCommand({
          userInput: query, userName: config.user_name || 'there',
          clipboardContent: '', systemTime: new Date().toISOString(),
        });
      } else {
        const res = await fetch('/api/command', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: query, userName: config.user_name, clipboardContent: '', systemTime: new Date().toISOString() })
        });
        result = await res.json();
      }
      setSpokenFeedback(result.responseMessage); setIraState('success');
      const displayTime = result.tool === 'simple_response' ? 6000 : 3500;
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => {
        setIraState('idle');
        if (result.tool !== 'simple_response') collapse();
      }, displayTime);
    } catch {
      setSpokenFeedback('Sorry, I hit a snag. Please try again!'); setIraState('error');
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(() => setIraState('idle'), 3000);
    }
  };

  const handleOpenManage = () => {
    window.electronAPI ? window.electronAPI.openMainWindow() : window.open('/', '_blank');
    collapse();
  };

  const gradient = getOrbGradient(config.theme);
  const shadow   = getOrbShadow(config.theme);
  const isBottom = (config.orb_position || 'bottom-right').startsWith('bottom');

  // ── Linux: render only the command bar (no orb) ──────────────────────────────
  if (isLinux) {
    return (
      <div className="w-full h-full font-sans select-none flex items-center justify-center" style={{ background: 'transparent', padding: 20 }}>
        <div className="w-full rounded-[20px] border border-white/[0.06]"
          style={{ background: '#0F111A', boxShadow: '0 24px 64px rgba(0,0,0,0.85)' }}>
          <div className="p-5 flex flex-col gap-4">

            {/* Header */}
            <div className="flex items-center gap-3 px-1">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-widest uppercase text-zinc-500">IRA — Ask me anything</span>
              <kbd className="ml-auto px-2 py-0.5 bg-white/[0.04] border border-white/[0.08] rounded text-zinc-400 text-[10px]">Esc to close</kbd>
            </div>

            {/* Input row */}
            <form onSubmit={handleSubmit}
              className="flex items-center gap-4 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Command className="w-5 h-5 text-indigo-300 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={commandInput}
                onChange={e => setCommandInput(e.target.value)}
                onKeyDown={handleKeyNav}
                placeholder={`Hi ${config.user_name || 'there'}, ask me anything…`}
                className="flex-1 bg-transparent text-base text-zinc-300 placeholder-zinc-600 outline-none min-w-0"
                autoComplete="off"
              />
              <button type="submit"
                disabled={!commandInput.trim() || iraState === 'processing'}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-[11px] font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                {iraState === 'processing'
                  ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : <><span>Run</span><CornerDownLeft className="w-3.5 h-3.5" /></>}
              </button>
            </form>

            {/* IRA response */}
            <AnimatePresence>
              {spokenFeedback && iraState !== 'processing' && (
                <motion.div key="resp"
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className={`px-4 py-3 rounded-xl overflow-hidden text-sm text-zinc-200 leading-relaxed border ${iraState === 'error' ? 'border-red-500/20' : 'border-indigo-500/20'}`}
                  style={{ background: iraState === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)' }}>
                  <span className="font-semibold text-indigo-400">IRA: </span>{spokenFeedback}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick actions */}
            {iraState !== 'processing' && (
              <div>
                <p className="text-[11px] uppercase font-bold tracking-[0.1em] text-zinc-500 mb-2 px-1">Quick actions</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_ACTIONS.map(({ label, example, Icon, color }) => (
                    <button key={label} type="button" onClick={() => { setCommandInput(example); setTimeout(() => inputRef.current?.focus(), 50); }}
                      className="group p-2.5 rounded-xl transition-all text-left cursor-pointer flex flex-row items-center gap-3 border"
                      style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')}>
                      <span className={`w-8 h-8 rounded-lg border ${color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                        <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate">{label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // ── macOS / Windows: orb + expandable command bar ────────────────────────────

  return (
    <div className="w-full h-full font-sans select-none" style={{ background: 'transparent' }}>

      {/* ── COLLAPSED: orb centered in the small 100×100 window ── */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            key="orb"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="w-full h-full flex items-center justify-center relative rounded-full"
            style={{ background: 'rgba(0,0,0,0.85)' }}
          >
            {/* Speech bubble */}
            <AnimatePresence>
              {spokenFeedback && (iraState === 'success' || iraState === 'error') && (
                <motion.div
                  key="bubble"
                  initial={{ opacity: 0, scale: 0.9, y: isBottom ? 4 : -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  style={{
                    position: 'absolute',
                    ...(isBottom ? { bottom: '100%', marginBottom: 12 } : { top: '100%', marginTop: 12 }),
                    left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', zIndex: 10,
                  }}
                  className="px-4 py-2.5 bg-zinc-950/95 border border-white/10 text-white text-xs rounded-2xl shadow-2xl backdrop-blur-xl"
                >
                  <span className="text-indigo-300 font-semibold">IRA: </span>{spokenFeedback}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pulsing halo */}
            {iraState === 'idle' && (
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute w-28 h-28 rounded-full border border-indigo-400/25 pointer-events-none"
              />
            )}

            {/* Orb ball */}
            <motion.div
              id="ira-orb"
              style={{ WebkitAppRegion: 'drag' } as any}
              onContextMenu={e => { e.preventDefault(); window.electronAPI?.showContextMenu(); }}
              whileHover={{ scale: 1.1 }}
              animate={
                iraState === 'processing' ? { rotate: 360 }
                : iraState === 'error'    ? { x: [0, -4, 4, -4, 4, 0] }
                : { scale: [1, 1.04, 1] }
              }
              transition={
                iraState === 'processing' ? { repeat: Infinity, duration: 1.5, ease: 'linear' }
                : iraState === 'error'    ? { duration: 0.35 }
                : { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
              }
              className={`w-20 h-20 rounded-full bg-gradient-to-tr ${gradient} ${shadow} flex items-center justify-center text-white`}
            >
              <div
                style={{ WebkitAppRegion: 'no-drag' } as any}
                onClick={() => setIsExpanded(true)}
                className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              >
                {iraState === 'processing' ? <RefreshCw className="w-7 h-7 animate-spin" />
                : iraState === 'error'     ? <AlertCircle className="w-7 h-7 text-red-100" />
                : iraState === 'success'   ? <CheckCircle className="w-7 h-7 text-emerald-100" />
                : <Sparkles className="w-7 h-7" />}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EXPANDED: command bar — sibling to orb, positioned directly in full-screen ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            key="bar"
            className="w-full h-full"
            initial={{ opacity: 0, y: isBottom ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isBottom ? 10 : -10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            {/* 24px padding gives shadow room within the transparent window */}
            <div className="w-full h-full" style={{ padding: 24 }}>
            {/* Card */}
            <div
              className="rounded-[20px] border border-white/[0.06]"
              style={{
                background: '#0F111A',
                boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
              }}
            >
              <div className="p-6 flex flex-col gap-5">

                {/* Input row */}
                <form onSubmit={handleSubmit}
                  className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Command className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={commandInput}
                    onChange={e => setCommandInput(e.target.value)}
                    onKeyDown={handleKeyNav}
                    placeholder={`Hi ${config.user_name || 'there'}, ask me anything…`}
                    className="flex-1 bg-transparent text-base text-zinc-300 placeholder-zinc-600 outline-none min-w-0"
                    autoComplete="off"
                  />
                  <button type="submit"
                    disabled={!commandInput.trim() || iraState === 'processing'}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 text-[11px] font-bold tracking-wide uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0">
                    {iraState === 'processing'
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <><span>Run</span><CornerDownLeft className="w-3.5 h-3.5" /></>}
                  </button>
                </form>

                {/* IRA response */}
                <AnimatePresence>
                  {spokenFeedback && iraState !== 'processing' && (
                    <motion.div key="resp"
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className={`px-4 py-3 rounded-xl overflow-hidden text-sm text-zinc-200 leading-relaxed border ${iraState === 'error' ? 'border-red-500/20' : 'border-indigo-500/20'}`}
                      style={{ background: iraState === 'error' ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)' }}>
                      <span className="font-semibold text-indigo-400">IRA: </span>{spokenFeedback}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Quick actions */}
                {iraState !== 'processing' && (
                  <div>
                    <p className="text-[11px] uppercase font-bold tracking-[0.1em] text-zinc-500 mb-3 px-1">Quick actions</p>
                    <div className="grid grid-cols-3 gap-3">
                      {QUICK_ACTIONS.map(({ label, example, Icon, color }) => (
                        <button key={label} type="button" onClick={() => setCommandInput(example)}
                          className="group p-3 rounded-xl transition-all text-left cursor-pointer flex flex-row items-center gap-3.5 border"
                          style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.04)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.01)')}>
                          <span className={`w-10 h-10 rounded-xl border ${color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                            <Icon className="w-4 h-4" strokeWidth={2.5} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-zinc-200 group-hover:text-white transition-colors truncate tracking-wide">{label}</p>
                            <p className="text-[11px] text-zinc-500 truncate mt-0.5">"{example.slice(0, 18)}…"</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center pt-1 border-t border-white/[0.04] px-1">
                  <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                    <span className="flex items-center gap-2">
                      <kbd className="px-2 py-1 bg-white/[0.04] border border-white/[0.08] rounded-md text-zinc-300 text-[11px]">Esc</kbd>
                      close
                    </span>
                    <span className="flex items-center gap-2">
                      <kbd className="px-1.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded-md text-zinc-300 text-[11px]">↑↓</kbd>
                      history
                    </span>
                  </div>
                  <button type="button" onClick={handleOpenManage}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-medium transition-colors">
                    <Settings2 className="w-3.5 h-3.5" /> Settings
                  </button>
                </div>

              </div>
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
