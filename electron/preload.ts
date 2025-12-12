// import "ts-node/register";
import electron from "electron";

interface AppSettings {
  geminiApiKey: string;
  minimizeToTray: boolean;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const { contextBridge, ipcRenderer } = electron;
contextBridge.exposeInMainWorld("electronAPI", {
  quit: () => {
    console.log("Quit requested from renderer");
    ipcRenderer.send("quit-app");
  },

  // Settings management
  getSettings: (): Promise<AppSettings> => {
    return ipcRenderer.invoke("get-settings");
  },

  saveSettings: (settings: Partial<AppSettings>): Promise<AppSettings> => {
    return ipcRenderer.invoke("save-settings", settings);
  },

  updateApiKey: (apiKey: string) => {
    ipcRenderer.send("update-api-key", apiKey);
  },

  // Listen for settings events
  onOpenSettings: (callback: (tab?: string) => void) => {
    ipcRenderer.on("open-settings", (_event, tab) => callback(tab));
  },

  // Remove listeners
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});
