const { app, BrowserWindow, globalShortcut, Menu, shell, nativeTheme } = require("electron");
const path = require("path");

const APP_URL = "https://clarity.indevs.in";
let mainWindow = null;

// Force native dark theme for window frame and system controls (prevents Windows red/white accent color)
nativeTheme.themeSource = "dark";

// Ensure single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createWindow() {
  const fs = require("fs");
  let iconPath = path.join(__dirname, "icon.ico");
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, "icon.png");
  }

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 640,
    title: "Clarity",
    backgroundColor: "#09090b",
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
      sandbox: true,
    },
  });

  // Custom User-Agent for seamless OAuth & web compatibility
  mainWindow.webContents.setUserAgent(
    mainWindow.webContents.getUserAgent() + " ClarityDesktopApp/1.0"
  );

  // 1. Instant local load: Launch editorial tour without any black screen delay
  const splashPath = path.join(__dirname, "splash.html");
  if (fs.existsSync(splashPath)) {
    mainWindow.loadFile(splashPath);
  }

  // Show window immediately once local splash is ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();

    // 2. Smoothly transition to live workspace after briefing display
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(APP_URL);
      }
    }, 2800);
  });

  // Open external links in user's default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith("https://accounts.google.com") ||
      url.startsWith("https://github.com/login") ||
      url.startsWith("https://www.linkedin.com/oauth") ||
      url.startsWith("https://vercel.com/oauth") ||
      url.includes("indevs.in")
    ) {
      return { action: "allow" };
    }
    shell.openExternal(url);
    return { action: "deny" };
  });

  // When user clicks [X] cross button, fully terminate app (do NOT hide in background)
  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  app.quit();
});
