import { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import type { KeyboardEvent, RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Bot, User } from 'lucide-react'
import { Bubble } from '@ant-design/x'
import type { BubbleListProps } from '@ant-design/x'
import { ChatBubbleLoading } from '@/components/chat/ChatBubbleLoading'
import { mergeMarkdownComponents } from '@/components/chat/MarkdownCodeBlock'
import {
  findFirstEnabledModelByType,
  findProviderNameByModelName,
  hasEnabledModelName,
} from '@/stores/model'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { useHomeStore } from '@/stores/home'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { AgentThoughtChain } from '@/components/chat/AgentThoughtChain'
import { ThinkWrapper } from '@/components/chat/ThinkWrapper'
import { MessageActionsFooter } from '@/components/chat/MessageActionsFooter'
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ChatInputBox } from './ChatInputBox'
import { SkillPanel } from './SkillPanel'
import { useAtTrigger } from '../hooks'
import { shouldIgnoreEnterForIme } from '../utils'
import { extractThinkContent, type ThinkingStatus } from '@/utils/think-utils'
import { convertReferencesToSup } from '@/utils/message-utils'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ChatMessage } from '../types'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { createTimelineNodesFromToolCalls } from '@/utils/agent-timeline-events'
import { StableMarkdown, StreamingMarkdown } from './chat-markdown-renderers'

interface ChatSectionProps {
  messages: ChatMessage[]
  inputValue: string
  onInputChange: (value: string) => void
  onSend: () => void
  onStop: () => void
  isStreaming: boolean
  streamingContent: string
  streamingThinking?: string
  isToolAnalyzing: boolean
  isLoadingHistory?: boolean
}

export const ChatSection = ({
  messages,
  inputValue,
  onInputChange,
  onSend,
  onStop,
  isStreaming,
  streamingContent,
  streamingThinking = '',
  isToolAnalyzing,
  isLoadingHistory = false,
}: ChatSectionProps) => {
  const { t } = useTranslation()
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const atButtonRef = useRef<HTMLButtonElement>(
    null!,
  ) as RefObject<HTMLButtonElement>
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [detailSheetOpen, setDetailSheetOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ReferenceChunk | null>(
    null,
  )
  const [currentMessageReferences, setCurrentMessageReferences] = useState<
    ReferenceChunk[]
  >([])

  const { myLLMs, isLoading: modelsLoading } = useFetchMyLLMs()
  const {
    selectedMCPIds,
    selectedMCPServers,
    selectedAppIds,
    selectedApps,
    selectedModelId,
    selectApp,
    removeApp,
    selectSkill,
    removeSkill,
    setSelectedModelId,
    startNewConversation,
  } = useHomeStore()

  const {
    skillPanelOpen,
    setSkillPanelOpen,
    handleInputChange: handleAtInput,
    removeAtSymbol,
  } = useAtTrigger()

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  useEffect(() => {
    if (modelsLoading || !myLLMs || Object.keys(myLLMs).length === 0) return

    if (hasEnabledModelName(myLLMs, selectedModelId)) return

    const firstEnabledChatModel = findFirstEnabledModelByType(myLLMs, 'chat')
    if (firstEnabledChatModel) {
      setSelectedModelId(firstEnabledChatModel)
    }
  }, [selectedModelId, myLLMs, modelsLoading, setSelectedModelId])

  const selectedProviderName = useMemo(() => {
    return findProviderNameByModelName(myLLMs, selectedModelId, true)
  }, [selectedModelId, myLLMs])

  const getAssistantAvatar = useCallback(() => {
    if (selectedProviderName) {
      return (
        <ProviderIcon
          provider={selectedProviderName}
          className="h-8 w-8"
          size={32}
        />
      )
    }
    return (
      <div className="flex h-8 min-h-[32px] w-8 min-w-[32px] flex-shrink-0 items-center justify-center rounded-full bg-components-avatar-gradient-purple-from">
        <Bot className="h-4 w-4 text-text-inverted" />
      </div>
    )
  }, [selectedProviderName])

  const getUserAvatar = useCallback(
    () => (
      <div className="flex h-8 min-h-[32px] w-8 min-w-[32px] flex-shrink-0 items-center justify-center rounded-full bg-components-avatar-gradient-blue-from">
        <User className="h-4 w-4 text-text-inverted" />
      </div>
    ),
    [],
  )

  const handleInputChangeInternal = useCallback(
    (value: string) => {
      const cursorPosition = textareaRef.current?.selectionStart || value.length
      handleAtInput(value, inputValue, cursorPosition)
      onInputChange(value)
    },
    [inputValue, onInputChange, handleAtInput],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (shouldIgnoreEnterForIme(e)) {
        return
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onSend()
      }
    },
    [onSend],
  )

  // 处理技能选择
  const handleSkillSelect = useCallback(
    (server: MCPServer) => {
      selectSkill(server)
      const newValue = removeAtSymbol(inputValue)
      if (newValue !== inputValue) {
        onInputChange(newValue)
      }
    },
    [selectSkill, removeAtSymbol, inputValue, onInputChange],
  )

  // 处理应用选择
  const handleAppSelect = useCallback(
    (app: DialogApp, conversationId?: string | null) => {
      selectApp(app, conversationId)
      const newValue = removeAtSymbol(inputValue)
      if (newValue !== inputValue) {
        onInputChange(newValue)
      }
      setSkillPanelOpen(false)
    },
    [selectApp, removeAtSymbol, inputValue, onInputChange, setSkillPanelOpen],
  )

  // 处理开启新对话（保持当前应用选择）
  const handleStartNewConversation = useCallback(() => {
    startNewConversation()
    setSkillPanelOpen(false)
  }, [startNewConversation, setSkillPanelOpen])

  // 处理引用详情查看
  const handleViewDetail = useCallback(
    (chunk: ReferenceChunk, allChunks?: ReferenceChunk[]) => {
      setSelectedChunk(chunk)
      if (allChunks) {
        setCurrentMessageReferences(allChunks)
      }
      setDetailSheetOpen(true)
    },
    [],
  )

  // 处理引用内容复制
  const handleCopyReference = useCallback((content: string) => {
    copyToClipboard(content)
    toast.success('已复制到剪贴板')
  }, [])

  // 检查是否是应用模式（最后一条消息是 assistant 且在 streaming 中）
  // 应用模式下，AI 消息已经在 messages 中，流式更新直接修改这条消息
  const isAppModeStreaming = useMemo(() => {
    if (!isStreaming) return false
    const lastMsg = messages[messages.length - 1]
    return lastMsg?.role === 'assistant'
  }, [isStreaming, messages])

  // 转换消息为 Bubble.List 格式
  const bubbleItems = useMemo<BubbleListProps['items']>(() => {
    const items = messages.map((msg, index) => {
      // 判断是否是当前正在流式输出的消息（应用模式）
      const isCurrentStreamingMsg =
        isAppModeStreaming &&
        index === messages.length - 1 &&
        msg.role === 'assistant' &&
        Boolean(msg.isStreaming || isStreaming)

      return {
        key: msg.id,
        role: msg.role,
        content: msg.content || '',
        loading: false,
        placement: (msg.role === 'user' ? 'end' : 'start') as 'start' | 'end',
        avatar: msg.role === 'user' ? getUserAvatar() : getAssistantAvatar(),
        typing: false,
        timestamp: msg.timestamp,
        styles:
          msg.role === 'user'
            ? {
                content: {
                  backgroundColor: 'var(--color-chat-bubble-user-bg)',
                  color: 'var(--color-chat-bubble-user-text)',
                  borderRadius: '18px',
                  padding: '12px 16px',
                  border: 'none',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                },
              }
            : {
                content: {
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  padding: '0',
                },
              },
        contentRender:
          msg.role === 'assistant'
            ? () => {
                // 优先使用消息中的 thinking 字段，回退到从 content 提取
                const fallback = extractThinkContent(msg.content || '')
                const timelineNodes =
                  msg.timelineNodes && msg.timelineNodes.length > 0
                    ? msg.timelineNodes
                    : msg.parsedToolCalls && msg.parsedToolCalls.length > 0
                      ? createTimelineNodesFromToolCalls(msg.parsedToolCalls)
                      : []
                // 末尾的 reasoning 节点 = 工具调用结束后、最终回复前的思考，
                // 需要拆出来作为独立的 Think 展示（而不是塞在思维链底部）。
                const lastNode = timelineNodes[timelineNodes.length - 1]
                const trailingReasoningNode =
                  lastNode?.kind === 'reasoning' &&
                  typeof lastNode.content === 'string' &&
                  lastNode.content.trim()
                    ? lastNode
                    : undefined
                const chainNodes = trailingReasoningNode
                  ? timelineNodes.slice(0, -1)
                  : timelineNodes

                // 思维链仅在存在真正的工具/系统/错误节点时展示。
                // 调用工具前的 think 仍随工具节点展示（对齐 antdx ThoughtChain）；
                // 纯聊天（只有 reasoning 或没有节点）则完全走独立的 Think 组件。
                const hasToolFlow = chainNodes.some(
                  (node) =>
                    node.kind === 'tool' ||
                    node.kind === 'mcp' ||
                    node.kind === 'skill' ||
                    node.kind === 'system' ||
                    node.kind === 'error',
                )

                // 思考内容：优先用拆出来的末尾思考；否则回退到历史消息字段。
                const trailingReasoning =
                  typeof trailingReasoningNode?.content === 'string'
                    ? trailingReasoningNode.content
                    : ''
                const thinkContent =
                  trailingReasoning ||
                  (timelineNodes.length > 0
                    ? ''
                    : msg.thinking || fallback.thinkContent)
                const mainContent =
                  timelineNodes.length > 0
                    ? msg.content || ''
                    : msg.thinking !== undefined
                      ? msg.content || ''
                      : fallback.mainContent

                // 确定思考状态
                let status: ThinkingStatus = fallback.status
                if (thinkContent) {
                  if (trailingReasoningNode) {
                    status =
                      isCurrentStreamingMsg &&
                      trailingReasoningNode.status === 'loading'
                        ? 'thinking'
                        : 'complete'
                  } else {
                    status = isCurrentStreamingMsg ? 'thinking' : 'complete'
                  }
                }

                const references = msg.references || []
                const hasReferences = references.length > 0

                // 如果有引用，转换内容中的引用标记
                const contentWithSup = hasReferences
                  ? convertReferencesToSup(mainContent)
                  : mainContent

                // 创建引用标记组件
                const SupComponent = hasReferences
                  ? createReferenceMarkerComponent(references, {
                      onViewDetail: (chunk) =>
                        handleViewDetail(chunk, references),
                      onCopy: handleCopyReference,
                    })
                  : undefined
                const markdownComponents = SupComponent
                  ? mergeMarkdownComponents({ sup: SupComponent })
                  : undefined

                // 判断是否显示 loading（没有任何内容时）
                const showLoading =
                  isCurrentStreamingMsg && !thinkContent && !mainContent

                return (
                  <div className="space-y-4">
                    {hasToolFlow && (
                      <AgentThoughtChain
                        nodes={chainNodes}
                        streaming={isCurrentStreamingMsg}
                      />
                    )}

                    {/* Think 组件 */}
                    {thinkContent && (
                      <ThinkWrapper status={status} messageId={msg.id}>
                        <div className="whitespace-pre-wrap text-sm text-text-secondary">
                          {thinkContent}
                        </div>
                      </ThinkWrapper>
                    )}

                    {/* Markdown 内容（带引用标记） */}
                    {contentWithSup &&
                      (isCurrentStreamingMsg ? (
                        <StreamingMarkdown
                          content={contentWithSup}
                          isStreaming={true}
                          components={markdownComponents}
                        />
                      ) : (
                        <StableMarkdown
                          content={contentWithSup}
                          components={markdownComponents}
                        />
                      ))}

                    {/* Loading 状态（应用模式流式输出时，没有内容显示 loading） */}
                    {showLoading && <ChatBubbleLoading />}

                    {/* 图片引用列表 */}
                    {hasReferences && !isCurrentStreamingMsg && (
                      <ReferenceImageList
                        referenceChunks={references}
                        messageContent={mainContent}
                        onImageClick={(chunk) =>
                          handleViewDetail(chunk, references)
                        }
                      />
                    )}

                    {/* 引用面板 */}
                    {hasReferences && !isCurrentStreamingMsg && (
                      <ReferencePanel
                        chunks={references}
                        onChunkClick={(chunk) =>
                          handleViewDetail(chunk, references)
                        }
                      />
                    )}

                    {/* 消息操作（流式输出时不显示） */}
                    {!isCurrentStreamingMsg && (
                      <MessageActionsFooter
                        content={mainContent}
                        onCopy={() => {
                          copyToClipboard(mainContent)
                          toast.success('已复制到剪贴板')
                        }}
                        showRegenerate={false}
                        showFeedback={false}
                      />
                    )}
                  </div>
                )
              }
            : undefined,
      }
    })

    // MCP 模式下的流式消息（当 isStreaming 但最后一条消息不是 assistant 时）
    // 这种情况说明是 MCP 模式，需要单独渲染 streaming 消息
    if (isStreaming && !isAppModeStreaming) {
      const fallback = extractThinkContent(streamingContent || '')
      const thinkContent = streamingThinking || fallback.thinkContent
      const mainContent = streamingThinking
        ? streamingContent || ''
        : fallback.mainContent

      const status: ThinkingStatus = thinkContent ? 'thinking' : 'none'

      items.push({
        key: 'streaming-assistant',
        role: 'assistant',
        content: streamingContent || '',
        loading: false,
        typing: false,
        timestamp: new Date().toLocaleTimeString(),
        placement: 'start' as const,
        avatar: getAssistantAvatar(),
        styles: {
          content: {
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: '0',
          },
        },
        contentRender: () => (
          <div className="space-y-4">
            {thinkContent && (
              <ThinkWrapper status={status} messageId="streaming">
                <div className="whitespace-pre-wrap text-sm text-text-secondary">
                  {thinkContent}
                </div>
              </ThinkWrapper>
            )}
            {mainContent && mainContent.trim() && (
              <StreamingMarkdown content={mainContent} isStreaming={true} />
            )}
            {/* 如果没有任何内容，显示 Ant Design X 三点加载动画 */}
            {!thinkContent && !mainContent && !isToolAnalyzing && (
              <ChatBubbleLoading />
            )}
          </div>
        ),
      })
    }

    return items
  }, [
    messages,
    isStreaming,
    isAppModeStreaming,
    streamingContent,
    streamingThinking,
    isToolAnalyzing,
    getAssistantAvatar,
    getUserAvatar,
    handleViewDetail,
    handleCopyReference,
  ])

  return (
    <div className="home-chat-area flex min-h-0 flex-1 flex-col">
      {/* 对话消息区域 */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          <style>{`
            .home-chat-area .markdown-content {
              color: var(--color-text-primary) !important;
            }
            .home-chat-area .markdown-content a {
              color: var(--color-components-button-primary-bg) !important;
            }
            .home-chat-area .markdown-content table:not(pre) {
              border-collapse: collapse !important;
              display: block !important;
              width: max-content !important;
              max-width: 100% !important;
              overflow: auto !important;
              margin: 8px 0 16px 0 !important;
              border: 1px solid var(--color-border-default) !important;
              border-radius: 8px !important;
              background-color: var(--color-surface-primary) !important;
            }
            .home-chat-area .markdown-content th,
            .home-chat-area .markdown-content td {
              border: 1px solid var(--color-border-default) !important;
              padding: 8px 12px !important;
              text-align: left !important;
              vertical-align: top !important;
            }
            .home-chat-area .markdown-content th {
              background-color: var(--color-surface-secondary) !important;
              color: var(--color-text-primary) !important;
              font-weight: 600 !important;
            }
            .home-chat-area .markdown-content td {
              background-color: var(--color-surface-primary) !important;
              color: var(--color-text-primary) !important;
            }
            .home-chat-area .markdown-content code {
              background-color: var(--color-background-subtle) !important;
              color: var(--color-text-primary) !important;
            }
            .home-chat-area .markdown-content pre {
              background-color: var(--color-components-pre-bg) !important;
              border-color: var(--color-components-pre-border) !important;
            }
            .home-chat-area .markdown-content pre code {
              color: var(--color-components-pre-text) !important;
            }
            .home-chat-area .markdown-content .ant-mermaid-graph {
              height: auto !important;
              min-height: 220px !important;
              max-height: 70vh !important;
            }
            .home-chat-area .markdown-content .ant-mermaid-code {
              height: auto !important;
              min-height: 220px !important;
              max-height: 70vh !important;
            }
          `}</style>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="border-3 h-8 w-8 animate-spin rounded-full border-text-tertiary border-t-text-accent" />
                <span className="text-sm text-text-tertiary">
                  {t('home.input.loadingHistory', '加载对话历史...')}
                </span>
              </div>
            </div>
          ) : (
            <Bubble.List
              items={bubbleItems}
              autoScroll={true}
              style={{ minHeight: '100%', paddingBottom: '8px' }}
            />
          )}
        </div>
      </div>

      {/* 底部输入区域 */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2">
        <div className="mx-auto max-w-4xl">
          <ChatInputBox
            inputValue={inputValue}
            onInputChange={handleInputChangeInternal}
            onKeyDown={handleKeyDown}
            placeholder={t(
              'home.input.chatPlaceholder',
              '输入消息，按 Enter 发送',
            )}
            selectedMCPServers={selectedMCPServers}
            selectedApps={selectedApps}
            onRemoveSkill={removeSkill}
            onRemoveApp={removeApp}
            isSkillPanelOpen={skillPanelOpen}
            onSkillPanelToggle={() => setSkillPanelOpen(!skillPanelOpen)}
            skillPanelRef={atButtonRef}
            skillPanelContent={
              <SkillPanel
                open={skillPanelOpen}
                onClose={() => setSkillPanelOpen(false)}
                onSelectSkill={handleSkillSelect}
                onSelectApp={handleAppSelect}
                onStartNewConversation={handleStartNewConversation}
                selectedSkillIds={selectedMCPIds}
                selectedAppIds={selectedAppIds}
                anchorRef={atButtonRef as RefObject<HTMLElement>}
                direction="up"
              />
            }
            models={myLLMs}
            selectedModelId={selectedModelId}
            onModelSelect={(modelId) => setSelectedModelId(modelId || '')}
            modelsLoading={modelsLoading}
            isModelLocked={selectedAppIds.length > 0}
            onSend={onSend}
            onStop={onStop}
            isStreaming={isStreaming}
            variant="chat"
          />
        </div>
      </div>

      {/* 引用详情侧边栏 */}
      <ReferenceDetailSheet
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        chunk={selectedChunk}
        allChunks={currentMessageReferences}
      />
    </div>
  )
}
