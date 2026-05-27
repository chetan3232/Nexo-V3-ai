const { app, BrowserWindow, shell } = require('electron');
const path = require('node:path');
const os   = require('node:os');

function createWindow() {
  const isMac = os.platform() === 'darwin';

  const window = new BrowserWindow({
    width:     1440,
    height:    960,
    minWidth:  1080,
    minHeight: 680,
    backgroundColor: '#0d1117',
    title: 'Nexo AI IDE',

    // Mac: hidden title bar so traffic lights sit in our custom bar
    // Windows/Linux: keep default frame but remove the native menu bar
    ...(isMac
      ? {
          titleBarStyle: 'hiddenInset',
          trafficLightPosition: { x: 14, y: 11 },
        }
      : {
          frame: true,
          autoHideMenuBar: true,   // hides native Win32 menu bar
        }),

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,              // needed for process.platform in preload
    },
  });

  // Open external links in system browser
  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Load the renderer
  if (process.env.ELECTRON_DEV_SERVER_URL) {
    window.loadURL(process.env.ELECTRON_DEV_SERVER_URL + '#/ide');
    window.webContents.openDevTools({ mode: 'detach' });
  } else {
    window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      hash: '/ide',
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
