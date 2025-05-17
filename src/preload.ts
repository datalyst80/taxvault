import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Beispiel: Funktionen, um vom Renderer aus mit Main Prozess zu kommunizieren
  sendMessage: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  onMessage: (channel: string, callback: (event: any, data: any) => void) => {
    ipcRenderer.on(channel, (event, data) => callback(event, data));
  }
});
