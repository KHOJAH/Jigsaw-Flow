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
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-md animate-in fade-in duration-200 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181c24] rounded-3xl p-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10 max-w-sm w-full backdrop-blur-2xl flex flex-col items-center gap-md animate-in zoom-in-95 duration-200 relative text-on-surface"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Header Title & Piece ID */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1.5 font-headline-md text-lg font-bold text-emerald-400">
            <span className="material-symbols-outlined text-xl">search</span>
            <span>Piece #{piece.id + 1}</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            High-Resolution Cut Preview
          </p>
        </div>

        {/* Tactile Studio Recessed Stage with Radial Spotlight */}
        <div className="w-56 h-56 rounded-2xl bg-gradient-to-b from-[#0b0d12] to-[#12161f] shadow-[inset_0_2px_12px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)] relative overflow-hidden flex items-center justify-center p-md group">
          {/* Radial Spotlight Aura */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.2)_0%,rgba(16,185,129,0.05)_45%,transparent_75%)] pointer-events-none" />
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(rgba(255,255,255,0.3)_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />

          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-300 relative z-10"
            style={{ transform: `rotate(${piece.rotation}deg)` }}
          >
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] pointer-events-none"
            />
          </div>

          {rotationEnabled && piece.rotation !== 0 && (
            <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-emerald-300 ring-1 ring-emerald-500/30 text-[10px] font-mono rounded font-bold z-20">
              {piece.rotation}°
            </span>
          )}
        </div>

        {/* Badges & Telemetry */}
        <div className="flex flex-wrap items-center justify-center gap-xs">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${
              piece.isCorner
                ? 'bg-rose-500/20 text-rose-300 ring-rose-500/30'
                : piece.isEdge
                ? 'bg-cyan-500/20 text-cyan-300 ring-cyan-500/30'
                : 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/30'
            }`}
          >
            {pieceTypeLabel}
          </span>

          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
              piece.isLockedToBoard
                ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/40'
                : piece.inTray
                ? 'bg-white/10 text-white/90 ring-white/15'
                : 'bg-amber-500/20 text-amber-300 ring-amber-500/30'
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
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-sm rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs ring-1 ring-white/10 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
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
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-sm rounded-xl font-bold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                piece.inTray
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_4px_24px_rgba(16,185,129,0.4)]'
                  : 'bg-white/10 hover:bg-white/15 text-white ring-1 ring-white/10'
              }`}
              title={piece.inTray ? 'Pop piece onto table' : 'Return piece to tray'}
            >
              <span className="material-symbols-outlined text-base font-bold">
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
