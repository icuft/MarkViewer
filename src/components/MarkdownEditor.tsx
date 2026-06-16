import { useCallback, useEffect, useRef, useState } from 'react'
import { BackupPanel } from './BackupPanel'
import { CodeEditor, type EditorHandle } from './CodeEditor'
import { ExportMenu } from './ExportMenu'
import { Preview } from './Preview'
import { RecentFilesMenu } from './RecentFilesMenu'
import { SearchBar } from './SearchBar'
import { ResizableHandle } from './ResizableHandle'
import { SettingsPanel } from './SettingsPanel'
import { TabBar } from './TabBar'
import { Toolbar, type ToolbarAction } from './Toolbar'
import { useDocuments } from '../hooks/useDocuments'
import { useSettings } from '../hooks/useSettings'
import { saveBackup } from '../utils/backup'
import {
  insertLink,
  prefixLines,
  wrapSelection,
  type SelectionResult,
  type ViewMode,
} from '../utils/markdown'

const toolbarActions: Record<
  ToolbarAction,
  (text: string, start: number, end: number) => SelectionResult
> = {
  bold: (text, start, end) => wrapSelection(text, start, end, '**', '**', 'kalın metin'),
  italic: (text, start, end) => wrapSelection(text, start, end, '_', '_', 'italik metin'),
  h1: (text, start, end) => prefixLines(text, start, end, '# '),
  h2: (text, start, end) => prefixLines(text, start, end, '## '),
  h3: (text, start, end) => prefixLines(text, start, end, '### '),
  quote: (text, start, end) => prefixLines(text, start, end, '> '),
  code: (text, start, end) => wrapSelection(text, start, end, '`', '`', 'kod'),
  link: insertLink,
  ul: (text, start, end) => prefixLines(text, start, end, '- '),
  ol: (text, start, end) => prefixLines(text, start, end, '1. '),
  hr: (text, start, end) => {
    const snippet = '\n\n---\n\n'
    const newText = text.slice(0, start) + snippet + text.slice(end)
    const pos = start + snippet.length
    return { text: newText, selectionStart: pos, selectionEnd: pos }
  },
}

const viewModes: { id: ViewMode; label: string }[] = [
  { id: 'split', label: 'Bölünmüş' },
  { id: 'edit', label: 'Düzenle' },
  { id: 'preview', label: 'Önizle' },
]

export function MarkdownEditor() {
  const editorRef = useRef<EditorHandle>(null)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    settings,
    settingsOpen,
    setSettingsOpen,
    updateSettings,
    togglePanelsSwapped,
    toggleFullscreen,
    fullscreen,
    accentPresets,
  } = useSettings()

  const {
    tabs,
    activeTab,
    activeId,
    updateContent,
    addTab,
    closeTab,
    switchTab,
    openFileContent,
    openFilePicker,
    saveActiveTab,
  } = useDocuments()

  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [copied, setCopied] = useState(false)
  const [backupOpen, setBackupOpen] = useState(false)
  const [recentOpen, setRecentOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  const content = activeTab?.content ?? ''

  useEffect(() => {
    if (!activeId) return
    const interval = setInterval(() => {
      if (activeTab?.content) saveBackup(activeId, activeTab.content)
    }, 30000)
    return () => clearInterval(interval)
  }, [activeId, activeTab?.content])

  const handleOpenFile = useCallback(async () => {
    const result = await openFilePicker()
    if (!result) fileInputRef.current?.click()
  }, [openFilePicker])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (mod && e.key === 's') {
        e.preventDefault()
        saveActiveTab()
      } else if (mod && e.key === 'o') {
        e.preventDefault()
        handleOpenFile()
      } else if (mod && e.key === 'n') {
        e.preventDefault()
        addTab()
      } else if (mod && e.key === 'f') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (mod && e.key === 'p') {
        e.preventDefault()
        setViewMode('preview')
      } else if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [saveActiveTab, handleOpenFile, addTab, toggleFullscreen])

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    openFileContent(text, file.name)
    e.target.value = ''
  }

  const getSelection = useCallback(() => {
    return editorRef.current?.getSelection() ?? { start: 0, end: 0, text: content }
  }, [content])

  const applyEdit = useCallback(
    (result: SelectionResult) => {
      editorRef.current?.applyResult(result)
      updateContent(result.text)
    },
    [updateContent],
  )

  const handleFormat = useCallback(
    (action: string) => {
      const act = action as ToolbarAction
      if (!toolbarActions[act]) return
      const { start, end, text } = getSelection()
      applyEdit(toolbarActions[act](text, start, end))
    },
    [getSelection, applyEdit],
  )

  const handleSplitResize = useCallback(
    (ratio: number) => updateSettings({ splitRatio: ratio }),
    [updateSettings],
  )

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClear = () => {
    if (content && !confirm('Tüm içerik silinsin mi?')) return
    updateContent('')
    editorRef.current?.focus()
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length
  const lineCount = content.split('\n').length
  const wordGoalProgress =
    settings.wordGoal > 0 ? Math.min(100, (wordCount / settings.wordGoal) * 100) : 0

  const showEditor = viewMode === 'split' || viewMode === 'edit'
  const showPreview = viewMode === 'split' || viewMode === 'preview'
  const isSplit = viewMode === 'split'
  const isVertical = settings.splitDirection === 'vertical'

  const primarySize = `${settings.splitRatio}%`
  const secondarySize = `${100 - settings.splitRatio}%`

  const editorPane = (size: string) => (
    <section
      className="flex flex-col min-h-0 min-w-0 bg-surface"
      style={isSplit ? (isVertical ? { height: size } : { width: size }) : { flex: 1 }}
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-surface-raised shrink-0">
        <span className="text-xs font-medium uppercase tracking-widest text-muted">Düzenleyici</span>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-muted hover:text-red-400 transition-colors cursor-pointer"
        >
          Temizle
        </button>
      </div>
      <Toolbar
        editorRef={editorRef}
        onApply={applyEdit}
        getSelection={getSelection}
        actions={toolbarActions}
        onSearch={() => setSearchOpen(true)}
        onUndo={() => editorRef.current?.undo()}
        onRedo={() => editorRef.current?.redo()}
      />
      <SearchBar open={searchOpen} onClose={() => setSearchOpen(false)} editorRef={editorRef} />
      <CodeEditor
        ref={editorRef}
        key={activeId}
        value={content}
        onChange={updateContent}
        settings={settings}
        onFormat={handleFormat}
      />
    </section>
  )

  const previewPane = (size: string) => (
    <section
      className="flex flex-col min-h-0 min-w-0 bg-surface-raised"
      style={isSplit ? (isVertical ? { height: size } : { width: size }) : { flex: 1 }}
    >
      <div className="px-4 py-2 border-b border-border bg-surface-raised shrink-0">
        <span className="text-xs font-medium uppercase tracking-widest text-muted">Önizleme</span>
      </div>
      <Preview
        content={content}
        fontSize={settings.previewFontSize}
        showToc={settings.showToc}
      />
    </section>
  )

  const leftOrTopPane = settings.panelsSwapped ? previewPane(primarySize) : editorPane(primarySize)
  const rightOrBottomPane = settings.panelsSwapped
    ? editorPane(secondarySize)
    : previewPane(secondarySize)

  return (
    <div className="flex flex-col h-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        className="hidden"
        onChange={handleFileInput}
      />

      <header className="flex items-center justify-between px-4 sm:px-5 py-3 border-b-2 border-border bg-surface-raised shrink-0 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-9 h-9 bg-accent text-on-accent font-bold text-sm tracking-tighter shrink-0">
            MD
          </div>
          <h1 className="text-base font-semibold tracking-tight text-foreground leading-none truncate">
            Markdown Düzenleyici
          </h1>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-wrap justify-end">
          <div className="hidden md:flex items-center border border-border">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === mode.id
                    ? 'bg-accent text-on-accent'
                    : 'text-muted hover:text-foreground hover:bg-surface-overlay'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setRecentOpen((o) => !o)}
              title="Son dosyalar"
              className="px-2.5 py-1.5 text-xs font-medium border border-border text-muted hover:text-foreground transition-colors cursor-pointer hidden sm:block"
            >
              Son
            </button>
            {recentOpen && (
              <RecentFilesMenu
                onOpen={openFileContent}
                onClose={() => setRecentOpen(false)}
              />
            )}
          </div>

          <button
            type="button"
            onClick={handleOpenFile}
            title="Dosya aç (Ctrl+O)"
            className="px-2.5 py-1.5 text-xs font-medium border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Aç
          </button>
          <button
            type="button"
            onClick={() => saveActiveTab()}
            title="Kaydet (Ctrl+S)"
            className="px-2.5 py-1.5 text-xs font-medium border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            Kaydet
          </button>

          {isSplit && (
            <button
              type="button"
              title="Panelleri ters çevir"
              onClick={togglePanelsSwapped}
              className="flex items-center justify-center w-8 h-8 border border-border text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFullscreen}
            title="Tam ekran (F11)"
            className="flex items-center justify-center w-8 h-8 border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {fullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 text-xs font-medium border border-border text-muted hover:text-foreground transition-colors cursor-pointer hidden sm:block"
          >
            {copied ? 'Kopyalandı!' : 'Kopyala'}
          </button>

          <ExportMenu content={content} fileName={activeTab?.fileName ?? 'belge.md'} />

          <div className="relative">
            <button
              type="button"
              title="Ayarlar"
              onClick={() => setSettingsOpen((o) => !o)}
              className={`flex items-center justify-center w-8 h-8 border transition-colors cursor-pointer ${
                settingsOpen
                  ? 'border-accent text-accent bg-surface-overlay'
                  : 'border-border text-muted hover:text-foreground hover:border-border-strong'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            {settingsOpen && (
              <SettingsPanel
                settings={settings}
                accentPresets={accentPresets}
                onUpdate={updateSettings}
                onClose={() => setSettingsOpen(false)}
              />
            )}
          </div>
        </div>
      </header>

      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSwitch={switchTab}
        onClose={closeTab}
        onAdd={() => addTab()}
      />

      <div
        ref={splitContainerRef}
        className={`flex flex-1 min-h-0 ${isSplit && isVertical ? 'flex-col' : ''}`}
      >
        {showEditor && showPreview && isSplit ? (
          <>
            {leftOrTopPane}
            <ResizableHandle
              containerRef={splitContainerRef}
              onResize={handleSplitResize}
              direction={settings.splitDirection}
            />
            {rightOrBottomPane}
          </>
        ) : (
          <>
            {showEditor && editorPane('100%')}
            {showPreview && !showEditor && previewPane('100%')}
          </>
        )}
      </div>

      <footer className="shrink-0 border-t border-border bg-surface-raised">
        {settings.wordGoal > 0 && (
          <div className="h-1 bg-surface-overlay">
            <div
              className="h-full bg-accent transition-all duration-300"
              style={{ width: `${wordGoalProgress}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2">
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted">
            <span>{wordCount} kelime</span>
            {settings.wordGoal > 0 && (
              <>
                <span className="w-px h-3 bg-border" aria-hidden="true" />
                <span className="text-accent">/ {settings.wordGoal}</span>
              </>
            )}
            <span className="w-px h-3 bg-border hidden sm:block" aria-hidden="true" />
            <span className="hidden sm:inline">{charCount} karakter</span>
            <span className="w-px h-3 bg-border hidden sm:block" aria-hidden="true" />
            <span className="hidden sm:inline">{lineCount} satır</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted">
            <div className="relative">
              <button
                type="button"
                onClick={() => setBackupOpen((o) => !o)}
                className="hover:text-accent transition-colors cursor-pointer"
              >
                Yedekler
              </button>
              {backupOpen && activeId && (
                <BackupPanel
                  tabId={activeId}
                  onRestore={updateContent}
                  onClose={() => setBackupOpen(false)}
                />
              )}
            </div>
            <span className="w-px h-3 bg-border" aria-hidden="true" />
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-accent" aria-hidden="true" />
              Otomatik kayıt
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
