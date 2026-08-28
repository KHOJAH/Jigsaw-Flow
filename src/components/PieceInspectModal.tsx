import React, { useRef, useEffect } from 'react'
import { PuzzlePiece } from '../types/puzzle'
import { PieceSprite } from '../engine/CanvasRenderer'

interface PieceInspectModalProps {
  piece: PuzzlePiece | null
  rotationEnabled: boolean
  getPieceSprite?: (pieceId: number) => PieceSprite | undefined
  onClose: () => void
  onToggleTray: (pieceId: number) => void
  onRotate: (pieceId: number) => void
}

export const PieceInspectModal: React.FC<PieceInspectModalProps> = ({
  piece,
  rotationEnabled,
  getPieceSprite,
  onClose,
  onToggleTray,
  onRotate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!piece) return
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
  }, [piece, getPieceSprite])

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'r' || e.key === 'R') {
        if (piece && rotationEnabled) {
          onRotate(piece.id)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [piece, rotationEnabled, onClose, onRotate])

  if (!piece) return null

  const pieceTypeLabel = piece.isCorner
    ? 'Corner Piece'
    : piece.isEdge
    ? 'Edge Piece'
    : 'Center Piece'

  const locationStatus = piece.isLockedToBoard
    ? 'Locked on Board'
    : piece.inTray
    ? 'In Organizer Tray'
    : 'On Tabletop'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container/95 border border-outline-variant/50 rounded-3xl p-lg shadow-2xl max-w-sm w-full backdrop-blur-xl flex flex-col items-center gap-md animate-in zoom-in-95 duration-200 relative text-on-surface"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-variant/80 hover:bg-surface-variant text-on-surface-variant flex items-center justify-center transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Header Title & Piece ID */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 font-headline-md text-lg font-bold text-primary">
            <span className="material-symbols-outlined text-xl">search</span>
            <span>Piece #{piece.id + 1}</span>
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
            High-Resolution Cut Preview
          </p>
        </div>

        {/* Large Crisp Piece Silhouette Canvas Preview */}
        <div className="w-48 h-48 bg-surface-container-lowest/80 rounded-2xl border border-outline-variant/40 flex items-center justify-center p-md shadow-inner relative group">
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-300"
            style={{ transform: `rotate(${piece.rotation}deg)` }}
          >
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain filter drop-shadow-2xl pointer-events-none"
            />
          </div>

          {rotationEnabled && piece.rotation !== 0 && (
            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white text-[10px] font-mono rounded font-bold">
              {piece.rotation}°
            </span>
          )}
        </div>

        {/* Badges & Telemetry */}
        <div className="flex flex-wrap items-center justify-center gap-xs">
          <span
            className={`px-sm py-1 rounded-xl text-xs font-bold ${
              piece.isCorner
                ? 'bg-tertiary-container text-on-tertiary-container'
                : piece.isEdge
                ? 'bg-secondary-container text-on-secondary-container'
                : 'bg-surface-variant text-on-surface-variant'
            }`}
          >
            {pieceTypeLabel}
          </span>

          <span
            className={`px-sm py-1 rounded-xl text-xs font-semibold ${
              piece.isLockedToBoard
                ? 'bg-primary-container text-on-primary-container'
                : piece.inTray
                ? 'bg-surface-variant text-on-surface-variant'
                : 'bg-outline-variant/30 text-on-surface'
            }`}
          >
            {locationStatus}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-sm w-full pt-xs">
          {rotationEnabled && !piece.isLockedToBoard && (
            <button
              onClick={() => onRotate(piece.id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-sm rounded-xl bg-surface-variant hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title="Rotate 90° clockwise (R)"
            >
              <span className="material-symbols-outlined text-base">rotate_right</span>
              <span>Rotate</span>
            </button>
          )}

          {!piece.isLockedToBoard && (
            <button
              onClick={() => {
                onToggleTray(piece.id)
                onClose()
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-sm rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                piece.inTray
                  ? 'bg-primary text-on-primary'
                  : 'bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30'
              }`}
              title={piece.inTray ? 'Pop piece onto table' : 'Return piece to tray'}
            >
              <span className="material-symbols-outlined text-base">
                {piece.inTray ? 'dashboard_customize' : 'move_to_inbox'}
              </span>
              <span>{piece.inTray ? 'Pop to Table' : 'To Tray'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
