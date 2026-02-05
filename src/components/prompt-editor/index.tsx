import { CodeHighlightNode, CodeNode } from '@lexical/code'
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import {
  $getRoot,
  $getSelection,
  $nodesOfType,
  EditorState,
  Klass,
  LexicalNode,
} from 'lexical'

import { cn } from '@/lib/utils'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { Variable } from 'lucide-react'
import { ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EnterKeyPlugin } from './enter-key-plugin'
import { PasteHandlerPlugin } from './paste-handler-plugin'
import theme from './theme'
import { VariableNode } from './variable-node'
import { VariableOnChangePlugin } from './variable-on-change-plugin'
import VariablePickerMenuPlugin, {
  VariableOptionGroup,
} from './variable-picker-plugin'

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
    editor.update(() => {
      const selection = $getSelection()

      if (selection !== null) {
        selection.insertText(' /')
      }
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
      className={cn('border border-border-primary rounded-radius-sm', {
        'border-border-accent': !isBlur,
      })}
    >
      {showToolbar && (
        <div className="border-b border-border-primary px-space-sm py-space-sm justify-end flex">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block cursor-pointer p-0.5 hover:bg-surface-secondary rounded-radius-sm">
                <Variable size={16} onClick={handleVariableIconClick} />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('flow.insertVariableTip')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <ContentEditable
        className={cn(
          'relative px-space-sm py-space-xs focus-visible:outline-none max-h-[50vh] overflow-auto text-sm',
          {
            'min-h-40': multiLine,
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
  const initialConfig: InitialConfigType = {
    namespace: 'PromptEditor',
    theme,
    onError,
    nodes: Nodes,
  }

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
              className="absolute top-10 left-2 text-text-secondary"
              data-xxx
            >
              {placeholder || t('common.pleaseInput')}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <VariablePickerMenuPlugin
          value={value}
          options={options}
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

export { VariableOptionGroup } from './variable-picker-plugin'
export { VariableNode, $createVariableNode, $isVariableNode } from './variable-node'
