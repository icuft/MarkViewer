import { useState } from 'react'
import { getRecentFiles, type RecentFile } from '../utils/recentFiles'

interface RecentFilesMenuProps {
  onOpen: (name: string, content: string) => void
  onClose: () => void
}

export function RecentFilesMenu({ onOpen, onClose }: RecentFilesMenuProps) {
  const [files] = useState<RecentFile[]>(() => getRecentFiles())

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="absolute left-0 top-full mt-1 z-50 w-72 border border-border bg-surface-raised shadow-[4px_4px_0_0_var(--color-border-strong)]">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Son Dosyalar</h2>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {files.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted text-center">Son dosya yok</p>
          ) : (
            files.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onOpen(f.name, f.content)
                  onClose()
                }}
                className="w-full px-4 py-2.5 text-left border-b border-border hover:bg-surface-overlay transition-colors cursor-pointer"
              >
                <span className="text-xs text-foreground block truncate">{f.name}</span>
                <span className="text-xs text-muted">
                  {new Date(f.openedAt).toLocaleString('tr-TR')}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
