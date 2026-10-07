import { lazy, Suspense, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RefMDEditor } from '@uiw/react-md-editor/nohighlight'
import {
  Braces,
  Ellipsis,
  Eye,
  Maximize2,
  Minimize2,
  Plus,
  Trash2,
} from 'lucide-react'
import { StudioPanelShell, PageLoadingState } from '@/components/patterns'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { hasKnowledgePlaceholder } from '@/lib/chat/knowledge-prompt'
import { hasAppRetrievalSource } from '../knowledge-prompt'
import { renderMarkdown } from '../utils'
import type { ConfigBindings } from './config-fields'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import './editor.css'

const MDEditor = lazy(() => import('@uiw/react-md-editor/nohighlight'))
export interface PromptPaneProps extends ConfigBindings {
  theme: 'light' | 'dark'
  focused: boolean
  onFocus: () => void
  onAddVariable: (trigger: HTMLButtonElement | null) => void
  onRemoveVariable: (key: string) => void
  onInsertKnowledge: () => void
}
export function PromptPane({
  config,
  onChange,
  theme,
  focused,
  onFocus,
  onAddVariable,
  onRemoveVariable,
  onInsertKnowledge,
}: PromptPaneProps) {
  const { t } = useTranslation()
  const editorRef = useRef<RefMDEditor>(null)
  const variableTriggerRef = useRef<HTMLButtonElement>(null)
  const [preview, setPreview] = useState(false)
  const [variablesOpen, setVariablesOpen] = useState(false)
  const [formatsOpen, setFormatsOpen] = useState(false)
  const selectionRef = useRef({ start: 0, end: 0 })
  const rememberSelection = () => {
    const textarea = editorRef.current?.textarea
    if (textarea)
      selectionRef.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      }
  }
  const insert = (before: string, after = '') => {
    const { start, end } = selectionRef.current
    const next =
      config.systemPrompt.slice(0, start) +
      before +
      config.systemPrompt.slice(start, end) +
      after +
      config.systemPrompt.slice(end)
    onChange('systemPrompt', next)
    setPreview(false)
    setVariablesOpen(false)
    setFormatsOpen(false)
    requestAnimationFrame(() => {
      const textarea = editorRef.current?.textarea
      textarea?.focus()
      textarea?.setSelectionRange(start + before.length, end + before.length)
    })
  }
  const missingKnowledge =
    hasAppRetrievalSource(config) &&
    !hasKnowledgePlaceholder(config.systemPrompt)
  return (
    <StudioPanelShell
      title={t('studio.editor.prompt')}
      bodyClassName="flex min-h-0 flex-col"
      actions={
        <>
          <Popover
            open={variablesOpen}
            onOpenChange={(open) => {
              if (open) rememberSelection()
              setVariablesOpen(open)
            }}
          >
            <PopoverTrigger asChild>
              <Button
                ref={variableTriggerRef}
                size="icon-sm"
                variant="ghost"
                aria-label={t('studio.editor.variables')}
                title={t('studio.editor.variables')}
              >
                <Braces className="size-icon-sm" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 max-w-full space-y-space-sm"
              align="start"
            >
              <p className="text-sm font-semibold">
                {t('studio.editor.variables')}
              </p>
              {config.prompt_config.parameters.map((parameter) => (
                <div
                  key={parameter.key}
                  className="flex items-center gap-space-xs"
                >
                  <Button
                    className="min-w-0 flex-1 justify-start truncate"
                    variant="ghost"
                    onClick={() => insert(`{${parameter.key}}`)}
                    title={t('studio.editor.insertVariable')}
                  >{`{${parameter.key}}`}</Button>
                  <span className="text-xs text-text-secondary">
                    {t(
                      `studio.editor.${parameter.key === 'knowledge' ? 'systemVariable' : parameter.optional ? 'optional' : 'required'}`,
                    )}
                  </span>
                  {parameter.key !== 'knowledge' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('studio.editor.removeVariable', {
                        name: parameter.key,
                      })}
                      onClick={() => onRemoveVariable(parameter.key)}
                    >
                      <Trash2 className="size-icon-sm" />
                    </Button>
                  )}
                </div>
              ))}
              {!config.prompt_config.parameters.length && (
                <p className="text-xs text-text-secondary">
                  {t('studio.editor.noVariables')}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVariablesOpen(false)
                  onAddVariable(variableTriggerRef.current)
                }}
              >
                <Plus className="mr-space-xs size-icon-sm" />
                {t('studio.editor.addVariable')}
              </Button>
              <p className="text-xs leading-relaxed text-text-secondary">
                {t('studio.editor.variableLimit')}
              </p>
            </PopoverContent>
          </Popover>
          <Popover
            open={formatsOpen}
            onOpenChange={(open) => {
              if (open) rememberSelection()
              setFormatsOpen(open)
            }}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('studio.editor.moreFormat')}
                title={t('studio.editor.moreFormat')}
              >
                <Ellipsis className="size-icon-sm" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="grid w-48 gap-space-xs" align="end">
              {(
                [
                  ['bold', '**', '**'],
                  ['italic', '*', '*'],
                  ['heading', '## ', ''],
                  ['list', '- ', ''],
                  ['code', '\n```\n', '\n```\n'],
                  ['link', '[', '](https://)'],
                ] as const
              ).map(([key, before, after]) => (
                <Button
                  key={key}
                  variant="ghost"
                  className="justify-start"
                  onClick={() => insert(before, after)}
                >
                  {t(`studio.editor.${key}`)}
                </Button>
              ))}
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={preview}
            aria-label={t(`studio.editor.${preview ? 'source' : 'markdown'}`)}
            title={t(`studio.editor.${preview ? 'source' : 'markdown'}`)}
            onClick={() => setPreview(!preview)}
          >
            <Eye className="size-icon-sm" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t(`studio.editor.${focused ? 'restore' : 'focus'}`)}
            title={t(`studio.editor.${focused ? 'restore' : 'focus'}`)}
            onClick={onFocus}
          >
            {focused ? (
              <Minimize2 className="size-icon-sm" />
            ) : (
              <Maximize2 className="size-icon-sm" />
            )}
          </Button>
        </>
      }
    >
      <div
        className={`studio-instruction-editor min-h-0 flex-1 ${preview ? 'hidden' : ''}`}
      >
        <Suspense
          fallback={
            <PageLoadingState
              compact
              title={t('studio.editor.loading')}
              description=""
            />
          }
        >
          <MDEditor
            ref={editorRef}
            value={config.systemPrompt}
            onChange={(value) => onChange('systemPrompt', value ?? '')}
            data-color-mode={theme}
            height="100%"
            visibleDragbar={false}
            hideToolbar
            commands={[]}
            extraCommands={[]}
            preview="edit"
            textareaProps={{
              'aria-label': t('studio.editor.prompt'),
              placeholder: t('studio.editor.editorPlaceholder'),
              spellCheck: false,
            }}
          />
        </Suspense>
      </div>
      <div
        hidden={!preview}
        className="min-h-0 flex-1 overflow-auto p-space-lg"
      >
        {renderMarkdown(config.systemPrompt)}
      </div>
      {missingKnowledge && (
        <Alert
          variant="warning"
          className="m-space-sm flex flex-wrap items-center gap-space-sm text-xs"
        >
          <output className="min-w-0 flex-1">
            {t('chat.knowledgePrompt.missing')}
          </output>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onInsertKnowledge()
              requestAnimationFrame(() => editorRef.current?.textarea?.focus())
            }}
          >
            {t('chat.knowledgePrompt.insert')}
          </Button>
        </Alert>
      )}
      <div className="flex shrink-0 items-center justify-between border-t border-border-subtle px-space-base py-space-sm text-xs text-text-secondary">
        <span>Markdown</span>
        <span>
          {t('studio.editor.characters', { count: config.systemPrompt.length })}
        </span>
      </div>
    </StudioPanelShell>
  )
}
