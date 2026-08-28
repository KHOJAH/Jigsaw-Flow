import React, { useState, useRef, useEffect } from 'react'
import { PuzzleCutStyle } from '../types/puzzle'

interface ImportModalProps {
  isOpen: boolean
  imageSrc: string
  initialTitle?: string
  initialPieces?: number
  onClose: () => void
  onStartPuzzle: (config: {
    title: string
    imageSrc: string
    croppedImageSrc: string
    pieceCount: number
    enableRotation: boolean
    cutStyle: PuzzleCutStyle
    aspectRatio: string
  }) => void
  onReplaceImage: () => void
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  imageSrc,
  initialTitle = 'Custom Jigsaw',
  initialPieces = 50,
  onClose,
  onStartPuzzle,
  onReplaceImage,
}) => {
  const [title, setTitle] = useState(initialTitle)
  const [pieceCount, setPieceCount] = useState(initialPieces)
  const [enableRotation, setEnableRotation] = useState(false)
  const [cutStyle, setCutStyle] = useState<PuzzleCutStyle>('classic')
  const [aspectRatio, setAspectRatio] = useState<'free' | '16:9' | '4:3' | '1:1'>('16:9')

  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    setTitle(initialTitle)
    setPieceCount(initialPieces)
  }, [initialTitle, initialPieces])

  if (!isOpen) return null

  // Calculate estimated grid rows and columns for cutline preview
  const aspectMultiplier =
    aspectRatio === '16:9' ? 16 / 9 : aspectRatio === '4:3' ? 4 / 3 : aspectRatio === '1:1' ? 1 : 1.5
  const rawCols = Math.sqrt(pieceCount * aspectMultiplier)
  const cols = Math.max(2, Math.round(rawCols))
  const rows = Math.max(2, Math.round(pieceCount / cols))
  const actualPieces = rows * cols

  const handleStart = () => {
    onStartPuzzle({
      title: title.trim() || 'Custom Jigsaw',
      imageSrc,
      croppedImageSrc: imageSrc,
      pieceCount: actualPieces,
      enableRotation,
      cutStyle,
      aspectRatio,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md overflow-hidden">
      <div className="bg-surface-container rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-outline-variant/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-lg py-md border-b border-outline-variant/20 bg-surface-container-high">
          <div className="flex items-center gap-sm">
            <span className="material-symbols-outlined text-primary text-2xl">crop</span>
            <h2 className="font-headline-lg text-xl text-primary font-bold">
              Import & Setup Puzzle
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-lg grid grid-cols-1 lg:grid-cols-12 gap-lg">
          {/* Left Column: Image Preview & Aspect Ratio */}
          <div className="lg:col-span-7 flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-label-md text-on-surface font-semibold">
                Image Slice Preview
              </span>
              <button
                onClick={onReplaceImage}
                className="flex items-center gap-xs text-primary hover:text-primary-container font-semibold text-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">upload</span>
                <span>Change Image</span>
              </button>
            </div>

            {/* Canvas Preview Area with Cutting Mat Background */}
            <div className="flex-1 bg-surface-variant/40 rounded-xl border border-outline-variant/30 relative overflow-hidden flex items-center justify-center min-h-[340px] p-md">
              {/* Cutting Mat Decorative Grid */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundSize: '24px 24px',
                  backgroundImage:
                    'linear-gradient(to right, #1d4533 1px, transparent 1px), linear-gradient(to bottom, #1d4533 1px, transparent 1px)',
                }}
              />

              {/* Main Image with Interactive Grid Cutlines Overlay */}
              <div
                className="relative max-w-full max-h-[340px] rounded-lg overflow-hidden shadow-lg border-2 border-primary/40 bg-surface"
                style={{
                  aspectRatio:
                    aspectRatio === '16:9'
                      ? '16/9'
                      : aspectRatio === '4:3'
                      ? '4/3'
                      : aspectRatio === '1:1'
                      ? '1/1'
                      : 'auto',
                }}
              >
                <img
                  ref={imgRef}
                  alt="Puzzle Preview"
                  src={imageSrc}
                  className="w-full h-full object-cover select-none"
                />

                {/* Dynamic SVG Slice Grid Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
                  {/* Vertical Cutlines */}
                  {Array.from({ length: cols - 1 }).map((_, i) => {
                    const xPercent = ((i + 1) / cols) * 100
                    return (
                      <line
                        key={`v-${i}`}
                        x1={`${xPercent}%`}
                        y1="0"
                        x2={`${xPercent}%`}
                        y2="100%"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                    )
                  })}
                  {/* Horizontal Cutlines */}
                  {Array.from({ length: rows - 1 }).map((_, i) => {
                    const yPercent = ((i + 1) / rows) * 100
                    return (
                      <line
                        key={`h-${i}`}
                        x1="0"
                        y1={`${yPercent}%`}
                        x2="100%"
                        y2={`${yPercent}%`}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeDasharray="4 2"
                      />
                    )
                  })}
                </svg>

                {/* Corner Accents */}
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-primary" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-primary" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-primary" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-primary" />
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="flex items-center justify-center gap-xs">
              {(['16:9', '4:3', '1:1', 'free'] as const).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-md py-xs rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-primary-container text-on-primary-container shadow-sm scale-105'
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Difficulty & Game Configuration */}
          <div className="lg:col-span-5 flex flex-col gap-md justify-between">
            <div className="space-y-md">
              {/* Title Input */}
              <div>
                <label className="font-label-md text-label-md text-on-surface block mb-xs">
                  Puzzle Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a puzzle title..."
                  className="w-full px-md py-sm rounded-lg bg-surface border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary font-medium text-sm"
                />
              </div>

              {/* Piece Count Slider with x1, x2, x3 Difficulty Multipliers */}
              <div className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/30">
                <div className="flex justify-between items-center mb-xs">
                  <div>
                    <label className="font-label-md text-label-md text-on-surface font-semibold block">
                      Difficulty & Pieces
                    </label>
                    <span className="text-[11px] text-on-surface-variant">
                      {actualPieces < 35
                        ? 'Relaxed (x1)'
                        : actualPieces < 75
                        ? 'Easy (x2)'
                        : actualPieces < 180
                        ? 'Medium (x3)'
                        : actualPieces < 380
                        ? 'Hard (x4)'
                        : 'Master (x5)'}
                    </span>
                  </div>
                  <span className="font-headline-md text-xl text-primary font-bold">
                    {actualPieces}{' '}
                    <span className="text-xs text-on-surface-variant font-normal">
                      ({rows}×{cols} grid)
                    </span>
                  </span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="500"
                  step="10"
                  value={pieceCount}
                  onChange={(e) => setPieceCount(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer accent-primary"
                />
                {/* Preset x1, x2, x3 Multiplier Pills */}
                <div className="grid grid-cols-5 gap-1 mt-sm">
                  {[
                    { count: 24, mult: 'x1' },
                    { count: 48, mult: 'x2' },
                    { count: 96, mult: 'x3' },
                    { count: 250, mult: 'x4' },
                    { count: 500, mult: 'x5' },
                  ].map(({ count, mult }) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setPieceCount(count)}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        Math.abs(actualPieces - count) <= (count < 100 ? 12 : 50)
                          ? 'bg-primary text-on-primary shadow-sm scale-105'
                          : 'bg-surface-variant text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      <span className="text-xs font-extrabold">{mult}</span>
                      <span className="text-[10px] opacity-80">{count}p</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Piece Rotation Toggle */}
              <div className="flex items-center justify-between p-md bg-surface-container-lowest rounded-xl border border-outline-variant/30">
                <div>
                  <div className="font-label-md text-label-md text-on-surface font-semibold">
                    Piece Rotation
                  </div>
                  <div className="text-xs text-on-surface-variant">
                    Rotate pieces in 90° increments (Harder)
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableRotation}
                    onChange={(e) => setEnableRotation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container" />
                </label>
              </div>

              {/* Cut Pattern Style */}
              <div>
                <div className="font-label-md text-label-md text-on-surface mb-xs font-semibold">
                  Cut Pattern Style
                </div>
                <div className="grid grid-cols-2 gap-sm">
                  <div
                    onClick={() => setCutStyle('classic')}
                    className={`rounded-xl p-sm cursor-pointer transition-all border-2 text-center ${
                      cutStyle === 'classic'
                        ? 'border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-primary text-2xl">extension</span>
                    <div className="font-label-md text-xs text-on-surface font-semibold mt-0.5">
                      Classic Bézier
                    </div>
                    <div className="text-[10px] text-on-surface-variant">
                      Traditional rounded tabs
                    </div>
                  </div>

                  <div
                    onClick={() => setCutStyle('geometric')}
                    className={`rounded-xl p-sm cursor-pointer transition-all border-2 text-center ${
                      cutStyle === 'geometric'
                        ? 'border-primary bg-primary-fixed/20 shadow-sm'
                        : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-on-surface-variant text-2xl">
                      category
                    </span>
                    <div className="font-label-md text-xs text-on-surface font-semibold mt-0.5">
                      Geometric
                    </div>
                    <div className="text-[10px] text-on-surface-variant">Modern crisp angles</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Puzzle CTA */}
            <div className="pt-md">
              <button
                onClick={handleStart}
                className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline-md text-base py-md rounded-xl shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-sm font-semibold cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  play_arrow
                </span>
                Generate & Start Puzzle
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
