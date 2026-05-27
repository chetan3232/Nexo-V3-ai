const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('nexoDesktop', {
  platform: process.platform,   // 'win32' | 'darwin' | 'linux'
  runtime:  'electron',
  versions: {
    electron: process.versions.electron,
    node:     process.versions.node,
    chrome:   process.versions.chrome,
  },
});
