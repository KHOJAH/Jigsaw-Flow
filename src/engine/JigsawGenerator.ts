import {
  EdgeJitter,
  PieceEdgeData,
  PieceJitterProfile,
  PuzzleCutStyle,
  PuzzlePiece,
} from '../types/puzzle'

interface Point2D {
  x: number
  y: number
}

export class JigsawGenerator {
  /**
   * Calculates optimal rows and columns for a given piece count and aspect ratio
   */
  static calculateGrid(
    aspectRatio: number,
    desiredPieces: number,
    boardWidth: number,
    boardHeight: number
  ): {
    rows: number
    cols: number
    pieceWidth: number
    pieceHeight: number
  } {
    const rawCols = Math.sqrt(desiredPieces * aspectRatio)
    const cols = Math.max(2, Math.round(rawCols))
    const rows = Math.max(2, Math.round(desiredPieces / cols))

    const pieceWidth = boardWidth / cols
    const pieceHeight = boardHeight / rows

    return { rows, cols, pieceWidth, pieceHeight }
  }

  /**
   * Generates edge jitter variations for unique tabs
   */
  private static createEdgeJitter(): EdgeJitter {
    return {
      tabSize: 0.22,
      tabOffset: 0,
      neckWidth: 0.20,
      headWidth: 0.30,
    }
  }

  /**
   * Generates all pieces for the puzzle with complementary matching edges and cut style
   */
  static generatePieces(
    rows: number,
    cols: number,
    pieceWidth: number,
    pieceHeight: number,
    boardWidth: number,
    boardHeight: number,
    enableRotation: boolean,
    cutStyle: PuzzleCutStyle = 'classic'
  ): PuzzlePiece[] {
    const pieces: PuzzlePiece[] = []

    // Horizontal internal edges: (rows - 1) x cols
    const horizontalEdges: PieceEdgeData[][] = []
    for (let r = 0; r < rows - 1; r++) {
      horizontalEdges[r] = []
      for (let c = 0; c < cols; c++) {
        horizontalEdges[r][c] = {
          shape: Math.random() > 0.5 ? 1 : -1,
          jitter: this.createEdgeJitter(),
        }
      }
    }

    // Vertical internal edges: rows x (cols - 1)
    const verticalEdges: PieceEdgeData[][] = []
    for (let r = 0; r < rows; r++) {
      verticalEdges[r] = []
      for (let c = 0; c < cols - 1; c++) {
        verticalEdges[r][c] = {
          shape: Math.random() > 0.5 ? 1 : -1,
          jitter: this.createEdgeJitter(),
        }
      }
    }

    let idCounter = 0

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const targetX = c * pieceWidth
        const targetY = r * pieceHeight

        const topEdge: PieceEdgeData =
          r === 0
            ? { shape: 0, jitter: { tabSize: 0, tabOffset: 0, neckWidth: 0, headWidth: 0 } }
            : {
                shape: -horizontalEdges[r - 1][c].shape,
                jitter: horizontalEdges[r - 1][c].jitter,
              }

        const bottomEdge: PieceEdgeData =
          r === rows - 1
            ? { shape: 0, jitter: { tabSize: 0, tabOffset: 0, neckWidth: 0, headWidth: 0 } }
            : {
                shape: horizontalEdges[r][c].shape,
                jitter: horizontalEdges[r][c].jitter,
              }

        const leftEdge: PieceEdgeData =
          c === 0
            ? { shape: 0, jitter: { tabSize: 0, tabOffset: 0, neckWidth: 0, headWidth: 0 } }
            : {
                shape: -verticalEdges[r][c - 1].shape,
                jitter: verticalEdges[r][c - 1].jitter,
              }

        const rightEdge: PieceEdgeData =
          c === cols - 1
            ? { shape: 0, jitter: { tabSize: 0, tabOffset: 0, neckWidth: 0, headWidth: 0 } }
            : {
                shape: verticalEdges[r][c].shape,
                jitter: verticalEdges[r][c].jitter,
              }

        const isCorner =
          (r === 0 && c === 0) ||
          (r === 0 && c === cols - 1) ||
          (r === rows - 1 && c === 0) ||
          (r === rows - 1 && c === cols - 1)

        const isEdge = r === 0 || r === rows - 1 || c === 0 || c === cols - 1

        const rotation = enableRotation ? [0, 90, 180, 270][Math.floor(Math.random() * 4)] : 0

        const piece: PuzzlePiece = {
          id: idCounter,
          gridRow: r,
          gridCol: c,
          x: 0,
          y: 0,
          targetX,
          targetY,
          width: pieceWidth,
          height: pieceHeight,
          rotation,
          clusterId: idCounter,
          inTray: true,
          isLockedToBoard: false,
          isEdge,
          isCorner,
          edges: {
            top: topEdge.shape,
            right: rightEdge.shape,
            bottom: bottomEdge.shape,
            left: leftEdge.shape,
          },
          jitterProfile: {
            top: topEdge,
            right: rightEdge,
            bottom: bottomEdge,
            left: leftEdge,
          },
          colorKey: '#1d4533',
          zIndex: idCounter,
          cutStyle,
        }

        pieces.push(piece)
        idCounter++
      }
    }

    return this.shuffleArray(pieces)
  }

  /**
   * Shuffles an array immutably using Fisher-Yates algorithm
   */
  static shuffleArray<T>(array: T[]): T[] {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
    return arr
  }

  /**
   * Draws a single classic jigsaw edge from point A to point B
   */
  private static drawJigsawEdge(
    ctx: CanvasRenderingContext2D | Path2D,
    pA: Point2D,
    pB: Point2D,
    shape: number,
    tabScale: number = 0.22
  ): void {
    // If flat outer boundary border edge, draw straight line to B
    if (shape === 0) {
      ctx.lineTo(pB.x, pB.y)
      return
    }

    const dx = pB.x - pA.x
    const dy = pB.y - pA.y
    const L = Math.hypot(dx, dy)

    // Unit tangent vector from A to B
    const ux = dx / L
    const uy = dy / L

    // Outward normal vector (perpendicular to traversal direction)
    const nx = uy
    const ny = -ux

    // Protrusion vector scaled by shape (+1 for outward tab, -1 for inward blank)
    const vx = nx * shape * (L * tabScale)
    const vy = ny * shape * (L * tabScale)

    // Parametric point mapper: t in [0, 1] along edge, s in [-1, 1] along protrusion
    const P = (t: number, s: number): Point2D => ({
      x: pA.x + ux * (t * L) + vx * s,
      y: pA.y + uy * (t * L) + vy * s,
    })

    // -------------------------------------------------------------
    // STYLE 3: CLASSIC (Smooth Rounded Bézier Puzzle Tabs)
    // -------------------------------------------------------------
    // 1. Lead-in straight shoulder to neck base
    const p1 = P(0.35, 0)
    ctx.lineTo(p1.x, p1.y)

    // 2. Neck narrowing and curve into left head bulb
    const cp1 = P(0.36, -0.05)
    const cp2 = P(0.32, 0.40)
    const p2 = P(0.34, 0.65)
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)

    // 3. Left head bulb rounding up to apex dome
    const cp3 = P(0.36, 1.05)
    const cp4 = P(0.44, 1.05)
    const p3 = P(0.50, 1.05) // Apex
    ctx.bezierCurveTo(cp3.x, cp3.y, cp4.x, cp4.y, p3.x, p3.y)

    // 4. Apex dome rounding down into right head bulb
    const cp5 = P(0.56, 1.05)
    const cp6 = P(0.64, 1.05)
    const p4 = P(0.66, 0.65)
    ctx.bezierCurveTo(cp5.x, cp5.y, cp6.x, cp6.y, p4.x, p4.y)

    // 5. Right neck returning to right shoulder
    const cp7 = P(0.68, 0.40)
    const cp8 = P(0.64, -0.05)
    const p5 = P(0.65, 0)
    ctx.bezierCurveTo(cp7.x, cp7.y, cp8.x, cp8.y, p5.x, p5.y)

    // 6. Lead-out straight shoulder to edge end point B
    ctx.lineTo(pB.x, pB.y)
  }

  /**
   * Builds the exact closed Path2D / Canvas path for a piece with sub-pixel precision
   */
  static buildPiecePath(
    ctx: CanvasRenderingContext2D | Path2D,
    width: number,
    height: number,
    profile: PieceJitterProfile
  ): void {
    // 4 Corners of piece bounding box
    const pTL: Point2D = { x: 0, y: 0 }
    const pTR: Point2D = { x: width, y: 0 }
    const pBR: Point2D = { x: width, y: height }
    const pBL: Point2D = { x: 0, y: height }

    // Start at Top-Left
    ctx.moveTo(pTL.x, pTL.y)

    // 1. Top Edge: (0, 0) -> (width, 0)
    this.drawJigsawEdge(ctx, pTL, pTR, profile.top.shape, 0.22)

    // 2. Right Edge: (width, 0) -> (width, height)
    this.drawJigsawEdge(ctx, pTR, pBR, profile.right.shape, 0.22)

    // 3. Bottom Edge: (width, height) -> (0, height)
    this.drawJigsawEdge(ctx, pBR, pBL, profile.bottom.shape, 0.22)

    // 4. Left Edge: (0, height) -> (0, 0)
    this.drawJigsawEdge(ctx, pBL, pTL, profile.left.shape, 0.22)

    if (ctx instanceof CanvasRenderingContext2D) {
      ctx.closePath()
    }
  }
}
