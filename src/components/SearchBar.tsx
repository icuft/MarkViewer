import { useCallback, useEffect, useRef, useState } from 'react'
import type { EditorHandle } from './CodeEditor'

interface SearchBarProps {
  open: boolean
  onClose: () => void
  editorRef: React.RefObject<EditorHandle | null>
}

export function SearchBar({ open, onClose, editorRef }: SearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [replace, setReplace] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [regexp, setRegexp] = useState(false)
  const [wholeWord, setWholeWord] = useState(false)
  const [showReplace, setShowReplace] = useState(false)

  const commit = useCallback(() => {
    editorRef.current?.commitSearch({
      search,
      replace,
      caseSensitive,
      regexp,
      wholeWord,
    })
  }, [editorRef, search, replace, caseSensitive, regexp, wholeWord])

  useEffect(() => {
    if (!open) {
      editorRef.current?.clearSearch()
      return
    }

    const sel = editorRef.current?.getSelection()
    if (sel && sel.start !== sel.end) {
      setSearch(sel.text.slice(sel.start, sel.end))
    }

    requestAnimationFrame(() => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    })
  }, [open, editorRef])

  useEffect(() => {
    if (open) commit()
  }, [open, search, replace, caseSensitive, regexp, wholeWord, commit])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const optionBtn = (active: boolean, label: string, title: string, onClick: () => void) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium border transition-colors cursor-pointer ${
        active
          ? 'bg-accent text-on-accent border-accent'
          : 'text-muted border-border hover:text-foreground hover:border-border-strong'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="shrink-0 border-b border-border bg-surface-raised px-4 py-3 space-y-2">
      {/* Search row */}
      <div className="flex items-center gap-2">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-muted shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={searchInputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyUp={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.shiftKey
                ? editorRef.current?.findPrevious()
                : editorRef.current?.findNext()
            }
          }}
          placeholder="Ara…"
          className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-surface border border-border text-foreground placeholder:text-muted outline-none focus:border-accent font-mono"
        />

        <button
          type="button"
          title="Önceki (Shift+Enter)"
          onClick={() => editorRef.current?.findPrevious()}
          className="flex items-center justify-center w-8 h-8 border border-border text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button
          type="button"
          title="Sonraki (Enter)"
          onClick={() => editorRef.current?.findNext()}
          className="flex items-center justify-center w-8 h-8 border border-border text-muted hover:text-accent hover:border-accent transition-colors cursor-pointer shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          type="button"
          title={showReplace ? 'Değiştirmeyi gizle' : 'Değiştir'}
          onClick={() => setShowReplace((v) => !v)}
          className={`px-2 py-1.5 text-xs font-medium border transition-colors cursor-pointer shrink-0 ${
            showReplace
              ? 'border-accent text-accent'
              : 'border-border text-muted hover:text-foreground'
          }`}
        >
          Değiştir
        </button>

        <button
          type="button"
          title="Kapat (Esc)"
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          ×
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-2 pl-5">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-muted shrink-0 opacity-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
          </svg>
          <input
            type="text"
            value={replace}
            onChange={(e) => setReplace(e.target.value)}
            onKeyUp={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                editorRef.current?.replaceNext()
              }
            }}
            placeholder="Yeni metin…"
            className="flex-1 min-w-0 px-3 py-1.5 text-sm bg-surface border border-border text-foreground placeholder:text-muted outline-none focus:border-accent font-mono"
          />
          <button
            type="button"
            onClick={() => editorRef.current?.replaceNext()}
            className="px-2.5 py-1.5 text-xs font-medium border border-border text-muted hover:text-foreground hover:border-border-strong transition-colors cursor-pointer shrink-0"
          >
            Değiştir
          </button>
          <button
            type="button"
            onClick={() => editorRef.current?.replaceAll()}
            className="px-2.5 py-1.5 text-xs font-medium border border-accent text-accent hover:bg-accent hover:text-on-accent transition-colors cursor-pointer shrink-0"
          >
            Tümünü değiştir
          </button>
          <span className="w-[72px] shrink-0" aria-hidden="true" />
        </div>
      )}

      {/* Options */}
      <div className="flex items-center gap-1.5 pl-5">
        {optionBtn(caseSensitive, 'Aa', 'Büyük/küçük harf duyarlı', () => setCaseSensitive((v) => !v))}
        {optionBtn(regexp, '.*', 'Düzenli ifade', () => setRegexp((v) => !v))}
        {optionBtn(wholeWord, 'Ab|', 'Tam kelime', () => setWholeWord((v) => !v))}
        <span className="text-xs text-muted ml-2 hidden sm:inline">
          Enter sonraki · Shift+Enter önceki · Esc kapat
        </span>
      </div>
    </div>
  )
}
