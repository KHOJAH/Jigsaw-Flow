import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { discordService } from './discord.js'
import { appUpdaterService } from './updater.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Set application name for notifications & userData
app.name = 'Jigsaw Flow'

let win: BrowserWindow | null = null

const userDataPath = app.getPath('userData')
const savesDir = path.join(userDataPath, 'saves')
const imagesDir = path.join(userDataPath, 'images')

// Ensure storage directories exist
if (!fs.existsSync(savesDir)) {
  fs.mkdirSync(savesDir, { recursive: true })
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true })
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    frame: false, // Frameless window with custom titlebar
    backgroundColor: '#fff8f4',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    icon: process.env.VITE_DEV_SERVER_URL
      ? path.join(__dirname, '../public/icon.png')
      : path.join(__dirname, '../dist/icon.png'),
  })

  // In dev mode, load Vite server; in prod, load index.html
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  win.on('maximize', () => {
    win?.webContents.send('window:state-changed', { isMaximized: true })
  })

  win.on('unmaximize', () => {
    win?.webContents.send('window:state-changed', { isMaximized: false })
  })

  // Initialize auto-updater service
  appUpdaterService.init(win)
}

// Window Control IPC
ipcMain.handle('window:minimize', (event) => {
  const targetWin = BrowserWindow.fromWebContents(event.sender) || win
  targetWin?.minimize()
})

ipcMain.handle('window:maximize', (event) => {
  const targetWin = BrowserWindow.fromWebContents(event.sender) || win
  if (targetWin?.isMaximized()) {
    targetWin.unmaximize()
  } else {
    targetWin?.maximize()
  }
})

ipcMain.handle('window:close', (event) => {
  const targetWin = BrowserWindow.fromWebContents(event.sender) || win
  targetWin?.close()
})

ipcMain.handle('window:isMaximized', (event) => {
  const targetWin = BrowserWindow.fromWebContents(event.sender) || win
  return targetWin?.isMaximized() ?? false
})

// File Dialogs IPC
ipcMain.handle('dialog:openImage', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    title: 'Select Puzzle Image',
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'svg'] },
    ],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const filePath = result.filePaths[0]
  const ext = path.extname(filePath)
  const fileData = fs.readFileSync(filePath)
  const base64 = fileData.toString('base64')
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
  const dataUrl = `data:${mimeType};base64,${base64}`

  return {
    filePath,
    fileName: path.basename(filePath),
    dataUrl,
  }
})

// Storage & Persistence IPC
ipcMain.handle('fs:saveGame', async (_, { id, data }) => {
  try {
    const saveFilePath = path.join(savesDir, `${id}.json`)
    fs.writeFileSync(saveFilePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (err: any) {
    console.error('Error saving game:', err)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('fs:loadSaves', async () => {
  try {
    const files = fs.readdirSync(savesDir)
    const saves = []
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(savesDir, file), 'utf-8')
        saves.push(JSON.parse(content))
      }
    }
    return saves
  } catch (err: any) {
    console.error('Error loading saves:', err)
    return []
  }
})

ipcMain.handle('fs:deleteSave', async (_, id: string) => {
  try {
    const saveFilePath = path.join(savesDir, `${id}.json`)
    if (fs.existsSync(saveFilePath)) {
      fs.unlinkSync(saveFilePath)
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('fs:exportSave', async (_, { id, data }) => {
  if (!win) return { success: false }
  const result = await dialog.showSaveDialog(win, {
    title: 'Export Jigsaw Puzzle Save',
    defaultPath: `puzzle-save-${id}.jigsaw`,
    filters: [{ name: 'Jigsaw Save File', extensions: ['jigsaw', 'json'] }],
  })

  if (result.canceled || !result.filePath) {
    return { success: false, canceled: true }
  }

  fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
  return { success: true, filePath: result.filePath }
})

ipcMain.handle('fs:importSave', async () => {
  if (!win) return null
  const result = await dialog.showOpenDialog(win, {
    title: 'Import Jigsaw Puzzle Save',
    properties: ['openFile'],
    filters: [{ name: 'Jigsaw Save File', extensions: ['jigsaw', 'json'] }],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  const content = fs.readFileSync(result.filePaths[0], 'utf-8')
  return JSON.parse(content)
})

ipcMain.handle('fs:clearCache', async () => {
  try {
    const files = fs.readdirSync(imagesDir)
    for (const file of files) {
      fs.unlinkSync(path.join(imagesDir, file))
    }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

// Discord Rich Presence IPC
ipcMain.handle('discord:setActivity', async (_, activity) => {
  try {
    await discordService.setActivity(activity)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
})

ipcMain.handle('discord:clearActivity', async () => {
  try {
    discordService.clearActivity()
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
})

ipcMain.handle('discord:setEnabled', async (_, enabled: boolean) => {
  try {
    await discordService.setEnabled(enabled)
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message }
  }
})



app.whenReady().then(() => {
  createWindow()
  discordService.init()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  discordService.destroy()
  appUpdaterService.destroy()
})
