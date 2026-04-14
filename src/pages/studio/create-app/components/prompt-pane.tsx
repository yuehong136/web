import React, { Suspense, lazy } from 'react'
import { ArrowLeft, ChevronRight, Pencil } from 'lucide-react'
import { StudioPanelShell } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { MARKDOWN_EDITOR_PLACEHOLDER } from '../constants'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = lazy(() => import('@uiw/react-md-editor'))

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
  } = controller

  return (
    <StudioPanelShell
      title="人设与回复逻辑"
      collapsed={leftCollapsed}
      collapsedContent={(
        <div className="flex h-full flex-col items-center gap-space-sm py-space-sm">
          <Button
            variant="ghost"
            size="icon"
            onClick={expandLeftPanel}
            title="展开人设与回复逻辑"
          >
            <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
          </Button>
          <div className="h-px w-5 bg-components-studio-border" />
          <Pencil className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
        </div>
      )}
      actions={(
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={collapseLeftPanel}
          title="收起人设与回复逻辑"
        >
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
        </Button>
      )}
      bodyClassName="flex min-h-0 flex-col overflow-hidden p-space-base"
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Suspense
          fallback={(
            <div className="flex h-full items-center justify-center bg-surface-secondary">
              <span className="text-text-tertiary">加载编辑器...</span>
            </div>
          )}
        >
          <MDEditor
            value={config.systemPrompt}
            onChange={(value) => handleConfigChange('systemPrompt', value || '')}
            data-color-mode={currentTheme}
            height="100%"
            visibleDragbar={false}
            textareaProps={{
              placeholder: MARKDOWN_EDITOR_PLACEHOLDER,
              style: {
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace',
              },
              spellCheck: false,
            }}
            preview="edit"
          />
        </Suspense>
      </div>

      <div className="mt-space-base border-t border-border-subtle pt-space-base">
        <div className="flex items-center justify-between text-xs text-text-tertiary">
          <span>支持 Markdown 语法</span>
          <span>字符数: {config.systemPrompt.length}</span>
        </div>
      </div>
    </StudioPanelShell>
  )
}
