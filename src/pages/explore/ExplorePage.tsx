import React from 'react'
import {
  MessageSquare,
  Search,
  Settings,
  Plus,
  Sparkles,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  ThumbsUp,
  FileText,
  LayoutGrid,
  AlignCenter,
  Maximize2
} from 'lucide-react'
import { 
  Conversations, 
  Bubble, 
  Sender, 
  Prompts,
  Welcome,
  Think,
  Sources,
  Actions,
  Attachments
} from '@ant-design/x'
import { ConfigProvider, theme } from 'antd'
import type { PromptsProps, SourcesProps } from '@ant-design/x'
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown'
import '@ant-design/x-markdown/dist/x-markdown.css'
import { Button } from '@/components/ui/button'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useChatStore } from '@/stores/chat'
import { useModelStore } from '@/stores/model'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import { conversationAPI } from '@/api/conversation'
import { useQuery } from '@tanstack/react-query'
import { chatConfig, type ChatMessage, type ChatServiceRequest, type SSEResponse, type ChatAttachment } from '@/config/chat'
import { extractReferencesFromSSEData, type ReferenceChunk } from '@/utils/reference-replacer'

// 将内容中的 [ID:x] 引用转换为 <sup>x</sup> 格式，供 XMarkdown 处理
const convertReferencesToSup = (content: string): string => {
  if (!content) return ''
  return content.replace(/\[ID:(\d+)\]/g, '<sup>$1</sup>')
}

// 提取并分离 think 内容和主内容
interface ThinkExtractResult {
  thinkContent: string
  mainContent: string
  isThinking: boolean
}

const extractThinkContent = (content: string): ThinkExtractResult => {
  if (!content) return { thinkContent: '', mainContent: '', isThinking: false }
  
  // 检查是否有完整的 think 标签
  const completeMatch = content.match(/<think>([\s\S]*?)<\/think>([\s\S]*)/)
  if (completeMatch) {
    return {
      thinkContent: completeMatch[1].trim(),
      mainContent: completeMatch[2].trim(),
      isThinking: false
    }
  }
  
  // 检查是否有未闭合的 think 标签（正在思考中）
  const openMatch = content.match(/<think>([\s\S]*)$/)
  if (openMatch) {
    return {
      thinkContent: openMatch[1].trim(),
      mainContent: '',
      isThinking: true
    }
  }
  
  // 没有 think 标签
  return { thinkContent: '', mainContent: content, isThinking: false }
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
      const response = await conversationAPI.completion({
        conversation_id: selectedConversationDetail.id,
        messages: updatedMessages
      })

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
                  
                  // 提取 thinking 内容
                  let thinking = ''
                  let thinkingComplete = false
                  const thinkingMatch = content.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/)
                  if (thinkingMatch) {
                    thinking = thinkingMatch[1].trim()
                    thinkingComplete = content.includes('</thinking>')
                  }
                  
                  const cleanContent = content.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim()
                  
                  setMessages(prev => {
                    const newMsgs = [...prev]
                    const lastIdx = newMsgs.length - 1
                    if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                      newMsgs[lastIdx] = {
                        ...newMsgs[lastIdx],
                        content: cleanContent,
                        references,
                        thinking,
                        thinkingComplete
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
                  let thinking = ''
                  let thinkingComplete = false
                  const thinkingMatch = data.data.match(/<thinking>([\s\S]*?)(?:<\/thinking>|$)/)
                  if (thinkingMatch) {
                    thinking = thinkingMatch[1].trim()
                    thinkingComplete = data.data.includes('</thinking>')
                  }
                  
                  const content = data.data.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim()
                  
                  setMessages(prev => {
                    const newMsgs = [...prev]
                    const lastIdx = newMsgs.length - 1
                    if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                      newMsgs[lastIdx] = {
                        ...newMsgs[lastIdx],
                        content,
                        thinking,
                        thinkingComplete
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
  

  // 转换消息为 Bubble 格式
  const bubbleItems = messages.map((msg, index) => {
    const references = msg.references || []
    
    // 创建内联来源引用组件（闭包捕获 references）
    const SupComponent = (props: ComponentProps) => {
      const refIndex = parseInt(`${props?.children}` || '0', 10)
      const ref = references[refIndex]
      
      if (!ref) {
        return <sup>{props?.children}</sup>
      }
      
      const items: SourcesProps['items'] = [{
        key: ref.id || `ref-${refIndex}`,
        title: ref.document_name || `来源 ${refIndex + 1}`,
        icon: <FileText className="h-3 w-3" />,
        description: ref.content?.slice(0, 200),
      }]
      
      return (
        <Sources
          activeKey={refIndex}
          title={props.children}
          items={items}
          inline={true}
          onClick={() => {
            console.log('Source clicked:', ref)
          }}
        />
      )
    }
    
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
        // 提取并分离 think 内容
        const { thinkContent, mainContent, isThinking } = extractThinkContent(msg.content || '')
        // 对主内容转换引用格式
        const mainContentWithSup = convertReferencesToSup(mainContent)
        
        // Think 展开状态组件
        const ThinkWrapper = ({ children, thinking }: { children: React.ReactNode, thinking: boolean }) => {
          const [expanded, setExpanded] = React.useState(thinking)
          
          // 当思考完成时自动折叠
          React.useEffect(() => {
            if (!thinking) {
              setExpanded(false)
            }
          }, [thinking])
          
          return (
            <Think
              title={thinking ? '正在思考...' : '思考完成'}
              loading={thinking}
              expanded={expanded}
              onExpand={(newExpanded) => {
                // 阻止展开/折叠时触发页面滚动
                setExpanded(newExpanded)
              }}
              blink={thinking}
            >
              {children}
            </Think>
          )
        }
        
        return (
          <div className="space-y-3">
            {/* Think 组件展示思考过程 */}
            {thinkContent && (
              <ThinkWrapper thinking={isThinking}>
                <div 
                  className="text-sm whitespace-pre-wrap" 
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {thinkContent}
                </div>
              </ThinkWrapper>
            )}
            
            {/* 使用 XMarkdown 渲染主内容 */}
            {mainContentWithSup && (
              <div className="leading-relaxed markdown-content">
                <XMarkdown 
                  components={{ sup: SupComponent }} 
                  paragraphTag="div"
                >
                  {mainContentWithSup}
                </XMarkdown>
            </div>
          )}
          
            {/* 如果没有内容且没有思考内容，显示加载提示 */}
            {!thinkContent && !mainContent && (
              <span className="italic" style={{ color: 'var(--color-text-muted)' }}>正在生成...</span>
            )}
            
            {/* 底部汇总显示所有引用来源 */}
            {references.length > 0 && (
              <Sources
                title={`引用了 ${references.length} 个来源`}
                items={references.map((ref, idx) => ({
                  key: ref.id || `ref-${idx}`,
                  title: ref.document_name || `来源 ${idx + 1}`,
                  icon: <FileText className="h-3 w-3" />,
                  description: ref.content?.slice(0, 150)
                })) as SourcesProps['items']}
                onClick={(item) => {
                  console.log('Source clicked:', item)
                }}
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
      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--color-chat-content-bg)' }}>
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
              
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
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
    </div>
  )
}
