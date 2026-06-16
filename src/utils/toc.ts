export interface TocItem {
  id: string
  level: number
  text: string
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u00C0-\u024F-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export function extractToc(content: string): TocItem[] {
  const items: TocItem[] = []
  const seen = new Map<string, number>()

  for (const line of content.split('\n')) {
    const match = /^(#{1,6})\s+(.+)$/.exec(line.trim())
    if (!match) continue

    const level = match[1].length
    const text = match[2].replace(/[#*_`[\]]/g, '').trim()
    if (!text) continue

    let id = slugify(text)
    const count = seen.get(id) ?? 0
    seen.set(id, count + 1)
    if (count > 0) id = `${id}-${count}`

    items.push({ id, level, text })
  }

  return items
}
