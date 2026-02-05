import { useIsDarkTheme } from '@/themes'
import type * as Monaco from 'monaco-editor'
import type { JSONSchema } from '../types/json-schema'

export interface MonacoEditorOptions {
  minimap?: { enabled: boolean }
  fontSize?: number
  fontFamily?: string
  lineNumbers?: 'on' | 'off'
  roundedSelection?: boolean
  scrollBeyondLastLine?: boolean
  readOnly?: boolean
  automaticLayout?: boolean
  formatOnPaste?: boolean
  formatOnType?: boolean
  tabSize?: number
  insertSpaces?: boolean
  detectIndentation?: boolean
  folding?: boolean
  foldingStrategy?: 'auto' | 'indentation'
  renderLineHighlight?: 'all' | 'line' | 'none' | 'gutter'
  matchBrackets?: 'always' | 'near' | 'never'
  autoClosingBrackets?:
    | 'always'
    | 'languageDefined'
    | 'beforeWhitespace'
    | 'never'
  autoClosingQuotes?:
    | 'always'
    | 'languageDefined'
    | 'beforeWhitespace'
    | 'never'
  guides?: {
    bracketPairs?: boolean
    indentation?: boolean
  }
}

export const defaultEditorOptions: MonacoEditorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  fontFamily: "var(--font-sans), 'SF Mono', Monaco, Menlo, Consolas, monospace",
  lineNumbers: 'on',
  roundedSelection: false,
  scrollBeyondLastLine: false,
  readOnly: false,
  automaticLayout: true,
  formatOnPaste: true,
  formatOnType: true,
  tabSize: 2,
  insertSpaces: true,
  detectIndentation: true,
  folding: true,
  foldingStrategy: 'indentation',
  renderLineHighlight: 'all',
  matchBrackets: 'always',
  autoClosingBrackets: 'always',
  autoClosingQuotes: 'always',
  guides: {
    bracketPairs: true,
    indentation: true,
  },
}

export function useMonacoTheme() {
  const isDarkTheme = useIsDarkTheme()

  const defineMonacoThemes = (monaco: typeof Monaco) => {
    // Define custom light theme that matches app colors
    monaco.editor.defineTheme('appLightTheme', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'string', foreground: '3B82F6' },
        { token: 'number', foreground: 'A855F7' },
        { token: 'keyword', foreground: '3B82F6' },
        { token: 'delimiter', foreground: '0F172A' },
        { token: 'keyword.json', foreground: 'A855F7' },
        { token: 'string.key.json', foreground: '2563EB' },
        { token: 'string.value.json', foreground: '3B82F6' },
        { token: 'boolean', foreground: '22C55E' },
        { token: 'null', foreground: '64748B' },
      ],
      colors: {
        'editor.background': '#f8fafc',
        'editor.foreground': '#0f172a',
        'editorCursor.foreground': '#0f172a',
        'editor.lineHighlightBackground': '#f1f5f9',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#e2e8f0',
        'editor.inactiveSelectionBackground': '#e2e8f0',
        'editorIndentGuide.background': '#e2e8f0',
        'editor.findMatchBackground': '#cbd5e1',
        'editor.findMatchHighlightBackground': '#cbd5e133',
      },
    })

    // Define custom dark theme that matches app colors
    monaco.editor.defineTheme('appDarkTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'string', foreground: '3B82F6' },
        { token: 'number', foreground: 'A855F7' },
        { token: 'keyword', foreground: '3B82F6' },
        { token: 'delimiter', foreground: 'F8FAFC' },
        { token: 'keyword.json', foreground: 'A855F7' },
        { token: 'string.key.json', foreground: '60A5FA' },
        { token: 'string.value.json', foreground: '3B82F6' },
        { token: 'boolean', foreground: '22C55E' },
        { token: 'null', foreground: '94A3B8' },
      ],
      colors: {
        'editor.background': '#0f172a',
        'editor.foreground': '#f8fafc',
        'editorCursor.foreground': '#f8fafc',
        'editor.lineHighlightBackground': '#1e293b',
        'editorLineNumber.foreground': '#64748b',
        'editor.selectionBackground': '#334155',
        'editor.inactiveSelectionBackground': '#334155',
        'editorIndentGuide.background': '#1e293b',
        'editor.findMatchBackground': '#475569',
        'editor.findMatchHighlightBackground': '#47556933',
      },
    })
  }

  // Helper to configure JSON language validation
  const configureJsonDefaults = (
    monaco: typeof Monaco,
    schema?: JSONSchema,
  ) => {
    const diagnosticsOptions: Monaco.languages.json.DiagnosticsOptions = {
      validate: true,
      allowComments: false,
      schemaValidation: 'error',
      enableSchemaRequest: true,
      schemas: schema
        ? [
            {
              uri:
                typeof schema === 'object' && schema.$id
                  ? schema.$id
                  : 'https://jsonjoy-builder/schema',
              fileMatch: ['*'],
              schema,
            },
          ]
        : [
            {
              uri: 'http://json-schema.org/draft-07/schema',
              fileMatch: ['*'],
              schema: {
                $schema: 'http://json-schema.org/draft-07/schema',
                type: 'object',
                additionalProperties: true,
              },
            },
          ],
    }

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions(
      diagnosticsOptions,
    )
  }

  return {
    isDarkTheme,
    currentTheme: isDarkTheme ? 'appDarkTheme' : 'appLightTheme',
    defineMonacoThemes,
    configureJsonDefaults,
    defaultEditorOptions,
  }
}
