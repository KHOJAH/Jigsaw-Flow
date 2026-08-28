import React, { useState, useRef, useEffect } from 'react'
import { PuzzlePiece } from '../types/puzzle'
import { PieceSprite } from '../engine/CanvasRenderer'

export type TrayFilter = 'all' | 'corners' | 'edges' | 'centers'

interface PieceThumbnailProps {
  piece: PuzzlePiece
  getPieceSprite?: (pieceId: number) => PieceSprite | undefined
}

const PieceThumbnail: React.FC<PieceThumbnailProps> = ({ piece, getPieceSprite }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const sprite = getPieceSprite?.(piece.id)
    if (sprite) {
      canvas.width = sprite.width
      canvas.height = sprite.height
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(sprite.canvas, 0, 0)
    }
  }, [piece.id, getPieceSprite])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full object-contain filter drop-shadow-md pointer-events-none transition-transform duration-200 group-hover:scale-105"
    />
  )
}

interface PieceTrayProps {
  pieces: PuzzlePiece[]
  isOpen: boolean
  getPieceSprite?: (pieceId: number) => PieceSprite | undefined
  onToggleOpen: () => void
  onPopPiece: (pieceId: number) => void
  onInspectPiece: (piece: PuzzlePiece) => void
  onStartDragPiece: (pieceId: number, screenX: number, screenY: number) => void
  onScatterTab: (tab: TrayFilter) => void
  onTidyTab: (tab: TrayFilter) => void
}

export const PieceTray: React.FC<PieceTrayProps> = ({
  pieces,
  isOpen,
  getPieceSprite,
  onToggleOpen,
  onPopPiece,
  onInspectPiece,
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
    // Only handle Primary Left Click for drag and pop!
    if (e.button !== 0) return

    e.preventDefault()
    e.stopPropagation()

    const startX = e.clientX
    const startY = e.clientY
    let hasStartedDrag = false

    const handlePointerMove = (moveEv: PointerEvent) => {
      const dist = Math.hypot(moveEv.clientX - startX, moveEv.clientY - startY)
      if (dist > 8 && !hasStartedDrag) {
        hasStartedDrag = true
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
        onStartDragPiece(pieceId, moveEv.clientX, moveEv.clientY)
      }
    }

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      if (!hasStartedDrag) {
        onPopPiece(pieceId)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 select-none">
      <div className="max-w-5xl mx-auto px-md">
        {/* Tray Toggle Tab & Toolbar (Always Visible & Docked) */}
        <div className="bg-surface-container border border-b-0 border-outline-variant/40 rounded-t-2xl shadow-xl backdrop-blur-md px-md py-sm flex items-center justify-between transition-colors">
          <div className="flex items-center gap-sm">
            <button
              onClick={onToggleOpen}
              className="flex items-center gap-xs font-headline-md text-sm text-primary font-bold hover:text-primary-container transition-colors cursor-pointer"
              title={isOpen ? 'Collapse Piece Tray (T)' : 'Expand Piece Tray (T)'}
            >
              <span className="material-symbols-outlined text-xl transition-transform duration-300">
                {isOpen ? 'expand_more' : 'expand_less'}
              </span>
              <span>Piece Tray</span>
              <span className="bg-primary-container text-on-primary-container text-xs px-2 py-0.5 rounded-full font-semibold">
                {trayPieces.length}
              </span>
            </button>

            {/* 4 Categorized Filter Tabs */}
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

        {/* Tray Scrollable Content Area with Smooth Slide-Down Animation */}
        <div
          className={`bg-surface-container-high/95 border border-outline-variant/40 shadow-2xl overflow-x-auto overflow-y-hidden backdrop-blur-md transition-all duration-300 ease-in-out ${
            isOpen
              ? 'max-h-56 opacity-100 p-md'
              : 'max-h-0 opacity-0 p-0 border-t-0 pointer-events-none'
          }`}
        >
          {filteredPieces.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-on-surface-variant text-sm font-medium">
              {trayPieces.length === 0
                ? 'All pieces are currently placed on the table!'
                : `No ${getTabLabel().toLowerCase()} pieces left in tray.`}
            </div>
          ) : (
            <div className="flex gap-md items-center py-xs min-w-max">
              {filteredPieces.map((piece) => (
                <div
                  key={piece.id}
                  onPointerDown={(e) => handlePointerDown(piece.id, e)}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    onInspectPiece(piece)
                  }}
                  className="w-[84px] h-[84px] bg-surface-container-lowest/90 rounded-2xl border border-outline-variant/50 hover:border-primary hover:shadow-xl hover:-translate-y-1.5 transition-all cursor-grab active:cursor-grabbing flex flex-col items-center justify-center relative p-1.5 group flex-shrink-0 select-none touch-none shadow-sm"
                  title={`Piece #${piece.id + 1} (${
                    piece.isCorner ? 'Corner' : piece.isEdge ? 'Edge' : 'Center'
                  }) • Click to pop • Drag to move • Right-click to inspect`}
                >
                  {/* Corner / Edge Badge Indicator */}
                  {piece.isCorner ? (
                    <span className="absolute top-1.5 left-1.5 px-1 py-0.2 bg-tertiary/20 text-tertiary text-[9px] font-bold rounded ring-1 ring-tertiary/30">
                      Corner
                    </span>
                  ) : piece.isEdge ? (
                    <span className="absolute top-1.5 left-1.5 px-1 py-0.2 bg-secondary/20 text-secondary text-[9px] font-bold rounded ring-1 ring-secondary/30">
                      Edge
                    </span>
                  ) : null}

                  {/* Hover Inspect Eye Button */}
                  <button
                    onPointerDown={(e) => {
                      e.stopPropagation()
                    }}
                    onPointerUp={(e) => {
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onInspectPiece(piece)
                    }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-surface-variant/90 hover:bg-primary hover:text-on-primary text-on-surface-variant flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-sm z-10"
                    title="Inspect Piece Details"
                  >
                    <span className="material-symbols-outlined text-[13px]">visibility</span>
                  </button>

                  {/* Piece Number Badge */}
                  <span className="absolute bottom-1 right-1.5 text-[9px] font-semibold text-on-surface-variant/70 group-hover:text-primary">
                    #{piece.id + 1}
                  </span>

                  {/* Real Piece Silhouette & Texture Thumbnail */}
                  <div className="w-full h-full flex items-center justify-center p-1">
                    <PieceThumbnail piece={piece} getPieceSprite={getPieceSprite} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
