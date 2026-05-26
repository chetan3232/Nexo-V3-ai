const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('nexoDesktop', {
  platform: process.platform,
  runtime: 'electron',
});
