import { MarkdownEditor } from './components/MarkdownEditor'

function App() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="h-1 bg-accent shrink-0" />
      <div className="flex-1 min-h-0">
        <MarkdownEditor />
      </div>
    </div>
  )
}

export default App
