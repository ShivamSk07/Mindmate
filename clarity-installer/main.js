const { app, BrowserWindow, ipcMain, nativeTheme } = require("electron");
const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");
const os = require("os");

nativeTheme.themeSource = "dark";

let win = null;
let installedExePath = null;

app.requestSingleInstanceLock();

app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 520,
    height: 420,
    resizable: false,
    frame: false,
    transparent: false,
    backgroundColor: "#09090b",
    center: true,
    show: false,
    title: "Clarity Setup",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(path.join(__dirname, "index.html"));

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  // Allow dragging window from frameless area
  win.webContents.on("did-finish-load", () => {
    win.webContents.insertCSS(`
      .titlebar { -webkit-app-region: drag; }
      button, input, a { -webkit-app-region: no-drag; }
    `);
  });
});

// --- IPC: Get default install path ---
ipcMain.handle("get-default-path", () => {
  return path.join(os.homedir(), "AppData", "Local", "Programs", "Clarity");
});

// --- IPC: Install App ---
ipcMain.handle("install-app", async (event, installPath) => {
  const sourceDir = path.join(process.resourcesPath, "ClarityApp");

  try {
    // Step 1: Create install directory
    sendProgress(10, "Creating installation folder...");
    fs.mkdirSync(installPath, { recursive: true });

    // Step 2: Copy all files from bundled ClarityApp → installPath
    sendProgress(20, "Copying application files...");
    copyDirRecursive(sourceDir, installPath, (pct) => {
      sendProgress(20 + Math.floor(pct * 0.55), "Copying application files...");
    });

    installedExePath = path.join(installPath, "Clarity.exe");

    // Step 3: Create Desktop Shortcut
    sendProgress(78, "Creating Desktop shortcut...");
    createShortcut(
      installedExePath,
      path.join(os.homedir(), "Desktop", "Clarity.lnk"),
      installPath
    );

    // Step 4: Create Start Menu Shortcut
    sendProgress(86, "Creating Start Menu shortcut...");
    const startMenuDir = path.join(
      os.homedir(),
      "AppData",
      "Roaming",
      "Microsoft",
      "Windows",
      "Start Menu",
      "Programs",
      "Clarity"
    );
    fs.mkdirSync(startMenuDir, { recursive: true });
    createShortcut(
      installedExePath,
      path.join(startMenuDir, "Clarity.lnk"),
      installPath
    );

    // Step 5: Add to Windows Add/Remove Programs (Registry)
    sendProgress(93, "Registering application...");
    const regKey =
      "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Clarity";
    const uninstallCmd = `"${installedExePath}" --uninstall`;
    try {
      execSync(`reg add "${regKey}" /v DisplayName /t REG_SZ /d "Clarity" /f`);
      execSync(`reg add "${regKey}" /v Publisher /t REG_SZ /d "Shivam Kothekar" /f`);
      execSync(`reg add "${regKey}" /v DisplayVersion /t REG_SZ /d "1.0.0" /f`);
      execSync(`reg add "${regKey}" /v InstallLocation /t REG_SZ /d "${installPath}" /f`);
      execSync(`reg add "${regKey}" /v DisplayIcon /t REG_SZ /d "${installedExePath}" /f`);
      execSync(`reg add "${regKey}" /v UninstallString /t REG_SZ /d "${uninstallCmd}" /f`);
      execSync(`reg add "${regKey}" /v NoModify /t REG_DWORD /d 1 /f`);
      execSync(`reg add "${regKey}" /v NoRepair /t REG_DWORD /d 1 /f`);
    } catch (_e) {
      // Registry errors are non-fatal
    }

    sendProgress(100, "Installation complete.");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// --- IPC: Launch Installed App ---
ipcMain.handle("launch-app", () => {
  if (installedExePath && fs.existsSync(installedExePath)) {
    spawn(installedExePath, [], { detached: true, stdio: "ignore" }).unref();
  }
  app.quit();
});

// --- IPC: Quit ---
ipcMain.handle("quit", () => {
  app.quit();
});

// --- Helper: Send progress to renderer ---
function sendProgress(pct, label) {
  if (win && !win.isDestroyed()) {
    win.webContents.send("install-progress", { pct, label });
  }
}

// --- Helper: Recursive directory copy with progress callback ---
function copyDirRecursive(src, dest, onProgress) {
  const allFiles = [];
  collectFiles(src, allFiles);
  const total = allFiles.length;

  allFiles.forEach((filePath, i) => {
    const rel = path.relative(src, filePath);
    const destFile = path.join(dest, rel);
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.copyFileSync(filePath, destFile);
    if (onProgress) onProgress((i + 1) / total);
  });
}

function collectFiles(dir, list) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, list);
    else list.push(full);
  }
}

// --- Helper: Create Windows Shortcut via PowerShell ---
function createShortcut(targetPath, shortcutPath, workingDir) {
  const ps = `
$ws = New-Object -ComObject WScript.Shell
$sc = $ws.CreateShortcut('${shortcutPath.replace(/\\/g, "\\\\")}')
$sc.TargetPath = '${targetPath.replace(/\\/g, "\\\\")}'
$sc.WorkingDirectory = '${workingDir.replace(/\\/g, "\\\\")}'
$sc.Save()
  `.trim();
  execSync(`powershell -NoProfile -Command "${ps.replace(/"/g, '\\"').replace(/\n/g, " ")}"`);
}

app.on("window-all-closed", () => app.quit());
