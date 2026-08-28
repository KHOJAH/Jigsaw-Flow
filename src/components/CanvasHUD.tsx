import React, { useState } from 'react'
import { UserSettings } from '../types/puzzle'

interface CanvasHUDProps {
  title: string
  imageSrc: string
  totalPieces: number
  placedPieces: number
  progressPct: number
  elapsedTime: number
  zoomLevel: number
  settings: UserSettings
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onSaveAndExit: () => void
  onAutoComplete?: () => void
  onLocateBoardRegion?: (normX: number, normY: number) => void
  onHint?: () => void
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export const CanvasHUD: React.FC<CanvasHUDProps> = ({
  title,
  imageSrc,
  totalPieces,
  placedPieces,
  progressPct,
  elapsedTime,
  zoomLevel,
  settings,
  onUpdateSettings,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSaveAndExit,
  onAutoComplete,
  onLocateBoardRegion,
  onHint,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [showReferenceCard, setShowReferenceCard] = useState(false)
  const [showGhostSlider, setShowGhostSlider] = useState(false)
  const [showKeybindHelp, setShowKeybindHelp] = useState(false)

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handlePiPClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onLocateBoardRegion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const normX = (e.clientX - rect.left) / rect.width
    const normY = (e.clientY - rect.top) / rect.height
    onLocateBoardRegion(normX, normY)
  }

  return (
    <>
      {/* Top Floating Header & Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none select-none">
        {/* Left: Back to Library, Toggle Sidebar & Title */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-surface-container/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-outline-variant/30 dark:border-transparent shadow-lg dark:shadow-2xl">
          <button
            onClick={onSaveAndExit}
            className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-primary transition-colors cursor-pointer"
            title="Save & Return to Library"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-primary transition-colors cursor-pointer"
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <span className="material-symbols-outlined text-lg">
                {isSidebarCollapsed ? 'dock_to_right' : 'dock_to_left'}
              </span>
            </button>
          )}

          <div className="h-5 w-px bg-outline-variant/40 dark:bg-white/10 mx-0.5" />

          <div className="flex flex-col justify-center px-1">
            <h3 className="font-headline-md text-sm font-bold text-primary truncate max-w-[160px] md:max-w-xs leading-tight">
              {title}
            </h3>
            <div className="text-[11px] text-on-surface-variant font-medium leading-tight mt-0.5">
              {totalPieces} Pieces
            </div>
          </div>
        </div>

        {/* Center: Live Timer & DSU Progress Badge (Permanently Centered) */}
        <div className="hidden sm:flex items-center gap-md pointer-events-auto bg-surface-container/90 backdrop-blur-md px-lg py-2 rounded-2xl border border-outline-variant/30 dark:border-transparent shadow-lg dark:shadow-2xl absolute left-1/2 -translate-x-1/2 transition-all duration-300">
          <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-base">timer</span>
            <span className="font-mono text-sm tracking-wider">{formatTimer(elapsedTime)}</span>
          </div>

          <div className="h-4 w-px bg-outline-variant/40 dark:bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">
              {placedPieces} / {totalPieces}
            </span>
            <span className="bg-emerald-600 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Right: Utility Tool Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-surface-container/90 backdrop-blur-md p-1.5 rounded-2xl border border-outline-variant/30 dark:border-transparent shadow-lg dark:shadow-2xl ml-auto">
          {/* Auto Complete Action Button */}
          {settings.allowAutoComplete && onAutoComplete && (
            <button
              onClick={onAutoComplete}
              className="px-sm py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/30 dark:ring-1 dark:ring-emerald-500/30 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 mr-1"
              title="Automatically Solve and Assemble Puzzle"
            >
              <span className="material-symbols-outlined text-base">auto_awesome</span>
              <span className="hidden md:inline">Auto Solve</span>
            </button>
          )}

          {/* Ghost Overlay Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                onUpdateSettings({ showGhostOverlay: !settings.showGhostOverlay })
                setShowGhostSlider(!settings.showGhostOverlay)
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                settings.showGhostOverlay
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
              title="Toggle Board Ghost Overlay"
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
            </button>

            {/* Ghost Opacity Slider Popover */}
            {showGhostSlider && settings.showGhostOverlay && (
              <div className="absolute top-11 right-0 bg-surface-container p-sm rounded-xl border border-outline-variant/30 shadow-xl w-40 z-50">
                <div className="text-[10px] font-semibold text-on-surface-variant mb-1 flex justify-between">
                  <span>Ghost Opacity</span>
                  <span>{settings.ghostOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={settings.ghostOpacity}
                  onChange={(e) =>
                    onUpdateSettings({ ghostOpacity: parseInt(e.target.value, 10) })
                  }
                  className="w-full cursor-pointer accent-primary"
                />
              </div>
            )}
          </div>

          {/* Reference Image Button */}
          <button
            onClick={() => setShowReferenceCard(!showReferenceCard)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              showReferenceCard
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-variant'
            }`}
            title="Show Reference Artwork (PiP Navigator)"
          >
            <span className="material-symbols-outlined text-lg">image</span>
          </button>

          {/* Smart Hint Button */}
          {onHint && (
            <button
              onClick={onHint}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-500/15 transition-all cursor-pointer active:scale-95"
              title="Smart Hint: Reveal matching board slot & highlight piece (H)"
            >
              <span className="material-symbols-outlined text-lg">lightbulb</span>
            </button>
          )}

          {/* Zoom Controls */}
          <div className="h-5 w-px bg-outline-variant/40 mx-0.5" />

          <button
            onClick={onZoomOut}
            className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-on-surface-variant cursor-pointer"
            title="Zoom Out"
          >
            <span className="material-symbols-outlined text-base">remove</span>
          </button>
          <button
            onClick={onResetZoom}
            className="text-[11px] font-semibold font-mono text-on-surface hover:text-primary px-1 cursor-pointer"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-on-surface-variant cursor-pointer"
            title="Zoom In"
          >
            <span className="material-symbols-outlined text-base">add</span>
          </button>

          {/* Keybind Help Button */}
          <button
            onClick={() => setShowKeybindHelp(!showKeybindHelp)}
            className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-on-surface-variant cursor-pointer ml-0.5"
            title="Keyboard Shortcuts"
          >
            <span className="material-symbols-outlined text-base">help</span>
          </button>
        </div>
      </div>

      {/* Interactive PiP Navigator Window */}
      {showReferenceCard && (
        <div className="absolute top-20 right-4 z-40 bg-surface-container/95 backdrop-blur-md rounded-2xl border border-outline-variant/30 shadow-2xl p-sm max-w-xs animate-in fade-in slide-in-from-top-2 duration-150 select-none">
          <div className="flex justify-between items-center mb-xs px-1">
            <span className="font-label-sm text-xs font-semibold text-primary flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">explore</span>
              <span>PiP Navigator (Click to locate)</span>
            </span>
            <button
              onClick={() => setShowReferenceCard(false)}
              className="text-on-surface-variant hover:text-on-surface p-0.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div
            onClick={handlePiPClick}
            className="rounded-xl overflow-hidden border border-outline-variant/30 shadow-md max-h-48 bg-black cursor-crosshair relative group"
            title="Click anywhere to pan canvas to that region"
          >
            <img src={imageSrc} alt="Reference" className="w-full h-full object-contain pointer-events-none" />
            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
              Click to Center View
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal Popover */}
      {showKeybindHelp && (
        <div className="absolute top-20 right-4 z-40 bg-surface-container/95 backdrop-blur-md rounded-xl border border-outline-variant/30 shadow-2xl p-md max-w-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex justify-between items-center mb-sm border-b border-outline-variant/20 pb-xs">
            <span className="font-headline-md text-sm font-bold text-primary">
              Controls & Shortcuts
            </span>
            <button
              onClick={() => setShowKeybindHelp(false)}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          <div className="space-y-2 text-xs text-on-surface">
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Pan Canvas</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                Space + Drag / Mid Click
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Pan Left / Right</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                Shift + Scroll
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Zoom In/Out</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                Mouse Wheel
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Rotate Piece</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                R / Double Click
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Toggle Tray</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                T
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Multi-Select</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                Ctrl + Click / Drag Box
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Smart Hint</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                H
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Inspect Piece</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                Right Click / I
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant">Send to Tray</span>
              <kbd className="px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40 font-mono text-[10px]">
                Backspace
              </kbd>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
