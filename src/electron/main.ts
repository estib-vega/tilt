import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import ChatManager from './ai/chat.js';
import dotenv from 'dotenv';
import {
  CreateProjectParamsSchema,
  DeleteNoteParamsSchema,
  DeleteProjectParamsSchema,
  ListChatsParamsSchema,
  ListNotesParamsSchema,
  NewNoteParamsSchema,
  parseAddCredentialParams,
  parseDeleteCredentialParams,
  parseLLMCreateChatParams,
  parseLLMResumeParams,
  parseLLMStartParams,
  ReadNoteParamsSchema,
  UIChatEvent,
  UsageUpdate,
  WriteNoteParamsSchema,
} from './api.js';
import DB from './db/sqlite.js';
import { UIMessageChunk } from 'ai';
import CredentialsManager from './model/credentials.js';
import { availableModels, defaultModelIdentifier } from './ai/model.js';
import OllamaManager from './model/ollama.js';
import NotesManager from './model/notes.js';
import Navigator from './model/navigator/index.js';
import ProjectsManager from './model/projects.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const appDir = app.getPath('userData');
// Keep a global reference of the window object to prevent garbage collection
let mainWindow: BrowserWindow | null = null;
const db = DB.getInstance(appDir);
const credentialsManager = CredentialsManager.getInstance(db);
const navigator = Navigator.getInstance();
const chatManager = ChatManager.getInstance(db, credentialsManager, navigator);
const ollamaManager = OllamaManager.getInstance();
const notesManager = NotesManager.getInstance(appDir, db);
const projectsManager = ProjectsManager.getInstance(db);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function setupChatEventListeners(event: UIChatEvent): true {
  switch (event.type) {
    case 'title-updated':
      mainWindow?.webContents.send('chat:title-updated', event);
      return true;
    case 'tool-update':
      mainWindow?.webContents.send('chat:tool-update', event);
      return true;
  }
}

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
    credentialsManager.destroy();
    chatManager.destroy();
    ollamaManager.destroy();
    notesManager.destroy();
    navigator.destroy();
    projectsManager.destroy();
  });

  const allowlistedProtocols = ['http:', 'https:'];

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (allowlistedProtocols.includes(new URL(url).protocol)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  chatManager.addChatEventListener((event) => {
    setupChatEventListeners(event);
  });
}

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

  const onUpdate = (chunk: UIMessageChunk) => {
    event.sender.send('llm:chunk', { id, chunk });
  };

  const onUsage = (usage: UsageUpdate) => {
    event.sender.send('llm:usage', { id, usage });
  };

  const fullResponse = await chatManager.chat(id, messages, options, onUpdate, onUsage);

  event.sender.send('llm:end', { id, text: fullResponse });
});

ipcMain.on('llm:resume', async (event, params) => {
  const { id, webSearch, modelIdentifier } = parseLLMResumeParams(params);

  const onUpdate = (chunk: UIMessageChunk) => {
    event.sender.send('llm:chunk', { id, chunk });
  };

  const onUsage = (usage: UsageUpdate) => {
    event.sender.send('llm:usage', { id, usage });
  };

  const fullResponse = await chatManager.resumeChat(
    id,
    { webSearch, modelIdentifier },
    onUpdate,
    onUsage,
  );

  event.sender.send('llm:end', { id, text: fullResponse });
});

ipcMain.on('llm:cancel', (_, { id }) => {
  chatManager.stopChat(id);
});

ipcMain.handle('llm:get-messages', (_event, { chatId }) => {
  return chatManager.getChatMessages(chatId);
});

ipcMain.handle('llm:list-chats', (_event, params) => {
  const parsedParams = ListChatsParamsSchema.parse(params);
  return chatManager.listChats(parsedParams.projectId);
});

ipcMain.handle('llm:update-chat-title', (_event, { chatId, title }) => {
  return chatManager.updateChatTitle(chatId, title);
});

ipcMain.handle('llm:delete-chat', (_event, { chatId }) => {
  chatManager.deleteChat(chatId);
});

ipcMain.handle('llm:create-chat', async (_event, params) => {
  const [messages, projectId] = await parseLLMCreateChatParams(params);
  return chatManager.createChat(projectId, messages);
});

ipcMain.handle('llm:list-models', () => {
  return availableModels(credentialsManager, ollamaManager);
});

ipcMain.handle('llm:default-model', () => {
  return defaultModelIdentifier(credentialsManager, ollamaManager);
});

ipcMain.handle('credentials:list', () => {
  return credentialsManager.listCredentials();
});

ipcMain.handle('credentials:list-providers', () => {
  return credentialsManager.listProviders();
});

ipcMain.handle('credentials:add', (_event, params) => {
  const { service, secret } = parseAddCredentialParams(params);
  return credentialsManager.addCredential(service, secret);
});

ipcMain.handle('credentials:remove', (_event, params) => {
  const { id } = parseDeleteCredentialParams(params);
  return credentialsManager.deleteCredential(id);
});

ipcMain.handle('ollama:get-status', async () => {
  return ollamaManager.getStatus();
});

ipcMain.handle('notes:new', (_event, params) => {
  const parsedParams = NewNoteParamsSchema.parse(params);
  const filePath = notesManager.newNotePath(parsedParams.projectId);
  notesManager.writeNoteContent(parsedParams.projectId, filePath, parsedParams.content);
  const id = notesManager.getIdForNotePath(filePath);
  if (!id) {
    throw new Error('Failed to retrieve note ID after creating new note');
  }
  return id;
});

ipcMain.handle('notes:read-note', (_event, params) => {
  const parsedParams = ReadNoteParamsSchema.parse(params);
  const { id } = parsedParams;
  const filePath = notesManager.getPathForNoteId(id);
  return notesManager.readNoteContent(filePath);
});

ipcMain.handle('notes:write-note', (_event, params) => {
  const parsedParams = WriteNoteParamsSchema.parse(params);
  const { id, content } = parsedParams;
  const filePath = notesManager.getPathForNoteId(id);
  const projectId = notesManager.getProjectForNoteId(id);
  return notesManager.writeNoteContent(projectId, filePath, content);
});

ipcMain.handle('notes:delete-note', (_event, params) => {
  const parsedParams = DeleteNoteParamsSchema.parse(params);
  const { id } = parsedParams;
  const filePath = notesManager.getPathForNoteId(id);
  return notesManager.deleteNote(filePath);
});

ipcMain.handle('notes:list-notes', (_event, params) => {
  const parsedParams = ListNotesParamsSchema.parse(params);
  return notesManager.listNotes(parsedParams.projectId);
});

ipcMain.handle('projects:create-project', (_event, params) => {
  const parsedParams = CreateProjectParamsSchema.parse(params);
  return projectsManager.createProject(parsedParams.name);
});

ipcMain.handle('projects:delete-project', (_event, params) => {
  const parsedParams = DeleteProjectParamsSchema.parse(params);
  return projectsManager.deleteProject(parsedParams.projectId);
});

ipcMain.handle('projects:list-projects', () => {
  return projectsManager.listProjects();
});
