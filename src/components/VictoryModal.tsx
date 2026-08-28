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
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-md select-none overflow-hidden animate-in fade-in duration-300">
      <div className="bg-surface-container dark:bg-[#181c24] rounded-3xl max-w-2xl w-full p-lg md:p-xl shadow-2xl dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85)] border border-outline-variant/30 dark:border-transparent dark:ring-1 dark:ring-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 text-on-surface">
        {/* Celebration Trophy Icon with Radiant Glow */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 dark:from-emerald-400 dark:to-emerald-600 text-slate-950 flex items-center justify-center mb-sm shadow-[0_0_40px_rgba(245,158,11,0.35)] dark:shadow-[0_0_40px_rgba(52,211,153,0.4)]">
          <span
            className="material-symbols-outlined text-4xl text-slate-950"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
        </div>

        <h2 className="font-display-lg text-2xl md:text-3xl text-primary dark:text-white font-extrabold mb-xs">
          Puzzle Completed!
        </h2>
        <p className="font-body-md text-on-surface-variant dark:text-slate-400 text-sm mb-lg">
          Magnificent work! You solved <span className="font-bold text-primary dark:text-emerald-300">"{title}"</span>.
        </p>

        {/* Clean Pristine Image Reveal with Deep Shadow */}
        <div className="w-full max-h-56 aspect-video rounded-2xl overflow-hidden shadow-lg dark:shadow-[0_15px_35px_rgba(0,0,0,0.6)] mb-lg bg-surface-variant relative group border border-outline-variant/20 dark:border-transparent dark:ring-1 dark:ring-white/10">
          <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Game Stats Bento Grid with Pop Elevation */}
        <div className="grid grid-cols-3 gap-md w-full mb-xl">
          <div className="bg-surface-variant dark:bg-[#0f1218] p-md rounded-2xl border border-outline-variant/20 dark:border-transparent dark:ring-1 dark:ring-white/10 shadow-sm dark:shadow-lg flex flex-col items-center hover:border-primary/40 dark:hover:ring-emerald-500/40 transition-all">
            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-xl mb-1">timer</span>
            <div className="font-label-sm text-xs text-on-surface-variant dark:text-slate-400 font-medium">Solve Time</div>
            <div className="font-headline-md text-base md:text-lg text-on-surface dark:text-white font-bold mt-0.5">
              {formatSolveTime(stats.solveTime)}
            </div>
          </div>

          <div className="bg-surface-variant dark:bg-[#0f1218] p-md rounded-2xl border border-outline-variant/20 dark:border-transparent dark:ring-1 dark:ring-white/10 shadow-sm dark:shadow-lg flex flex-col items-center hover:border-primary/40 dark:hover:ring-emerald-500/40 transition-all">
            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-xl mb-1">
              ads_click
            </span>
            <div className="font-label-sm text-xs text-on-surface-variant dark:text-slate-400 font-medium">Total Moves</div>
            <div className="font-headline-md text-base md:text-lg text-on-surface dark:text-white font-bold mt-0.5">
              {stats.moves}
            </div>
          </div>

          <div className="bg-surface-variant dark:bg-[#0f1218] p-md rounded-2xl border border-outline-variant/20 dark:border-transparent dark:ring-1 dark:ring-white/10 shadow-sm dark:shadow-lg flex flex-col items-center hover:border-primary/40 dark:hover:ring-emerald-500/40 transition-all">
            <span className="material-symbols-outlined text-primary dark:text-emerald-400 text-xl mb-1">
              verified
            </span>
            <div className="font-label-sm text-xs text-on-surface-variant dark:text-slate-400 font-medium">Accuracy</div>
            <div className="font-headline-md text-base md:text-lg text-primary dark:text-emerald-300 font-bold mt-0.5">
              {stats.accuracy}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm w-full">
          <button
            onClick={onRestartFresh}
            className="py-3 px-md rounded-xl bg-surface-variant hover:bg-surface-container-high text-on-surface border border-outline-variant/30 dark:border-transparent dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-semibold text-sm dark:ring-1 dark:ring-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
            title="Play same puzzle again from the beginning"
          >
            <span className="material-symbols-outlined text-lg">restart_alt</span>
            <span>Restart (Fresh)</span>
          </button>
          <button
            onClick={() => onReplayHarder(nextTier.count, nextTier.mult)}
            className="py-3 px-md rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95"
            title={`Generate harder puzzle with ${nextTier.mult} (${nextTier.count} pieces)`}
          >
            <span className="material-symbols-outlined text-lg">trending_up</span>
            <span>Harder ({nextTier.mult})</span>
          </button>
          <button
            onClick={onReturnToLibrary}
            className="py-3 px-md rounded-xl bg-primary hover:bg-primary-container text-on-primary dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-primary/20 dark:shadow-emerald-500/30 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  )
}
