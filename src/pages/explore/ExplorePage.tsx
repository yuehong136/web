import React from 'react'
import {
  MessageSquare,
  Code,
  FileText,
  BarChart3,
  Search,
  Settings,
  Users,
  Plus,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Copy,
  RotateCcw,
  ThumbsUp,
  Edit3,
  Trash2
} from 'lucide-react'
import { 
  Conversations, 
  Bubble, 
  Sender, 
  Suggestion,
  Actions,
  Attachments,
  useXAgent,
  useXChat,
  XStream
} from '@ant-design/x'
import type { BubbleProps } from '@ant-design/x'
import markdownit from 'markdown-it'
import { Button } from '@/components/ui/button'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useChatStore } from '@/stores/chat'
import { useUIStore } from '@/stores/ui'
import { useModelStore } from '@/stores/model'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import { conversationAPI } from '@/api/conversation'
import { useQuery } from '@tanstack/react-query'
import { chatConfig, type ChatMessage, type ChatServiceRequest, type SSEResponse, type ChatAttachment } from '@/config/chat'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { getProviderIcon, getModelDisplayName } from '@/components/ui/provider-icon'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import thinkingAnimation from '@/assets/thinking.apng'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { extractReferencesFromSSEData, type ReferenceChunk } from '@/utils/reference-replacer'
import { ReferenceList } from '@/components/ui/reference-marker'

// 初始化 markdown-it
const md = markdownit({ html: true, breaks: true, linkify: true })

// Markdown 渲染函数
const renderMarkdown: BubbleProps['messageRender'] = (content) => {
  if (!content || typeof content !== 'string') return content
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: md.render(content) }} 
      className="prose prose-sm max-w-none"
    />
  )
}

// 获取应用图标的函数（与StudioPage保持一致）
const getAppIcon = (app: any, size: 'sm' | 'md' = 'sm') => {
  const sizeClass = size === 'md' ? 'h-6 w-6' : 'h-4 w-4'
  
  if (app.icon) {
    // 判断是data URL、http(s) URL还是base64字符串
    const iconSrc = app.icon.startsWith('data:') || app.icon.startsWith('http') 
      ? app.icon 
      : `data:image/png;base64,${app.icon}`
    return (
      <img 
        src={iconSrc} 
        alt={app.name}
        className={`${sizeClass} rounded object-cover`}
        onError={(e) => {
          // 如果图片加载失败，显示默认图标
          const target = e.currentTarget as HTMLImageElement
          target.style.display = 'none'
          const nextElement = target.nextElementSibling as HTMLElement
          if (nextElement) {
            nextElement.classList.remove('hidden')
          }
        }}
      />
    )
  }
  // 与工作室页面保持一致，使用Sparkles图标和紫色
  return <Sparkles className={`${sizeClass} text-purple-600`} />
}

// 对话分组逻辑
const getConversationGroup = (updateTime: number) => {
  const now = Date.now()
  // updateTime 可能是秒级或毫秒级，自动判断
  const timestamp = updateTime > 1000000000000 ? updateTime : updateTime * 1000
  const diffTime = now - timestamp
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 3) {
    return { key: 'recent', title: '最近3天', order: 1 }
  } else if (diffDays <= 7) {
    return { key: 'week', title: '近7天', order: 2 }
  } else if (diffDays <= 30) {
    return { key: 'month', title: '近30天', order: 3 }
  } else if (diffDays <= 365) {
    return { key: 'year', title: '近1年', order: 4 }
  } else {
    return { key: 'older', title: '更早', order: 5 }
  }
}

// 转换对话数据为Conversations组件格式
const formatConversationsForAntD = (conversations: any[]) => {
  if (!conversations || conversations.length === 0) {
    return []
  }

  const items = conversations.map((conv: any, index: number) => {
    const updateTime = conv.update_time || Date.now()
    // 自动判断时间戳格式并统一为毫秒级
    const timestamp = updateTime > 1000000000000 ? updateTime : updateTime * 1000
    const group = getConversationGroup(updateTime)
    
    return {
      key: conv.id,
      label: conv.name || `对话 ${index + 1}`,
      timestamp: timestamp,
      group: group.title
    }
  })
  
  // 按时间戳排序，最新的在前
  items.sort((a, b) => b.timestamp - a.timestamp)
  
  return items
}


export const ExplorePage: React.FC = () => {
  const {
    conversations,
    currentConversation,
    isStreaming,
    isLoading,
    createConversation,
    selectConversation,
    clearChat,
  } = useChatStore()

  const { isMobile } = useUIStore()
  const { 
    myLLMs, 
    isLoading: modelsLoading, 
    loadMyLLMs 
  } = useModelStore()
  
  // 获取对话应用列表
  const { 
    data: dialogApps = [], 
    isLoading: dialogAppsLoading,
    error: dialogAppsError 
  } = useDialogApps()

  // 左侧边栏状态
  const [activeTab, setActiveTab] = React.useState<'workspace' | 'topics' | 'settings'>('workspace')
  const [selectedApp, setSelectedApp] = React.useState<string>('')
  const [mode, setMode] = React.useState<'chat' | 'market'>('chat')
  
  // 选中的对话详情状态
  const [selectedConversationDetail, setSelectedConversationDetail] = React.useState<any>(null)
  const [loadingConversationDetail, setLoadingConversationDetail] = React.useState(false)
  
  // 话题模式下的消息状态
  const [topicMessages, setTopicMessages] = React.useState<Array<{role: string, content: string, id?: string, references?: ReferenceChunk[]}>>([])
  const [isTopicStreaming, setIsTopicStreaming] = React.useState(false)
  
  // 重命名状态
  const [renamingConversationId, setRenamingConversationId] = React.useState<string | null>(null)
  const [newConversationName, setNewConversationName] = React.useState('')

  // 获取选中应用的对话列表
  const { 
    data: dialogConversationsData, 
    isLoading: dialogConversationsLoading,
    error: dialogConversationsError,
    refetch: refetchConversations
  } = useQuery({
    queryKey: ['dialogConversations', selectedApp],
    queryFn: async () => {
      console.log('Fetching conversations for dialog_id:', selectedApp)
      const result = await conversationAPI.getConversationsByDialog(selectedApp)
      console.log('Conversations API result:', result)
      return result
    },
    enabled: !!selectedApp && activeTab === 'topics',
    retry: 1, // 只重试一次
  })

  const dialogConversations = dialogConversationsData || []
  
  
  
  // 聊天相关状态
  const [inputValue, setInputValue] = React.useState('')
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null)

  // 消息thinking状态管理
  const [messageThinkingStates, setMessageThinkingStates] = React.useState<Record<string, {
    isThinking: boolean
    thinkingComplete: boolean
    thinkingExpanded: boolean
    thinkingContent: string
  }>>({})
  
  const [currentMessageId, setCurrentMessageId] = React.useState<string | null>(null)

  // 加载模型列表
  React.useEffect(() => {
    loadMyLLMs()
  }, [])

  // 自动选择第一个可用的聊天模型
  React.useEffect(() => {
    if (!selectedModel && !modelsLoading && myLLMs && Object.keys(myLLMs).length > 0) {
      for (const [, provider] of Object.entries(myLLMs)) {
        if (provider && provider.llm && Array.isArray(provider.llm)) {
          const chatModel = provider.llm.find(model => 
            model && model.type === 'chat' && model.name
          )
          if (chatModel) {
            setSelectedModel(chatModel.name)
            break
          }
        }
      }
    }
  }, [selectedModel, modelsLoading, myLLMs])

  // 自动选择第一个应用（只选择status为'1'的应用）
  React.useEffect(() => {
    if (!selectedApp && dialogApps.length > 0 && !dialogAppsLoading) {
      const activeApp = dialogApps.find(app => app.status === '1')
      if (activeApp) {
        setSelectedApp(activeApp.id)
      }
    }
  }, [selectedApp, dialogApps, dialogAppsLoading])

  // 配置 X Agent 对接后端 SSE 接口 (复用ChatPage的逻辑)
  const [agent] = useXAgent({
    request: async (info, callbacks) => {
      const { message, messages = [] } = info
      const { onUpdate, onSuccess, onError } = callbacks

      try {
        const historyMessages: ChatMessage[] = Array.isArray(messages) 
          ? messages.map((msg, index) => {
              const role: 'user' | 'assistant' = index % 2 === 0 ? 'user' : 'assistant'
              
              if (typeof msg === 'string') {
                return { role, content: msg }
              }
              return {
                role,
                content: typeof msg === 'string' ? msg : String((msg as any)?.content || '')
              }
            })
          : []

        const imageAttachment = attachments.find(att => 
          att.status === 'done' && 
          att.type?.startsWith('image/') && 
          att.url?.includes('base64')
        )
        const imageBase64 = imageAttachment?.url?.split(',')[1]

        const getAvailableChatModel = () => {
          if (selectedModel) return selectedModel
          
          if (myLLMs && typeof myLLMs === 'object') {
            for (const [, provider] of Object.entries(myLLMs)) {
              if (provider && provider.llm && Array.isArray(provider.llm)) {
                const chatModel = provider.llm.find(model => 
                  model && model.type === 'chat' && model.name
                )
                if (chatModel) {
                  return chatModel.name
                }
              }
            }
          }
          
          throw new Error('No chat models available. Please configure a chat model first.')
        }

        const modelToUse = getAvailableChatModel()

        const currentUserMessage = {
          role: 'user' as const,
          content: typeof message === 'string' ? message : String(message)
        }
        
        const lastMessage = historyMessages[historyMessages.length - 1]
        const shouldAddCurrentMessage = !lastMessage || 
          lastMessage.role !== 'user' || 
          lastMessage.content !== currentUserMessage.content
        
        const requestBody: ChatServiceRequest = {
          prompt: '',
          messages: shouldAddCurrentMessage 
            ? [...historyMessages, currentUserMessage]
            : historyMessages,
          llm_name: modelToUse,
          stream: true,
          gen_conf: {},
          tavily_api_key: '',
          image: imageBase64
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

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        let fullContent = ''

        for await (const chunk of XStream({
          readableStream: response.body
        })) {
          try {
            const chunkData = (chunk as any)?.data
            if (chunkData) {
              const cleanChunkData = chunkData.replace(/^-+\\?$/gm, '').trim()
              if (!cleanChunkData) continue
              
              const data: SSEResponse = JSON.parse(cleanChunkData)
              
              if (data.retcode === 0 && typeof data.data === 'string') {
                const cleanContent = data.data.replace(/^-+\\?$/gm, '').trim()
                if (cleanContent) {
                  fullContent = cleanContent
                  
                  if (!currentMessageId) {
                    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    setCurrentMessageId(messageId)
                  }
                  
                  const messageId = currentMessageId || `msg-${Date.now()}`
                  
                  if (fullContent.includes('<thinking>')) {
                    const thinkingMatch = fullContent.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/g)
                    if (thinkingMatch) {
                      const thinkingText = thinkingMatch[0]
                        .replace(/<\/?thinking>/g, '')
                        .trim()
                      
                      const isComplete = fullContent.includes('</thinking>')
                      
                      setMessageThinkingStates(prev => {
                        const newState = {
                          ...prev,
                          [messageId]: {
                            isThinking: true,
                            thinkingComplete: isComplete,
                            thinkingExpanded: prev[messageId]?.thinkingExpanded || false,
                            thinkingContent: thinkingText
                          }
                        }

                        return newState
                      })
                    }
                  }
                  
                  const contentWithoutThinking = fullContent
                    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                    .trim()
                  
                  onUpdate?.(contentWithoutThinking as any)
                }
              } else if (data.data === true) {
                const finalContent = fullContent
                  .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                  .trim()
                
                if (currentMessageId && messageThinkingStates[currentMessageId]?.isThinking) {
                  setTimeout(() => {
                    setMessageThinkingStates(prev => {
                      const newState = { ...prev }
                      delete newState[currentMessageId]
                      return newState
                    })
                  }, 8000)
                }
                
                onSuccess?.(finalContent as any)
                break
              } else if (data.retcode !== 0) {
                throw new Error(data.retmsg || 'Unknown error')
              }
            }
          } catch (parseError) {
            console.error('Parse error:', parseError, 'Chunk data:', (chunk as any)?.data)
          }
        }
      } catch (error) {
        console.error('Chat request error:', error)
        onError?.(error as Error)
      }
    },
  })

  const { onRequest, messages: xMessages } = useXChat({ 
    agent
  })

  // 处理发现按钮点击
  const handleDiscoverClick = () => {
    setMode('market')
    setSelectedApp('')
  }

  // 处理应用选择
  const handleAppSelect = (appId: string) => {
    setMode('chat')
    setSelectedApp(appId)
    setActiveTab('workspace')
    // 这里可以加载对应应用的历史对话记录
  }

  // 处理话题按钮点击
  const handleTopicsClick = () => {
    setActiveTab('topics')
    setMode('chat')
    // 清除当前对话状态，让话题模式显示应用信息
    clearChat()
    // 清除选中的对话详情
    setSelectedConversationDetail(null)
    setTopicMessages([])
    setIsTopicStreaming(false)
    // 不清空selectedApp，保持当前选中的应用
  }

  // 获取对话详情
  const fetchConversationDetail = async (conversationId: string) => {
    if (!conversationId) return
    
    try {
      setLoadingConversationDetail(true)
      const response = await conversationAPI.getConversationDetail(conversationId)
      setSelectedConversationDetail(response)
      
      // 更新话题消息状态
      if (response?.message) {
        setTopicMessages(response.message.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          id: msg.id
        })))
      }
    } catch (error) {
      console.error('Failed to fetch conversation detail:', error)
      setSelectedConversationDetail(null)
      setTopicMessages([])
    } finally {
      setLoadingConversationDetail(false)
    }
  }

  // 话题模式下发送消息
  const handleTopicMessageSend = async (message: string) => {
    if (!message.trim() || !selectedConversationDetail?.id || isTopicStreaming) return

    const userMessage = {
      role: 'user',
      content: message.trim(),
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    // 添加用户消息到列表
    const updatedMessages = [...topicMessages, userMessage]
    setTopicMessages(updatedMessages)

    try {
      setIsTopicStreaming(true)
      
      // 调用completion接口
      const response = await conversationAPI.completion({
        conversation_id: selectedConversationDetail.id,
        messages: updatedMessages
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // 创建AI回复消息
      let aiMessage = {
        role: 'assistant',
        content: '',
        id: `msg-${Date.now()}-ai-${Math.random().toString(36).substr(2, 9)}`,
        references: [] as ReferenceChunk[]
      }

      // 处理流式响应
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
              if (jsonStr === 'true') {
                // 流结束
                break
              }
              
              const data = JSON.parse(jsonStr)
              if (data.retcode === 0 && data.data && typeof data.data.answer === 'string') {
                aiMessage.content = data.data.answer
                aiMessage.id = data.data.id || aiMessage.id
                
                // 提取引用数据
                const references = extractReferencesFromSSEData(data.data)
                if (references.length > 0) {
                  aiMessage.references = references
                }
                
                // 实时更新消息列表
                setTopicMessages(prev => {
                  const newMessages = [...prev]
                  const lastIndex = newMessages.length - 1
                  if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
                    newMessages[lastIndex] = aiMessage
                  } else {
                    newMessages.push(aiMessage)
                  }
                  return newMessages
                })
              }
            } catch (parseError) {
              console.error('Parse error:', parseError)
            }
          }
        }
      }

      // 确保AI消息被添加到列表中
      setTopicMessages(prev => {
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role !== 'assistant') {
          return [...prev, aiMessage]
        }
        return prev
      })

    } catch (error) {
      console.error('Failed to send message:', error)
      // 发送失败时，可以选择移除用户消息或显示错误
    } finally {
      setIsTopicStreaming(false)
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
      
      console.log('Created new conversation:', newConversation)
      
      // 刷新对话列表
      refetchConversations()
      
      // 自动选择新建的对话
      if (newConversation?.id) {
        setTimeout(() => {
          fetchConversationDetail(newConversation.id)
        }, 500)
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  // 开始重命名对话
  const startRenameConversation = (conversationId: string, currentName: string) => {
    setRenamingConversationId(conversationId)
    setNewConversationName(currentName)
  }

  // 确认重命名对话
  const confirmRenameConversation = async () => {
    if (!renamingConversationId || !newConversationName.trim()) return

    try {
      await conversationAPI.setConversation({
        conversation_id: renamingConversationId,
        name: newConversationName.trim(),
        is_new: false
      })
      
      // 刷新对话列表
      refetchConversations()
      
      // 如果当前选中的就是这个对话，更新详情
      if (selectedConversationDetail?.id === renamingConversationId) {
        setSelectedConversationDetail((prev: any) => ({
          ...prev,
          name: newConversationName.trim()
        }))
      }
      
      // 重置重命名状态
      setRenamingConversationId(null)
      setNewConversationName('')
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  // 取消重命名
  const cancelRenameConversation = () => {
    setRenamingConversationId(null)
    setNewConversationName('')
  }

  // 处理应用添加到工作区（暂时只是UI状态，实际需要调用API更新status）
  const handleAddToWorkspace = (appId: string) => {
    // TODO: 调用API更新应用的status状态
    console.log('Add to workspace:', appId)
  }

  // 文件上传处理
  const handleFileUpload = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
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
          const updatedAttachment = {
            ...attachment,
            status: 'done' as const,
            thumbUrl: URL.createObjectURL(file),
            url: `data:${file.type};base64,${base64}`
          }
          
          setAttachments(prev => 
            prev.map(item => 
              item.uid === attachment.uid ? updatedAttachment : item
            )
          )
        } else {
          throw new Error('Failed to convert image to base64')
        }
      } else {
        const updatedAttachment = {
          ...attachment,
          status: 'done' as const,
          url: URL.createObjectURL(file)
        }
        
        setAttachments(prev => 
          prev.map(item => 
            item.uid === attachment.uid ? updatedAttachment : item
          )
        )
      }
    } catch (error) {
      console.error('File upload error:', error)
      const updatedAttachment = {
        ...attachment,
        status: 'error' as const,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
      
      setAttachments(prev => 
        prev.map(item => 
          item.uid === attachment.uid ? updatedAttachment : item
        )
      )
    }
  }

  const handleRemoveAttachment = (attachment: ChatAttachment) => {
    setAttachments(prev => prev.filter(item => item.uid !== attachment.uid))
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url)
    }
    if (attachment.thumbUrl && attachment.thumbUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.thumbUrl)
    }
  }

  // 操作按钮
  const actionItems = [
    {
      key: 'copy',
      label: '复制',
      icon: <Copy className="h-3 w-3" />
    },
    {
      key: 'regenerate',
      label: '重新生成',
      icon: <RotateCcw className="h-3 w-3" />
    },
    {
      key: 'like',
      label: '点赞',
      icon: <ThumbsUp className="h-3 w-3" />
    }
  ]

  // 创建对话列表菜单配置
  const conversationMenuConfig = (conversation: any) => ({
    items: [
      {
        label: '重命名',
        key: 'rename',
        icon: <Edit3 className="h-3 w-3" />,
      },
      {
        label: '删除',
        key: 'delete',
        icon: <Trash2 className="h-3 w-3" />,
        danger: true,
      },
    ],
    onClick: (menuInfo: any) => {
      menuInfo.domEvent.stopPropagation()
      const conversationData = dialogConversations.find((conv: any) => conv.id === conversation.key)
      
      switch (menuInfo.key) {
        case 'rename':
          if (conversationData) {
            startRenameConversation(conversation.key, conversationData.name || 'New conversation')
          }
          break
        case 'delete':
          console.log('Delete conversation:', conversation.key)
          // TODO: 实现删除功能
          break
      }
    },
  })

  // 转换消息数据为 Bubble.List 需要的格式
  const bubbleItems = xMessages.map((msg, index) => {
    const isUser = index % 2 === 0
    const rawContent = typeof msg === 'string' ? msg : 
      (typeof (msg as any)?.message === 'string' ? (msg as any).message :
       typeof (msg as any)?.content === 'string' ? (msg as any).content :
       typeof msg === 'object' && msg ? JSON.stringify(msg) : String(msg))
    
    const contentWithoutThinking = rawContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim()
    const content = contentWithoutThinking.replace(/^-+\\?$/gm, '').replace(/^-{6,}\\?/gm, '').trim()
    
    const messageTime = (msg as any)?.timestamp || Date.now()
    const messageId = (msg as any)?.id || `msg-${index}-${messageTime}`
    const messageThinking = messageThinkingStates[messageId]
    
    return {
      key: `message-${index}`,
      role: isUser ? 'user' : 'assistant',
      header: !isUser ? (
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
          <span>{getModelDisplayName(selectedModel)}</span>
          <span>·</span>
          <span>{new Date(messageTime).toLocaleTimeString()}</span>
        </div>
      ) : undefined,
      content: (
        <div className="space-y-3">
          {!isUser && messageThinking?.isThinking && (
            <div className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm overflow-hidden">
              <div className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 flex items-center justify-center">
                    {!messageThinking.thinkingComplete ? (
                      <img 
                        src={thinkingAnimation} 
                        alt="思考中" 
                        className="w-5 h-5"
                      />
                    ) : (
                      getProviderIcon(selectedModel)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-700">
                        {messageThinking.thinkingComplete ? "🎯 已完成思考" : "🤔 AI正在思考..."}
                      </span>
                      {messageThinking.thinkingContent && (
                        <button 
                          onClick={() => {
                            setMessageThinkingStates(prev => ({
                              ...prev,
                              [messageId]: {
                                ...prev[messageId],
                                thinkingExpanded: !prev[messageId]?.thinkingExpanded
                              }
                            }))
                          }}
                          className={`text-gray-400 hover:text-gray-600 transition-transform duration-200 ${messageThinking.thinkingExpanded ? 'rotate-180' : 'rotate-0'}`}
                        >
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {messageThinking.thinkingExpanded && messageThinking.thinkingContent && (
                <div className="px-3 pb-3">
                  <div className="border-t border-gray-200 pt-2">
                    <div className="text-xs text-blue-600 font-medium mb-2">💭 思考过程：</div>
                    <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                      {messageThinking.thinkingContent}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="bubble-content leading-relaxed">
            {content && content.trim() ? (
              renderMarkdown(content)
            ) : (
              <div className="text-gray-400 italic">正在生成回复...</div>
            )}
          </div>
        </div>
      ),
      placement: (isUser ? 'end' : 'start') as 'start' | 'end',
      avatar: isUser
        ? { 
            className: 'bg-blue-600 border-none shadow-none rounded-full', 
            children: 'U' 
          }
        : { 
            icon: getProviderIcon(selectedModel),
            className: 'bg-slate-50 border-none shadow-none rounded-full'
          },
      footer: !isUser ? (
        <div className="mt-2 flex justify-end">
          <Actions
            items={actionItems}
            variant="borderless"
            onClick={async ({ key }) => {
              switch (key) {
                case 'copy':
                  try {
                    await copyToClipboard((content || rawContent) || '')
                    toast.success('已复制到剪贴板')
                  } catch {
                    toast.error('复制失败，请手动复制')
                  }
                  break
                case 'regenerate':
                  console.log('Regenerate message:', index)
                  break
                case 'like':
                  console.log('Like message:', index)
                  break
              }
            }}
          />
        </div>
      ) : undefined,
      variant: 'borderless' as const,
      shape: 'round' as const,
      classNames: {
        header: 'text-gray-500',
        avatar: 'shadow-none border-none',
        footer: 'mt-2',
        content: 'prose-container'
      },
      styles: {
        content: {
          backgroundColor: isUser ? '#3b82f6' : '#f8fafc',
          color: isUser ? '#ffffff' : '#1f2937',
          border: 'none',
          boxShadow: 'none',
          borderRadius: '16px',
          padding: '12px 16px',
          fontSize: '16px',
          lineHeight: '1.6'
        }
      },
      loading: false,
      typing: false,
      messageRender: !isUser ? renderMarkdown : undefined,
    }
  })

  // 智能建议数据
  const suggestionItems = [
    { label: '解释这个概念', value: '解释这个概念', icon: <HelpCircle className="h-3 w-3" /> },
    { label: '写一段代码', value: '写一段代码', icon: <Sparkles className="h-3 w-3" /> },
    { label: '总结要点', value: '总结要点', icon: <Lightbulb className="h-3 w-3" /> },
    { label: '翻译文本', value: '翻译文本', icon: <MessageSquare className="h-3 w-3" /> },
    { label: '优化内容', value: '优化内容', icon: <Sparkles className="h-3 w-3" /> },
    { label: '分析数据', value: '分析数据', icon: <HelpCircle className="h-3 w-3" /> }
  ]

  return (
    <div className="h-full flex bg-background">
      {/* 左侧边栏 */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* 顶部导航区域 */}
        <div className="p-4 border-b border-border">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('workspace')}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
                activeTab === 'workspace'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              工作区
            </button>
            <button
              onClick={handleTopicsClick}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors relative",
                activeTab === 'topics'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              disabled={!selectedApp}
              title={!selectedApp ? "请先在工作区选择一个应用" : "查看应用对话历史"}
            >
              话题
              {!selectedApp && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-muted rounded-full"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors",
                activeTab === 'settings'
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              设置
            </button>
          </div>
        </div>

        {/* 应用管理区域 */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'workspace' ? (
            <>
              {/* 发现按钮 */}
              <div className="p-4">
                <button
                  onClick={handleDiscoverClick}
                  className={cn(
                    "w-full py-3 px-4 text-left text-sm font-medium rounded-lg transition-colors flex items-center space-x-2",
                    mode === 'market'
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <Search className="h-4 w-4" />
                  <span>发现</span>
                </button>
              </div>

              <div className="border-t border-gray-100 mx-4"></div>

              {/* 应用列表 */}
              <div className="flex-1 p-4 space-y-1">
                {dialogAppsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">加载应用中...</div>
                  </div>
                ) : dialogAppsError ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-destructive">加载应用失败</div>
                  </div>
                ) : dialogApps.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-sm text-muted-foreground">暂无应用</div>
                  </div>
                ) : (
                  dialogApps
                    .filter(app => app.status === '1') // 只显示status为'1'的应用
                    .map((app) => {
                      return (
                        <button
                          key={app.id}
                          onClick={() => handleAppSelect(app.id)}
                          className={cn(
                            "w-full py-3 px-4 text-left text-sm rounded-lg transition-colors flex items-center space-x-3",
                            selectedApp === app.id && mode === 'chat' && activeTab === 'workspace'
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center justify-center w-4 h-4">
                            {getAppIcon(app)}
                            <Sparkles className="h-4 w-4 text-purple-600 hidden" />
                          </div>
                          <span>{app.name}</span>
                        </button>
                      )
                    })
                )}
              </div>
            </>
          ) : activeTab === 'topics' ? (
            // 话题模式 - 显示对话历史管理
            <div className="flex-1 flex flex-col">
              {!selectedApp ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">请先在工作区选择一个应用</p>
                    <p className="text-gray-400 text-xs mt-2">选择应用后可查看该应用的对话历史</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 应用信息和新建对话按钮 */}
                  <div className="p-4 border-b border-gray-100">
                    {/* 当前应用信息 */}
                    <div className="flex items-center mb-3 p-2 bg-muted rounded-lg">
                      <div className="flex items-center justify-center w-6 h-6 mr-3">
                        {getAppIcon(dialogApps.find(app => app.id === selectedApp), 'md')}
                        <Sparkles className="h-6 w-6 text-purple-600 hidden" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {dialogApps.find(app => app.id === selectedApp)?.name || '应用'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dialogApps.find(app => app.id === selectedApp)?.description || '查看对话历史'}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleCreateConversation}
                      className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新建对话
                    </Button>
                  </div>

                  {/* 重命名输入框 */}
                  {renamingConversationId && (
                    <div className="px-4 py-2 border-b border-gray-100 bg-yellow-50">
                      <div className="text-xs text-gray-600 mb-2">重命名对话</div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newConversationName}
                          onChange={(e) => setNewConversationName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              confirmRenameConversation()
                            } else if (e.key === 'Escape') {
                              cancelRenameConversation()
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={confirmRenameConversation}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          确认
                        </button>
                        <button
                          onClick={cancelRenameConversation}
                          className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 对话历史列表 */}
                  <div className="flex-1 overflow-auto">
                    {dialogConversationsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-gray-500">加载对话中...</div>
                      </div>
                    ) : dialogConversationsError ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="text-sm text-red-500 mb-2">加载对话失败</div>
                          <div className="text-xs text-gray-500">
                            {dialogConversationsError instanceof Error 
                              ? dialogConversationsError.message 
                              : '请检查网络连接或稍后重试'
                            }
                          </div>
                        </div>
                      </div>
                    ) : dialogConversations.length === 0 ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-sm text-gray-500">暂无对话</div>
                      </div>
                    ) : (
                      <div className="p-3">
                        <Conversations
                          defaultActiveKey={formatConversationsForAntD(dialogConversations)[0]?.key}
                          items={formatConversationsForAntD(dialogConversations)}
                          menu={conversationMenuConfig}
                          groupable={{
                            sort: (a: string, b: string) => {
                              const orderMap: Record<string, number> = { 
                                '最近3天': 1, 
                                '近7天': 2, 
                                '近30天': 3, 
                                '近1年': 4, 
                                '更早': 5 
                              }
                              return (orderMap[a] || 999) - (orderMap[b] || 999)
                            },
                            title: (group, { components: { GroupTitle } }) => 
                              group ? (
                                <GroupTitle>
                                  <div className="flex items-center space-x-2">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{group}</span>
                                  </div>
                                </GroupTitle>
                              ) : (
                                <GroupTitle />
                              )
                          }}
                          onActiveChange={(key) => {
                            if (key) {
                              fetchConversationDetail(key)
                            } else {
                              setSelectedConversationDetail(null)
                            }
                          }}
                          className="w-full bg-white rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            // 设置模式
            <div className="flex-1 p-4">
              <p className="text-gray-600 text-sm">设置功能开发中...</p>
            </div>
          )}
        </div>
      </div>

      {/* 右侧主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center space-x-3">
            <h1 className="text-lg font-semibold text-foreground">
              {mode === 'market' 
                ? '应用市场' 
                : activeTab === 'topics' 
                  ? (selectedConversationDetail?.name || dialogApps.find(app => app.id === selectedApp)?.name || '话题对话')
                  : dialogApps.find(app => app.id === selectedApp)?.name || '智能助手'
              }
            </h1>
          </div>
          
          {/* 模型选择器 - 只在聊天模式显示 */}
          {mode === 'chat' && (
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <ErrorBoundary
                  fallback={(error, retry) => (
                    <div className="text-xs text-destructive p-2 bg-destructive/20 rounded border border-destructive">
                      模型选择器加载失败
                      <button onClick={retry} className="ml-2 underline">重试</button>
                    </div>
                  )}
                >
                  <ChatModelSelector
                    models={myLLMs || {}}
                    selectedModelName={selectedModel}
                    onSelect={setSelectedModel}
                    loading={modelsLoading || !myLLMs}
                    modelTypes={['chat', 'image2text']}
                  />
                </ErrorBoundary>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* 主内容区域 */}
        <div className="flex-1 flex flex-col">
          {mode === 'market' ? (
            // 应用市场模式 - 显示所有应用
            <div className="flex-1 p-6">
              {dialogAppsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-sm text-gray-500">加载应用中...</div>
                </div>
              ) : dialogAppsError ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-sm text-red-500">加载应用失败</div>
                </div>
              ) : dialogApps.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-sm text-gray-500">暂无应用</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dialogApps.map((app) => {
                    const isInWorkspace = app.status === '1'
                    return (
                      <div
                        key={app.id}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {getAppIcon(app, 'md')}
                            <Sparkles className="h-6 w-6 text-purple-600 hidden" />
                          </div>
                          <h3 className="font-medium text-gray-900">{app.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{app.description}</p>
                        <Button 
                          size="sm" 
                          className="w-full"
                          variant={isInWorkspace ? "outline" : "default"}
                          onClick={() => handleAddToWorkspace(app.id)}
                          disabled={isInWorkspace}
                        >
                          {isInWorkspace ? (
                            <>已添加</>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              添加到工作区
                            </>
                          )}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            // 聊天模式
            <>
              {/* 消息展示区域 */}
              <div className="flex-1 overflow-auto px-6 py-8">
                {activeTab === 'topics' && selectedConversationDetail ? (
                  // 话题模式下，显示选中对话的消息列表
                  <div className="space-y-6">
                    {loadingConversationDetail ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-500">加载对话中...</p>
                        </div>
                      </div>
                    ) : topicMessages.length > 0 ? (
                      <div className="space-y-6">
                        {topicMessages.map((msg: any, index: number) => (
                          <div
                            key={msg.id || index}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="flex items-start space-x-3 max-w-4xl">
                              {/* 头像 */}
                              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                msg.role === 'user' 
                                  ? 'bg-blue-600 text-white order-2' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {msg.role === 'user' ? 'U' : 'AI'}
                              </div>
                              
                              {/* 消息内容 */}
                              <div className={`flex-1 ${msg.role === 'user' ? 'order-1' : ''}`}>
                                {/* 消息头部 */}
                                <div className={`flex items-center space-x-2 mb-1 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                  <span className="text-sm font-medium text-gray-900">
                                    {msg.role === 'user' ? '用户' : 'AI助手'}
                                  </span>
                                  {msg.created_at && (
                                    <span className="text-xs text-gray-500">
                                      {new Date(msg.created_at * 1000).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                                
                                {/* 消息正文 */}
                                <div
                                  className={`px-4 py-3 rounded-lg ${
                                    msg.role === 'user'
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-50 text-gray-900'
                                  }`}
                                >
                                  {msg.role === 'assistant' ? (
                                    <div>
                                      <MarkdownRenderer
                                        content={msg.content}
                                        references={msg.references}
                                        className="prose-sm max-w-none prose-p:my-2 prose-pre:bg-gray-100 prose-pre:text-gray-900"
                                        onReferenceClick={(referenceId) => {
                                          console.log('Reference clicked:', referenceId)
                                          // 这里可以添加引用详情的显示逻辑
                                        }}
                                      />
                                      {/* 参考资料展示 */}
                                      {msg.references && msg.references.length > 0 && (
                                        <div className="mt-3">
                                          <ReferenceList
                                            references={msg.references.map((ref: any, index: number) => ({
                                              id: ref.id,
                                              displayNumber: index + 1,
                                              documentName: ref.document_name,
                                              content: ref.content,
                                              similarity: ref.similarity,
                                              url: ref.url || undefined
                                            }))}
                                            className="text-sm"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        该对话暂无消息
                      </div>
                    )}
                  </div>
                ) : activeTab === 'topics' && !currentConversation && selectedApp ? (
                  // 话题模式下，未选择对话时显示应用信息
                  <div className="flex-1 flex items-center justify-center">
                    <div className="max-w-md w-full text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="flex items-center justify-center w-12 h-12">
                          {getAppIcon(dialogApps.find(app => app.id === selectedApp), 'md')}
                          <Sparkles className="h-8 w-8 text-white hidden" />
                        </div>
                      </div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                        {dialogApps.find(app => app.id === selectedApp)?.name || '智能助手'}
                      </h2>
                      <p className="text-gray-600 mb-8 leading-relaxed">
                        {dialogApps.find(app => app.id === selectedApp)?.description || '您的智能对话助手'}
                      </p>
                      
                      {/* 显示系统提示词 */}
                      {dialogApps.find(app => app.id === selectedApp)?.prompt_config?.system && (
                        <div className="text-left bg-gray-50 rounded-lg p-4 mb-6">
                          <h3 className="text-sm font-medium text-gray-900 mb-2">系统提示词:</h3>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {dialogApps.find(app => app.id === selectedApp)?.prompt_config?.system}
                          </p>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        模型: {dialogApps.find(app => app.id === selectedApp)?.llm_id || '未设置'}
                      </div>
                    </div>
                  </div>
                ) : xMessages.length === 0 && !isLoading && !(activeTab === 'topics' && !currentConversation && selectedApp) ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-xl font-bold">AI</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {activeTab === 'topics' 
                        ? 'AI 智能对话'
                        : dialogApps.find(app => app.id === selectedApp)?.name || '智能助手'
                      }
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {activeTab === 'topics' 
                        ? '基于 Ant Design X，AGI 产品界面解决方案，创造更好的智能视觉'
                        : dialogApps.find(app => app.id === selectedApp)?.description || '您的智能对话助手'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Bubble.List
                      items={bubbleItems}
                      autoScroll
                      roles={{
                        user: {
                          variant: 'borderless',
                          shape: 'round'
                        },
                        assistant: {
                          variant: 'borderless', 
                          shape: 'round'
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 底部输入区域 - 在话题模式下选中对话时显示，其他模式正常显示 */}
              {(activeTab !== 'topics' || (activeTab === 'topics' && selectedConversationDetail)) && (
                <div className="px-6 pb-6">
                  <div className="max-w-3xl mx-auto">
                    {/* 附件显示 */}
                    {attachments.length > 0 && (
                      <div className="mb-4">
                        <Attachments
                          items={attachments as any}
                          onRemove={(file) => handleRemoveAttachment(file as ChatAttachment)}
                          overflow="wrap"
                        />
                      </div>
                    )}
                    
                    <Suggestion
                      items={suggestionItems}
                      onSelect={(value) => {
                        setInputValue(inputValue + value)
                      }}
                    >
                      {({ onTrigger, onKeyDown }) => (
                        <Sender
                          value={inputValue}
                          onChange={(value) => {
                            setInputValue(value)
                            if (value === '/') {
                              onTrigger()
                            } else if (!value) {
                              onTrigger(false)
                            }
                          }}
                          onKeyDown={onKeyDown}
                          placeholder="Ask or input / use skills"
                          onSubmit={(message) => {
                            if (message) {
                              if (activeTab === 'topics' && selectedConversationDetail) {
                                // 话题模式下发送消息
                                handleTopicMessageSend(message)
                              } else {
                                // 其他模式下发送消息
                                setCurrentMessageId(null)
                                onRequest(message)
                              }
                              setInputValue('')
                              setAttachments([])
                            }
                          }}
                          onPasteFile={(_, files) => {
                            for (let i = 0; i < files.length; i++) {
                              const file = files[i]
                              if (file.type.startsWith('image/')) {
                                handleAddAttachment(file)
                              }
                            }
                          }}
                          loading={activeTab === 'topics' ? isTopicStreaming : isStreaming}
                          allowSpeech={{
                            recording: false,
                            onRecordingChange: (recording) => {
                              console.log('Recording:', recording)
                            }
                          }}
                          submitType="enter"
                          autoSize={{ minRows: 1, maxRows: 4 }}
                          styles={{
                            input: {
                              border: 'none',
                              boxShadow: 'none',
                              borderRadius: '16px',
                              backgroundColor: '#f8fafc',
                              fontSize: '14px',
                              lineHeight: '1.6',
                              padding: '12px 16px'
                            }
                          }}
                          className="border-none shadow-none rounded-2xl bg-gray-50"
                        />
                      )}
                    </Suggestion>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}