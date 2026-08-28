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
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
