import type {
  AddCredentialParams,
  MessageChunkEvent,
  MessageEndEvent,
  ChatUsageEvent,
  CreateProjectParams,
  CustomUIMessage,
  DeleteCredentialParams,
  DeleteNoteParams,
  DeleteProjectParams,
  GetProjectParams,
  ListChatsParams,
  ListNotesParams,
  LLMCreateChatParams,
  LLMResumeParams,
  LLMStartParams,
  NewNoteParams,
  ReadNoteParams,
  UIChat,
  UIChatTitleUpdateEvent,
  UIChatToolUpdateEvent,
  UpdateChatTitleParams,
  UpdateProjectMetaParams,
  WriteNoteParams,
  ButStatusParams,
  ButDiffParams,
  ButCheckOutParams,
  ButStreamSummary,
} from './api.js';
import type { ModelIdentifier, ProviderModelList } from './ai/model.js';
import type { Credential, CredentialService } from './model/credentials.js';
import type { OllamaStatus } from './model/ollama.js';
import type { Note } from './model/notes.js';
import type { Project, ProjectId } from './db/tables/projects.js';
import type { ProjectMetadata } from './model/projects.js';
import type { JsonDiffOutput, WorkspaceStatus } from './model/but.js';
import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

export type CleanUpFn = () => void;

/**
 * Type definition for the Electron API exposed in the preload script.
 */
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
  chatStart: (params: LLMStartParams) => void;
  /**
   * Resumes a chat session with the given ID.
   */
  chatResume: (params: LLMResumeParams) => void;
  /**
   * Listens for chat response chunks.
   */
  onChatChunk: (cb: (event: MessageChunkEvent) => void) => CleanUpFn;
  /**
   * Listens for usage updates during a chat session.
   */
  onChatUsage: (cb: (event: ChatUsageEvent) => void) => CleanUpFn;
  /**
   * Listens for the end of a chat session.
   */
  onChatEnd: (cb: (event: MessageEndEvent) => void) => CleanUpFn;
  /**
   * Interrupts an ongoing chat session with the given ID.
   */
  chatInterrupt: (id: string) => void;
  /**
   * Lists all messages for a given chat ID.
   */
  listMessages: (chatId: string) => Promise<CustomUIMessage[]>;
  /**
   * Lists all chats.
   */
  listChats: (params: ListChatsParams) => Promise<UIChat[]>;
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
  createChat: (params: LLMCreateChatParams) => Promise<string>;
  /**
   * Listens for chat title updates.
   */
  onChatTitleUpdated: (cb: (event: UIChatTitleUpdateEvent) => void) => CleanUpFn;
  /**
   * Lists all available models from providers.
   */
  listAvailableModels: () => Promise<ProviderModelList>;
  /**
   * Gets the default model identifier.
   */
  getDefaultModel: () => Promise<ModelIdentifier | null>;
  /**
   * Add a new credential.
   */
  addCredential: (params: AddCredentialParams) => Promise<void>;
  /**
   * Delete a credential by ID.
   */
  deleteCredential: (params: DeleteCredentialParams) => Promise<void>;
  /**
   * Lists all credentials.
   */
  listCredentials: () => Promise<Credential[]>;
  /**
   * Lists all credential providers already configured.
   */
  listCredentialProviders: () => Promise<CredentialService[]>;
  /**
   * Gets the status of the Ollama server.
   */
  ollamaGetStatus: () => Promise<OllamaStatus>;
  /**
   * Get a new note path.
   *
   * Returns the note id.
   */
  newNote: (params: NewNoteParams) => Promise<number>;
  /**
   * Read the content of a note from a given file path.
   */
  readNote: (params: ReadNoteParams) => Promise<string>;
  /**
   * Write content to a note at a given file path.
   */
  writeNote: (params: WriteNoteParams) => Promise<void>;
  /**
   * Delete a note at a given file path.
   */
  deleteNote: (params: DeleteNoteParams) => Promise<void>;
  /**
   * List notes.
   */
  listNotes: (params: ListNotesParams) => Promise<Note[]>;
  /**
   * Listen for tool update events during chat sessions.
   */
  onChatToolUpdate: (cb: (event: UIChatToolUpdateEvent) => void) => CleanUpFn;
  /**
   * List all projects.
   */
  listProjects: () => Promise<Project[]>;
  /**
   * Get a project by ID.
   */
  getProject: (params: GetProjectParams) => Promise<Project | null>;
  /**
   * Get project metadata by ID.
   */
  getProjectMeta: (params: GetProjectParams) => Promise<ProjectMetadata>;
  /**
   * Update project metadata by ID.
   */
  updateProjectMeta: (params: UpdateProjectMetaParams) => Promise<void>;
  /**
   * Create a new project.
   */
  createProject: (params: CreateProjectParams) => Promise<ProjectId>;
  /**
   * Delete a project by ID.
   */
  deleteProject: (params: DeleteProjectParams) => Promise<void>;
  /**
   * Get the but workspace status.
   */
  butStatus: (params: ButStatusParams) => Promise<WorkspaceStatus>;
  /**
   * Get the diff of a respository target.
   * E.g. diff a branch, commit, file
   */
  butDiff: (params: ButDiffParams) => Promise<JsonDiffOutput>;
  /**
   * Checkout a git branch in the repository.
   */
  butCheckout: (params: ButCheckOutParams) => Promise<void>;
  /**
   * Stream the summarization of a diff.
   */
  butSummarizeDiffStart: (params: ButStreamSummary) => void;
  /**
   * On a chunk event from the diff summarization.
   */
  onButSummarizationChunk: (cb: (e: MessageChunkEvent) => void) => CleanUpFn;
  /**
   * On diff summarization end.
   */
  onButSummarizationEnd: (cb: (e: MessageEndEvent) => void) => CleanUpFn;
}

const api: ElectronAPI = {
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
  chatStart: (params: LLMStartParams) => {
    ipcRenderer.send('llm:start', params);
  },

  // Resume a chat session
  chatResume: (params: LLMResumeParams) => {
    ipcRenderer.send('llm:resume', params);
  },

  // Interrupt an ongoing chat session
  chatInterrupt: (id: string) => {
    ipcRenderer.send('llm:cancel', { id });
  },

  // Listen for chat chunks
  onChatChunk: (cb: (event: MessageChunkEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: MessageChunkEvent) => cb(data);
    ipcRenderer.on('llm:chunk', listener);
    return () => {
      ipcRenderer.removeListener('llm:chunk', listener);
    };
  },

  // Listen for chat usage updates
  onChatUsage: (cb: (event: ChatUsageEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: ChatUsageEvent) => cb(data);
    ipcRenderer.on('llm:usage', listener);
    return () => {
      ipcRenderer.removeListener('llm:usage', listener);
    };
  },

  // Listen for chat end
  onChatEnd: (cb: (event: MessageEndEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: MessageEndEvent) => cb(data);
    ipcRenderer.on('llm:end', listener);
    return () => {
      ipcRenderer.removeListener('llm:end', listener);
    };
  },

  // List all messages for a chat
  listMessages: (chatId: string) => ipcRenderer.invoke('llm:get-messages', { chatId }),

  // List all chats
  listChats: (params: ListChatsParams) => ipcRenderer.invoke('llm:list-chats', params),

  // Update chat title
  updateChatTitle: (params: UpdateChatTitleParams) =>
    ipcRenderer.invoke('llm:update-chat-title', params),

  // Delete a chat
  deleteChat: (chatId: string) => ipcRenderer.invoke('llm:delete-chat', { chatId }),

  // Create a new chat
  createChat: (params: LLMCreateChatParams) => ipcRenderer.invoke('llm:create-chat', params),

  // List for chat title updates
  onChatTitleUpdated: (cb: (event: UIChatTitleUpdateEvent) => void) => {
    const listener = (_event: IpcRendererEvent, chat: UIChatTitleUpdateEvent) => cb(chat);
    ipcRenderer.on('llm:chat-title-updated', listener);
    return () => {
      ipcRenderer.removeListener('llm:chat-title-updated', listener);
    };
  },

  // List available models
  listAvailableModels: () => ipcRenderer.invoke('llm:list-models'),

  // Get default model identifier
  getDefaultModel: () => ipcRenderer.invoke('llm:default-model'),

  // Add a new credential
  addCredential: (params: AddCredentialParams) => ipcRenderer.invoke('credentials:add', params),

  // Delete a credential by ID
  deleteCredential: (params: DeleteCredentialParams) =>
    ipcRenderer.invoke('credentials:delete', params),

  // List all credentials
  listCredentials: () => ipcRenderer.invoke('credentials:list'),

  // List all credential providers
  listCredentialProviders: () => ipcRenderer.invoke('credentials:list-providers'),

  // Get Ollama server status
  ollamaGetStatus: () => ipcRenderer.invoke('ollama:get-status'),

  // Create a new note path
  newNote: (params: NewNoteParams) => ipcRenderer.invoke('notes:new', params),

  // Read note content
  readNote: (params: ReadNoteParams) => ipcRenderer.invoke('notes:read-note', params),

  // Write note content
  writeNote: (params: WriteNoteParams) => ipcRenderer.invoke('notes:write-note', params),

  // Delete a note
  deleteNote: (params: DeleteNoteParams) => ipcRenderer.invoke('notes:delete-note', params),

  // List notes
  listNotes: (params: ListNotesParams) => ipcRenderer.invoke('notes:list-notes', params),

  // List all projects
  listProjects: () => ipcRenderer.invoke('projects:list-projects'),

  // Get a project by ID
  getProject: (params: GetProjectParams) => ipcRenderer.invoke('projects:get-project', params),

  // Get project metadata by ID
  getProjectMeta: (params: GetProjectParams) =>
    ipcRenderer.invoke('projects:get-project-meta', params),

  // Update project metadata by ID
  updateProjectMeta: (params: UpdateProjectMetaParams) =>
    ipcRenderer.invoke('projects:update-project-meta', params),

  // Create a new project
  createProject: (params: CreateProjectParams) =>
    ipcRenderer.invoke('projects:create-project', params),

  // Delete a project
  deleteProject: (params: DeleteProjectParams) =>
    ipcRenderer.invoke('projects:delete-project', params),

  // Listen for tool update events
  onChatToolUpdate: (cb: (event: UIChatToolUpdateEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: UIChatToolUpdateEvent) => cb(data);
    ipcRenderer.on('chat:tool-update', listener);
    return () => {
      ipcRenderer.removeListener('chat:tool-update', listener);
    };
  },

  // But status
  butStatus: (params: ButStatusParams) => ipcRenderer.invoke('but:st', params),

  // But diff
  butDiff: (params: ButDiffParams) => ipcRenderer.invoke('but:diff', params),

  // But checkout branch
  butCheckout: (params: ButCheckOutParams) => ipcRenderer.invoke('but:checkout', params),

  // Start the summarization of a diff
  butSummarizeDiffStart: (params: ButStreamSummary) =>
    ipcRenderer.send('but:stream-summary', params),

  // Listen for diff summarization update events
  onButSummarizationChunk: (cb: (event: MessageChunkEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: MessageChunkEvent) => cb(data);
    ipcRenderer.on('but:stream-summary-chunk', listener);
    return () => {
      ipcRenderer.removeListener('but:stream-summary-chunk', listener);
    };
  },

  // Listen for diff summarization end events
  onButSummarizationEnd: (cb: (event: MessageEndEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: MessageEndEvent) => cb(data);
    ipcRenderer.on('but:stream-summary-end', listener);
    return () => {
      ipcRenderer.removeListener('but:stream-summary-end', listener);
    };
  },
};

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', api);
