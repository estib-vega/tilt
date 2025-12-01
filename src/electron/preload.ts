import { UIMessage } from 'ai';
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {
  ChatChunkEvent,
  ChatEndEvent,
  UIChat,
  UIChatTitleUpdateEvent,
  UpdateChatTitleParams,
} from './api';

export type CleanUpFn = () => void;

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Example: Simple ping/pong
  ping: () => ipcRenderer.invoke('ping'),

  // Get app version
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Get platform information
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  // Example: Send notification to main process
  notify: (title: string, body: string) => ipcRenderer.invoke('show-notification', { title, body }),

  // Example: Open external link
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Start a chat session
  chatStart: (id: string, messages: UIMessage[]) => {
    ipcRenderer.send('llm:start', {
      id,
      messages,
    });
  },

  // Interrupt an ongoing chat session
  chatInterrupt: (id: string) => {
    ipcRenderer.send('llm:cancel', { id });
  },

  // Listen for chat chunks
  onChatChunk: (cb: (event: ChatChunkEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: ChatChunkEvent) => cb(data);
    ipcRenderer.on('llm:chunk', listener);
    return () => {
      ipcRenderer.removeListener('llm:chunk', listener);
    };
  },

  // Listen for chat end
  onChatEnd: (cb: (event: ChatEndEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: ChatEndEvent) => cb(data);
    ipcRenderer.on('llm:end', listener);
    return () => {
      ipcRenderer.removeListener('llm:end', listener);
    };
  },

  // List all messages for a chat
  listMessages: (chatId: string) => ipcRenderer.invoke('llm:get-messages', { chatId }),

  // List all chats
  listChats: () => ipcRenderer.invoke('llm:list-chats'),

  // Update chat title
  updateChatTitle: (params: UpdateChatTitleParams) =>
    ipcRenderer.invoke('llm:update-chat-title', params),

  // Delete a chat
  deleteChat: (chatId: string) => ipcRenderer.invoke('llm:delete-chat', { chatId }),

  // Create a new chat
  createChat: () => ipcRenderer.invoke('llm:create-chat'),

  // List for chat title updates
  onChatTitleUpdated: (cb: (event: UIChatTitleUpdateEvent) => void) => {
    const listener = (_event: IpcRendererEvent, chat: UIChatTitleUpdateEvent) => cb(chat);
    ipcRenderer.on('llm:chat-title-updated', listener);
    return () => {
      ipcRenderer.removeListener('llm:chat-title-updated', listener);
    };
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  ping: () => Promise<string>;
  getAppVersion: () => Promise<string>;
  getPlatform: () => Promise<{
    platform: string;
    arch: string;
    version: string;
  }>;
  notify: (title: string, body: string) => Promise<void>;
  openExternal: (url: string) => Promise<void>;
  /**
   * Starts a chat session with the given ID and messages.
   */
  chatStart: (id: string, messages: UIMessage[]) => string;
  /**
   * Listens for chat response chunks.
   */
  onChatChunk: (cb: (event: ChatChunkEvent) => void) => CleanUpFn;
  /**
   * Listens for the end of a chat session.
   */
  onChatEnd: (cb: (event: ChatEndEvent) => void) => CleanUpFn;
  /**
   * Interrupts an ongoing chat session with the given ID.
   */
  chatInterrupt: (id: string) => void;
  /**
   * Lists all messages for a given chat ID.
   */
  listMessages: (chatId: string) => Promise<UIMessage[]>;
  /**
   * Lists all chats.
   */
  listChats: () => Promise<UIChat[]>;
  /**
   * Updates the title of a chat.
   */
  updateChatTitle: (params: UpdateChatTitleParams) => Promise<UIChat>;
  /**
   * Deletes a chat with the given ID.
   */
  deleteChat: (chatId: string) => Promise<void>;
  /**
   * Creates a new chat and returns its ID.
   */
  createChat: () => Promise<string>;
  /**
   * Listens for chat title updates.
   */
  onChatTitleUpdated: (cb: (event: UIChatTitleUpdateEvent) => void) => CleanUpFn;
}
