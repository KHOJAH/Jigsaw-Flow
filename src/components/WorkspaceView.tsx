import React, { useRef, useEffect, useState, useCallback } from 'react'
import { PuzzlePiece, PuzzleSave, UserSettings, ViewportTransform } from '../types/puzzle'
import { CanvasRenderer } from '../engine/CanvasRenderer'
import { ClusterManager } from '../engine/ClusterManager'
import { audioEngine } from '../engine/AudioEngine'
import { CanvasHUD } from './CanvasHUD'
import { PieceTray, TrayFilter } from './PieceTray'
import { SelectionHUD } from './SelectionHUD'
import { PieceInspectModal } from './PieceInspectModal'

interface WorkspaceViewProps {
  puzzle: PuzzleSave
  settings: UserSettings
  onUpdatePuzzle: (updated: PuzzleSave) => void
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void
  onVictory: (finalStats: { solveTime: number; moves: number; accuracy: number }) => void
  onBackToLibrary: () => void
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  puzzle,
  settings,
  onUpdatePuzzle,
  onUpdateSettings,
  onVictory,
  onBackToLibrary,
  isSidebarCollapsed = false,
  onToggleSidebar,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<CanvasRenderer>(new CanvasRenderer())

  const [pieces, setPieces] = useState<PuzzlePiece[]>(puzzle.pieces)
  const [elapsedTime, setElapsedTime] = useState<number>(puzzle.elapsedTime)
  const [movesCount, setMovesCount] = useState<number>(puzzle.movesCount)
  const [snapCount, setSnapCount] = useState<number>(puzzle.snapCount)
  const [isTrayOpen, setIsTrayOpen] = useState<boolean>(true) // Open by default for easy piece pickup
  const [isAutoSolving, setIsAutoSolving] = useState<boolean>(false)
  const [inspectingPiece, setInspectingPiece] = useState<PuzzlePiece | null>(null)
  const [hintedPiece, setHintedPiece] = useState<PuzzlePiece | null>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Marquee Selection & Group Management State
  const [selectedPieceIds, setSelectedPieceIds] = useState<Set<number>>(new Set())
  const marqueeBoxRef = useRef<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const marqueeInitialSelectionRef = useRef<Set<number>>(new Set())
  const isDraggingGroupRef = useRef<boolean>(false)

  // Viewport transformation state (World translation and zoom scale)
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 100,
    y: 100,
    scale: 0.85,
  })

  // Dragging & Interaction refs
  const activeClusterRef = useRef<number | null>(null)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const dragOffsetsRef = useRef<Map<number, { relX: number; relY: number }>>(new Map())
  const draggedFromTrayRef = useRef<{
    pieceId: number
    startClientX: number
    startClientY: number
    moved: boolean
  } | null>(null)
  const isPanningRef = useRef<boolean>(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)
  const isSpacePressedRef = useRef<boolean>(false)
  const highestZIndexRef = useRef<number>(puzzle.pieces.length + 100)

  // Timer tick
  useEffect(() => {
    if (puzzle.status === 'completed' || isAutoSolving) return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [puzzle.status, isAutoSolving])

  // Center initial board in canvas viewport
  const centerBoard = useCallback(() => {
    if (!canvasRef.current) return
    const { clientWidth, clientHeight } = canvasRef.current
    const scale = Math.min(
      (clientWidth * 0.65) / puzzle.boardWidth,
      (clientHeight * 0.65) / puzzle.boardHeight,
      1.0
    )
    const x = (clientWidth - puzzle.boardWidth * scale) / 2
    const y = (clientHeight - puzzle.boardHeight * scale) / 2 - 30
    setViewport({ x, y, scale })
  }, [puzzle.boardWidth, puzzle.boardHeight])

  // Initialize Canvas Renderer Sprites once per puzzle
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      rendererRef.current.preparePieceSprites(
        img,
        puzzle.pieces,
        puzzle.boardWidth,
        puzzle.boardHeight
      )
      centerBoard()
    }
    img.src = puzzle.imageSrc
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id, puzzle.imageSrc])

  // 60fps Animation render loop
  useEffect(() => {
    let animationFrameId: number

    const renderLoop = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          if (
            canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight
          ) {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
          }

          rendererRef.current.render(
            ctx,
            canvas.width,
            canvas.height,
            viewport,
            pieces,
            puzzle.boardWidth,
            puzzle.boardHeight,
            activeClusterRef.current,
            settings,
            selectedPieceIds,
            marqueeBoxRef.current,
            hintedPiece
          )
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop)
    }

    renderLoop()

    return () => cancelAnimationFrame(animationFrameId)
  }, [viewport, pieces, puzzle.boardWidth, puzzle.boardHeight, settings, selectedPieceIds])

  // Convert screen coordinates to world coordinates: P_world = (P_screen - Translation) / Scale
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      return {
        x: (screenX - viewport.x) / viewport.scale,
        y: (screenY - viewport.y) / viewport.scale,
      }
    },
    [viewport]
  )

  // Handle Mouse Down on Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAutoSolving) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    // Middle click or Space + Left click initiates panning
    if (e.button === 1 || (e.button === 0 && isSpacePressedRef.current)) {
      isPanningRef.current = true
      panStartRef.current = { x: e.clientX, y: e.clientY }
      return
    }

    if (e.button === 0) {
      const worldPos = screenToWorld(screenX, screenY)
      const hitPiece = rendererRef.current.hitTest(pieces, worldPos.x, worldPos.y)

      const isModifierPressed = e.ctrlKey || e.metaKey || e.shiftKey

      if (hitPiece) {
        // CASE 1: Holding Ctrl / Cmd / Shift -> Toggle Piece / Cluster in Multi-Selection
        if (isModifierPressed) {
          const clusterPieceIds = pieces
            .filter((p) => p.clusterId === hitPiece.clusterId && !p.inTray)
            .map((p) => p.id)

          setSelectedPieceIds((prev) => {
            const next = new Set(prev)
            const isAlreadySelected = clusterPieceIds.some((id) => next.has(id))
            if (isAlreadySelected) {
              clusterPieceIds.forEach((id) => next.delete(id))
              audioEngine.playDrop()
            } else {
              clusterPieceIds.forEach((id) => next.add(id))
              audioEngine.playPickup()
            }
            return next
          })
          return
        }

        // CASE 2: Clicked on a piece that is already part of the multi-selected group -> Drag entire group
        if (selectedPieceIds.has(hitPiece.id)) {
          isDraggingGroupRef.current = true
          activeClusterRef.current = hitPiece.clusterId
          dragStartPosRef.current = worldPos

          // Calculate exact relative offset from click point to ALL selected pieces
          const offsets = new Map<number, { relX: number; relY: number }>()
          for (const p of pieces) {
            if (selectedPieceIds.has(p.id)) {
              offsets.set(p.id, {
                relX: p.x - worldPos.x,
                relY: p.y - worldPos.y,
              })
            }
          }
          dragOffsetsRef.current = offsets

          highestZIndexRef.current += 10
          const newZ = highestZIndexRef.current
          setPieces((prev) =>
            prev.map((p) =>
              selectedPieceIds.has(p.id) ? { ...p, zIndex: newZ } : p
            )
          )

          audioEngine.playPickup()
          return
        }

        // CASE 3: Clicked on an unselected piece -> Clear selection and drag normally
        setSelectedPieceIds(new Set())

        activeClusterRef.current = hitPiece.clusterId
        dragStartPosRef.current = worldPos

        // Calculate exact relative offset from click point to every piece in cluster
        const offsets = new Map<number, { relX: number; relY: number }>()
        for (const p of pieces) {
          if (p.clusterId === hitPiece.clusterId) {
            offsets.set(p.id, {
              relX: p.x - worldPos.x,
              relY: p.y - worldPos.y,
            })
          }
        }
        dragOffsetsRef.current = offsets

        highestZIndexRef.current += 10
        const newZ = highestZIndexRef.current
        setPieces((prev) =>
          prev.map((p) =>
            p.clusterId === hitPiece.clusterId ? { ...p, zIndex: newZ } : p
          )
        )

        audioEngine.playPickup()
      } else {
        // CASE 4: Clicked on empty table canvas -> Start Marquee Box Selection
        marqueeInitialSelectionRef.current = isModifierPressed
          ? new Set(selectedPieceIds)
          : new Set()

        if (!isModifierPressed) {
          setSelectedPieceIds(new Set())
        }

        marqueeBoxRef.current = {
          x1: worldPos.x,
          y1: worldPos.y,
          x2: worldPos.x,
          y2: worldPos.y,
        }
      }
    }
  }

  // Instantly pop piece from tray to an open, non-overlapping spot on the table
  const handlePopPiece = useCallback(
    (pieceId: number) => {
      if (isAutoSolving) return
      audioEngine.playPickup()

      setPieces((prev) => {
        const targetPiece = prev.find((p) => p.id === pieceId)
        if (!targetPiece) return prev

        const tablePieces = prev.filter((p) => !p.inTray)
        const openSlot = ClusterManager.findNextOpenSlot(
          tablePieces,
          puzzle.boardWidth,
          puzzle.boardHeight,
          targetPiece.width,
          targetPiece.height
        )

        highestZIndexRef.current += 10
        const newZ = highestZIndexRef.current

        const nextPieces = prev.map((p) =>
          p.id === pieceId
            ? {
                ...p,
                inTray: false,
                x: openSlot.x,
                y: openSlot.y,
                zIndex: newZ,
              }
            : p
        )

        const groups = ClusterManager.getClusterGroups(nextPieces)
        const largestClusterSize = Math.max(
          ...Object.values(groups).map((g) => g.length),
          1
        )

        onUpdatePuzzle({
          ...puzzle,
          pieces: nextPieces,
          elapsedTime,
          movesCount,
          snapCount,
          placedPieces: largestClusterSize,
          updatedAt: new Date().toISOString(),
        })

        return nextPieces
      })
    },
    [isAutoSolving, puzzle, elapsedTime, movesCount, snapCount, onUpdatePuzzle]
  )

  // Seamless Direct Drag-and-Drop from Tray
  const handleStartDragFromTray = (pieceId: number, clientX: number, clientY: number) => {
    if (isAutoSolving || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const screenX = clientX - rect.left
    const screenY = clientY - rect.top
    const worldPos = screenToWorld(screenX, screenY)

    const targetPiece = pieces.find((p) => p.id === pieceId)
    if (!targetPiece) return

    draggedFromTrayRef.current = {
      pieceId,
      startClientX: clientX,
      startClientY: clientY,
      moved: false,
    }

    setSelectedPieceIds(new Set())
    highestZIndexRef.current += 10
    const newZ = highestZIndexRef.current

    // Center piece directly under cursor with strict offset lock
    const offsets = new Map<number, { relX: number; relY: number }>()
    offsets.set(targetPiece.id, {
      relX: -targetPiece.width / 2,
      relY: -targetPiece.height / 2,
    })
    dragOffsetsRef.current = offsets

    // Spawn piece under cursor in world coordinates and begin dragging
    setPieces((prev) =>
      prev.map((p) =>
        p.id === pieceId
          ? {
              ...p,
              inTray: false,
              x: worldPos.x - p.width / 2,
              y: worldPos.y - p.height / 2,
              zIndex: newZ,
            }
          : p
      )
    )

    activeClusterRef.current = targetPiece.clusterId
    dragStartPosRef.current = worldPos
    audioEngine.playPickup()
  }

  // Handle Mouse Move (Window-level for smooth tracking outside canvas boundaries)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isAutoSolving) return
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()

      // Track drag distance from tray
      if (draggedFromTrayRef.current && !draggedFromTrayRef.current.moved) {
        const dist = Math.hypot(
          e.clientX - draggedFromTrayRef.current.startClientX,
          e.clientY - draggedFromTrayRef.current.startClientY
        )
        if (dist > 6) {
          draggedFromTrayRef.current.moved = true
        }
      }

      // Canvas Panning
      if (isPanningRef.current && panStartRef.current) {
        const dx = e.clientX - panStartRef.current.x
        const dy = e.clientY - panStartRef.current.y
        panStartRef.current = { x: e.clientX, y: e.clientY }

        setViewport((prev) => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }))
        return
      }

      const screenX = e.clientX - rect.left
      const screenY = e.clientY - rect.top
      const currentWorldPos = screenToWorld(screenX, screenY)

      // Marquee Box Dragging
      if (marqueeBoxRef.current !== null) {
        marqueeBoxRef.current.x2 = currentWorldPos.x
        marqueeBoxRef.current.y2 = currentWorldPos.y

        const minX = Math.min(marqueeBoxRef.current.x1, marqueeBoxRef.current.x2)
        const maxX = Math.max(marqueeBoxRef.current.x1, marqueeBoxRef.current.x2)
        const minY = Math.min(marqueeBoxRef.current.y1, marqueeBoxRef.current.y2)
        const maxY = Math.max(marqueeBoxRef.current.y1, marqueeBoxRef.current.y2)

        const newlySelected = new Set<number>(marqueeInitialSelectionRef.current)
        for (const p of pieces) {
          if (!p.inTray) {
            const pCenterX = p.x + p.width / 2
            const pCenterY = p.y + p.height / 2
            const overlaps =
              p.x < maxX &&
              p.x + p.width > minX &&
              p.y < maxY &&
              p.y + p.height > minY
            if (
              overlaps ||
              (pCenterX >= minX && pCenterX <= maxX && pCenterY >= minY && pCenterY <= maxY)
            ) {
              newlySelected.add(p.id)
            }
          }
        }
        setSelectedPieceIds(newlySelected)
        return
      }

      // Piece & Multi-Piece Dragging (Strict 1-to-1 position tracking relative to cursor)
      if (dragOffsetsRef.current.size > 0) {
        setPieces((prev) =>
          prev.map((p) => {
            const offset = dragOffsetsRef.current.get(p.id)
            if (offset) {
              return {
                ...p,
                x: currentWorldPos.x + offset.relX,
                y: currentWorldPos.y + offset.relY,
              }
            }
            return p
          })
        )
      }
    }

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isPanningRef.current) {
        isPanningRef.current = false
        panStartRef.current = null
      }

      if (marqueeBoxRef.current !== null) {
        marqueeBoxRef.current = null
        if (selectedPieceIds.size > 0) {
          audioEngine.playPickup()
        }
      }

      // Handle Quick-Click Pop vs Direct Drag from Tray
      if (draggedFromTrayRef.current) {
        const { pieceId, moved } = draggedFromTrayRef.current
        const targetPiece = pieces.find((p) => p.id === pieceId)

        if (!moved && targetPiece) {
          // QUICK CLICK: Pop to side of image cleanly!
          setPieces((prev) => {
            const tablePieces = prev.filter((p) => !p.inTray && p.id !== pieceId)
            const openSlot = ClusterManager.findNextOpenSlot(
              tablePieces,
              puzzle.boardWidth,
              puzzle.boardHeight,
              targetPiece.width,
              targetPiece.height
            )
            return prev.map((p) =>
              p.id === pieceId
                ? { ...p, inTray: false, x: openSlot.x, y: openSlot.y }
                : p
            )
          })
          audioEngine.playPickup()
          dragOffsetsRef.current.clear()
          activeClusterRef.current = null
          dragStartPosRef.current = null
          draggedFromTrayRef.current = null
          return
        }

        if (e.clientY > window.innerHeight - 130) {
          // Dragged and released back inside tray dock: return to tray
          setPieces((prev) =>
            prev.map((p) =>
              p.id === pieceId ? { ...p, inTray: true, x: 0, y: 0 } : p
            )
          )
          audioEngine.playTrayToggle()
          dragOffsetsRef.current.clear()
          activeClusterRef.current = null
          dragStartPosRef.current = null
          draggedFromTrayRef.current = null
          return
        }
        draggedFromTrayRef.current = null
      }

      if (dragOffsetsRef.current.size > 0) {
        audioEngine.playDrop()

        let totalSnapped = 0
        let isSolved = false

        if (isDraggingGroupRef.current) {
          // Check multi-piece cascading snap for every piece in the dragged group
          for (const pieceId of selectedPieceIds) {
            const targetPiece = pieces.find((p) => p.id === pieceId)
            if (targetPiece) {
              const res = ClusterManager.checkSnap(
                pieces,
                targetPiece.clusterId,
                settings.snapSensitivity
              )
              if (res.hasSnapped) {
                totalSnapped += res.snappedCount
                rendererRef.current.triggerSnapFlash(targetPiece.clusterId)
              }
              if (res.isFullySolved) isSolved = true
            }
          }
          isDraggingGroupRef.current = false
        } else if (activeClusterRef.current !== null) {
          const snapResult = ClusterManager.checkSnap(
            pieces,
            activeClusterRef.current,
            settings.snapSensitivity
          )
          if (snapResult.hasSnapped) {
            totalSnapped += snapResult.snappedCount
            rendererRef.current.triggerSnapFlash(activeClusterRef.current)
          }
          if (snapResult.isFullySolved) isSolved = true
        }

        if (totalSnapped > 0) {
          audioEngine.playSnap()
          setSnapCount((prev) => prev + totalSnapped)
        }

        setMovesCount((prev) => prev + 1)

        const progress = ClusterManager.calculateProgress(pieces)
        const groups = ClusterManager.getClusterGroups(pieces)
        const largestClusterSize = Math.max(
          ...Object.values(groups).map((g) => g.length),
          1
        )

        const updatedSave: PuzzleSave = {
          ...puzzle,
          pieces,
          elapsedTime,
          movesCount: movesCount + 1,
          snapCount: snapCount + totalSnapped,
          placedPieces: largestClusterSize,
          updatedAt: new Date().toISOString(),
        }
        onUpdatePuzzle(updatedSave)

        if (isSolved) {
          audioEngine.playVictory()
          const accuracy = Math.round(
            (pieces.length / Math.max(movesCount + 1, pieces.length)) * 100
          )
          onVictory({
            solveTime: elapsedTime,
            moves: movesCount + 1,
            accuracy: Math.min(100, Math.max(10, accuracy)),
          })
        }

        dragOffsetsRef.current.clear()
        activeClusterRef.current = null
        dragStartPosRef.current = null
      }
    }

    window.addEventListener('mousemove', handleGlobalMouseMove)
    window.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove)
      window.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [
    isAutoSolving,
    pieces,
    viewport,
    settings.snapSensitivity,
    puzzle,
    elapsedTime,
    movesCount,
    snapCount,
    selectedPieceIds,
    onUpdatePuzzle,
    onVictory,
    screenToWorld,
  ])

  // Handle Mouse Wheel: Zoom anchored to cursor, or Shift+Scroll to Pan Horizontally (Left/Right)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    // Shift + Scroll: Pan left / right
    if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const panDelta = e.shiftKey ? (e.deltaY || e.deltaX) : e.deltaX
      setViewport((prev) => ({
        ...prev,
        x: prev.x - panDelta * 1.2,
      }))
      return
    }

    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // World coordinate under cursor before zoom: P_world = (P_screen - T) / s
    const wx = (mouseX - viewport.x) / viewport.scale
    const wy = (mouseY - viewport.y) / viewport.scale

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89
    const newScale = Math.min(Math.max(viewport.scale * zoomFactor, 0.25), 3.0)

    // New translation: T_new = P_screen - P_world * s_new
    const newX = mouseX - wx * newScale
    const newY = mouseY - wy * newScale

    setViewport({ x: newX, y: newY, scale: newScale })
  }

  // Smooth Click-to-Locate PiP Navigation
  const handleLocateBoardRegion = (normX: number, normY: number) => {
    if (!canvasRef.current) return
    const { clientWidth, clientHeight } = canvasRef.current
    const targetBoardX = normX * puzzle.boardWidth
    const targetBoardY = normY * puzzle.boardHeight

    // Center viewport on that board point
    const newX = clientWidth / 2 - targetBoardX * viewport.scale
    const newY = clientHeight / 2 - targetBoardY * viewport.scale

    setViewport((prev) => ({ ...prev, x: newX, y: newY }))
  }

  // Rotate single cluster around centroid
  const handleRotate = useCallback(() => {
    if (!puzzle.rotationEnabled || isAutoSolving) return

    const targetClusterId = activeClusterRef.current
    if (targetClusterId !== null) {
      audioEngine.playRotate()
      setPieces((prev) => {
        const next = [...prev]
        ClusterManager.rotateCluster(next, targetClusterId)
        return next
      })
    }
  }, [puzzle.rotationEnabled, isAutoSolving])

  // Rotate Multi-Selected Group of Pieces around mutual centroid
  const handleRotateGroup = useCallback(() => {
    if (!puzzle.rotationEnabled || isAutoSolving || selectedPieceIds.size === 0) return

    audioEngine.playRotate()

    setPieces((prev) => {
      const selectedPieces = prev.filter((p) => selectedPieceIds.has(p.id))
      if (selectedPieces.length === 0) return prev

      // Calculate mutual center
      const avgX =
        selectedPieces.reduce((sum, p) => sum + p.x + p.width / 2, 0) / selectedPieces.length
      const avgY =
        selectedPieces.reduce((sum, p) => sum + p.y + p.height / 2, 0) / selectedPieces.length

      return prev.map((p) => {
        if (!selectedPieceIds.has(p.id)) return p

        const curCenterX = p.x + p.width / 2
        const curCenterY = p.y + p.height / 2

        const dx = curCenterX - avgX
        const dy = curCenterY - avgY

        // 90° Clockwise Rotation: (dx, dy) -> (-dy, dx)
        const newCenterX = avgX - dy
        const newCenterY = avgY + dx

        return {
          ...p,
          x: newCenterX - p.width / 2,
          y: newCenterY - p.height / 2,
          rotation: (p.rotation + 90) % 360,
        }
      })
    })
  }, [puzzle.rotationEnabled, isAutoSolving, selectedPieceIds])

  // Tidy Multi-Selected Pieces into a clean rectangular grid
  const handleTidyGroup = useCallback(() => {
    if (selectedPieceIds.size === 0) return

    audioEngine.playDrop()

    setPieces((prev) => {
      const selected = prev.filter((p) => selectedPieceIds.has(p.id))
      if (selected.length === 0) return prev

      const count = selected.length
      const cols = Math.ceil(Math.sqrt(count))
      const margin = 20

      // Position grid to the right of board or current group position
      const startX = selected[0].x
      const startY = selected[0].y
      const pW = selected[0].width
      const pH = selected[0].height

      let index = 0
      const positionMap = new Map<number, { x: number; y: number }>()

      for (const p of selected) {
        const col = index % cols
        const row = Math.floor(index / cols)
        positionMap.set(p.id, {
          x: startX + col * (pW + margin),
          y: startY + row * (pH + margin),
        })
        index++
      }

      return prev.map((p) => {
        const pos = positionMap.get(p.id)
        if (pos) {
          return { ...p, x: pos.x, y: pos.y }
        }
        return p
      })
    })
  }, [selectedPieceIds])

  // Send Multi-Selected Pieces back to Organizer Tray
  const handleSendSelectedToTray = useCallback(() => {
    if (selectedPieceIds.size === 0) return

    audioEngine.playTrayToggle()

    setPieces((prev) =>
      prev.map((p) =>
        selectedPieceIds.has(p.id)
          ? {
              ...p,
              inTray: true,
              isLockedToBoard: false,
              x: 0,
              y: 0,
            }
          : p
      )
    )

    setSelectedPieceIds(new Set())
  }, [selectedPieceIds])

  // Smart Hint & Target Slot Locator
  const handleTriggerHint = useCallback(() => {
    if (isAutoSolving) return

    // Priority 1: If user has a piece selected, hint that piece!
    let candidate: PuzzlePiece | undefined = undefined

    if (selectedPieceIds.size > 0) {
      candidate = pieces.find(
        (p) => selectedPieceIds.has(p.id) && !p.isLockedToBoard
      )
    }

    // Priority 2: Unlocked Corners
    if (!candidate) {
      const unlockedCorners = pieces.filter((p) => !p.isLockedToBoard && p.isCorner)
      if (unlockedCorners.length > 0) {
        candidate = unlockedCorners[0]
      }
    }

    // Priority 3: Unlocked Edges
    if (!candidate) {
      const unlockedEdges = pieces.filter((p) => !p.isLockedToBoard && p.isEdge)
      if (unlockedEdges.length > 0) {
        candidate = unlockedEdges[0]
      }
    }

    // Priority 4: Cluster Neighbors (Expand placed pieces outward organically)
    if (!candidate) {
      const placedPieces = pieces.filter((p) => p.isLockedToBoard)
      if (placedPieces.length > 0) {
        const neighbor = pieces.find((p) => {
          if (p.isLockedToBoard) return false
          return placedPieces.some(
            (pl) => Math.abs(pl.gridRow - p.gridRow) + Math.abs(pl.gridCol - p.gridCol) === 1
          )
        })
        if (neighbor) {
          candidate = neighbor
        }
      }
    }

    // Priority 5: Any remaining unplaced Center piece
    if (!candidate) {
      const unplaced = pieces.filter((p) => !p.isLockedToBoard)
      if (unplaced.length > 0) {
        candidate = unplaced[0]
      }
    }

    if (!candidate) return

    // If piece is in tray, ensure tray is expanded so player can see it
    if (candidate.inTray && !isTrayOpen) {
      setIsTrayOpen(true)
    }

    setHintedPiece(candidate)
    audioEngine.playHint()

    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current)
    }
    hintTimerRef.current = setTimeout(() => {
      setHintedPiece(null)
    }, 5000)
  }, [isAutoSolving, selectedPieceIds, pieces, isTrayOpen])

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = true
      }
      if (e.code === 'KeyR') {
        if (selectedPieceIds.size > 0) {
          handleRotateGroup()
        } else {
          handleRotate()
        }
      }
      if (e.code === 'KeyH') {
        handleTriggerHint()
      }
      if (e.code === 'KeyT') {
        setIsTrayOpen((prev) => !prev)
        audioEngine.playTrayToggle()
      }
      if (e.code === 'Backspace' || e.code === 'Delete') {
        if (selectedPieceIds.size > 0) {
          handleSendSelectedToTray()
        }
      }
      if (e.code === 'Escape') {
        setSelectedPieceIds(new Set())
        setHintedPiece(null)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleRotate, handleRotateGroup, handleSendSelectedToTray, handleTriggerHint, selectedPieceIds])

  // Animated Auto-Complete with full intact assembly
  const handleAutoComplete = () => {
    if (isAutoSolving) return
    setIsAutoSolving(true)
    audioEngine.playPickup()
    setSelectedPieceIds(new Set())

    const startPieces = pieces.map((p) => ({
      id: p.id,
      startX: p.inTray ? puzzle.boardWidth / 2 : p.x,
      startY: p.inTray ? puzzle.boardHeight / 2 : p.y,
      startRot: p.rotation,
      targetX: p.targetX,
      targetY: p.targetY,
    }))

    const startTime = performance.now()
    const duration = 1400

    let lastSnapAudio = 0

    const animateSolve = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(1.0, elapsed / duration)
      const ease = 1 - Math.pow(1 - progress, 3)

      if (now - lastSnapAudio > 180 && progress < 0.9) {
        audioEngine.playSnap()
        lastSnapAudio = now
      }

      setPieces((prev) =>
        prev.map((p) => {
          const start = startPieces.find((s) => s.id === p.id)!
          const currentX = start.startX + (start.targetX - start.startX) * ease
          const currentY = start.startY + (start.targetY - start.startY) * ease
          const currentRot = progress > 0.6 ? 0 : start.startRot

          return {
            ...p,
            inTray: false,
            clusterId: 0,
            isLockedToBoard: true,
            rotation: currentRot,
            x: currentX,
            y: currentY,
          }
        })
      )

      if (progress < 1.0) {
        requestAnimationFrame(animateSolve)
      } else {
        setIsAutoSolving(false)
        audioEngine.playVictory()
        onVictory({
          solveTime: elapsedTime,
          moves: movesCount + 1,
          accuracy: 100,
        })
      }
    }

    requestAnimationFrame(animateSolve)
  }

  // Scatter current active tab pieces on tabletop in outer perimeter margin lanes
  const handleScatterTab = (tab: TrayFilter) => {
    audioEngine.playPickup()
    const piecesToScatter = pieces.filter((p) => {
      if (!p.inTray) return false
      if (tab === 'all') return true
      if (tab === 'corners') return p.isCorner
      if (tab === 'edges') return p.isEdge && !p.isCorner
      if (tab === 'centers') return !p.isEdge
      return true
    })

    if (piecesToScatter.length === 0) return

    const positions = ClusterManager.calculatePerimeterScatter(
      piecesToScatter,
      puzzle.boardWidth,
      puzzle.boardHeight,
      pieces[0]?.width || 60,
      pieces[0]?.height || 60
    )

    setPieces((prev) =>
      prev.map((p) => {
        const pos = positions.get(p.id)
        if (pos) {
          return {
            ...p,
            inTray: false,
            x: pos.x,
            y: pos.y,
          }
        }
        return p
      })
    )
  }

  // Tidy current tab pieces back into organizer tray
  const handleTidyTab = (tab: TrayFilter) => {
    audioEngine.playTrayToggle()
    const groups = ClusterManager.getClusterGroups(pieces)

    setPieces((prev) =>
      prev.map((p) => {
        // Only return loose, un-snapped (cluster size 1), ungrounded pieces
        if (!p.inTray && !p.isLockedToBoard && groups[p.clusterId]?.length === 1) {
          let matches = false
          if (tab === 'all') matches = true
          else if (tab === 'corners') matches = p.isCorner
          else if (tab === 'edges') matches = p.isEdge && !p.isCorner
          else if (tab === 'centers') matches = !p.isEdge

          if (matches) {
            return { ...p, inTray: true }
          }
        }
        return p
      })
    )
  }

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const worldPos = screenToWorld(screenX, screenY)
    const hitPiece = rendererRef.current.hitTest(pieces, worldPos.x, worldPos.y)
    if (hitPiece) {
      setInspectingPiece(hitPiece)
      audioEngine.playPickup()
    }
  }

  const dsuProgress = ClusterManager.calculateProgress(pieces)
  const remainingCount = pieces.filter((p) => p.inTray || !p.isLockedToBoard).length
  const placedCount = pieces.length - remainingCount

  return (
    <div className="relative w-full h-full overflow-hidden bg-surface-container select-none">
      {/* Floating HUD Controls with Interactive PiP & Telemetry */}
      <CanvasHUD
        title={puzzle.title}
        imageSrc={puzzle.imageSrc}
        totalPieces={puzzle.totalPieces}
        placedPieces={placedCount}
        progressPct={dsuProgress}
        elapsedTime={elapsedTime}
        zoomLevel={viewport.scale}
        settings={settings}
        onUpdateSettings={onUpdateSettings}
        onZoomIn={() =>
          setViewport((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3.0) }))
        }
        onZoomOut={() =>
          setViewport((prev) => ({ ...prev, scale: Math.max(prev.scale * 0.8, 0.25) }))
        }
        onResetZoom={centerBoard}
        onSaveAndExit={onBackToLibrary}
        onAutoComplete={handleAutoComplete}
        onLocateBoardRegion={handleLocateBoardRegion}
        onHint={handleTriggerHint}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={onToggleSidebar}
      />

      {/* Floating Multi-Selection Actions Pill */}
      <SelectionHUD
        selectedCount={selectedPieceIds.size}
        rotationEnabled={puzzle.rotationEnabled}
        onTidyGroup={handleTidyGroup}
        onRotateGroup={handleRotateGroup}
        onSendToTray={handleSendSelectedToTray}
        onDeselect={() => setSelectedPieceIds(new Set())}
      />

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onContextMenu={handleContextMenu}
        onWheel={handleWheel}
        onDoubleClick={handleRotate}
        className={`w-full h-full block touch-none ${
          isSpacePressedRef.current ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        }`}
      />

      {/* High-Performance Piece Organizer Tray with Direct Drag-and-Drop */}
      <PieceTray
        pieces={pieces}
        isOpen={isTrayOpen}
        hintedPieceId={hintedPiece?.id ?? null}
        getPieceSprite={(id) => rendererRef.current.getPieceSprite(id)}
        onToggleOpen={() => {
          setIsTrayOpen(!isTrayOpen)
          audioEngine.playTrayToggle()
        }}
        onPopPiece={handlePopPiece}
        onInspectPiece={(piece) => setInspectingPiece(piece)}
        onStartDragPiece={handleStartDragFromTray}
        onScatterTab={handleScatterTab}
        onTidyTab={handleTidyTab}
        isSidebarCollapsed={isSidebarCollapsed}
      />

      {/* Piece Inspection Pop-Up Card */}
      <PieceInspectModal
        piece={inspectingPiece ? pieces.find((p) => p.id === inspectingPiece.id) || null : null}
        rotationEnabled={puzzle.rotationEnabled}
        getPieceSprite={(id) => rendererRef.current.getPieceSprite(id)}
        onClose={() => setInspectingPiece(null)}
        onToggleTray={(pieceId) => {
          const target = pieces.find((p) => p.id === pieceId)
          if (target?.inTray) {
            handlePopPiece(pieceId)
          } else {
            setPieces((prev) =>
              prev.map((p) =>
                p.id === pieceId
                  ? { ...p, inTray: true, isLockedToBoard: false, x: 0, y: 0 }
                  : p
              )
            )
            audioEngine.playTrayToggle()
          }
        }}
        onRotate={(pieceId) => {
          audioEngine.playRotate()
          setPieces((prev) =>
            prev.map((p) =>
              p.id === pieceId ? { ...p, rotation: (p.rotation + 90) % 360 } : p
            )
          )
        }}
      />
    </div>
  )
}
