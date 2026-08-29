// @ts-ignore
const { contextBridge, ipcRenderer } = require('electron')

export interface ElectronAPI {
  // Window controls
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
  onWindowStateChanged: (callback: (isMaximized: boolean) => void) => () => void

  // File dialogs
  openImageDialog: () => Promise<{ filePath: string; fileName: string; dataUrl: string } | null>

  // Storage
  saveGame: (id: string, data: any) => Promise<{ success: boolean; error?: string }>
  loadSaves: () => Promise<any[]>
  deleteSave: (id: string) => Promise<{ success: boolean; error?: string }>
  exportSave: (id: string, data: any) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>
  importSave: () => Promise<any | null>
  clearCache: () => Promise<{ success: boolean; error?: string }>

  // Discord Rich Presence
  setDiscordActivity: (activity: {
    details: string
    state?: string
    startTimestamp?: number
    largeImageKey?: string
    largeImageText?: string
    smallImageKey?: string
    smallImageText?: string
  }) => Promise<{ success: boolean; error?: string }>
  clearDiscordActivity: () => Promise<{ success: boolean; error?: string }>
  setDiscordEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>
}

const electronAPI: ElectronAPI = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onWindowStateChanged: (callback) => {
    const handler = (_: any, data: { isMaximized: boolean }) => callback(data.isMaximized)
    ipcRenderer.on('window:state-changed', handler)
    return () => ipcRenderer.removeListener('window:state-changed', handler)
  },

  openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),

  saveGame: (id: string, data: any) => ipcRenderer.invoke('fs:saveGame', { id, data }),
  loadSaves: () => ipcRenderer.invoke('fs:loadSaves'),
  deleteSave: (id: string) => ipcRenderer.invoke('fs:deleteSave', id),
  exportSave: (id: string, data: any) => ipcRenderer.invoke('fs:exportSave', { id, data }),
  importSave: () => ipcRenderer.invoke('fs:importSave'),
  clearCache: () => ipcRenderer.invoke('fs:clearCache'),

  setDiscordActivity: (activity) => ipcRenderer.invoke('discord:setActivity', activity),
  clearDiscordActivity: () => ipcRenderer.invoke('discord:clearActivity'),
  setDiscordEnabled: (enabled) => ipcRenderer.invoke('discord:setEnabled', enabled),
}


contextBridge.exposeInMainWorld('electronAPI', electronAPI)

