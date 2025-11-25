import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    show: false, // Don't show until ready-to-show event
  })

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:3000')
    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist-ui/index.html'))
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow()

  // On macOS, re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle IPC messages from renderer process
ipcMain.handle('ping', () => {
  return 'pong'
})

// Example: Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

// Example: Get platform info
ipcMain.handle('get-platform', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
  }
})

// Example: Show notification
ipcMain.handle('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show()
  }
})

// Example: Open external URL
ipcMain.handle('open-external', async (_event, url: string) => {
  await shell.openExternal(url)
})
