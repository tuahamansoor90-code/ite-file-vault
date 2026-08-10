const { app, BrowserWindow } = require("electron");
const path = require("path");
const childProcess = require("child_process");
const net = require("net");
const fs = require("fs");

function readEnvFile() {
  const envVars = {};
  const possiblePaths = [
    app ? path.join(app.getAppPath(), ".env") : "",
    path.join(process.cwd(), ".env"),
    path.join(__dirname, ".env"),
  ].filter(Boolean);
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            envVars[key] = val;
          }
        }
      } catch (e) {
        console.error("Error reading .env:", e);
      }
    }
  }
  return envVars;
}

let mainWindow = null;
let serverProcess = null;

// Helper to check if a port is active (in use) by connecting to it
function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true); // Connected successfully, port is active
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false); // Connection failed, port is not active
    });
    socket.connect(port, '127.0.0.1');
  });
}

// Helper to wait until a port becomes active
function waitOnPort(port, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(async () => {
      const inUse = await isPortInUse(port);
      if (inUse) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for port ${port}`));
      }
    }, 30);
  });
}

let serverStarted = false;
async function ensureServerRunning() {
  if (serverStarted) return;
  serverStarted = true;

  const isDev = !app.isPackaged;
  let startUrl = process.env.ELECTRON_START_URL || process.env.VITE_APP_URL;
  if (!isDev && !startUrl) {
    const port = 3000;
    const portUsed = await isPortInUse(port);
    if (!portUsed) {
      const serverPath = path.join(app.getAppPath(), ".output", "server", "index.mjs");
      try {
        const localEnv = readEnvFile();
        const forkEnv = {
          ...process.env,
          ...localEnv,
          PORT: String(port),
          NODE_ENV: "production",
          ELECTRON_RUN_AS_NODE: "1",
        };

        // Use Electron's embedded Node runtime so target PC doesn't need Node.js installed
        serverProcess = childProcess.fork(serverPath, [], {
          execPath: process.execPath,
          env: forkEnv,
          silent: true,
        });

        serverProcess.stdout?.on("data", (data) => {
          console.log(`[Server STDOUT]: ${data}`);
        });
        serverProcess.stderr?.on("data", (data) => {
          console.error(`[Server STDERR]: ${data}`);
        });
      } catch (err) {
        console.error("[Electron] Failed to spawn local server with embedded Node runtime:", err);
      }
    }
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "Innovative Tech Engineering — File Vault",
    icon: path.join(__dirname, "public", "icon.ico"),
    backgroundColor: "#ffffff",
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
  });

  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  const isDev = !app.isPackaged;
  let startUrl = process.env.ELECTRON_START_URL || process.env.VITE_APP_URL;

  if (isDev) {
    startUrl = startUrl || "http://localhost:8080";
    try {
      await waitOnPort(8080, 15000);
    } catch (e) {
      console.warn("[Electron] Dev server port 8080 not active, attempting load anyway.");
    }
    mainWindow.loadURL(startUrl);
  } else {
    if (startUrl) {
      mainWindow.loadURL(startUrl);
    } else {
      const port = 3000;
      await ensureServerRunning();
      try {
        await waitOnPort(port, 8000);
      } catch (e) {
        console.error("[Electron] Timeout waiting for server port 3000");
      }
      await mainWindow.loadURL(`http://localhost:${port}`);
    }
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  ensureServerRunning();
  await createWindow();
});

app.on("window-all-closed", () => {
  // Terminate background server process when app is closed
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});
