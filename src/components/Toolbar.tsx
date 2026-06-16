import type { RefObject } from 'react'
import type { EditorHandle } from './CodeEditor'
import type { SelectionResult } from '../utils/markdown'

export type ToolbarAction =
  | 'bold'
  | 'italic'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'quote'
  | 'code'
  | 'link'
  | 'ul'
  | 'ol'
  | 'hr'

interface ToolbarProps {
  editorRef: RefObject<EditorHandle | null>
  onApply: (result: SelectionResult) => void
  getSelection: () => { start: number; end: number; text: string }
  actions: Record<ToolbarAction, (text: string, start: number, end: number) => SelectionResult>
  onSearch?: () => void
  onUndo?: () => void
  onRedo?: () => void
}

interface ToolButton {
  action?: ToolbarAction
  label: string
  icon: React.ReactNode
  dividerAfter?: boolean
  onClick?: () => void
}

export function Toolbar({
  editorRef,
  onApply,
  getSelection,
  actions,
  onSearch,
  onUndo,
  onRedo,
}: ToolbarProps) {
  const formatTools: ToolButton[] = [
    { action: 'bold', label: 'Kalın (Ctrl+B)', icon: <span className="font-bold text-sm">B</span> },
    { action: 'italic', label: 'İtalik (Ctrl+I)', icon: <span className="italic text-sm">I</span> },
    { action: 'h1', label: 'Başlık 1', icon: <span className="text-xs font-bold tracking-tight">H1</span> },
    { action: 'h2', label: 'Başlık 2', icon: <span className="text-xs font-bold tracking-tight">H2</span> },
    { action: 'h3', label: 'Başlık 3', icon: <span className="text-xs font-bold tracking-tight">H3</span>, dividerAfter: true },
    {
      action: 'quote',
      label: 'Alıntı',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
        </svg>
      ),
    },
    {
      action: 'code',
      label: 'Kod',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      action: 'link',
      label: 'Bağlantı (Ctrl+K)',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      dividerAfter: true,
    },
    {
      action: 'ul',
      label: 'Madde işaretli liste',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <circle cx="4" cy="6" r="1" fill="currentColor" />
          <circle cx="4" cy="12" r="1" fill="currentColor" />
          <circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      action: 'ol',
      label: 'Numaralı liste',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="10" y1="6" x2="21" y2="6" />
          <line x1="10" y1="12" x2="21" y2="12" />
          <line x1="10" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
    {
      action: 'hr',
      label: 'Yatay çizgi',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12" />
        </svg>
      ),
      dividerAfter: true,
    },
    {
      label: 'Geri al (Ctrl+Z)',
      onClick: onUndo,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M3 7v6h6" />
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.36 2.64L3 13" />
        </svg>
      ),
    },
    {
      label: 'Yinele (Ctrl+Y)',
      onClick: onRedo,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M21 7v6h-6" />
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.36 2.64L21 13" />
        </svg>
      ),
    },
    {
      label: 'Ara & Değiştir (Ctrl+F)',
      onClick: onSearch,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      ),
    },
  ]

  const handleAction = (action: ToolbarAction) => {
    const { start, end, text } = getSelection()
    const result = actions[action](text, start, end)
    onApply(result)
    requestAnimationFrame(() => {
      editorRef.current?.focus()
    })
  }

  return (
    <div className="flex items-center gap-0.5 px-3 py-2 border-b border-border bg-surface-raised overflow-x-auto shrink-0">
      {formatTools.map((tool, i) => (
        <span key={tool.action ?? tool.label + i} className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            title={tool.label}
            aria-label={tool.label}
            onClick={() => (tool.action ? handleAction(tool.action) : tool.onClick?.())}
            className="flex items-center justify-center w-8 h-8 text-muted hover:text-accent hover:bg-surface-overlay border border-transparent hover:border-border transition-colors cursor-pointer"
          >
            {tool.icon}
          </button>
          {tool.dividerAfter && (
            <span className="w-px h-5 bg-border mx-1 shrink-0" aria-hidden="true" />
          )}
        </span>
      ))}
    </div>
  )
}
