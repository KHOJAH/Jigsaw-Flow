import React, { useState } from 'react'
import { PuzzleSave } from '../types/puzzle'

interface HistoryViewProps {
  saves: PuzzleSave[]
  onReplayPuzzle: (save: PuzzleSave) => void
  onDeleteSave: (id: string) => void
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  saves,
  onReplayPuzzle,
  onDeleteSave,
}) => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress'>('all')

  const filteredSaves = saves.filter((s) => {
    if (filter === 'completed') return s.status === 'completed'
    if (filter === 'in-progress') return s.status === 'in-progress'
    return true
  })

  const completedCount = saves.filter((s) => s.status === 'completed').length
  const totalSeconds = saves.reduce((acc, s) => acc + s.elapsedTime, 0)

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m ${secs}s`
  }

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl bg-background text-on-background select-none">
      <div className="max-w-6xl mx-auto space-y-xl pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-md">
          <div>
            <h1 className="font-display-lg text-display-lg text-primary">History & Stats</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Review your solved puzzles, completion times, and puzzling journey.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-surface-container rounded-xl p-1 border border-outline-variant/30 dark:border-transparent shadow-inner self-start">
            <button
              onClick={() => setFilter('all')}
              className={`px-md py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All ({saves.length})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-md py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Completed ({completedCount})
            </button>
            <button
              onClick={() => setFilter('in-progress')}
              className={`px-md py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === 'in-progress'
                  ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              In Progress ({saves.length - completedCount})
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-md">
          <div className="bg-surface-container rounded-2xl p-md border border-outline-variant/30 dark:border-transparent shadow-sm flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">emoji_events</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Solved Puzzles
              </div>
              <div className="font-headline-md text-2xl text-primary font-bold">
                {completedCount}
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-md border border-outline-variant/30 dark:border-transparent shadow-sm flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">timelapse</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Time Solved
              </div>
              <div className="font-headline-md text-2xl text-primary font-bold">
                {formatTime(totalSeconds)}
              </div>
            </div>
          </div>

          <div className="bg-surface-container rounded-2xl p-md border border-outline-variant/30 dark:border-transparent shadow-sm flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">extension</span>
            </div>
            <div>
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Total Pieces
              </div>
              <div className="font-headline-md text-2xl text-primary font-bold">
                {saves.reduce((acc, s) => acc + s.totalPieces, 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Saves List */}
        {filteredSaves.length === 0 ? (
          <div className="bg-surface-container rounded-2xl p-xl border border-outline-variant/30 dark:border-transparent text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-sm text-outline-variant">
              inbox
            </span>
            <p className="text-sm">No puzzles found matching this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {filteredSaves.map((save) => {
              const isDone = save.status === 'completed'
              const pct = Math.round((save.placedPieces / save.totalPieces) * 100)

              return (
                <div
                  key={save.id}
                  className="bg-surface-container rounded-2xl p-md border border-outline-variant/30 dark:border-transparent shadow-sm hover:shadow-md transition-all flex gap-md"
                >
                  <div className="w-28 h-28 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0 border border-outline-variant/20 dark:border-transparent relative">
                    <img
                      src={save.thumbnailUrl || save.imageSrc}
                      alt={save.title}
                      className="w-full h-full object-cover"
                    />
                    {isDone && (
                      <span className="absolute bottom-1 right-1 bg-primary text-on-primary text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        ✓ Solved
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h3 className="font-headline-md text-base text-primary font-bold truncate">
                          {save.title}
                        </h3>
                        <button
                          onClick={() => onDeleteSave(save.id)}
                          className="text-on-surface-variant hover:text-error transition-colors p-1"
                          title="Delete Puzzle Record"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {save.totalPieces} Pieces •{' '}
                        {save.rotationEnabled ? 'Rotation ON' : 'Rotation OFF'}
                      </p>
                    </div>

                    <div className="mt-sm">
                      <div className="flex justify-between text-xs text-on-surface-variant mb-1 font-medium">
                        <span>Time: {formatTime(save.elapsedTime)}</span>
                        <span>{isDone ? '100%' : `${pct}%`}</span>
                      </div>
                      <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${isDone ? 100 : pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end mt-sm">
                      <button
                        onClick={() => onReplayPuzzle(save)}
                        className="px-md py-1 bg-primary text-on-primary text-xs font-semibold rounded-lg hover:bg-primary-container transition-colors cursor-pointer"
                      >
                        {isDone ? 'Replay Puzzle' : 'Resume'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
