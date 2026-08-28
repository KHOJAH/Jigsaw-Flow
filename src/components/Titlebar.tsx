import React, { useEffect, useState } from 'react'

interface TitlebarProps {
  currentPuzzleTitle?: string
}

export const Titlebar: React.FC<TitlebarProps> = ({ currentPuzzleTitle }) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const isElectron = !!window.electronAPI

  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.isMaximized().then(setIsMaximized)
      const cleanup = window.electronAPI.onWindowStateChanged(setIsMaximized)
      return cleanup
    }
  }, [])

  const handleMinimize = () => {
    window.electronAPI?.minimize()
  }

  const handleMaximize = () => {
    window.electronAPI?.maximize()
  }

  const handleClose = () => {
    window.electronAPI?.close()
  }

  return (
    <header
      className="h-8 bg-surface-container border-b border-outline-variant/30 flex items-center justify-between px-3 select-none flex-shrink-0 z-50 text-on-surface"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* App Branding & Window Title */}
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
          extension
        </span>
        <span className="font-headline-md tracking-tight">Jigsaw Flow</span>
        {currentPuzzleTitle && (
          <>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant font-medium truncate max-w-xs">{currentPuzzleTitle}</span>
          </>
        )}
      </div>

      {/* Desktop Window Controls */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={handleMinimize}
          className="w-7 h-6 flex items-center justify-center hover:bg-surface-variant rounded text-on-surface-variant hover:text-on-surface transition-colors"
          title="Minimize"
        >
          <span className="material-symbols-outlined text-sm">minimize</span>
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-6 flex items-center justify-center hover:bg-surface-variant rounded text-on-surface-variant hover:text-on-surface transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          <span className="material-symbols-outlined text-sm">
            {isMaximized ? 'filter_none' : 'fullscreen'}
          </span>
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-6 flex items-center justify-center hover:bg-error hover:text-on-error rounded text-on-surface-variant transition-colors"
          title="Close"
        >
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </header>
  )
}
