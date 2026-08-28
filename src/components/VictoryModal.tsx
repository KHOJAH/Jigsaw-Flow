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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-md select-none overflow-hidden animate-in fade-in duration-300">
      <div className="bg-[#181c24] rounded-3xl max-w-2xl w-full p-lg md:p-xl shadow-[0_30px_70px_-10px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Celebration Trophy Icon with Radiant Glow */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 flex items-center justify-center mb-sm shadow-[0_0_40px_rgba(52,211,153,0.4)]">
          <span
            className="material-symbols-outlined text-4xl text-slate-950"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            emoji_events
          </span>
        </div>

        <h2 className="font-display-lg text-2xl md:text-3xl text-white font-extrabold mb-xs">
          Puzzle Completed!
        </h2>
        <p className="font-body-md text-slate-400 text-sm mb-lg">
          Magnificent work! You solved <span className="font-bold text-emerald-300">"{title}"</span>.
        </p>

        {/* Clean Pristine Image Reveal with Deep Shadow */}
        <div className="w-full max-h-56 aspect-video rounded-2xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.1)] mb-lg bg-black relative group ring-1 ring-white/10">
          <img src={imageSrc} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Game Stats Bento Grid with Pop Elevation */}
        <div className="grid grid-cols-3 gap-md w-full mb-xl">
          <div className="bg-[#0f1218] p-md rounded-2xl ring-1 ring-white/10 shadow-lg flex flex-col items-center hover:ring-emerald-500/40 transition-all">
            <span className="material-symbols-outlined text-emerald-400 text-xl mb-1">timer</span>
            <div className="font-label-sm text-xs text-slate-400 font-medium">Solve Time</div>
            <div className="font-headline-md text-base md:text-lg text-white font-bold mt-0.5">
              {formatSolveTime(stats.solveTime)}
            </div>
          </div>

          <div className="bg-[#0f1218] p-md rounded-2xl ring-1 ring-white/10 shadow-lg flex flex-col items-center hover:ring-emerald-500/40 transition-all">
            <span className="material-symbols-outlined text-emerald-400 text-xl mb-1">
              ads_click
            </span>
            <div className="font-label-sm text-xs text-slate-400 font-medium">Total Moves</div>
            <div className="font-headline-md text-base md:text-lg text-white font-bold mt-0.5">
              {stats.moves}
            </div>
          </div>

          <div className="bg-[#0f1218] p-md rounded-2xl ring-1 ring-white/10 shadow-lg flex flex-col items-center hover:ring-emerald-500/40 transition-all">
            <span className="material-symbols-outlined text-emerald-400 text-xl mb-1">
              verified
            </span>
            <div className="font-label-sm text-xs text-slate-400 font-medium">Accuracy</div>
            <div className="font-headline-md text-base md:text-lg text-emerald-300 font-bold mt-0.5">
              {stats.accuracy}%
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm w-full">
          <button
            onClick={onRestartFresh}
            className="py-3 px-md rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm ring-1 ring-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
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
            className="py-3 px-md rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">grid_view</span>
            <span>Return Home</span>
          </button>
        </div>
      </div>
    </div>
  )
}
