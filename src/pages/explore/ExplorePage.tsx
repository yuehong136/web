import React from 'react'
import {
  MessageSquare,
  Search,
  Plus,
  Sparkles,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  LayoutGrid,
  AlignCenter,
  Maximize2,
  SlidersHorizontal,
  Paperclip,
  Atom,
  Globe,
  Square,
  Upload,
  X,
  Volume2,
  Pause,
  Loader2
} from 'lucide-react'
import { 
  Conversations,
  Bubble, 
  Sender, 
  Prompts,
  Welcome,
  Think,
  Actions,
  Attachments
} from '@ant-design/x'
// 导入 Ant Design X 内部的 Loading 组件用于三点加载动画
import BubbleLoading from '@ant-design/x/es/bubble/loading'
import { ConfigProvider, theme, Modal, Input } from 'antd'
import type { PromptsProps } from '@ant-design/x'
import XMarkdown from '@ant-design/x-markdown'
import '@ant-design/x-markdown/dist/x-markdown.css'
import { Button } from '@/components/ui/button'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useChatStore } from '@/stores/chat'
import { useModelStore } from '@/stores/model'
import { useDialogApps, useDialogApp } from '@/hooks/use-dialog-apps'
import { 
  useChatSettings, 
  useKnowledgeBases, 
  useRerankModels,
  buildMetadataCondition,
} from '@/hooks/use-chat-settings'
import { useChatUpload } from '@/hooks/use-chat-upload'
import { useSpeech } from '@/hooks/use-speech'
import { conversationAPI } from '@/api/conversation'
import { useQuery } from '@tanstack/react-query'
import { chatConfig, type ChatMessage, type ChatServiceRequest, type SSEResponse, uploadConfig, type UploadFile } from '@/config/chat'
import { extractReferencesFromSSEData, type ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceDocumentList } from '@/components/chat/ReferenceDocumentList'
import { createSupComponent } from '@/components/chat/InlineSourceRef'
import { ChatSettingsPanel, defaultChatSettings, type ChatSettings } from '@/components/chat/ChatSettingsPanel'
import { 
  groupConsecutiveReferences, 
  shouldShowCarousel,
  type ReferenceGroup,
  extractDocAggsFromResponse,
  type DocAgg,
} from '@/utils/reference-utils'

// 新版引用组件
import { ReferencePanel } from '@/components/chat/ReferencePanel'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import { ReferenceImageList } from '@/components/chat/ReferenceImageList'

// 延迟加载 ImageCarousel 组件，避免 embla-carousel 初始化问题
const ImageCarousel = React.lazy(() => import('@/components/chat/ImageCarousel'))

// 将内容中的 [ID:x] 引用转换为 <sup>x</sup> 格式，供 XMarkdown 处理
const convertReferencesToSup = (content: string): string => {
  if (!content) return ''
  return content.replace(/\[ID:(\d+)\]/g, '<sup>$1</sup>')
}

/**
 * 处理内容中的引用，将连续图片引用替换为轮播占位符
 * 返回处理后的内容和需要渲染的轮播组信息
 */
interface ProcessedContent {
  /** 处理后的内容（连续图片引用被替换为占位符） */
  content: string
  /** 需要渲染为轮播的分组（按顺序） */
  carouselGroups: ReferenceGroup[]
}

const processContentForCarousel = (
  content: string, 
  references: ReferenceChunk[]
): ProcessedContent => {
  if (!content || references.length === 0) {
    return { content, carouselGroups: [] }
  }

  const groups = groupConsecutiveReferences(content)
  const carouselGroups: ReferenceGroup[] = []
  let processedContent = content

  // 从后往前处理，避免位置偏移问题
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]
    if (shouldShowCarousel(group, references)) {
      carouselGroups.unshift(group) // 保持顺序
      
      // 计算要替换的文本范围
      const startPos = group[0].start
      const endPos = group[group.length - 1].end
      
      // 替换为占位符标记（用于分割内容）
      processedContent = 
        processedContent.slice(0, startPos) + 
        '<carousel-placeholder></carousel-placeholder>' +
        processedContent.slice(endPos)
    }
  }

  return { content: processedContent, carouselGroups }
}

/**
 * 轮播包装组件，包含错误边界和懒加载
 * 用于安全地渲染图片轮播
 */
interface CarouselWrapperProps {
  group: ReferenceGroup
  chunks: ReferenceChunk[]
}

const CarouselWrapper: React.FC<CarouselWrapperProps> = ({ group, chunks }) => {
  const [hasError, setHasError] = React.useState(false)

  if (hasError) {
    // 出错时显示简单的图片列表作为降级方案
    return (
      <div className="my-4 flex flex-wrap gap-2 justify-center">
        {group.map((ref) => {
          const chunkIndex = parseInt(ref.id, 10)
          const chunk = chunks[chunkIndex]
          if (!chunk?.image_id) return null
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
          return (
            <img
              key={ref.id}
              src={`${baseUrl}/v1/document/image/${chunk.image_id}`}
              alt={`Fig. ${chunkIndex + 1}`}
              className="max-h-36 object-contain rounded-lg"
              style={{ border: '1px solid var(--color-border-subtle)' }}
            />
          )
        })}
      </div>
    )
  }

  return (
    <React.Suspense fallback={
      <div className="my-4 flex items-center justify-center h-36">
        <span style={{ color: 'var(--color-text-tertiary)' }}>加载图片...</span>
      </div>
    }>
      <ErrorBoundaryWrapper onError={() => setHasError(true)}>
        <ImageCarousel
          group={group}
          chunks={chunks}
          onImageClick={(chunk) => {
            if (chunk.url) {
              window.open(chunk.url, '_blank', 'noopener,noreferrer')
            } else {
              toast.success(`查看图片: Fig. ${parseInt(chunk.id || '0', 10) + 1}`)
            }
          }}
          className="my-4"
        />
      </ErrorBoundaryWrapper>
    </React.Suspense>
  )
}

/**
 * 简单的错误边界包装组件
 */
class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('ImageCarousel error:', error)
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return null
    }
    return this.props.children
  }
}

// 提取并分离 think 内容和主内容
// 思考状态：'none' 无思考 | 'thinking' 思考中 | 'complete' 思考完成
type ThinkingStatus = 'none' | 'thinking' | 'complete'

interface ThinkExtractResult {
  thinkContent: string
  mainContent: string
  /** @deprecated 使用 status 代替 */
  isThinking: boolean
  /** 思考状态 */
  status: ThinkingStatus
}

const extractThinkContent = (content: string): ThinkExtractResult => {
  if (!content) return { thinkContent: '', mainContent: '', isThinking: false, status: 'none' }
  
  // 检查是否有完整的 think/thinking 标签（思考已完成）
  // 支持 <think> 和 <thinking> 两种格式
  const completeMatch = content.match(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>([\s\S]*)/)
  if (completeMatch) {
    return {
      thinkContent: completeMatch[1].trim(),
      mainContent: completeMatch[2].trim(),
      isThinking: false,
      status: 'complete'
    }
  }
  
  // 检查是否有未闭合的 think/thinking 标签（正在思考中）
  const hasOpenTag = content.includes('<think>') || content.includes('<thinking>')
  const hasCloseTag = content.includes('</think>') || content.includes('</thinking>')
  
  if (hasOpenTag && !hasCloseTag) {
    const openMatch = content.match(/<think(?:ing)?>([\s\S]*)/)
    return {
      thinkContent: openMatch ? openMatch[1].trim() : '',
      mainContent: '',
      isThinking: true,
      status: 'thinking'
    }
  }
  
  // 没有 think 标签
  return { thinkContent: '', mainContent: content, isThinking: false, status: 'none' }
}

// 获取应用图标
const getAppIcon = (app: any, size: 'sm' | 'md' = 'sm') => {
  const sizeClass = size === 'md' ? 'h-6 w-6' : 'h-4 w-4'
  
  if (app?.icon) {
    const iconSrc = app.icon.startsWith('data:') || app.icon.startsWith('http') 
      ? app.icon 
      : `data:image/png;base64,${app.icon}`
    return (
      <img 
        src={iconSrc} 
        alt={app.name}
        className={`${sizeClass} rounded object-cover`}
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement
          target.style.display = 'none'
        }}
      />
    )
  }
  return <Sparkles className={sizeClass} style={{ color: 'var(--color-components-button-primary-bg)' }} />
}


// 消息类型
interface ChatMessageItem {
  role: 'user' | 'assistant'
  content: string
  id?: string
  references?: ReferenceChunk[]
  thinking?: string
  thinkingComplete?: boolean
}

// 会话日期分组辅助函数（参考 RAGFlow）
const getConversationDateGroup = (timestamp: number): string => {
  // 处理时间戳格式（毫秒或秒）
  const time = timestamp > 1000000000000 ? timestamp : timestamp * 1000
  const date = new Date(time)
  const now = new Date()
  
  // 获取今天和昨天的日期（忽略时间）
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (dateOnly.getTime() === today.getTime()) {
    return '今天'
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return '昨天'
  } else if (dateOnly >= lastWeek) {
    return '最近 7 天'
  } else {
    return '更早'
  }
}

// Think 展开状态组件 - 提取为独立组件避免重新创建导致状态丢失
interface ThinkWrapperProps {
  children: React.ReactNode
  /** 思考状态 */
  status: ThinkingStatus
  /** 消息的唯一标识，用于区分不同消息的折叠状态 */
  messageId?: string
}

const ThinkWrapper: React.FC<ThinkWrapperProps> = React.memo(({ children, status }) => {
  const isThinking = status === 'thinking'
  
  // 简化逻辑：直接根据 status 控制展开状态
  // - thinking：强制展开
  // - complete：用户可手动控制
  const [userExpanded, setUserExpanded] = React.useState(true)
  
  // 当状态为 thinking 时，始终展开；complete 时使用用户控制的状态
  const expanded = isThinking ? true : userExpanded
  
  // 当从 thinking 变为 complete 时，延迟折叠
  const prevStatusRef = React.useRef(status)
  React.useEffect(() => {
    if (prevStatusRef.current === 'thinking' && status === 'complete') {
      const timer = setTimeout(() => {
        setUserExpanded(false)
      }, 800)
      return () => clearTimeout(timer)
    }
    prevStatusRef.current = status
  }, [status])
  
  // 根据状态显示不同的标题
  const title = isThinking ? '思考中...' : '思考完成'
  
  return (
    <Think
      title={title}
      loading={isThinking}
      expanded={expanded}
      onExpand={setUserExpanded}
      blink={isThinking}
    >
      {children}
    </Think>
  )
})

// 消息操作按钮组件 - 包含 TTS 功能
// 由于 useSpeech 是 hook，需要为每条消息创建独立的组件实例
interface MessageActionsFooterProps {
  content: string
  onCopy: () => void
  onRegenerate: () => void
  onLike: () => void
  onDislike: () => void
}

const MessageActionsFooter: React.FC<MessageActionsFooterProps> = React.memo(({
  content,
  onCopy,
  onRegenerate,
  onLike,
  onDislike
}) => {
  const { isPlaying, isLoading, handleTogglePlay, audioRef } = useSpeech(content)

  const actionItems = [
    {
      key: 'copy',
      label: '复制',
      icon: <Copy className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
    },
    {
      key: 'tts',
      label: isPlaying ? '暂停' : '朗读',
      icon: isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--color-text-accent)' }} />
      ) : isPlaying ? (
        <Pause className="h-3 w-3" style={{ color: 'var(--color-text-accent)' }} />
      ) : (
        <Volume2 className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
      )
    },
    {
      key: 'regenerate',
      label: '重新生成',
      icon: <RotateCcw className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
    },
    {
      key: 'like',
      label: '点赞',
      icon: <ThumbsUp className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
    },
    {
      key: 'dislike',
      label: '踩',
      icon: <ThumbsDown className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
    }
  ]

  const handleAction = async (key: string) => {
    switch (key) {
      case 'copy':
        onCopy()
        break
      case 'tts':
        handleTogglePlay()
        break
      case 'regenerate':
        onRegenerate()
        break
      case 'like':
        onLike()
        break
      case 'dislike':
        onDislike()
        break
    }
  }

  return (
    <div className="mt-2 flex justify-end">
      <Actions
        items={actionItems}
        variant="borderless"
        onClick={({ key }) => handleAction(key)}
      />
      {/* Hidden audio element for TTS playback */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
})

export const ExplorePage: React.FC = () => {
  const { clearChat } = useChatStore()
  const { myLLMs, isLoading: modelsLoading, loadMyLLMs } = useModelStore()
  
  // 获取对话应用列表
  const { 
    data: dialogApps = [], 
    isLoading: dialogAppsLoading,
    error: dialogAppsError 
  } = useDialogApps()

  // 状态管理
  const [activeTab, setActiveTab] = React.useState<'workspace' | 'topics' | 'settings'>('workspace')
  const [selectedApp, setSelectedApp] = React.useState<string>('')
  const [mode, setMode] = React.useState<'chat' | 'market'>('chat')
  const [selectedConversationDetail, setSelectedConversationDetail] = React.useState<any>(null)
  const [activeConversationKey, setActiveConversationKey] = React.useState<string | undefined>(undefined)
  const [, setLoadingConversationDetail] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([])
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null)
  const [renamingConversationId, setRenamingConversationId] = React.useState<string | null>(null)
  const [newConversationName, setNewConversationName] = React.useState('')
  const [chatLayout, setChatLayout] = React.useState<'default' | 'center' | 'full'>('default')
  const [settingsPanelOpen, setSettingsPanelOpen] = React.useState(false)
  const [chatSettings, setChatSettings] = React.useState<ChatSettings>(defaultChatSettings)
  
  // 引用详情侧边栏状态
  const [detailSheetOpen, setDetailSheetOpen] = React.useState(false)
  const [selectedChunk, setSelectedChunk] = React.useState<ReferenceChunk | null>(null)
  const [currentMessageReferences, setCurrentMessageReferences] = React.useState<ReferenceChunk[]>([])
  
  // 文件上传面板状态（参考 ragflow）
  const [headerOpen, setHeaderOpen] = React.useState(false)
  
  // 拖拽状态
  const [isDragging, setIsDragging] = React.useState(false)
  const dropContainerRef = React.useRef<HTMLDivElement>(null)
  const dragCounterRef = React.useRef(0)
  
  // 功能开关状态（参考 ragflow）
  const [enableReasoning, setEnableReasoning] = React.useState(false)
  const [enableInternet, setEnableInternet] = React.useState(false)
  
  // 流式输出控制器（用于停止输出）
  const abortControllerRef = React.useRef<AbortController | null>(null)

  // 用于存储最新的 handleSendMessage 引用，解决 useCallback 闭包陈旧问题
  const handleSendMessageRef = React.useRef<(message: string, baseMessages?: ChatMessageItem[]) => Promise<void>>(null!)
  
  // 全局拖拽事件处理
  React.useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current++
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true)
        setHeaderOpen(true) // 自动打开上传面板
      }
    }
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current--
      if (dragCounterRef.current === 0) {
        setIsDragging(false)
      }
    }
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragCounterRef.current = 0
      setIsDragging(false)
      // 文件会由 Attachments 组件处理
    }
    
    const container = dropContainerRef.current
    if (container) {
      container.addEventListener('dragenter', handleDragEnter)
      container.addEventListener('dragleave', handleDragLeave)
      container.addEventListener('dragover', handleDragOver)
      container.addEventListener('drop', handleDrop)
      
      return () => {
        container.removeEventListener('dragenter', handleDragEnter)
        container.removeEventListener('dragleave', handleDragLeave)
        container.removeEventListener('dragover', handleDragOver)
        container.removeEventListener('drop', handleDrop)
      }
    }
  }, [])

  // 获取选中应用的详情和设置
  const { 
    dialog: selectedAppDetail,
    settings: dialogSettings,
    loading: settingsLoading,
    saving: savingSettings,
    saveSettings,
  } = useChatSettings(selectedApp || undefined)
  
  // 文件上传 Hook（参考 ragflow）
  const {
    files: uploadFiles,
    uploading: isUploading,
    upload: uploadFile,
    removeFile: removeUploadFile,
    clearFiles: clearUploadFiles,
    getDocIdsString,
    setFiles: setUploadFiles,
  } = useChatUpload(selectedConversationDetail?.id)

  // 获取知识库列表
  const { knowledgeBases, loadKnowledgeBases } = useKnowledgeBases()
  
  // 获取重排序模型列表（LLMModel[] 格式）
  const rerankModels = useRerankModels(myLLMs)

  // 当 dialog 设置加载完成后，同步到本地状态
  // 使用 selectedApp 和 dialogSettings 作为依赖，确保切换应用时能正确更新
  React.useEffect(() => {
    if (selectedApp) {
      // 当应用变化时，使用从服务器获取的设置更新本地状态
      setChatSettings(dialogSettings)
    }
  }, [selectedApp, dialogSettings])

  // 获取选中应用的对话列表
  const { 
    data: dialogConversationsData, 
    isLoading: dialogConversationsLoading,
    error: dialogConversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['dialogConversations', selectedApp],
    queryFn: async () => conversationAPI.getConversationsByDialog(selectedApp),
    enabled: !!selectedApp && activeTab === 'topics',
    retry: 1,
  })

  const dialogConversations = dialogConversationsData || []

  // 加载模型列表
  React.useEffect(() => {
    loadMyLLMs()
  }, [])

  // 自动选择第一个可用的聊天模型
  React.useEffect(() => {
    if (!selectedModel && !modelsLoading && myLLMs && Object.keys(myLLMs).length > 0) {
      for (const [, provider] of Object.entries(myLLMs)) {
        if (provider?.llm?.length) {
          const chatModel = provider.llm.find(model => model?.type === 'chat' && model?.name)
          if (chatModel) {
            setSelectedModel(chatModel.name)
            break
          }
        }
      }
    }
  }, [selectedModel, modelsLoading, myLLMs])

  // 自动选择第一个应用
  React.useEffect(() => {
    if (!selectedApp && dialogApps.length > 0 && !dialogAppsLoading) {
      const activeApp = dialogApps.find(app => app.status === '1')
      if (activeApp) setSelectedApp(activeApp.id)
    }
  }, [selectedApp, dialogApps, dialogAppsLoading])

  // 获取对话详情
  const fetchConversationDetail = async (conversationId: string) => {
    if (!conversationId) return
    
    try {
      setLoadingConversationDetail(true)
      // 先清空消息，避免新旧消息混合
      setMessages([])
      
      const response = await conversationAPI.getConversationDetail(conversationId)
      setSelectedConversationDetail(response)
      
      // 设置消息列表，如果对话没有消息则清空
      if (response?.message && Array.isArray(response.message)) {
        setMessages(response.message.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          // 参考 ragflow buildMessageUuid：优先使用后端返回的 ID
          id: msg.id,
          // 保留引用信息（如果有）
          references: msg.reference?.chunks || []
        })))
      }
    } catch (error) {
      console.error('Failed to fetch conversation detail:', error)
      setSelectedConversationDetail(null)
      setMessages([])
    } finally {
      setLoadingConversationDetail(false)
    }
  }

  // 停止输出
  const handleStopOutput = React.useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  // 重新生成消息（参考 ragflow 的 useRegenerateMessage 实现）
  // 当点击助手消息的重新生成按钮时，找到对应的用户消息并重新发送
  const handleRegenerateMessage = React.useCallback((assistantMessageIndex: number) => {
    if (isStreaming) return

    // 找到这个助手消息之前的用户消息
    const userMessageIndex = assistantMessageIndex - 1
    if (userMessageIndex < 0 || messages[userMessageIndex]?.role !== 'user') {
      toast.error('无法找到对应的用户消息')
      return
    }

    const userContent = messages[userMessageIndex].content
    // 保留用户消息之前的所有消息（不包括用户消息本身，因为 handleSendMessage 会重新添加）
    const baseMessages = messages.slice(0, userMessageIndex)

    // 先立即更新 UI，移除当前用户消息和助手消息
    setMessages(baseMessages)

    // 使用 queueMicrotask 确保 state 更新后再发送新消息
    // 通过 ref 调用最新的 handleSendMessage，避免闭包陈旧问题
    queueMicrotask(() => {
      handleSendMessageRef.current?.(userContent, baseMessages)
    })
  }, [isStreaming, messages])

  // 发送消息（支持功能开关和文件 ID）
  // baseMessages 参数用于重新生成场景，传入截断后的消息列表
  const handleSendMessage = async (message: string, baseMessages?: ChatMessageItem[]) => {
    if (!message.trim() || isStreaming) return

    const userMessage: ChatMessageItem = {
      role: 'user',
      content: message.trim(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    const updatedMessages = [...(baseMessages ?? messages), userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)
    
    // 参考 RAGFlow：如果是第一条用户消息，用消息内容更新会话名称
    // 检查是否为第一条用户消息（只有当前新增的这条用户消息）
    const existingUserMessages = (baseMessages ?? messages).filter(m => m.role === 'user')
    const isFirstUserMessage = existingUserMessages.length === 0
    
    if (isFirstUserMessage && activeConversationKey && selectedApp) {
      // 截取前50个字符作为会话名称
      const conversationName = message.trim().slice(0, 50) + (message.trim().length > 50 ? '...' : '')
      try {
        await conversationAPI.setConversation({
          dialog_id: selectedApp,
          conversation_id: activeConversationKey,
          name: conversationName,
          is_new: false
        })
        // 更新本地状态和刷新列表
        setSelectedConversationDetail((prev: any) => prev ? { ...prev, name: conversationName } : prev)
        refetchConversations()
      } catch (error) {
        console.error('Failed to update conversation name:', error)
      }
    }
    
    // 创建新的 AbortController 用于停止输出
    abortControllerRef.current = new AbortController()

    try {
      // 准备 AI 消息
      const aiMessage: ChatMessageItem = {
        role: 'assistant',
        content: '',
        id: `msg-${Date.now()}-ai-${Math.random().toString(36).substr(2, 9)}`,
        references: [],
        thinking: '',
        thinkingComplete: false
      }

      setMessages(prev => [...prev, aiMessage])

      // 根据模式选择 API
      if (activeTab === 'topics' && selectedConversationDetail?.id) {
        // 话题模式 - 使用 completion API
        // 构建请求参数，包含元数据过滤条件和功能开关（参考 ragflow）
        const completionParams: Parameters<typeof conversationAPI.completion>[0] = {
          conversation_id: selectedConversationDetail.id,
          messages: updatedMessages,
          quote: chatSettings.quote,
          // 功能开关参数（参考 ragflow）
          reasoning: enableReasoning,
          internet: enableInternet,
        }
        
        // 如果有已上传的文件，添加 doc_ids
        const docIds = getDocIdsString()
        if (docIds) {
          completionParams.doc_ids = docIds
        }
        
        // 如果启用了元数据过滤且有条件，添加到请求中
        if (chatSettings.metadataFilterMode === 'manual' && 
            chatSettings.metadataCondition.conditions && 
            chatSettings.metadataCondition.conditions.length > 0) {
          completionParams.metadata_condition = chatSettings.metadataCondition
        }
        
        const response = await conversationAPI.completion(completionParams)

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        if (!response.body) throw new Error('No response body')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const jsonStr = line.slice(5).trim()
                if (jsonStr === 'true') break
              
              const data = JSON.parse(jsonStr)
                if (data.retcode === 0 && data.data?.answer) {
                  const content = data.data.answer
                const references = extractReferencesFromSSEData(data.data)
                  
                  // 提取 think/thinking 内容（支持两种标签格式）
                  // 服务端返回累积式流式数据，每个 chunk 都可能包含完整的 <think>...</think>
                  let thinking = ''
                  const thinkMatch = content.match(/<think(?:ing)?>([\s\S]*?)(?:<\/think(?:ing)?>|$)/)
                  if (thinkMatch) {
                    thinking = thinkMatch[1].trim()
                  }
                  
                  // 清理内容：移除 think 标签及其内容
                  const cleanContent = content
                    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/g, '')
                    .replace(/<think(?:ing)?>[\s\S]*$/, '')
                    .trim()
                  
                  setMessages(prev => {
                    const newMsgs = [...prev]
                    const lastIdx = newMsgs.length - 1
                    if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                      newMsgs[lastIdx] = {
                        ...newMsgs[lastIdx],
                        content: cleanContent,
                        references,
                        thinking
                      }
                    }
                    return newMsgs
                  })
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      } else {
        // 普通聊天模式
        const historyMessages: ChatMessage[] = updatedMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }))

        const requestBody: ChatServiceRequest = {
          prompt: '',
          messages: historyMessages,
          llm_name: selectedModel || 'gpt-4o-mini',
          stream: true,
          gen_conf: {},
          tavily_api_key: '',
        }

        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const fullUrl = `${baseURL}/v1${chatConfig.apiEndpoint}`
        const token = localStorage.getItem('auth_token')
        
        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim()
                if (!jsonStr) continue
                
                const data: SSEResponse = JSON.parse(jsonStr)
                
                if (data.retcode === 0 && typeof data.data === 'string') {
                  const rawData = data.data
                  
                  // 提取 think/thinking 内容（支持两种标签格式）
                  let thinking = ''
                  const thinkMatch = rawData.match(/<think(?:ing)?>([\s\S]*?)(?:<\/think(?:ing)?>|$)/)
                  if (thinkMatch) {
                    thinking = thinkMatch[1].trim()
                  }
                  
                  // 清理内容：移除 think 标签及其内容
                  const content = rawData
                    .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/g, '')
                    .replace(/<think(?:ing)?>[\s\S]*$/, '')
                    .trim()
                  
                  setMessages(prev => {
                    const newMsgs = [...prev]
                    const lastIdx = newMsgs.length - 1
                    if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                      newMsgs[lastIdx] = {
                        ...newMsgs[lastIdx],
                        content,
                        thinking
                      }
                    }
                    return newMsgs
                  })
                } else if (data.data === true) {
                  break
                }
              } catch (e) {
                // 忽略解析错误
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => {
        const newMsgs = [...prev]
        const lastIdx = newMsgs.length - 1
        if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
          newMsgs[lastIdx] = {
            ...newMsgs[lastIdx],
            content: '抱歉，发生了错误，请重试。'
          }
        }
        return newMsgs
      })
    } finally {
      setIsStreaming(false)
    }
  }

  // 保持 ref 指向最新的 handleSendMessage
  handleSendMessageRef.current = handleSendMessage

  // 新建对话
  const handleCreateConversation = async () => {
    if (!selectedApp) return

    try {
      const newConversation = await conversationAPI.setConversation({
        dialog_id: selectedApp,
        name: 'New conversation',
        is_new: true
      })
      
      refetchConversations()
      
      if (newConversation?.id) {
        // 立即更新选中状态
        setActiveConversationKey(newConversation.id)
        // 清空消息，准备新对话
        setMessages([])
        // 异步加载对话详情
        setTimeout(() => fetchConversationDetail(newConversation.id), 500)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // 重命名对话
  const confirmRenameConversation = async () => {
    if (!renamingConversationId || !newConversationName.trim() || !selectedApp) return

    try {
      await conversationAPI.setConversation({
        dialog_id: selectedApp,
        conversation_id: renamingConversationId,
        name: newConversationName.trim(),
        is_new: false
      })
      
      refetchConversations()
      
      if (selectedConversationDetail?.id === renamingConversationId) {
        setSelectedConversationDetail((prev: any) => ({
          ...prev,
          name: newConversationName.trim()
        }))
      }
      
      setRenamingConversationId(null)
      setNewConversationName('')
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  // 获取当前选中应用的信息
  const currentApp = dialogApps.find(app => app.id === selectedApp)
  
  // 获取应用图标 URL
  const getAppIconUrl = React.useCallback((app: typeof currentApp) => {
    if (!app?.icon) return null
    return app.icon.startsWith('data:') || app.icon.startsWith('http') 
      ? app.icon 
      : `data:image/png;base64,${app.icon}`
  }, [])

  // 当前应用的图标 URL
  const currentAppIconUrl = React.useMemo(() => getAppIconUrl(currentApp), [currentApp, getAppIconUrl])
  

  // 处理引用点击事件 - 打开详情侧边栏
  const handleReferenceClick = React.useCallback((reference: ReferenceChunk, _index: number, allReferences?: ReferenceChunk[]) => {
    console.log('Reference clicked:', reference)
    setSelectedChunk(reference)
    if (allReferences) {
      setCurrentMessageReferences(allReferences)
    }
    setDetailSheetOpen(true)
  }, [])
  
  // 处理查看详情
  const handleViewDetail = React.useCallback((chunk: ReferenceChunk, allReferences?: ReferenceChunk[]) => {
    setSelectedChunk(chunk)
    if (allReferences) {
      setCurrentMessageReferences(allReferences)
    }
    setDetailSheetOpen(true)
  }, [])
  
  // 处理复制
  const handleCopyContent = React.useCallback((content: string) => {
    copyToClipboard(content)
    toast.success('已复制到剪贴板')
  }, [])
  
  // 转换消息为 Bubble 格式
  const bubbleItems = messages.map((msg, index) => {
    const references = msg.references || []

    // 使用新的 createReferenceMarkerComponent 创建内联引用组件
    const SupComponent = createReferenceMarkerComponent(references, {
      onViewDetail: (chunk) => handleViewDetail(chunk, references),
      onCopy: handleCopyContent
    })

    // 判断当前消息是否正在流式输出
    const lastAssistantMsgIndex = [...messages].reverse().findIndex(m => m.role === 'assistant')
    const actualLastIndex = lastAssistantMsgIndex >= 0 ? messages.length - 1 - lastAssistantMsgIndex : -1
    const isCurrentStreamingMessage = isStreaming && msg.role === 'assistant' && index === actualLastIndex

    return {
      // 参考 ragflow buildMessageUuidWithRole：使用 role_id 格式确保唯一性
      key: `${msg.role}_${msg.id || index}`,
      role: msg.role,
      content: msg.content || '',
      // 使用 streaming 属性优化流式体验，避免动画异常
      streaming: isCurrentStreamingMessage,
      // 注意：不要设置 loading 属性，否则会导致流式输出时持续显示加载动画
      // 加载状态在 contentRender 中通过 "正在生成..." 文本显示
      placement: (msg.role === 'user' ? 'end' : 'start') as 'start' | 'end',
      // 底部操作栏位置：助手消息放在外部底部，用户消息不显示
      footerPlacement: msg.role === 'assistant' ? 'outer-end' as const : undefined,
      avatar: msg.role === 'user'
        ? (
            <div 
              className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
              style={{ 
                background: 'var(--color-chat-bubble-user-avatar-bg)', 
                color: 'var(--color-chat-bubble-user-avatar-text)' 
              }}
            >
              U
        </div>
          )
        : currentAppIconUrl ? (
            <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={currentAppIconUrl} 
                alt={currentApp?.name || 'AI'}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div 
              className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-components-gradient-primary)' }}
            >
              <span className="text-white text-sm font-bold">AI</span>
                  </div>
          ),
      contentRender: msg.role === 'assistant' ? () => {
        // 优先使用流式输出时提取的 thinking 字段，回退到从 content 提取（针对历史消息）
        const fallback = extractThinkContent(msg.content || '')
        const thinkContent = msg.thinking || fallback.thinkContent
        const mainContent = msg.thinking ? (msg.content || '') : fallback.mainContent
        
        // 确定思考状态：
        // - 服务端返回的是累积式流式数据，每个 chunk 都包含完整的 <think>...</think>
        // - 所以不能用闭合标签来判断，而是用 isStreaming 状态
        // - 如果正在流式输出且有思考内容，就是 thinking 状态
        // - 如果流式输出结束或者是历史消息，就是 complete 状态
        let status: ThinkingStatus = 'none'
        if (thinkContent) {
          // 检查是否是当前正在流式输出的消息（最后一条助手消息且 isStreaming 为 true）
          const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
          const isLastAssistantMsg = lastAssistantMsg?.id === msg.id
          const isCurrentlyStreaming = isStreaming && isLastAssistantMsg
          status = isCurrentlyStreaming ? 'thinking' : 'complete'
        }
        
        // 处理连续图片引用，分析轮播组
        const { content: processedContent, carouselGroups } = processContentForCarousel(mainContent, references)
        
        // 对处理后的内容转换剩余引用格式
        const mainContentWithSup = convertReferencesToSup(processedContent)
        
        // 渲染内容片段（在轮播占位符处分割）
        const renderContentWithCarousels = () => {
          if (carouselGroups.length === 0) {
            // 没有轮播组，直接渲染
            return (
              <XMarkdown 
                components={{ sup: SupComponent }} 
                paragraphTag="div"
              >
                {mainContentWithSup}
              </XMarkdown>
            )
          }
          
          // 有轮播组，分割渲染
          const parts = mainContentWithSup.split(/<carousel-placeholder[^>]*><\/carousel-placeholder>/g)
          const elements: React.ReactNode[] = []
          
          parts.forEach((part, idx) => {
            // 渲染文本部分
            if (part.trim()) {
              elements.push(
                <XMarkdown 
                  key={`text-${idx}`}
                  components={{ sup: SupComponent }} 
                  paragraphTag="div"
                >
                  {part}
                </XMarkdown>
              )
            }
            
            // 在文本部分之间插入轮播（除了最后一个部分）
            if (idx < carouselGroups.length) {
              const group = carouselGroups[idx]
              elements.push(
                <CarouselWrapper 
                  key={`carousel-${idx}`}
                  group={group}
                  chunks={references}
                />
              )
            }
          })
          
          return <>{elements}</>
        }
        
        return (
          <div className="space-y-3">
            {/* Think 组件展示思考过程 - 使用外部定义的 ThinkWrapper 组件 */}
            {thinkContent && (
              <ThinkWrapper status={status} messageId={msg.id}>
                <div 
                  className="text-sm whitespace-pre-wrap" 
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {thinkContent}
                </div>
              </ThinkWrapper>
            )}
            
            {/* 使用 XMarkdown 渲染主内容，支持轮播组件 */}
            {mainContentWithSup && (
              <div className="leading-relaxed markdown-content">
                {renderContentWithCarousels()}
              </div>
            )}
          
            {/* 如果没有内容且没有思考内容，显示 Ant Design X 三点加载动画 */}
            {!thinkContent && !mainContent && (
              <BubbleLoading prefixCls="ant-bubble" />
            )}
            
            {/* 图片引用轮播列表 - 汇总展示消息中引用的所有图片 */}
            {references.length > 0 && (
              <ReferenceImageList
                referenceChunks={references}
                messageContent={mainContent}
                className="mt-4"
                onImageClick={(chunk) => handleViewDetail(chunk, references)}
              />
            )}
            
            {/* 底部汇总显示所有引用来源 - 使用新的 ReferencePanel 组件 */}
            {references.length > 0 && (
              <ReferencePanel
                chunks={references}
                onChunkClick={(chunk) => handleViewDetail(chunk, references)}
                defaultVisiblePerDoc={2}
              />
            )}
          </div>
        )
      } : undefined,
      footer: msg.role === 'assistant' ? (
        <MessageActionsFooter
          content={msg.content || ''}
          onCopy={async () => {
            try {
              await copyToClipboard(msg.content || '')
              toast.success('已复制到剪贴板')
            } catch {
              toast.error('复制失败')
            }
          }}
          onRegenerate={() => handleRegenerateMessage(index)}
          onLike={() => toast.success('感谢您的反馈')}
          onDislike={() => toast.success('感谢您的反馈，我们会继续改进')}
        />
      ) : undefined,
      variant: 'borderless' as const,
      styles: msg.role === 'user' 
        ? {
            // 用户消息：保持气泡框样式
        content: {
              backgroundColor: 'var(--color-chat-bubble-user-bg)',
              color: 'var(--color-chat-bubble-user-text)',
              borderRadius: '18px',
              padding: '12px 16px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            }
          }
        : {
            // AI 消息：透明背景，融入页面
            content: {
              backgroundColor: 'transparent',
              color: 'var(--color-text-primary)',
              borderRadius: '0',
              padding: '0',
          border: 'none',
          boxShadow: 'none',
            }
          },
    }
  })

  // 提示词
  const promptItems: PromptsProps['items'] = [
    { key: '1', label: '解释这个概念', description: '深入了解' },
    { key: '2', label: '写一段代码', description: '编程助手' },
    { key: '3', label: '总结要点', description: '快速提取' },
    { key: '4', label: '翻译文本', description: '多语言' },
  ]


  // 处理事件
  const handleDiscoverClick = () => {
    setMode('market')
    setSelectedApp('')
  }

  const handleAppSelect = (appId: string) => {
    setMode('chat')
    setSelectedApp(appId)
    setActiveTab('workspace')
    setMessages([])
    // 切换应用时清理对话状态，避免状态不一致
    setSelectedConversationDetail(null)
    setActiveConversationKey(undefined)
  }

  const handleTopicsClick = () => {
    setActiveTab('topics')
    setMode('chat')
    clearChat()
    setSelectedConversationDetail(null)
    setActiveConversationKey(undefined)
    setMessages([])
  }

  return (
    <div 
      ref={dropContainerRef}
      className="h-full flex" 
      style={{ backgroundColor: 'var(--color-chat-content-bg)' }}
    >
      {/* 全屏拖拽指示器 */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ 
            backgroundColor: 'rgba(var(--color-surface-primary-rgb, 0, 0, 0), 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="flex flex-col items-center gap-4 p-8 rounded-2xl"
            style={{ 
              backgroundColor: 'var(--color-components-card-bg)',
              border: '3px dashed var(--color-border-accent)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Upload className="w-16 h-16" style={{ color: 'var(--color-text-accent)' }} />
            <div className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
              释放以上传文件
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              支持图片、文档等格式
            </div>
          </div>
        </div>
      )}
      
      {/* 左侧边栏 */}
      <div 
        className="w-64 flex flex-col"
        style={{ 
          backgroundColor: 'var(--color-components-sidebar-bg)',
          borderRight: '1px solid var(--color-components-sidebar-border)'
        }}
      >
        {/* 顶部导航 */}
        <div className="p-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div className="flex space-x-1">
            {['workspace', 'topics', 'settings'].map((tab) => (
            <button
                key={tab}
                onClick={() => tab === 'topics' ? handleTopicsClick() : setActiveTab(tab as any)}
                disabled={tab === 'topics' && !selectedApp}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
                  tab === 'topics' && !selectedApp && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  backgroundColor: activeTab === tab 
                    ? 'var(--color-components-sidebar-item-bg-active)' 
                    : 'var(--color-components-sidebar-item-bg)',
                  color: activeTab === tab 
                    ? 'var(--color-components-sidebar-item-text-active)' 
                    : 'var(--color-components-sidebar-item-text)'
                }}
              >
                {tab === 'workspace' ? '工作区' : tab === 'topics' ? '话题' : '设置'}
            </button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab === 'workspace' ? (
            <>
              {/* 发现按钮 */}
              <div className="p-4">
                <button
                  onClick={handleDiscoverClick}
                  className="w-full py-3 px-4 text-left text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                  style={{
                    backgroundColor: mode === 'market' 
                      ? 'var(--color-components-sidebar-item-bg-active)' 
                      : 'var(--color-components-sidebar-item-bg)',
                    color: mode === 'market' 
                      ? 'var(--color-components-sidebar-item-text-active)' 
                      : 'var(--color-components-sidebar-item-text)'
                  }}
                >
                  <Search className="h-4 w-4" />
                  <span>发现</span>
                </button>
              </div>

              <div className="mx-4" style={{ borderTop: '1px solid var(--color-border-subtle)' }} />

              {/* 应用列表 */}
              <div className="flex-1 p-4 space-y-1 overflow-y-auto">
                {dialogAppsLoading ? (
                  <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载应用中...</div>
                ) : dialogAppsError ? (
                  <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-error)' }}>加载失败</div>
                ) : dialogApps.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无应用</div>
                ) : (
                  dialogApps.filter(app => app.status === '1').map((app) => (
                        <button
                          key={app.id}
                          onClick={() => handleAppSelect(app.id)}
                          className="w-full py-3 px-4 text-left text-sm rounded-lg transition-colors flex items-center space-x-3"
                          style={{
                            backgroundColor: selectedApp === app.id && mode === 'chat'
                              ? 'var(--color-components-sidebar-item-bg-active)'
                              : 'var(--color-components-sidebar-item-bg)',
                            color: selectedApp === app.id && mode === 'chat'
                              ? 'var(--color-components-sidebar-item-text-active)'
                              : 'var(--color-components-sidebar-item-text)'
                          }}
                    >
                            {getAppIcon(app)}
                          <span>{app.name}</span>
                        </button>
                  ))
                )}
              </div>
            </>
          ) : activeTab === 'topics' ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!selectedApp ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
                    <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>请先选择一个应用</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 应用信息和新建按钮 */}
                  <div className="p-4" style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                    <div 
                      className="flex items-center mb-3 p-2 rounded-lg"
                      style={{ backgroundColor: 'var(--color-background-subtle)' }}
                    >
                        {getAppIcon(dialogApps.find(app => app.id === selectedApp), 'md')}
                      <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {dialogApps.find(app => app.id === selectedApp)?.name}
                        </p>
                      </div>
                    </div>
                    
                  </div>

                  {/* 对话列表 - 使用 ant-design/x Conversations 组件（带分组和新建功能） */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="explore-conversations">
                      <style>{`
                        .explore-conversations .ant-conversations {
                          background-color: transparent !important;
                        }
                        /* 新建对话按钮样式 */
                        .explore-conversations .ant-conversations-creation {
                          margin: 8px 12px !important;
                          padding: 10px 12px !important;
                          border-radius: 8px !important;
                          background-color: var(--color-components-sidebar-item-bg-active) !important;
                          color: var(--color-components-sidebar-item-text-active) !important;
                          border: 1px solid var(--color-border-accent) !important;
                          transition: all 0.2s ease !important;
                          font-weight: 500 !important;
                        }
                        .explore-conversations .ant-conversations-creation .ant-typography,
                        .explore-conversations .ant-conversations-creation span {
                          color: var(--color-components-sidebar-item-text-active) !important;
                        }
                        .explore-conversations .ant-conversations-creation:hover {
                          background-color: var(--color-components-button-primary-bg) !important;
                          color: var(--color-components-button-primary-text) !important;
                        }
                        .explore-conversations .ant-conversations-creation:hover .ant-typography,
                        .explore-conversations .ant-conversations-creation:hover span {
                          color: var(--color-components-button-primary-text) !important;
                        }
                        /* 分组标题样式 */
                        .explore-conversations .ant-conversations-group-title,
                        .explore-conversations .ant-conversations-group-title .ant-typography {
                          color: var(--color-text-tertiary) !important;
                          font-size: 12px !important;
                          padding: 12px 16px 4px !important;
                          font-weight: 500 !important;
                        }
                        /* 会话项样式 */
                        .explore-conversations .ant-conversations-list .ant-conversations-item {
                          background-color: transparent !important;
                          border-radius: 8px !important;
                          margin: 2px 8px !important;
                          padding: 8px 12px !important;
                          transition: all 0.2s ease !important;
                        }
                        .explore-conversations .ant-conversations-list .ant-conversations-item:hover {
                          background-color: var(--color-components-sidebar-item-bg-hover) !important;
                        }
                        .explore-conversations .ant-conversations-list .ant-conversations-item-active {
                          background-color: var(--color-components-sidebar-item-bg-active) !important;
                        }
                        .explore-conversations .ant-conversations-list .ant-conversations-item-active .ant-conversations-item-label {
                          color: var(--color-components-sidebar-item-text-active) !important;
                        }
                        .explore-conversations .ant-conversations-item-label {
                          color: var(--color-text-primary) !important;
                          font-size: 14px !important;
                        }
                        /* 覆盖 Typography 组件的文字颜色（Conversations 内部使用 Typography 渲染标签） */
                        .explore-conversations .ant-typography,
                        .explore-conversations .ant-conversations-label,
                        .explore-conversations span.ant-typography.ant-conversations-label {
                          color: var(--color-text-primary) !important;
                        }
                        .explore-conversations .ant-conversations-item-active .ant-typography,
                        .explore-conversations .ant-conversations-item-active .ant-conversations-label,
                        .explore-conversations .ant-conversations-item-active span.ant-typography.ant-conversations-label {
                          color: var(--color-components-sidebar-item-text-active) !important;
                        }
                        .explore-conversations .ant-conversations-item .anticon {
                          color: var(--color-text-tertiary) !important;
                        }
                        .explore-conversations .ant-conversations-item:hover .anticon {
                          color: var(--color-text-secondary) !important;
                        }
                        /* 空状态提示 */
                        .explore-conversations-empty {
                          text-align: center;
                          padding: 32px 16px;
                          color: var(--color-text-tertiary);
                          font-size: 14px;
                        }
                      `}</style>
                      <ConfigProvider
                        theme={{
                          algorithm: document.documentElement.classList.contains('dark') ? theme.darkAlgorithm : theme.defaultAlgorithm,
                        }}
                      >
                        {dialogConversationsLoading ? (
                          <div className="explore-conversations-empty">加载中...</div>
                        ) : dialogConversationsError ? (
                          <div className="explore-conversations-empty" style={{ color: 'var(--color-text-error)' }}>加载失败</div>
                        ) : (
                          <Conversations
                            activeKey={activeConversationKey}
                            // 新建对话功能（使用 Conversations 组件的 creation 属性）
                            creation={{
                              icon: <Plus className="h-4 w-4" />,
                              label: '新建对话',
                              onClick: handleCreateConversation,
                            }}
                            // 按日期分组
                            groupable={{
                              label: (group) => group,
                            }}
                            items={dialogConversations.length === 0 ? [] : dialogConversations
                              .sort((a: any, b: any) => {
                                const timeA = a.update_time > 1000000000000 ? a.update_time : a.update_time * 1000
                                const timeB = b.update_time > 1000000000000 ? b.update_time : b.update_time * 1000
                                return timeB - timeA
                              })
                              .map((conv: any) => ({
                                key: conv.id,
                                label: conv.name || 'New conversation',
                                // 添加分组信息（今天、昨天、最近7天、更早）
                                group: getConversationDateGroup(conv.update_time),
                              }))}
                            menu={(conversation) => ({
                              items: [
                                { label: '重命名', key: 'rename', icon: <Edit3 className="h-3 w-3" /> },
                                { label: '删除', key: 'delete', icon: <Trash2 className="h-3 w-3" />, danger: true },
                              ],
                              onClick: async (menuInfo) => {
                                menuInfo.domEvent.stopPropagation()
                                const convData = dialogConversations.find((c: any) => c.id === conversation.key)
                                
                                if (menuInfo.key === 'rename' && convData) {
                                  setRenamingConversationId(conversation.key as string)
                                  setNewConversationName(convData.name || 'New conversation')
                                } else if (menuInfo.key === 'delete') {
                                  try {
                                    await conversationAPI.removeConversation([conversation.key as string])
                                    refetchConversations()
                                    if (activeConversationKey === conversation.key) {
                                      setActiveConversationKey(undefined)
                                      setSelectedConversationDetail(null)
                                      setMessages([])
                                    }
                                    toast.success('对话已删除')
                                  } catch (error) {
                                    console.error('Failed to delete conversation:', error)
                                    toast.error('删除失败')
                                  }
                                }
                              },
                            })}
                            onActiveChange={(key) => {
                              // 受控模式：更新 activeKey 状态
                              setActiveConversationKey(key)
                              // 先清空消息，避免新旧消息混合导致 key 重复
                              setMessages([])
                              // 加载对话详情
                              if (key) {
                                fetchConversationDetail(key)
                              } else {
                                setSelectedConversationDetail(null)
                              }
                            }}
                          />
                        )}
                      </ConfigProvider>
                    </div>
                  </div>
                  
                  {/* 重命名对话 Modal（更现代化的交互） */}
                  <Modal
                    title="重命名对话"
                    open={!!renamingConversationId}
                    onOk={confirmRenameConversation}
                    onCancel={() => {
                      setRenamingConversationId(null)
                      setNewConversationName('')
                    }}
                    okText="确认"
                    cancelText="取消"
                    destroyOnClose
                  >
                    <Input
                      value={newConversationName}
                      onChange={(e) => setNewConversationName(e.target.value)}
                      onPressEnter={confirmRenameConversation}
                      placeholder="请输入对话名称"
                      autoFocus
                    />
                  </Modal>
                </>
              )}
            </div>
          ) : (
            <div className="flex-1 p-4">
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>设置功能开发中...</p>
            </div>
          )}
        </div>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 flex" style={{ backgroundColor: 'var(--color-chat-content-bg)' }}>
        {/* 聊天内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <div 
          className="flex items-center justify-between px-6 py-3"
          style={{ 
            backgroundColor: 'var(--color-chat-header-bg)',
            borderBottom: '1px solid var(--color-chat-header-border)',
            backdropFilter: 'var(--color-chat-header-backdrop)'
          }}
        >
          <div className="flex items-center space-x-3">
            {/* 显示当前应用图标 */}
            {mode === 'chat' && currentApp && (
              <div className="flex-shrink-0">
                {currentApp.icon ? (
                  <img 
                    src={currentApp.icon.startsWith('data:') || currentApp.icon.startsWith('http') 
                      ? currentApp.icon 
                      : `data:image/png;base64,${currentApp.icon}`}
                    alt={currentApp.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--color-components-gradient-primary)' }}
                  >
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            )}
            <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {mode === 'market' 
                ? '应用市场' 
                : activeTab === 'topics' 
                  ? (selectedConversationDetail?.name || currentApp?.name || '话题')
                  : currentApp?.name || '智能助手'
              }
            </h1>
          </div>
          
          {mode === 'chat' && (
            <div className="flex items-center gap-3">
              {/* 布局切换按钮组 */}
              <div className="hidden md:flex items-center gap-1 rounded-lg p-1" style={{ border: '1px solid var(--color-border-default)' }}>
                <Button
                  variant={chatLayout === 'default' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChatLayout('default')}
                  className="px-3 py-1 h-7"
                  title="默认布局"
                >
                  <LayoutGrid className="w-3 h-3" />
                </Button>
                <Button
                  variant={chatLayout === 'center' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChatLayout('center')}
                  className="px-3 py-1 h-7"
                  title="居中布局"
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant={chatLayout === 'full' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setChatLayout('full')}
                  className="px-3 py-1 h-7"
                  title="全屏布局"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
              </div>
              
              <Button 
                variant={settingsPanelOpen ? "default" : "ghost"} 
                size="sm"
                onClick={() => setSettingsPanelOpen(!settingsPanelOpen)}
                title="聊天设置"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {mode === 'market' ? (
            // 应用市场
            <div className="flex-1 p-6 overflow-y-auto">
              {dialogAppsLoading ? (
                <div className="text-center py-16" style={{ color: 'var(--color-text-tertiary)' }}>加载应用中...</div>
              ) : dialogApps.length === 0 ? (
                <div className="text-center py-16" style={{ color: 'var(--color-text-tertiary)' }}>暂无应用</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dialogApps.map((app) => (
                    <div 
                      key={app.id} 
                      className="rounded-lg p-6 hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: 'var(--color-components-card-bg)',
                        border: '1px solid var(--color-components-card-border)'
                      }}
                    >
                        <div className="flex items-center space-x-3 mb-3">
                            {getAppIcon(app, 'md')}
                          <h3 className="font-medium" style={{ color: 'var(--color-components-card-meta-title)' }}>{app.name}</h3>
                        </div>
                        <p className="text-sm mb-4" style={{ color: 'var(--color-components-card-meta-description)' }}>{app.description}</p>
                        <Button 
                          size="sm" 
                          className="w-full"
                        variant={app.status === '1' ? "outline" : "default"}
                        disabled={app.status === '1'}
                      >
                        {app.status === '1' ? '已添加' : '添加到工作区'}
                        </Button>
                      </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // 聊天模式
            <>
              {/* 消息区域 */}
              <div className="flex-1 overflow-y-auto px-6 py-8">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center explore-welcome-area">
                    <style>{`
                      /* Welcome 组件样式 */
                      .explore-welcome-area .ant-welcome-title {
                        color: var(--color-text-primary) !important;
                      }
                      .explore-welcome-area .ant-welcome-description {
                        color: var(--color-text-secondary) !important;
                      }
                      /* Prompts 组件样式 */
                      .explore-welcome-area .ant-prompts-item {
                        background-color: var(--color-components-card-bg) !important;
                        border-color: var(--color-components-card-border) !important;
                        transition: all 0.2s ease !important;
                      }
                      .explore-welcome-area .ant-prompts-item:hover {
                        border-color: var(--color-components-button-primary-bg) !important;
                        background-color: var(--color-components-card-bg-hover) !important;
                      }
                      .explore-welcome-area .ant-prompts-label {
                        color: var(--color-text-primary) !important;
                      }
                      .explore-welcome-area .ant-prompts-description {
                        color: var(--color-text-secondary) !important;
                      }
                    `}</style>
                    <Welcome
                      variant="borderless"
                      icon={
                        currentApp?.icon ? (
                          <img 
                            src={currentApp.icon.startsWith('data:') || currentApp.icon.startsWith('http') 
                              ? currentApp.icon 
                              : `data:image/png;base64,${currentApp.icon}`}
                            alt={currentApp.name}
                            className="w-16 h-16 rounded-2xl object-cover"
                          />
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-2xl flex items-center justify-center"
                            style={{ background: 'var(--color-components-gradient-primary)' }}
                          >
                            <span className="text-white text-2xl font-bold">AI</span>
                          </div>
                        )
                      }
                      title={currentApp?.name || '智能助手'}
                      description={currentApp?.description || '有什么可以帮你的吗？'}
                    />
                    <div className="mt-8">
                      <Prompts
                        items={promptItems}
                        onItemClick={(info) => {
                          if (typeof info.data.label === 'string') {
                            setInputValue(info.data.label)
                          }
                        }}
                        wrap
                                          />
                                        </div>
                  </div>
                ) : (
                  <div className={cn(
                    "mx-auto explore-chat-area",
                    chatLayout === 'full' ? 'max-w-none px-4' : chatLayout === 'center' ? 'max-w-4xl' : 'max-w-3xl'
                  )} style={{ height: '100%' }}>
                    <style>{`
                      /* Think 组件主题适配 */
                      .explore-chat-area .ant-think-status-wrapper,
                      .explore-chat-area .ant-think-title {
                        color: var(--color-text-secondary) !important;
                      }
                      .explore-chat-area .ant-think {
                        background-color: var(--color-components-card-bg) !important;
                        border-color: var(--color-components-card-border) !important;
                      }
                      .explore-chat-area .ant-think-content {
                        color: var(--color-text-secondary) !important;
                      }
                      /* Bubble 组件主题适配 */
                      .explore-chat-area .ant-bubble-content {
                        color: var(--color-text-primary) !important;
                      }
                      /* Actions 组件主题适配 */
                      .explore-chat-area .ant-actions-item {
                        color: var(--color-text-tertiary) !important;
                      }
                      .explore-chat-area .ant-actions-item:hover {
                        color: var(--color-text-primary) !important;
                        background-color: var(--color-state-hover) !important;
                      }
                      /* XMarkdown 内容样式 */
                      .explore-chat-area .markdown-content {
                        color: var(--color-text-primary) !important;
                      }
                      .explore-chat-area .markdown-content a {
                        color: var(--color-components-button-primary-bg) !important;
                      }
                      .explore-chat-area .markdown-content code {
                        background-color: var(--color-background-subtle) !important;
                        color: var(--color-text-primary) !important;
                      }
                      .explore-chat-area .markdown-content pre {
                        background-color: var(--color-components-pre-bg) !important;
                        border-color: var(--color-components-pre-border) !important;
                      }
                      .explore-chat-area .markdown-content pre code {
                        color: var(--color-components-pre-text) !important;
                      }
                    `}</style>
                    <Bubble.List
                      items={bubbleItems as any}
                      autoScroll
                      style={{ height: '100%' }}
                      role={{
                        // 用户消息默认配置
                        user: {
                          placement: 'end',
                          variant: 'filled',
                          shape: 'round',
                        },
                        // AI 助手消息默认配置
                        assistant: {
                          placement: 'start',
                          variant: 'borderless',
                        },
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 输入区域（参考 ragflow 重构） */}
              {(activeTab !== 'topics' || selectedConversationDetail) && (
                <div className="px-6 pb-6">
                  <div 
                    className={cn(
                      "mx-auto explore-sender-area rounded-2xl overflow-hidden",
                      chatLayout === 'full' ? 'max-w-none px-4' : chatLayout === 'center' ? 'max-w-4xl' : 'max-w-3xl'
                    )}
                    style={{
                      border: '1px solid var(--color-components-input-border)',
                      backgroundColor: 'var(--color-components-input-bg)',
                    }}
                  >
                    {/* Sender 和 Attachments 样式覆盖 - 使用项目语义令牌 */}
                    <style>{`
                      /* Sender 输入框样式 - 现代化无高亮设计，边框在外层容器 */
                      .explore-sender-area .ant-sender {
                        background-color: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        outline: none !important;
                        padding-bottom: 0 !important;
                      }
                      .explore-sender-area .ant-sender:hover {
                        border: none !important;
                      }
                      .explore-sender-area .ant-sender:focus-within {
                        border: none !important;
                        box-shadow: none !important;
                        outline: none !important;
                      }
                      .explore-sender-area .ant-sender-content {
                        background-color: transparent !important;
                        padding-bottom: 0 !important;
                      }
                      /* 移除 Sender 内部可能的分隔线和边距 */
                      .explore-sender-area .ant-sender-actions {
                        border-top: none !important;
                        padding-top: 0 !important;
                        margin-top: 0 !important;
                      }
                      .explore-sender-area .ant-sender textarea,
                      .explore-sender-area .ant-sender input {
                        color: var(--color-components-input-text) !important;
                        background-color: transparent !important;
                        outline: none !important;
                        box-shadow: none !important;
                        padding-left: 4px !important;
                      }
                      .explore-sender-area .ant-sender textarea:focus,
                      .explore-sender-area .ant-sender input:focus {
                        outline: none !important;
                        box-shadow: none !important;
                      }
                      .explore-sender-area .ant-sender textarea::placeholder,
                      .explore-sender-area .ant-sender input::placeholder {
                        color: var(--color-components-input-text-placeholder) !important;
                      }
                      /* 发送按钮样式 */
                      .explore-sender-area .ant-sender-actions-btn {
                        background-color: var(--color-components-button-primary-bg) !important;
                        color: var(--color-components-button-primary-text) !important;
                        border: none !important;
                      }
                      .explore-sender-area .ant-sender-actions-btn:hover {
                        background-color: var(--color-components-button-primary-bg-hover) !important;
                      }
                      .explore-sender-area .ant-sender-actions-btn:disabled {
                        background-color: var(--color-components-button-primary-bg-disabled) !important;
                        color: var(--color-components-button-primary-text-disabled) !important;
                      }
                      /* 当 Header 打开时，Sender 顶部不要圆角 */
                      .explore-sender-area .ant-sender-header ~ .ant-sender,
                      .explore-sender-area .ant-sender-header + .ant-sender {
                        border-radius: 0 !important;
                        border-top: none !important;
                      }
                      /* 关闭按钮 - 现代化圆形设计 */
                      .explore-sender-area .ant-sender-header-close,
                      .explore-sender-area [class*="sender-header"] button,
                      .explore-sender-area [class*="header-close"] {
                        color: var(--color-text-tertiary) !important;
                        background-color: transparent !important;
                        border-color: transparent !important;
                        border-radius: 8px !important;
                        width: 32px !important;
                        height: 32px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        transition: all 0.2s ease !important;
                      }
                      .explore-sender-area .ant-sender-header-close:hover,
                      .explore-sender-area [class*="sender-header"] button:hover,
                      .explore-sender-area [class*="header-close"]:hover {
                        color: var(--color-text-primary) !important;
                        background-color: var(--color-state-hover) !important;
                      }
                      /* 标题栏整体样式优化 */
                      .explore-sender-area .ant-sender-header {
                        padding: 12px 16px !important;
                        border-bottom: 1px solid var(--color-border-default) !important;
                      }
                      .explore-sender-area .ant-sender-header-title {
                        font-weight: 500 !important;
                        font-size: 14px !important;
                        color: var(--color-text-primary) !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 8px !important;
                      }
                      /* Attachments 容器背景 - 简洁设计 */
                      .explore-sender-area .ant-attachments {
                        background-color: var(--color-components-card-bg) !important;
                      }
                      /* 移除内层多余边框 */
                      .explore-sender-area .ant-attachment-placeholder,
                      .explore-sender-area .ant-attachment-placeholder-inner {
                        border: none !important;
                        background: transparent !important;
                        padding: 0 !important;
                        margin: 0 !important;
                      }
                      /* 悬停效果 */
                      .explore-sender-area .ant-attachments:hover {
                        background-color: var(--color-state-hover) !important;
                      }
                      /* 已上传文件列表项 */
                      .explore-sender-area .ant-attachments-list-item {
                        background-color: var(--color-components-input-bg) !important;
                        border: 1px solid var(--color-border-default) !important;
                        border-radius: 8px !important;
                        transition: all 0.2s ease !important;
                      }
                      .explore-sender-area .ant-attachments-list-item:hover {
                        background-color: var(--color-components-input-bg-hover) !important;
                        border-color: var(--color-border-accent) !important;
                      }
                      .explore-sender-area .ant-attachments-list-item-name {
                        color: var(--color-text-primary) !important;
                      }
                    `}</style>
                    
                    <Sender
                      value={inputValue}
                      onChange={setInputValue}
                      placeholder="输入消息，按 Enter 发送"
                      loading={isStreaming}
                      // 文件上传面板（参考 ragflow）
                      header={
                        <Sender.Header
                          title={
                            <span style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '8px',
                              color: 'var(--color-text-primary)',
                              fontWeight: 500,
                              fontSize: '14px',
                            }}>
                              <Upload className="w-4 h-4" style={{ color: 'var(--color-state-focus)' }} />
                              上传文件
                            </span>
                          }
                          open={headerOpen}
                          onOpenChange={setHeaderOpen}
                          styles={{
                            header: {
                              backgroundColor: 'var(--color-components-card-bg)',
                              borderRadius: '16px 16px 0 0',
                              border: 'none',
                              borderBottom: '1px solid var(--color-border-default)',
                              padding: '12px 16px',
                            },
                            content: {
                              padding: 0,
                              backgroundColor: 'var(--color-components-card-bg)',
                              border: 'none',
                            },
                          }}
                        >
                          <Attachments
                            items={uploadFiles as any}
                            maxCount={uploadConfig.maxCount}
                            getDropContainer={() => dropContainerRef.current}
                            onChange={(info) => {
                              // 处理 Attachments 组件的文件变化
                              if (info && Array.isArray(info)) {
                                setUploadFiles(info as UploadFile[])
                              }
                            }}
                            onRemove={(file) => {
                              if (file && typeof file === 'object' && 'uid' in file) {
                                removeUploadFile((file as UploadFile).uid)
                              }
                            }}
                            overflow="scrollX"
                            placeholder={(type) => ({
                              icon: (
                                <div style={{
                                  width: '44px',
                                  height: '44px',
                                  borderRadius: '12px',
                                  backgroundColor: type === 'drop' ? 'var(--color-state-focus-10)' : 'var(--color-surface-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  marginBottom: '12px',
                                  transition: 'all 0.2s ease',
                                }}>
                                  <Upload 
                                    className="w-5 h-5" 
                                    style={{ 
                                      color: type === 'drop' ? 'var(--color-state-focus)' : 'var(--color-text-tertiary)',
                                      transition: 'color 0.2s ease',
                                    }} 
                                  />
                                </div>
                              ),
                              title: (
                                <span style={{ 
                                  color: 'var(--color-text-primary)', 
                                  fontWeight: 500,
                                  fontSize: '14px',
                                }}>
                                  {type === 'drop' ? '释放以上传' : '点击或拖拽文件到此处'}
                                </span>
                              ),
                              description: (
                                <span style={{ 
                                  color: 'var(--color-text-tertiary)',
                                  fontSize: '12px',
                                  marginTop: '4px',
                                  display: 'block',
                                }}>
                                  {`支持图片、文档等，最多 ${uploadConfig.maxCount} 个，单个最大 ${Math.round(uploadConfig.maxSize / 1024 / 1024)}MB`}
                                </span>
                              ),
                            })}
                            styles={{
                              root: {
                                backgroundColor: 'var(--color-components-card-bg)',
                                padding: '20px 16px',
                                transition: 'background-color 0.2s ease',
                              },
                              placeholder: {
                                padding: 0,
                                margin: 0,
                                border: 'none',
                                background: 'transparent',
                              },
                              list: {
                                padding: '0 0 8px 0',
                                gap: '8px',
                              },
                              card: {
                                backgroundColor: 'var(--color-components-input-bg)',
                                border: '1px solid var(--color-border-default)',
                                borderRadius: '10px',
                                padding: '8px 12px',
                                transition: 'all 0.2s ease',
                              },
                              name: {
                                color: 'var(--color-text-primary)',
                                fontWeight: 500,
                                fontSize: '13px',
                              },
                              description: {
                                color: 'var(--color-text-tertiary)',
                                fontSize: '12px',
                              },
                            }}
                            // 自定义上传请求，参考 ragflow 的 createConversationBeforeUploadFile
                            // 1. 防止默认上传到当前页面 URL
                            // 2. 如果没有对话，先创建对话再上传
                            customRequest={async (options) => {
                              const { file, onSuccess, onError } = options
                              try {
                                let conversationId = selectedConversationDetail?.id
                                
                                // 如果没有对话，先创建一个新对话（参考 ragflow）
                                if (!conversationId && selectedApp) {
                                  const newConversation = await conversationAPI.setConversation({
                                    dialog_id: selectedApp,
                                    name: (file as File).name || 'New conversation',
                                    is_new: true
                                  })
                                  
                                  if (newConversation?.id) {
                                    conversationId = newConversation.id
                                    // 刷新对话列表
                                    refetchConversations()
                                    // 更新当前对话详情
                                    setTimeout(() => fetchConversationDetail(newConversation.id), 500)
                                  }
                                }
                                
                                if (!conversationId) {
                                  onError?.(new Error('No conversation available'))
                                  toast.error('请先选择或创建一个对话')
                                  return
                                }
                                
                                // 调用上传 API
                                const result = await conversationAPI.uploadAndParse(
                                  conversationId,
                                  file as File
                                  // 注：进度回调暂不使用，Attachments 组件会通过 onChange 处理文件状态
                                )
                                
                                if (result) {
                                  onSuccess?.(result, new XMLHttpRequest())
                                  toast.success(`文件 ${(file as File).name} 上传成功，解析完成后可基于文档提问`)
                                  // 上传成功后自动收起面板
                                  setHeaderOpen(false)
                                } else {
                                  onError?.(new Error('Upload failed'))
                                }
                              } catch (error) {
                                console.error('Upload error:', error)
                                onError?.(error as Error)
                                toast.error(`上传失败: ${(error as Error).message}`)
                              }
                            }}
                          />
                        </Sender.Header>
                      }
                      // 右侧操作区：停止按钮或发送按钮
                      suffix={isStreaming ? (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={handleStopOutput}
                          title="停止输出"
                        >
                          <Square className="w-4 h-4" />
                        </Button>
                      ) : undefined}
                      onSubmit={(message) => {
                        if (message) {
                          handleSendMessage(message)
                          setInputValue('')
                          // 清空上传的文件
                          clearUploadFiles()
                          // 关闭上传面板
                          setHeaderOpen(false)
                        }
                      }}
                      onCancel={handleStopOutput}
                      onPasteFile={(files) => {
                        // 粘贴文件时触发上传
                        for (let i = 0; i < files.length; i++) {
                          const file = files[i]
                          // 检查文件大小
                          if (file.size <= uploadConfig.maxSize) {
                            uploadFile(file)
                          } else {
                            toast.error(`文件 ${file.name} 超过大小限制`)
                          }
                        }
                        // 打开上传面板显示文件
                        if (files.length > 0) {
                          setHeaderOpen(true)
                        }
                      }}
                      style={{
                        borderRadius: '0',
                        border: 'none',
                        backgroundColor: 'transparent',
                      }}
                      styles={{
                        input: {
                          color: 'var(--color-components-input-text)',
                        },
                      }}
                    />
                    
                    {/* 输入框下方工具栏 - 与输入框无缝融合，参考 Claude 设计 */}
                    <div 
                      className="flex items-center justify-between"
                      style={{ 
                        paddingLeft: '12px',
                        paddingRight: '12px',
                        paddingBottom: '10px',
                        paddingTop: '4px',
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {/* 附件按钮 */}
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 px-1.5 gap-1.5"
                          onClick={() => setHeaderOpen(!headerOpen)}
                          title="上传文件"
                        >
                          <Paperclip className="w-4 h-4" style={{ color: headerOpen ? 'var(--color-text-accent)' : 'var(--color-text-tertiary)' }} />
                          {uploadFiles.length > 0 && (
                            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {uploadFiles.filter(f => f.status === 'done').length}
                            </span>
                          )}
                        </Button>
                        
                        {/* 深度思考按钮 */}
                        <Button 
                          variant={enableReasoning ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-7 px-2 gap-1.5 transition-colors",
                            enableReasoning 
                              ? "bg-[var(--color-components-button-primary-bg)] text-[var(--color-components-button-primary-text)] hover:bg-[var(--color-components-button-primary-bg-hover)]" 
                              : "text-[var(--color-text-tertiary)]"
                          )}
                          onClick={() => setEnableReasoning(!enableReasoning)}
                          title="深度思考"
                        >
                          <Atom className="w-4 h-4" />
                          <span className="text-xs">Thinking</span>
                        </Button>
                        
                        {/* 联网搜索按钮 */}
                        <Button 
                          variant={enableInternet ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-7 px-2 gap-1.5 transition-colors",
                            enableInternet 
                              ? "bg-[var(--color-components-button-primary-bg)] text-[var(--color-components-button-primary-text)] hover:bg-[var(--color-components-button-primary-bg-hover)]" 
                              : "text-[var(--color-text-tertiary)]"
                          )}
                          onClick={() => setEnableInternet(!enableInternet)}
                          title="联网搜索"
                        >
                          <Globe className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* 右侧状态提示 */}
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        {isUploading && (
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>上传中...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        </div>
        
        {/* 聊天设置面板 */}
        {mode === 'chat' && (
          <ChatSettingsPanel
            open={settingsPanelOpen}
            onClose={() => setSettingsPanelOpen(false)}
            settings={chatSettings}
            onSettingsChange={setChatSettings}
            onSave={selectedApp ? () => saveSettings(chatSettings) : undefined}
            saving={savingSettings}
            loading={settingsLoading}
            knowledgeBases={knowledgeBases}
            rerankModels={rerankModels}
            llmModels={myLLMs}
            modelsLoading={modelsLoading}
            onLoadKnowledgeBases={loadKnowledgeBases}
          />
        )}
        
        {/* 引用详情侧边栏 */}
        <ReferenceDetailSheet
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          chunk={selectedChunk}
          allChunks={currentMessageReferences}
          onCopySuccess={() => { /* 组件内部已处理 toast */ }}
        />
      </div>
    </div>
  )
}
