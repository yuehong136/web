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
  LayoutGrid,
  AlignCenter,
  Maximize2,
  SlidersHorizontal
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
import { ConfigProvider, theme } from 'antd'
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
import { conversationAPI } from '@/api/conversation'
import { useQuery } from '@tanstack/react-query'
import { chatConfig, type ChatMessage, type ChatServiceRequest, type SSEResponse, type ChatAttachment } from '@/config/chat'
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
  return <Sparkles className={`${sizeClass} text-purple-600`} />
}

// 对话分组逻辑
const getConversationGroup = (updateTime: number) => {
  const now = Date.now()
  const timestamp = updateTime > 1000000000000 ? updateTime : updateTime * 1000
  const diffTime = now - timestamp
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 3) return { key: 'recent', title: '最近3天', order: 1 }
  if (diffDays <= 7) return { key: 'week', title: '近7天', order: 2 }
  if (diffDays <= 30) return { key: 'month', title: '近30天', order: 3 }
  if (diffDays <= 365) return { key: 'year', title: '近1年', order: 4 }
    return { key: 'older', title: '更早', order: 5 }
}

// 转换对话数据为Conversations组件格式
const formatConversationsForAntD = (conversations: any[]) => {
  if (!conversations?.length) return []

  return conversations
    .map((conv: any, index: number) => {
    const updateTime = conv.update_time || Date.now()
    const timestamp = updateTime > 1000000000000 ? updateTime : updateTime * 1000
    const group = getConversationGroup(updateTime)
    
    return {
      key: conv.id,
      label: (
        <span style={{ color: 'var(--color-text-primary)' }}>
          {conv.name || `对话 ${index + 1}`}
        </span>
      ),
        timestamp,
      group: group.title
    }
  })
    .sort((a, b) => b.timestamp - a.timestamp)
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
  const [, setLoadingConversationDetail] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessageItem[]>([])
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
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

  // 获取选中应用的详情和设置
  const { 
    dialog: selectedAppDetail,
    settings: dialogSettings,
    loading: settingsLoading,
    saving: savingSettings,
    saveSettings,
  } = useChatSettings(selectedApp || undefined)

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
      const response = await conversationAPI.getConversationDetail(conversationId)
      setSelectedConversationDetail(response)
      
      if (response?.message) {
        setMessages(response.message.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          id: msg.id
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

  // 发送消息
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isStreaming) return

    const userMessage: ChatMessageItem = {
      role: 'user',
      content: message.trim(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setIsStreaming(true)

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
        // 构建请求参数，包含元数据过滤条件
        const completionParams: Parameters<typeof conversationAPI.completion>[0] = {
          conversation_id: selectedConversationDetail.id,
          messages: updatedMessages,
          quote: chatSettings.quote,
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
        setTimeout(() => fetchConversationDetail(newConversation.id), 500)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // 重命名对话
  const confirmRenameConversation = async () => {
    if (!renamingConversationId || !newConversationName.trim()) return

    try {
      await conversationAPI.setConversation({
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

  // 文件上传处理
  const handleFileUpload = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string)?.split(',')[1] || null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  const handleAddAttachment = async (file: File) => {
    const attachment: ChatAttachment = {
      uid: Date.now().toString(),
      name: file.name,
      status: 'uploading',
      type: file.type,
      size: file.size,
      originFileObj: file
    }

    setAttachments(prev => [...prev, attachment])

    try {
      if (file.type.startsWith('image/')) {
        const base64 = await handleFileUpload(file)
        if (base64) {
          setAttachments(prev => 
            prev.map(item => 
              item.uid === attachment.uid 
                ? { ...item, status: 'done' as const, thumbUrl: URL.createObjectURL(file), url: `data:${file.type};base64,${base64}` }
                : item
            )
          )
        }
      }
    } catch (error) {
      setAttachments(prev => 
        prev.map(item => item.uid === attachment.uid ? { ...item, status: 'error' as const } : item)
      )
    }
  }

  const handleRemoveAttachment = (attachment: ChatAttachment) => {
    setAttachments(prev => prev.filter(item => item.uid !== attachment.uid))
  }

  // 操作项 - 使用主题令牌颜色
  const actionItems = [
    { key: 'copy', label: '复制', icon: <Copy className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} /> },
    { key: 'regenerate', label: '重新生成', icon: <RotateCcw className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} /> },
    { key: 'like', label: '点赞', icon: <ThumbsUp className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} /> }
  ]

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
    
    return {
      key: `message-${index}`,
      role: msg.role,
      content: msg.content || '',
      placement: (msg.role === 'user' ? 'end' : 'start') as 'start' | 'end',
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
            <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
          
            {/* 如果没有内容且没有思考内容，显示加载提示 */}
            {!thinkContent && !mainContent && (
              <span className="italic" style={{ color: 'var(--color-text-muted)' }}>正在生成...</span>
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
        <div className="mt-2 flex justify-end">
          <Actions
            items={actionItems}
            variant="borderless"
            onClick={async ({ key }) => {
              if (key === 'copy') {
                  try {
                  await copyToClipboard(msg.content || '')
                    toast.success('已复制到剪贴板')
                  } catch {
                  toast.error('复制失败')
                }
              }
            }}
          />
        </div>
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

  // 对话列表菜单
  const conversationMenuConfig = (conversation: any) => ({
    items: [
      { label: '重命名', key: 'rename', icon: <Edit3 className="h-3 w-3" /> },
      { label: '删除', key: 'delete', icon: <Trash2 className="h-3 w-3" />, danger: true },
    ],
    onClick: (menuInfo: any) => {
      menuInfo.domEvent.stopPropagation()
      const conversationData = dialogConversations.find((conv: any) => conv.id === conversation.key)
      
      if (menuInfo.key === 'rename' && conversationData) {
        setRenamingConversationId(conversation.key)
        setNewConversationName(conversationData.name || 'New conversation')
      }
    },
  })

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
  }

  const handleTopicsClick = () => {
    setActiveTab('topics')
    setMode('chat')
    clearChat()
    setSelectedConversationDetail(null)
    setMessages([])
  }

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--color-chat-content-bg)' }}>
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
                    
                    <Button
                      onClick={handleCreateConversation}
                      className="w-full"
                      size="sm"
                      style={{
                        backgroundColor: 'var(--color-components-sidebar-item-bg-active)',
                        color: 'var(--color-components-sidebar-item-text-active)',
                        border: '1px solid var(--color-border-accent)'
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新建对话
                    </Button>
                  </div>

                  {/* 重命名输入框 */}
                  {renamingConversationId && (
                    <div 
                      className="px-4 py-2"
                      style={{ 
                        borderBottom: '1px solid var(--color-border-subtle)',
                        backgroundColor: 'var(--color-background-subtle)'
                      }}
                    >
                      <div className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>重命名对话</div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newConversationName}
                          onChange={(e) => setNewConversationName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmRenameConversation()
                            else if (e.key === 'Escape') {
                              setRenamingConversationId(null)
                              setNewConversationName('')
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm rounded focus:outline-none"
                          style={{
                            border: '1px solid var(--color-components-input-border)',
                            backgroundColor: 'var(--color-components-input-bg)',
                            color: 'var(--color-components-input-text)'
                          }}
                          autoFocus
                        />
                        <button
                          onClick={confirmRenameConversation}
                          className="px-2 py-1 text-xs rounded"
                          style={{
                            backgroundColor: 'var(--color-components-button-primary-bg)',
                            color: 'var(--color-components-button-primary-text)'
                          }}
                        >确认</button>
                        <button
                          onClick={() => { setRenamingConversationId(null); setNewConversationName('') }} 
                          className="px-2 py-1 text-xs rounded"
                          style={{
                            backgroundColor: 'var(--color-components-button-secondary-bg)',
                            color: 'var(--color-components-button-secondary-text)'
                          }}
                        >取消</button>
                      </div>
                    </div>
                  )}

                  {/* 对话列表 */}
                  <div className="flex-1 overflow-y-auto p-3">
                    {dialogConversationsLoading ? (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</div>
                    ) : dialogConversationsError ? (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-error)' }}>加载失败</div>
                    ) : dialogConversations.length === 0 ? (
                      <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无对话</div>
                    ) : (
                      <div className="explore-conversations">
                        <style>{`
                          /* 分组标题样式 */
                          .explore-conversations .ant-conversations-group-title {
                            color: var(--color-text-tertiary) !important;
                          }
                          /* hover 和 active 状态样式 */
                          .explore-conversations .ant-conversations-list .ant-conversations-item:hover {
                            background-color: var(--color-components-sidebar-item-bg-hover) !important;
                          }
                          .explore-conversations .ant-conversations-list .ant-conversations-item-active {
                            background-color: var(--color-components-sidebar-item-bg-active) !important;
                          }
                          /* 更多选项按钮样式 */
                          .explore-conversations .ant-conversations-item .anticon {
                            color: var(--color-text-secondary) !important;
                          }
                        `}</style>
                        <ConfigProvider
                          theme={{
                            algorithm: document.documentElement.classList.contains('dark') ? theme.darkAlgorithm : theme.defaultAlgorithm,
                            components: {
                              Conversations: {
                                colorText: 'var(--color-text-primary)',
                                colorTextSecondary: 'var(--color-text-secondary)',
                                colorTextTertiary: 'var(--color-text-tertiary)',
                              }
                            }
                          }}
                        >
                          <Conversations
                            defaultActiveKey={formatConversationsForAntD(dialogConversations)[0]?.key}
                            items={formatConversationsForAntD(dialogConversations)}
                            menu={conversationMenuConfig}
                            groupable
                            onActiveChange={(key) => key ? fetchConversationDetail(key) : setSelectedConversationDetail(null)}
                            styles={{
                              item: {
                                label: {
                                  color: 'var(--color-text-primary)',
                                }
                              }
                            }}
                          />
                        </ConfigProvider>
                      </div>
                    )}
                  </div>
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
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
                      .explore-welcome-area .ant-welcome-title {
                        color: var(--color-text-primary) !important;
                      }
                      .explore-welcome-area .ant-welcome-description {
                        color: var(--color-text-secondary) !important;
                      }
                      .explore-welcome-area .ant-prompts-item {
                        background-color: var(--color-components-card-bg) !important;
                        border-color: var(--color-components-card-border) !important;
                      }
                      .explore-welcome-area .ant-prompts-item:hover {
                        border-color: var(--color-border-accent) !important;
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
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
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
                    `}</style>
                    <Bubble.List
                      items={bubbleItems as any}
                      autoScroll
                      style={{ height: '100%' }}
                    />
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              {(activeTab !== 'topics' || selectedConversationDetail) && (
                <div className="px-6 pb-6">
                  <div className={cn(
                    "mx-auto",
                    chatLayout === 'full' ? 'max-w-none px-4' : chatLayout === 'center' ? 'max-w-4xl' : 'max-w-3xl'
                  )}>
                    {attachments.length > 0 && (
                      <div className="mb-4">
                        <Attachments
                          items={attachments as any}
                          onRemove={(file) => handleRemoveAttachment(file as ChatAttachment)}
                        />
                      </div>
                    )}
                    
                        <Sender
                          value={inputValue}
                      onChange={setInputValue}
                      placeholder="输入消息，按 Enter 发送"
                          onSubmit={(message) => {
                            if (message) {
                          handleSendMessage(message)
                              setInputValue('')
                              setAttachments([])
                            }
                          }}
                      onPasteFile={(files) => {
                            for (let i = 0; i < files.length; i++) {
                          if (files[i].type.startsWith('image/')) {
                            handleAddAttachment(files[i])
                          }
                        }
                      }}
                      loading={isStreaming}
                      style={{
                              borderRadius: '16px',
                        border: '1px solid var(--color-components-input-border)',
                        backgroundColor: 'var(--color-components-input-bg)',
                      }}
                      styles={{
                        input: {
                          color: 'var(--color-components-input-text)',
                        },
                      }}
                    />
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
