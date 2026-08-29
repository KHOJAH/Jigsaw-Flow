import { DailyStreak, PuzzleSave, UserSettings } from '../types/puzzle'

const LOCAL_STORAGE_SAVES_KEY = 'jigsaw_flow_saves'
const LOCAL_STORAGE_SETTINGS_KEY = 'jigsaw_flow_settings'
const LOCAL_STORAGE_STREAK_KEY = 'jigsaw_flow_daily_streak'

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'light',
  musicVolume: 40,
  sfxVolume: 85,
  snapSensitivity: 'medium',
  dragInertia: true,
  tableSurface: 'felt',
  edgeHighlight: 30,
  showGhostOverlay: false,
  ghostOpacity: 25,
  allowAutoComplete: true,
  seamlessBlending: true,
  discordRPC: true,
  soundscape: {
    chimes: 40,
    rain: 0,
    fire: 0,
    wind: 0,
  },
}

export const DEFAULT_STREAK: DailyStreak = {
  currentStreak: 0,
  longestStreak: 0,
  completedDates: [],
}

export class StorageService {
  /**
   * Compresses large base64 image data to lightweight WebP/JPEG thumbnail
   */
  static async compressThumbnail(imageSrc: string, maxDim: number = 320): Promise<string> {
    if (!imageSrc || imageSrc.startsWith('http') || imageSrc.length < 50000) {
      return imageSrc
    }
    return new Promise((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const aspect = img.width / img.height
        let w = maxDim
        let h = Math.round(maxDim / aspect)
        if (img.width < img.height) {
          h = maxDim
          w = Math.round(maxDim * aspect)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h)
          const webp = canvas.toDataURL('image/webp', 0.8)
          resolve(webp.length < imageSrc.length ? webp : imageSrc)
        } else {
          resolve(imageSrc)
        }
      }
      img.onerror = () => resolve(imageSrc)
      img.src = imageSrc
    })
  }

  /**
   * Save a puzzle game state
   */
  static async saveGame(save: PuzzleSave): Promise<{ success: boolean; error?: string }> {
    try {
      // Compress thumbnail if needed to save disk and memory space
      if (save.thumbnailUrl && save.thumbnailUrl.length > 50000) {
        save.thumbnailUrl = await this.compressThumbnail(save.thumbnailUrl)
      }

      if (window.electronAPI) {
        return await window.electronAPI.saveGame(save.id, save)
      } else {
        const existing = this.loadBrowserSaves()
        const filtered = existing.filter((s) => s.id !== save.id)
        filtered.unshift(save)
        localStorage.setItem(LOCAL_STORAGE_SAVES_KEY, JSON.stringify(filtered))
        return { success: true }
      }
    } catch (err: any) {
      console.error('Error saving game:', err)
      return { success: false, error: err.message }
    }
  }

  /**
   * Load all saved puzzles
   */
  static async loadSaves(): Promise<PuzzleSave[]> {
    try {
      if (window.electronAPI) {
        const saves = await window.electronAPI.loadSaves()
        return (saves || []).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      } else {
        return this.loadBrowserSaves()
      }
    } catch (err) {
      console.error('Error loading saves:', err)
      return []
    }
  }

  /**
   * Delete a saved game
   */
  static async deleteSave(id: string): Promise<boolean> {
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.deleteSave(id)
        return res.success
      } else {
        const existing = this.loadBrowserSaves()
        const filtered = existing.filter((s) => s.id !== id)
        localStorage.setItem(LOCAL_STORAGE_SAVES_KEY, JSON.stringify(filtered))
        return true
      }
    } catch (err) {
      console.error('Error deleting save:', err)
      return false
    }
  }

  /**
   * Export save file (.jigsaw format)
   */
  static async exportSave(save: PuzzleSave): Promise<boolean> {
    try {
      if (window.electronAPI) {
        const res = await window.electronAPI.exportSave(save.id, save)
        return res.success
      } else {
        const blob = new Blob([JSON.stringify(save, null, 2)], {
          type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `puzzle-save-${save.id}.jigsaw`
        a.click()
        URL.revokeObjectURL(url)
        return true
      }
    } catch (err) {
      console.error('Error exporting save:', err)
      return false
    }
  }

  /**
   * Import save file
   */
  static async importSave(): Promise<PuzzleSave | null> {
    try {
      if (window.electronAPI) {
        return await window.electronAPI.importSave()
      } else {
        return new Promise((resolve) => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.jigsaw,.json'
          input.onchange = async (e: any) => {
            const file = e.target.files?.[0]
            if (!file) {
              resolve(null)
              return
            }
            const text = await file.text()
            const parsed = JSON.parse(text)
            resolve(parsed)
          }
          input.click()
        })
      }
    } catch (err) {
      console.error('Error importing save:', err)
      return null
    }
  }

  /**
   * Load user preferences
   */
  static loadSettings(): UserSettings {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY)
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
      }
    } catch (err) {
      console.error('Error loading settings:', err)
    }
    return { ...DEFAULT_SETTINGS }
  }

  /**
   * Save user preferences
   */
  static saveSettings(settings: UserSettings) {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings))
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  /**
   * Load daily challenge streak & completed calendar dates
   */
  static loadDailyStreak(): DailyStreak {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_STREAK_KEY)
      if (raw) {
        return { ...DEFAULT_STREAK, ...JSON.parse(raw) }
      }
    } catch (err) {
      console.error('Error loading streak:', err)
    }
    return { ...DEFAULT_STREAK }
  }

  /**
   * Record a completed daily puzzle and calculate streak
   */
  static recordDailyCompletion(dateStr: string): DailyStreak {
    const current = this.loadDailyStreak()
    if (current.completedDates.includes(dateStr)) {
      return current
    }

    const newCompleted = [...current.completedDates, dateStr]
    
    // Calculate streak
    let currentStreak = 1
    const today = new Date(dateStr)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    if (current.lastCompletedDate === yesterdayStr) {
      currentStreak = current.currentStreak + 1
    } else if (current.lastCompletedDate === dateStr) {
      currentStreak = current.currentStreak
    }

    const longestStreak = Math.max(current.longestStreak, currentStreak)

    const updatedStreak: DailyStreak = {
      currentStreak,
      longestStreak,
      lastCompletedDate: dateStr,
      completedDates: newCompleted,
    }

    try {
      localStorage.setItem(LOCAL_STORAGE_STREAK_KEY, JSON.stringify(updatedStreak))
    } catch (err) {
      console.error('Error saving streak:', err)
    }

    return updatedStreak
  }

  private static loadBrowserSaves(): PuzzleSave[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVES_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed)
          ? parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          : []
      }
    } catch (err) {
      console.error('Error reading browser saves:', err)
    }
    return []
  }
}
