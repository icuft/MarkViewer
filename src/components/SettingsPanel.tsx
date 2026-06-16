import type { AppSettings, Theme, SplitDirection } from '../hooks/useSettings'
import { THEME_LABELS } from '../hooks/useSettings'

interface SettingsPanelProps {
  settings: AppSettings
  accentPresets: string[]
  onUpdate: (patch: Partial<AppSettings>) => void
  onClose: () => void
}

const themes: Theme[] = ['dark', 'light', 'sepia', 'high-contrast', 'amoled']

export function SettingsPanel({
  settings,
  accentPresets,
  onUpdate,
  onClose,
}: SettingsPanelProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-full mt-1 z-50 w-80 border border-border bg-surface-raised shadow-[4px_4px_0_0_var(--color-border-strong)] max-h-[80vh] overflow-y-auto">
        <div className="px-4 py-3 border-b border-border sticky top-0 bg-surface-raised">
          <h2 className="text-sm font-semibold text-foreground">Ayarlar</h2>
        </div>

        <div className="p-4 space-y-5">
          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted block mb-2">
              Tema
            </label>
            <div className="grid grid-cols-2 gap-1">
              {themes.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => onUpdate({ theme })}
                  className={`px-3 py-2 text-xs font-medium border transition-colors cursor-pointer ${
                    settings.theme === theme
                      ? 'bg-accent text-on-accent border-accent'
                      : 'text-muted border-border hover:text-foreground hover:bg-surface-overlay'
                  }`}
                >
                  {THEME_LABELS[theme]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted block mb-2">
              Vurgu rengi
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {accentPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  title={color}
                  aria-label={`Renk ${color}`}
                  onClick={() => onUpdate({ accentColor: color })}
                  className={`w-7 h-7 border-2 transition-transform cursor-pointer ${
                    settings.accentColor === color
                      ? 'border-foreground scale-110'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => onUpdate({ accentColor: e.target.value })}
                className="w-9 h-9 border border-border bg-transparent cursor-pointer p-0.5"
                aria-label="Özel renk seç"
              />
              <input
                type="text"
                defaultValue={settings.accentColor}
                key={settings.accentColor}
                onBlur={(e) => {
                  const val = e.target.value.trim()
                  if (/^#[0-9a-fA-F]{6}$/.test(val)) onUpdate({ accentColor: val })
                }}
                className="flex-1 px-2 py-1.5 text-xs font-mono border border-border bg-surface text-foreground outline-none focus:border-accent"
                spellCheck={false}
                placeholder="#00e5c7"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted block mb-2">
              Düzen
            </label>
            <div className="space-y-2">
              <div className="flex border border-border">
                {(['horizontal', 'vertical'] as SplitDirection[]).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => onUpdate({ splitDirection: dir })}
                    className={`flex-1 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      settings.splitDirection === dir
                        ? 'bg-accent text-on-accent'
                        : 'text-muted hover:text-foreground hover:bg-surface-overlay'
                    }`}
                  >
                    {dir === 'horizontal' ? 'Yatay bölünme' : 'Dikey bölünme'}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => onUpdate({ panelsSwapped: !settings.panelsSwapped })}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium border border-border text-muted hover:text-foreground hover:border-border-strong transition-colors cursor-pointer"
              >
                <span>Önizleme solda / üstte</span>
                <span
                  className={`w-8 h-4 border border-border relative transition-colors ${
                    settings.panelsSwapped ? 'bg-accent' : 'bg-surface-overlay'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-2.5 h-2.5 transition-transform ${
                      settings.panelsSwapped
                        ? 'translate-x-4 bg-on-accent'
                        : 'translate-x-0.5 bg-foreground'
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted block mb-2">
              Yazı tipi boyutu
            </label>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Editör</span>
                <span>{settings.editorFontSize}px</span>
              </div>
              <input
                type="range"
                min={11}
                max={24}
                value={settings.editorFontSize}
                onChange={(e) => onUpdate({ editorFontSize: Number(e.target.value) })}
                className="w-full accent-accent"
              />
              <div className="flex items-center justify-between text-xs text-muted">
                <span>Önizleme</span>
                <span>{settings.previewFontSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={28}
                value={settings.previewFontSize}
                onChange={(e) => onUpdate({ previewFontSize: Number(e.target.value) })}
                className="w-full accent-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-widest text-muted block mb-2">
              Kelime hedefi
            </label>
            <input
              type="number"
              min={0}
              step={100}
              value={settings.wordGoal || ''}
              onChange={(e) => onUpdate({ wordGoal: Math.max(0, Number(e.target.value) || 0) })}
              placeholder="0 = kapalı"
              className="w-full px-2 py-1.5 text-xs border border-border bg-surface text-foreground outline-none focus:border-accent"
            />
          </div>

          <div className="space-y-2">
            {[
              { key: 'showLineNumbers' as const, label: 'Satır numaraları' },
              { key: 'focusMode' as const, label: 'Odak modu' },
              { key: 'spellCheck' as const, label: 'Yazım denetimi (Türkçe)' },
              { key: 'showToc' as const, label: 'İçindekiler tablosu' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => onUpdate({ [key]: !settings[key] })}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <span>{label}</span>
                <span
                  className={`w-8 h-4 border border-border relative ${
                    settings[key] ? 'bg-accent' : 'bg-surface-overlay'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-2.5 h-2.5 transition-transform ${
                      settings[key] ? 'translate-x-4 bg-on-accent' : 'translate-x-0.5 bg-foreground'
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>

          <div className="border border-border p-3">
            <p className="text-xs font-medium uppercase tracking-widest text-muted mb-2">
              Klavye kısayolları
            </p>
            <ul className="text-xs text-muted space-y-1">
              <li><kbd className="text-foreground">Ctrl+S</kbd> Kaydet</li>
              <li><kbd className="text-foreground">Ctrl+O</kbd> Dosya aç</li>
              <li><kbd className="text-foreground">Ctrl+N</kbd> Yeni sekme</li>
              <li><kbd className="text-foreground">Ctrl+F</kbd> Ara & değiştir</li>
              <li><kbd className="text-foreground">Ctrl+B/I/K</kbd> Kalın / İtalik / Bağlantı</li>
              <li><kbd className="text-foreground">Ctrl+Z/Y</kbd> Geri al / Yinele</li>
              <li><kbd className="text-foreground">Ctrl+P</kbd> Önizleme modu</li>
              <li><kbd className="text-foreground">F11</kbd> Tam ekran</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}
