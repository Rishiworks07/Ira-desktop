import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  executeCommand: (payload: {
    userInput: string;
    userName: string;
    clipboardContent: string;
    systemTime: string;
  }) => ipcRenderer.invoke('execute-command', payload),

  openMainWindow: () => ipcRenderer.invoke('open-main-window'),

  showContextMenu: () => ipcRenderer.send('show-context-menu'),

  orbToggled: (isExpanded: boolean, position: string) => ipcRenderer.send('orb-toggled', isExpanded, position),

  onToggleCommandBar: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('toggle-command-bar', listener);
    return () => ipcRenderer.removeListener('toggle-command-bar', listener);
  },

  onWindowBlurred: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('window-blurred', listener);
    return () => ipcRenderer.removeListener('window-blurred', listener);
  },

  startDrag: (cursorOffsetX: number, cursorOffsetY: number) =>
    ipcRenderer.send('start-drag', { cursorOffsetX, cursorOffsetY }),

  stopDrag: () => ipcRenderer.send('stop-drag'),

  // Toggle click-through on the transparent overlay window
  setClickThrough: (enabled: boolean) => ipcRenderer.send('set-click-through', enabled),

  // Settings & History
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings),
  loadHistory: () => ipcRenderer.invoke('load-history'),
  saveHistory: (history: string[]) => ipcRenderer.invoke('save-history', history),

  onSettingsUpdated: (callback: (settings: any) => void) => {
    const listener = (_event: any, settings: any) => callback(settings);
    ipcRenderer.on('settings-updated', listener);
    return () => ipcRenderer.removeListener('settings-updated', listener);
  },

  platform: process.platform,
});
