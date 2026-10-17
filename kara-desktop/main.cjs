const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow() {
  const isWordStandalone = process.argv.includes('--kara-word');
  const win = new BrowserWindow({
    width: isWordStandalone ? 1400 : 1500,
    height: 950,
    title: isWordStandalone ? 'Kara Word - Sovereign' : 'Kara Office - Sovereign Suite',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, 'build', 'icon.ico'),
    webPreferences: { nodeIntegration: false, contextIsolation: true }
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  
  if (isDev) {
    const devUrl = isWordStandalone ? 'http://localhost:5173/?standalone=word' : 'http://localhost:5173';
    win.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, 'renderer', 'index.html');
    const fileUrl = url.pathToFileURL(indexPath).href;
    const finalUrl = isWordStandalone ? fileUrl + '?standalone=word' : fileUrl;
    win.loadURL(finalUrl);
  }

  win.once('ready-to-show', () => win.show());
  if (process.env.KARA_DEBUG === '1') { win.webContents.openDevTools(); }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());