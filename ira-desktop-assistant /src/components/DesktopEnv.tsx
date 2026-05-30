/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Code, Music, Mail, Calendar, FileText, Settings, 
  Terminal, Bell, Send, Play, Pause, ChevronRight, 
  Search, Plus, Sparkles, Volume2, User, HelpCircle, Clipboard, Trash2, CheckCircle, AlertCircle
} from 'lucide-react';
import { IraConfig, Reminder, Email, CalendarEvent, QuickNote, ActionLog, MockAppState, IraState, PromptResult } from '../types';
import MockWindow from './MockWindow';
import SettingsWindow from './SettingsWindow';


interface DesktopEnvProps {
  config: IraConfig;
  onLogout: () => void;
}

// Highly elegant desktop synthesizer for notification playbacks
function playChime(type: 'success' | 'alarm' | 'click' | 'startup') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      const now = ctx.currentTime;
      // Beautiful major arpeggio Chime
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.06, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.4);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.5);
      });
    } else if (type === 'alarm') {
      const now = ctx.currentTime;
      // High alarm tone chime
      for (let i = 0; i < 3; i++) {
        const t = now + i * 0.3;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.28);
      }
    } else if (type === 'startup') {
      const now = ctx.currentTime;
      // Uplifting ambient pad chord
      [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
        osc.start();
        osc.stop(now + 1.3);
      });
    }
  } catch (e) {
    console.warn("Audio Context init blocked by browser policy until interaction.", e);
  }
}

export default function DesktopEnv({ config: initialConfig, onLogout }: DesktopEnvProps) {
  const [config, setConfig] = useState<IraConfig>(initialConfig);
  const [iraState, setIraState] = useState<IraState>('idle');
  const [systemTime, setSystemTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [systemDate, setSystemDate] = useState<string>(new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
  
  // Clipboard text simulation
  const [clipboard, setClipboard] = useState<string>(
    "IRA — Ambient AI Desktop Companion specs. Implement draggable frameless overlays, sandbox inbox syncer, calendar scheduler, synthesized melodies, activity log sidebar, and custom Tokyo Neon glow theme."
  );

  // App Windows active states
  const [apps, setApps] = useState<MockAppState>({
    vscode: { isOpen: true, isMinimized: false, zIndex: 10, x: 80, y: 50 },
    spotify: { isOpen: false, isMinimized: false, zIndex: 5, x: 260, y: 150 },
    gmail: { isOpen: false, isMinimized: false, zIndex: 5, x: 160, y: 90 },
    calendar: { isOpen: false, isMinimized: false, zIndex: 5, x: 380, y: 80 },
    notes: { isOpen: false, isMinimized: false, zIndex: 5, x: 480, y: 120 },
    settings: { isOpen: false, isMinimized: false, zIndex: 5, x: 300, y: 180 },
  });

  // Top window tracking for mouse clicks
  const [topZIndex, setTopZIndex] = useState(15);

  // Core Data Lists
  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', text: 'Stretch & drink water', timeString: 'in 20 minutes', durationSeconds: 1200, triggerTime: Date.now() + 1200 * 1000, completed: false, type: 'timer' },
    { id: '2', text: 'Code review session', timeString: 'at 5:00 PM', durationSeconds: 5400, triggerTime: Date.now() + 5400 * 1000, completed: false, type: 'alarm' }
  ]);

  const [emails, setEmails] = useState<Email[]>([
    { id: 'e1', sender: 'Irfan (irfan@gmail.com)', recipient: 'rishiworks07@gmail.com', subject: 'Re: API Launch Schedule', body: 'The backend looks rock solid, Rishi. Let me know when IRA default proxies are deployed and ready for quick tests.', timestamp: '3:15 PM', isDraft: false, read: true },
    { id: 'e2', sender: 'GitHub Sandbox', recipient: 'rishiworks07@gmail.com', subject: 'Successful Deploy alerts', body: 'AI Studio applet build of IRA successfully compiled on Cloud Run containers.', timestamp: '2:40 PM', isDraft: false, read: false }
  ]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: 'c1', title: 'Daily Standup Sync', date: new Date().toISOString().split('T')[0], startTime: '10:00', duration: '30 mins', description: 'Quick status updates.' },
    { id: 'c2', title: 'Evaluate IRA Prototype', date: new Date().toISOString().split('T')[0], startTime: '16:00', duration: '1 hour', description: 'Test intent parsing tools & notifications.' }
  ]);

  const [notes, setNotes] = useState<QuickNote[]>([
    { id: 'n1', content: '# Startup thoughts\n- Ambient desktop assistants are the future.\n- Eliminate browser tab swapping context noise.\n- Micro-chime indicators.', timestamp: new Date().toLocaleString() }
  ]);

  const [actionLogs, setActionLogs] = useState<ActionLog[]>([
    { id: 'l1', time: new Date().toLocaleTimeString(), text: 'Command Engine initialized.', status: 'info' },
    { id: 'l2', time: new Date().toLocaleTimeString(), text: 'Simulated Workspace Desk loaded.', status: 'info' }
  ]);

  // Toast / System Notifications list
  const [notifications, setNotifications] = useState<{ id: string; title: string; message: string; duration?: number }[]>([]);

  // Local application states
  const [activeNoteText, setActiveNoteText] = useState<string>(notes[0]?.content || '');
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [emailTab, setEmailTab] = useState<'inbox' | 'sent' | 'drafts' | 'compose'>('inbox');
  const [composeTo, setComposeTo] = useState('');
  const [composeSub, setComposeSub] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [selectedInboxEmail, setSelectedInboxEmail] = useState<Email | null>(emails[0]);

  // Code editor code state
  const [codeSnippet, setCodeSnippet] = useState<string>(
    `// Rishi's custom prompt optimization routine\nfunction optimizeIraFlow(input) {\n  let query = input.toLowerCase();\n  if (query.includes("optimize")) {\n    console.log("Analyzing clipboard...");\n    return "Optimized text block";\n  }\n  return "Normal state";\n}`
  );

  // Spotify internal simulation
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [spotifyTrack, setSpotifyTrack] = useState('Cyberpunk Horizon');
  const [spotifyArtist, setSpotifyArtist] = useState('Lo-Fi Synthwave');
  const [spotifyVolume, setSpotifyVolume] = useState<number>(65);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBox, setShowSearchBox] = useState(false);

  // Play startup sound once on mount
  useEffect(() => {
    playChime('startup');
    addNotification('IRA Assistant Loaded', `Good afternoon, ${config.user_name}. How can I assist you today?`);
  }, []);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setSystemTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setSystemDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer Tick handler for countdown reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setReminders(prev => {
        let updated = false;
        const next = prev.map(reminder => {
          if (!reminder.completed && reminder.triggerTime <= now) {
            // Trigger Alarm chime & Notification!
            playChime('alarm');
            addNotification('IRA Action Reminder!', reminder.text);
            logAction(`[ALARM] Triggered: "${reminder.text}"`, 'success');
            updated = true;
            return { ...reminder, completed: true };
          }
          return reminder;
        });
        return updated ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync activeNoteText with selections
  useEffect(() => {
    const note = notes.find(n => n.id === selectedNoteId);
    if (note) {
      setActiveNoteText(note.content);
    }
  }, [selectedNoteId]);

  const addNotification = (title: string, message: string, duration = 6000) => {
    const id = Math.random().toString();
    setNotifications(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  };

  const logAction = (text: string, status: 'info' | 'success' | 'error' = 'info') => {
    setActionLogs(prev => [
      { id: Math.random().toString(), time: new Date().toLocaleTimeString([]), text, status },
      ...prev
    ]);
  };

  const focusWindow = (appName: keyof MockAppState) => {
    setTopZIndex(prev => {
      const nextZ = prev + 1;
      setApps(prevApps => ({
        ...prevApps,
        [appName]: {
          ...prevApps[appName],
          zIndex: nextZ,
          isMinimized: false
        }
      }));
      return nextZ;
    });
  };

  const openAppWindow = (appName: keyof MockAppState) => {
    setApps(prev => ({
      ...prev,
      [appName]: {
        ...prev[appName],
        isOpen: true,
        isMinimized: false,
      }
    }));
    focusWindow(appName);
    logAction(`App opened: "${appName.toUpperCase()}"`, 'info');
  };

  const closeAppWindow = (appName: keyof MockAppState) => {
    setApps(prev => ({
      ...prev,
      [appName]: {
        ...prev[appName],
        isOpen: false,
      }
    }));
    logAction(`App closed: "${appName.toUpperCase()}"`, 'info');
  };

  const minimizeAppWindow = (appName: keyof MockAppState) => {
    setApps(prev => ({
      ...prev,
      [appName]: {
        ...prev[appName],
        isMinimized: true,
      }
    }));
    logAction(`App minimized: "${appName.toUpperCase()}"`, 'info');
  };

  // Execute actual command matched by Gemini Intent Parser
  const handleExecuteCommand = async (userInput: string) => {
    setIraState('processing');
    logAction(`User command: "${userInput}"`, 'info');

    try {
      let result: PromptResult;

      // Use Electron IPC if running as desktop app, otherwise fall back to HTTP
      if ((window as any).electronAPI) {
        result = await (window as any).electronAPI.executeCommand({
          userInput,
          userName: config.user_name,
          clipboardContent: clipboard,
          systemTime: new Date().toISOString(),
        });
      } else {
        const response = await fetch('/api/command', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userInput,
            userName: config.user_name,
            clipboardContent: clipboard,
            systemTime: new Date().toISOString()
          })
        });
        if (!response.ok) throw new Error('Server returned error status');
        result = await response.json();
      }

      console.log("IRA Execution Decision:", result);

      // Perform real-time mutations based on parsed actions
      if (result.tool === 'create_reminder') {
        const seconds = result.args.delaySeconds || 10;
        const newReminder: Reminder = {
          id: Math.random().toString(),
          text: result.args.text || 'Stretch session',
          timeString: result.args.timeString || `in ${seconds}s`,
          durationSeconds: seconds,
          triggerTime: Date.now() + seconds * 1000,
          completed: false,
          type: result.args.type || 'timer'
        };
        setReminders(prev => [newReminder, ...prev]);
        logAction(`[REMINDER] Created '${newReminder.text}' to alert ${newReminder.timeString}`, 'success');
        addNotification('Reminder Created', `I will remind you to "${newReminder.text}" ${newReminder.timeString}.`);
      } 
      
      else if (result.tool === 'send_email') {
        const newEmail: Email = {
          id: Math.random().toString(),
          sender: `Me (alias ${config.user_name})`,
          recipient: result.args.recipient || 'recipient@gmail.com',
          subject: result.args.subject || 'Draft Update',
          body: result.args.body || 'Body details...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDraft: false,
          read: true
        };
        setEmails(prev => [newEmail, ...prev]);
        logAction(`[EMAIL] Sent updating: "${newEmail.subject}" to ${newEmail.recipient}`, 'success');
        addNotification('Email Dispatched', `Draft successfully sent to ${newEmail.recipient}.`);
        openAppWindow('gmail');
      } 
      
      else if (result.tool === 'create_event') {
        const newEvent: CalendarEvent = {
          id: Math.random().toString(),
          title: result.args.title || 'Dynamic Meeting',
          date: result.args.date || new Date().toISOString().split('T')[0],
          startTime: result.args.startTime || '15:00',
          duration: result.args.duration || '1 hour',
          description: result.args.description || 'Created by IRA companion'
        };
        setCalendarEvents(prev => [...prev, newEvent]);
        logAction(`[CALENDAR] Event configured: "${newEvent.title}" on ${newEvent.date} at ${newEvent.startTime}`, 'success');
        addNotification('Event Scheduled', `"${newEvent.title}" added for ${newEvent.startTime}.`);
        openAppWindow('calendar');
      } 
      
      else if (result.tool === 'create_note') {
        const newNote: QuickNote = {
          id: Math.random().toString(),
          content: `# Recorded Thought\n${result.args.content}`,
          timestamp: new Date().toLocaleString()
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedNoteId(newNote.id);
        logAction(`[NOTES] Thought saved: "${result.args.content.slice(0, 30)}..."`, 'success');
        addNotification('Note Captured', 'Your immediate startup thought is recorded and persistent.');
        openAppWindow('notes');
      } 
      
      else if (result.tool === 'clipboard_action') {
        // Run summarization, translation, simplification or rewriting
        const action = result.args.action || 'summarize';
        const sourceText = result.args.textContent || clipboard;
        
        let processedContent = '';
        if (action === 'summarize') {
          processedContent = `# AI Clipboard Summary\n\n- Brief: Ambient overlay is fully implemented.\n- Desktop modules VSCode, Spotify, Gmail connections are completely integrated.\n- High-fidelity chime alert synthesizers configured.\n\nOriginal Clipboard text: "${sourceText.slice(0, 80)}..."`;
        } else if (action === 'rewrite') {
          processedContent = `# AI Refined Text\n\n"We are absolutely excited to present IRA: a top-tier overlay assistant designed for instant micro-task management, allowing you to streamline workspace functions seamlessly."`;
        } else if (action === 'simplify') {
          processedContent = `# AI Simplified Text\n\n"IRA floats on your screen to help you send emails, save notes, and set timers instantly so you don't lose focus."`;
        } else {
          processedContent = `# AI Translation (Spanish Mock)\n\n"Presentamos a IRA: un asistente de escritorio ambiental inteligente..."`;
        }

        const newNote: QuickNote = {
          id: Math.random().toString(),
          content: processedContent,
          timestamp: new Date().toLocaleString()
        };
        setNotes(prev => [newNote, ...prev]);
        setSelectedNoteId(newNote.id);
        logAction(`[CLIPBOARD] executed "${action}" on current workspace selection`, 'success');
        addNotification('Clipboard AI Action Done', `Finished "${action}". Result written to Notes.`);
        openAppWindow('notes');
      } 
      
      else if (result.tool === 'open_app') {
        const appName = result.args.appName.toLowerCase() as keyof MockAppState;
        if (apps[appName] !== undefined) {
          openAppWindow(appName);
        } else {
          logAction(`Command matched app "${appName}" which is not loaded.`, 'error');
        }
      } 
      
      else if (result.tool === 'system_search') {
        setSearchQuery(result.args.query);
        setShowSearchBox(true);
        logAction(`Universal Workspace search for: "${result.args.query}"`, 'info');
      }

      setIraState('success');
      playChime('success');
      
      return result.responseMessage;

    } catch (err) {
      console.error("Failed executing command through backend:", err);
      setIraState('error');
      playChime('alarm');
      logAction(`Engine Error: Failed executing command`, 'error');
      return `Apologies ${config.user_name}, I encountered a glitch running that command. Let's try again!`;
    }
  };

  // Helper trigger to copy mock VSCode text into simulator clipboard
  const handleCopyFromEditor = () => {
    setClipboard(codeSnippet);
    addNotification('Clipboard Synced', 'Selected code snippet copied to IRA context.');
    logAction('Virtual Copy: VSCode snippet copied to desktop clipboard.', 'info');
  };

  const handleManualEmailSend = (e: FormEvent) => {
    e.preventDefault();
    if (!composeTo || !composeSub) return;

    const newEmail: Email = {
      id: Math.random().toString(),
      sender: `Me (${config.user_name})`,
      recipient: composeTo,
      subject: composeSub,
      body: composeBody,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDraft: false,
      read: true
    };

    setEmails(prev => [newEmail, ...prev]);
    addNotification('Email Dispatched', `Mock Email sent to ${composeTo}!`);
    logAction(`Manuel email sent to ${composeTo}`, 'success');

    // reset forms
    setComposeTo('');
    setComposeSub('');
    setComposeBody('');
    setEmailTab('sent');
  };

  const handleAddManualNote = () => {
    const newNote: QuickNote = {
      id: Math.random().toString(),
      content: '# New Note\nType anything here...',
      timestamp: new Date().toLocaleString()
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  const handleUpdateNoteBody = (txt: string) => {
    setActiveNoteText(txt);
    setNotes(prev => prev.map(note => {
      if (note.id === selectedNoteId) {
        return { ...note, content: txt, timestamp: new Date().toLocaleString() };
      }
      return note;
    }));
  };

  const handleDeleteNote = (id: string) => {
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (remaining.length) {
      setSelectedNoteId(remaining[0].id);
    }
  };

  // Theme-specific styles definition
  const getThemeDesktopClass = () => {
    switch (config.theme) {
      case 'dark':
        return 'bg-gradient-to-tr from-slate-950 via-zinc-900 to-indigo-950 text-slate-100';
      case 'light':
        return 'bg-gradient-to-tr from-stone-100 via-neutral-100 to-orange-50 text-stone-800';
      case 'glass':
        return 'bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-zinc-950 to-slate-950 text-zinc-100';
      case 'neon':
        return 'bg-gradient-to-b from-black via-zinc-950 to-fuchsia-950/30 text-rose-100';
      case 'minimal':
        return 'bg-zinc-950 border border-zinc-800 text-white';
      default:
        return 'bg-slate-950 text-white';
    }
  };

  const getThemeOverlayPanelClass = () => {
    switch (config.theme) {
      case 'light':
        return 'bg-white/80 border-stone-200 shadow-stone-200/50';
      case 'minimal':
        return 'bg-black border-zinc-800 rounded-none shadow-none';
      default:
        return 'bg-zinc-950/70 border-white/5 shadow-black/80';
    }
  };

  return (
    <div className={`fixed inset-0 select-none overflow-hidden font-sans ${getThemeDesktopClass()}`}>
      
      {/* Background visual detail decor */}
      {config.theme === 'neon' && (
        <div className="absolute inset-0 bg-[linear-gradient(rgba(244,63,94,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      )}
      {config.theme === 'minimal' && (
        <div className="absolute inset-0 bg-[linear-gradient(#222_1px,transparent_1px),linear-gradient(90deg,#222_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
      )}
      {config.theme === 'dark' && (
        <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      )}

      {/* Top OS Menu Bar */}
      <div className={`h-8 w-full ${config.theme === 'light' ? 'bg-stone-200/60 border-stone-300/40 text-stone-700' : 'bg-black/40 border-white/5 text-zinc-400'} border-b flex items-center justify-between px-6 text-xs font-semibold backdrop-blur-md z-40 select-none`}>
        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-display text-[13px] tracking-tight text-white/90">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>IRA Workspace</span>
          </span>
          <span className="opacity-60">Session active</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono">● Secure Sandbox</span>
        </div>

        <div className="flex items-center gap-5 font-mono">
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-indigo-400" />
            <span className={config.theme === 'light' ? 'text-stone-700' : 'text-slate-200'}>{config.user_name}</span>
          </div>
          <span>{systemDate}</span>
          <span className="font-bold">{systemTime}</span>
        </div>
      </div>

      {/* Outer Virtual Screen bounds for dragging mock apps */}
      <div className="absolute inset-0 top-8 bottom-16 w-full pointer-events-none">
        
        {/* VS CODE WINDOW */}
        <MockWindow
          id="vscode"
          title="editor.ts — IRA Assistant Integration Mock"
          isOpen={apps.vscode.isOpen}
          isMinimized={apps.vscode.isMinimized}
          zIndex={apps.vscode.zIndex}
          initialX={apps.vscode.x}
          initialY={apps.vscode.y}
          onClose={() => closeAppWindow('vscode')}
          onMinimize={() => minimizeAppWindow('vscode')}
          onFocus={() => focusWindow('vscode')}
          icon={<Code className="w-4 h-4 text-blue-400" />}
        >
          <div className="h-full flex flex-col bg-zinc-950 font-mono text-sm">
            <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/80 border-b border-white/5 text-xs text-zinc-400">
              <span className="text-zinc-500">File editing area</span>
              <button
                onClick={handleCopyFromEditor}
                className="flex items-center gap-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/20 text-indigo-200 px-2 py-0.5 rounded text-[10px] transition font-sans"
              >
                <Clipboard className="w-3 h-3" />
                Copy lines to clipboard
              </button>
            </div>
            <textarea
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              className="flex-1 w-full bg-black/80 p-4 text-zinc-300 outline-none resize-none font-mono text-xs leading-relaxed"
            />
          </div>
        </MockWindow>

        {/* SPOTIFY MUSIC APP */}
        <MockWindow
          id="spotify"
          title="Spotify Audio Feed — Sim Player"
          isOpen={apps.spotify.isOpen}
          isMinimized={apps.spotify.isMinimized}
          zIndex={apps.spotify.zIndex}
          initialX={apps.spotify.x}
          initialY={apps.spotify.y}
          onClose={() => closeAppWindow('spotify')}
          onMinimize={() => minimizeAppWindow('spotify')}
          onFocus={() => focusWindow('spotify')}
          icon={<Music className="w-4 h-4 text-emerald-400" />}
          width="w-[450px]"
          height="h-[320px]"
        >
          <div className="h-full bg-gradient-to-b from-zinc-900 to-black p-6 flex flex-col justify-between font-sans">
            <div className="flex gap-5 items-center">
              {/* Rotating Cover simulation */}
              <motion.div
                animate={isPlaying ? { rotate: 360 } : {}}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 via-indigo-600 to-teal-500 flex items-center justify-center border-4 border-zinc-800 shadow-xl flex-shrink-0"
              >
                <div className="w-6 h-6 rounded-full bg-black border border-white/20" />
              </motion.div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Currently Streaming</span>
                <h3 className="text-lg font-bold text-white mt-1">{spotifyTrack}</h3>
                <p className="text-xs text-zinc-400">{spotifyArtist}</p>
                
                {/* Audio visualizer peaks simulation */}
                <div className="flex gap-1 h-5 items-end mt-3">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((bar) => (
                    <motion.div
                      key={bar}
                      animate={isPlaying ? { height: [4, Math.random() * 20 + 4, 4] } : { height: 4 }}
                      transition={{ repeat: Infinity, duration: 1 + Math.random(), ease: 'easeInOut' }}
                      className="w-1 bg-gradient-to-t from-indigo-500 to-emerald-400 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
                <span>1:24</span>
                <span>3:40</span>
              </div>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden mb-5">
                <div className="bg-white h-full w-[35%]" />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                      logAction(`Music ${!isPlaying ? 'started' : 'paused'} on Spotify.`, 'info');
                    }}
                    className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition shadow-lg shadow-black"
                  >
                    {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black pl-0.5" />}
                  </button>
                  <span className="text-xs font-semibold text-zinc-300">{isPlaying ? 'Playing Ambient Synth' : 'Audio Interrupted'}</span>
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <Volume2 className="w-4 h-4" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={spotifyVolume}
                    onChange={(e) => setSpotifyVolume(parseInt(e.target.value))}
                    className="w-20 accent-indigo-500 h-1 rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </MockWindow>

        {/* GMAIL SANDBOX AND CONTACTS */}
        <MockWindow
          id="gmail"
          title="Gmail Workspace Sandbox"
          isOpen={apps.gmail.isOpen}
          isMinimized={apps.gmail.isMinimized}
          zIndex={apps.gmail.zIndex}
          initialX={apps.gmail.x}
          initialY={apps.gmail.y}
          onClose={() => closeAppWindow('gmail')}
          onMinimize={() => minimizeAppWindow('gmail')}
          onFocus={() => focusWindow('gmail')}
          icon={<Mail className="w-4 h-4 text-red-400" />}
          width="w-[580px]"
          height="h-[380px]"
        >
          <div className="h-full flex text-sm text-zinc-300 font-sans">
            {/* Sidebar navigation */}
            <div className="w-40 bg-zinc-950 border-r border-white/5 p-3 flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => setEmailTab('compose')}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg py-2 mb-3 text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Compose
              </button>
              
              <button
                onClick={() => setEmailTab('inbox')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${emailTab === 'inbox' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900/50 text-zinc-400'}`}
              >
                Inbox ({emails.length})
              </button>
              <button
                onClick={() => setEmailTab('sent')}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${emailTab === 'sent' ? 'bg-zinc-900 text-white' : 'hover:bg-zinc-900/50 text-zinc-400'}`}
              >
                Sent Mail
              </button>
            </div>

            {/* List / Mail body area */}
            <div className="flex-1 bg-zinc-900/40 p-4 overflow-y-auto">
              {emailTab === 'compose' ? (
                <form onSubmit={handleManualEmailSend} className="flex flex-col gap-3 h-full">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Draft Email Update</h3>
                  <input
                    type="email"
                    required
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    placeholder="Recipient address (e.g. irfan@gmail.com)"
                    className="bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none"
                  />
                  <input
                    type="text"
                    required
                    value={composeSub}
                    onChange={(e) => setComposeSub(e.target.value)}
                    placeholder="Subject heading"
                    className="bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none"
                  />
                  <textarea
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    placeholder="Message coordinates..."
                    className="flex-1 bg-black/60 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none resize-none min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEmailTab('inbox')}
                      className="px-3.5 py-1.5 text-xs text-zinc-500 hover:text-white"
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      Dispatch
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    {emailTab === 'inbox' ? 'Workspace Inbox' : 'Dispatched Sent mailbox'}
                  </h3>

                  {emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => setSelectedInboxEmail(email)}
                      className={`p-3 rounded-xl border cursor-pointer transition ${
                        selectedInboxEmail?.id === email.id
                          ? 'border-indigo-500/40 bg-indigo-500/5'
                          : 'border-white/5 bg-zinc-950/40 hover:bg-zinc-950/80'
                      }`}
                    >
                      <div className="flex justify-between items-start text-xs mb-1">
                        <span className="font-bold text-white max-w-[200px] truncate">{email.sender}</span>
                        <span className="text-[10px] text-zinc-500 font-mono">{email.timestamp}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-zinc-300 truncate">{email.subject}</h4>
                      <p className="text-xs text-zinc-500 line-clamp-1 mt-1 font-sans">{email.body}</p>
                    </div>
                  ))}

                  {selectedInboxEmail && (
                    <div className="mt-4 p-4 bg-black/40 rounded-xl border border-white/5">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Mail Review Details</span>
                      <div className="flex justify-between items-center mt-2 pb-2 border-b border-white/5 mb-3 text-xs">
                        <div>
                          <p className="text-zinc-400">Recipient: <span className="text-white">{selectedInboxEmail.recipient}</span></p>
                          <p className="text-zinc-500">From: {selectedInboxEmail.sender}</p>
                        </div>
                        <span className="text-[10px] text-zinc-500">{selectedInboxEmail.timestamp}</span>
                      </div>
                      <h4 className="text-xs font-semibold text-white mb-2">{selectedInboxEmail.subject}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line font-sans">{selectedInboxEmail.body}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </MockWindow>

        {/* CALENDAR APP */}
        <MockWindow
          id="calendar"
          title="Virtual Workspace Calendar"
          isOpen={apps.calendar.isOpen}
          isMinimized={apps.calendar.isMinimized}
          zIndex={apps.calendar.zIndex}
          initialX={apps.calendar.x}
          initialY={apps.calendar.y}
          onClose={() => closeAppWindow('calendar')}
          onMinimize={() => minimizeAppWindow('calendar')}
          onFocus={() => focusWindow('calendar')}
          icon={<Calendar className="w-4 h-4 text-emerald-400" />}
          width="w-[520px]"
          height="h-[340px]"
        >
          <div className="h-full flex font-sans text-sm text-zinc-300">
            {/* Minimal Grid calendar preview layout */}
            <div className="w-48 bg-zinc-950/80 p-4 border-r border-white/5 flex flex-col justify-between flex-shrink-0">
              <div>
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-4">May 2026</span>
                <div className="grid grid-cols-7 gap-y-2 text-center text-[10px] font-semibold text-zinc-400">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
                  {Array.from({ length: 31 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`py-0.5 rounded ${i + 1 === 28 ? 'bg-indigo-500 text-white font-bold' : ''}`}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-xs text-zinc-500 border-t border-white/5 pt-3">
                <p>Highlighted date: <b>May 28, 2026</b></p>
                <p className="mt-1 text-[10px]">Today is Thursday</p>
              </div>
            </div>

            {/* Daily Agenda panel list */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Today's Agenda (Schedule)</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {calendarEvents.map((event) => (
                  <div key={event.id} className="p-3 bg-zinc-950 border border-white/5 rounded-xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white">{event.title}</span>
                      <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-mono px-2 py-0.5 rounded">{event.startTime} ({event.duration})</span>
                    </div>
                    {event.description && (
                      <p className="text-xs text-zinc-500 font-sans mt-1.5 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                ))}

                {calendarEvents.length === 0 && (
                  <div className="text-center py-6 text-zinc-600 text-xs text-zinc-500 border border-dashed border-white/5 rounded-2xl">
                    No schedules locked for today. Ask IRA to schedule an update.
                  </div>
                )}
              </div>
            </div>
          </div>
        </MockWindow>

        {/* QUICK NOTES WITH DETAILED TEXT WRITING */}
        <MockWindow
          id="notes"
          title="IRA Quick Notes — Text Capture"
          isOpen={apps.notes.isOpen}
          isMinimized={apps.notes.isMinimized}
          zIndex={apps.notes.zIndex}
          initialX={apps.notes.x}
          initialY={apps.notes.y}
          onClose={() => closeAppWindow('notes')}
          onMinimize={() => minimizeAppWindow('notes')}
          onFocus={() => focusWindow('notes')}
          icon={<FileText className="w-4 h-4 text-amber-400" />}
          width="w-[580px]"
          height="h-[365px]"
        >
          <div className="h-full flex font-sans text-sm text-zinc-300">
            {/* list view */}
            <div className="w-44 bg-zinc-950/90 border-r border-white/5 p-3 flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={handleAddManualNote}
                className="w-full flex items-center justify-center gap-1.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white rounded-lg py-1.5 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </button>

              <div className="flex flex-col gap-1.5 overflow-y-auto">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setSelectedNoteId(note.id)}
                    className={`p-2 rounded-lg cursor-pointer text-left transition select-none ${
                      selectedNoteId === note.id
                        ? 'bg-indigo-500/10 border border-indigo-500/20 text-white'
                        : 'hover:bg-zinc-900/50 text-zinc-400 border border-transparent'
                    }`}
                  >
                    <p className="text-xs font-semibold truncate text-zinc-200">
                      {note.content.split('\n')[0].replace('#', '').trim() || 'Untitled Note'}
                    </p>
                    <span className="text-[9px] text-zinc-500 font-mono tracking-tighter block mt-0.5">{note.timestamp.split(',')[0]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note edit canvas block */}
            <div className="flex-1 bg-zinc-900/10 p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Workspace Editor Workspace</span>
                <button
                  onClick={() => handleDeleteNote(selectedNoteId)}
                  title="Delete current note"
                  className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={activeNoteText}
                onChange={(e) => handleUpdateNoteBody(e.target.value)}
                placeholder="Content of your notes..."
                className="flex-1 w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-xs text-zinc-300 outline-none resize-none leading-relaxed font-mono"
              />
            </div>
          </div>
        </MockWindow>

        {/* SETTINGS PANEL */}
        <MockWindow
          id="settings"
          title="IRA Command Configurations"
          isOpen={apps.settings.isOpen}
          isMinimized={apps.settings.isMinimized}
          zIndex={apps.settings.zIndex}
          initialX={apps.settings.x}
          initialY={apps.settings.y}
          onClose={() => closeAppWindow('settings')}
          onMinimize={() => minimizeAppWindow('settings')}
          onFocus={() => focusWindow('settings')}
          icon={<Settings className="w-4 h-4 text-zinc-400" />}
          width="w-[700px]"
          height="h-[500px]"
        >
          <SettingsWindow 
            config={config} 
            setConfig={(newConfig) => {
              setConfig(newConfig);
              if (window.electronAPI) window.electronAPI.saveSettings(newConfig);
              else localStorage.setItem('ira_config', JSON.stringify(newConfig));
            }} 
            onClose={() => closeAppWindow('settings')}
            onLogout={onLogout}
          />
        </MockWindow>

      </div>

      {/* FloatingOrb is rendered in its own Electron window — not here */}

      {/* UNIVERSAL DESKTOP SEARCH BOX OVERLAY PANEL */}
      <AnimatePresence>
        {showSearchBox && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center font-sans backdrop-blur-md"
          >
            <div className="bg-zinc-950 border border-white/10 w-[450px] p-5 rounded-2xl shadow-2xl flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Simulated Desktop Search Tool</span>
                <button 
                  onClick={() => setShowSearchBox(false)} 
                  className="text-zinc-500 hover:text-white text-xs px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-lg transition"
                >
                  Close filter
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter mails or schedules in real-time..."
                  className="w-full bg-black border border-white/5 focus:border-indigo-500 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-700 outline-none"
                />
              </div>

              <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto mt-2">
                <span className="text-[10px] uppercase font-semibold text-zinc-600 block mb-1">Items Matching keywords</span>
                
                {/* Search notes/mail filter list */}
                {emails.filter(e => e.subject.toLowerCase().includes(searchQuery.toLowerCase()) || e.body.toLowerCase().includes(searchQuery.toLowerCase())).map(e => (
                  <div key={e.id} onClick={() => { openAppWindow('gmail'); setShowSearchBox(false); }} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs cursor-pointer truncate flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold">{e.subject}</span>
                    <span className="text-[9px] bg-red-500/10 text-red-400 px-2 rounded-full">Mail</span>
                  </div>
                ))}

                {calendarEvents.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                  <div key={c.id} onClick={() => { openAppWindow('calendar'); setShowSearchBox(false); }} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs cursor-pointer truncate flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold">{c.title}</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 rounded-full">Event</span>
                  </div>
                ))}
                
                {notes.filter(n => n.content.toLowerCase().includes(searchQuery.toLowerCase())).map(n => (
                  <div key={n.id} onClick={() => { openAppWindow('notes'); setShowSearchBox(false); }} className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs cursor-pointer truncate flex items-center justify-between">
                    <span className="text-zinc-300 font-semibold">{n.content.split('\n')[0].replace('#', '')}</span>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 rounded-full">Note</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOAST SYSTEM NOTIFICATION BANNERS */}
      <div className="fixed top-12 right-6 flex flex-col gap-2 z-50 pointer-events-none max-w-sm w-full font-sans">
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="p-4 rounded-xl border border-white/10 bg-zinc-950/90 text-white shadow-2xl flex items-start gap-3 pointer-events-auto cursor-pointer"
              onClick={() => {
                // remove immediately on click
                setNotifications(prev => prev.filter(n => n.id !== notif.id));
              }}
            >
              <div className="h-6 w-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white pr-2 leading-tight">{notif.title}</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-snug">{notif.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ACTIVITY ACTION LOG SIDEBAR */}
      <div className={`fixed top-8 bottom-16 left-0 w-64 ${config.theme === 'light' ? 'bg-stone-50/90 border-stone-200/50 text-stone-700' : 'bg-black/20 border-white/5 text-zinc-500'} border-r backdrop-blur-xl z-30 font-sans p-4 flex flex-col justify-between select-none hidden lg:flex`}>
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 block mb-1">Workspace Telemetry Log</span>
          <h3 className="text-sm font-bold text-white mt-1 mb-4 flex items-center gap-1.5 font-display">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Action History Tracker
          </h3>

          <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
            {actionLogs.map((log) => (
              <div key={log.id} className="text-[11px] leading-snug font-mono border-l-2 border-indigo-500/20 pl-2 mt-1.5">
                <span className="text-[9px] text-zinc-600 font-mono pr-1 block">[{log.time}]</span>
                <span className={log.status === 'success' ? 'text-emerald-400 font-semibold' : log.status === 'error' ? 'text-red-400' : 'text-zinc-400'}>
                  {log.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/5 pt-3 text-[10px] text-zinc-500 flex flex-col gap-0.5 leading-relaxed font-sans mt-2">
          <p>Press <kbd className="px-1 bg-zinc-800 text-zinc-300 rounded font-mono">Control</kbd> + <kbd className="px-1 bg-zinc-800 text-zinc-300 rounded font-mono">Space</kbd> to summon</p>
          <p>© IRA — Ambient Desktop Assistant v1.0</p>
        </div>
      </div>

      {/* BOTTOM SIMULATED DOCK SHORTCUT TASKBAR */}
      <div className="fixed bottom-0 inset-x-0 h-16 pointer-events-none z-40 flex items-center justify-center font-sans">
        <div className={`pointer-events-auto h-12 px-4 rounded-xl border flex items-center gap-2 ${config.theme === 'light' ? 'bg-stone-100 border-stone-200 shadow-xl' : 'bg-zinc-950/80 border-white/10 shadow-2xl shadow-black'} backdrop-blur-xl mb-3 flex-shrink-0`}>
          
          <button 
            onClick={() => openAppWindow('vscode')}
            className={`p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 relative transition-transform hover:scale-105 active:scale-95`}
            title="VS Code Editor"
          >
            <Code className={`w-5 h-5 ${apps.vscode.isOpen ? 'text-blue-400' : ''}`} />
            {apps.vscode.isOpen && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
          </button>

          <button 
            onClick={() => openAppWindow('spotify')}
            className={`p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 relative transition-transform hover:scale-105 active:scale-95`}
            title="Spotify Player"
          >
            <Music className={`w-5 h-5 ${apps.spotify.isOpen ? 'text-emerald-400 animate-pulse' : ''}`} />
            {apps.spotify.isOpen && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button 
            onClick={() => openAppWindow('gmail')}
            className={`p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 relative transition-transform hover:scale-105 active:scale-95`}
            title="Gmail Sandbox"
          >
            <Mail className={`w-5 h-5 ${apps.gmail.isOpen ? 'text-red-400' : ''}`} />
            {apps.gmail.isOpen && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
          </button>

          <button 
            onClick={() => openAppWindow('calendar')}
            className={`p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 relative transition-transform hover:scale-105 active:scale-95`}
            title="Workspace Calendar"
          >
            <Calendar className={`w-5 h-5 ${apps.calendar.isOpen ? 'text-emerald-400' : ''}`} />
            {apps.calendar.isOpen && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          <button 
            onClick={() => openAppWindow('notes')}
            className={`p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 relative transition-transform hover:scale-105 active:scale-95`}
            title="Workspace Quick Notes"
          >
            <FileText className={`w-5 h-5 ${apps.notes.isOpen ? 'text-amber-400' : ''}`} />
            {apps.notes.isOpen && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
            )}
          </button>

          <div className="w-px bg-white/10 h-6 mx-1" />

          <button 
            onClick={() => openAppWindow('settings')}
            className={`p-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 relative transition-transform hover:scale-105 active:scale-95`}
            title="IRA Configurations"
          >
            <Settings className={`w-5 h-5 ${apps.settings.isOpen ? 'text-violet-400' : ''}`} />
            {apps.settings.isOpen && (
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-violet-400" />
            )}
          </button>

        </div>
      </div>

    </div>
  );
}
