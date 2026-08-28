import React, { useState } from 'react'
import { PuzzleSave } from '../types/puzzle'
import { SAMPLE_PUZZLES, SamplePuzzle } from '../assets/samplePuzzles'

interface LibraryViewProps {
  recentSaves: PuzzleSave[]
  completedSaves: PuzzleSave[]
  activePuzzle: PuzzleSave | null
  onResumePuzzle: (save: PuzzleSave) => void
  onDeleteSave: (id: string) => void
  onSelectImage: (imageSrc: string, title?: string, defaultPieces?: number) => void
  onOpenBrowseFiles: () => void
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  recentSaves,
  completedSaves,
  activePuzzle,
  onResumePuzzle,
  onDeleteSave,
  onSelectImage,
  onOpenBrowseFiles,
}) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [inspectImage, setInspectImage] = useState<PuzzleSave | null>(null)

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

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl bg-background text-on-background">
      <div className="max-w-6xl mx-auto space-y-xl">
        {/* Header */}
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-lg text-display-lg text-primary">Library</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Create custom jigsaw puzzles from your images and manage your collection.
          </p>
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
                : 'border-outline-variant bg-surface-container hover:border-primary hover:bg-surface-container-high'
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
              <div className="bg-primary text-on-primary rounded-xl p-md shadow-md flex-1 flex flex-col justify-between">
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
              <div className="bg-surface-container rounded-xl p-md shadow-sm border border-outline-variant/20 flex flex-col justify-between flex-1">
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
            <div className="bg-surface-container rounded-xl p-md flex items-center gap-md border border-outline-variant/20 shadow-sm">
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
        {recentSaves.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary">In-Progress Saves</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
              {recentSaves.map((save) => {
                const progressPct = Math.round((save.placedPieces / save.totalPieces) * 100)
                return (
                  <div
                    key={save.id}
                    onClick={() => onResumePuzzle(save)}
                    className="bg-surface-container rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer border border-outline-variant/20 flex flex-col"
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
                        {save.totalPieces} Pieces • {save.cutStyle}
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
        <section>
          <div className="flex justify-between items-end mb-md">
            <h2 className="font-headline-lg text-headline-lg text-primary">Curated Masterpieces</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
            {SAMPLE_PUZZLES.map((sample) => (
              <div
                key={sample.id}
                onClick={() => onSelectImage(sample.imageSrc, sample.title, sample.pieceCount)}
                className="bg-surface-container rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group cursor-pointer border border-outline-variant/20 flex flex-col"
              >
                <div className="relative h-44 overflow-hidden bg-surface-variant">
                  <img
                    alt={sample.title}
                    src={sample.imageSrc}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-sm right-sm bg-primary-container text-on-primary-container font-label-sm text-label-sm px-sm py-xs rounded-full shadow-sm">
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
                  <div className="flex items-center justify-between mt-sm pt-sm border-t border-outline-variant/20">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Default: {sample.pieceCount} pcs
                    </span>
                    <button className="text-primary font-semibold text-xs group-hover:underline flex items-center gap-0.5">
                      Play Now <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Completed Gallery */}
        {completedSaves.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-md">
              <h2 className="font-headline-lg text-headline-lg text-primary">Completed Gallery</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-sm">
              {completedSaves.map((completed) => (
                <div
                  key={completed.id}
                  onClick={() => setInspectImage(completed)}
                  className="aspect-square bg-surface-variant rounded-lg overflow-hidden relative group cursor-pointer border border-outline-variant/20 shadow-sm"
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
            className="bg-surface-container rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200"
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
              <button
                onClick={() => setInspectImage(null)}
                className="px-md py-sm bg-primary text-on-primary rounded-lg font-semibold hover:bg-primary-container transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
