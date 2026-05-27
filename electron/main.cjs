const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const path = require('node:path');
const os   = require('node:os');
const child_process = require('node:child_process');

// Load environment variables securely from .env
require('dotenv').config();

let shellProcess = null;

function setupCorsForNvidia() {
  // Allow renderer process to call NVIDIA API directly without CORS errors.
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['https://integrate.api.nvidia.com/*'] },
    (details, callback) => {
      delete details.requestHeaders['Origin'];
      details.requestHeaders['Referer'] = 'https://integrate.api.nvidia.com';
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: ['https://integrate.api.nvidia.com/*'] },
    (details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Access-Control-Allow-Origin':  ['*'],
          'Access-Control-Allow-Methods': ['GET, POST, OPTIONS, PUT, DELETE'],
          'Access-Control-Allow-Headers': ['Content-Type, Authorization, Accept'],
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
            "default-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "connect-src 'self' https://integrate.api.nvidia.com http://localhost:* ws://localhost:* wss://localhost:* https://fonts.googleapis.com; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: blob:;"
          ],
        },
      });
    }
  );
}

function setupTerminalIpc(window) {
  const isWin = os.platform() === 'win32';
  const shellCmd = isWin ? 'powershell.exe' : (process.env.SHELL || 'bash');

  ipcMain.on('terminal-init', () => {
    if (shellProcess) {
      try { shellProcess.kill(); } catch (e) {}
    }

    shellProcess = child_process.spawn(shellCmd, [], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    shellProcess.stdout.on('data', (data) => {
      window.webContents.send('terminal-data', data.toString());
    });

    shellProcess.stderr.on('data', (data) => {
      window.webContents.send('terminal-data', data.toString());
    });

    shellProcess.on('exit', () => {
      window.webContents.send('terminal-data', '\r\n[Shell process exited]\r\n');
      shellProcess = null;
    });
  });

  ipcMain.on('terminal-input', (event, data) => {
    if (shellProcess && shellProcess.stdin.writable) {
      shellProcess.stdin.write(data);
    }
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
  setupCorsForNvidia();
  setupContentSecurityPolicy();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (shellProcess) {
    try { shellProcess.kill(); } catch (e) {}
  }
  if (process.platform !== 'darwin') app.quit();
});
