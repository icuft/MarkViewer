export interface RecentFile {
  id: string
  name: string
  content: string
  openedAt: number
}

const RECENT_KEY = 'mdviewer-recent'
const MAX_RECENT = 10

export function getRecentFiles(): RecentFile[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRecentFile(name: string, content: string): void {
  const recent = getRecentFiles().filter((f) => f.name !== name)
  const entry: RecentFile = {
    id: crypto.randomUUID(),
    name,
    content,
    openedAt: Date.now(),
  }
  const updated = [entry, ...recent].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {
    /* ignore */
  }
}
