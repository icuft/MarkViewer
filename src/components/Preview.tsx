import { isValidElement, useMemo, useRef, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { MermaidBlock } from './MermaidBlock'
import { rehypeProtectMermaid } from '../utils/rehypeProtectMermaid'
import { extractToc } from '../utils/toc'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

interface PreviewProps {
  content: string
  fontSize: number
  showToc: boolean
}

function extractText(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (typeof children === 'number') return String(children)
  if (Array.isArray(children)) return children.map(extractText).join('')
  if (isValidElement<{ children?: ReactNode }>(children)) {
    return extractText(children.props.children)
  }
  return ''
}

function isMermaidCode(className?: string): boolean {
  return !!className?.split(' ').includes('language-mermaid')
}

export function Preview({ content, fontSize, showToc }: PreviewProps) {
  const toc = useMemo(() => extractToc(content), [content])
  const headingIds = useMemo(() => toc.map((t) => t.id), [toc])
  const headingIndexRef = useRef(0)
  headingIndexRef.current = 0

  const nextHeadingId = () => headingIds[headingIndexRef.current++] ?? ''

  if (!content.trim()) {
    return (
      <div className="prose-markdown h-full overflow-y-auto thin-scrollbar px-6 py-5" style={{ fontSize }}>
        <p className="text-muted text-sm italic">Önizleme burada görünecek…</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto thin-scrollbar flex min-h-0">
      {showToc && toc.length > 0 && (
        <nav className="hidden lg:block w-48 shrink-0 border-r border-border px-4 py-5 overflow-y-auto thin-scrollbar">
          <p className="text-xs font-medium uppercase tracking-widest text-muted mb-3">İçindekiler</p>
          <ul className="space-y-1.5">
            {toc.map((item) => (
              <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 10}px` }}>
                <a
                  href={`#${item.id}`}
                  className="text-xs text-muted hover:text-accent transition-colors line-clamp-2"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="prose-markdown flex-1 px-6 py-5 min-w-0" style={{ fontSize }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[
            rehypeKatex,
            rehypeProtectMermaid,
            [rehypeHighlight, { ignoreMissing: true }],
          ]}
          components={{
            h1: ({ children }) => <h1 id={nextHeadingId()}>{children}</h1>,
            h2: ({ children }) => <h2 id={nextHeadingId()}>{children}</h2>,
            h3: ({ children }) => <h3 id={nextHeadingId()}>{children}</h3>,
            h4: ({ children }) => <h4 id={nextHeadingId()}>{children}</h4>,
            pre: ({ children, ...props }) => {
              if (isValidElement<{ className?: string; children?: ReactNode }>(children)) {
                const className = children.props.className
                if (isMermaidCode(className)) {
                  const code = extractText(children.props.children).replace(/\n$/, '')
                  return <MermaidBlock chart={code} />
                }
              }
              return (
                <pre {...props} className="thin-scrollbar">
                  {children}
                </pre>
              )
            },
            code: ({ className, children, ...props }) => {
              if (isMermaidCode(className)) return null
              if (className) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              }
              return <code {...props}>{children}</code>
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
