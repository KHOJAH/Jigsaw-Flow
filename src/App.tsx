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
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS)

  // Modals state
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

  // Load saved puzzles and preferences on mount
  useEffect(() => {
    const loadedSettings = StorageService.loadSettings()
    setSettings(loadedSettings)
    audioEngine.setVolumes(loadedSettings.sfxVolume, loadedSettings.musicVolume)

    StorageService.loadSaves().then((loadedSaves) => {
      setSaves(loadedSaves)
      // Pick most recently played in-progress puzzle
      const inProgress = loadedSaves.find((s) => s.status === 'in-progress')
      if (inProgress) {
        setActivePuzzle(inProgress)
      }
    })
  }, [])

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
        setImportInitialPieces(50)
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
              setImportInitialPieces(50)
              setIsImportModalOpen(true)
            }
          }
          reader.readAsDataURL(file)
        }
      }
      input.click()
    }
  }

  // Handle image selected from library or drag-and-drop
  const handleSelectImage = (
    imageSrc: string,
    title: string = 'Custom Jigsaw',
    defaultPieces: number = 50
  ) => {
    setImportImageSrc(imageSrc)
    setImportInitialTitle(title)
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

  // Resume puzzle from library
  const handleResumePuzzle = (save: PuzzleSave) => {
    setActivePuzzle(save)
    setActiveTab('workspace')
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
      <Titlebar currentPuzzleTitle={activePuzzle?.title} />

      {/* Main App Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenImport={handleOpenBrowseFiles}
          hasActivePuzzle={activePuzzle !== null}
          completedCount={completedSaves.length}
        />

        {/* View Switcher */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {activeTab === 'library' && (
            <LibraryView
              recentSaves={recentSaves}
              completedSaves={completedSaves}
              activePuzzle={activePuzzle}
              onResumePuzzle={handleResumePuzzle}
              onDeleteSave={handleDeleteSave}
              onSelectImage={handleSelectImage}
              onOpenBrowseFiles={handleOpenBrowseFiles}
            />
          )}

          {activeTab === 'workspace' && activePuzzle && (
            <WorkspaceView
              puzzle={activePuzzle}
              settings={settings}
              onUpdatePuzzle={handleUpdatePuzzle}
              onUpdateSettings={(newSettings) =>
                setSettings((prev) => ({ ...prev, ...newSettings }))
              }
              onVictory={handleVictory}
              onBackToLibrary={() => setActiveTab('library')}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              saves={saves}
              onReplayPuzzle={handleResumePuzzle}
              onDeleteSave={handleDeleteSave}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsModal
              settings={settings}
              onSaveSettings={setSettings}
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
          onReplay={() => {
            setIsVictoryModalOpen(false)
            setImportImageSrc(activePuzzle.imageSrc)
            setImportInitialTitle(`${activePuzzle.title} (Harder)`)
            setImportInitialPieces(Math.min(500, activePuzzle.totalPieces * 2))
            setIsImportModalOpen(true)
          }}
          onReturnToLibrary={() => {
            setIsVictoryModalOpen(false)
            setActiveTab('library')
          }}
        />
      )}
    </div>
  )
}
