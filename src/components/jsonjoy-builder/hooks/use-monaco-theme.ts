import { getTokenValue } from '@/lib/design-tokens'
import {
  APPEARANCE_PRESETS,
  useResolvedAppearance,
  type AppearancePreset,
  type ResolvedTheme,
} from '@/themes'
import type { TokenName } from '@/themes/tokens'
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
    'always' | 'languageDefined' | 'beforeWhitespace' | 'never'
  autoClosingQuotes?:
    'always' | 'languageDefined' | 'beforeWhitespace' | 'never'
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

/** Monaco only takes #rrggbb / #rrggbbaa; token values may be rgba(). */
function monacoColor(value: string): string {
  const match = /^rgba\((\d+), (\d+), (\d+), ([\d.]+)\)$/.exec(value)
  if (!match) return value
  const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${hex(+match[1])}${hex(+match[2])}${hex(+match[3])}${hex(+match[4] * 255)}`
}

/** Editor theme built from the scheme's code and syntax tokens. */
function editorTheme(
  preset: AppearancePreset,
  mode: ResolvedTheme,
): Monaco.editor.IStandaloneThemeData {
  const color = (name: TokenName) =>
    monacoColor(getTokenValue(name, mode, preset))
  const rule = (token: string, name: TokenName) => ({
    token,
    foreground: color(name).slice(1, 7),
  })
  return {
    base: mode === 'dark' ? 'vs-dark' : 'vs',
    inherit: true,
    rules: [
      rule('', 'code-fg'),
      rule('string', 'syntax-string'),
      rule('string.value.json', 'syntax-string'),
      rule('string.key.json', 'syntax-function'),
      rule('number', 'syntax-number'),
      rule('keyword', 'syntax-keyword'),
      rule('keyword.json', 'syntax-keyword'),
      rule('type', 'syntax-type'),
      rule('boolean', 'syntax-number'),
      rule('null', 'syntax-comment'),
      rule('comment', 'syntax-comment'),
      rule('delimiter', 'fg-muted'),
    ],
    colors: {
      'editor.background': color('code-bg'),
      'editor.foreground': color('code-fg'),
      'editorCursor.foreground': color('caret'),
      'editor.lineHighlightBackground': color('fill-hover'),
      'editorLineNumber.foreground': color('fg-subtle'),
      'editorLineNumber.activeForeground': color('fg-muted'),
      'editor.selectionBackground': color('accent-soft-hover'),
      'editor.inactiveSelectionBackground': color('accent-soft'),
      'editorIndentGuide.background1': color('line-subtle'),
      'editor.findMatchBackground': color('highlight-bg'),
      'editor.findMatchHighlightBackground': color('fill-selected'),
    },
  }
}

const themeName = (preset: AppearancePreset, mode: ResolvedTheme) =>
  `multirag-${preset}-${mode}`

export function useMonacoTheme() {
  const { preset, resolvedMode } = useResolvedAppearance()
  const isDarkTheme = resolvedMode === 'dark'

  // Every scheme and mode is defined up front, so switching appearance only
  // changes the theme name the editor receives.
  const defineMonacoThemes = (monaco: typeof Monaco) => {
    for (const scheme of APPEARANCE_PRESETS)
      for (const mode of ['light', 'dark'] as const)
        monaco.editor.defineTheme(
          themeName(scheme, mode),
          editorTheme(scheme, mode),
        )
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

    monaco.languages.json.jsonDefaults.setDiagnosticsOptions(diagnosticsOptions)
  }

  return {
    isDarkTheme,
    currentTheme: themeName(preset, resolvedMode),
    defineMonacoThemes,
    configureJsonDefaults,
    defaultEditorOptions,
  }
}
