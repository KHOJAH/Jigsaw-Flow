<p align="center">
  <img src="public/icon.png" width="120" alt="Jigsaw Flow Logo" />
  <h1 align="center">Jigsaw Flow</h1>
  <p align="center">A desktop jigsaw puzzle studio built with Electron, React, TypeScript, and HTML5 Canvas.</p>
</p>

---

## Overview

**Jigsaw Flow** transforms any high-resolution image into an authentic, tactile jigsaw puzzle experience on your desktop. Built with an optimized multi-layer canvas pipeline, parametric Bezier curve slicing, and Disjoint-Set Union (DSU) clustering physics, it delivers a smooth and responsive tabletop puzzle environment.

---

## Key Features

### Gameplay & Physics Engine
- **Parametric Bezier Slicing**: Generates interlocking tabs and blanks using mathematically computed curves for organic, unique puzzle pieces.
- **DSU Cluster Physics**: Snapped pieces join into cohesive groups using Disjoint-Set Union data structures, allowing connected clusters to move, drag, and rotate as single units.
- **Magnetic Snapping & Grounding**: Pieces near matching neighbors or their correct board positions magnetically snap into place and lock permanently to the board upon correct placement.
- **Multi-Layer Rendering Pipeline**: Discrete canvas rendering passes for the tabletop background, ghost reference overlay, grounded board pieces, loose table pieces, and active dragging selections for maximum frame rates.
- **Cursor-Anchored Viewport**: Smooth panning and zooming centered precisely around your mouse cursor.

### Workspace & Piece Management
- **Smart Organizer Tray**: Collapsible bottom tray that categorizes loose pieces into **All**, **Corners**, **Edges**, and **Centers** with drag-and-drop support back and forth from the board.
- **Picture-in-Picture Navigator**: Floating reference overlay showing the original image and current board progress.
- **Marquee Multi-Select**: Drag a selection box over multiple loose pieces to move or group them simultaneously.
- **Smart Hints & Piece Inspector**: Visual guidance system to locate matching pieces and high-resolution piece inspection modal.
- **Adaptive Themes**: Thoughtfully designed high-contrast Light and Dark modes.

### Custom Puzzles & Curated Gallery
- **Custom Image Importer**: Drag and drop any image file (PNG, JPG, WEBP, BMP) to create custom puzzles with adjustable cropping and aspect ratios (Free, 16:9, 4:3, 1:1).
- **Curated Masterpieces**: 11 built-in high-resolution fine art masterworks ready to play offline, alongside themed landscape, architecture, space, and nature categories.
- **Configurable Difficulty**: Choose from quick 12-piece warmups up to 500+ piece challenges, with optional piece rotation and classic or modern cut styles.

### Audio, Storage & Victory Export
- **Procedural Sound Engine**: Dynamic tactile clicks, piece snaps, and completion fanfares generated in real time using the Web Audio API without external audio files.
- **Local Auto-Save**: Seamless persistence of game states, piece positions, timers, and move counters.
- **Save File Import & Export**: Export games to standalone `.jigsaw` save files to back up or share puzzles across machines.
- **High-Resolution Victory Posters**: Generates downloadable, framed victory wallpapers displaying your completion time, move count, and accuracy metrics.

---

## Installation (Windows)

### Option 1: Setup Installer (Recommended)
1. Download [`Jigsaw Flow-Setup-1.0.0.exe`](release/Jigsaw%20Flow-Setup-1.0.0.exe).
2. Run the installer (installs directly into your user profile with no Administrator UAC prompt required).
3. Launch Jigsaw Flow from your Desktop or Start Menu.

### Option 2: Portable Executable
Launch [`release/win-unpacked/Jigsaw Flow.exe`](release/win-unpacked/Jigsaw%20Flow.exe) directly without installing.

---

## Controls & Keyboard Shortcuts

| Action | Shortcut / Gesture |
| :--- | :--- |
| **Pan Canvas** | `Space + Drag` or `Middle Click + Drag` |
| **Zoom In / Out** | `Mouse Wheel` (cursor-anchored) |
| **Rotate Piece / Cluster** | `R` key or `Double Click` |
| **Toggle Organizer Tray** | `T` key |
| **Smart Hint** | `H` key |
| **Multi-Select** | `Shift + Drag` (Marquee Selection Box) |
| **Pick Up & Drag** | `Left Click + Drag` |
| **Reset View to Center** | `C` key |

---

## Building from Source

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup & Development

```bash
# Clone the repository
git clone https://github.com/KHOJAH/Jigsaw-Flow.git
cd Jigsaw-Flow

# Install dependencies
npm install

# Start development server with Electron window
npm run dev
```

### Production Packaging

```bash
# Compile and build the Windows NSIS Setup installer
npm run dist

# Build unpacked standalone directory only
npm run dist:dir
```

The output will be generated inside the `release/` directory.

---

## Tech Stack

- **Framework**: [Electron](https://www.electronjs.org/)
- **UI**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Graphics Engine**: HTML5 2D Canvas with sub-pixel rendering
- **Build Tooling**: [Vite](https://vitejs.dev/) + [electron-builder](https://www.electron.build/)

---

## License

This project is licensed under the MIT License.