import React, { useState } from 'react'
import { DailyStreak, PuzzleSave } from '../types/puzzle'
import {
  CATEGORY_FILTERS,
  SAMPLE_PUZZLES,
  SamplePuzzle,
  getDailyPuzzleForDate,
} from '../assets/samplePuzzles'

interface LibraryViewProps {
  recentSaves: PuzzleSave[]
  completedSaves: PuzzleSave[]
  activePuzzle: PuzzleSave | null
  dailyStreak: DailyStreak
  theme?: string
  onToggleTheme?: () => void
  onResumePuzzle: (save: PuzzleSave) => void
  onReplayPuzzle: (save: PuzzleSave) => void
  onDeleteSave: (id: string) => void
  onSelectImage: (imageSrc: string, title?: string, defaultPieces?: number, isDaily?: boolean, dailyDate?: string) => void
  onOpenBrowseFiles: () => void
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  recentSaves,
  completedSaves,
  activePuzzle,
  dailyStreak,
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
  const [showCalendarModal, setShowCalendarModal] = useState<boolean>(false)
  const [calendarMonthOffset, setCalendarMonthOffset] = useState<number>(0)

  // Today's Daily Challenge
  const todayInfo = getDailyPuzzleForDate(new Date())
  const isTodayCompleted = dailyStreak.completedDates.includes(todayInfo.dateStr)

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
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'masterpieces' && s.category !== 'Fine Art') return false
      if (categoryFilter === 'nature' && s.category !== 'Nature & Landscapes' && s.category !== 'Wildlife & Animals') return false
      if (categoryFilter === 'cozy' && s.category !== 'World Architecture') return false
      if (categoryFilter === 'abstract' && s.category !== 'Space & Cosmic') return false
      if (!['masterpieces', 'nature', 'cozy', 'abstract'].includes(categoryFilter) && categoryFilter.toLowerCase() !== s.category.toLowerCase()) return false
    }
    if (!q) return true
    return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
  })

  // Calendar calculations
  const now = new Date()
  const displayDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1)
  const currentYear = displayDate.getFullYear()
  const currentMonth = displayDate.getMonth()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
  const monthName = displayDate.toLocaleString('default', { month: 'long' })

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl bg-background text-on-background">
      <div className="max-w-6xl mx-auto space-y-lg">
        {/* Header & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
          <div className="flex flex-col gap-xs">
            <h1 className="font-display-lg text-display-lg text-primary font-bold">Library</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Explore curated art packs, daily challenges, and custom jigsaw puzzles.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="relative min-w-[280px] md:min-w-[340px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search puzzles & collections..."
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

        {/* Featured Daily Challenge Banner */}
        <section className="bg-gradient-to-r from-primary/15 via-surface-container to-secondary/15 rounded-2xl p-lg border border-primary/25 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-lg relative z-10">
            {/* Left: Thumbnail & Badges */}
            <div className="flex items-center gap-md">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md border-2 border-primary/30 flex-shrink-0 bg-surface-variant group">
                <img
                  src={todayInfo.puzzle.imageSrc}
                  alt={todayInfo.puzzle.title}
                  onError={(e) => {
                    e.currentTarget.src = './art/art4.jpg'
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">star</span>
                  <span>DAILY</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                    {todayInfo.formattedDate}
                  </span>
                  {isTodayCompleted && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">check_circle</span>
                      Completed
                    </span>
                  )}
                </div>

                <h3 className="font-headline-md text-lg sm:text-xl font-bold text-on-surface truncate max-w-md">
                  {todayInfo.puzzle.title.replace(' (Daily Challenge)', '')}
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5 max-w-lg line-clamp-1">
                  {todayInfo.puzzle.description}
                </p>

                {/* Streak Counters */}
                <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-on-surface-variant">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    <span className="material-symbols-outlined text-base">local_fire_department</span>
                    {dailyStreak.currentStreak} Day Streak
                  </span>
                  <span>•</span>
                  <span>Best: {dailyStreak.longestStreak} Days</span>
                  <span>•</span>
                  <span>75 Pieces</span>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 self-end md:self-center">
              <button
                onClick={() => setShowCalendarModal(true)}
                className="px-md py-2 bg-surface hover:bg-surface-variant text-on-surface rounded-xl font-semibold text-xs border border-outline-variant/40 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="View Calendar & Past Daily Puzzles"
              >
                <span className="material-symbols-outlined text-base">calendar_month</span>
                <span>Past Challenges</span>
              </button>

              <button
                onClick={() =>
                  onSelectImage(
                    todayInfo.puzzle.imageSrc,
                    todayInfo.puzzle.title,
                    todayInfo.puzzle.pieceCount,
                    true,
                    todayInfo.dateStr
                  )
                }
                className="px-lg py-2 bg-primary text-on-primary hover:bg-primary-container font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">
                  {isTodayCompleted ? 'replay' : 'play_arrow'}
                </span>
                <span>{isTodayCompleted ? 'Replay Today' : 'Play Daily Puzzle'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Category Pills Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold select-none">
          {CATEGORY_FILTERS.map((cat) => {
            const isSelected = categoryFilter === cat.key
            return (
              <button
                key={cat.key}
                onClick={() => setCategoryFilter(cat.key)}
                className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-on-primary shadow-xs font-bold ring-1 ring-primary/30'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}

          {recentSaves.length > 0 && (
            <button
              onClick={() => setCategoryFilter('in-progress')}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'in-progress'
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-base">pending</span>
              <span>In Progress ({recentSaves.length})</span>
            </button>
          )}

          {completedSaves.length > 0 && (
            <button
              onClick={() => setCategoryFilter('completed')}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                categoryFilter === 'completed'
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-base">emoji_events</span>
              <span>Completed ({completedSaves.length})</span>
            </button>
          )}
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          {/* Drag and Drop Hero (Spans 8 cols) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onOpenBrowseFiles}
            className={`col-span-1 md:col-span-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-xl min-h-[260px] cursor-pointer group shadow-sm ${
              isDraggingOver
                ? 'border-primary bg-primary-fixed/30 scale-[1.01]'
                : 'border-outline-variant dark:border-white/10 bg-surface-container hover:border-primary hover:bg-surface-container-high'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-md group-hover:scale-110 transition-transform shadow-sm">
              <span className="material-symbols-outlined text-[28px]">upload_file</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-primary mb-xs font-semibold">
              Create Puzzle from Your Image
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-sm mb-md">
              Drag and drop any picture, wallpaper, or photo to generate a custom jigsaw.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenBrowseFiles()
                }}
                className="bg-secondary text-on-secondary font-label-md text-label-md px-md py-sm rounded-xl hover:bg-secondary/90 transition-all shadow-sm active:scale-95 cursor-pointer font-semibold flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">folder_open</span>
                <span>Browse Local Photos</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const randSeed = Math.floor(Math.random() * 100000)
                  const randUrl = `https://picsum.photos/seed/${randSeed}/1200/800`
                  onSelectImage(randUrl, `Online Discovery #${randSeed}`, 100)
                }}
                className="bg-surface hover:bg-surface-variant text-on-surface border border-outline-variant/40 font-label-md text-label-md px-md py-sm rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer font-semibold flex items-center gap-1.5"
                title="Fetch a random high-resolution online photograph"
              >
                <span className="material-symbols-outlined text-base text-primary">shuffle</span>
                <span>Random Online Photo</span>
              </button>
            </div>
          </div>

          {/* Quick Stats & Active Status (Spans 4 cols) */}
          <div className="col-span-1 md:col-span-4 flex flex-col gap-md">
            {activePuzzle ? (
              <div className="bg-primary text-on-primary dark:bg-[#1a2e24] dark:border dark:border-emerald-500/20 rounded-2xl p-md shadow-md flex-1 flex flex-col justify-between">
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
                    className="mt-md w-full bg-surface text-primary font-label-md text-label-md py-sm rounded-xl hover:bg-surface-bright transition-all shadow-sm font-semibold active:scale-98 cursor-pointer"
                  >
                    Resume Puzzle
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container rounded-2xl p-md shadow-sm border border-outline-variant/20 dark:border-transparent flex flex-col justify-between flex-1">
                <div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
                    Mastery & Collection
                  </div>
                  <h4 className="font-headline-md text-headline-md text-primary font-semibold">
                    Master Puzzler
                  </h4>
                  <p className="font-body-md text-xs text-on-surface-variant mt-sm">
                    Complete daily challenges and curated art packs to expand your puzzle streak.
                  </p>
                </div>
              </div>
            )}

            {/* Completed Count Widget */}
            <div className="bg-surface-container rounded-2xl p-md flex items-center gap-md border border-outline-variant/20 dark:border-transparent shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-2xl">emoji_events</span>
              </div>
              <div>
                <div className="font-headline-md text-headline-md text-primary font-bold">
                  {completedSaves.length} Puzzles Solved
                </div>
                <div className="font-label-sm text-xs text-on-surface-variant">
                  {dailyStreak.completedDates.length} Daily Challenges Mastered
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
                    className="bg-surface-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer border border-outline-variant/20 dark:border-transparent flex flex-col"
                  >
                    <div className="relative h-40 overflow-hidden bg-surface-variant">
                      <img
                        alt={save.title}
                        src={save.thumbnailUrl || save.imageSrc}
                        onError={(e) => {
                          e.currentTarget.src = './art/art4.jpg'
                        }}
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
                        className="absolute top-sm left-sm w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-error transition-all cursor-pointer"
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

        {/* Curated Collection Grid */}
        {filteredSamples.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
                {CATEGORY_FILTERS.find((c) => c.key === categoryFilter)?.label || 'Curated Masterpieces'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
              {filteredSamples.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => onSelectImage(sample.imageSrc, sample.title, sample.pieceCount)}
                  className="bg-surface-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer border border-outline-variant/20 dark:border-transparent flex flex-col"
                >
                  <div className="relative h-48 overflow-hidden bg-surface-variant">
                    <img
                      alt={sample.title}
                      src={sample.imageSrc}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = './art/art4.jpg'
                      }}
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
                  className="aspect-square bg-surface-variant rounded-2xl overflow-hidden relative group cursor-pointer border border-outline-variant/20 dark:border-transparent shadow-sm"
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

      {/* Calendar Challenge Picker Modal */}
      {showCalendarModal && (
        <div
          onClick={() => setShowCalendarModal(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-md select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container rounded-2xl max-w-lg w-full p-lg border border-outline-variant/30 dark:border-transparent shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-md border-b border-outline-variant/20 pb-sm">
              <div>
                <h3 className="font-headline-md text-lg font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined">calendar_month</span>
                  Daily Challenge Calendar
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {monthName} {currentYear} • {dailyStreak.completedDates.length} Total Completed
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCalendarMonthOffset((prev) => prev - 1)}
                  className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-on-surface cursor-pointer"
                  title="Previous Month"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <button
                  onClick={() => setCalendarMonthOffset(0)}
                  className="px-2 py-1 rounded-lg hover:bg-surface-variant text-[11px] font-semibold text-on-surface cursor-pointer"
                  title="Today"
                >
                  Today
                </button>
                <button
                  onClick={() => setCalendarMonthOffset((prev) => Math.min(0, prev + 1))}
                  disabled={calendarMonthOffset >= 0}
                  className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-on-surface cursor-pointer disabled:opacity-30"
                  title="Next Month"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-surface-variant flex items-center justify-center text-on-surface-variant ml-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-on-surface-variant mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1
                const cellDate = new Date(currentYear, currentMonth, dayNum)
                const y = cellDate.getFullYear()
                const m = String(cellDate.getMonth() + 1).padStart(2, '0')
                const d = String(dayNum).padStart(2, '0')
                const dateStr = `${y}-${m}-${d}`

                const isFuture = cellDate > new Date()
                const isToday = dateStr === todayInfo.dateStr
                const isCompleted = dailyStreak.completedDates.includes(dateStr)
                const dayPuzzle = getDailyPuzzleForDate(cellDate)

                return (
                  <button
                    key={dateStr}
                    disabled={isFuture}
                    onClick={() => {
                      setShowCalendarModal(false)
                      onSelectImage(
                        dayPuzzle.puzzle.imageSrc,
                        dayPuzzle.puzzle.title,
                        dayPuzzle.puzzle.pieceCount,
                        true,
                        dateStr
                      )
                    }}
                    className={`aspect-square rounded-xl p-1 flex flex-col items-center justify-between border transition-all text-xs font-semibold relative ${
                      isFuture
                        ? 'opacity-30 cursor-not-allowed border-transparent bg-surface-container-low'
                        : isToday
                        ? 'border-primary ring-2 ring-primary/40 bg-primary/10 hover:bg-primary/20 cursor-pointer text-primary font-bold'
                        : isCompleted
                        ? 'border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer'
                        : 'border-outline-variant/30 hover:border-primary hover:bg-surface-variant cursor-pointer text-on-surface'
                    }`}
                    title={
                      isFuture
                        ? 'Future puzzle'
                        : `${dayPuzzle.formattedDate}: ${dayPuzzle.puzzle.title}`
                    }
                  >
                    <span className="text-[11px]">{dayNum}</span>
                    {isCompleted ? (
                      <span className="material-symbols-outlined text-xs text-emerald-500">
                        check_circle
                      </span>
                    ) : isToday ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mb-0.5" />
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Inspect Completed Image Modal */}
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
                  className="px-md py-sm bg-secondary text-on-secondary rounded-xl font-semibold hover:bg-secondary/90 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">replay</span>
                  <span>Replay Puzzle</span>
                </button>
                <button
                  onClick={() => setInspectImage(null)}
                  className="px-md py-sm bg-surface-variant text-on-surface rounded-xl font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
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
