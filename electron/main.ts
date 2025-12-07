import electron from "electron";
import electronDebug from "electron-debug";
import isDev from "electron-is-dev";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

electronDebug();

let mainWindow: electron.BrowserWindow | null = null;
let tray: electron.Tray | null = null;
let isQuitting = false;

// Settings management
interface AppSettings {
  geminiApiKey: string;
  minimizeToTray: boolean;
}

const defaultSettings: AppSettings = {
  geminiApiKey: "",
  minimizeToTray: true,
};

function getSettingsPath(): string {
  const userDataPath = electron.app.getPath("userData");
  return path.join(userDataPath, "settings.json");
}

function loadSettings(): AppSettings {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      const settings = JSON.parse(data);
      return { ...defaultSettings, ...settings };
    }
  } catch (error) {
    console.warn("Could not load settings:", error);
  }
  return defaultSettings;
}

function saveSettings(settings: AppSettings): void {
  try {
    const settingsPath = getSettingsPath();
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Could not save settings:", error);
  }
}

let appSettings = loadSettings();
function createTray() {
  try {
    // Try to create a fallback icon if the icon file doesn't exist
    const iconPath = process.cwd() + "/dist-electron/.icon-ico/icon.ico";

    // Create a simple fallback icon using nativeImage
    const fallbackIcon = electron.nativeImage.createFromDataURL(
      `data:image/png;base64,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`,
    );

    try {
      // Try to use the actual icon file
      tray = new electron.Tray(iconPath);
    } catch (iconError) {
      console.warn("Could not load tray icon, using fallback:", iconError);
      tray = new electron.Tray(fallbackIcon);
    }

    const contextMenu = electron.Menu.buildFromTemplate([
      {
        label: "Show Application",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: "Settings",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            // Send event to open settings
            mainWindow.webContents.send("open-settings", "general");
          }
        },
      },
      {
        label: "About",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send("open-settings", "about");
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          electron.app.quit();
        },
      },
    ]);

    tray.setToolTip("PixelForge Ai Studio");
    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    console.log("Tray created successfully");
  } catch (error) {
    console.error("Error creating tray:", error);
  }
}

function createWindow() {
  try {
    console.log("Creating BrowserWindow...");
    const iconPath = path.join(
      electron.app.getAppPath(),
      "dist-electron/.icon-ico/icon.ico",
    );
    let preloadPath: string;
    if (isDev) {
      preloadPath = path.join(electron.app.getAppPath(), "preload.js");
    } else {
      preloadPath = path.join(__dirname, "preload.js");
    }
    const win = new electron.BrowserWindow({
      width: 1280,
      height: 720,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: preloadPath,
      },
    });

    mainWindow = win;
    console.log("BrowserWindow created successfully");

    // Create tray
    createTray();

    // Handle window close event
    win.on("close", (event: Electron.Event) => {
      if (!isQuitting && appSettings.minimizeToTray) {
        event.preventDefault();
        win.hide();
        if (tray) {
          tray.displayBalloon({
            title: "PixelForge Ai Studio",
            content: "Application minimized to tray",
          });
        }
      }
    });

    // Force clear cache to ensure new assets are loaded
    win.webContents.session.clearCache().then(() => {
      console.log("Cache cleared!");
    });

    if (isDev) {
      console.log("Loading development URL...");
      win.loadURL("http://localhost:3005");
      win.webContents.openDevTools();
    } else {
      console.log("Loading production file...");
      // Use app.getAppPath() instead of process.cwd() for packaged builds
      const appPath = electron.app.getAppPath();
      const indexPath = process.env.ELECTRON_START_URL
        ? path.join(process.cwd(), "dist/index.html")
        : path.join(appPath, "dist/index.html");
      win.loadFile(indexPath);
    }
  } catch (error) {
    console.error("Error creating window:", error);
  }
}

electron.app.whenReady().then(() => {
  console.log("Electron app ready, creating window...");
  createWindow();

  // Handle quit requests from renderer process
  electron.ipcMain.on("quit-app", () => {
    console.log("Quit request received from renderer");
    isQuitting = true;
    electron.app.quit();
  });

  // Handle settings requests from renderer process
  electron.ipcMain.handle("get-settings", () => {
    return appSettings;
  });

  electron.ipcMain.handle(
    "save-settings",
    (event, newSettings: Partial<AppSettings>) => {
      appSettings = { ...appSettings, ...newSettings };
      saveSettings(appSettings);
      return appSettings;
    },
  );

  // Handle API key update from renderer
  electron.ipcMain.on(
    "update-api-key",
    (event: Electron.Event, apiKey: string) => {
      appSettings.geminiApiKey = apiKey;
      saveSettings(appSettings);
      console.log("API Key updated successfully");
    },
  );

  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) {
      console.log("Creating window on activate");
      createWindow();
    } else if (mainWindow?.isMinimized()) {
      mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

electron.app.on("window-all-closed", () => {
  // On macOS, keep app running even when all windows are closed
  // On other platforms, quit if no windows are open and not minimizing to tray
  if (process.platform !== "darwin") {
    if (!tray || !appSettings.minimizeToTray) {
      electron.app.quit();
    }
  }
});

electron.app.on("before-quit", () => {
  isQuitting = true;
});
