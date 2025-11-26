import type { ElectronAPI } from '@api/preload'

declare global {
  interface Window {
    api: ElectronAPI
  }
}
