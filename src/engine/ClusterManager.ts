import { PuzzlePiece, SnapSensitivity } from '../types/puzzle'

export interface SnapResult {
  hasSnapped: boolean
  snappedCount: number
  mergedClusterIds: number[]
  isFullySolved: boolean
  isGroundedToBoard: boolean
}

export class ClusterManager {
  /**
   * Returns snap distance threshold in board coordinates based on sensitivity setting
   */
  static getSnapThreshold(sensitivity: SnapSensitivity, pieceWidth: number): number {
    switch (sensitivity) {
      case 'low':
        return pieceWidth * 0.20 // 20%
      case 'medium':
        return pieceWidth * 0.35 // 35% (generous & responsive)
      case 'high':
        return pieceWidth * 0.50 // 50%
      case 'snappy':
        return pieceWidth * 0.65 // 65% (extra magnetic)
    }
  }

  /**
   * Moves all pieces in a cluster by (dx, dy)
   */
  static moveCluster(
    pieces: PuzzlePiece[],
    clusterId: number,
    dx: number,
    dy: number
  ): void {
    for (const p of pieces) {
      if (p.clusterId === clusterId) {
        p.x += dx
        p.y += dy
        p.inTray = false
      }
    }
  }

  /**
   * Rotates all pieces in a cluster by 90 degrees clockwise around their center of mass
   */
  static rotateCluster(pieces: PuzzlePiece[], clusterId: number): void {
    const clusterPieces = pieces.filter((p) => p.clusterId === clusterId)
    if (clusterPieces.length === 0) return

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const p of clusterPieces) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x + p.width)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y + p.height)
    }

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    for (const p of clusterPieces) {
      p.rotation = (p.rotation + 90) % 360

      const relX = p.x + p.width / 2 - centerX
      const relY = p.y + p.height / 2 - centerY

      // 90 deg clockwise: (x', y') = (-y, x)
      const newRelX = -relY
      const newRelY = relX

      p.x = centerX + newRelX - p.width / 2
      p.y = centerY + newRelY - p.height / 2
    }
  }

  /**
   * Checks for snap opportunities against the board frame AND against matching neighboring pieces
   */
  static checkSnap(
    pieces: PuzzlePiece[],
    activeClusterId: number,
    sensitivity: SnapSensitivity
  ): SnapResult {
    const clusterPieces = pieces.filter(
      (p) => p.clusterId === activeClusterId && !p.inTray
    )
    if (clusterPieces.length === 0) {
      return {
        hasSnapped: false,
        snappedCount: 0,
        mergedClusterIds: [],
        isFullySolved: false,
        isGroundedToBoard: false,
      }
    }

    const pieceWidth = clusterPieces[0].width
    const threshold = this.getSnapThreshold(sensitivity, pieceWidth)

    let hasSnapped = false
    let snappedCount = 0
    let isGroundedToBoard = clusterPieces.some((p) => p.isLockedToBoard)
    const mergedClusterIds: number[] = []

    // 1. Check Board Grid Snapping (Direct anchor to board slot 0,0)
    for (const activePiece of clusterPieces) {
      if (activePiece.rotation === 0) {
        const boardDist = Math.hypot(
          activePiece.x - activePiece.targetX,
          activePiece.y - activePiece.targetY
        )

        if (boardDist <= threshold) {
          const shiftX = activePiece.targetX - activePiece.x
          const shiftY = activePiece.targetY - activePiece.y

          for (const p of pieces) {
            if (p.clusterId === activeClusterId) {
              p.x += shiftX
              p.y += shiftY
              p.isLockedToBoard = true
            }
          }
          hasSnapped = true
          snappedCount++
          isGroundedToBoard = true
          break
        }
      }
    }

    // 2. Check Piece-to-Piece Neighbor Snapping (Cascading search)
    const gridMap = new Map<string, PuzzlePiece>()
    for (const p of pieces) {
      gridMap.set(`${p.gridRow},${p.gridCol}`, p)
    }

    let searchAgain = true
    while (searchAgain) {
      searchAgain = false
      const currentCluster = pieces.filter(
        (p) => p.clusterId === activeClusterId && !p.inTray
      )

      for (const activePiece of currentCluster) {
        const neighbors = [
          { r: activePiece.gridRow - 1, c: activePiece.gridCol }, // Top
          { r: activePiece.gridRow + 1, c: activePiece.gridCol }, // Bottom
          { r: activePiece.gridRow, c: activePiece.gridCol - 1 }, // Left
          { r: activePiece.gridRow, c: activePiece.gridCol + 1 }, // Right
        ]

        for (const n of neighbors) {
          const neighborPiece = gridMap.get(`${n.r},${n.c}`)
          if (!neighborPiece || neighborPiece.inTray) continue

          if (
            neighborPiece.clusterId !== activeClusterId &&
            neighborPiece.rotation === activePiece.rotation
          ) {
            const expectedDx = activePiece.targetX - neighborPiece.targetX
            const expectedDy = activePiece.targetY - neighborPiece.targetY

            let rotExpectedDx = expectedDx
            let rotExpectedDy = expectedDy

            if (activePiece.rotation === 90) {
              rotExpectedDx = -expectedDy
              rotExpectedDy = expectedDx
            } else if (activePiece.rotation === 180) {
              rotExpectedDx = -expectedDx
              rotExpectedDy = -expectedDy
            } else if (activePiece.rotation === 270) {
              rotExpectedDx = expectedDy
              rotExpectedDy = -expectedDx
            }

            const actualDx = activePiece.x - neighborPiece.x
            const actualDy = activePiece.y - neighborPiece.y

            const dist = Math.hypot(actualDx - rotExpectedDx, actualDy - rotExpectedDy)

            if (dist <= threshold) {
              // Snap! Align active cluster to neighbor
              const correctActiveX = neighborPiece.x + rotExpectedDx
              const correctActiveY = neighborPiece.y + rotExpectedDy

              const shiftX = correctActiveX - activePiece.x
              const shiftY = correctActiveY - activePiece.y

              const willBeGrounded = neighborPiece.isLockedToBoard || isGroundedToBoard

              for (const p of pieces) {
                if (p.clusterId === activeClusterId) {
                  p.x += shiftX
                  p.y += shiftY
                  if (willBeGrounded) p.isLockedToBoard = true
                }
              }

              // Merge neighbor cluster into active cluster
              const neighborClusterId = neighborPiece.clusterId
              for (const p of pieces) {
                if (p.clusterId === neighborClusterId) {
                  p.clusterId = activeClusterId
                  if (willBeGrounded) p.isLockedToBoard = true
                }
              }

              if (willBeGrounded) isGroundedToBoard = true
              mergedClusterIds.push(activeClusterId)
              hasSnapped = true
              snappedCount++
              searchAgain = true
              break
            }
          }
        }

        if (searchAgain) break
      }
    }

    // Check if fully solved: all pieces on board, all belong to 1 cluster, rotation 0, and aligned to board
    const allOut = pieces.every((p) => !p.inTray)
    const firstCluster = pieces[0]?.clusterId
    const singleCluster = pieces.every((p) => p.clusterId === firstCluster)
    const correctRotation = pieces.every((p) => p.rotation === 0)
    const onBoard = pieces.every(
      (p) => Math.hypot(p.x - p.targetX, p.y - p.targetY) < 6
    )

    const isFullySolved =
      allOut && singleCluster && correctRotation && onBoard && pieces.length > 0

    return {
      hasSnapped,
      snappedCount,
      mergedClusterIds,
      isFullySolved,
      isGroundedToBoard,
    }
  }

  /**
   * Computes dictionary of clusterId -> pieceIds
   */
  static getClusterGroups(pieces: PuzzlePiece[]): Record<number, number[]> {
    const clusters: Record<number, number[]> = {}
    for (const p of pieces) {
      if (!clusters[p.clusterId]) {
        clusters[p.clusterId] = []
      }
      clusters[p.clusterId].push(p.id)
    }
    return clusters
  }

  /**
   * Calculates true DSU progress percentage
   */
  static calculateProgress(pieces: PuzzlePiece[]): number {
    if (pieces.length <= 1) return 100
    const groups = this.getClusterGroups(pieces)
    const totalClusters = Object.keys(groups).length
    const groundedPieces = pieces.filter((p) => p.isLockedToBoard).length

    if (groundedPieces === pieces.length) return 100

    const mergedCount = pieces.length - totalClusters
    const rawProgress = (mergedCount / (pieces.length - 1)) * 100
    return Math.min(100, Math.max(0, Math.round(rawProgress)))
  }

  /**
   * Generates perimeter slot coordinates prioritized along the left and right sides of the image
   */
  static generatePerimeterSlots(
    boardWidth: number,
    boardHeight: number,
    pieceWidth: number,
    pieceHeight: number
  ): { x: number; y: number }[] {
    const slotSpacingX = pieceWidth * 1.25
    const slotSpacingY = pieceHeight * 1.25
    const marginOffset = 45
    const slots: { x: number; y: number }[] = []

    const sideRows = Math.max(3, Math.floor((boardHeight + 50) / slotSpacingY))

    // Alternate between Left and Right columns so pieces distribute neatly on both sides of the image
    for (let col = 0; col < 4; col++) {
      // Left side column
      for (let row = 0; row < sideRows; row++) {
        slots.push({
          x: -marginOffset - (col + 1) * slotSpacingX,
          y: row * slotSpacingY,
        })
      }

      // Right side column
      for (let row = 0; row < sideRows; row++) {
        slots.push({
          x: boardWidth + marginOffset + col * slotSpacingX,
          y: row * slotSpacingY,
        })
      }
    }

    // Top Strip (above the board if side columns fill up)
    const topCols = Math.max(4, Math.floor((boardWidth + 300) / slotSpacingX))
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < topCols; col++) {
        slots.push({
          x: -150 + col * slotSpacingX,
          y: -marginOffset - (row + 1) * slotSpacingY,
        })
      }
    }

    return slots
  }

  /**
   * Finds the next open, unoccupied perimeter slot on the tabletop
   */
  static findNextOpenSlot(
    tablePieces: PuzzlePiece[],
    boardWidth: number,
    boardHeight: number,
    pieceWidth: number,
    pieceHeight: number
  ): { x: number; y: number } {
    const slots = this.generatePerimeterSlots(boardWidth, boardHeight, pieceWidth, pieceHeight)
    const threshold = Math.min(pieceWidth, pieceHeight) * 0.7

    for (const slot of slots) {
      const isOccupied = tablePieces.some(
        (p) => !p.inTray && Math.hypot(p.x - slot.x, p.y - slot.y) < threshold
      )
      if (!isOccupied) {
        return slot
      }
    }

    // Fallback: slight random offset around left margin
    return {
      x: -pieceWidth * 1.5 - Math.random() * 50,
      y: Math.random() * (boardHeight / 2),
    }
  }

  /**
   * Deterministic Non-Overlapping Perimeter Scatter Layout
   * Arranges selected loose pieces into orderly non-overlapping grid slots around the board margins.
   */
  static calculatePerimeterScatter(
    piecesToScatter: PuzzlePiece[],
    boardWidth: number,
    boardHeight: number,
    pieceWidth: number,
    pieceHeight: number
  ): Map<number, { x: number; y: number }> {
    const positions = new Map<number, { x: number; y: number }>()
    if (piecesToScatter.length === 0) return positions

    const availableSlots = this.generatePerimeterSlots(
      boardWidth,
      boardHeight,
      pieceWidth,
      pieceHeight
    )

    // Assign each piece to a distinct slot
    piecesToScatter.forEach((piece, index) => {
      const slot = availableSlots[index % availableSlots.length]
      if (slot) {
        positions.set(piece.id, { x: slot.x, y: slot.y })
      }
    })

    return positions
  }
}
