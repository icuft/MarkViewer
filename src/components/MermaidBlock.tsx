import { useEffect, useRef } from 'react'
import mermaid from 'mermaid'

interface MermaidBlockProps {
  chart: string
}

function getMermaidTheme(): 'default' | 'dark' {
  const theme = document.documentElement.dataset.theme
  return theme === 'light' || theme === 'sepia' ? 'default' : 'dark'
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !chart.trim()) return

    let cancelled = false

    const render = async () => {
      mermaid.initialize({
        startOnLoad: false,
        theme: getMermaidTheme(),
        securityLevel: 'loose',
        fontFamily: 'DM Sans, system-ui, sans-serif',
      })

      const id = `mermaid-${crypto.randomUUID().replace(/-/g, '')}`

      try {
        const { svg, bindFunctions } = await mermaid.render(id, chart.trim())
        if (cancelled || !ref.current) return
        ref.current.innerHTML = svg
        bindFunctions?.(ref.current)
      } catch (err) {
        if (cancelled || !ref.current) return
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
        ref.current.innerHTML = `<pre class="text-red-400 text-xs p-2 border border-border whitespace-pre-wrap">Mermaid hatası: ${msg}</pre>`
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [chart])

  return (
    <div
      ref={ref}
      className="mermaid-block my-4 p-4 border border-border bg-surface-overlay overflow-x-auto thin-scrollbar"
    />
  )
}
