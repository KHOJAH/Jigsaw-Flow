# Jigsaw Flow

A desktop jigsaw puzzle application built with Electron, React, TypeScript, and HTML5 Canvas.

Transform any high-resolution image into an interactive jigsaw puzzle with parametric Bezier cuts, cluster snapping physics, board grounding, and procedural audio.

---

## Features

### Gameplay and Physics Engine
- **Parametric Bezier Cuts**: Slices images into interlocking tabs and blanks with mathematically symmetrical curves.
- **Disjoint-Set Union (DSU) Clustering**: Snapped pieces join into cohesive clusters that move and rotate together.
- **Board Grounding**: Pieces placed in their correct slots anchor permanently to the board.
- **Multi-Layer Rendering**: Dedicated rendering passes for tabletop surfaces, reference ghost overlays, grounded pieces, loose table pieces, and active drag selections.
- **Cursor-Anchored Pan and Zoom**: Smooth navigation that keeps the view focused on the cursor position.

### Piece Management and Workspace
- **Piece Tray**: Categorized tabs for All, Corners, Edges, and Centers with direct drag-and-drop onto the board.
- **Collapsible Sidebar**: Full-width workspace canvas with an adaptive piece tray dock.
- **Picture-in-Picture Navigator**: Floating reference card with click-to-locate navigation.
- **Light and Dark Themes**: High-contrast, theme-adaptive interface designed for both bright and dark environments.

### Audio and Storage
- **Procedural Audio**: Generates tactile clicks, snaps, and victory fanfares in real time using the Web Audio API without external sound files.
- **Local Persistence**: Automatic game saving with support for exporting and importing `.jigsaw` files.

---

## Controls and Shortcuts

| Action | Shortcut / Gesture |
| --- | --- |
| Pan Canvas | `Space + Drag` or `Middle Click + Drag` |
| Zoom In / Out | `Mouse Wheel` (cursor-anchored) |
| Rotate Piece / Cluster | `R` key or `Double Click` |
| Toggle Piece Tray | `T` key |
| Smart Hint | `H` key |
| Multi-Select | `Shift + Drag` (Marquee Selection) |
| Pick Up and Drag | `Left Click + Drag` |

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/KHOJAH/Jigsaw-Flow.git

# Navigate into the project directory
cd Jigsaw-Flow

# Install dependencies
npm install
```

### Development

```bash
# Start the development server with Electron window
npm run dev
```

### Production Build

```bash
# Build the application for production
npm run build
```

---

## Project Structure

```
├── electron/
│   ├── main.ts              # Electron main process and IPC handlers
│   └── preload.ts           # Context bridge API bindings
├── src/
│   ├── assets/              # Starter puzzles and static assets
│   ├── components/
│   │   ├── Titlebar.tsx     # Custom window header
│   │   ├── Sidebar.tsx      # App navigation drawer
│   │   ├── LibraryView.tsx  # Puzzle library and import dropzone
│   │   ├── ImportModal.tsx  # Image crop and piece configuration
│   │   ├── WorkspaceView.tsx# Canvas workspace and interaction layer
│   │   ├── PieceTray.tsx    # Piece organizer dock
│   │   ├── CanvasHUD.tsx    # Workspace HUD and controls
│   │   ├── PieceInspectModal.tsx # High-resolution piece preview
│   │   ├── VictoryModal.tsx # Completion dialog and stats
│   │   ├── SettingsModal.tsx# Audio and theme preferences
│   │   └── HistoryView.tsx  # Solved puzzle archives and statistics
│   ├── engine/
│   │   ├── JigsawGenerator.ts# Bezier slicing and piece geometry
│   │   ├── ClusterManager.ts # DSU hierarchy and cluster physics
│   │   ├── CanvasRenderer.ts # Canvas rendering pipeline
│   │   ├── AudioEngine.ts   # Web Audio sound generator
│   │   └── StorageService.ts# Local save file persistence
│   ├── types/
│   │   └── puzzle.ts        # TypeScript interfaces and types
│   ├── App.tsx              # Root application component
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind CSS styling and theme tokens
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## License

This project is licensed under the MIT License.