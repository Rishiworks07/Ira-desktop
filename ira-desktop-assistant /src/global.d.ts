export {};

declare global {
  interface Window {
    electronAPI?: {
      executeCommand: (payload: {
        userInput: string;
        userName: string;
        clipboardContent: string;
        systemTime: string;
      }) => Promise<{ tool: string; args: any; responseMessage: string }>;
      openMainWindow: () => Promise<void>;
      showContextMenu: () => void;
      orbToggled: (isExpanded: boolean, position: string) => void;
      onToggleCommandBar: (cb: () => void) => () => void;
      onWindowBlurred: (cb: () => void) => () => void;
      startDrag: (cursorOffsetX: number, cursorOffsetY: number) => void;
      stopDrag: () => void;
      setClickThrough: (enabled: boolean) => void;

      // Settings & History
      loadSettings: () => Promise<any>;
      saveSettings: (settings: any) => Promise<boolean>;
      loadHistory: () => Promise<string[]>;
      saveHistory: (history: string[]) => Promise<boolean>;
      onSettingsUpdated: (callback: (settings: any) => void) => () => void;
      
      platform: NodeJS.Platform;
    };
  }
}
