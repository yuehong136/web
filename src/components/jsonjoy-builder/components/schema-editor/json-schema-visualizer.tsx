import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import { AlertCircle, Download, FileJson, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState, type FC } from 'react'
import { useMonacoTheme } from '../../hooks/use-monaco-theme'
import { useTranslation } from '../../hooks/use-translation'
import { cn } from '@/lib/utils'
import { configureMonacoLoader } from '../../lib/configure-monaco-loader'
import { jsonSchemaType, type JSONSchema } from '../../types/json-schema'

configureMonacoLoader()

export type JsonSchemaValidationState = {
  valid: boolean
  message?: string
}

/** @public */
export interface JsonSchemaVisualizerProps {
  schema: JSONSchema
  className?: string
  onChange?: (schema: JSONSchema) => void
  onValidationChange?: (state: JsonSchemaValidationState) => void
  readOnly?: boolean
  showHeader?: boolean
}

/** @public */
const JsonSchemaVisualizer: FC<JsonSchemaVisualizerProps> = ({
  schema,
  className,
  onChange,
  onValidationChange,
  readOnly = false,
  showHeader = true,
}) => {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const [loadTimedOut, setLoadTimedOut] = useState(false)
  const {
    currentTheme,
    defineMonacoThemes,
    configureJsonDefaults,
    defaultEditorOptions,
  } = useMonacoTheme()

  const t = useTranslation()

  useEffect(() => {
    onValidationChange?.({ valid: true })
  }, [onValidationChange, schema])

  useEffect(() => {
    setLoadTimedOut(false)
    const timer = window.setTimeout(() => {
      if (!editorRef.current) {
        setLoadTimedOut(true)
      }
    }, 8000)

    return () => window.clearTimeout(timer)
  }, [])

  const handleBeforeMount: BeforeMount = (monaco) => {
    defineMonacoThemes(monaco)
    configureJsonDefaults(monaco)
  }

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    setLoadTimedOut(false)
    editor.focus()
  }

  const handleEditorChange = (value: string | undefined) => {
    if (!value) {
      onValidationChange?.({
        valid: false,
        message: 'JSON Schema source is empty',
      })
      return
    }

    try {
      const parsedJson = JSON.parse(value)
      const validationResult = jsonSchemaType.safeParse(parsedJson)
      if (!validationResult.success) {
        onValidationChange?.({
          valid: false,
          message: validationResult.error.issues[0]?.message,
        })
        return
      }

      onValidationChange?.({ valid: true })
      if (onChange) {
        onChange(validationResult.data)
      }
    } catch (_error) {
      onValidationChange?.({
        valid: false,
        message: 'Invalid JSON Schema source',
      })
    }
  }

  const handleDownload = () => {
    const content = JSON.stringify(schema, null, 2)
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = t.visualizerDownloadFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden h-full flex flex-col',
        className,
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between bg-surface-secondary px-space-md py-space-sm border-b border-border-primary shrink-0">
          <div className="flex items-center gap-space-sm">
            <FileJson size={18} />
            <span className="font-medium text-sm">{t.visualizerSource}</span>
          </div>
          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 hover:bg-surface-tertiary rounded-radius-md transition-colors"
            title={t.visualizerDownloadTitle}
          >
            <Download size={16} />
          </button>
        </div>
      )}
      <div className="grow flex min-h-0">
        {loadTimedOut && (
          <div className="absolute inset-x-space-md bottom-space-md z-10 rounded-radius-md border border-status-warning bg-surface-primary p-space-sm shadow-elevation-low">
            <div className="flex items-start gap-space-sm">
              <AlertCircle className="mt-0.5 h-icon-sm w-icon-sm shrink-0 text-status-warning" />
              <div className="space-y-space-xs">
                <p className="text-sm font-medium text-text-primary">
                  {t.visualizerLoadTimeoutTitle}
                </p>
                <p className="text-xs text-text-secondary">
                  {t.visualizerLoadTimeoutDescription}
                </p>
              </div>
            </div>
          </div>
        )}
        <Editor
          height="100%"
          defaultLanguage="json"
          value={JSON.stringify(schema, null, 2)}
          onChange={handleEditorChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorDidMount}
          className="w-full h-full"
          loading={
            <div className="flex items-center justify-center h-full w-full bg-surface-secondary">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          }
          options={{ ...defaultEditorOptions, readOnly }}
          theme={currentTheme}
        />
      </div>
    </div>
  )
}

export default JsonSchemaVisualizer
