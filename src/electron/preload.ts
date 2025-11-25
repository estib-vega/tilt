/* eslint-disable no-unused-vars */
import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
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
  notify: (_title: string, _body: string) => Promise<void>
  openExternal: (url: string) => Promise<void>
}

declare global {
  interface Window {
    electron: ElectronAPI
  }
}
