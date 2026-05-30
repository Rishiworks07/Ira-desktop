import { app, BrowserWindow, ipcMain, globalShortcut, screen, shell, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

// ─── Local Storage Paths ──────────────────────────────────────────────────────
const IRA_DIR = path.join(os.homedir(), '.ira');
if (!fs.existsSync(IRA_DIR)) {
  fs.mkdirSync(IRA_DIR, { recursive: true });
}
const SETTINGS_PATH = path.join(IRA_DIR, 'settings.json');
const HISTORY_PATH = path.join(IRA_DIR, 'history.json');

// ─── OS App Launcher ──────────────────────────────────────────────────────────
function launchApp(appName: string) {
  const isMac = process.platform === 'darwin';
  const isWin = process.platform === 'win32';

  let cmd = '';
  if (appName.toLowerCase() === 'spotify') {
    cmd = isMac ? 'open -a Spotify' : isWin ? 'start spotify:' : 'spotify';
  } else if (appName.toLowerCase() === 'vscode' || appName.toLowerCase() === 'code') {
    cmd = isMac ? 'open -a "Visual Studio Code"' : isWin ? 'code' : 'code';
  } else if (appName.toLowerCase() === 'chrome') {
    cmd = isMac ? 'open -a "Google Chrome"' : isWin ? 'start chrome' : 'google-chrome';
  } else {
    // Generic fallback
    cmd = isMac ? `open -a "${appName}"` : isWin ? `start ${appName}` : appName;
  }

  exec(cmd, (error) => {
    if (error) console.error(`Failed to launch ${appName}:`, error);
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV !== 'production';

// In dev, __dirname = dist-electron/electron/ (2 levels from project root)
// In production (packaged), extra resources are placed differently
const projectRoot = isDev
  ? path.join(__dirname, '..', '..')
  : path.join(process.resourcesPath || __dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });


let orbWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;

// ─── Gemini AI Setup ──────────────────────────────────────────────────────────
let ai: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

if (API_KEY && API_KEY !== 'your_api_key_here' && API_KEY.length > 10) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
    console.log('✓ Gemini AI initialized.');
  } catch (e) {
    console.error('✗ Gemini init failed:', e);
  }
} else {
  console.warn('⚠ GEMINI_API_KEY not set. Using local fallback parser.');
}

// ─── Heuristic Fallback Parser ────────────────────────────────────────────────
function getLocalFallback(text: string, name: string) {
  const q = text.toLowerCase();

  if (q.includes('remind') || q.includes('timer') || q.includes('alarm')) {
    let delay = 10;
    const secMatch = q.match(/(\d+)\s*sec/);
    const minMatch = q.match(/(\d+)\s*min/);
    if (secMatch) delay = parseInt(secMatch[1]);
    else if (minMatch) delay = parseInt(minMatch[1]) * 60;
    return {
      tool: 'create_reminder',
      args: { text: text.replace(/remind me to|timer for|alarm for/gi, '').trim() || 'Stand up and stretch', delaySeconds: delay, timeString: `in ${delay < 60 ? delay + 's' : Math.round(delay / 60) + ' min'}`, type: 'timer' },
      responseMessage: `Sure, ${name}! I've set a reminder for you.`
    };
  }
  if (q.includes('mail') || q.includes('email') || q.includes('draft')) {
    return { tool: 'send_email', args: { recipient: 'irfan@gmail.com', subject: 'Quick Update via IRA', body: `Hi,\n\n${text.replace(/mail \w+ about|email \w+ that/gi, '').trim()}\n\nBest,\n${name}` }, responseMessage: `Email drafted and sent for you, ${name}.` };
  }
  if (q.includes('schedule') || q.includes('meeting') || q.includes('event') || q.includes('calendar')) {
    return { tool: 'create_event', args: { title: text.replace(/schedule|meeting|calendar|event/gi, '').trim() || 'Project Sync', date: new Date().toISOString().split('T')[0], startTime: '15:00', duration: '1 hour', description: 'Organized by IRA' }, responseMessage: `Meeting scheduled! Added to your calendar, ${name}.` };
  }
  if (q.includes('note') || q.includes('save') || q.includes('remember') || q.includes('write')) {
    return { tool: 'create_note', args: { content: text.replace(/note|save|remember|write/gi, '').trim() || text }, responseMessage: `Got it, ${name}. Saved to your notes.` };
  }
  if (q.includes('open') || q.includes('spotify') || q.includes('vscode') || q.includes('gmail')) {
    let appName = 'vscode';
    if (q.includes('spotify')) appName = 'spotify';
    else if (q.includes('gmail')) appName = 'gmail';
    else if (q.includes('calendar')) appName = 'calendar';
    else if (q.includes('notes')) appName = 'notes';
    else if (q.includes('settings')) appName = 'settings';
    return { tool: 'open_app', args: { appName }, responseMessage: `Opening ${appName} for you, ${name}!` };
  }
  // Default: treat as a conversation / question
  return { tool: 'simple_response', args: { text }, responseMessage: `Hi ${name}! I'm IRA, your ambient AI companion. I can help you send emails, set reminders, schedule events, take notes, and answer your questions. What can I do for you?` };
}

// ─── Local Tool Execution ─────────────────────────────────────────────────────
function executeToolAction(result: any) {
  if (result.tool === 'open_app' && result.args?.appName) {
    launchApp(result.args.appName);
  } else if (result.tool === 'create_note' && result.args?.content) {
    // Basic local note saving
    const notesPath = path.join(IRA_DIR, 'notes.json');
    let notes = [];
    if (fs.existsSync(notesPath)) {
      try { notes = JSON.parse(fs.readFileSync(notesPath, 'utf8')); } catch (e) { }
    }
    notes.push({ id: Date.now(), content: result.args.content, timestamp: new Date().toISOString() });
    fs.writeFileSync(notesPath, JSON.stringify(notes, null, 2));
  }
}

// ─── IPC: Settings & History ──────────────────────────────────────────────────
ipcMain.handle('load-settings', () => {
  if (fs.existsSync(SETTINGS_PATH)) {
    try { return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch (e) { return null; }
  }
  return null;
});

ipcMain.handle('save-settings', (_event, settings) => {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));

  // Broadcast updated settings to all windows so they stay in sync
  if (orbWindow && !orbWindow.isDestroyed()) {
    orbWindow.webContents.send('settings-updated', settings);
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings-updated', settings);
  }

  return true;
});

ipcMain.handle('load-history', () => {
  if (fs.existsSync(HISTORY_PATH)) {
    try { return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8')); } catch (e) { return []; }
  }
  return [];
});

ipcMain.handle('save-history', (_event, history) => {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  return true;
});

// ─── IPC: Execute AI Command ──────────────────────────────────────────────────
ipcMain.handle('execute-command', async (_event, { userInput, userName, clipboardContent, systemTime }) => {
  if (!userInput) return { tool: null, args: {}, responseMessage: 'No input provided.' };

  let result = null;

  if (ai) {
    try {
      const systemInstruction = `
You are IRA, a warm, intelligent, and witty ambient AI desktop companion. The user's name is "${userName}".
Current system time: ${systemTime || new Date().toISOString()}.
User clipboard: "${clipboardContent || 'empty'}".

Your role is DUAL:
1. Execute desktop tasks (reminders, emails, events, notes, app opening).
2. Answer general questions, have conversations, tell jokes, explain concepts — be genuinely helpful and warm.

For task commands, map them to a specific tool. For general questions/conversation, use "simple_response" with a full, helpful answer.

Map to one of these tools:
- "create_reminder": set timers/alarms. Args: text, delaySeconds (number), timeString (human-readable), type ("timer"|"reminder"|"alarm")
- "send_email": draft emails. Args: recipient, subject, body
- "create_event": schedule calendar events. Args: title, date (YYYY-MM-DD), startTime (HH:MM), duration, description
- "create_note": save notes/thoughts. Args: content
- "clipboard_action": process clipboard text. Args: action ("summarize"|"rewrite"|"simplify"|"translate"), textContent
- "open_app": open apps. Args: appName ("vscode"|"spotify"|"gmail"|"calendar"|"notes"|"settings")
- "system_search": search workspace. Args: query
- "simple_response": answer questions, chat, jokes, explanations. Args: text (your full response)

IMPORTANT: For simple_response, write a FULL, genuinely helpful answer in responseMessage. Be warm, a bit witty, and concise.

Respond ONLY with valid JSON:
{"tool": "...", "args": {...}, "responseMessage": "Your spoken response to the user, warm and personal."}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: userInput,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tool: { type: Type.STRING },
              args: { type: Type.OBJECT },
              responseMessage: { type: Type.STRING }
            },
            required: ['tool', 'args', 'responseMessage']
          }
        }
      });

      const text = response.text?.trim() ?? '';
      result = JSON.parse(text);
    } catch (err) {
      console.error('Gemini error:', err);
      result = getLocalFallback(userInput, userName);
    }
  } else {
    result = getLocalFallback(userInput, userName);
  }

  // Execute actual OS/local actions based on the result
  executeToolAction(result);

  return result;
});

// ─── IPC: Context Menu ────────────────────────────────────────────────────────
ipcMain.on('show-context-menu', (event) => {
  const template = [
    {
      label: 'Settings',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    {
      label: 'Command History',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createMainWindow();
        }
      }
    },
    { type: 'separator' as const },
    {
      label: 'About Ira',
      click: () => {
        // Will open the GitHub repo or a simple about page
        shell.openExternal('https://github.com');
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) || undefined });
});

// ─── IPC: Open Main Workspace Window ─────────────────────────────────────────
ipcMain.handle('open-main-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }
  createMainWindow();
});

// ─── IPC: Forward events between windows ─────────────────────────────────────
// Monica-style: resize the physical window on expand/collapse.
// Small window (orb-sized) = zero impact on other apps.
// Expanded window = exactly fits the card + shadow padding.
// Clicking outside the physical window goes straight to other apps.
const ORB_W = 72;         // px — orb window (80px orb + 4px padding each side)
// Expanded: always use full screen width — the card is centered via CSS max-width.
// This guarantees the OS window is never narrower than the card on any monitor.
const BAR_H = 520;        // px — window height when expanded (extra for top padding)
const SHADOW = 32;        // px — transparent padding for box-shadow breathing room

let orbExpanded = false; // track expansion state in main process

// Cursor-polling interval: toggles click-through based on whether the
// cursor is physically over the small orb window. This is the correct
// approach for Linux where setIgnoreMouseEvents({forward:true}) is
// documented as macOS/Windows only.
let hoverInterval: ReturnType<typeof setInterval> | null = null;

function startOrbHoverCheck() {
  if (hoverInterval) return;
  hoverInterval = setInterval(() => {
    if (!orbWindow || orbWindow.isDestroyed() || orbExpanded) return;
    const { x, y } = screen.getCursorScreenPoint();
    const b = orbWindow.getBounds();
    // Orb is centered in the 100×100 window.
    // Only enable interaction when cursor is within the orb CIRCLE, not the whole square.
    const centerX = b.x + b.width / 2;
    const centerY = b.y + b.height / 2;
    const ORB_RADIUS = 42; // px — slightly larger than visual (40px radius) for easy clicking
    const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    orbWindow.setIgnoreMouseEvents(dist > ORB_RADIUS);
  }, 40);
}

const EXPANDED_W = 1000;
let collapsedBounds = { x: 0, y: 0, width: ORB_W, height: ORB_W };

function applyOrbBounds(isExpanded: boolean, _position: string) {
  if (!orbWindow || orbWindow.isDestroyed()) return;
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const currentBounds = orbWindow.getBounds();

  if (isExpanded) {
    // 1. Save the EXACT position of the orb so we can restore it on collapse
    // Only save if we are currently small (orb size), otherwise we'd overwrite it
    if (currentBounds.width <= ORB_W + 10) {
      collapsedBounds = { ...currentBounds };
    }

    const newW = EXPANDED_W;
    const newH = BAR_H + SHADOW;

    // 2. Expand naturally from the orb's current position
    // Center the expanded UI over the orb horizontally
    let nx = collapsedBounds.x + (collapsedBounds.width / 2) - (newW / 2);
    
    // Keep it on the screen (prevent horizontal clipping)
    if (nx < 0) nx = 0;
    if (nx + newW > sw) nx = sw - newW;

    // Expand vertically based on whether the orb is in the top or bottom half
    let ny;
    const isBottomHalf = (collapsedBounds.y + collapsedBounds.height / 2) > (sh / 2);
    if (isBottomHalf) {
      // Expand upwards
      ny = collapsedBounds.y + collapsedBounds.height - newH;
    } else {
      // Expand downwards
      ny = collapsedBounds.y;
    }

    // Keep it on the screen (prevent vertical clipping)
    if (ny < 0) ny = 0;
    if (ny + newH > sh) ny = sh - newH;

    // Use setMinimumSize before setBounds to force aggressive window managers to accept the resize
    orbWindow.setMinimumSize(newW, newH);
    orbWindow.setBounds({ x: Math.round(nx), y: Math.round(ny), width: newW, height: newH });
    orbWindow.setIgnoreMouseEvents(false);
  } else {
    // 3. Restore the orb to its exact pre-expanded position
    orbWindow.setMinimumSize(ORB_W, ORB_W);
    orbWindow.setBounds({
      x: collapsedBounds.x,
      y: collapsedBounds.y,
      width: ORB_W,
      height: ORB_W
    });
    orbWindow.setIgnoreMouseEvents(true); // Hover-check takes over
  }
}

ipcMain.on('orb-toggled', (_event, isExpanded: boolean, position: string = 'bottom-right') => {
  orbExpanded = isExpanded;
  if (orbWindow && !orbWindow.isDestroyed()) {
    orbWindow.setAlwaysOnTop(true, 'screen-saver');
    applyOrbBounds(isExpanded, position);
  }
});

// ─── IPC: Move orb window (cross-platform dragging) ──────────────────────────
// The renderer window is small — when the user drags, the cursor immediately
// leaves the window and mousemove events stop. Instead, we start/stop a
// setInterval in the MAIN PROCESS that polls screen.getCursorScreenPoint()
// (which always knows where the cursor is, anywhere on screen) and moves
// the window via setPosition().

let dragInterval: ReturnType<typeof setInterval> | null = null;

ipcMain.on('start-drag', (_event, { cursorOffsetX, cursorOffsetY }: { cursorOffsetX: number; cursorOffsetY: number }) => {
  // Clear any stale interval
  if (dragInterval) clearInterval(dragInterval);

  dragInterval = setInterval(() => {
    if (!orbWindow || orbWindow.isDestroyed()) {
      clearInterval(dragInterval!);
      dragInterval = null;
      return;
    }
    const { x, y } = screen.getCursorScreenPoint();
    // In full-screen mode, orb position is tracked as a CSS transform in React
    // We broadcast cursor position to the renderer
    orbWindow.webContents.send('cursor-position', { x, y });
  }, 16); // ~60 fps
});

ipcMain.on('stop-drag', () => {
  if (dragInterval) {
    clearInterval(dragInterval);
    dragInterval = null;
  }
});

// Toggle click-through: when true, clicks pass through transparent areas to apps below
ipcMain.on('set-click-through', (_event, enabled: boolean) => {
  if (!orbWindow || orbWindow.isDestroyed()) return;
  orbWindow.setIgnoreMouseEvents(enabled, { forward: true });
});

// ─── Create Floating Orb Window ───────────────────────────────────────────────
// Monica-style: the window starts at orb size (100x100).
// When the user expands the bar, the window resizes to full-width strip.
// Clicks outside the physical window go straight to other apps on ALL platforms.
function createOrbWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  let settings: any = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    try { settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8')); } catch { }
  }
  const pos = settings.orb_position || 'bottom-right';

  const startX = pos.includes('left') ? 0 : sw - ORB_W;
  const startY = pos.includes('top') ? 0 : sh - ORB_W;

  orbWindow = new BrowserWindow({
    width: ORB_W,
    height: ORB_W,
    x: startX,
    y: startY,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    skipTaskbar: true,
    type: 'panel',
    resizable: true,
    hasShadow: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  orbWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  orbWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  // Start click-through by default; hover-check will disable it when cursor is over the orb.
  orbWindow.setIgnoreMouseEvents(true);
  startOrbHoverCheck();

  if (isDev) {
    orbWindow.loadURL('http://localhost:5173/orb.html');
  } else {
    orbWindow.loadFile(path.join(__dirname, '../dist/orb.html'));
  }

  orbWindow.on('blur', () => {
    if (orbWindow && !orbWindow.isDestroyed()) {
      orbWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      orbWindow.webContents.send('window-blurred');
    }
  });

  orbWindow.on('closed', () => { orbWindow = null; });
}

// ─── Create Main Workspace Window ─────────────────────────────────────────────
function createMainWindow() {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1400, sw),
    height: Math.min(900, sh),
    minWidth: 900,
    minHeight: 600,
    frame: true,
    transparent: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    title: 'IRA — Ambient Desktop Assistant',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.center();

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── App Lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createOrbWindow();

  // Global shortcut: Ctrl+Space to toggle the orb's command bar (expand/collapse)
  globalShortcut.register('CommandOrControl+Space', () => {
    if (!orbWindow || orbWindow.isDestroyed()) return;

    // Make sure window is visible and on top before sending toggle
    orbWindow.show();
    orbWindow.setAlwaysOnTop(true, 'screen-saver', 1);

    // Tell the React frontend to expand/collapse the command bar
    orbWindow.webContents.send('toggle-command-bar');
  });

  app.on('activate', () => {
    if (!orbWindow) createOrbWindow();
  });
});

app.on('window-all-closed', () => {
  // Don't quit when main workspace is closed — orb keeps running
  // Only quit on non-mac if the orb itself is gone
  if (process.platform !== 'darwin') {
    // Check if orb is the only thing left — if so, keep running
    // App quits only when explicitly asked
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
