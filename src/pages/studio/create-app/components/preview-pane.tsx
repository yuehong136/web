import React, { useMemo } from 'react'
import { Bubble, Sender } from '@ant-design/x'
import {
  Bug,
  ChevronLeft,
  ChevronRight,
  Eye,
  LayoutGrid,
  RefreshCw,
  Square,
} from 'lucide-react'
import { StudioPanelShell } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  CHAT_TEXT_TYPING,
  shouldUseBubbleTyping,
} from '@/components/chat/antx-chat-config'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import { renderMarkdown } from '../utils'

interface PreviewPaneProps {
  controller: CreateAppPageController
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ controller }) => {
  const {
    dialogId,
    config,
    previewMessages,
    inputValue,
    setInputValue,
    isStreaming,
    previewConversationId,
    rightCollapsed,
    collapseRightPanel,
    expandRightPanel,
    handleSendPreviewMessage,
    handleStopOutput,
    handleResetPreview,
  } = controller

  const bubbleItems = useMemo(
    () =>
      previewMessages.map((message, index) => {
        const isUser = message.role === 'user'
        const isLastAssistant = !isUser && index === previewMessages.length - 1
        const isCurrentStreaming = isStreaming && isLastAssistant
        const useTextTyping =
          !isUser &&
          message.id.startsWith('prologue-') &&
          !isCurrentStreaming &&
          !message.thinking &&
          shouldUseBubbleTyping(message.content)

        return {
          key: message.id,
          role: message.role,
          content: useTextTyping ? (
            message.content
          ) : (
            <div className="leading-relaxed">
              {message.thinking ? (
                <div
                  className="mb-space-sm rounded-radius-lg p-space-base text-xs"
                  style={{
                    backgroundColor: 'var(--color-chat-think-bg)',
                    border: '1px solid var(--color-chat-think-border)',
                  }}
                >
                  <div
                    className="mb-space-xs gap-space-xs flex items-center font-medium"
                    style={{ color: 'var(--color-chat-think-text)' }}
                  >
                    <span>{isCurrentStreaming ? '思考中...' : '思考过程'}</span>
                  </div>
                  <div
                    className="whitespace-pre-wrap leading-relaxed"
                    style={{ color: 'var(--color-chat-think-text)' }}
                  >
                    {message.thinking}
                  </div>
                </div>
              ) : null}

              {message.content && message.content.trim() ? (
                renderMarkdown(message.content)
              ) : isCurrentStreaming && !message.thinking ? (
                <div className="italic text-text-tertiary">正在生成回复...</div>
              ) : null}
            </div>
          ),
          typing: useTextTyping ? CHAT_TEXT_TYPING : false,
          placement: (isUser ? 'end' : 'start') as 'start' | 'end',
          loading: isCurrentStreaming && !message.content && !message.thinking,
          avatar: isUser ? (
            <div
              className="rounded-radius-full flex h-8 min-h-[32px] w-8 min-w-[32px] shrink-0 items-center justify-center text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-chat-bubble-user-avatar-bg)',
                color: 'var(--color-chat-bubble-user-avatar-text)',
              }}
            >
              U
            </div>
          ) : config.icon && config.icon.trim() ? (
            <div className="rounded-radius-full h-8 min-h-[32px] w-8 min-w-[32px] shrink-0 overflow-hidden">
              <img
                src={config.icon}
                alt="AI"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div
              className="rounded-radius-full flex h-8 min-h-[32px] w-8 min-w-[32px] shrink-0 items-center justify-center"
              style={{
                backgroundColor: 'var(--color-chat-bubble-assistant-avatar-bg)',
              }}
            >
              <LayoutGrid
                className="h-4 w-4"
                style={{
                  color: 'var(--color-chat-bubble-assistant-avatar-text)',
                }}
              />
            </div>
          ),
          variant: 'borderless' as const,
          shape: 'round' as const,
          styles: {
            avatar: {
              border: 'none',
              boxShadow: 'none',
            },
            content: {
              backgroundColor: isUser
                ? 'var(--color-chat-bubble-user-bg)'
                : 'var(--color-chat-bubble-ai-bg)',
              color: isUser
                ? 'var(--color-chat-bubble-user-text)'
                : 'var(--color-chat-bubble-ai-text)',
              border: 'none',
              boxShadow: 'none',
              borderRadius: '16px',
              padding: '12px 16px',
              fontSize: '14px',
              lineHeight: '1.6',
            },
          },
        }
      }),
    [config.icon, isStreaming, previewMessages],
  )

  return (
    <StudioPanelShell
      title="预览与调试"
      collapsed={rightCollapsed}
      collapsedContent={
        <div className="gap-space-sm py-space-sm flex h-full flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={expandRightPanel}
            title="展开预览与调试"
          >
            <ChevronLeft
              className="h-4 w-4"
              style={{ color: 'var(--color-components-icon-button-text)' }}
            />
          </Button>
          <div className="h-px w-5 bg-components-studio-border" />
          <Eye
            className="h-4 w-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
          <Bug
            className="h-4 w-4"
            style={{ color: 'var(--color-text-tertiary)' }}
          />
        </div>
      }
      actions={
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={collapseRightPanel}
            title="收起预览与调试"
          >
            <ChevronRight
              className="h-4 w-4"
              style={{ color: 'var(--color-components-icon-button-text)' }}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleResetPreview}
            title="重置对话"
          >
            <RefreshCw
              className="h-4 w-4"
              style={{ color: 'var(--color-components-icon-button-text)' }}
            />
          </Button>
        </>
      }
      bodyClassName="flex min-h-0 flex-col"
    >
      <ScrollArea
        className="min-h-0 flex-1"
        viewportClassName="overscroll-contain p-space-base"
      >
        {previewMessages.length === 0 ? (
          <div className="py-16 text-center">
            <div
              className="mb-space-base rounded-radius-full mx-auto flex h-12 w-12 items-center justify-center"
              style={{ background: 'var(--color-components-app-avatar-bg)' }}
            >
              <span className="text-sm font-bold text-text-inverted">AI</span>
            </div>
            <h3 className="mb-space-sm text-lg font-semibold text-text-primary">
              {config.name}
            </h3>
            <p className="mx-auto max-w-md text-sm text-text-secondary">
              {config.description}
            </p>
          </div>
        ) : (
          <div className="space-y-space-base">
            <Bubble.List items={bubbleItems} />
          </div>
        )}
      </ScrollArea>

      <div className="p-space-base shrink-0 border-t border-border-default">
        <div className="mb-space-base">
          <Sender
            value={inputValue}
            onChange={(value) => setInputValue(value)}
            placeholder="输入消息进行预览..."
            loading={isStreaming}
            onSubmit={(message) => {
              if (message) {
                handleSendPreviewMessage(message)
              }
            }}
            onCancel={handleStopOutput}
            submitType="enter"
            styles={{
              input: {
                border: 'none',
                boxShadow: 'none',
                borderRadius: '12px',
                backgroundColor: 'var(--color-chat-input-container-bg)',
                fontSize: '13px',
                lineHeight: '1.5',
                padding: '8px 12px',
              },
            }}
            className="rounded-radius-xl border-none shadow-none"
          />

          {isStreaming ? (
            <div className="mt-space-sm flex justify-center">
              <Button variant="outline" size="sm" onClick={handleStopOutput}>
                <Square
                  className="mr-space-xs h-4 w-4"
                  style={{ color: 'var(--color-status-error-text)' }}
                />
                停止生成
              </Button>
            </div>
          ) : null}
        </div>

        <div
          className="rounded-radius-lg p-space-base"
          style={{ backgroundColor: 'var(--color-chat-preview-debug-bg)' }}
        >
          <span
            className="mb-space-sm block text-xs font-medium"
            style={{ color: 'var(--color-chat-preview-debug-text)' }}
          >
            调试信息
          </span>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">当前模型:</span>
              <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>
                {config.llm_id || '未选择'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">温度设置:</span>
              <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>
                {Number(config.llm_setting.temperature ?? 0).toFixed(2) ||
                  'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">知识库数量:</span>
              <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>
                {config.kb_ids.length}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">最大回复长度:</span>
              <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>
                {config.llm_setting.max_tokens || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">预览会话:</span>
              <span
                style={{
                  color: previewConversationId
                    ? 'var(--color-status-success-text)'
                    : 'var(--color-text-tertiary)',
                }}
              >
                {previewConversationId ? '已创建' : '待创建'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-text-tertiary">消息数:</span>
              <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>
                {previewMessages.length}
              </span>
            </div>
          </div>
        </div>

        {!dialogId ? (
          <div
            className="mt-space-sm rounded-radius-md p-space-sm border text-xs"
            style={{
              backgroundColor: 'var(--color-components-alert-warning-bg)',
              borderColor: 'var(--color-components-alert-warning-border)',
              color: 'var(--color-components-alert-warning-text)',
            }}
          >
            请先保存应用配置后才能进行预览调试
          </div>
        ) : null}
      </div>
    </StudioPanelShell>
  )
}
