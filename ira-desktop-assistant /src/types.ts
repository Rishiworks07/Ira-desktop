/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IraTheme = 'dark' | 'light' | 'glass' | 'neon' | 'minimal';

export type IraState = 'idle' | 'hover' | 'active' | 'processing' | 'success' | 'error';

export interface IraConfig {
  user_name: string;
  theme: IraTheme;
  orb_color: 'white' | 'black' | 'purple' | 'blue' | 'coral' | 'custom';
  orb_size: number; // 32 to 56, default 40
  orb_position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  idle_opacity: number; // 0.2 to 1.0
  shortcut: string;
  voice_wake_word: boolean;
  launch_at_startup: boolean;
  ai_provider: 'gemini' | 'groq' | 'openai' | 'claude';
  api_key: string;
  gmail_connected: boolean;
  onboarded: boolean;
  contacts: Contact[];
}

export const DEFAULT_CONFIG: IraConfig = {
  user_name: 'there',
  theme: 'dark',
  orb_color: 'purple',
  orb_size: 40,
  orb_position: 'bottom-right',
  idle_opacity: 0.8,
  shortcut: 'Ctrl + Space',
  voice_wake_word: false,
  launch_at_startup: false,
  ai_provider: 'gemini',
  api_key: '',
  gmail_connected: false,
  onboarded: false,
  contacts: [],
};

export interface Reminder {
  id: string;
  text: string;
  timeString: string;
  durationSeconds: number;
  triggerTime: number; // Date.now() + durationSeconds * 1000
  completed: boolean;
  type: 'timer' | 'reminder' | 'alarm';
}

export interface Email {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  isDraft: boolean;
  read: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: string; // e.g. "1 hour", "30 mins"
  description: string;
}

export interface QuickNote {
  id: string;
  content: string;
  timestamp: string; // Locale string
}

export interface ActionLog {
  id: string;
  time: string; // HH:MM:SS
  text: string;
  status: 'info' | 'success' | 'error';
}

export interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
  x: number;
  y: number;
}

export interface MockAppState {
  vscode: WindowState;
  spotify: WindowState;
  gmail: WindowState;
  calendar: WindowState;
  notes: WindowState;
  settings: WindowState;
}

export interface PromptResult {
  tool: 'create_reminder' | 'send_email' | 'create_event' | 'create_note' | 'clipboard_action' | 'open_app' | 'system_search' | 'simple_response' | null;
  args: any;
  responseMessage: string;
}
