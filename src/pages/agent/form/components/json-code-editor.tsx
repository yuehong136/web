import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { configureMonacoLoader } from '@/components/jsonjoy-builder/lib/configure-monaco-loader'
import { useMonacoTheme } from '@/components/jsonjoy-builder/hooks/use-monaco-theme'

configureMonacoLoader()

type JsonCodeEditorProps = {
  value?: string
  onChange?: (value: string) => void
  height?: number | string
}

export function JsonCodeEditor({
  value = '',
  onChange,
  height = 220,
}: JsonCodeEditorProps) {
  const { currentTheme, defineMonacoThemes, configureJsonDefaults } =
    useMonacoTheme()
  const monacoRef = useRef<Parameters<BeforeMount>[0] | null>(null)

  const handleBeforeMount: BeforeMount = (monaco) => {
    monacoRef.current = monaco
    defineMonacoThemes(monaco)
    configureJsonDefaults(monaco)
    // Apply theme synchronously before the editor is created so the first
    // paint already lands on the correct palette.
    monaco.editor.setTheme(currentTheme)
  }

  const handleMount: OnMount = (_editor, monaco) => {
    monacoRef.current = monaco
    monaco.editor.setTheme(currentTheme)
  }

  // Monaco themes are global; switching app theme after the editor mounted
  // requires re-running setTheme on the singleton.
  useEffect(() => {
    monacoRef.current?.editor.setTheme(currentTheme)
  }, [currentTheme])

  return (
    <div className="rounded-radius-md overflow-hidden border border-border-default">
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
        theme={currentTheme}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={(nextValue) => onChange?.(nextValue ?? '')}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          lineNumbers: 'on',
          fontSize: 13,
          tabSize: 2,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  )
}
