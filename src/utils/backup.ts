export interface BackupEntry {
  id: string
  tabId: string
  content: string
  savedAt: number
  label: string
}

const BACKUP_KEY = 'mdviewer-backups'
const MAX_BACKUPS_PER_TAB = 20

function loadAll(): BackupEntry[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveAll(entries: BackupEntry[]): void {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify(entries))
  } catch {
    /* ignore quota */
  }
}

export function saveBackup(tabId: string, content: string): void {
  const all = loadAll()
  const forTab = all.filter((b) => b.tabId === tabId)
  const last = forTab[0]
  if (last && last.content === content) return

  const entry: BackupEntry = {
    id: crypto.randomUUID(),
    tabId,
    content,
    savedAt: Date.now(),
    label: new Date().toLocaleString('tr-TR'),
  }

  const updated = [entry, ...all.filter((b) => b.tabId !== tabId || b.content !== content)]
  const trimmed = updated.reduce<BackupEntry[]>((acc, item) => {
    const tabCount = acc.filter((b) => b.tabId === item.tabId).length
    if (tabCount < MAX_BACKUPS_PER_TAB) acc.push(item)
    return acc
  }, [])

  saveAll(trimmed)
}

export function getBackups(tabId: string): BackupEntry[] {
  return loadAll().filter((b) => b.tabId === tabId).sort((a, b) => b.savedAt - a.savedAt)
}

export function getAllBackups(): BackupEntry[] {
  return loadAll().sort((a, b) => b.savedAt - a.savedAt)
}
