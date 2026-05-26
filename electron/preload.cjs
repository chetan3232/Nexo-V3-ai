const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexoDesktop', {
  platform: process.platform,
  runtime: 'electron',
  versions: {
    electron: process.versions.electron,
    node:     process.versions.node,
    chrome:   process.versions.chrome,
  },
});
