import React, { useState, useEffect, useRef } from 'react'
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
  initialPieces = 48,
  onClose,
  onStartPuzzle,
  onReplaceImage,
}) => {
  const [title, setTitle] = useState(initialTitle)
  const [pieceCount, setPieceCount] = useState(initialPieces)
  const [enableRotation, setEnableRotation] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<'free' | '16:9' | '4:3' | '1:1'>('16:9')
  const [isProcessing, setIsProcessing] = useState(false)

  // Crop Pan Offset normalized (0.0 to 1.0, default 0.5 center)
  const [cropOffsetX, setCropOffsetX] = useState<number>(0.5)
  const [cropOffsetY, setCropOffsetY] = useState<number>(0.5)

  // Natural Image Dimensions
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number }>({
    w: 1000,
    h: 750,
  })

  const previewContainerRef = useRef<HTMLDivElement | null>(null)
  const isDraggingCropRef = useRef<boolean>(false)
  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number } | null>(null)

  useEffect(() => {
    setTitle(initialTitle)
    setPieceCount(initialPieces)
  }, [initialTitle, initialPieces])

  // Load natural dimensions of source image
  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImgNaturalSize({ w: img.naturalWidth || 1000, h: img.naturalHeight || 750 })
    }
    img.src = imageSrc
  }, [imageSrc])

  // Reset crop position when aspect ratio changes
  const handleSelectAspectRatio = (ratio: 'free' | '16:9' | '4:3' | '1:1') => {
    setAspectRatio(ratio)
    setCropOffsetX(0.5)
    setCropOffsetY(0.5)
  }

  if (!isOpen) return null

  // Calculate estimated grid rows and columns for cutline preview
  const aspectMultiplier =
    aspectRatio === '16:9' ? 16 / 9 : aspectRatio === '4:3' ? 4 / 3 : aspectRatio === '1:1' ? 1 : 1.4
  const rawCols = Math.sqrt(pieceCount * aspectMultiplier)
  const cols = Math.max(2, Math.round(rawCols))
  const rows = Math.max(2, Math.round(pieceCount / cols))
  const actualPieces = rows * cols

  // Determine if image can be panned horizontally or vertically
  const targetRatio =
    aspectRatio === '16:9' ? 16 / 9 : aspectRatio === '4:3' ? 4 / 3 : 1
  const imgRatio = imgNaturalSize.w / imgNaturalSize.h
  const canPanHorizontally = aspectRatio !== 'free' && imgRatio > targetRatio + 0.01
  const canPanVertically = aspectRatio !== 'free' && imgRatio < targetRatio - 0.01

  // Handle Dragging Crop Position
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (aspectRatio === 'free' || (!canPanHorizontally && !canPanVertically)) return
    isDraggingCropRef.current = true
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: cropOffsetX,
      startY: cropOffsetY,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingCropRef.current || !dragStartRef.current || !previewContainerRef.current) return
    const rect = previewContainerRef.current.getBoundingClientRect()
    const dx = e.clientX - dragStartRef.current.clientX
    const dy = e.clientY - dragStartRef.current.clientY

    if (canPanHorizontally) {
      const deltaNormalized = -dx / (rect.width * 0.8)
      const newOffsetX = Math.min(1.0, Math.max(0.0, dragStartRef.current.startX + deltaNormalized))
      setCropOffsetX(newOffsetX)
    }

    if (canPanVertically) {
      const deltaNormalized = -dy / (rect.height * 0.8)
      const newOffsetY = Math.min(1.0, Math.max(0.0, dragStartRef.current.startY + deltaNormalized))
      setCropOffsetY(newOffsetY)
    }
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingCropRef.current) {
      isDraggingCropRef.current = false
      dragStartRef.current = null
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch (_) {}
    }
  }

  // Crop image to selected aspect ratio and crop offset
  const handleStart = async () => {
    setIsProcessing(true)

    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = imageSrc

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image for cropping'))
      })

      const nw = img.naturalWidth || 1000
      const nh = img.naturalHeight || 750

      let cropX = 0
      let cropY = 0
      let cropW = nw
      let cropH = nh

      if (aspectRatio !== 'free') {
        if (imgRatio > targetRatio) {
          // Image is wider: crop horizontal window using cropOffsetX
          cropH = nh
          cropW = Math.round(nh * targetRatio)
          cropX = Math.round((nw - cropW) * cropOffsetX)
          cropY = 0
        } else {
          // Image is taller: crop vertical window using cropOffsetY
          cropW = nw
          cropH = Math.round(nw / targetRatio)
          cropY = Math.round((nh - cropH) * cropOffsetY)
          cropX = 0
        }
      }

      // Render cropped image to high-res canvas
      const maxDim = 2048
      const scale = Math.min(1.0, maxDim / Math.max(cropW, cropH))
      const outW = Math.round(cropW * scale)
      const outH = Math.round(cropH * scale)

      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')

      if (!ctx) throw new Error('Canvas context not available')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH)

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.94)

      onStartPuzzle({
        title: title.trim() || 'Custom Jigsaw',
        imageSrc: croppedDataUrl,
        pieceCount: actualPieces,
        enableRotation,
        cutStyle: 'classic',
        aspectRatio,
      })
    } catch (err) {
      console.error('Error cropping image:', err)
      onStartPuzzle({
        title: title.trim() || 'Custom Jigsaw',
        imageSrc,
        pieceCount: actualPieces,
        enableRotation,
        cutStyle: 'classic',
        aspectRatio,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // CSS Object Position for preview frame
  const objectPositionStyle =
    aspectRatio === 'free'
      ? 'center'
      : `${Math.round(cropOffsetX * 100)}% ${Math.round(cropOffsetY * 100)}%`

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-md overflow-hidden select-none">
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
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-variant text-on-surface-variant transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-lg grid grid-cols-1 lg:grid-cols-12 gap-lg">
          {/* Left Column: Image Preview, Crop Drag, and Aspect Ratio */}
          <div className="lg:col-span-7 flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-1.5">
                <span>Crop & Slice Preview</span>
                {(canPanHorizontally || canPanVertically) && (
                  <span className="text-[11px] text-on-primary-container font-semibold bg-primary-container px-2.5 py-0.5 rounded-full shadow-sm">
                    Drag preview to adjust crop
                  </span>
                )}
              </span>
              <button
                onClick={onReplaceImage}
                className="flex items-center gap-xs text-primary hover:text-primary-container font-semibold text-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">upload</span>
                <span>Change Image</span>
              </button>
            </div>

            {/* Canvas Preview Area with Interactive Crop Dragging */}
            <div className="flex-1 bg-surface-variant/40 rounded-xl border border-outline-variant/30 relative overflow-hidden flex items-center justify-center min-h-[330px] p-md">
              {/* Cutting Mat Decorative Grid */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundSize: '24px 24px',
                  backgroundImage:
                    'linear-gradient(to right, #1d4533 1px, transparent 1px), linear-gradient(to bottom, #1d4533 1px, transparent 1px)',
                }}
              />

              {/* Cropped Preview Frame with Direct Pointer Drag */}
              <div
                ref={previewContainerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`relative max-w-full max-h-[330px] rounded-lg overflow-hidden shadow-xl border-2 border-primary bg-black flex items-center justify-center transition-all touch-none select-none ${
                  canPanHorizontally || canPanVertically
                    ? 'cursor-grab active:cursor-grabbing'
                    : 'cursor-default'
                }`}
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
                title={
                  canPanHorizontally
                    ? 'Drag left/right to move crop area'
                    : canPanVertically
                    ? 'Drag up/down to move crop area'
                    : undefined
                }
              >
                <img
                  alt="Puzzle Preview"
                  src={imageSrc}
                  className={`w-full h-full select-none pointer-events-none ${
                    aspectRatio === 'free' ? 'object-contain max-h-[310px]' : 'object-cover'
                  }`}
                  style={{ objectPosition: objectPositionStyle }}
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
                <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-primary pointer-events-none" />
                <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-primary pointer-events-none" />
                <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-primary pointer-events-none" />
                <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-primary pointer-events-none" />

                {/* Drag Hint Overlay */}
                {(canPanHorizontally || canPanVertically) && (
                  <div className="absolute bottom-2 bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 opacity-80 pointer-events-none">
                    <span className="material-symbols-outlined text-xs">pan_tool</span>
                    <span>
                      {canPanHorizontally ? 'Drag horizontally to move crop' : 'Drag vertically to move crop'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Aspect Ratio Selector & Crop Position Sliders */}
            <div className="flex flex-col gap-sm">
              <div className="flex items-center justify-center gap-xs">
                {(['16:9', '4:3', '1:1', 'free'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => handleSelectAspectRatio(ratio)}
                    className={`px-md py-xs rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-primary text-on-primary shadow-sm scale-105'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                    }`}
                  >
                    {ratio === 'free' ? 'Original' : ratio}
                  </button>
                ))}
              </div>

              {/* Fine-Tuning Crop Position Slider */}
              {canPanHorizontally && (
                <div className="bg-surface-container-lowest p-sm rounded-xl border border-outline-variant/30 flex items-center gap-sm text-xs">
                  <span className="text-on-surface-variant font-semibold whitespace-nowrap">
                    Crop X:
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Left</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={cropOffsetX}
                    onChange={(e) => setCropOffsetX(parseFloat(e.target.value))}
                    className="flex-1 cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] text-on-surface-variant">Right</span>
                  <button
                    onClick={() => setCropOffsetX(0.5)}
                    className="px-2 py-0.5 rounded bg-surface-variant hover:bg-surface-container text-[10px] font-semibold"
                  >
                    Center
                  </button>
                </div>
              )}

              {canPanVertically && (
                <div className="bg-surface-container-lowest p-sm rounded-xl border border-outline-variant/30 flex items-center gap-sm text-xs">
                  <span className="text-on-surface-variant font-semibold whitespace-nowrap">
                    Crop Y:
                  </span>
                  <span className="text-[10px] text-on-surface-variant">Top</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={cropOffsetY}
                    onChange={(e) => setCropOffsetY(parseFloat(e.target.value))}
                    className="flex-1 cursor-pointer accent-primary"
                  />
                  <span className="text-[10px] text-on-surface-variant">Bottom</span>
                  <button
                    onClick={() => setCropOffsetY(0.5)}
                    className="px-2 py-0.5 rounded bg-surface-variant hover:bg-surface-container text-[10px] font-semibold"
                  >
                    Center
                  </button>
                </div>
              )}
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
            </div>

            {/* Start Puzzle CTA */}
            <div className="pt-md">
              <button
                onClick={handleStart}
                disabled={isProcessing}
                className="w-full bg-primary hover:bg-primary-container text-on-primary font-headline-md text-base py-md rounded-xl shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-sm font-semibold cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="material-symbols-outlined text-xl animate-spin">
                      progress_activity
                    </span>
                    Cropping & Slicing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      play_arrow
                    </span>
                    Generate & Start Puzzle
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
