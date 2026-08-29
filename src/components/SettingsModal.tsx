import React, { useState } from 'react'
import { SnapSensitivity, TableSurface, UpdateStatus, UserSettings } from '../types/puzzle'
import { audioEngine } from '../engine/AudioEngine'
import { StorageService } from '../engine/StorageService'

interface SettingsModalProps {
  settings: UserSettings
  onSaveSettings: (newSettings: UserSettings) => void
  onExportSave: () => void
  onImportSave: () => void
  onClearCache: () => void
  updateStatus?: UpdateStatus
  onCheckForUpdates?: () => void
  onDownloadUpdate?: () => void
  onInstallUpdate?: () => void
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onExportSave,
  onImportSave,
  onClearCache,
  updateStatus,
  onCheckForUpdates,
  onDownloadUpdate,
  onInstallUpdate,
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>({ ...settings })
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false)

  const handleMusicChange = (val: number) => {
    const next = { ...localSettings, musicVolume: val }
    setLocalSettings(next)
    audioEngine.setVolumes(next.sfxVolume, next.musicVolume)
  }

  const handleSfxChange = (val: number) => {
    const next = { ...localSettings, sfxVolume: val }
    setLocalSettings(next)
    audioEngine.setVolumes(next.sfxVolume, next.musicVolume)
  }

  const handleTestAudio = () => {
    audioEngine.playSnap()
  }

  const handleSave = () => {
    onSaveSettings(localSettings)
    StorageService.saveSettings(localSettings)
    setSaveSuccessMsg(true)
    setTimeout(() => setSaveSuccessMsg(false), 2000)
  }

  const handleReset = () => {
    const def: UserSettings = {
      theme: 'light',
      musicVolume: 40,
      sfxVolume: 85,
      snapSensitivity: 'medium' as SnapSensitivity,
      dragInertia: true,
      tableSurface: 'felt' as TableSurface,
      edgeHighlight: 30,
      showGhostOverlay: false,
      ghostOpacity: 25,
      allowAutoComplete: true,
      seamlessBlending: true,
      discordRPC: true,
    }
    setLocalSettings(def)
    audioEngine.setVolumes(def.sfxVolume, def.musicVolume)
    onSaveSettings(def)
    StorageService.saveSettings(def)
  }

  return (
    <div className="flex-1 overflow-y-auto p-lg md:p-xl bg-background text-on-background select-none">
      <div className="max-w-4xl mx-auto space-y-xl pb-24">
        {/* Header */}
        <div className="flex flex-col gap-xs">
          <h1 className="font-display-lg text-display-lg text-primary font-bold">Preferences</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Customize your puzzling environment. Adjust tactile feedback, audio cues, and visual
            rendering to suit your focus style.
          </p>
        </div>

        {/* Bento Grid Settings */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          {/* Theme & Visual Appearance (Spans 12 cols) */}
          <section className="md:col-span-12 bg-surface-container border border-outline-variant/30 dark:border-transparent rounded-2xl p-lg shadow-sm">
            <div className="flex items-center gap-sm mb-lg border-b border-surface-variant dark:border-transparent pb-sm">
              <span className="material-symbols-outlined text-primary">palette</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Theme & Appearance
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
              <div>
                <h4 className="font-body-md font-semibold text-on-surface">Interface Theme</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Select between light mode, deep botanical velvet dark mode, or follow system.
                </p>
              </div>

              {/* 3-way Segmented Button */}
              <div className="flex bg-surface-variant/80 dark:bg-black/30 rounded-xl p-1 gap-1 border border-outline-variant/40 dark:border-transparent shadow-inner">
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...localSettings, theme: 'light' as const }
                    setLocalSettings(next)
                    onSaveSettings(next)
                    StorageService.saveSettings(next)
                  }}
                  className={`flex items-center gap-1.5 px-md py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    localSettings.theme === 'light'
                      ? 'bg-primary text-on-primary shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">light_mode</span>
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...localSettings, theme: 'dark' as const }
                    setLocalSettings(next)
                    onSaveSettings(next)
                    StorageService.saveSettings(next)
                  }}
                  className={`flex items-center gap-1.5 px-md py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    localSettings.theme === 'dark'
                      ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">dark_mode</span>
                  <span>Dark (Deep Velvet)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...localSettings, theme: 'system' as const }
                    setLocalSettings(next)
                    onSaveSettings(next)
                    StorageService.saveSettings(next)
                  }}
                  className={`flex items-center gap-1.5 px-md py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    localSettings.theme === 'system'
                      ? 'bg-primary text-on-primary shadow-xs font-bold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">settings_brightness</span>
                  <span>System</span>
                </button>
              </div>
            </div>
          </section>

          {/* Audio Settings (Spans 8 cols) */}
          <section className="md:col-span-8 bg-surface-container border border-outline-variant/30 dark:border-transparent rounded-2xl p-lg shadow-sm">
            <div className="flex items-center justify-between mb-lg border-b border-surface-variant dark:border-transparent pb-sm">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">volume_up</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                  Audio & Environment
                </h2>
              </div>
              <button
                onClick={handleTestAudio}
                className="px-sm py-1 bg-surface-variant hover:bg-surface-container-high text-xs font-semibold rounded-lg text-primary flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>Test Snap</span>
              </button>
            </div>

            <div className="space-y-xl">
              {/* Music Volume */}
              <div>
                <div className="flex justify-between items-center mb-sm">
                  <label className="font-body-md text-body-md font-medium text-on-surface">
                    Ambient Relaxing Chimes
                  </label>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                    {localSettings.musicVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.musicVolume}
                  onChange={(e) => handleMusicChange(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer accent-primary"
                />
                <p className="font-label-sm text-xs text-on-surface-variant mt-xs">
                  Generates procedurally harmonized ambient tones for focus.
                </p>
              </div>

              {/* SFX Volume */}
              <div>
                <div className="flex justify-between items-center mb-sm">
                  <label className="font-body-md text-body-md font-medium text-on-surface">
                    Tactile Sound Effects
                  </label>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                    {localSettings.sfxVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={localSettings.sfxVolume}
                  onChange={(e) => handleSfxChange(parseInt(e.target.value, 10))}
                  className="w-full cursor-pointer accent-primary"
                />
                <p className="font-label-sm text-xs text-on-surface-variant mt-xs">
                  Controls the volume of piece pickup clicks, table drops, and magnetic snaps.
                </p>
              </div>
            </div>
          </section>

          {/* Controls & Handling (Spans 4 cols) */}
          <section className="md:col-span-4 bg-surface-container border border-outline-variant/30 dark:border-transparent rounded-2xl p-lg shadow-sm flex flex-col">
            <div className="flex items-center gap-sm mb-lg border-b border-surface-variant dark:border-transparent pb-sm">
              <span className="material-symbols-outlined text-primary">mouse</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Handling
              </h2>
            </div>

            <div className="flex-grow space-y-lg">
              <div>
                <label className="font-body-md text-body-md font-medium text-on-surface block mb-sm">
                  Snap Sensitivity
                </label>
                <div className="grid grid-cols-3 gap-1 bg-surface-container-low dark:bg-black/30 rounded-lg p-1 border border-outline-variant/30 dark:border-transparent">
                  {(['low', 'medium', 'high'] as SnapSensitivity[]).map((sens) => (
                    <button
                      key={sens}
                      onClick={() => setLocalSettings({ ...localSettings, snapSensitivity: sens })}
                      className={`py-1 text-center font-label-md text-xs font-semibold rounded-md transition-all uppercase cursor-pointer ${
                        localSettings.snapSensitivity === sens
                          ? 'bg-primary text-on-primary dark:bg-emerald-500/20 dark:text-emerald-300 shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-variant'
                      }`}
                    >
                      {sens}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-xs">
                  <label className="font-body-md text-body-md font-medium text-on-surface">
                    Smooth Drag Inertia
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.dragInertia}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, dragInertia: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  <span className="ml-3 font-label-sm text-xs text-on-surface-variant">
                    Gliding piece physics
                  </span>
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-xs">
                  <label className="font-body-md text-body-md font-medium text-on-surface">
                    Auto-Complete Button
                  </label>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.allowAutoComplete}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        allowAutoComplete: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  <span className="ml-3 font-label-sm text-xs text-on-surface-variant">
                    Show in workspace
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* Visuals & Board Surfaces (Spans 12 cols) */}
          <section className="md:col-span-12 bg-surface-container border border-outline-variant/30 dark:border-transparent rounded-2xl p-lg shadow-sm">
            <div className="flex items-center gap-sm mb-lg border-b border-surface-variant dark:border-transparent pb-sm">
              <span className="material-symbols-outlined text-primary">wallpaper</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Visuals & Board Surfaces
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
              {/* Table Surface Picker */}
              <div>
                <label className="font-body-md text-body-md font-medium text-on-surface block mb-md">
                  Table Surface Texture
                </label>
                <div className="grid grid-cols-4 gap-sm">
                  {/* Classic Felt */}
                  <div
                    onClick={() => setLocalSettings({ ...localSettings, tableSurface: 'felt' })}
                    className="cursor-pointer group text-center"
                  >
                    <div
                      className={`h-20 rounded-xl bg-[#f7eae0] dark:bg-[#15191f] shadow-sm mb-xs relative overflow-hidden transition-all border-2 ${
                        localSettings.tableSurface === 'felt'
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-outline-variant'
                      }`}
                    />
                    <span className="font-label-sm text-xs text-on-surface block font-medium">
                      Classic Felt
                    </span>
                  </div>

                  {/* Dark Walnut */}
                  <div
                    onClick={() => setLocalSettings({ ...localSettings, tableSurface: 'walnut' })}
                    className="cursor-pointer group text-center"
                  >
                    <div
                      className={`h-20 rounded-xl bg-[#362f29] shadow-sm mb-xs relative overflow-hidden transition-all border-2 ${
                        localSettings.tableSurface === 'walnut'
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-outline-variant'
                      }`}
                    />
                    <span className="font-label-sm text-xs text-on-surface-variant block font-medium">
                      Dark Walnut
                    </span>
                  </div>

                  {/* Cutting Mat */}
                  <div
                    onClick={() =>
                      setLocalSettings({ ...localSettings, tableSurface: 'cutting-mat' })
                    }
                    className="cursor-pointer group text-center"
                  >
                    <div
                      className={`h-20 rounded-xl bg-[#143124] shadow-sm mb-xs relative overflow-hidden transition-all border-2 ${
                        localSettings.tableSurface === 'cutting-mat'
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-outline-variant'
                      }`}
                    >
                      <div
                        className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
                          backgroundSize: '8px 8px',
                        }}
                      />
                    </div>
                    <span className="font-label-sm text-xs text-on-surface-variant block font-medium">
                      Cutting Mat
                    </span>
                  </div>

                  {/* Slate */}
                  <div
                    onClick={() => setLocalSettings({ ...localSettings, tableSurface: 'slate' })}
                    className="cursor-pointer group text-center"
                  >
                    <div
                      className={`h-20 rounded-xl bg-[#26292b] shadow-sm mb-xs relative overflow-hidden transition-all border-2 ${
                        localSettings.tableSurface === 'slate'
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent hover:border-outline-variant'
                      }`}
                    />
                    <span className="font-label-sm text-xs text-on-surface-variant block font-medium">
                      Dark Slate
                    </span>
                  </div>
                </div>
              </div>

              {/* Edge Highlighting & Seamless Blending */}
              <div className="space-y-lg">
                <div>
                  <div className="flex justify-between items-center mb-xs">
                    <label className="font-body-md text-body-md font-medium text-on-surface">
                      Piece Edge Highlight Contrast
                    </label>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                      {localSettings.edgeHighlight}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.edgeHighlight}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        edgeHighlight: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full cursor-pointer accent-primary"
                  />
                  <p className="font-label-sm text-xs text-on-surface-variant mt-xs">
                    Adds high-contrast edge outlines around pieces to make shapes pop.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-xs">
                    <label className="font-body-md text-body-md font-medium text-on-surface">
                      Seamless Piece Blending
                    </label>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.seamlessBlending}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          seamlessBlending: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    <span className="ml-3 font-label-sm text-xs text-on-surface-variant">
                      Dissolve internal seams between connected pieces
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Storage & Backup Management (Spans 12 cols) */}
          <section className="md:col-span-12 bg-surface-container border border-outline-variant/30 dark:border-transparent rounded-2xl p-lg shadow-sm">
            <div className="flex items-center gap-sm mb-md border-b border-surface-variant dark:border-transparent pb-sm">
              <span className="material-symbols-outlined text-primary">folder_zip</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Local Save & Backup Management
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-md justify-between">
              <p className="text-xs text-on-surface-variant max-w-md">
                Export your current jigsaw puzzles to portable <code className="text-primary font-bold">.jigsaw</code> backup files, or import saves from another computer.
              </p>
              <div className="flex gap-sm">
                <button
                  onClick={onImportSave}
                  className="px-md py-sm bg-surface hover:bg-surface-variant text-on-surface font-semibold text-xs rounded-xl border border-outline-variant/40 dark:border-transparent transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">upload_file</span>
                  <span>Import Save</span>
                </button>
                <button
                  onClick={onExportSave}
                  className="px-md py-sm bg-surface hover:bg-surface-variant text-on-surface font-semibold text-xs rounded-xl border border-outline-variant/40 dark:border-transparent transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>Export Save</span>
                </button>
                <button
                  onClick={onClearCache}
                  className="px-md py-sm bg-error-container text-on-error-container hover:bg-error-container/80 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">delete_sweep</span>
                  <span>Clear Cache</span>
                </button>
              </div>
            </div>
          </section>

          {/* Discord Rich Presence Integration (Spans 12 cols) */}
          <section className="md:col-span-12 bg-surface-container border border-outline-variant/30 dark:border-transparent rounded-2xl p-lg shadow-sm">
            <div className="flex items-center gap-sm mb-md border-b border-surface-variant dark:border-transparent pb-sm">
              <span className="material-symbols-outlined text-primary">sports_esports</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Discord Rich Presence
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
              <div>
                <h4 className="font-body-md font-semibold text-on-surface">Display Game Activity</h4>
                <p className="text-xs text-on-surface-variant mt-0.5 max-w-xl">
                  Display the puzzle you are currently solving and your solving time on Discord when you are in the workspace.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.discordRPC !== false}
                  onChange={(e) => {
                    const next = { ...localSettings, discordRPC: e.target.checked }
                    setLocalSettings(next)
                    onSaveSettings(next)
                    StorageService.saveSettings(next)
                    if (window.electronAPI) {
                      window.electronAPI.setDiscordEnabled(e.target.checked)
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                <span className="ml-3 font-label-sm text-xs text-on-surface-variant font-medium">
                  {localSettings.discordRPC !== false ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>
          </section>

          {/* App Version & Updates (Spans 12 cols) */}
          <section className="md:col-span-12 bg-surface-container border border-outline-variant/30 dark:border-transparent rounded-2xl p-lg shadow-sm">
            <div className="flex items-center gap-sm mb-md border-b border-surface-variant dark:border-transparent pb-sm">
              <span className="material-symbols-outlined text-primary">update</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Application Updates & Version
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-body-md font-semibold text-on-surface">Jigsaw Flow</h4>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-surface-variant text-on-surface-variant">
                    v{updateStatus?.currentVersion || '1.0.0'}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 max-w-xl">
                  {updateStatus?.status === 'checking' && 'Checking for updates...'}
                  {updateStatus?.status === 'available' && `Update v${updateStatus.updateInfo?.version || ''} is available to download!`}
                  {updateStatus?.status === 'downloading' && `Downloading update: ${updateStatus.progress?.percent || 0}% completed...`}
                  {updateStatus?.status === 'downloaded' && `Version v${updateStatus.updateInfo?.version || ''} is ready to install.`}
                  {updateStatus?.status === 'not-available' && 'You are currently using the latest version.'}
                  {updateStatus?.status === 'error' && (updateStatus.error || 'Unable to check for updates at this time.')}
                  {(!updateStatus || updateStatus.status === 'idle') && 'Keep Jigsaw Flow up to date with the latest features, performance improvements, and puzzles.'}
                </p>
              </div>

              <div className="flex items-center gap-sm">
                {updateStatus?.status === 'available' && onDownloadUpdate && (
                  <button
                    onClick={onDownloadUpdate}
                    className="px-md py-sm bg-primary text-on-primary hover:bg-primary-container font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">download</span>
                    <span>Download Update</span>
                  </button>
                )}

                {updateStatus?.status === 'downloading' && (
                  <div className="px-md py-sm bg-surface-variant text-primary font-semibold text-xs rounded-xl flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base animate-spin">sync</span>
                    <span>{updateStatus.progress?.percent || 0}%</span>
                  </div>
                )}

                {updateStatus?.status === 'downloaded' && onInstallUpdate && (
                  <button
                    onClick={onInstallUpdate}
                    className="px-md py-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">restart_alt</span>
                    <span>Restart & Install</span>
                  </button>
                )}

                {onCheckForUpdates && updateStatus?.status !== 'downloading' && (
                  <button
                    onClick={onCheckForUpdates}
                    disabled={updateStatus?.status === 'checking'}
                    className="px-md py-sm bg-surface hover:bg-surface-variant text-on-surface font-semibold text-xs rounded-xl border border-outline-variant/40 dark:border-transparent transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span className={`material-symbols-outlined text-base ${updateStatus?.status === 'checking' ? 'animate-spin' : ''}`}>
                      refresh
                    </span>
                    <span>{updateStatus?.status === 'checking' ? 'Checking...' : 'Check for Updates'}</span>
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Action Bar */}
          <div className="md:col-span-12 flex justify-end items-center gap-md mt-sm">
            {saveSuccessMsg && (
              <span className="text-xs text-primary font-semibold animate-in fade-in flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Preferences saved successfully!
              </span>
            )}
            <button
              onClick={handleReset}
              className="px-lg py-sm font-label-md text-label-md text-error hover:bg-error-container/40 rounded-xl transition-colors cursor-pointer"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className="px-lg py-sm font-label-md text-label-md bg-primary text-on-primary rounded-xl shadow-md hover:bg-primary-container transition-all active:scale-[0.98] cursor-pointer font-semibold"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
