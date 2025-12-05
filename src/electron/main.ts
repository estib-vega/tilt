import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ChatManager from './ai/chat.js';
import dotenv from 'dotenv';
import {
  isCreateModelRequest,
  parseLLMCreateChatParams,
  parseLLMResumeParams,
  parseLLMStartParams,
} from './api.js';
import DB from './db/sqlite.js';
import ModelManager from './ai/model.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
const db = DB.getInstance(app.getPath('userData'));
const modelManager = ModelManager.getInstance(db);
const chatManager = ChatManager.getInstance(db);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

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
      sandbox: false,
    },
    titleBarStyle: 'hiddenInset',
    titleBarOverlay: { color: '#ffffff', symbolColor: '#333', height: 28 },
    show: false, // Don't show until ready-to-show event
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools in development
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    mainWindow.loadFile(path.join(__dirname, '../dist-ui/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    // Close the database connection
    db.close();

    // Destroy managers
    modelManager.destroy();
    chatManager.destroy();
  });

  chatManager.addChatTitleUpdateListener((event) => {
    mainWindow?.webContents.send('llm:chat-title-updated', event);
  });
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked and no windows are open
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle IPC messages from renderer process
ipcMain.handle('ping', () => {
  return 'pong';
});

// Example: Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Example: Get platform info
ipcMain.handle('get-platform', () => {
  return {
    platform: process.platform,
    arch: process.arch,
    version: process.version,
  };
});

// Example: Show notification
ipcMain.handle('show-notification', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title, body }).show();
  }
});

// Example: Open external URL
ipcMain.handle('open-external', async (_event, url: string) => {
  await shell.openExternal(url);
});

ipcMain.on('llm:start', async (event, params) => {
  const [id, messages, options] = await parseLLMStartParams(params);

  const fullResponse = await chatManager.chat(id, messages, options, (chunk) => {
    event.sender.send('llm:chunk', { id, chunk });
  });

  event.sender.send('llm:end', { id, text: fullResponse });
});

ipcMain.on('llm:resume', async (event, params) => {
  const { id, webSerch } = parseLLMResumeParams(params);

  const fullResponse = await chatManager.resumeChat(id, { webSearch: webSerch }, (chunk) => {
    event.sender.send('llm:chunk', { id, chunk });
  });

  event.sender.send('llm:end', { id, text: fullResponse });
});

ipcMain.on('llm:cancel', (_, { id }) => {
  chatManager.stopChat(id);
});

ipcMain.handle('llm:get-messages', (_event, { chatId }) => {
  return chatManager.getChatMessages(chatId);
});

ipcMain.handle('llm:list-chats', () => {
  return chatManager.listChats();
});

ipcMain.handle('llm:update-chat-title', (_event, { chatId, title }) => {
  return chatManager.updateChatTitle(chatId, title);
});

ipcMain.handle('llm:delete-chat', (_event, { chatId }) => {
  chatManager.deleteChat(chatId);
});

ipcMain.handle('llm:create-chat', async (_event, params) => {
  const [messages] = await parseLLMCreateChatParams(params);
  return chatManager.createChat(messages);
});

ipcMain.handle('models:list', () => {
  return modelManager.listModels();
});

ipcMain.handle('models:add', (_event, modelCreationRequest) => {
  if (!isCreateModelRequest(modelCreationRequest)) {
    throw new Error('Invalid CreateModelRequest');
  }
  const { model } = modelCreationRequest;
  return modelManager.add(model);
});
