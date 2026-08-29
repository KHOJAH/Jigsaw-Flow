import { app, BrowserWindow, ipcMain } from 'electron'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater

export type UpdateStatusState =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface UpdateStatus {
  status: UpdateStatusState
  currentVersion: string
  updateInfo?: {
    version: string
    releaseDate?: string
    releaseNotes?: string
  }
  progress?: {
    percent: number
    bytesPerSecond: number
    transferred: number
    total: number
  }
  error?: string
}

class AppUpdaterService {
  private window: BrowserWindow | null = null
  private status: UpdateStatus = {
    status: 'idle',
    currentVersion: app.getVersion(),
  }
  private checkInterval: NodeJS.Timeout | null = null

  public init(win: BrowserWindow) {
    this.window = win
    this.status.currentVersion = app.getVersion()

    // Disable auto-download so users can trigger it interactively
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    this.setupListeners()
    this.setupIPC()

    // Schedule initial check 5s after startup, then every 4 hours
    setTimeout(() => {
      this.checkForUpdates().catch(() => {})
    }, 5000)

    this.checkInterval = setInterval(() => {
      this.checkForUpdates().catch(() => {})
    }, 4 * 60 * 60 * 1000)
  }

  public setWindow(win: BrowserWindow) {
    this.window = win
  }

  private updateState(newState: Partial<UpdateStatus>) {
    this.status = { ...this.status, ...newState }
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('updater:status-changed', this.status)
    }
  }

  private formatErrorMessage(err: any): string {
    const raw = err?.message || String(err || '')
    if (raw.includes('404') || raw.includes('latest.yml') || raw.includes('Cannot find')) {
      return 'No new updates found. You are on the latest version.'
    }
    if (raw.includes('ERR_INTERNET_DISCONNECTED') || raw.includes('ENOTFOUND')) {
      return 'Unable to reach GitHub. Please check your internet connection.'
    }
    if (raw.includes('ETIMEDOUT') || raw.includes('timeout')) {
      return 'Connection timed out while checking for updates.'
    }
    return 'Unable to check for updates at this time.'
  }

  private setupListeners() {
    autoUpdater.on('checking-for-update', () => {
      this.updateState({ status: 'checking', error: undefined })
    })

    autoUpdater.on('update-available', (info) => {
      this.updateState({
        status: 'available',
        updateInfo: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
        },
        error: undefined,
      })
    })

    autoUpdater.on('update-not-available', () => {
      this.updateState({
        status: 'not-available',
        error: undefined,
      })
    })

    autoUpdater.on('download-progress', (progressObj) => {
      this.updateState({
        status: 'downloading',
        progress: {
          percent: Math.round(progressObj.percent),
          bytesPerSecond: progressObj.bytesPerSecond,
          transferred: progressObj.transferred,
          total: progressObj.total,
        },
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.updateState({
        status: 'downloaded',
        updateInfo: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes : undefined,
        },
      })
    })

    autoUpdater.on('error', (err) => {
      const raw = err?.message || String(err || '')
      if (raw.includes('404') || raw.includes('latest.yml')) {
        this.updateState({
          status: 'not-available',
          error: undefined,
        })
      } else {
        this.updateState({
          status: 'error',
          error: this.formatErrorMessage(err),
        })
      }
    })
  }

  public async checkForUpdates(): Promise<UpdateStatus> {
    try {
      this.updateState({ status: 'checking', error: undefined })
      await autoUpdater.checkForUpdates()
    } catch (err: any) {
      const raw = err?.message || String(err || '')
      if (raw.includes('404') || raw.includes('latest.yml')) {
        this.updateState({
          status: 'not-available',
          error: undefined,
        })
      } else {
        this.updateState({
          status: 'error',
          error: this.formatErrorMessage(err),
        })
      }
    }
    return this.status
  }

  public async downloadUpdate(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ status: 'downloading', error: undefined })
      await autoUpdater.downloadUpdate()
      return { success: true }
    } catch (err: any) {
      this.updateState({ status: 'error', error: err?.message })
      return { success: false, error: err?.message }
    }
  }

  public quitAndInstall() {
    try {
      autoUpdater.quitAndInstall(false, true)
    } catch (err) {
      console.error('Error in quitAndInstall:', err)
    }
  }

  public getStatus(): UpdateStatus {
    return this.status
  }

  private setupIPC() {
    ipcMain.handle('updater:check', async () => {
      return await this.checkForUpdates()
    })

    ipcMain.handle('updater:download', async () => {
      return await this.downloadUpdate()
    })

    ipcMain.handle('updater:install', async () => {
      this.quitAndInstall()
      return { success: true }
    })

    ipcMain.handle('updater:getStatus', () => {
      return this.getStatus()
    })
  }

  public destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

export const appUpdaterService = new AppUpdaterService()
