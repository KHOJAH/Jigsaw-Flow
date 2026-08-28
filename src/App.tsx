import React, { useState, useEffect, useCallback } from 'react'
import {
  ActiveNavTab,
  PuzzleCutStyle,
  PuzzlePiece,
  PuzzleSave,
  UserSettings,
} from './types/puzzle'
import { Titlebar } from './components/Titlebar'
import { Sidebar } from './components/Sidebar'
import { LibraryView } from './components/LibraryView'
import { WorkspaceView } from './components/WorkspaceView'
import { HistoryView } from './components/HistoryView'
import { SettingsModal } from './components/SettingsModal'
import { ImportModal } from './components/ImportModal'
import { VictoryModal } from './components/VictoryModal'
import { JigsawGenerator } from './engine/JigsawGenerator'
import { StorageService, DEFAULT_SETTINGS } from './engine/StorageService'
import { audioEngine } from './engine/AudioEngine'

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('library')
  const [saves, setSaves] = useState<PuzzleSave[]>([])
  const [activePuzzle, setActivePuzzle] = useState<PuzzleSave | null>(null)
  const [settings, setSettings] = useState<UserSettings>(() => {
    const loaded = StorageService.loadSettings()
    if (
      loaded.theme === 'dark' ||
      (loaded.theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches)
    ) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return loaded
  })

  // Modals & layout state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importImageSrc, setImportImageSrc] = useState<string>('')
  const [importInitialTitle, setImportInitialTitle] = useState<string>('Custom Jigsaw')
  const [importInitialPieces, setImportInitialPieces] = useState<number>(50)

  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false)
  const [victoryStats, setVictoryStats] = useState<{
    solveTime: number
    moves: number
    accuracy: number
  }>({ solveTime: 0, moves: 0, accuracy: 100 })

  // Load saved puzzles and set audio on mount
  useEffect(() => {
    audioEngine.setVolumes(settings.sfxVolume, settings.musicVolume)

    StorageService.loadSaves().then((loadedSaves) => {
      setSaves(loadedSaves)
      // Pick most recently played in-progress puzzle
      const inProgress = loadedSaves.find((s) => s.status === 'in-progress')
      if (inProgress) {
        setActivePuzzle(inProgress)
      }
    })
  }, [])

  // Sync Dark/Light theme class with root HTML element
  useEffect(() => {
    const root = document.documentElement
    const applyDark = (isDark: boolean) => {
      if (isDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    if (settings.theme === 'dark') {
      applyDark(true)
    } else if (settings.theme === 'light') {
      applyDark(false)
    } else {
      const media = window.matchMedia('(prefers-color-scheme: dark)')
      applyDark(media.matches)
      const listener = (e: MediaQueryListEvent) => applyDark(e.matches)
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    }
  }, [settings.theme])

  // Universal settings updater with persistence
  const handleUpdateSettings = useCallback((newSettings: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated: UserSettings = { ...prev, ...newSettings }
      StorageService.saveSettings(updated)
      if (
        updated.theme === 'dark' ||
        (updated.theme === 'system' &&
          window.matchMedia?.('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return updated
    })
  }, [])

  // Quick 1-Click Theme Toggle
  const handleToggleTheme = useCallback(() => {
    const nextTheme = settings.theme === 'dark' ? 'light' : 'dark'
    handleUpdateSettings({ theme: nextTheme })
  }, [settings.theme, handleUpdateSettings])

  // Manage ambient audio on workspace entry/exit
  useEffect(() => {
    if (activeTab === 'workspace' && settings.musicVolume > 0) {
      audioEngine.startAmbientMusic()
    } else {
      audioEngine.stopAmbientMusic()
    }
  }, [activeTab, settings.musicVolume])

  // Open native or fallback file browser
  const handleOpenBrowseFiles = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.openImageDialog()
      if (res && res.dataUrl) {
        setImportImageSrc(res.dataUrl)
        setImportInitialTitle(res.fileName.replace(/\.[^/.]+$/, ''))
        setImportInitialPieces(48)
        setIsImportModalOpen(true)
      }
    } else {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = (e: any) => {
        const file = e.target.files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (event) => {
            if (event.target?.result) {
              setImportImageSrc(event.target.result as string)
              setImportInitialTitle(file.name.replace(/\.[^/.]+$/, ''))
              setImportInitialPieces(48)
              setIsImportModalOpen(true)
            }
          }
          reader.readAsDataURL(file)
        }
      }
      input.click()
    }
  }

  // Clean base puzzle title removing any previous (Harder) or (x1, x2, etc.) suffixes
  const cleanBaseTitle = (rawTitle: string): string => {
    return rawTitle
      .replace(/\s*\((?:Harder|x\d+|[^)]*p)[^)]*\)/gi, '')
      .replace(/\s*\((?:Harder)\)/gi, '')
      .trim()
  }

  // Handle image selected from library or drag-and-drop
  const handleSelectImage = (
    imageSrc: string,
    title: string = 'Custom Jigsaw',
    defaultPieces: number = 48
  ) => {
    setImportImageSrc(imageSrc)
    setImportInitialTitle(cleanBaseTitle(title))
    setImportInitialPieces(defaultPieces)
    setIsImportModalOpen(true)
  }

  // Generate puzzle pieces and launch Workspace
  const handleStartPuzzle = async (config: {
    title: string
    imageSrc: string
    pieceCount: number
    enableRotation: boolean
    cutStyle: PuzzleCutStyle
    aspectRatio: string
  }) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = config.imageSrc

    await new Promise((resolve) => {
      img.onload = resolve
    })

    const natW = img.naturalWidth || 1000
    const natH = img.naturalHeight || 750
    const aspect = natW / natH

    // Standardized board dimension for table view
    const boardWidth = 900
    const boardHeight = Math.round(boardWidth / aspect)

    const grid = JigsawGenerator.calculateGrid(
      aspect,
      config.pieceCount,
      boardWidth,
      boardHeight
    )

    const generatedPieces = JigsawGenerator.generatePieces(
      grid.rows,
      grid.cols,
      grid.pieceWidth,
      grid.pieceHeight,
      boardWidth,
      boardHeight,
      config.enableRotation,
      config.cutStyle
    )

    const newSave: PuzzleSave = {
      id: `puzzle-${Date.now()}`,
      title: config.title,
      thumbnailUrl: config.imageSrc,
      imageSrc: config.imageSrc,
      imageWidth: natW,
      imageHeight: natH,
      boardWidth,
      boardHeight,
      rows: grid.rows,
      cols: grid.cols,
      totalPieces: generatedPieces.length,
      placedPieces: 0,
      pieces: generatedPieces,
      clusters: {},
      rotationEnabled: config.enableRotation,
      cutStyle: config.cutStyle,
      elapsedTime: 0,
      movesCount: 0,
      snapCount: 0,
      status: 'in-progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await StorageService.saveGame(newSave)
    setSaves((prev) => [newSave, ...prev.filter((s) => s.id !== newSave.id)])
    setActivePuzzle(newSave)
    setIsImportModalOpen(false)
    setActiveTab('workspace')
  }

  // Restart puzzle from beginning with pieces cleanly reset in organizer tray
  const handleRestartPuzzle = async (save: PuzzleSave) => {
    const resetPieces: PuzzlePiece[] = save.pieces.map((p, idx) => ({
      ...p,
      inTray: true,
      isLockedToBoard: false,
      clusterId: p.id,
      x: 0,
      y: 0,
      rotation: save.rotationEnabled
        ? [0, 90, 180, 270][Math.floor(Math.random() * 4)]
        : 0,
      zIndex: idx,
    }))

    const freshSave: PuzzleSave = {
      ...save,
      pieces: resetPieces,
      status: 'in-progress',
      elapsedTime: 0,
      movesCount: 0,
      snapCount: 0,
      placedPieces: 0,
      updatedAt: new Date().toISOString(),
    }

    await StorageService.saveGame(freshSave)
    setSaves((prev) => prev.map((s) => (s.id === freshSave.id ? freshSave : s)))
    setActivePuzzle(freshSave)
    setActiveTab('workspace')
  }

  // Resume in-progress puzzle from library
  const handleResumePuzzle = (save: PuzzleSave) => {
    if (save.status === 'completed') {
      handleRestartPuzzle(save)
    } else {
      setActivePuzzle(save)
      setActiveTab('workspace')
    }
  }

  // Update puzzle state in real-time
  const handleUpdatePuzzle = useCallback((updated: PuzzleSave) => {
    setActivePuzzle(updated)
    setSaves((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
    StorageService.saveGame(updated)
  }, [])

  // Delete saved puzzle
  const handleDeleteSave = async (id: string) => {
    await StorageService.deleteSave(id)
    setSaves((prev) => prev.filter((s) => s.id !== id))
    if (activePuzzle?.id === id) {
      setActivePuzzle(null)
    }
  }

  // Trigger Victory
  const handleVictory = async (stats: {
    solveTime: number
    moves: number
    accuracy: number
  }) => {
    if (!activePuzzle) return

    const completedSave: PuzzleSave = {
      ...activePuzzle,
      status: 'completed',
      placedPieces: activePuzzle.totalPieces,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    setVictoryStats(stats)
    setIsVictoryModalOpen(true)
    handleUpdatePuzzle(completedSave)
  }

  // Export Save Backup
  const handleExportSave = async () => {
    if (activePuzzle) {
      await StorageService.exportSave(activePuzzle)
    } else if (saves.length > 0) {
      await StorageService.exportSave(saves[0])
    }
  }

  // Import Save Backup
  const handleImportSave = async () => {
    const imported = await StorageService.importSave()
    if (imported && imported.id) {
      await StorageService.saveGame(imported)
      setSaves((prev) => [imported, ...prev.filter((s) => s.id !== imported.id)])
      setActivePuzzle(imported)
      setActiveTab('workspace')
    }
  }

  // Clear Image Cache
  const handleClearCache = async () => {
    if (window.electronAPI) {
      await window.electronAPI.clearCache()
    }
  }

  const recentSaves = saves.filter((s) => s.status === 'in-progress')
  const completedSaves = saves.filter((s) => s.status === 'completed')

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-on-background">
      {/* Frameless Desktop Titlebar */}
      <Titlebar
        currentPuzzleTitle={activePuzzle?.title}
        theme={settings.theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenImport={handleOpenBrowseFiles}
          hasActivePuzzle={activePuzzle !== null}
          completedCount={completedSaves.length}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
          isCollapsed={isSidebarCollapsed && activeTab === 'workspace'}
        />

        {/* View Switcher */}
        <main key={activeTab} className="flex-1 flex flex-col h-full overflow-hidden relative animate-in fade-in duration-200">
          {activeTab === 'library' && (
            <LibraryView
              recentSaves={recentSaves}
              completedSaves={completedSaves}
              activePuzzle={activePuzzle}
              theme={settings.theme}
              onToggleTheme={handleToggleTheme}
              onResumePuzzle={handleResumePuzzle}
              onReplayPuzzle={handleRestartPuzzle}
              onDeleteSave={handleDeleteSave}
              onSelectImage={handleSelectImage}
              onOpenBrowseFiles={handleOpenBrowseFiles}
            />
          )}

          {activeTab === 'workspace' && (
            activePuzzle ? (
              <WorkspaceView
                key={activePuzzle.id}
                puzzle={activePuzzle}
                settings={settings}
                onUpdatePuzzle={handleUpdatePuzzle}
                onUpdateSettings={handleUpdateSettings}
                onVictory={handleVictory}
                isSidebarCollapsed={isSidebarCollapsed}
                onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
                onBackToLibrary={() => {
                  setActivePuzzle(null)
                  setActiveTab('library')
                }}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-xl text-center bg-surface-container-lowest">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-md shadow-sm">
                  <span className="material-symbols-outlined text-3xl">extension_off</span>
                </div>
                <h3 className="font-headline-md text-xl font-bold text-primary mb-xs">
                  Workspace Cleared
                </h3>
                <p className="text-sm text-on-surface-variant max-w-sm mb-lg">
                  Select a puzzle from your library or import a new picture to begin solving.
                </p>
                <button
                  onClick={() => setActiveTab('library')}
                  className="px-lg py-sm bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-lg">grid_view</span>
                  <span>Go to Library</span>
                </button>
              </div>
            )
          )}

          {activeTab === 'history' && (
            <HistoryView
              saves={saves}
              onReplayPuzzle={handleRestartPuzzle}
              onDeleteSave={handleDeleteSave}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModal
              settings={settings}
              onSaveSettings={handleUpdateSettings}
              onExportSave={handleExportSave}
              onImportSave={handleImportSave}
              onClearCache={handleClearCache}
            />
          )}
        </main>
      </div>

      {/* Import & Setup Modal */}
      {isImportModalOpen && (
        <ImportModal
          isOpen={isImportModalOpen}
          imageSrc={importImageSrc}
          initialTitle={importInitialTitle}
          initialPieces={importInitialPieces}
          onClose={() => setIsImportModalOpen(false)}
          onStartPuzzle={handleStartPuzzle}
          onReplaceImage={handleOpenBrowseFiles}
        />
      )}

      {/* Victory Celebration Modal */}
      {isVictoryModalOpen && activePuzzle && (
        <VictoryModal
          isOpen={isVictoryModalOpen}
          title={activePuzzle.title}
          imageSrc={activePuzzle.imageSrc}
          totalPieces={activePuzzle.totalPieces}
          stats={victoryStats}
          onRestartFresh={() => {
            setIsVictoryModalOpen(false)
            handleRestartPuzzle(activePuzzle)
          }}
          onReplayHarder={(nextPieces, nextMultiplier) => {
            setIsVictoryModalOpen(false)
            const baseTitle = cleanBaseTitle(activePuzzle.title)
            setImportImageSrc(activePuzzle.imageSrc)
            setImportInitialTitle(`${baseTitle} (${nextMultiplier})`)
            setImportInitialPieces(nextPieces)
            setIsImportModalOpen(true)
          }}
          onReturnToLibrary={() => {
            setIsVictoryModalOpen(false)
            setActivePuzzle(null)
            setActiveTab('library')
          }}
        />
      )}
    </div>
  )
}
