import { useState } from 'react'
import { getBackups, type BackupEntry } from '../utils/backup'

interface BackupPanelProps {
  tabId: string
  onRestore: (content: string) => void
  onClose: () => void
}

export function BackupPanel({ tabId, onRestore, onClose }: BackupPanelProps) {
  const [backups] = useState<BackupEntry[]>(() => getBackups(tabId))

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-full mt-1 z-50 w-80 border border-border bg-surface-raised shadow-[4px_4px_0_0_var(--color-border-strong)]">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center">
          <h2 className="text-sm font-semibold text-foreground">Otomatik Yedekler</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground cursor-pointer">×</button>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {backups.length === 0 ? (
            <p className="px-4 py-6 text-xs text-muted text-center">Henüz yedek yok</p>
          ) : (
            backups.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onRestore(b.content)
                  onClose()
                }}
                className="w-full px-4 py-2.5 text-left border-b border-border hover:bg-surface-overlay transition-colors cursor-pointer"
              >
                <span className="text-xs text-foreground block">{b.label}</span>
                <span className="text-xs text-muted">{b.content.length} karakter</span>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  )
}
