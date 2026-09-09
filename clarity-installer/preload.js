const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("installer", {
  install: (installPath) => ipcRenderer.invoke("install-app", installPath),
  getDefaultPath: () => ipcRenderer.invoke("get-default-path"),
  onProgress: (cb) => ipcRenderer.on("install-progress", (_e, data) => cb(data)),
  launch: () => ipcRenderer.invoke("launch-app"),
  quit: () => ipcRenderer.invoke("quit"),
});
