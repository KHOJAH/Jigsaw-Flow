import React from 'react'

interface SelectionHUDProps {
  selectedCount: number
  rotationEnabled: boolean
  onTidyGroup: () => void
  onRotateGroup: () => void
  onSendToTray: () => void
  onDeselect: () => void
}

export const SelectionHUD: React.FC<SelectionHUDProps> = ({
  selectedCount,
  rotationEnabled,
  onTidyGroup,
  onRotateGroup,
  onSendToTray,
  onDeselect,
}) => {
  if (selectedCount === 0) return null

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 bg-surface-container/95 backdrop-blur-md px-md py-sm rounded-2xl border border-primary/30 shadow-2xl flex items-center gap-sm animate-in fade-in slide-in-from-bottom-3 duration-200 select-none pointer-events-auto">
      {/* Selection Count Badge */}
      <div className="flex items-center gap-1.5 px-sm py-1 bg-primary text-on-primary rounded-xl font-bold text-xs shadow-sm">
        <span className="material-symbols-outlined text-sm">select_all</span>
        <span>{selectedCount} Selected</span>
      </div>

      <div className="h-5 w-px bg-outline-variant/40 mx-0.5" />

      {/* Action: Tidy into Grid */}
      <button
        onClick={onTidyGroup}
        className="flex items-center gap-1 px-sm py-1.5 rounded-xl bg-surface-variant hover:bg-surface-container text-on-surface font-semibold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
        title="Arrange selected pieces in a clean grid"
      >
        <span className="material-symbols-outlined text-base">grid_on</span>
        <span>Tidy Grid</span>
      </button>

      {/* Action: Rotate Group */}
      {rotationEnabled && (
        <button
          onClick={onRotateGroup}
          className="flex items-center gap-1 px-sm py-1.5 rounded-xl bg-surface-variant hover:bg-surface-container text-on-surface font-semibold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
          title="Rotate selected pieces 90° (Hotkey: R)"
        >
          <span className="material-symbols-outlined text-base">rotate_right</span>
          <span>Rotate</span>
        </button>
      )}

      {/* Action: Send to Tray */}
      <button
        onClick={onSendToTray}
        className="flex items-center gap-1 px-sm py-1.5 rounded-xl bg-secondary/15 hover:bg-secondary/25 text-secondary font-semibold text-xs transition-all cursor-pointer hover:scale-105 active:scale-95 border border-secondary/30"
        title="Return selected pieces to the organizer tray (Hotkey: Backspace/Delete)"
      >
        <span className="material-symbols-outlined text-base">move_to_inbox</span>
        <span>To Tray</span>
      </button>

      {/* Action: Deselect */}
      <button
        onClick={onDeselect}
        className="w-7 h-7 rounded-xl hover:bg-surface-variant text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer ml-1"
        title="Deselect all (Hotkey: Esc)"
      >
        <span className="material-symbols-outlined text-base">close</span>
      </button>
    </div>
  )
}
