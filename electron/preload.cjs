const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexoDesktop', {
  platform: process.platform,   // 'win32' | 'darwin' | 'linux'
  runtime:  'electron',
  versions: {
    electron: process.versions.electron,
    node:     process.versions.node,
    chrome:   process.versions.chrome,
  },
  // Secure concurrent terminal IPC bindings
  initTerminal: (id) => {
    ipcRenderer.send('terminal-init', id);
  },
  sendTerminalInput: (id, data) => {
    ipcRenderer.send('terminal-input', id, data);
  },
  onTerminalData: (id, callback) => {
    const channel = `terminal-data-${id}`;
    const subscription = (event, data) => callback(data);
    ipcRenderer.on(channel, subscription);
    // Return cleanup function to easily unsubscribe inside React hooks
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  killTerminal: (id) => {
    ipcRenderer.send('terminal-kill', id);
  },
  // Securely retrieve the NVIDIA key from Node process env
  getNvidiaKey: () => {
    return process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY || '';
  },
  getOpenaiKey: () => {
    return process.env.OPENAI_API_KEY || '';
  },
  getClaudeKey: () => {
    return process.env.CLAUDE_API_KEY || '';
  },
  getGeminiKey: () => {
    return process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  },
  getOpenrouterKey: () => {
    return process.env.OPENROUTER_API_KEY || '';
  },
  getDeepseekKey: () => {
    return process.env.DEEPSEEK_API_KEY || '';
  },
  selectFolder: () => {
    return ipcRenderer.invoke('select-folder');
  },
});
