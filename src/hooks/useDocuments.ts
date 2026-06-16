import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_MARKDOWN } from '../utils/markdown'
import { addRecentFile } from '../utils/recentFiles'
import { downloadMarkdown } from '../utils/export'

export interface DocumentTab {
  id: string
  title: string
  content: string
  fileName: string | null
  dirty: boolean
}

const TABS_KEY = 'mdviewer-tabs'
const ACTIVE_KEY = 'mdviewer-active-tab'

function createTab(content = '', title = 'Yeni belge', fileName: string | null = null): DocumentTab {
  return {
    id: crypto.randomUUID(),
    title,
    content: content || DEFAULT_MARKDOWN,
    fileName,
    dirty: false,
  }
}

function loadTabs(): { tabs: DocumentTab[]; activeId: string } {
  try {
    const raw = localStorage.getItem(TABS_KEY)
    const activeId = localStorage.getItem(ACTIVE_KEY)
    if (raw) {
      const tabs = JSON.parse(raw) as DocumentTab[]
      if (tabs.length > 0) {
        return { tabs, activeId: activeId && tabs.some((t) => t.id === activeId) ? activeId : tabs[0].id }
      }
    }
  } catch {
    /* ignore */
  }
  const tab = createTab()
  return { tabs: [tab], activeId: tab.id }
}

export function useDocuments() {
  const [state, setState] = useState(loadTabs)

  const activeTab = state.tabs.find((t) => t.id === state.activeId) ?? state.tabs[0]

  useEffect(() => {
    try {
      localStorage.setItem(TABS_KEY, JSON.stringify(state.tabs))
      localStorage.setItem(ACTIVE_KEY, state.activeId)
    } catch {
      /* ignore */
    }
  }, [state])

  const updateContent = useCallback((content: string) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) =>
        t.id === prev.activeId ? { ...t, content, dirty: true } : t,
      ),
    }))
  }, [])

  const addTab = useCallback((content?: string, title?: string) => {
    const tab = createTab(content, title)
    setState((prev) => ({ tabs: [...prev.tabs, tab], activeId: tab.id }))
    return tab.id
  }, [])

  const closeTab = useCallback((id: string) => {
    setState((prev) => {
      if (prev.tabs.length === 1) {
        const tab = createTab()
        return { tabs: [tab], activeId: tab.id }
      }
      const tabs = prev.tabs.filter((t) => t.id !== id)
      const activeId = prev.activeId === id ? tabs[tabs.length - 1].id : prev.activeId
      return { tabs, activeId }
    })
  }, [])

  const switchTab = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeId: id }))
  }, [])

  const markSaved = useCallback((id: string, fileName: string, content: string) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) =>
        t.id === id ? { ...t, fileName, title: fileName, dirty: false, content } : t,
      ),
    }))
    addRecentFile(fileName, content)
  }, [])

  const openFileContent = useCallback((content: string, fileName: string) => {
    const existing = state.tabs.find((t) => t.fileName === fileName && !t.dirty)
    if (existing) {
      switchTab(existing.id)
      return existing.id
    }
    const tab = createTab(content, fileName, fileName)
    tab.dirty = false
    setState((prev) => ({ tabs: [...prev.tabs, tab], activeId: tab.id }))
    addRecentFile(fileName, content)
    return tab.id
  }, [state.tabs, switchTab])

  const saveActiveTab = useCallback(async () => {
    const tab = activeTab
    if (!tab) return false

    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (
          window as Window & {
            showSaveFilePicker: (opts: object) => Promise<FileSystemFileHandle>
          }
        ).showSaveFilePicker({
          suggestedName: tab.fileName ?? 'belge.md',
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
        })
        const writable = await handle.createWritable()
        await writable.write(tab.content)
        await writable.close()
        const name = handle.name
        markSaved(tab.id, name, tab.content)
        return true
      } catch {
        return false
      }
    }

    downloadMarkdown(tab.content, tab.fileName ?? 'belge.md')
    markSaved(tab.id, tab.fileName ?? 'belge.md', tab.content)
    return true
  }, [activeTab, markSaved])

  const openFilePicker = useCallback(async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await (
          window as Window & {
            showOpenFilePicker: (opts: object) => Promise<FileSystemFileHandle[]>
          }
        ).showOpenFilePicker({
          types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
          multiple: false,
        })
        const file = await handle.getFile()
        const content = await file.text()
        return openFileContent(content, file.name)
      } catch {
        return null
      }
    }
    return null
  }, [openFileContent])

  return {
    tabs: state.tabs,
    activeTab,
    activeId: state.activeId,
    updateContent,
    addTab,
    closeTab,
    switchTab,
    openFileContent,
    openFilePicker,
    saveActiveTab,
    markSaved,
  }
}
