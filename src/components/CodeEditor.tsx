import {
  autocompletion,
  type Completion,
  type CompletionContext,
} from '@codemirror/autocomplete'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { defaultKeymap, history, historyKeymap, indentWithTab, undo, redo } from '@codemirror/commands'
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import {
  search,
  searchKeymap,
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  replaceNext,
  replaceAll,
} from '@codemirror/search'
import { EditorState, Compartment, type Extension } from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  type DecorationSet,
  type ViewUpdate,
  keymap,
  lineNumbers,
  highlightActiveLine,
  drawSelection,
  placeholder,
} from '@codemirror/view'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import type { SelectionResult } from '../utils/markdown'
import type { AppSettings } from '../hooks/useSettings'

export interface SearchOptions {
  search: string
  replace?: string
  caseSensitive?: boolean
  regexp?: boolean
  wholeWord?: boolean
}

export interface EditorHandle {
  getSelection: () => { start: number; end: number; text: string }
  applyResult: (result: SelectionResult) => void
  focus: () => void
  commitSearch: (options: SearchOptions) => void
  clearSearch: () => void
  findNext: () => void
  findPrevious: () => void
  replaceNext: () => void
  replaceAll: () => void
  undo: () => void
  redo: () => void
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  settings: Pick<
    AppSettings,
    'editorFontSize' | 'showLineNumbers' | 'focusMode' | 'spellCheck'
  >
  onFormat?: (action: string) => void
}

const SNIPPETS: Completion[] = [
  { label: 'link', type: 'keyword', apply: '[metin](url)' },
  { label: 'image', type: 'keyword', apply: '![alt](url)' },
  {
    label: 'table',
    type: 'keyword',
    apply: '| Başlık | Başlık |\n|--------|--------|\n| Hücre | Hücre |',
  },
  { label: 'codeblock', type: 'keyword', apply: '```\nkod\n```' },
  { label: 'mermaid', type: 'keyword', apply: '```mermaid\ngraph TD\n  A --> B\n```' },
  { label: 'math', type: 'keyword', apply: '$E=mc^2$' },
  { label: 'checkbox', type: 'keyword', apply: '- [ ] Görev' },
]

function markdownCompletions(context: CompletionContext) {
  const word = context.matchBefore(/[@\w-]*/)
  if (!word || (word.from === word.to && !context.explicit)) return null
  return { from: word.from, options: SNIPPETS }
}

const focusDimMark = Decoration.mark({ class: 'cm-focus-dim' })

function createFocusPlugin(enabled: boolean) {
  if (!enabled) return []
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet = Decoration.none

      constructor(view: EditorView) {
        this.decorations = this.build(view)
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet) {
          this.decorations = this.build(update.view)
        }
      }

      build(view: EditorView) {
        const { head } = view.state.selection.main
        const line = view.state.doc.lineAt(head)
        let blockStart = line.from
        let blockEnd = line.to

        for (let i = line.number - 1; i >= 1; i--) {
          const l = view.state.doc.line(i)
          if (l.text.trim() === '') break
          blockStart = l.from
        }
        for (let i = line.number + 1; i <= view.state.doc.lines; i++) {
          const l = view.state.doc.line(i)
          if (l.text.trim() === '') break
          blockEnd = l.to
        }

        const marks = []
        if (blockStart > 0) marks.push(focusDimMark.range(0, blockStart))
        if (blockEnd < view.state.doc.length) {
          marks.push(focusDimMark.range(blockEnd, view.state.doc.length))
        }
        return Decoration.set(marks)
      }
    },
    { decorations: (v) => v.decorations },
  )
}

const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading, color: 'var(--color-foreground)', fontWeight: '700' },
  { tag: tags.strong, color: 'var(--color-foreground)', fontWeight: '700' },
  { tag: tags.emphasis, color: 'var(--color-foreground)', fontStyle: 'italic' },
  { tag: tags.strikethrough, color: 'var(--color-prose)', textDecoration: 'line-through' },
  { tag: tags.link, color: 'var(--color-accent)', textDecoration: 'underline' },
  { tag: tags.url, color: 'var(--color-accent-dim)' },
  { tag: tags.monospace, color: 'var(--color-accent)' },
  { tag: tags.quote, color: 'var(--color-prose)' },
  { tag: tags.list, color: 'var(--color-foreground)' },
  { tag: tags.meta, color: 'var(--color-muted)' },
  { tag: tags.processingInstruction, color: 'var(--color-muted)' },
  { tag: tags.comment, color: 'var(--color-muted)' },
  { tag: tags.content, color: 'var(--color-foreground)' },
])

function editorTheme(fontSize: number): Extension {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: `${fontSize}px`,
      color: 'var(--color-foreground)',
      backgroundColor: 'var(--color-surface)',
    },
    '.cm-scroller': {
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      lineHeight: '1.7',
      scrollbarWidth: 'thin',
      scrollbarColor: 'var(--color-border-strong) transparent',
    },
    '.cm-content': {
      padding: '16px 0',
      caretColor: 'var(--color-accent)',
      color: 'var(--color-foreground)',
    },
    '.cm-line': {
      color: 'var(--color-foreground)',
    },
    '.cm-cursor': { borderLeftColor: 'var(--color-accent)' },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)',
    },
    '.cm-activeLine': { backgroundColor: 'var(--color-surface-overlay)' },
    '.cm-gutters': {
      backgroundColor: 'var(--color-surface-raised)',
      color: 'var(--color-muted)',
      border: 'none',
      borderRight: '1px solid var(--color-border)',
    },
    '.cm-lineNumbers .cm-gutterElement': { padding: '0 8px 0 16px', minWidth: '3ch' },
    '.cm-focus-dim': { opacity: '0.35' },
    '.cm-tooltip-autocomplete': {
      backgroundColor: 'var(--color-surface-raised)',
      border: '1px solid var(--color-border)',
      color: 'var(--color-foreground)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'color-mix(in srgb, var(--color-accent) 28%, transparent)',
      outline: '1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)',
    },
    '.cm-searchMatch-selected': {
      backgroundColor: 'color-mix(in srgb, var(--color-accent) 50%, transparent)',
      outline: '1px solid var(--color-accent)',
    },
    '.cm-panel.cm-search': { display: 'none !important' },
  })
}

const editorSearchKeymap = searchKeymap.filter(
  (binding) => binding.key !== 'Mod-f' && binding.key !== 'Escape',
)

const hiddenSearchPanel = search({
  top: true,
  createPanel: () => {
    const dom = document.createElement('div')
    dom.style.display = 'none'
    return { dom, top: true }
  },
})

function handleEnterList(view: EditorView): boolean {
  const { state } = view
  const { head } = state.selection.main
  const line = state.doc.lineAt(head)
  const text = line.text
  const ulMatch = /^(\s*)([-*+]|\d+\.)\s/.exec(text)
  if (!ulMatch) return false
  const isOrdered = /\d+\./.test(ulMatch[2])
  const indent = ulMatch[1]
  const prefix = isOrdered ? `${indent}1. ` : `${indent}- `
  view.dispatch({
    changes: { from: head, insert: `\n${prefix}` },
    selection: { anchor: head + 1 + prefix.length },
  })
  return true
}

function handleLinkSnippet(view: EditorView): boolean {
  const { head } = view.state.selection.main
  view.dispatch({
    changes: { from: head, insert: '[]()' },
    selection: { anchor: head + 1 },
  })
  return true
}

export const CodeEditor = forwardRef<EditorHandle, CodeEditorProps>(function CodeEditor(
  { value, onChange, settings, onFormat },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const compartmentRef = useRef(new Compartment())
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useImperativeHandle(ref, () => ({
    getSelection: () => {
      const view = viewRef.current
      if (!view) return { start: 0, end: 0, text: value }
      const { from, to } = view.state.selection.main
      return { start: from, end: to, text: view.state.doc.toString() }
    },
    applyResult: (result: SelectionResult) => {
      const view = viewRef.current
      if (!view) return
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: result.text },
        selection: { anchor: result.selectionStart, head: result.selectionEnd },
      })
    },
    focus: () => viewRef.current?.focus(),
    commitSearch: (options: SearchOptions) => {
      const view = viewRef.current
      if (!view) return
      const query = new SearchQuery({
        search: options.search,
        replace: options.replace ?? '',
        caseSensitive: options.caseSensitive ?? false,
        regexp: options.regexp ?? false,
        wholeWord: options.wholeWord ?? false,
      })
      view.dispatch({ effects: setSearchQuery.of(query) })
    },
    clearSearch: () => {
      const view = viewRef.current
      if (!view) return
      view.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: '' })) })
    },
    findNext: () => {
      const view = viewRef.current
      if (view) findNext(view)
    },
    findPrevious: () => {
      const view = viewRef.current
      if (view) findPrevious(view)
    },
    replaceNext: () => {
      const view = viewRef.current
      if (view) replaceNext(view)
    },
    replaceAll: () => {
      const view = viewRef.current
      if (view) replaceAll(view)
    },
    undo: () => {
      const view = viewRef.current
      if (view) undo(view)
    },
    redo: () => {
      const view = viewRef.current
      if (view) redo(view)
    },
  }))

  const buildExtensions = useCallback((): Extension[] => {
    const exts: Extension[] = [
      hiddenSearchPanel,
      history(),
      drawSelection(),
      highlightActiveLine(),
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(markdownHighlight, { fallback: true }),
      editorTheme(settings.editorFontSize),
      placeholder('Markdown yazmaya başlayın…'),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({
        spellcheck: settings.spellCheck ? 'true' : 'false',
        lang: 'tr',
      }),
      autocompletion({ override: [markdownCompletions], activateOnTyping: true }),
      createFocusPlugin(settings.focusMode),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current(update.state.doc.toString())
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...editorSearchKeymap,
        indentWithTab,
        { key: 'Enter', run: handleEnterList },
        { key: 'Mod-Shift-k', run: handleLinkSnippet },
        { key: 'Mod-b', run: () => { onFormat?.('bold'); return true } },
        { key: 'Mod-i', run: () => { onFormat?.('italic'); return true } },
        { key: 'Mod-k', run: () => { onFormat?.('link'); return true } },
      ]),
    ]
    if (settings.showLineNumbers) exts.push(lineNumbers())
    return exts
  }, [settings, onFormat])

  useEffect(() => {
    if (!containerRef.current) return
    const state = EditorState.create({
      doc: value,
      extensions: [compartmentRef.current.of(buildExtensions())],
    })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view
    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    view.dispatch({ effects: compartmentRef.current.reconfigure(buildExtensions()) })
  }, [buildExtensions])

  return <div ref={containerRef} className="editor-scroll flex-1 min-h-0 overflow-hidden" />
})
