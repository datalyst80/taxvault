import { app, BrowserWindow } from 'electron';
import * as path from 'path';

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    titleBarStyle: 'hiddenInset', // 🎯 das blendet die Titelleiste aus, aber zeigt die Buttons
    titleBarOverlay: false,       // kein Overlay – ganz clean    
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // sicherer Zugriff auf Node-API im Renderer
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, '../index.html'));
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
