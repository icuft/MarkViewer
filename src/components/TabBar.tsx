import type { DocumentTab } from '../hooks/useDocuments'

interface TabBarProps {
  tabs: DocumentTab[]
  activeId: string
  onSwitch: (id: string) => void
  onClose: (id: string) => void
  onAdd: () => void
}

export function TabBar({ tabs, activeId, onSwitch, onClose, onAdd }: TabBarProps) {
  return (
    <div className="flex items-center border-b border-border bg-surface overflow-x-auto shrink-0">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-2 px-4 py-2 text-xs font-medium border-r border-border cursor-pointer shrink-0 transition-colors ${
            tab.id === activeId
              ? 'bg-surface-raised text-foreground'
              : 'text-muted hover:text-foreground hover:bg-surface-overlay'
          }`}
          onClick={() => onSwitch(tab.id)}
        >
          <span className="max-w-[120px] truncate">
            {tab.title}
            {tab.dirty && <span className="text-accent ml-0.5">•</span>}
          </span>
          <button
            type="button"
            aria-label="Sekmeyi kapat"
            onClick={(e) => {
              e.stopPropagation()
              onClose(tab.id)
            }}
            className="opacity-0 group-hover:opacity-100 text-muted hover:text-foreground transition-opacity cursor-pointer"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        title="Yeni sekme (Ctrl+N)"
        className="px-3 py-2 text-muted hover:text-accent transition-colors cursor-pointer shrink-0"
      >
        +
      </button>
    </div>
  )
}
