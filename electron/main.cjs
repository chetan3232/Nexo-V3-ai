const { app, BrowserWindow, shell, session, ipcMain, dialog, Menu } = require('electron');
const path = require('node:path');
const os   = require('node:os');
const child_process = require('node:child_process');

// Load environment variables securely from .env
require('dotenv').config();

const shellProcesses = new Map();

function setupCorsForAI() {
  const aiUrls = [
    'https://integrate.api.nvidia.com/*',
    'https://api.openai.com/*',
    'https://api.anthropic.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://openrouter.ai/*',
    'https://api.deepseek.com/*',
    'http://localhost:11434/*'
  ];

  // Allow renderer process to call AI APIs directly without CORS errors.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: aiUrls },
    (details, callback) => {
      delete details.requestHeaders['Origin'];
      try {
        const urlObj = new URL(details.url);
        details.requestHeaders['Referer'] = urlObj.origin;
      } catch (e) {
        details.requestHeaders['Referer'] = details.url;
      }
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: aiUrls },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin':  ['*'],
          'Access-Control-Allow-Methods': ['GET, POST, OPTIONS, PUT, DELETE, PATCH'],
          'Access-Control-Allow-Headers': ['Content-Type, Authorization, Accept, anthropic-version, x-api-key'],
        },
      });
    }
  );
}

function setupContentSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['http://localhost:*/*', 'file://*'] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://bundle.run blob:; " +
            "connect-src 'self' https://integrate.api.nvidia.com https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://openrouter.ai https://api.deepseek.com http://localhost:11434 http://localhost:* ws://localhost:* wss://localhost:* https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
            "font-src 'self' https://fonts.gstatic.com data:; " +
            "img-src 'self' data: blob:; " +
            "worker-src 'self' blob:;"
          ],
        },
      });
    }
  );
}

function setupTerminalIpc(window) {
  const isWin = os.platform() === 'win32';
  const shellCmd = isWin ? 'powershell.exe' : (process.env.SHELL || 'bash');

  ipcMain.handle('select-folder', async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Open Workspace Folder',
      buttonLabel: 'Select Folder',
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });

  ipcMain.on('terminal-init', (event, id) => {
    if (shellProcesses.has(id)) return; // shell already active

    const processInstance = child_process.spawn(shellCmd, [], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    shellProcesses.set(id, processInstance);

    processInstance.stdout.on('data', (data) => {
      if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
        window.webContents.send(`terminal-data-${id}`, data.toString());
      }
    });

    processInstance.stderr.on('data', (data) => {
      if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
        window.webContents.send(`terminal-data-${id}`, data.toString());
      }
    });

    processInstance.on('exit', () => {
      if (!window.isDestroyed() && !window.webContents.isDestroyed()) {
        window.webContents.send(`terminal-data-${id}`, '\r\n[Shell process exited]\r\n');
      }
      shellProcesses.delete(id);
    });
  });

  ipcMain.on('terminal-input', (event, id, data) => {
    const processInstance = shellProcesses.get(id);
    if (processInstance && processInstance.stdin.writable) {
      processInstance.stdin.write(data);
    }
  });

  ipcMain.on('terminal-kill', (event, id) => {
    const processInstance = shellProcesses.get(id);
    if (processInstance) {
      try { processInstance.kill(); } catch (e) {}
      shellProcesses.delete(id);
    }
  });

  // Native Window and File Dialog Actions
  ipcMain.handle('save-file-dialog', async (event, defaultPath) => {
    const result = await dialog.showSaveDialog(window, {
      defaultPath,
      title: 'Save File As',
      buttonLabel: 'Save',
    });
    if (result.canceled || !result.filePath) return null;
    return result.filePath;
  });

  ipcMain.on('window-minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.minimize();
  });

  ipcMain.on('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      if (win.isMaximized()) win.unmaximize();
      else win.maximize();
    }
  });

  ipcMain.on('window-close', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.close();
  });

  ipcMain.on('window-fullscreen', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) win.setFullScreen(!win.isFullScreen());
  });

  ipcMain.on('new-window', () => {
    createWindow();
  });
}

function createWindow() {
  const isMac = os.platform() === 'darwin';

  const window = new BrowserWindow({
    width:     1440,
    height:    960,
    minWidth:  1080,
    minHeight: 680,
    backgroundColor: '#0d1117',
    title: 'Nexo AI IDE',

    ...(isMac
      ? {
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 14, y: 11 },
        }
      : {
          frame: true,
          autoHideMenuBar: true,
        }),

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // Disable web security to completely bypass CORS checks in renderer
      webSecurity: false,
    },
  });

  // Start bidirectional terminal streams
  setupTerminalIpc(window);

  // Initialize Native Application Menu Bar
  createApplicationMenu(window);

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (process.env.ELECTRON_DEV_SERVER_URL) {
    window.loadURL(process.env.ELECTRON_DEV_SERVER_URL + '#/ide');
    // Open DevTools in dev mode for easy debugging and inspection
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      hash: '/ide',
    });
  }
}

app.whenReady().then(() => {
  setupCorsForAI();
  setupContentSecurityPolicy();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  // Gracefully terminate all active shell subprocesses on window close
  for (const [id, proc] of shellProcesses.entries()) {
    try { proc.kill(); } catch (e) {}
  }
  shellProcesses.clear();
  if (process.platform !== 'darwin') app.quit();
});

function createApplicationMenu(window) {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => { window.webContents.send('menu-command', 'new-file'); }
        },
        {
          label: 'New Window',
          click: () => { window.webContents.send('menu-command', 'new-window'); }
        },
        { type: 'separator' },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+O',
          click: () => { window.webContents.send('menu-command', 'open-folder'); }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => { window.webContents.send('menu-command', 'save-file'); }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => { window.webContents.send('menu-command', 'save-as'); }
        },
        { type: 'separator' },
        {
          label: 'Auto Save',
          type: 'checkbox',
          checked: true,
          click: (menuItem) => { window.webContents.send('menu-command', 'toggle-auto-save', menuItem.checked); }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          role: 'quit'
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', click: () => { window.webContents.send('menu-command', 'undo'); } },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', click: () => { window.webContents.send('menu-command', 'redo'); } },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { label: 'Select All', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find', accelerator: 'CmdOrCtrl+F', click: () => { window.webContents.send('menu-command', 'find'); } },
        { label: 'Replace', accelerator: 'CmdOrCtrl+H', click: () => { window.webContents.send('menu-command', 'replace'); } }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => { window.webContents.send('menu-command', 'toggle-sidebar'); } },
        { label: 'Toggle Terminal', accelerator: 'CmdOrCtrl+J', click: () => { window.webContents.send('menu-command', 'toggle-terminal'); } },
        { label: 'Toggle AI Panel', accelerator: 'CmdOrCtrl+Shift+A', click: () => { window.webContents.send('menu-command', 'toggle-ai'); } },
        { type: 'separator' },
        { label: 'Toggle Minimap', click: () => { window.webContents.send('menu-command', 'toggle-minimap'); } },
        { type: 'separator' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => { window.webContents.send('menu-command', 'zoom-in'); } },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => { window.webContents.send('menu-command', 'zoom-out'); } },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Go',
      submenu: [
        { label: 'Go to File', accelerator: 'CmdOrCtrl+P', click: () => { window.webContents.send('menu-command', 'go-to-file'); } },
        { label: 'Go to Line', accelerator: 'CmdOrCtrl+G', click: () => { window.webContents.send('menu-command', 'go-to-line'); } },
        { type: 'separator' },
        { label: 'Next Tab', accelerator: 'Ctrl+Tab', click: () => { window.webContents.send('menu-command', 'next-tab'); } }
      ]
    },
    {
      label: 'Run',
      submenu: [
        { label: 'Run Project', click: () => { window.webContents.send('menu-command', 'run-project'); } },
        { label: 'Stop Project', click: () => { window.webContents.send('menu-command', 'stop-project'); } },
        { label: 'Restart Project', click: () => { window.webContents.send('menu-command', 'restart-project'); } },
        { type: 'separator' },
        { label: 'Run Current File', click: () => { window.webContents.send('menu-command', 'run-current-file'); } }
      ]
    },
    {
      label: 'Terminal',
      submenu: [
        { label: 'New Terminal', accelerator: 'Ctrl+`', click: () => { window.webContents.send('menu-command', 'new-terminal'); } }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => { shell.openExternal('https://github.com/chetan3232/Nexo-V3-ai'); } },
        { label: 'About', click: () => { window.webContents.send('menu-command', 'about'); } }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
