import { randomUUID } from 'crypto'
import { contextBridge, ipcRenderer } from 'electron'

interface ChatEvent {
  id: string
  text: string
}

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

  chatStart: (message: string) => {
    const id = randomUUID()

    ipcRenderer.send('llm:start', {
      id,
      prompt: message,
    })

    return id
  },
  onChunk: (cb: (event: ChatEvent) => void) =>
    ipcRenderer.on('llm:chunk', (_, data) => cb(data)),
  onEnd: (cb: (event: ChatEvent) => void) =>
    ipcRenderer.on('llm:end', (_, data) => cb(data)),
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
  chatStart: (message: string) => string
  onChunk: (cb: (event: ChatEvent) => void) => void
  onEnd: (cb: (event: ChatEvent) => void) => void
}
