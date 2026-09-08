const { app, BrowserWindow, globalShortcut, Tray, Menu, shell, session } = require("electron");
const path = require("path");

const APP_URL = "https://clarity.indevs.in";
let mainWindow = null;
let tray = null;

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
  let iconPath = path.join(__dirname, "logo.png");
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, "..", "public", "img", "logo.png");
  }

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 900,
    minHeight: 600,
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

  // Load live website
  mainWindow.loadURL(APP_URL);

  // Show window smoothly once DOM is ready
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.focus();
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

  // Handle close to minimize to tray instead of quitting
  mainWindow.on("close", (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  // Create System Tray
  createTray(iconPath);
}

function createTray(iconPath) {
  if (tray) return;

  try {
    tray = new Tray(iconPath);
    tray.setToolTip("Clarity — AI Agentic Workspace");

    const contextMenu = Menu.buildFromTemplate([
      {
        label: "Open Clarity",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      {
        label: "Reload App",
        click: () => {
          if (mainWindow) mainWindow.loadURL(APP_URL);
        },
      },
      { type: "separator" },
      {
        label: "Quit Clarity",
        click: () => {
          app.isQuitting = true;
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    tray.on("click", () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn("[Tray creation notice]", err);
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register Global Hotkey (Alt+Space) to summon/toggle Clarity
  globalShortcut.register("Alt+Space", () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible() && mainWindow.isFocused()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
