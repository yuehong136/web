/* eslint-disable react-refresh/only-export-components */
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import type { EditorState, Klass, LexicalNode } from 'lexical'
import { $getRoot, $getSelection } from 'lexical'

import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useBuildPromptVariableOptions } from '@/pages/agent/hooks/use-get-begin-query'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Variable } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EnterKeyPlugin } from './enter-key-plugin'
import { PasteHandlerPlugin } from './paste-handler-plugin'
import theme from './theme'
import type { VariableOptionGroup } from './types'
import { ValueSyncPlugin } from './value-sync-plugin'
import { VariableNode } from './variable-node'
import { VariableOnChangePlugin } from './variable-on-change-plugin'
import VariablePickerMenuPlugin from './variable-picker-plugin'

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error)
}

const Nodes: Array<Klass<LexicalNode>> = [
  HeadingNode,
  QuoteNode,
  CodeHighlightNode,
  CodeNode,
  VariableNode,
]

type PromptContentProps = {
  showToolbar?: boolean
  multiLine?: boolean
  onBlur?: () => void
}

type IProps = {
  value?: string
  onChange?: (value?: string) => void
  onBlur?: () => void
  placeholder?: ReactNode
  options?: VariableOptionGroup[]
} & Omit<PromptContentProps, 'onBlur'>

function PromptContent({
  showToolbar = true,
  multiLine = true,
  onBlur,
}: PromptContentProps) {
  const [editor] = useLexicalComposerContext()
  const [isBlur, setIsBlur] = useState(false)
  const { t } = useTranslation()

  const insertTextAtCursor = useCallback(() => {
    editor.focus(() => {
      editor.update(() => {
        let selection = $getSelection()

        if (selection === null) {
          $getRoot().selectEnd()
          selection = $getSelection()
        }

        if (selection !== null) {
          selection.insertText(' /')
        }
      })
    })
  }, [editor])

  const handleVariableIconClick = useCallback(() => {
    insertTextAtCursor()
  }, [insertTextAtCursor])

  const handleBlur = useCallback(() => {
    setIsBlur(true)
    onBlur?.()
  }, [onBlur])

  const handleFocus = useCallback(() => {
    setIsBlur(false)
  }, [])

  return (
    <section
      className={cn(
        'overflow-hidden rounded-radius-lg border border-border-primary bg-surface-primary transition-colors',
        { 'border-[var(--color-components-system-accent-border)]': !isBlur },
      )}
    >
      {showToolbar && (
        <div
          className={cn(
            'flex items-center justify-between gap-space-sm border-b border-border-primary px-space-sm py-space-sm transition-colors',
            { 'border-[var(--color-components-system-accent-border)]': !isBlur },
          )}
        >
          <div className="min-w-0">
            <div className="text-xs font-medium text-text-primary">
              {t('flow.promptWorkspace', 'Prompt Workspace')}
            </div>
            <div className="truncate text-xs text-text-secondary">
              {t(
                'flow.insertVariableTip',
                'Type / to browse upstream variables',
              )}
            </div>
          </div>
          <Tooltip content={<p>{t('flow.insertVariableTip')}</p>}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label={t('flow.insertVariable', 'Insert Variable')}
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleVariableIconClick}
            >
              <Variable size={16} />
            </Button>
          </Tooltip>
        </div>
      )}
      <ContentEditable
        className={cn(
          'prompt-editor-content relative w-full px-space-sm text-sm text-text-primary focus-visible:outline-none',
          {
            'max-h-[50vh] min-h-40 overflow-auto py-space-sm': multiLine,
            'min-h-10 overflow-x-auto overflow-y-hidden py-space-sm whitespace-pre': !multiLine,
          },
        )}
        onBlur={handleBlur}
        onFocus={handleFocus}
      />
    </section>
  )
}

export function PromptEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  showToolbar,
  multiLine = true,
  options = [],
}: IProps) {
  const { t } = useTranslation()
  const defaultOptions = useBuildPromptVariableOptions()
  const resolvedOptions = useMemo(
    () => (options.length > 0 ? options : defaultOptions),
    [defaultOptions, options],
  )
  const initialConfig = useMemo<InitialConfigType>(
    () => ({
      namespace: 'PromptEditor',
      theme,
      onError,
      nodes: Nodes,
    }),
    [],
  )

  const onValueChange = useCallback(
    (editorState: EditorState) => {
      editorState?.read(() => {
        const text = $getRoot().getTextContent()

        onChange?.(text)
      })
    },
    [onChange],
  )

  return (
    <div className="relative">
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <PromptContent
              showToolbar={showToolbar}
              multiLine={multiLine}
              onBlur={onBlur}
            ></PromptContent>
          }
          placeholder={
            <div
              className={cn(
                'pointer-events-none absolute left-space-sm right-space-sm text-sm text-text-secondary',
                {
                  'top-12': showToolbar,
                  'top-space-sm': !showToolbar,
                  truncate: !multiLine,
                },
              )}
            >
              {placeholder || t('common.promptPlaceholder')}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ValueSyncPlugin value={value} options={resolvedOptions} />
        <VariablePickerMenuPlugin
          options={resolvedOptions}
        ></VariablePickerMenuPlugin>
        <PasteHandlerPlugin />
        <EnterKeyPlugin />
        <VariableOnChangePlugin
          onChange={onValueChange}
        ></VariableOnChangePlugin>
      </LexicalComposer>
    </div>
  )
}

export type { VariableOptionGroup } from './types'
export { VariableNode, $createVariableNode, $isVariableNode } from './variable-node'
