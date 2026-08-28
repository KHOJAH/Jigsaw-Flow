import React, { useEffect } from 'react'
import confetti from 'canvas-confetti'

interface VictoryModalProps {
  isOpen: boolean
  title: string
  imageSrc: string
  totalPieces: number
  stats: {
    solveTime: number
    moves: number
    accuracy: number
  }
  onRestartFresh: () => void
  onReplayHarder: (nextPieces: number, nextMultiplier: string) => void
  onReturnToLibrary: () => void
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  title,
  imageSrc,
  totalPieces,
  stats,
  onRestartFresh,
  onReplayHarder,
  onReturnToLibrary,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire celebratory confetti cannons
      const duration = 2.5 * 1000
      const animationEnd = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#032f1e', '#1d4533', '#ffd8c0', '#5e3122'],
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#032f1e', '#1d4533', '#ffd8c0', '#5e3122'],
        })

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    }
  }, [isOpen])

  if (!isOpen) return null

  const formatSolveTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
    return `${mins}m ${secs}s`
  }

  const handleDownloadArtwork = () => {
    const a = document.createElement('a')
    a.href = imageSrc
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-completed.jpg`
    a.click()
  }

  // Calculate next difficulty tier multiplier: x1 -> x2 -> x3 -> x4 -> x5
  const getNextDifficultyTier = () => {
    if (totalPieces <= 35) return { mult: 'x2', count: 48 }
    if (totalPieces <= 75) return { mult: 'x3', count: 96 }
    if (totalPieces <= 180) return { mult: 'x4', count: 250 }
    return { mult: 'x5', count: 500 }
  }

  const nextTier = getNextDifficultyTier()

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-md select-none overflow-hidden animate-in fade-in duration-300">
      <div className="bg-surface-container rounded-3xl max-w-2xl w-full p-lg md:p-xl shadow-2xl border border-outline-variant/30 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Celebration Trophy Icon */}
        <div className="w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-sm shadow-md">
          <span
            className="material-symbols-outlined text-4xl text-primary-fixed"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
        </div>

        <h2 className="font-display-lg text-2xl md:text-3xl text-primary font-bold mb-xs">
          Puzzle Completed!
        </h2>
        <p className="font-body-md text-on-surface-variant text-sm mb-lg">
          Magnificent work! You solved <span className="font-bold text-on-surface">"{title}"</span>.
        </p>

        {/* Clean Pristine Image Reveal */}
        <div className="w-full max-h-56 aspect-video rounded-2xl overflow-hidden shadow-xl border-4 border-surface mb-lg bg-black relative group">
          <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Game Stats Bento Grid */}
        <div className="grid grid-cols-3 gap-md w-full mb-xl">
          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-xl mb-1">timer</span>
            <div className="font-label-sm text-xs text-on-surface-variant">Solve Time</div>
            <div className="font-headline-md text-base md:text-lg text-on-surface font-bold mt-0.5">
              {formatSolveTime(stats.solveTime)}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-xl mb-1">
              ads_click
            </span>
            <div className="font-label-sm text-xs text-on-surface-variant">Total Moves</div>
            <div className="font-headline-md text-base md:text-lg text-on-surface font-bold mt-0.5">
              {stats.moves}
            </div>
          </div>

          <div className="bg-surface-container-lowest p-md rounded-2xl border border-outline-variant/30 shadow-sm flex flex-col items-center">
            <span className="material-symbols-outlined text-primary text-xl mb-1">
              verified
            </span>
            <div className="font-label-sm text-xs text-on-surface-variant">Accuracy</div>
            <div className="font-headline-md text-base md:text-lg text-on-surface font-bold mt-0.5">
              {stats.accuracy}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm w-full">
          <button
            onClick={onRestartFresh}
            className="py-sm px-md rounded-xl bg-surface hover:bg-surface-variant text-on-surface font-semibold text-sm border border-outline-variant/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            title="Play same puzzle again from the beginning"
          >
            <span className="material-symbols-outlined text-lg">restart_alt</span>
            <span>Restart (Fresh)</span>
          </button>
          <button
            onClick={() => onReplayHarder(nextTier.count, nextTier.mult)}
            className="py-sm px-md rounded-xl bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            title={`Generate harder puzzle with ${nextTier.mult} (${nextTier.count} pieces)`}
          >
            <span className="material-symbols-outlined text-lg">trending_up</span>
            <span>Harder ({nextTier.mult})</span>
          </button>
          <button
            onClick={onReturnToLibrary}
            className="py-sm px-md rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  )
}
