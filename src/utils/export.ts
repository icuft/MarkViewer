import { extractToc } from './toc'

const BASE_STYLES = `
  body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.7; color: #1a1a1a; }
  h1,h2,h3 { margin-top: 1.5em; }
  h1 { border-bottom: 2px solid #ddd; padding-bottom: 0.3em; }
  blockquote { border-left: 3px solid #00e5c7; padding-left: 1em; color: #555; }
  code { background: #f4f4f4; padding: 0.15em 0.4em; border-radius: 3px; font-size: 0.9em; }
  pre { background: #f4f4f4; padding: 1em; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ddd; padding: 0.5em; }
  th { background: #f4f4f4; }
  a { color: #0066cc; }
  .toc { background: #f9f9f9; border: 1px solid #ddd; padding: 1em; margin-bottom: 2em; }
  .toc ul { list-style: none; padding-left: 1em; }
  .toc a { text-decoration: none; color: #333; }
  .toc a:hover { text-decoration: underline; }
`

function markdownToBasicHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^###### (.+)$/gm, '<h6>$1</h6>')
    .replace(/^##### (.+)$/gm, '<h5>$1</h5>')
    .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^---$/gm, '<hr>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\n\n/g, '</p><p>')
  return `<p>${html}</p>`
}

function buildTocHtml(content: string): string {
  const items = extractToc(content)
  if (items.length === 0) return ''
  const links = items
    .map(
      (item) =>
        `<li style="margin-left:${(item.level - 1) * 12}px"><a href="#${item.id}">${item.text}</a></li>`,
    )
    .join('')
  return `<nav class="toc"><strong>İçindekiler</strong><ul>${links}</ul></nav>`
}

export function buildHtmlDocument(content: string, title: string, includeToc = true): string {
  const toc = includeToc ? buildTocHtml(content) : ''
  const body = markdownToBasicHtml(content)
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  ${toc}
  ${body}
</body>
</html>`
}

export function exportHtml(content: string, title: string): void {
  const html = buildHtmlDocument(content, title)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${title.replace(/\.md$/, '')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportPdf(content: string, title: string): void {
  const html = buildHtmlDocument(content, title)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.onload = () => win.print()
}

export function downloadMarkdown(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`
  a.click()
  URL.revokeObjectURL(url)
}
