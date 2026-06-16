import { useCallback, useEffect, useState } from 'react'
import { contrastText, darkenHex } from '../utils/color'

export type Theme = 'dark' | 'light' | 'sepia' | 'high-contrast' | 'amoled'
export type SplitDirection = 'horizontal' | 'vertical'

export interface AppSettings {
  theme: Theme
  accentColor: string
  panelsSwapped: boolean
  splitRatio: number
  splitDirection: SplitDirection
  editorFontSize: number
  previewFontSize: number
  showLineNumbers: boolean
  focusMode: boolean
  spellCheck: boolean
  wordGoal: number
  showToc: boolean
}

const STORAGE_KEY = 'mdviewer-settings'

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: '#00e5c7',
  panelsSwapped: false,
  splitRatio: 50,
  splitDirection: 'horizontal',
  editorFontSize: 14,
  previewFontSize: 16,
  showLineNumbers: true,
  focusMode: false,
  spellCheck: true,
  wordGoal: 0,
  showToc: true,
}

export const ACCENT_PRESETS = [
  '#00e5c7',
  '#3b82f6',
  '#a855f7',
  '#f43f5e',
  '#f59e0b',
  '#22c55e',
  '#ec4899',
  '#6366f1',
]

export const THEME_LABELS: Record<Theme, string> = {
  dark: 'Koyu',
  light: 'Açık',
  sepia: 'Sepia',
  'high-contrast': 'Yüksek Kontrast',
  amoled: 'AMOLED',
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function applySettingsToDom(settings: AppSettings) {
  const root = document.documentElement
  root.dataset.theme = settings.theme
  root.style.setProperty('--color-accent', settings.accentColor)
  root.style.setProperty('--color-accent-dim', darkenHex(settings.accentColor, 0.18))
  root.style.setProperty('--color-on-accent', contrastText(settings.accentColor))
  root.style.setProperty('--editor-font-size', `${settings.editorFontSize}px`)
  root.style.setProperty('--preview-font-size', `${settings.previewFontSize}px`)
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    applySettingsToDom(settings)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      /* ignore */
    }
  }, [settings])

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const togglePanelsSwapped = useCallback(() => {
    setSettings((prev) => ({ ...prev, panelsSwapped: !prev.panelsSwapped }))
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen()
    } else {
      await document.documentElement.requestFullscreen()
    }
  }, [])

  return {
    settings,
    settingsOpen,
    setSettingsOpen,
    updateSettings,
    togglePanelsSwapped,
    toggleFullscreen,
    fullscreen,
    accentPresets: ACCENT_PRESETS,
  }
}
