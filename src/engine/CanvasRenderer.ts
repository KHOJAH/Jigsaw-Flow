import {
  PuzzlePiece,
  TableSurface,
  UserSettings,
  ViewportTransform,
} from '../types/puzzle'
import { JigsawGenerator } from './JigsawGenerator'

export interface PieceSprite {
  pieceId: number
  canvas: HTMLCanvasElement
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export class CanvasRenderer {
  private sprites: Map<number, PieceSprite> = new Map()
  private sourceImage: HTMLImageElement | null = null
  private flashClusterId: number | null = null
  private flashEndTime: number = 0

  /**
   * Triggers a brief golden snap glow on a cluster
   */
  public triggerSnapFlash(clusterId: number) {
    this.flashClusterId = clusterId
    this.flashEndTime = performance.now() + 450
  }

  /**
   * Generates offscreen sprite textures for all pieces from source image
   */
  public preparePieceSprites(
    image: HTMLImageElement,
    pieces: PuzzlePiece[],
    boardWidth: number,
    boardHeight: number
  ): void {
    this.sourceImage = image
    this.sprites.clear()

    const scaleX = image.naturalWidth / boardWidth
    const scaleY = image.naturalHeight / boardHeight

    for (const piece of pieces) {
      // Margin on all sides for protruding tabs
      const marginX = Math.ceil(piece.width * 0.45)
      const marginY = Math.ceil(piece.height * 0.45)

      const spriteWidth = Math.ceil(piece.width + marginX * 2)
      const spriteHeight = Math.ceil(piece.height + marginY * 2)

      const offCanvas = document.createElement('canvas')
      offCanvas.width = spriteWidth
      offCanvas.height = spriteHeight
      const ctx = offCanvas.getContext('2d')
      if (!ctx) continue

      ctx.save()
      ctx.translate(marginX, marginY)

      // 1. Clip path to the piece's jigsaw silhouette
      ctx.beginPath()
      JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
      ctx.clip()

      // 2. Draw corresponding segment of source image mapped directly to board dimensions
      ctx.drawImage(
        image,
        -piece.targetX,
        -piece.targetY,
        boardWidth,
        boardHeight
      )

      ctx.restore()

      this.sprites.set(piece.id, {
        pieceId: piece.id,
        canvas: offCanvas,
        offsetX: marginX,
        offsetY: marginY,
        width: spriteWidth,
        height: spriteHeight,
      })
    }
  }

  /**
   * Retrieves the offscreen canvas sprite texture for a specific piece
   */
  public getPieceSprite(pieceId: number): PieceSprite | undefined {
    return this.sprites.get(pieceId)
  }

  /**
   * Renders the complete 5-layer canvas architecture
   */
  public render(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    viewport: ViewportTransform,
    pieces: PuzzlePiece[],
    boardWidth: number,
    boardHeight: number,
    activeClusterId: number | null,
    settings: UserSettings,
    selectedPieceIds: Set<number> = new Set(),
    marqueeBox: { x1: number; y1: number; x2: number; y2: number } | null = null,
    hintPiece: PuzzlePiece | null = null
  ): void {
    // -------------------------------------------------------------
    // LAYER 0: Table Surface Background
    // -------------------------------------------------------------
    this.renderTableSurface(ctx, canvasWidth, canvasHeight, settings.tableSurface)

    ctx.save()
    // Apply Viewport Transformation (Pan & Zoom)
    ctx.translate(viewport.x, viewport.y)
    ctx.scale(viewport.scale, viewport.scale)

    // -------------------------------------------------------------
    // LAYER 0 & 1: Board Mat Frame & Ghost Overlay
    // -------------------------------------------------------------
    this.renderBoardFrame(ctx, boardWidth, boardHeight, settings)

    // -------------------------------------------------------------
    // LAYER 1.5: Smart Hint Target Beacon
    // -------------------------------------------------------------
    if (hintPiece) {
      const now = performance.now()
      const pulse = 0.5 + 0.45 * Math.sin(now / 180)

      ctx.save()
      ctx.translate(hintPiece.targetX, hintPiece.targetY)

      ctx.beginPath()
      JigsawGenerator.buildPiecePath(
        ctx,
        hintPiece.width,
        hintPiece.height,
        hintPiece.jitterProfile
      )
      ctx.fillStyle = `rgba(249, 210, 186, ${0.35 * pulse})`
      ctx.fill()

      ctx.strokeStyle = `rgba(255, 216, 192, ${pulse})`
      ctx.lineWidth = 3.5
      ctx.shadowColor = '#ffd8c0'
      ctx.shadowBlur = 16 * pulse
      ctx.stroke()
      ctx.restore()
    }

    const tablePieces = pieces.filter((p) => !p.inTray)

    // Compute cluster member counts
    const clusterSizes = new Map<number, number>()
    for (const p of tablePieces) {
      clusterSizes.set(p.clusterId, (clusterSizes.get(p.clusterId) || 0) + 1)
    }

    const isAllSolved =
      tablePieces.length === pieces.length &&
      tablePieces.length > 0 &&
      tablePieces.every(
        (p) => p.isLockedToBoard || (p.rotation === 0 && Math.hypot(p.x - p.targetX, p.y - p.targetY) < 6)
      )

    if (isAllSolved && this.sourceImage) {
      // 100% Solved: Draw pristine completed artwork seamlessly
      ctx.save()
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
      ctx.shadowBlur = 12
      ctx.drawImage(this.sourceImage, 0, 0, boardWidth, boardHeight)

      ctx.strokeStyle = '#ffd8c0'
      ctx.lineWidth = 3
      ctx.strokeRect(0, 0, boardWidth, boardHeight)
      ctx.restore()
    } else {
      const now = performance.now()
      const isFlashing = this.flashClusterId !== null && now < this.flashEndTime

      // Viewport Culling Bounds (in world space) with generous safety padding for rotated tabs and shadows
      const pad = 100 / Math.max(0.1, viewport.scale)
      const viewMinX = -viewport.x / viewport.scale - pad
      const viewMinY = -viewport.y / viewport.scale - pad
      const viewMaxX = (canvasWidth - viewport.x) / viewport.scale + pad
      const viewMaxY = (canvasHeight - viewport.y) / viewport.scale + pad

      const isPieceVisible = (p: PuzzlePiece): boolean => {
        const radius = Math.max(p.width, p.height) * 1.5
        return (
          p.x + radius >= viewMinX &&
          p.x - radius <= viewMaxX &&
          p.y + radius >= viewMinY &&
          p.y - radius <= viewMaxY
        )
      }

      // -------------------------------------------------------------
      // LAYER 2: Grounded / Board-Locked Pieces (isLockedToBoard = true)
      // -------------------------------------------------------------
      const groundedPieces = tablePieces.filter(
        (p) => p.isLockedToBoard && p.clusterId !== activeClusterId
      )

      if (groundedPieces.length > 0) {
        if (this.sourceImage) {
          // Seamless Grounded Rendering: Union clipping path of all grounded pieces with direct master image draw
          ctx.save()
          ctx.beginPath()
          for (const piece of groundedPieces) {
            ctx.save()
            ctx.translate(piece.targetX, piece.targetY)
            JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
            ctx.restore()
          }
          ctx.clip()

          // Draw continuous source image across the entire board (zero interior seams or tab leakages)
          ctx.drawImage(this.sourceImage, 0, 0, boardWidth, boardHeight)
          ctx.restore()
        } else {
          for (const piece of groundedPieces) {
            this.drawSinglePiece(ctx, piece, settings, 1.0, false, false, false)
          }
        }

        // Active Snap Flash & Multi-Selection effects for grounded pieces
        for (const piece of groundedPieces) {
          const isThisFlashing = isFlashing && piece.clusterId === this.flashClusterId
          const isSelected = selectedPieceIds.has(piece.id) || (hintPiece !== null && piece.id === hintPiece.id)
          if (isThisFlashing || isSelected) {
            ctx.save()
            ctx.translate(piece.targetX, piece.targetY)
            ctx.beginPath()
            JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
            if (isThisFlashing) {
              ctx.strokeStyle = 'rgba(249, 210, 186, 0.95)'
              ctx.lineWidth = 3
              ctx.shadowColor = '#ffd8c0'
              ctx.shadowBlur = 12
              ctx.stroke()
            }
            if (isSelected) {
              ctx.strokeStyle = '#f9d2ba'
              ctx.lineWidth = 3
              ctx.shadowColor = '#5e3122'
              ctx.shadowBlur = 10
              ctx.stroke()
            }
            ctx.restore()
          }
        }
      }

      // -------------------------------------------------------------
      // LAYER 3: Loose Pieces & Clusters on Table (!isLockedToBoard)
      // -------------------------------------------------------------
      const loosePieces = tablePieces.filter(
        (p) => !p.isLockedToBoard && p.clusterId !== activeClusterId
      )
      // Sort loose pieces by zIndex
      loosePieces.sort((a, b) => a.zIndex - b.zIndex)

      // Group loose pieces by cluster to render clusters as unified seamless chunks
      const looseClusters = new Map<number, PuzzlePiece[]>()
      for (const piece of loosePieces) {
        if (!looseClusters.has(piece.clusterId)) {
          looseClusters.set(piece.clusterId, [])
        }
        looseClusters.get(piece.clusterId)!.push(piece)
      }

      for (const [clusterId, cPieces] of looseClusters) {
        const isThisFlashing = isFlashing && clusterId === this.flashClusterId
        const hasSelected = cPieces.some(
          (p) => selectedPieceIds.has(p.id) || (hintPiece !== null && p.id === hintPiece.id)
        )
        const isVisible = cPieces.some((p) => isPieceVisible(p))
        if (!isThisFlashing && !hasSelected && !isVisible) continue

        if (cPieces.length === 1) {
          const piece = cPieces[0]
          const isSelected = selectedPieceIds.has(piece.id) || (hintPiece !== null && piece.id === hintPiece.id)
          this.drawSinglePiece(ctx, piece, settings, 1.0, true, isThisFlashing, isSelected)
        } else {
          // Multi-piece cluster: draw with unified clip path so interior seams dissolve
          this.drawClusterGroup(ctx, cPieces, settings, 1.0, isThisFlashing, hasSelected, selectedPieceIds, hintPiece)
        }
      }

      // -------------------------------------------------------------
      // LAYER 4: Active Dragged Cluster (Elevation & Deep Drop Shadow)
      // -------------------------------------------------------------
      if (activeClusterId !== null) {
        const activePieces = tablePieces.filter((p) => p.clusterId === activeClusterId)
        if (activePieces.length > 0) {
          const isThisFlashing = isFlashing && activeClusterId === this.flashClusterId
          const hasSelected = activePieces.some(
            (p) => selectedPieceIds.has(p.id) || (hintPiece !== null && p.id === hintPiece.id)
          )

          // 1. Draw elevated drop shadow for the cluster
          ctx.save()
          ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
          ctx.shadowBlur = 20
          ctx.shadowOffsetX = 10
          ctx.shadowOffsetY = 16

          // Draw unified shadow silhouette
          for (const piece of activePieces) {
            ctx.save()
            const centerX = piece.x + piece.width / 2
            const centerY = piece.y + piece.height / 2
            ctx.translate(centerX, centerY)
            if (piece.rotation !== 0) ctx.rotate((piece.rotation * Math.PI) / 180)
            ctx.translate(-piece.width / 2, -piece.height / 2)
            ctx.beginPath()
            JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fill()
            ctx.restore()
          }
          ctx.restore()

          // 2. Draw cluster pieces
          if (activePieces.length === 1) {
            const piece = activePieces[0]
            const isSelected = selectedPieceIds.has(piece.id) || (hintPiece !== null && piece.id === hintPiece.id)
            this.drawSinglePiece(ctx, piece, settings, 1.0, true, isThisFlashing, isSelected)
          } else {
            this.drawClusterGroup(ctx, activePieces, settings, 1.0, isThisFlashing, hasSelected, selectedPieceIds, hintPiece)
          }
        }
      }

      // -------------------------------------------------------------
      // LAYER 5: Interactive Marquee Selection Box
      // -------------------------------------------------------------
      if (marqueeBox) {
        const x = Math.min(marqueeBox.x1, marqueeBox.x2)
        const y = Math.min(marqueeBox.y1, marqueeBox.y2)
        const w = Math.abs(marqueeBox.x2 - marqueeBox.x1)
        const h = Math.abs(marqueeBox.y2 - marqueeBox.y1)

        if (w > 2 || h > 2) {
          ctx.save()
          // 1. Uniform semi-transparent green tint
          ctx.fillStyle = 'rgba(29, 69, 51, 0.14)'
          ctx.fillRect(x, y, w, h)

          // 2. Crisp dashed boundary outline
          ctx.strokeStyle = '#1d4533'
          ctx.lineWidth = Math.max(1.0, 1.5 / viewport.scale)
          ctx.setLineDash([6 / viewport.scale, 4 / viewport.scale])
          ctx.strokeRect(x, y, w, h)
          ctx.setLineDash([])

          // 3. Corner accent dots (drawn individually with separate beginPath)
          const dotRadius = Math.max(2.5, 3.5 / viewport.scale)
          ctx.fillStyle = '#1d4533'
          const corners = [
            { cx: x, cy: y },
            { cx: x + w, cy: y },
            { cx: x, cy: y + h },
            { cx: x + w, cy: y + h },
          ]
          for (const c of corners) {
            ctx.beginPath()
            ctx.arc(c.cx, c.cy, dotRadius, 0, Math.PI * 2)
            ctx.fill()
          }

          ctx.restore()
        }
      }
    }

    ctx.restore()
  }

  /**
   * Draws a single piece on the canvas
   */
  private drawSinglePiece(
    ctx: CanvasRenderingContext2D,
    piece: PuzzlePiece,
    settings: UserSettings,
    opacity: number,
    drawEdgeHighlight: boolean,
    isFlashing: boolean = false,
    isSelected: boolean = false
  ): void {
    const sprite = this.sprites.get(piece.id)
    if (!sprite) return

    ctx.save()
    ctx.globalAlpha = opacity

    // Translate to center of piece for rotation
    const centerX = piece.x + piece.width / 2
    const centerY = piece.y + piece.height / 2

    ctx.translate(centerX, centerY)
    if (piece.rotation !== 0) {
      ctx.rotate((piece.rotation * Math.PI) / 180)
    }

    // Draw Sprite Texture
    ctx.drawImage(
      sprite.canvas,
      -piece.width / 2 - sprite.offsetX,
      -piece.height / 2 - sprite.offsetY
    )

    // Snap Flash Glow Effect
    if (isFlashing) {
      ctx.save()
      ctx.translate(-piece.width / 2, -piece.height / 2)
      ctx.beginPath()
      JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
      ctx.strokeStyle = 'rgba(249, 210, 186, 0.95)'
      ctx.lineWidth = 3
      ctx.shadowColor = '#ffd8c0'
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.restore()
    }

    // Multi-Selection Golden Halo Highlight
    if (isSelected) {
      ctx.save()
      ctx.translate(-piece.width / 2, -piece.height / 2)
      ctx.beginPath()
      JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
      ctx.strokeStyle = '#f9d2ba'
      ctx.lineWidth = 3
      ctx.shadowColor = '#5e3122'
      ctx.shadowBlur = 10
      ctx.stroke()
      ctx.restore()
    }

    // Optional user-configured edge highlight for loose pieces
    if (drawEdgeHighlight && settings.edgeHighlight > 0) {
      ctx.save()
      ctx.translate(-piece.width / 2, -piece.height / 2)
      ctx.beginPath()
      JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
      ctx.strokeStyle = `rgba(29, 69, 51, ${settings.edgeHighlight / 250})`
      ctx.lineWidth = 1.0
      ctx.stroke()
      ctx.restore()
    }

    ctx.restore()
  }

  /**
   * Draws a multi-piece cluster seamlessly with unified clipping so interior seams do not leak
   */
  private drawClusterGroup(
    ctx: CanvasRenderingContext2D,
    clusterPieces: PuzzlePiece[],
    settings: UserSettings,
    opacity: number,
    isFlashing: boolean,
    hasSelected: boolean,
    selectedPieceIds: Set<number>,
    hintPiece: PuzzlePiece | null
  ): void {
    if (clusterPieces.length === 0) return

    ctx.save()
    ctx.globalAlpha = opacity

    // 1. Unified clip path of all pieces in this cluster
    ctx.save()
    ctx.beginPath()
    for (const piece of clusterPieces) {
      ctx.save()
      const centerX = piece.x + piece.width / 2
      const centerY = piece.y + piece.height / 2
      ctx.translate(centerX, centerY)
      if (piece.rotation !== 0) ctx.rotate((piece.rotation * Math.PI) / 180)
      ctx.translate(-piece.width / 2, -piece.height / 2)
      JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
      ctx.restore()
    }
    ctx.clip()

    // 2. Draw piece sprites inside the clip to dissolve internal seams
    for (const piece of clusterPieces) {
      const sprite = this.sprites.get(piece.id)
      if (sprite) {
        ctx.save()
        const centerX = piece.x + piece.width / 2
        const centerY = piece.y + piece.height / 2
        ctx.translate(centerX, centerY)
        if (piece.rotation !== 0) ctx.rotate((piece.rotation * Math.PI) / 180)
        ctx.drawImage(
          sprite.canvas,
          -piece.width / 2 - sprite.offsetX,
          -piece.height / 2 - sprite.offsetY
        )
        ctx.restore()
      }
    }
    ctx.restore()

    // 3. Highlight / flash effects along outer silhouettes if active
    if (isFlashing || hasSelected) {
      for (const piece of clusterPieces) {
        const isPieceSelected = selectedPieceIds.has(piece.id) || (hintPiece !== null && piece.id === hintPiece.id)
        if (isFlashing || isPieceSelected) {
          ctx.save()
          const centerX = piece.x + piece.width / 2
          const centerY = piece.y + piece.height / 2
          ctx.translate(centerX, centerY)
          if (piece.rotation !== 0) ctx.rotate((piece.rotation * Math.PI) / 180)
          ctx.translate(-piece.width / 2, -piece.height / 2)
          ctx.beginPath()
          JigsawGenerator.buildPiecePath(ctx, piece.width, piece.height, piece.jitterProfile)
          if (isFlashing) {
            ctx.strokeStyle = 'rgba(249, 210, 186, 0.95)'
            ctx.lineWidth = 3
            ctx.shadowColor = '#ffd8c0'
            ctx.shadowBlur = 12
            ctx.stroke()
          }
          if (isPieceSelected) {
            ctx.strokeStyle = '#f9d2ba'
            ctx.lineWidth = 3
            ctx.shadowColor = '#5e3122'
            ctx.shadowBlur = 10
            ctx.stroke()
          }
          ctx.restore()
        }
      }
    }

    ctx.restore()
  }

  /**
   * Renders the board mat frame, drop shadow, and ghost image overlay
   */
  private renderBoardFrame(
    ctx: CanvasRenderingContext2D,
    boardWidth: number,
    boardHeight: number,
    settings: UserSettings
  ): void {
    const isDark = document.documentElement.classList.contains('dark')

    // Board shadow and background fill
    ctx.save()
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.45)'
    ctx.shadowColor = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = isDark ? 20 : 14
    ctx.shadowOffsetY = 6
    ctx.fillRect(0, 0, boardWidth, boardHeight)
    ctx.restore()

    // Board Border Guidelines
    ctx.strokeStyle = isDark ? 'rgba(52, 211, 153, 0.3)' : 'rgba(113, 121, 115, 0.45)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 8])
    ctx.strokeRect(0, 0, boardWidth, boardHeight)
    ctx.setLineDash([])

    // Ghost Image Overlay
    if (settings.showGhostOverlay && this.sourceImage) {
      ctx.save()
      ctx.globalAlpha = settings.ghostOpacity / 100
      ctx.drawImage(this.sourceImage, 0, 0, boardWidth, boardHeight)
      ctx.restore()
    }
  }

  private surfacePatterns: Map<string, CanvasPattern | null> = new Map()

  /**
   * Generates and caches high-performance procedural textures for table surfaces
   */
  private getTablePattern(
    ctx: CanvasRenderingContext2D,
    surface: TableSurface,
    isDark: boolean
  ): CanvasPattern | null {
    const key = `${surface}-${isDark ? 'dark' : 'light'}`
    if (this.surfacePatterns.has(key)) {
      return this.surfacePatterns.get(key) || null
    }

    const patCanvas = document.createElement('canvas')
    const patCtx = patCanvas.getContext('2d')
    if (!patCtx) return null

    switch (surface) {
      case 'felt': {
        // Soft woven acoustic felt texture
        patCanvas.width = 120
        patCanvas.height = 120
        const baseColor = isDark ? '#14171d' : '#f5e8de'
        patCtx.fillStyle = baseColor
        patCtx.fillRect(0, 0, 120, 120)

        // Micro-fiber flecks
        const fiberCount = 600
        for (let i = 0; i < fiberCount; i++) {
          const fx = Math.random() * 120
          const fy = Math.random() * 120
          const len = 1.5 + Math.random() * 3.5
          const angle = Math.random() * Math.PI
          const alpha = 0.03 + Math.random() * 0.05
          patCtx.strokeStyle = isDark
            ? `rgba(255, 255, 255, ${alpha})`
            : `rgba(40, 25, 15, ${alpha})`
          patCtx.lineWidth = 0.6 + Math.random() * 0.5
          patCtx.beginPath()
          patCtx.moveTo(fx, fy)
          patCtx.lineTo(fx + Math.cos(angle) * len, fy + Math.sin(angle) * len)
          patCtx.stroke()
        }
        break
      }

      case 'walnut': {
        // Natural satin dark walnut woodgrain
        patCanvas.width = 240
        patCanvas.height = 240
        patCtx.fillStyle = isDark ? '#161310' : '#30261f'
        patCtx.fillRect(0, 0, 240, 240)

        // Subtle undulating organic grain lines
        for (let y = 0; y < 240; y += 4) {
          const wave = Math.sin(y / 15) * 8 + Math.cos(y / 7) * 4
          const alpha = 0.03 + Math.random() * 0.04
          patCtx.strokeStyle = isDark
            ? `rgba(215, 175, 135, ${alpha})`
            : `rgba(20, 12, 6, ${alpha * 1.5})`
          patCtx.lineWidth = 1.2 + Math.random() * 1.8
          patCtx.beginPath()
          patCtx.moveTo(0, y + wave)
          patCtx.bezierCurveTo(80, y + wave + 3, 160, y + wave - 3, 240, y + wave)
          patCtx.stroke()
        }
        break
      }

      case 'cutting-mat': {
        // Precision self-healing drafting grid
        patCanvas.width = 100
        patCanvas.height = 100
        patCtx.fillStyle = isDark ? '#0a1610' : '#122c20'
        patCtx.fillRect(0, 0, 100, 100)

        // 10px Sub-grid lines
        patCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.025)' : 'rgba(255, 255, 255, 0.04)'
        patCtx.lineWidth = 0.75
        patCtx.beginPath()
        for (let i = 10; i < 100; i += 10) {
          if (i === 50) continue
          patCtx.moveTo(i, 0)
          patCtx.lineTo(i, 100)
          patCtx.moveTo(0, i)
          patCtx.lineTo(100, i)
        }
        patCtx.stroke()

        // 50px Major grid lines
        patCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(255, 255, 255, 0.10)'
        patCtx.lineWidth = 1.2
        patCtx.beginPath()
        patCtx.moveTo(50, 0); patCtx.lineTo(50, 100)
        patCtx.moveTo(0, 50); patCtx.lineTo(100, 50)
        patCtx.stroke()

        // 45-degree diagonal drafting tick
        patCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.06)'
        patCtx.setLineDash([3, 5])
        patCtx.beginPath()
        patCtx.moveTo(0, 0); patCtx.lineTo(100, 100)
        patCtx.stroke()
        patCtx.setLineDash([])
        break
      }

      case 'slate': {
        // Fine volcanic obsidian stone texture
        patCanvas.width = 150
        patCanvas.height = 150
        patCtx.fillStyle = isDark ? '#121419' : '#22252a'
        patCtx.fillRect(0, 0, 150, 150)

        // Mineral crystals & granular flecks
        for (let i = 0; i < 700; i++) {
          const sx = Math.random() * 150
          const sy = Math.random() * 150
          const rad = 0.5 + Math.random() * 1.2
          const alpha = 0.02 + Math.random() * 0.05
          patCtx.fillStyle = isDark
            ? `rgba(200, 215, 240, ${alpha})`
            : `rgba(255, 255, 255, ${alpha})`
          patCtx.beginPath()
          patCtx.arc(sx, sy, rad, 0, Math.PI * 2)
          patCtx.fill()
        }
        break
      }
    }

    const pattern = ctx.createPattern(patCanvas, 'repeat')
    this.surfacePatterns.set(key, pattern)
    return pattern
  }

  /**
   * Renders the table surface background
   */
  private renderTableSurface(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    surface: TableSurface
  ): void {
    const isDark = document.documentElement.classList.contains('dark')
    const pattern = this.getTablePattern(ctx, surface, isDark)

    if (pattern) {
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, width, height)
    } else {
      ctx.fillStyle = isDark ? '#12151a' : '#f7eae0'
      ctx.fillRect(0, 0, width, height)
    }
  }

  /**
   * Hit test: finds top-most piece under world coordinates (wx, wy)
   */
  public hitTest(
    pieces: PuzzlePiece[],
    wx: number,
    wy: number
  ): PuzzlePiece | null {
    const tablePieces = pieces.filter((p) => !p.inTray)
    // Check loose pieces first (topmost), then grounded pieces
    tablePieces.sort((a, b) => {
      const aGrounded = a.isLockedToBoard ? 0 : 1000
      const bGrounded = b.isLockedToBoard ? 0 : 1000
      return b.zIndex + bGrounded - (a.zIndex + aGrounded)
    })

    for (const piece of tablePieces) {
      const marginX = piece.width * 0.35
      const marginY = piece.height * 0.35

      if (
        wx >= piece.x - marginX &&
        wx <= piece.x + piece.width + marginX &&
        wy >= piece.y - marginY &&
        wy <= piece.y + piece.height + marginY
      ) {
        return piece
      }
    }

    return null
  }
}
