import React, { useState } from 'react'
import { PuzzleSave } from '../types/puzzle'
import { SAMPLE_PUZZLES, SamplePuzzle } from '../assets/samplePuzzles'

interface LibraryViewProps {
  recentSaves: PuzzleSave[]
  completedSaves: PuzzleSave[]
  activePuzzle: PuzzleSave | null
  theme?: string
  onToggleTheme?: () => void
  onResumePuzzle: (save: PuzzleSave) => void
  onReplayPuzzle: (save: PuzzleSave) => void
  onDeleteSave: (id: string) => void
  onSelectImage: (imageSrc: string, title?: string, defaultPieces?: number) => void
  onOpenBrowseFiles: () => void
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  recentSaves,
  completedSaves,
  activePuzzle,
  theme,
  onToggleTheme,
  onResumePuzzle,
  onReplayPuzzle,
  onDeleteSave,
  onSelectImage,
  onOpenBrowseFiles,
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [inspectImage, setInspectImage] = useState<PuzzleSave | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }

  const handleDragLeave = () => {
    setIsDraggingOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)

    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const title = file.name.replace(/\.[^/.]+$/, '')
          onSelectImage(event.target.result as string, title)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) return `${hrs}h ${mins}m`
    return `${mins}m ${secs}s`
  }

  // Filtered lists based on search and category
  const q = searchQuery.toLowerCase().trim()

  const filteredRecentSaves = recentSaves.filter((s) => {
    if (categoryFilter !== 'all' && categoryFilter !== 'in-progress') return false
    if (!q) return true
    return s.title.toLowerCase().includes(q)
  })

  const filteredCompletedSaves = completedSaves.filter((s) => {
    if (categoryFilter !== 'all' && categoryFilter !== 'completed') return false
    if (!q) return true
    return s.title.toLowerCase().includes(q)
  })

  const filteredSamples = SAMPLE_PUZZLES.filter((s) => {
    if (categoryFilter !== 'all' && categoryFilter.toLowerCase() !== s.category.toLowerCase()) return false
    if (!q) return true
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  })

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl bg-background text-on-background">
      <div className="max-w-6xl mx-auto space-y-lg">
        {/* Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex flex-col gap-xs">
            <h1 className="font-display-lg text-display-lg text-primary font-bold">Library</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Create custom jigsaw puzzles from your images and manage your collection.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative min-w-[280px] md:min-w-[340px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search puzzles & categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container pl-10 pr-9 py-2 rounded-2xl border border-outline-variant/40 dark:border-transparent text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Category Pills Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold select-none">
          {[
            'all',
            'in-progress',
            'completed',
            ...Array.from(new Set(SAMPLE_PUZZLES.map((s) => s.category))),
          ].map((cat) => {
            const isSelected = categoryFilter.toLowerCase() === cat.toLowerCase()
            const sampleCount =
              cat === 'all'
                ? SAMPLE_PUZZLES.length
                : cat === 'in-progress'
                ? recentSaves.length
                : cat === 'completed'
                ? completedSaves.length
                : SAMPLE_PUZZLES.filter((s) => s.category.toLowerCase() === cat.toLowerCase()).length

            const label =
              cat === 'all'
                ? `All (${SAMPLE_PUZZLES.length})`
                : cat === 'in-progress'
                ? `In Progress (${recentSaves.length})`
                : cat === 'completed'
                ? `Completed (${completedSaves.length})`
                : `${cat} (${sampleCount})`
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-xs font-bold ring-1 ring-primary/30'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          {/* Drag and Drop Hero (Spans 8 cols) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onOpenBrowseFiles}
            className={`col-span-1 md:col-span-8 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-xl min-h-[280px] cursor-pointer group shadow-sm ${
              isDraggingOver
                ? 'border-primary bg-primary-fixed/30 scale-[1.01]'
                : 'border-outline-variant dark:border-white/10 bg-surface-container hover:border-primary hover:bg-surface-container-high'
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform shadow-sm">
              <span className="material-symbols-outlined text-[32px]">upload_file</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mb-xs font-semibold">
              Drag & Drop Your Image Here
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-sm mb-md">
              Turn any high-resolution photo or artwork into an interactive jigsaw puzzle.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onOpenBrowseFiles()
              }}
              className="bg-secondary text-on-secondary font-label-md text-label-md px-lg py-sm rounded-lg hover:bg-secondary/90 transition-all shadow-sm active:scale-95"
            >
              Browse Local Files
            </button>
          </div>

          {/* Quick Stats & Active Status (Spans 4 cols) */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-lg">
            {activePuzzle ? (
              <div className="bg-primary text-on-primary dark:bg-[#1a2e24] dark:border dark:border-emerald-500/20 rounded-xl p-md shadow-md flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-label-sm text-label-sm text-primary-fixed-dim uppercase tracking-wider mb-xs">
                      Current Focus
                    </div>
                    <h4 className="font-headline-md text-headline-md truncate max-w-[200px]">
                      {activePuzzle.title}
                    </h4>
                  </div>
                  <span className="material-symbols-outlined text-primary-fixed-dim">extension</span>
                </div>
                <div className="mt-md">
                  <div className="flex justify-between font-label-sm text-label-sm mb-xs">
                    <span>
                      {Math.round((activePuzzle.placedPieces / activePuzzle.totalPieces) * 100)}% Complete
                    </span>
                    <span>{activePuzzle.totalPieces} Pieces</span>
                  </div>
                  <div className="w-full bg-primary-container rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-tertiary-fixed h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round(
                          (activePuzzle.placedPieces / activePuzzle.totalPieces) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => onResumePuzzle(activePuzzle)}
                    className="mt-md w-full bg-surface text-primary font-label-md text-label-md py-sm rounded-lg hover:bg-surface-bright transition-all shadow-sm font-semibold active:scale-98"
                  >
                    Resume Puzzle
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container rounded-xl p-md shadow-sm border border-outline-variant/20 dark:border-transparent flex flex-col justify-between flex-1">
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
                    Ready to Play
                  </div>
                  <h4 className="font-headline-md text-headline-md text-primary font-semibold">
                    Start a New Journey
                  </h4>
                  <p className="font-body-md text-sm text-on-surface-variant mt-sm">
                    Select an image or pick a curated masterpiece below.
                  </p>
                </div>
              </div>
            )}

            {/* Completed Count Widget */}
            <div className="bg-surface-container rounded-xl p-md flex items-center gap-md border border-outline-variant/20 dark:border-transparent shadow-sm">
              <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">emoji_events</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-primary font-bold">
                  {completedSaves.length}
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">
                  Puzzles Completed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent In-Progress Saves */}
        {filteredRecentSaves.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">In-Progress Saves</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
              {filteredRecentSaves.map((save) => {
                const progressPct = Math.round((save.placedPieces / save.totalPieces) * 100)
                return (
                  <div
                    key={save.id}
                    onClick={() => onResumePuzzle(save)}
                    className="bg-surface-container rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer border border-outline-variant/20 dark:border-transparent flex flex-col"
                  >
                    <div className="relative h-40 overflow-hidden bg-surface-variant">
                      <img
                        alt={save.title}
                        src={save.thumbnailUrl || save.imageSrc}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-sm right-sm bg-tertiary text-on-tertiary font-label-sm text-label-sm px-sm py-xs rounded-full shadow-sm backdrop-blur-sm bg-opacity-90">
                        In Progress
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteSave(save.id)
                        }}
                        className="absolute top-sm left-sm w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all"
                        title="Delete Save"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                    <div className="p-md flex flex-col flex-1">
                      <h4 className="font-body-lg text-body-lg text-on-surface font-semibold mb-xs truncate">
                        {save.title}
                      </h4>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mb-md">
                        {save.totalPieces} Pieces
                      </div>
                      <div className="mt-auto">
                        <div className="flex justify-between font-label-sm text-label-sm mb-xs text-on-surface">
                          <span>{progressPct}%</span>
                          <span className="text-on-surface-variant">{formatTime(save.elapsedTime)}</span>
                        </div>
                        <div className="w-full bg-surface-variant rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1.5 rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Curated Starter Collection */}
        {filteredSamples.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Curated Masterpieces</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
              {filteredSamples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => onSelectImage(sample.imageSrc, sample.title, sample.pieceCount)}
                  className="bg-surface-container rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer border border-outline-variant/20 dark:border-transparent flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-surface-variant">
                    <img
                      alt={sample.title}
                      src={sample.imageSrc}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Difficulty Badge */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md backdrop-blur-md ${
                          sample.pieceCount <= 50
                            ? 'bg-emerald-600/90 text-white dark:bg-emerald-500/30 dark:text-emerald-300'
                            : sample.pieceCount <= 150
                            ? 'bg-sky-600/90 text-white dark:bg-sky-500/30 dark:text-sky-300'
                            : sample.pieceCount <= 250
                            ? 'bg-amber-600/90 text-white dark:bg-amber-500/30 dark:text-amber-300'
                            : 'bg-rose-600/90 text-white dark:bg-rose-500/30 dark:text-rose-300'
                        }`}
                      >
                        {sample.pieceCount <= 50
                          ? 'Easy'
                          : sample.pieceCount <= 150
                          ? 'Medium'
                          : sample.pieceCount <= 250
                          ? 'Hard'
                          : 'Master'}
                      </span>
                    </div>
                    {/* Category Tag */}
                    <div className="absolute top-2.5 right-2.5 bg-black/65 backdrop-blur-md text-white font-label-sm text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
                      {sample.category}
                    </div>
                  </div>
                  <div className="p-md flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="font-body-lg text-body-lg text-on-surface font-semibold mb-xs truncate">
                        {sample.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant line-clamp-2 mb-sm">
                        {sample.description}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant/20 dark:border-transparent">
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                        {sample.pieceCount} Pieces
                      </span>
                      <span className="font-label-sm text-label-sm text-primary font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        <span>Play</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Search & Category No Results Fallback */}
        {filteredRecentSaves.length === 0 && filteredSamples.length === 0 && filteredCompletedSaves.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-surface-container rounded-2xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">
              search_off
            </span>
            <h3 className="font-headline-md text-lg font-bold text-primary mb-1">
              No matching puzzles found
            </h3>
            <p className="text-xs text-on-surface-variant max-w-sm mb-4">
              Try adjusting your search query or switching the category filter.
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('all')
              }}
              className="px-4 py-1.5 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary-container transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Completed Gallery */}
        {filteredCompletedSaves.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">Completed Gallery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
              {completedSaves.map((completed) => (
                <div
                  key={completed.id}
                  onClick={() => setInspectImage(completed)}
                  className="aspect-square bg-surface-variant rounded-lg overflow-hidden relative group cursor-pointer border border-outline-variant/20 dark:border-transparent shadow-sm"
                >
                  <img
                    alt={completed.title}
                    src={completed.thumbnailUrl || completed.imageSrc}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-primary/40 transition-opacity flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-sm text-center text-white">
                    <span className="material-symbols-outlined text-3xl mb-xs">zoom_in</span>
                    <div className="font-semibold text-sm line-clamp-1">{completed.title}</div>
                    <div className="text-xs opacity-90">{formatTime(completed.elapsedTime)}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="h-16" />
      </div>

      {/* Inspect Modal */}
      {inspectImage && (
        <div
          onClick={() => setInspectImage(null)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-outline-variant/30 dark:border-transparent animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="relative aspect-video w-full bg-black">
              <img
                src={inspectImage.imageSrc}
                alt={inspectImage.title}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-lg flex items-center justify-between">
              <div>
                <h3 className="font-headline-md text-headline-md text-primary font-bold">
                  {inspectImage.title}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Solved {inspectImage.totalPieces} pieces in {formatTime(inspectImage.elapsedTime)} •{' '}
                  {inspectImage.completedAt
                    ? new Date(inspectImage.completedAt).toLocaleDateString()
                    : 'Completed'}
                </p>
              </div>
              <div className="flex items-center gap-sm">
                <button
                  onClick={() => {
                    const toReplay = inspectImage
                    setInspectImage(null)
                    onReplayPuzzle(toReplay)
                  }}
                  className="px-md py-sm bg-secondary text-on-secondary rounded-lg font-semibold hover:bg-secondary/90 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">replay</span>
                  <span>Replay Puzzle</span>
                </button>
                <button
                  onClick={() => setInspectImage(null)}
                  className="px-md py-sm bg-surface-variant text-on-surface rounded-lg font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
