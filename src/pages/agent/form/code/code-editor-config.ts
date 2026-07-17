import type { EditorProps } from '@monaco-editor/react'
import { ProgrammingLanguage } from '../../constant'
import type { ProgrammingLanguageValue } from './types'

export function getCodeLanguageLabel(language: ProgrammingLanguageValue) {
  return language === ProgrammingLanguage.JavaScript ? 'JavaScript' : 'Python'
}

export function getCodeLineCount(value: string) {
  return value.length === 0 ? 1 : value.split(/\r\n|\r|\n/).length
}

export function createCodeEditorOptions({
  ariaLabel,
  language,
}: {
  ariaLabel: string
  language: ProgrammingLanguageValue
}): EditorProps['options'] {
  return {
    accessibilitySupport: 'auto',
    ariaLabel,
    automaticLayout: true,
    bracketPairColorization: { enabled: true },
    detectIndentation: true,
    fixedOverflowWidgets: true,
    folding: true,
    fontSize: 13,
    formatOnPaste: true,
    formatOnType: true,
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    insertSpaces: true,
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    minimap: { enabled: false },
    padding: { top: 14, bottom: 14 },
    renderLineHighlight: 'line',
    renderWhitespace: 'selection',
    scrollBeyondLastLine: false,
    scrollbar: {
      horizontalScrollbarSize: 10,
      verticalScrollbarSize: 10,
    },
    smoothScrolling: true,
    tabSize: language === ProgrammingLanguage.Python ? 4 : 2,
    wordWrap: 'off',
  }
}
