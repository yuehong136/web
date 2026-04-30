import { CodeHighlightNode, CodeNode } from '@lexical/code'
import type { InitialConfigType } from '@lexical/react/LexicalComposer'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import type { EditorState, Klass, LexicalEditor, LexicalNode } from 'lexical'
import { $getRoot, $getSelection, $isDecoratorNode, $isElementNode } from 'lexical'

import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useBuildPromptVariableOptions } from '@/pages/agent/hooks/use-get-begin-query'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Variable } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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

function hasDecoratorDescendant(node: LexicalNode): boolean {
  if ($isDecoratorNode(node)) return true
  if ($isElementNode(node)) {
    return node.getChildren().some(hasDecoratorDescendant)
  }
  return false
}

function useIsEditorEmpty(editor: LexicalEditor) {
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const compute = () => {
      editor.getEditorState().read(() => {
        const root = $getRoot()
        if (root.getTextContent().trim().length > 0) {
          setIsEmpty(false)
          return
        }
        setIsEmpty(!hasDecoratorDescendant(root))
      })
    }
    compute()
    return editor.registerUpdateListener(compute)
  }, [editor])

  return isEmpty
}

type PromptContentProps = {
  showToolbar?: boolean
  multiLine?: boolean
  onBlur?: () => void
  placeholder?: ReactNode
}

type IProps = {
  value?: string
  onChange?: (value?: string) => void
  onBlur?: () => void
  placeholder?: ReactNode
  options?: VariableOptionGroup[]
  extraOptions?: VariableOptionGroup[]
  nodeId?: string
} & Omit<PromptContentProps, 'onBlur'>

function PromptContent({
  showToolbar = true,
  multiLine = true,
  onBlur,
  placeholder,
}: PromptContentProps) {
  const [editor] = useLexicalComposerContext()
  const [isFocused, setIsFocused] = useState(false)
  const isEditorEmpty = useIsEditorEmpty(editor)
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
    setIsFocused(false)
    onBlur?.()
  }, [onBlur])

  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  return (
    <section
      className={cn(
        'overflow-hidden rounded-radius-lg border bg-background-surface transition-[border-color,box-shadow]',
        isFocused
          ? 'border-components-system-accent-border ring-1 ring-components-system-accent-border'
          : 'border-border-default',
      )}
    >
      {showToolbar && (
        <div
          className={cn(
            'flex items-center justify-end gap-space-sm border-b px-space-sm py-space-xs transition-colors',
            isFocused
              ? 'border-components-system-accent-border'
              : 'border-border-default',
          )}
        >
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
      <div className="relative">
        <ContentEditable
          className={cn(
            'prompt-editor-content relative w-full px-space-sm text-base text-text-primary focus-visible:outline-none',
            {
              'max-h-[50vh] min-h-40 overflow-auto py-space-sm': multiLine,
              'min-h-10 overflow-x-auto overflow-y-hidden py-space-sm whitespace-pre': !multiLine,
            },
          )}
          onBlur={handleBlur}
          onFocus={handleFocus}
        />
        {isEditorEmpty ? (
          <div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute left-space-sm right-space-sm text-base text-text-secondary',
              {
                'top-space-sm': multiLine,
                'top-1/2 -translate-y-1/2 truncate': !multiLine,
              },
            )}
          >
            {placeholder || t('common.promptPlaceholder')}
          </div>
        ) : null}
      </div>
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
  extraOptions = [],
  nodeId,
}: IProps) {
  const defaultOptions = useBuildPromptVariableOptions(nodeId)
  const baseOptions = useMemo(
    () => (options.length > 0 ? options : defaultOptions),
    [defaultOptions, options],
  )
  const resolvedOptions = useMemo(
    () => [...baseOptions, ...extraOptions],
    [baseOptions, extraOptions],
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
    <div>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <PromptContent
              showToolbar={showToolbar}
              multiLine={multiLine}
              onBlur={onBlur}
              placeholder={placeholder}
            ></PromptContent>
          }
          placeholder={null}
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
