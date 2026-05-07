import Editor from '@monaco-editor/react'
import { configureMonacoLoader } from '@/components/jsonjoy-builder/lib/configure-monaco-loader'

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
  return (
    <div className="overflow-hidden rounded-radius-md border border-border-default">
      <Editor
        height={height}
        defaultLanguage="json"
        value={value}
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
