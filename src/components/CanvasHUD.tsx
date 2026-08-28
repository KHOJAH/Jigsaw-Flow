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
        {/* Left: Back to Library & Title */}
        <div className="flex items-center gap-sm pointer-events-auto bg-surface-container/90 backdrop-blur-md px-md py-sm rounded-xl border border-outline-variant/30 shadow-lg">
          <button
            onClick={onSaveAndExit}
            className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-primary transition-colors cursor-pointer"
            title="Save & Return to Library"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div>
            <h3 className="font-headline-md text-sm font-bold text-primary truncate max-w-[160px] md:max-w-xs">
              {title}
            </h3>
            <div className="text-[11px] text-on-surface-variant font-medium">
              {totalPieces} Pieces
            </div>
          </div>
        </div>

        {/* Center: Live Timer & DSU Progress Badge */}
        <div className="hidden sm:flex items-center gap-md pointer-events-auto bg-surface-container/90 backdrop-blur-md px-lg py-sm rounded-xl border border-outline-variant/30 shadow-lg">
          <div className="flex items-center gap-1.5 text-primary font-bold text-sm">
            <span className="material-symbols-outlined text-base">timer</span>
            <span className="font-mono text-sm tracking-wider">{formatTimer(elapsedTime)}</span>
          </div>

          <div className="h-4 w-px bg-outline-variant/40" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-on-surface-variant">
              {placedPieces} / {totalPieces}
            </span>
            <span className="bg-primary-container text-on-primary-container text-xs px-2.5 py-0.5 rounded-full font-bold shadow-sm">
              {progressPct}%
            </span>
          </div>
        </div>

        {/* Right: Utility Tool Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-surface-container/90 backdrop-blur-md p-1 rounded-xl border border-outline-variant/30 shadow-lg">
          {/* Auto Complete Action Button */}
          {settings.allowAutoComplete && onAutoComplete && (
            <button
              onClick={onAutoComplete}
              className="px-sm py-1.5 bg-primary-container text-on-primary-container hover:bg-primary-container/80 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 mr-1"
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
          </div>
        </div>
      )}
    </>
  )
}
