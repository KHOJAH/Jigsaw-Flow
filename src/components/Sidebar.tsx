import React from 'react'
import { ActiveNavTab } from '../types/puzzle'

interface SidebarProps {
  activeTab: ActiveNavTab
  onTabChange: (tab: ActiveNavTab) => void
  onOpenImport: () => void
  hasActivePuzzle: boolean
  completedCount: number
  theme?: string
  onToggleTheme?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenImport,
  hasActivePuzzle,
  completedCount,
  theme,
  onToggleTheme,
}) => {
  return (
    <nav className="hidden md:flex flex-col p-md space-y-sm h-full w-sidebar-width bg-surface-container shadow-md border-r border-outline-variant/30 dark:border-transparent z-20 flex-shrink-0">
      {/* Brand Heading */}
      <div className="flex items-center gap-sm mb-lg px-xs">
        <span
          className="material-symbols-outlined text-[32px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          extension
        </span>
        <span className="font-headline-md text-headline-md text-primary font-bold">
          Jigsaw Flow
        </span>
      </div>

      {/* User Profile Card */}
      <div className="flex items-center gap-md p-sm mb-lg bg-surface-variant rounded-lg border border-outline-variant/20 dark:border-transparent">
        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-base shadow-sm">
          <span className="material-symbols-outlined text-xl">psychology</span>
        </div>
        <div className="flex flex-col">
          <div className="font-label-md text-label-md text-on-surface font-semibold">
            Master Puzzler
          </div>
          <div className="font-label-sm text-label-sm text-on-surface-variant">
            {completedCount > 0 ? `${completedCount} Puzzles Solved` : 'Level 1 Puzzler'}
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <div className="flex flex-col gap-xs flex-grow">
        <button
          onClick={() => onTabChange('library')}
          className={`flex items-center gap-sm px-md py-sm rounded-lg font-bold transition-all ${
            activeTab === 'library'
              ? 'bg-primary text-on-primary shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/25'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface hover:translate-x-1 duration-200'
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={activeTab === 'library' ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            grid_view
          </span>
          <span className="font-body-md text-body-md">Library</span>
        </button>

        <button
          onClick={() => onTabChange('workspace')}
          disabled={!hasActivePuzzle}
          className={`flex items-center gap-sm px-md py-sm rounded-lg font-bold transition-all ${
            activeTab === 'workspace'
              ? 'bg-primary text-on-primary shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/25'
              : hasActivePuzzle
              ? 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface hover:translate-x-1 duration-200 cursor-pointer'
              : 'text-outline-variant/60 cursor-not-allowed'
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={activeTab === 'workspace' ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            extension
          </span>
          <span className="font-body-md text-body-md">Workspace</span>
          {hasActivePuzzle && (
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => onTabChange('history')}
          className={`flex items-center gap-sm px-md py-sm rounded-lg font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-primary text-on-primary shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/25'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface hover:translate-x-1 duration-200'
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={activeTab === 'history' ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            history
          </span>
          <span className="font-body-md text-body-md">History</span>
        </button>

        <button
          onClick={() => onTabChange('settings')}
          className={`flex items-center gap-sm px-md py-sm rounded-lg font-bold transition-all mt-auto ${
            activeTab === 'settings'
              ? 'bg-primary text-on-primary shadow-sm dark:bg-emerald-500/15 dark:text-emerald-300 dark:border dark:border-emerald-500/25'
              : 'text-on-surface-variant hover:bg-surface-variant hover:text-on-surface hover:translate-x-1 duration-200'
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={activeTab === 'settings' ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            settings
          </span>
          <span className="font-body-md text-body-md">Settings</span>
        </button>
      </div>

      {/* Import CTA Button */}
      <button
        onClick={onOpenImport}
        className="mt-md w-full bg-primary text-on-primary dark:bg-emerald-600 dark:hover:bg-emerald-500 py-sm px-md rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex justify-center items-center gap-xs cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">add</span>
        Import New Puzzle
      </button>
    </nav>
  )
}
