import React, { useState, useRef, useEffect } from 'react'
import { PuzzlePiece } from '../types/puzzle'
import { PieceSprite } from '../engine/CanvasRenderer'

export type TrayFilter = 'all' | 'corners' | 'edges' | 'centers'

interface PieceThumbnailProps {
  piece: PuzzlePiece
  getPieceSprite?: (pieceId: number) => PieceSprite | undefined
}

const PieceThumbnail: React.FC<PieceThumbnailProps> = ({ piece, getPieceSprite }) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // IntersectionObserver to lazy-render canvas only when in or near visible scroll view
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '150px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
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
  }, [isVisible, piece.id, getPieceSprite])

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
      {isVisible ? (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-contain filter drop-shadow-md pointer-events-none transition-transform duration-200 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center opacity-30">
          <span className="material-symbols-outlined text-base">extension</span>
        </div>
      )}
    </div>
  )
}

interface PieceTrayProps {
  pieces: PuzzlePiece[]
  isOpen: boolean
  hintedPieceId?: number | null
  getPieceSprite?: (pieceId: number) => PieceSprite | undefined
  onToggleOpen: () => void
  onPopPiece: (pieceId: number) => void
  onInspectPiece: (piece: PuzzlePiece) => void
  onStartDragPiece: (pieceId: number, screenX: number, screenY: number) => void
  onScatterTab: (tab: TrayFilter) => void
  onTidyTab: (tab: TrayFilter) => void
  isSidebarCollapsed?: boolean
}

export const PieceTray: React.FC<PieceTrayProps> = ({
  pieces,
  isOpen,
  hintedPieceId,
  getPieceSprite,
  onToggleOpen,
  onPopPiece,
  onInspectPiece,
  onStartDragPiece,
  onScatterTab,
  onTidyTab,
  isSidebarCollapsed = false,
}) => {
  const [filter, setFilter] = useState<TrayFilter>('all')
  const [trayRows, setTrayRows] = useState<1 | 2 | 3>(1)

  // Auto-scroll to hinted piece inside tray
  useEffect(() => {
    if (hintedPieceId !== null && hintedPieceId !== undefined) {
      const el = document.getElementById(`tray-piece-${hintedPieceId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [hintedPieceId])

  const trayPieces = pieces.filter((p) => p.inTray)
  const cornerCount = trayPieces.filter((p) => p.isCorner).length
  const edgeCount = trayPieces.filter((p) => p.isEdge && !p.isCorner).length
  const centerCount = trayPieces.filter((p) => !p.isEdge).length

  const filteredPieces = trayPieces.filter((p) => {
    switch (filter) {
      case 'corners':
        return p.isCorner
      case 'edges':
        return p.isEdge && !p.isCorner
      case 'centers':
        return !p.isEdge
      default:
        return true
    }
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
    // Primary Left Click initiates seamless drag & pop
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    onStartDragPiece(pieceId, e.clientX, e.clientY)
  }

  return (
    <div
      className={`fixed bottom-0 ${
        isSidebarCollapsed ? 'left-0' : 'left-0 md:left-sidebar-width'
      } right-0 z-30 select-none transition-all duration-300 ease-in-out`}
    >
      <div
        className={`${
          isSidebarCollapsed ? 'max-w-6xl xl:max-w-7xl' : 'max-w-4xl lg:max-w-5xl'
        } mx-auto px-md transition-all duration-300 ease-in-out`}
      >
        {/* Tray Toggle Tab & Toolbar */}
        <div className="bg-surface-container/95 border-t border-x border-outline-variant/60 dark:border-transparent rounded-t-3xl shadow-[0_-12px_36px_rgba(0,0,0,0.14)] dark:shadow-[0_-16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl px-md py-sm flex items-center justify-between transition-colors">
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
              <span className="bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold shadow-xs">
                {trayPieces.length}
              </span>
            </button>

            {/* 4 Categorized Filter Tabs */}
            <div className="flex bg-surface-variant/80 dark:bg-black/30 rounded-xl p-0.5 ml-md gap-0.5 text-xs font-semibold border border-outline-variant/40 dark:border-transparent shadow-inner">
              <button
                onClick={() => setFilter('all')}
                className={`px-sm py-1 rounded-lg transition-all cursor-pointer ${
                  filter === 'all'
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                All ({trayPieces.length})
              </button>
              <button
                onClick={() => setFilter('corners')}
                className={`px-sm py-1 rounded-lg transition-all cursor-pointer ${
                  filter === 'corners'
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Corners ({cornerCount})
              </button>
              <button
                onClick={() => setFilter('edges')}
                className={`px-sm py-1 rounded-lg transition-all cursor-pointer ${
                  filter === 'edges'
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Edges ({edgeCount})
              </button>
              <button
                onClick={() => setFilter('centers')}
                className={`px-sm py-1 rounded-lg transition-all cursor-pointer ${
                  filter === 'centers'
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Centers ({centerCount})
              </button>
            </div>
          </div>

          {/* Quick Tray Sorting Actions & Row Density Selector */}
          <div className="flex items-center gap-xs">
            {/* Row Density Selector */}
            <div className="hidden sm:flex items-center bg-surface-variant/80 dark:bg-black/30 rounded-xl p-0.5 text-[11px] font-bold border border-outline-variant/40 dark:border-transparent mr-1">
              <button
                onClick={() => setTrayRows(1)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  trayRows === 1
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="1-Row Compact Tray"
              >
                1R
              </button>
              <button
                onClick={() => setTrayRows(2)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  trayRows === 2
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="2-Row Standard Tray"
              >
                2R
              </button>
              <button
                onClick={() => setTrayRows(3)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  trayRows === 3
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="3-Row Spacious Tray"
              >
                3R
              </button>
            </div>

            <button
              onClick={() => onScatterTab(filter)}
              className="px-sm py-1.5 text-xs font-semibold rounded-xl bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/50 dark:bg-white/5 dark:hover:bg-white/10 dark:border-transparent shadow-xs hover:shadow transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={`Pop all ${getTabLabel()} pieces neatly onto the table perimeter`}
            >
              <span className="material-symbols-outlined text-sm">grid_view</span>
              <span>Scatter {getTabLabel()}</span>
            </button>
            <button
              onClick={() => onTidyTab(filter)}
              className="px-sm py-1.5 text-xs font-semibold rounded-xl bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/50 dark:bg-white/5 dark:hover:bg-white/10 dark:border-transparent shadow-xs hover:shadow transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              title={`Return loose ${getTabLabel()} pieces back to tray`}
            >
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              <span>Tidy {getTabLabel()}</span>
            </button>
          </div>
        </div>

        {/* Tray Scrollable Content Area (Drawer with Deep Ambient Shadow) */}
        <div
          className={`bg-surface-container-high/98 border-x border-b border-outline-variant/60 dark:border-transparent shadow-[0_-20px_50px_rgba(0,0,0,0.18)] dark:shadow-[0_-24px_60px_rgba(0,0,0,0.7)] overflow-x-auto overflow-y-hidden backdrop-blur-xl transition-all duration-300 ease-in-out ${
            isOpen
              ? trayRows === 1
                ? 'max-h-36 opacity-100 p-sm'
                : trayRows === 2
                ? 'max-h-64 opacity-100 p-sm'
                : 'max-h-96 opacity-100 p-sm'
              : 'max-h-0 opacity-0 p-0 border-t-0 pointer-events-none'
          }`}
        >
          {filteredPieces.length === 0 ? (
            <div className="h-24 flex items-center justify-center text-on-surface-variant text-sm font-medium">
              {trayPieces.length === 0
                ? 'All pieces are currently placed on the table!'
                : `No ${getTabLabel().toLowerCase()} pieces left in tray.`}
            </div>
          ) : (
            <div
              className={`grid ${
                trayRows === 1
                  ? 'grid-rows-1 gap-md'
                  : trayRows === 2
                  ? 'grid-rows-2 gap-sm'
                  : 'grid-rows-3 gap-xs'
              } grid-flow-col items-center py-xs min-w-max`}
            >
              {filteredPieces.map((piece) => {
                const isHinted = piece.id === hintedPieceId
                const cardDimClass =
                  trayRows === 1
                    ? 'w-[96px] h-[96px]'
                    : trayRows === 2
                    ? 'w-[80px] h-[80px]'
                    : 'w-[68px] h-[68px]'
                return (
                  <div
                    key={piece.id}
                    id={`tray-piece-${piece.id}`}
                    onPointerDown={(e) => handlePointerDown(piece.id, e)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onInspectPiece(piece)
                    }}
                    className={`${cardDimClass} rounded-2xl border transition-all cursor-grab active:cursor-grabbing flex flex-col items-center justify-center relative p-1.5 group flex-shrink-0 select-none touch-none ${
                      isHinted
                        ? 'border-primary ring-4 ring-primary/80 bg-primary-container/40 shadow-2xl scale-110 animate-pulse z-20'
                        : 'bg-surface-container-lowest border-outline-variant/60 hover:border-primary shadow-md hover:shadow-2xl hover:-translate-y-2 hover:scale-105 dark:bg-[#151921] dark:border-transparent dark:hover:border-emerald-500/50 dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
                    }`}
                    title={`Piece #${piece.id + 1} (${
                      piece.isCorner ? 'Corner' : piece.isEdge ? 'Edge' : 'Center'
                    }) • Drag onto board • Click to pop • Right-click to inspect`}
                  >
                    {/* Corner / Edge Badge Indicator */}
                    {piece.isCorner ? (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-tertiary-container text-on-tertiary-container dark:bg-rose-500/20 dark:text-rose-300 dark:ring-0 text-[9px] font-bold rounded-md shadow-xs ring-1 ring-tertiary/30">
                        Corner
                      </span>
                    ) : piece.isEdge ? (
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-secondary-container text-on-secondary-container dark:bg-cyan-500/20 dark:text-cyan-300 dark:ring-0 text-[9px] font-bold rounded-md shadow-xs ring-1 ring-secondary/30">
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
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-surface-variant/90 hover:bg-primary hover:text-on-primary text-on-surface-variant dark:bg-white/10 dark:hover:bg-emerald-500 dark:text-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-md z-10 hover:scale-110"
                      title="Inspect Piece Details"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>

                    {/* Piece Number Badge */}
                    <span className="absolute bottom-1 right-1.5 text-[9px] font-bold text-on-surface-variant/60 group-hover:text-primary dark:text-white/40 dark:group-hover:text-emerald-400 font-mono">
                      #{piece.id + 1}
                    </span>

                    {/* Real Piece Silhouette & Texture Thumbnail */}
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <PieceThumbnail piece={piece} getPieceSprite={getPieceSprite} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
