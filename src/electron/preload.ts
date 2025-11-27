import { UIMessage, UIMessageChunk } from 'ai'
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

export interface ChatEndEvent {
  id: string
  text: string
}

export interface ChatChunkEvent {
  id: string
  chunk: UIMessageChunk
}

export type CleanUpFn = () => void

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
  notify: (title: string, body: string) =>
    ipcRenderer.invoke('show-notification', { title, body }),

  // Example: Open external link
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  chatStart: (id: string, messages: UIMessage[]) => {
    ipcRenderer.send('llm:start', {
      id,
      messages,
    })
  },
  onChatChunk: (cb: (event: ChatChunkEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: ChatChunkEvent) =>
      cb(data)
    ipcRenderer.on('llm:chunk', listener)
    return () => {
      ipcRenderer.removeListener('llm:chunk', listener)
    }
  },
  onChatEnd: (cb: (event: ChatEndEvent) => void) => {
    const listener = (_event: IpcRendererEvent, data: ChatEndEvent) => cb(data)
    ipcRenderer.on('llm:end', listener)
    return () => {
      ipcRenderer.removeListener('llm:end', listener)
    }
  },
})

// Type definitions for the exposed API
export interface ElectronAPI {
  ping: () => Promise<string>
  getAppVersion: () => Promise<string>
  getPlatform: () => Promise<{
    platform: string
    arch: string
    version: string
  }>
  notify: (title: string, body: string) => Promise<void>
  openExternal: (url: string) => Promise<void>
  chatStart: (id: string, messages: UIMessage[]) => string
  onChatChunk: (cb: (event: ChatChunkEvent) => void) => CleanUpFn
  onChatEnd: (cb: (event: ChatEndEvent) => void) => CleanUpFn
}
