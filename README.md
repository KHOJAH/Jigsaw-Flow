# Jigsaw Flow 🧩

> **A professional, high-performance desktop jigsaw puzzle studio built with Electron, React, TypeScript, and WebGL/Canvas.**

Turn any high-resolution photo or artwork into an interactive jigsaw puzzle with authentic parametric Bézier cuts, realistic magnetic locking physics, solid board grounding, and tactile procedural audio.

---

## ✨ Features

### 🎮 Gameplay & Physics Engine
- **Parametric Bézier Jigsaw Slicing**: Slices images into interlocking tabs and blanks with mathematically symmetrical closed contours.
- **Disjoint-Set Union (DSU) Clustering**: Snapped pieces weld into cohesive physical clusters that move and rotate together as a single unit.
- **Solid Board Grounding**: Pieces snapped into their target slots permanently anchor to the board mat (`isLockedToBoard = true`), forming a solid solved foundation.
- **5-Layer Rendering Pipeline**:
  - *Layer 0 (Base)*: Tabletop surface (*Felt, Dark Walnut, Cutting Mat, Slate*) and board frame.
  - *Layer 1 (Ghost)*: Translucent reference image overlay with live opacity control.
  - *Layer 2 (Grounded)*: Board-locked pieces.
  - *Layer 3 (Table)*: Loose pieces and clusters on the virtual table.
  - *Layer 4 (Active Top)*: Currently dragged piece/cluster with elevated drop-shadow shaders.
- **Cursor-Anchored Pan & Zoom**: Smooth viewport navigation maintaining cursor focus:
  $$P_{\text{world}} = \frac{P_{\text{screen}} - \vec{T}}{s}, \quad \vec{T}_{\text{new}} = P_{\text{screen}} - P_{\text{world}} \cdot s_{\text{new}}$$

### 🗂️ Piece Organizer Tray & Navigation
- **Seamless Direct Drag-and-Drop**: Drag any thumbnail straight out of the tray onto the table or board in one continuous gesture.
- **4 Categorized Tabs**: Filter pieces by `All`, `Corners`, `Edges`, or `Centers`.
- **Deterministic Non-Overlapping Scatter**: Distributes loose pieces neatly into dedicated perimeter lanes around the board with zero overlap.
- **Scope-Aware Tidy**: Gathers loose un-snapped pieces back into the tray based on active tab.
- **Picture-in-Picture (PiP) Navigator**: Floating thumbnail with click-to-locate navigation (clicking an area centers the main canvas on that board region).

### 🔊 Procedural Web Audio Synthesizer
- Generates tactile wooden clicks, magnetic snaps, table drops, and major 9th victory fanfares in real-time with zero external audio file dependencies.

### 💾 Persistence & System Integration
- Local JSON save file persistence in Electron's `userData` path with auto-save.
- Export and import `.jigsaw` save files for backup or sharing.
- Frameless desktop window with custom titlebar controls.

---

## ⌨️ Controls & Shortcuts

| Action | Shortcut / Mouse Gesture |
| --- | --- |
| **Pan Canvas** | `Space + Drag` or `Middle Click + Drag` |
| **Zoom In / Out** | `Mouse Wheel` (anchored to cursor) |
| **Rotate Piece / Cluster** | `R` key or `Double Click` |
| **Toggle Organizer Tray** | `T` key |
| **Isolate Border Pieces** | `B` key |
| **Pick Up & Drag** | `Left Click + Drag` |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) (v9 or higher)

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
# Start Vite development server with Electron desktop window
npm run dev
```

### Production Build

```bash
# Compile TypeScript and bundle production assets
npm run build
```

---

## 🏗️ Project Architecture

```
├── electron/
│   ├── main.ts              # Electron main process & IPC handlers
│   └── preload.ts           # Secure contextBridge API bindings
├── src/
│   ├── assets/              # Curated starter puzzles
│   ├── components/
│   │   ├── Titlebar.tsx     # Custom frameless window controls
│   │   ├── Sidebar.tsx      # App navigation drawer
│   │   ├── LibraryView.tsx  # Hero dropzone, recent saves, completed gallery
│   │   ├── ImportModal.tsx  # Aspect ratio crop, piece slider & cut style
│   │   ├── WorkspaceView.tsx# Interactive canvas, pan/zoom & drag physics
│   │   ├── PieceTray.tsx    # 4-tab organizer tray with direct drag-out
│   │   ├── CanvasHUD.tsx    # Telemetry, PiP navigator & ghost slider
│   │   ├── VictoryModal.tsx # Stats breakdown, celebration fanfare & confetti
│   │   ├── SettingsModal.tsx# Audio, controls, and table surface picker
│   │   └── HistoryView.tsx  # Full game archive & stats tracking
│   ├── engine/
│   │   ├── JigsawGenerator.ts# Canonical Bézier jigsaw cutting mathematics
│   │   ├── ClusterManager.ts # DSU hierarchy, board grounding & scatter layout
│   │   ├── CanvasRenderer.ts # 5-layer 60fps rendering pipeline
│   │   ├── AudioEngine.ts   # Procedural Web Audio synthesizer
│   │   └── StorageService.ts# Local disk save persistence & file export/import
│   ├── types/
│   │   └── puzzle.ts        # Type definitions for puzzle state & pieces
│   ├── App.tsx              # Root application router & state coordinator
│   ├── main.tsx             # React entry point
│   └── index.css            # Tailwind CSS theme layers & styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.