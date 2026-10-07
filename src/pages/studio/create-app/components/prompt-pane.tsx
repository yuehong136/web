import React, { Suspense, lazy, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { RefMDEditor } from '@uiw/react-md-editor/nohighlight'
import { AlertTriangle, ArrowLeft, ChevronRight, Pencil } from 'lucide-react'
import { StudioPanelShell } from '@/components/patterns'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { hasKnowledgePlaceholder } from '@/lib/chat/knowledge-prompt'
import { MARKDOWN_EDITOR_PLACEHOLDER } from '../constants'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import { hasAppRetrievalSource } from '../knowledge-prompt'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = lazy(() => import('@uiw/react-md-editor/nohighlight'))

interface PromptPaneProps {
  controller: CreateAppPageController
}

export const PromptPane: React.FC<PromptPaneProps> = ({ controller }) => {
  const {
    config,
    currentTheme,
    leftCollapsed,
    collapseLeftPanel,
    expandLeftPanel,
    handleConfigChange,
    handleInsertKnowledgePlaceholder,
  } = controller
  const { t } = useTranslation()
  const editorRef = useRef<RefMDEditor>(null)
  const knowledgePlaceholderMissing =
    hasAppRetrievalSource(config) &&
    !hasKnowledgePlaceholder(config.systemPrompt)

  const insertKnowledgePlaceholder = () => {
    handleInsertKnowledgePlaceholder()
    // The warning and its button unmount once the placeholder exists.
    editorRef.current?.textarea?.focus()
  }

  return (
    <StudioPanelShell
      title="人设与回复逻辑"
      collapsed={leftCollapsed}
      collapsedContent={
        <div className="flex h-full flex-col items-center gap-space-sm py-space-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={expandLeftPanel}
            title="展开人设与回复逻辑"
          >
            <ChevronRight
              className="h-4 w-4"
              style={{ color: 'var(--color-components-icon-button-text)' }}
            />
          </Button>
          <div className="h-px w-5 bg-components-studio-border" />
          <Pencil
            className="h-4 w-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </div>
      }
      actions={
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={collapseLeftPanel}
          title="收起人设与回复逻辑"
        >
          <ArrowLeft
            className="h-4 w-4"
            style={{ color: 'var(--color-components-icon-button-text)' }}
          />
        </Button>
      }
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-space-base"
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center bg-surface-secondary">
              <span className="text-text-tertiary">加载编辑器...</span>
            </div>
          }
        >
          <MDEditor
            ref={editorRef}
            value={config.systemPrompt}
            onChange={(value) =>
              handleConfigChange('systemPrompt', value || '')
            }
            data-color-mode={currentTheme}
            height="100%"
            visibleDragbar={false}
            textareaProps={{
              placeholder: MARKDOWN_EDITOR_PLACEHOLDER,
              style: {
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
              },
              spellCheck: false,
            }}
            preview="edit"
          />
        </Suspense>
      </div>

      {knowledgePlaceholderMissing ? (
        <Alert
          variant="warning"
          className="mt-space-base flex items-start gap-space-sm p-space-sm text-xs"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <output className="min-w-0 flex-1 leading-relaxed">
            {t('chat.knowledgePrompt.missing')}
          </output>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={insertKnowledgePlaceholder}
          >
            {t('chat.knowledgePrompt.insert')}
          </Button>
        </Alert>
      ) : null}

      <div className="mt-space-base border-t border-border-subtle pt-space-base">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>支持 Markdown 语法</span>
          <span>字符数: {config.systemPrompt.length}</span>
        </div>
      </div>
    </StudioPanelShell>
  )
}
