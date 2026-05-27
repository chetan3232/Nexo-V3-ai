const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexoDesktop', {
  platform: process.platform,   // 'win32' | 'darwin' | 'linux'
  runtime:  'electron',
  versions: {
    electron: process.versions.electron,
    node:     process.versions.node,
    chrome:   process.versions.chrome,
  },
  // Secure terminal IPC bindings
  initTerminal: () => {
    ipcRenderer.send('terminal-init');
  },
  sendTerminalInput: (data) => {
    ipcRenderer.send('terminal-input', data);
  },
  onTerminalData: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('terminal-data', subscription);
    // Return cleanup function to easily unsubscribe inside React hooks
    return () => {
      ipcRenderer.removeListener('terminal-data', subscription);
    };
  },
  // Securely retrieve the NVIDIA key from Node process env
  getNvidiaKey: () => {
    return process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY || '';
  },
});
