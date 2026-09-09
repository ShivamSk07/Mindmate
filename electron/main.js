const {
  app,
  BrowserWindow,
  globalShortcut,
  Menu,
  shell,
  nativeTheme,
  session,
  screen,
  clipboard,
  Notification,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");

const BASE_URL = "https://clarity.indevs.in";
const APP_URL = `${BASE_URL}/chat`;
let mainWindow = null;
let pendingDeepLinkUrl = null;

// Force native dark theme for window frame and system controls
nativeTheme.themeSource = "dark";

// Set AppUserModelId for Windows toast notifications and proper taskbar grouping
if (process.platform === "win32") {
  app.setAppUserModelId("in.shivamkothekar.clarity");
}

// ═══════════════════════════════════════════════════
// 🔗 Feature 5: Deep Linking Protocol Registration (clarity://)
// ═══════════════════════════════════════════════════
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("clarity", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("clarity");
}

function handleDeepLink(rawUrl) {
  if (!rawUrl || !rawUrl.startsWith("clarity://")) return;
  const route = rawUrl.replace("clarity://", "").replace(/^\/+/, "");
  const targetUrl = route ? `${BASE_URL}/${route}` : APP_URL;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(targetUrl);
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  } else {
    pendingDeepLinkUrl = targetUrl;
  }
}

// Parse launch args for deep links on Windows initial startup
const launchArg = process.argv.find((arg) => arg.startsWith("clarity://"));
if (launchArg) {
  const route = launchArg.replace("clarity://", "").replace(/^\/+/, "");
  pendingDeepLinkUrl = route ? `${BASE_URL}/${route}` : APP_URL;
}

// Ensure single instance lock & handle second instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();

      // Check if second instance was invoked via deep link (clarity://)
      const deepLink = commandLine.find((arg) => arg.startsWith("clarity://"));
      if (deepLink) {
        handleDeepLink(deepLink);
      }

      // Check if second instance was invoked via Taskbar JumpList action
      if (commandLine.includes("--new-chat")) {
        mainWindow.loadURL(`${APP_URL}/chat`);
      }
    }
  });
}

// ═══════════════════════════════════════════════════
// 📌 Feature 3: Windows Taskbar JumpList Tasks
// ═══════════════════════════════════════════════════
function setupJumpList() {
  if (process.platform === "win32") {
    try {
      app.setUserTasks([
        {
          program: process.execPath,
          arguments: "--new-chat",
          iconPath: process.execPath,
          iconIndex: 0,
          title: "New Chat",
          description: "Start a new conversation in Clarity",
        },
        {
          program: process.execPath,
          arguments: "--open-workspace",
          iconPath: process.execPath,
          iconIndex: 0,
          title: "Open Workspace",
          description: "Open Clarity Workspace",
        },
      ]);
    } catch (_e) {}
  }
}

// ═══════════════════════════════════════════════════
// 🧠 Feature 1: Window State Memory Helper (Size & Position)
// ═══════════════════════════════════════════════════
function getWindowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const data = fs.readFileSync(getWindowStatePath(), "utf8");
    return JSON.parse(data);
  } catch (_e) {
    return { width: 1360, height: 880, isMaximized: false };
  }
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  try {
    const isMaximized = win.isMaximized();
    const bounds = isMaximized ? win.getNormalBounds() : win.getBounds();
    const state = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized: isMaximized,
    };
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state), "utf8");
  } catch (_e) {}
}

let saveStateTimeout = null;
function debounceSaveState(win) {
  if (saveStateTimeout) clearTimeout(saveStateTimeout);
  saveStateTimeout = setTimeout(() => saveWindowState(win), 500);
}

// ═══════════════════════════════════════════════════
// 🔔 Background Response & Toast Notification System
// ═══════════════════════════════════════════════════
function showNotification(title, body, onClickRoute) {
  if (Notification.isSupported()) {
    let iconPath = path.join(__dirname, "icon.png");
    if (!fs.existsSync(iconPath)) {
      iconPath = path.join(__dirname, "icon.ico");
    }

    const notif = new Notification({
      title: title || "Clarity",
      body: body || "New response received in your conversation.",
      icon: iconPath,
      urgency: "normal",
      silent: false,
    });

    notif.on("click", () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.flashFrame(false);
        if (onClickRoute) {
          mainWindow.loadURL(`${APP_URL}/${onClickRoute.replace(/^\/+/, "")}`);
        }
      }
    });

    notif.show();

    // Flash taskbar icon to alert user in background
    if (mainWindow && !mainWindow.isFocused()) {
      mainWindow.flashFrame(true);
    }
  }
}

// IPC listener for explicit notification requests from renderer
ipcMain.on("show-background-notification", (_event, { title, body, route }) => {
  if (mainWindow && !mainWindow.isFocused()) {
    showNotification(title, body, route);
  }
});

function createWindow() {
  let iconPath = path.join(__dirname, "icon.ico");
  if (!fs.existsSync(iconPath)) {
    iconPath = path.join(__dirname, "icon.png");
  }

  const state = loadWindowState();
  let { width = 1360, height = 880, x, y, isMaximized = false } = state;

  // Verify coordinates are visible on current connected monitors
  if (x !== undefined && y !== undefined) {
    const isVisible = screen.getAllDisplays().some((display) => {
      const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
      return x >= dx - 20 && x <= dx + dw && y >= dy - 20 && y <= dy + dh;
    });
    if (!isVisible) {
      x = undefined;
      y = undefined;
    }
  }

  mainWindow = new BrowserWindow({
    width: width || 1360,
    height: height || 880,
    x: x,
    y: y,
    minWidth: 960,
    minHeight: 640,
    title: "Clarity",
    backgroundColor: "#09090b",
    icon: iconPath,
    autoHideMenuBar: true,
    show: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#09090b",
      symbolColor: "#f4f4f5",
      height: 56,
    },
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
      sandbox: true,
    },
  });

  // Clear taskbar flash when user focuses the app
  mainWindow.on("focus", () => {
    mainWindow.flashFrame(false);
  });

  // Track window resize and position for persistent state memory
  mainWindow.on("resize", () => debounceSaveState(mainWindow));
  mainWindow.on("move", () => debounceSaveState(mainWindow));
  mainWindow.on("close", () => saveWindowState(mainWindow));

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
    if (isMaximized) {
      mainWindow.maximize();
    }
    mainWindow.focus();

    // 2. Smoothly transition to live workspace or pending deep link
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        const dest = pendingDeepLinkUrl || APP_URL;
        mainWindow.loadURL(dest);
        pendingDeepLinkUrl = null;
      }
    }, 2800);
  });

  // Handle Offline / Network failure gracefully
  mainWindow.webContents.on("did-fail-load", (_event, errorCode, _desc, _url, isMainFrame) => {
    if (isMainFrame && errorCode !== -3) {
      const offlinePath = path.join(__dirname, "offline.html");
      if (fs.existsSync(offlinePath)) {
        mainWindow.loadFile(offlinePath);
      }
    }
  });

  // ═══════════════════════════════════════════════════
  // 📋 Native Right-Click Context Menu
  // ═══════════════════════════════════════════════════
  mainWindow.webContents.on("context-menu", (_event, params) => {
    const menuTemplate = [];

    if (params.isEditable) {
      menuTemplate.push(
        { role: "undo", label: "Undo" },
        { role: "redo", label: "Redo" },
        { type: "separator" },
        { role: "cut", label: "Cut" },
        { role: "copy", label: "Copy" },
        { role: "paste", label: "Paste" },
        { type: "separator" },
        { role: "selectAll", label: "Select All" }
      );
    } else if (params.selectionText && params.selectionText.trim().length > 0) {
      menuTemplate.push(
        { role: "copy", label: "Copy" },
        { type: "separator" },
        { role: "selectAll", label: "Select All" }
      );
    } else if (params.linkURL) {
      menuTemplate.push(
        {
          label: "Copy Link Address",
          click: () => clipboard.writeText(params.linkURL),
        },
        {
          label: "Open Link in Browser",
          click: () => shell.openExternal(params.linkURL),
        }
      );
    } else {
      menuTemplate.push(
        {
          label: "Back",
          enabled: mainWindow.webContents.canGoBack(),
          click: () => mainWindow.webContents.goBack(),
        },
        {
          label: "Forward",
          enabled: mainWindow.webContents.canGoForward(),
          click: () => mainWindow.webContents.goForward(),
        },
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow.webContents.reload(),
        }
      );
    }

    if (menuTemplate.length > 0) {
      const menu = Menu.buildFromTemplate(menuTemplate);
      menu.popup({ window: mainWindow });
    }
  });

  // Header Draggable CSS & Background Response Watcher Injection
  mainWindow.webContents.on("dom-ready", () => {
    const currentUrl = mainWindow.webContents.getURL();
    if (!currentUrl.includes("splash.html") && !currentUrl.includes("offline.html")) {
      mainWindow.webContents.insertCSS(`
        /* Make app header draggable like VS Code title bar */
        header {
          -webkit-app-region: drag !important;
          padding-right: 154px !important;
        }
        /* All interactive elements inside header must be clickable (no-drag) */
        header button,
        header a,
        header input,
        header select,
        header [role="button"],
        header [tabindex],
        header label,
        header svg {
          -webkit-app-region: no-drag !important;
        }
      `);

      // Inject Background AI Chat Completion Listener
      mainWindow.webContents.executeJavaScript(`
        (() => {
          if (window.__clarityNotificationInjected) return;
          window.__clarityNotificationInjected = true;

          // Request / Grant Notification permissions automatically
          if (typeof window.Notification !== 'undefined') {
            window.Notification.permission = "granted";
            window.Notification.requestPermission = async () => "granted";
          }

          // Monitor document title or AI generation completion when in background
          let lastTitle = document.title;
          const observer = new MutationObserver(() => {
            if (document.hidden && document.title !== lastTitle) {
              lastTitle = document.title;
            }
          });
          const titleEl = document.querySelector('title');
          if (titleEl) observer.observe(titleEl, { childList: true });
        })();
      `).catch(() => {});
    }
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

  // When user clicks [X] cross button, fully terminate app
  mainWindow.on("closed", () => {
    mainWindow = null;
    app.quit();
  });
}

// App Ready Lifecycle
app.whenReady().then(() => {
  setupJumpList();

  // Automatically grant notification and download permissions to session
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "notifications" || permission === "media") {
      return callback(true);
    }
    callback(true);
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    if (permission === "notifications") return true;
    return true;
  });

  // Native Download & File Export Handler
  session.defaultSession.on("will-download", (_event, item, _webContents) => {
    item.setSaveDialogOptions({
      title: "Save File - Clarity",
      defaultPath: path.join(app.getPath("downloads"), item.getFilename()),
    });

    item.on("updated", (_e, state) => {
      if (state === "progressing" && !item.isPaused()) {
        const total = item.getTotalBytes();
        if (total > 0 && mainWindow && !mainWindow.isDestroyed()) {
          const percent = item.getReceivedBytes() / total;
          mainWindow.setProgressBar(percent);
        }
      }
    });

    item.once("done", (_e, _state) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.setProgressBar(-1);
      }
    });
  });

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
