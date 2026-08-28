import React, { useState } from 'react'
import { PuzzlePiece } from '../types/puzzle'

export type TrayFilter = 'all' | 'corners' | 'edges' | 'centers'

interface PieceTrayProps {
  pieces: PuzzlePiece[]
  isOpen: boolean
  onToggleOpen: () => void
  onStartDragPiece: (pieceId: number, screenX: number, screenY: number) => void
  onScatterTab: (tab: TrayFilter) => void
  onTidyTab: (tab: TrayFilter) => void
}

export const PieceTray: React.FC<PieceTrayProps> = ({
  pieces,
  isOpen,
  onToggleOpen,
  onStartDragPiece,
  onScatterTab,
  onTidyTab,
}) => {
  const [filter, setFilter] = useState<TrayFilter>('all')

  const trayPieces = pieces.filter((p) => p.inTray)
  const cornerCount = trayPieces.filter((p) => p.isCorner).length
  const edgeCount = trayPieces.filter((p) => p.isEdge && !p.isCorner).length
  const centerCount = trayPieces.filter((p) => !p.isEdge).length

  const filteredPieces = trayPieces.filter((p) => {
    if (filter === 'corners') return p.isCorner
    if (filter === 'edges') return p.isEdge && !p.isCorner
    if (filter === 'centers') return !p.isEdge
    return true
  })

  const getTabLabel = () => {
    switch (filter) {
      case 'corners':
        return 'Corners'
      case 'edges':
        return 'Edges'
      case 'centers':
        return 'Centers'
      default:
        return 'All'
    }
  }

  const handlePointerDown = (pieceId: number, e: React.PointerEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onStartDragPiece(pieceId, e.clientX, e.clientY)
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out select-none ${
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'
      }`}
    >
      <div className="max-w-5xl mx-auto px-md">
        {/* Tray Toggle Tab & Toolbar */}
        <div className="bg-surface-container border border-b-0 border-outline-variant/40 rounded-t-2xl shadow-xl backdrop-blur-md px-md py-sm flex items-center justify-between">
          <div className="flex items-center gap-sm">
            <button
              onClick={onToggleOpen}
              className="flex items-center gap-xs font-headline-md text-sm text-primary font-bold hover:text-primary-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">
                {isOpen ? 'expand_more' : 'expand_less'}
              </span>
              <span>Piece Tray</span>
              <span className="bg-primary-container text-on-primary-container text-xs px-2 py-0.5 rounded-full font-semibold">
                {trayPieces.length}
              </span>
            </button>

            {/* 4 Categorized Filter Tabs */}
            {isOpen && (
              <div className="flex bg-surface-variant/70 rounded-lg p-0.5 ml-md gap-0.5 text-xs font-semibold">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-sm py-1 rounded-md transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All ({trayPieces.length})
                </button>
                <button
                  onClick={() => setFilter('corners')}
                  className={`px-sm py-1 rounded-md transition-all cursor-pointer ${
                    filter === 'corners'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Corners ({cornerCount})
                </button>
                <button
                  onClick={() => setFilter('edges')}
                  className={`px-sm py-1 rounded-md transition-all cursor-pointer ${
                    filter === 'edges'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Edges ({edgeCount})
                </button>
                <button
                  onClick={() => setFilter('centers')}
                  className={`px-sm py-1 rounded-md transition-all cursor-pointer ${
                    filter === 'centers'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Centers ({centerCount})
                </button>
              </div>
            )}
          </div>

          {/* Context-Aware Actions for Current Tab */}
          <div className="flex items-center gap-xs">
            <button
              onClick={() => onScatterTab(filter)}
              disabled={filteredPieces.length === 0}
              className="px-sm py-1 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              title={`Scatter only ${getTabLabel()} pieces onto table`}
            >
              <span className="material-symbols-outlined text-sm">dashboard_customize</span>
              <span>Scatter {getTabLabel()}</span>
            </button>
            <button
              onClick={() => onTidyTab(filter)}
              className="px-sm py-1 text-xs font-semibold rounded-lg bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/30 transition-all flex items-center gap-1 cursor-pointer"
              title={`Return loose ${getTabLabel()} pieces back to tray`}
            >
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              <span>Tidy {getTabLabel()}</span>
            </button>
          </div>
        </div>

        {/* Tray Scrollable Content Area with Direct Drag-and-Drop */}
        {isOpen && (
          <div className="bg-surface-container-high/95 border border-outline-variant/40 shadow-2xl p-md max-h-48 overflow-x-auto overflow-y-hidden backdrop-blur-md">
            {filteredPieces.length === 0 ? (
              <div className="h-28 flex items-center justify-center text-on-surface-variant text-sm font-medium">
                {trayPieces.length === 0
                  ? 'All pieces are currently placed on the table!'
                  : `No ${getTabLabel().toLowerCase()} pieces left in tray.`}
              </div>
            ) : (
              <div className="flex gap-md items-center py-sm min-w-max">
                {filteredPieces.map((piece) => (
                  <div
                    key={piece.id}
                    onPointerDown={(e) => handlePointerDown(piece.id, e)}
                    className="w-20 h-20 bg-surface-container rounded-xl border border-outline-variant/40 hover:border-primary hover:shadow-xl hover:scale-105 transition-all cursor-grab active:cursor-grabbing flex flex-col items-center justify-center relative p-1 group flex-shrink-0 select-none touch-none"
                    title={`Drag Piece #${piece.id + 1} onto table (${
                      piece.isCorner ? 'Corner' : piece.isEdge ? 'Edge' : 'Center'
                    })`}
                  >
                    {piece.isCorner ? (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-tertiary-container ring-1 ring-white" />
                    ) : piece.isEdge ? (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-secondary-container ring-1 ring-white" />
                    ) : null}
                    <span className="material-symbols-outlined text-3xl text-primary/80 group-hover:text-primary transition-colors">
                      extension
                    </span>
                    <span className="text-[10px] font-semibold text-on-surface-variant group-hover:text-primary">
                      #{piece.id + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
