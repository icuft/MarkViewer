import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

/** Prevent rehype-highlight from corrupting mermaid code blocks */
export function rehypeProtectMermaid() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index == null) return
      const code = node.children[0]
      if (code?.type !== 'element' || code.tagName !== 'code') return

      const cls = code.properties?.className
      const list = Array.isArray(cls) ? cls.map(String) : cls ? [String(cls)] : []
      if (!list.some((c) => c.includes('language-mermaid'))) return

      // Flatten to plain text so highlight plugin skips spans
      const text = extractHastText(code)
      code.children = [{ type: 'text', value: text }]
      delete code.properties?.['data-highlighted']
    })
  }
}

function extractHastText(node: Element | { type: string; value?: string; children?: unknown[] }): string {
  if (node.type === 'text' && 'value' in node) return node.value ?? ''
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map((c) => extractHastText(c as Element)).join('')
  }
  return ''
}
