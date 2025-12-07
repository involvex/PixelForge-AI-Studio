import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import debug from "electron-debug";
debug();

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
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
  const userDataPath = app.getPath("userData");
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
    const iconPath = path.join(
      app.getAppPath(),
      "dist-electron/.icon-ico/icon.ico",
    );

    // Create a simple fallback icon using nativeImage
    const fallbackIcon = nativeImage.createFromDataURL(
      `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
    );

    try {
      // Try to use the actual icon file
      tray = new Tray(iconPath);
    } catch (iconError) {
      console.warn("Could not load tray icon, using fallback:", iconError);
      tray = new Tray(fallbackIcon);
    }

    const contextMenu = Menu.buildFromTemplate([
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
            mainWindow.webContents.send("open-settings");
          }
        },
      },
      {
        label: appSettings.minimizeToTray
          ? "Minimize to Tray: ON"
          : "Minimize to Tray: OFF",
        click: () => {
          appSettings.minimizeToTray = !appSettings.minimizeToTray;
          saveSettings(appSettings);
          // Update tray menu
          if (tray) {
            tray.destroy();
            createTray();
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
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
      app.getAppPath(),
      "dist-electron/.icon-ico/icon.ico",
    );

    const win = new BrowserWindow({
      width: 1280,
      height: 720,
      icon: iconPath,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
        preload: path.join(app.getAppPath(), "dist/electron/preload.js"),
      },
    });

    mainWindow = win;
    console.log("BrowserWindow created successfully");

    // Create tray
    createTray();

    // Handle window close event
    win.on("close", event => {
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

    if (process.env.NODE_ENV === "development") {
      console.log("Loading development URL...");
      win.loadURL("http://localhost:3005");
      win.webContents.openDevTools();
    } else {
      console.log("Loading production file...");
      // Use app.getAppPath() instead of process.cwd() for packaged builds
      const appPath = app.getAppPath();
      const indexPath = process.env.ELECTRON_START_URL
        ? path.join(process.cwd(), "dist/index.html")
        : path.join(appPath, "dist/index.html");
      win.loadFile(indexPath);
    }
  } catch (error) {
    console.error("Error creating window:", error);
  }
}

app.whenReady().then(() => {
  console.log("Electron app ready, creating window...");
  createWindow();

  // Handle quit requests from renderer process
  ipcMain.on("quit-app", () => {
    console.log("Quit request received from renderer");
    isQuitting = true;
    app.quit();
  });

  // Handle settings requests from renderer process
  ipcMain.handle("get-settings", () => {
    return appSettings;
  });

  ipcMain.handle(
    "save-settings",
    (event, newSettings: Partial<AppSettings>) => {
      appSettings = { ...appSettings, ...newSettings };
      saveSettings(appSettings);
      return appSettings;
    },
  );

  // Handle API key update from renderer
  ipcMain.on("update-api-key", (event, apiKey: string) => {
    appSettings.geminiApiKey = apiKey;
    saveSettings(appSettings);
    console.log("API Key updated successfully");
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      console.log("Creating window on activate");
      createWindow();
    } else if (mainWindow?.isMinimized()) {
      mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
});

app.on("window-all-closed", () => {
  // On macOS, keep app running even when all windows are closed
  // On other platforms, quit if no windows are open and not minimizing to tray
  if (process.platform !== "darwin") {
    if (!tray || !appSettings.minimizeToTray) {
      app.quit();
    }
  }
});

app.on("before-quit", () => {
  isQuitting = true;
});
