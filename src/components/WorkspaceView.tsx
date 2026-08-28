import React, { useRef, useEffect, useState, useCallback } from 'react'
import { PuzzlePiece, PuzzleSave, UserSettings, ViewportTransform } from '../types/puzzle'
import { CanvasRenderer } from '../engine/CanvasRenderer'
import { ClusterManager } from '../engine/ClusterManager'
import { audioEngine } from '../engine/AudioEngine'
import { CanvasHUD } from './CanvasHUD'
import { PieceTray, TrayFilter } from './PieceTray'

interface WorkspaceViewProps {
  puzzle: PuzzleSave
  settings: UserSettings
  onUpdatePuzzle: (updated: PuzzleSave) => void
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void
  onVictory: (finalStats: { solveTime: number; moves: number; accuracy: number }) => void
  onBackToLibrary: () => void
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  puzzle,
  settings,
  onUpdatePuzzle,
  onUpdateSettings,
  onVictory,
  onBackToLibrary,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rendererRef = useRef<CanvasRenderer>(new CanvasRenderer())

  const [pieces, setPieces] = useState<PuzzlePiece[]>(puzzle.pieces)
  const [elapsedTime, setElapsedTime] = useState<number>(puzzle.elapsedTime)
  const [movesCount, setMovesCount] = useState<number>(puzzle.movesCount)
  const [snapCount, setSnapCount] = useState<number>(puzzle.snapCount)
  const [isTrayOpen, setIsTrayOpen] = useState<boolean>(true) // Open by default for easy piece pickup
  const [borderFilterActive, setBorderFilterActive] = useState<boolean>(false)
  const [isAutoSolving, setIsAutoSolving] = useState<boolean>(false)

  // Viewport transformation state (World translation and zoom scale)
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 100,
    y: 100,
    scale: 0.85,
  })

  // Dragging & Interaction refs
  const activeClusterRef = useRef<number | null>(null)
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null)
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

  // Initialize Canvas Renderer Sprites
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
  }, [puzzle.imageSrc, puzzle.boardWidth, puzzle.boardHeight, puzzle.pieces, centerBoard])

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
            borderFilterActive
          )
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop)
    }

    renderLoop()

    return () => cancelAnimationFrame(animationFrameId)
  }, [viewport, pieces, puzzle.boardWidth, puzzle.boardHeight, settings, borderFilterActive])

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

      if (hitPiece) {
        activeClusterRef.current = hitPiece.clusterId
        dragStartPosRef.current = worldPos

        highestZIndexRef.current += 10
        const newZ = highestZIndexRef.current
        setPieces((prev) =>
          prev.map((p) =>
            p.clusterId === hitPiece.clusterId ? { ...p, zIndex: newZ } : p
          )
        )

        audioEngine.playPickup()
      }
    }
  }

  // Seamless Direct Drag-and-Drop from Tray
  const handleStartDragFromTray = (pieceId: number, clientX: number, clientY: number) => {
    if (isAutoSolving || !canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const screenX = clientX - rect.left
    const screenY = clientY - rect.top
    const worldPos = screenToWorld(screenX, screenY)

    const targetPiece = pieces.find((p) => p.id === pieceId)
    if (!targetPiece) return

    highestZIndexRef.current += 10
    const newZ = highestZIndexRef.current

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

      // Piece Dragging
      if (activeClusterRef.current !== null && dragStartPosRef.current) {
        const screenX = e.clientX - rect.left
        const screenY = e.clientY - rect.top
        const currentWorldPos = screenToWorld(screenX, screenY)

        const dx = currentWorldPos.x - dragStartPosRef.current.x
        const dy = currentWorldPos.y - dragStartPosRef.current.y
        dragStartPosRef.current = currentWorldPos

        setPieces((prev) => {
          const next = [...prev]
          ClusterManager.moveCluster(next, activeClusterRef.current!, dx, dy)
          return next
        })
      }
    }

    const handleGlobalMouseUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false
        panStartRef.current = null
      }

      if (activeClusterRef.current !== null) {
        audioEngine.playDrop()

        const snapResult = ClusterManager.checkSnap(
          pieces,
          activeClusterRef.current,
          settings.snapSensitivity
        )

        if (snapResult.hasSnapped) {
          audioEngine.playSnap()
          rendererRef.current.triggerSnapFlash(activeClusterRef.current)
          setSnapCount((prev) => prev + snapResult.snappedCount)
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
          snapCount: snapCount + (snapResult.hasSnapped ? snapResult.snappedCount : 0),
          placedPieces: largestClusterSize,
          updatedAt: new Date().toISOString(),
        }
        onUpdatePuzzle(updatedSave)

        if (snapResult.isFullySolved) {
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
    onUpdatePuzzle,
    onVictory,
    screenToWorld,
  ])

  // Handle Mouse Wheel Zoom (Anchored precisely to cursor position)
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

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

  // Rotate cluster around centroid
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

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = true
      }
      if (e.code === 'KeyR') {
        handleRotate()
      }
      if (e.code === 'KeyT') {
        setIsTrayOpen((prev) => !prev)
        audioEngine.playTrayToggle()
      }
      if (e.code === 'KeyB') {
        setBorderFilterActive((prev) => !prev)
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
  }, [handleRotate])

  // Animated Auto-Complete with full intact assembly
  const handleAutoComplete = () => {
    if (isAutoSolving) return
    setIsAutoSolving(true)
    audioEngine.playPickup()

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
        const solvedPieces: PuzzlePiece[] = puzzle.pieces.map((p) => ({
          ...p,
          inTray: false,
          clusterId: 0,
          isLockedToBoard: true,
          rotation: 0,
          x: p.targetX,
          y: p.targetY,
        }))

        setPieces(solvedPieces)
        rendererRef.current.triggerSnapFlash(0)
        audioEngine.playVictory()
        setIsAutoSolving(false)

        const finalSave: PuzzleSave = {
          ...puzzle,
          pieces: solvedPieces,
          status: 'completed',
          placedPieces: puzzle.totalPieces,
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        onUpdatePuzzle(finalSave)

        setTimeout(() => {
          onVictory({
            solveTime: elapsedTime,
            moves: movesCount + 1,
            accuracy: 100,
          })
        }, 350)
      }
    }

    requestAnimationFrame(animateSolve)
  }

  // Deterministic Non-Overlapping Perimeter Scatter for current active tab
  const handleScatterTab = (tab: TrayFilter) => {
    audioEngine.playTrayToggle()

    const trayPieces = pieces.filter((p) => {
      if (!p.inTray) return false
      if (tab === 'all') return true
      if (tab === 'corners') return p.isCorner
      if (tab === 'edges') return p.isEdge && !p.isCorner
      if (tab === 'centers') return !p.isEdge
      return true
    })

    if (trayPieces.length === 0) return

    const pieceW = pieces[0]?.width || 80
    const pieceH = pieces[0]?.height || 60

    const slotMap = ClusterManager.calculatePerimeterScatter(
      trayPieces,
      puzzle.boardWidth,
      puzzle.boardHeight,
      pieceW,
      pieceH
    )

    setPieces((prev) =>
      prev.map((p) => {
        const slot = slotMap.get(p.id)
        if (slot) {
          return {
            ...p,
            inTray: false,
            x: slot.x,
            y: slot.y,
            isLockedToBoard: false,
            zIndex: highestZIndexRef.current++,
          }
        }
        return p
      })
    )
  }

  // Scope-Aware Tidy for current active tab
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
        borderFilterActive={borderFilterActive}
        settings={settings}
        onToggleBorderFilter={() => setBorderFilterActive(!borderFilterActive)}
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
      />

      {/* Main Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
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
        onToggleOpen={() => {
          setIsTrayOpen(!isTrayOpen)
          audioEngine.playTrayToggle()
        }}
        onStartDragPiece={handleStartDragFromTray}
        onScatterTab={handleScatterTab}
        onTidyTab={handleTidyTab}
      />
    </div>
  )
}
