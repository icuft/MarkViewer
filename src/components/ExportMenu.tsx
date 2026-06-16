import { useState } from 'react'
import { exportHtml, exportPdf, downloadMarkdown } from '../utils/export'

interface ExportMenuProps {
  content: string
  fileName: string
}

export function ExportMenu({ content, fileName }: ExportMenuProps) {
  const [open, setOpen] = useState(false)

  const title = fileName.replace(/\.md$/, '') || 'belge'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="px-2.5 sm:px-3 py-1.5 text-xs font-medium border border-accent text-accent hover:bg-accent hover:text-on-accent transition-colors cursor-pointer"
      >
        Dışa Aktar
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-1 z-50 w-40 border border-border bg-surface-raised shadow-[4px_4px_0_0_var(--color-border-strong)]">
            {[
              { label: 'Markdown (.md)', action: () => downloadMarkdown(content, fileName) },
              { label: 'HTML (.html)', action: () => exportHtml(content, title) },
              { label: 'PDF (yazdır)', action: () => exportPdf(content, title) },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  item.action()
                  setOpen(false)
                }}
                className="w-full px-3 py-2 text-xs text-left text-muted hover:text-foreground hover:bg-surface-overlay transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
