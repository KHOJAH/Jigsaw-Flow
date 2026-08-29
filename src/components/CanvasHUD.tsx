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
  onHint,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const [showGhostSlider, setShowGhostSlider] = useState(false)
  const [showKeybindHelp, setShowKeybindHelp] = useState(false)
  const [showSoundscapeMixer, setShowSoundscapeMixer] = useState(false)

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

          {/* Soundscape Audio Mixer Button & Popover */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSoundscapeMixer(!showSoundscapeMixer)
                setShowGhostSlider(false)
              }}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                showSoundscapeMixer || (settings.musicVolume > 0 && ((settings.soundscape?.rain ?? 0) > 0 || (settings.soundscape?.fire ?? 0) > 0 || (settings.soundscape?.wind ?? 0) > 0))
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/40'
                  : 'text-on-surface-variant hover:bg-surface-variant'
              }`}
              title="Soundscape Atmosphere Mixer (Rain, Fire, Wind, Chimes)"
            >
              <span className="material-symbols-outlined text-lg">headphones</span>
            </button>

            {/* Soundscape Popover */}
            {showSoundscapeMixer && (
              <div className="absolute top-11 right-0 bg-surface-container/95 backdrop-blur-xl p-md rounded-2xl border border-outline-variant/30 dark:border-transparent shadow-2xl w-72 z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none">
                <div className="flex justify-between items-center mb-md border-b border-outline-variant/20 pb-xs">
                  <div className="flex items-center gap-1.5 text-primary font-bold text-xs">
                    <span className="material-symbols-outlined text-base">graphic_eq</span>
                    <span>Soundscape Mixer</span>
                  </div>
                  <button
                    onClick={() => setShowSoundscapeMixer(false)}
                    className="text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                {/* Master Volume */}
                <div className="mb-md bg-surface-container-low p-2 rounded-xl">
                  <div className="flex justify-between text-xs font-semibold text-on-surface mb-1">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">volume_up</span>
                      Master Ambient
                    </span>
                    <span>{settings.musicVolume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.musicVolume}
                    onChange={(e) => onUpdateSettings({ musicVolume: parseInt(e.target.value, 10) })}
                    className="w-full cursor-pointer accent-primary"
                  />
                </div>

                {/* 4 Sound Channels */}
                <div className="space-y-2.5 mb-md">
                  {/* Chimes */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-on-surface mb-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-primary">notifications_active</span>
                        Focus Chimes
                      </span>
                      <span className="text-on-surface-variant">{settings.soundscape?.chimes ?? 40}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.soundscape?.chimes ?? 40}
                      onChange={(e) =>
                        onUpdateSettings({
                          soundscape: {
                            ...(settings.soundscape || { chimes: 40, rain: 0, fire: 0, wind: 0 }),
                            chimes: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full cursor-pointer accent-primary h-1.5"
                    />
                  </div>

                  {/* Rain */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-on-surface mb-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-blue-500">water_drop</span>
                        Rain on Glass
                      </span>
                      <span className="text-on-surface-variant">{settings.soundscape?.rain ?? 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.soundscape?.rain ?? 0}
                      onChange={(e) =>
                        onUpdateSettings({
                          soundscape: {
                            ...(settings.soundscape || { chimes: 40, rain: 0, fire: 0, wind: 0 }),
                            rain: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full cursor-pointer accent-blue-500 h-1.5"
                    />
                  </div>

                  {/* Fireplace */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-on-surface mb-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-amber-500">local_fire_department</span>
                        Cozy Fireplace
                      </span>
                      <span className="text-on-surface-variant">{settings.soundscape?.fire ?? 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.soundscape?.fire ?? 0}
                      onChange={(e) =>
                        onUpdateSettings({
                          soundscape: {
                            ...(settings.soundscape || { chimes: 40, rain: 0, fire: 0, wind: 0 }),
                            fire: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full cursor-pointer accent-amber-500 h-1.5"
                    />
                  </div>

                  {/* Wind / Forest */}
                  <div>
                    <div className="flex justify-between text-[11px] font-medium text-on-surface mb-0.5">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs text-emerald-500">air</span>
                        Forest Wind
                      </span>
                      <span className="text-on-surface-variant">{settings.soundscape?.wind ?? 0}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={settings.soundscape?.wind ?? 0}
                      onChange={(e) =>
                        onUpdateSettings({
                          soundscape: {
                            ...(settings.soundscape || { chimes: 40, rain: 0, fire: 0, wind: 0 }),
                            wind: parseInt(e.target.value, 10),
                          },
                        })
                      }
                      className="w-full cursor-pointer accent-emerald-500 h-1.5"
                    />
                  </div>
                </div>

                {/* Atmosphere Presets */}
                <div className="pt-2 border-t border-outline-variant/20">
                  <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                    Atmosphere Presets
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          soundscape: { chimes: 50, rain: 0, fire: 0, wind: 15 },
                        })
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-surface hover:bg-surface-variant text-on-surface transition-colors cursor-pointer text-center"
                    >
                      Zen Garden
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          soundscape: { chimes: 15, rain: 75, fire: 0, wind: 10 },
                        })
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-surface hover:bg-surface-variant text-on-surface transition-colors cursor-pointer text-center"
                    >
                      Rainy Study
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          soundscape: { chimes: 20, rain: 10, fire: 75, wind: 0 },
                        })
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-surface hover:bg-surface-variant text-on-surface transition-colors cursor-pointer text-center"
                    >
                      Cozy Cabin
                    </button>
                    <button
                      onClick={() =>
                        onUpdateSettings({
                          soundscape: { chimes: 0, rain: 85, fire: 25, wind: 60 },
                        })
                      }
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-surface hover:bg-surface-variant text-on-surface transition-colors cursor-pointer text-center"
                    >
                      Night Storm
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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
