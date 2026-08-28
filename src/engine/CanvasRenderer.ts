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

      // 2. Draw corresponding segment of source image
      const srcX = piece.targetX * scaleX
      const srcY = piece.targetY * scaleY
      const srcW = piece.width * scaleX
      const srcH = piece.height * scaleY

      ctx.drawImage(
        image,
        srcX - marginX * scaleX,
        srcY - marginY * scaleY,
        srcW + marginX * 2 * scaleX,
        srcH + marginY * 2 * scaleY,
        -marginX,
        -marginY,
        spriteWidth,
        spriteHeight
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
      clusterSizes.get(tablePieces[0]?.clusterId) === pieces.length &&
      tablePieces.every(
        (p) => p.rotation === 0 && Math.hypot(p.x - p.targetX, p.y - p.targetY) < 6
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

      // -------------------------------------------------------------
      // LAYER 2: Grounded / Board-Locked Pieces (isLockedToBoard = true)
      // -------------------------------------------------------------
      const groundedPieces = tablePieces.filter(
        (p) => p.isLockedToBoard && p.clusterId !== activeClusterId
      )
      for (const piece of groundedPieces) {
        const isThisFlashing = isFlashing && piece.clusterId === this.flashClusterId
        const isSelected = selectedPieceIds.has(piece.id) || (hintPiece !== null && piece.id === hintPiece.id)
        this.drawSinglePiece(ctx, piece, settings, 1.0, false, isThisFlashing, isSelected)
      }

      // -------------------------------------------------------------
      // LAYER 3: Loose Pieces & Clusters on Table (!isLockedToBoard)
      // -------------------------------------------------------------
      const loosePieces = tablePieces.filter(
        (p) => !p.isLockedToBoard && p.clusterId !== activeClusterId
      )
      // Sort loose pieces by zIndex
      loosePieces.sort((a, b) => a.zIndex - b.zIndex)

      for (const piece of loosePieces) {
        const isClustered = (clusterSizes.get(piece.clusterId) || 0) > 1
        const isThisFlashing = isFlashing && piece.clusterId === this.flashClusterId
        const isSelected = selectedPieceIds.has(piece.id) || (hintPiece !== null && piece.id === hintPiece.id)
        this.drawSinglePiece(ctx, piece, settings, 1.0, !isClustered, isThisFlashing, isSelected)
      }

      // -------------------------------------------------------------
      // LAYER 4: Active Dragged Cluster (Elevation & Deep Drop Shadow)
      // -------------------------------------------------------------
      if (activeClusterId !== null) {
        const activePieces = tablePieces.filter((p) => p.clusterId === activeClusterId)

        // Draw deep elevated drop shadow
        ctx.save()
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)'
        ctx.shadowBlur = 20
        ctx.shadowOffsetX = 10
        ctx.shadowOffsetY = 16

        for (const piece of activePieces) {
          this.drawSinglePiece(ctx, piece, settings, 1.0, false, false, false)
        }
        ctx.restore()

        // Draw active piece sprites on top
        for (const piece of activePieces) {
          const isThisFlashing = isFlashing && piece.clusterId === this.flashClusterId
          const isSelected = selectedPieceIds.has(piece.id) || (hintPiece !== null && piece.id === hintPiece.id)
          this.drawSinglePiece(ctx, piece, settings, 1.0, true, isThisFlashing, isSelected)
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
   * Renders the board boundary guidelines and optional ghost image overlay
   */
  private renderBoardFrame(
    ctx: CanvasRenderingContext2D,
    boardWidth: number,
    boardHeight: number,
    settings: UserSettings
  ): void {
    // Board shadow and background fill
    ctx.save()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)'
    ctx.shadowBlur = 14
    ctx.shadowOffsetY = 6
    ctx.fillRect(0, 0, boardWidth, boardHeight)
    ctx.restore()

    // Board Border Guidelines
    ctx.strokeStyle = 'rgba(113, 121, 115, 0.45)'
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

  /**
   * Renders the table surface background
   */
  private renderTableSurface(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    surface: TableSurface
  ): void {
    switch (surface) {
      case 'felt':
        ctx.fillStyle = '#f7eae0' // Soft warm linen cream
        ctx.fillRect(0, 0, width, height)
        break
      case 'walnut':
        ctx.fillStyle = '#362f29' // Deep dark walnut
        ctx.fillRect(0, 0, width, height)
        break
      case 'cutting-mat':
        ctx.fillStyle = '#143124' // Dark green cutting mat
        ctx.fillRect(0, 0, width, height)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'
        ctx.lineWidth = 1
        const step = 40
        ctx.beginPath()
        for (let x = 0; x < width; x += step) {
          ctx.moveTo(x, 0)
          ctx.lineTo(x, height)
        }
        for (let y = 0; y < height; y += step) {
          ctx.moveTo(0, y)
          ctx.lineTo(width, y)
        }
        ctx.stroke()
        break
      case 'slate':
        ctx.fillStyle = '#26292b' // Slate stone
        ctx.fillRect(0, 0, width, height)
        break
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
