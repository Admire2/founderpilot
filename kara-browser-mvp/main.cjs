const { app, BrowserWindow } = require('electron');
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800, title: 'Kara Browser',
    webPreferences: { 
      nodeIntegration: false, 
      contextIsolation: true, 
      webSecurity: true, 
      webviewTag: true 
    }
  });
  mainWindow.loadURL('http://localhost:5173');
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
