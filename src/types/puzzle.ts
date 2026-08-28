export type PuzzleCutStyle = 'classic' | 'geometric' | 'ribbon'

export type TableSurface = 'felt' | 'walnut' | 'cutting-mat' | 'slate'

export type SnapSensitivity = 'low' | 'medium' | 'high' | 'snappy'

export interface PieceEdges {
  top: number    // 0: straight, 1: tab out, -1: blank in
  right: number  // 0: straight, 1: tab out, -1: blank in
  bottom: number // 0: straight, 1: tab out, -1: blank in
  left: number   // 0: straight, 1: tab out, -1: blank in
}

export interface EdgeJitter {
  tabSize: number       // height/depth scale factor
  tabOffset: number     // center offset along edge (-0.1 to 0.1)
  neckWidth: number     // width of tab base
  headWidth: number     // width of rounded head
}

export interface PieceEdgeData {
  shape: number // 0, 1, -1
  jitter: EdgeJitter
}

export interface PieceJitterProfile {
  top: PieceEdgeData
  right: PieceEdgeData
  bottom: PieceEdgeData
  left: PieceEdgeData
}

export interface PuzzlePiece {
  id: number
  gridRow: number
  gridCol: number
  x: number // Current position on table canvas (top-left of piece cell)
  y: number
  targetX: number // Target solved position on table canvas
  targetY: number
  width: number
  height: number
  rotation: number // 0, 90, 180, 270
  clusterId: number // Disjoint set parent / cluster ID
  inTray: boolean // Whether the piece is in the organizer tray
  isLockedToBoard: boolean // Grounded and locked to board grid
  isEdge: boolean
  isCorner: boolean
  edges: PieceEdges
  jitterProfile: PieceJitterProfile
  colorKey: string // hex code or hue name for sorting
  zIndex: number
}

export interface PuzzleSave {
  id: string
  title: string
  thumbnailUrl: string
  imageSrc: string
  imageWidth: number
  imageHeight: number
  boardWidth: number
  boardHeight: number
  rows: number
  cols: number
  totalPieces: number
  placedPieces: number
  pieces: PuzzlePiece[]
  clusters: Record<number, number[]> // clusterId -> pieceIds
  rotationEnabled: boolean
  cutStyle: PuzzleCutStyle
  elapsedTime: number // in seconds
  movesCount: number
  snapCount: number
  status: 'in-progress' | 'completed'
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface UserSettings {
  musicVolume: number // 0 - 100
  sfxVolume: number   // 0 - 100
  snapSensitivity: SnapSensitivity
  dragInertia: boolean
  tableSurface: TableSurface
  edgeHighlight: number // 0 - 100
  showGhostOverlay: boolean
  ghostOpacity: number // 0 - 100
  allowAutoComplete: boolean
  seamlessBlending: boolean
}

export interface ViewportTransform {
  x: number
  y: number
  scale: number
}

export type ActiveNavTab = 'library' | 'workspace' | 'history' | 'settings'

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => Promise<void>
      maximize: () => Promise<void>
      close: () => Promise<void>
      isMaximized: () => Promise<boolean>
      onWindowStateChanged: (callback: (isMaximized: boolean) => void) => () => void
      openImageDialog: () => Promise<{ filePath: string; fileName: string; dataUrl: string } | null>
      saveGame: (id: string, data: any) => Promise<{ success: boolean; error?: string }>
      loadSaves: () => Promise<any[]>
      deleteSave: (id: string) => Promise<{ success: boolean; error?: string }>
      exportSave: (id: string, data: any) => Promise<{ success: boolean; canceled?: boolean; filePath?: string }>
      importSave: () => Promise<any | null>
      clearCache: () => Promise<{ success: boolean; error?: string }>
    }
  }
}
