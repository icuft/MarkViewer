export type ViewMode = 'split' | 'edit' | 'preview'

export interface SelectionResult {
  text: string
  selectionStart: number
  selectionEnd: number
}

export function wrapSelection(
  text: string,
  start: number,
  end: number,
  prefix: string,
  suffix: string = prefix,
  placeholder = 'metin',
): SelectionResult {
  const selected = text.slice(start, end)
  const content = selected || placeholder
  const newText = text.slice(0, start) + prefix + content + suffix + text.slice(end)
  return {
    text: newText,
    selectionStart: start + prefix.length,
    selectionEnd: start + prefix.length + content.length,
  }
}

export function prefixLines(
  text: string,
  start: number,
  end: number,
  prefix: string,
): SelectionResult {
  const before = text.slice(0, start)
  const selected = text.slice(start, end)
  const after = text.slice(end)

  const lineStart = before.lastIndexOf('\n') + 1
  const block = text.slice(lineStart, end || start)
  const lines = block.split('\n')
  const prefixed = lines.map((line) => (line ? `${prefix}${line}` : prefix.trimEnd())).join('\n')

  const newText = text.slice(0, lineStart) + prefixed + after
  const offset = prefixed.length - block.length

  return {
    text: newText,
    selectionStart: start + (selected ? 0 : prefix.length),
    selectionEnd: end + offset,
  }
}

export function insertLink(
  text: string,
  start: number,
  end: number,
): SelectionResult {
  const selected = text.slice(start, end)
  const label = selected || 'bağlantı metni'
  const snippet = `[${label}](url)`
  const newText = text.slice(0, start) + snippet + text.slice(end)
  const urlStart = start + label.length + 3
  return {
    text: newText,
    selectionStart: urlStart,
    selectionEnd: urlStart + 3,
  }
}

export const DEFAULT_MARKDOWN = `# Markdown Düzenleyici

Modern, köşeli tasarımlı tam özellikli bir **markdown** editörüne hoş geldiniz.

## Özellikler

- Canlı önizleme ve sözdizimi vurgulama
- Çoklu sekme, dosya aç/kaydet
- Matematik, Mermaid diyagramları
- PDF / HTML dışa aktarma

## Matematik

Inline: $E = mc^2$

Blok:

$$
\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}
$$

## Mermaid Diyagramı

\`\`\`mermaid
graph LR
  A[Düzenle] --> B[Önizle]
  B --> C[Dışa Aktar]
\`\`\`

## Kod Örneği

\`\`\`typescript
const mesaj = "Merhaba, dünya!";
console.log(mesaj);
\`\`\`

## Alıntı

> İyi tasarım, mümkün olduğunca az tasarımdır.

## Liste

- Sözdizimi vurgulama
- Geri al / yinele
- Otomatik tamamlama

## Tablo

| Özellik | Durum |
|---------|-------|
| Düzenleme | ✓ |
| Önizleme | ✓ |

---

*Ctrl+S kaydet · Ctrl+F ara · F11 tam ekran*
`
