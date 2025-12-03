import React from 'react'
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
import { 
  Plus, 
  MessageSquare,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Copy,
  RotateCcw,
  ThumbsUp,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat'
import { useUIStore } from '@/stores/ui'
import { useModelStore } from '@/stores/model'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { chatConfig, type ChatMessage, type ChatServiceRequest, type SSEResponse, type ChatAttachment } from '@/config/chat'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { ProviderIcon, getModelDisplayName } from '@/components/ui/provider-icon'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import thinkingAnimation from '@/assets/thinking.apng'

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

export const ChatPage: React.FC = () => {
  const {
    conversations,
    currentConversation,
    isStreaming,
    isLoading,
    createConversation,
    selectConversation,
  } = useChatStore()

  const { isMobile } = useUIStore()
  const { 
    myLLMs, 
    isLoading: modelsLoading, 
    loadMyLLMs 
  } = useModelStore()
  
  const [showSidebar] = React.useState(!isMobile())
  const [inputValue, setInputValue] = React.useState('')
  const [attachments, setAttachments] = React.useState<ChatAttachment[]>([])
  // const [uploadingFiles, setUploadingFiles] = React.useState<Set<string>>(new Set())
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null)

  // 消息thinking状态管理 - 每个消息独立保存
  const [messageThinkingStates, setMessageThinkingStates] = React.useState<Record<string, {
    isThinking: boolean
    thinkingComplete: boolean
    thinkingExpanded: boolean
    thinkingContent: string
  }>>({})
  
  // 当前正在生成的消息ID
  const [currentMessageId, setCurrentMessageId] = React.useState<string | null>(null)

  // 加载模型列表
  React.useEffect(() => {
    loadMyLLMs()
  }, [])

  // 自动选择第一个可用的聊天模型
  React.useEffect(() => {
    if (!selectedModel && !modelsLoading && myLLMs && Object.keys(myLLMs).length > 0) {
      // 找到第一个可用的聊天模型
      for (const [, provider] of Object.entries(myLLMs)) {
        // 安全检查 provider 和 provider.llm
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

  // 根据选中的模型名称找到对应的厂商名称
  const selectedProviderName = React.useMemo(() => {
    if (!selectedModel || !myLLMs) return null
    for (const [providerName, providerData] of Object.entries(myLLMs)) {
      if (providerData?.llm?.some(model => model.name === selectedModel)) {
        return providerName
      }
    }
    return null
  }, [selectedModel, myLLMs])

  // 配置 X Agent 对接后端 SSE 接口
  const [agent] = useXAgent({
    request: async (info, callbacks) => {
      const { message, messages = [] } = info
      const { onUpdate, onSuccess, onError } = callbacks

      try {
        // 处理历史消息上下文
        const historyMessages: ChatMessage[] = Array.isArray(messages) 
          ? messages.map((msg, index) => {
              // 根据索引正确判断角色：偶数索引为用户消息，奇数索引为助手消息
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

        // 获取第一个图片附件的 base64 数据（用于 image2text 模型）
        const imageAttachment = attachments.find(att => 
          att.status === 'done' && 
          att.type?.startsWith('image/') && 
          att.url?.includes('base64')
        )
        const imageBase64 = imageAttachment?.url?.split(',')[1]

        // 获取实际可用的聊天模型
        const getAvailableChatModel = () => {
          // 如果有选中的模型，直接使用
          if (selectedModel) return selectedModel
          
          // 否则从可用模型中找第一个聊天模型
          if (myLLMs && typeof myLLMs === 'object') {
            for (const [, provider] of Object.entries(myLLMs)) {
              // 安全检查 provider 和 provider.llm
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
          
          // 如果没有找到任何聊天模型，抛出错误
          throw new Error('No chat models available. Please configure a chat model first.')
        }

        const modelToUse = getAvailableChatModel()

        // 构建请求体 - 检查是否需要添加当前用户消息
        const currentUserMessage = {
          role: 'user' as const,
          content: typeof message === 'string' ? message : String(message)
        }
        
        // 检查历史消息中最后一条是否已经是当前用户消息
        const lastMessage = historyMessages[historyMessages.length - 1]
        const shouldAddCurrentMessage = !lastMessage || 
          lastMessage.role !== 'user' || 
          lastMessage.content !== currentUserMessage.content
        
        const requestBody: ChatServiceRequest = {
          prompt: '', // 暂时传空字符串
          messages: shouldAddCurrentMessage 
            ? [...historyMessages, currentUserMessage]
            : historyMessages,
          llm_name: modelToUse, // 使用实际可用的模型
          stream: true,
          gen_conf: {}, // 传空字典
          tavily_api_key: '', // 传空字符串
          image: imageBase64 // 如果有图片则传入base64数据
        }

        // 使用apiClient发送SSE请求，但需要直接用fetch处理流式响应
        // 构建完整URL - 使用环境变量中的API_BASE_URL
        const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const fullUrl = `${baseURL}/v1${chatConfig.apiEndpoint}`
        
        // 获取认证token
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

        // 使用 XStream 解析 SSE 响应
        for await (const chunk of XStream({
          readableStream: response.body
        })) {
          try {
            // 根据Ant Design X文档，chunk应该有data属性
            const chunkData = (chunk as any)?.data
            if (chunkData) {
              // 过滤掉可能的分隔符或异常字符
              const cleanChunkData = chunkData.replace(/^-+\\?$/gm, '').trim()
              if (!cleanChunkData) continue
              
              const data: SSEResponse = JSON.parse(cleanChunkData)
              
              if (data.retcode === 0 && typeof data.data === 'string') {
                // 清理内容中的异常字符
                const cleanContent = data.data.replace(/^-+\\?$/gm, '').trim()
                if (cleanContent) {
                  // 后端返回的已经是累积内容，直接使用，不需要再次累积
                  fullContent = cleanContent
                  
                  // 为当前消息生成ID（如果还没有）
                  if (!currentMessageId) {
                    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    setCurrentMessageId(messageId)
                  }
                  
                  const messageId = currentMessageId || `msg-${Date.now()}`
                  
                  // 检测thinking标签状态和提取内容
                  if (fullContent.includes('<thinking>')) {
                    // 实时提取thinking内容（支持流式更新）
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
                  
                  // 清理thinking标签，只传递实际内容给UI
                  const contentWithoutThinking = fullContent
                    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                    .trim()
                  
                  // 传递内容给onUpdate
                  onUpdate?.(contentWithoutThinking as any)
                }
              } else if (data.data === true) {
                // 流结束标记 - 传递最终的清理内容
                const finalContent = fullContent
                  .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                  .trim()
                
                // 如果当前消息有thinking状态，设置8秒后自动隐藏
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
                // 错误响应
                throw new Error(data.retmsg || 'Unknown error')
              }
            }
          } catch (parseError) {
            console.error('Parse error:', parseError, 'Chunk data:', (chunk as any)?.data)
            // 继续处理下一个 chunk
          }
        }
      } catch (error) {
        console.error('Chat request error:', error)
        onError?.(error as Error)
      }
    },
  })

  // 使用 useXChat 管理对话状态
  const { onRequest, messages: xMessages } = useXChat({ 
    agent
  })

  const handleNewChat = () => {
    createConversation()
  }

  // 文件上传处理
  const handleFileUpload = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = e.target?.result as string
        // 移除 data:image/xxx;base64, 前缀
        const base64Data = base64.split(',')[1]
        resolve(base64Data)
      }
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  // 添加附件
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
    // setUploadingFiles(prev => new Set([...prev, attachment.uid]))

    try {
      // 如果是图片文件，转换为 base64
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
        // 其他文件类型的处理
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
    } finally {
      // setUploadingFiles(prev => {
      //   const newSet = new Set(prev)
      //   newSet.delete(attachment.uid)
      //   return newSet
      // })
    }
  }

  // 移除附件
  const handleRemoveAttachment = (attachment: ChatAttachment) => {
    setAttachments(prev => prev.filter(item => item.uid !== attachment.uid))
    if (attachment.url && attachment.url.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.url)
    }
    if (attachment.thumbUrl && attachment.thumbUrl.startsWith('blob:')) {
      URL.revokeObjectURL(attachment.thumbUrl)
    }
  }

  // 转换对话数据为 Conversations 组件需要的格式
  const conversationItems = conversations.map(conv => ({
    key: conv.id,
    label: conv.title || '新对话',
    timestamp: new Date(conv.updatedAt).getTime(),
    icon: <MessageSquare className="h-4 w-4" />,
    group: conv.status === 'active' ? '活跃对话' : '历史对话'
  }))

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

  // 转换消息数据为 Bubble.List 需要的格式
  const bubbleItems = xMessages.map((msg, index) => {
    // 确定消息角色和内容 - 偶数索引为用户消息，奇数为AI回复
    const isUser = index % 2 === 0
    const rawContent = typeof msg === 'string' ? msg : 
      (typeof (msg as any)?.message === 'string' ? (msg as any).message :
       typeof (msg as any)?.content === 'string' ? (msg as any).content :
       typeof msg === 'object' && msg ? JSON.stringify(msg) : String(msg))
    
    // 清理thinking标签，只保留实际内容
    const contentWithoutThinking = rawContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim()
    const content = contentWithoutThinking.replace(/^-+\\?$/gm, '').replace(/^-{6,}\\?/gm, '').trim()
    
    // 为每个消息保存创建时间
    const messageTime = (msg as any)?.timestamp || Date.now()
    
    // 为每个消息生成唯一ID
    const messageId = (msg as any)?.id || `msg-${index}-${messageTime}`
    
    // 获取这个消息的thinking状态
    const messageThinking = messageThinkingStates[messageId]
    

    
    return {
      key: `message-${index}`,
      role: isUser ? 'user' : 'assistant',
      // 添加 header 显示模型名称和固定时间
      header: !isUser ? (
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
          <span>{getModelDisplayName(selectedModel)}</span>
          <span>·</span>
          <span>{new Date(messageTime).toLocaleTimeString()}</span>
        </div>
      ) : undefined,
      content: (
        <div className="space-y-3">
          {/* AI消息的thinking状态展示 */}
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
                      selectedProviderName 
                        ? <ProviderIcon provider={selectedProviderName} className="w-5 h-5" size={20} />
                        : null
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
                          className="text-gray-400 hover:text-gray-600 transition-transform duration-200"
                          style={{ transform: messageThinking.thinkingExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
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
              
              {/* 展开的思考内容 */}
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
          
          {/* 消息内容 */}
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
            style: { 
              backgroundColor: '#3b82f6', 
              border: 'none',
              boxShadow: 'none',
              borderRadius: '50%'
            }, 
            children: 'U' 
          }
        : { 
            icon: selectedProviderName 
              ? <ProviderIcon provider={selectedProviderName} className="w-5 h-5" size={20} />
              : null,
            style: { 
              backgroundColor: '#f8fafc', 
              border: 'none',
              boxShadow: 'none',
              borderRadius: '50%'
            }
          },
      // 添加 footer 显示操作按钮
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
        header: { 
          color: '#6b7280', 
          fontSize: '12px',
          marginBottom: '4px'
        },
        avatar: { 
          border: 'none',
          boxShadow: 'none'
        },
        content: {
          backgroundColor: isUser ? '#3b82f6' : '#f8fafc',
          color: isUser ? '#ffffff' : '#1f2937',
          border: 'none',
          boxShadow: 'none',
          borderRadius: '16px',
          padding: '12px 16px',
          fontSize: '16px',
          lineHeight: '1.6'
        },
        footer: {
          marginTop: '8px',
          padding: '0'
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
    <div className="h-full flex bg-gray-50">
      {/* 左侧对话历史侧边栏 */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        showSidebar ? "w-64" : "w-0",
        "lg:w-64 lg:flex",
        !showSidebar && "hidden lg:flex"
      )}>
        {/* 顶部Logo和新建按钮 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">X</span>
            </div>
            <span className="font-semibold text-gray-900">Ant Design X</span>
          </div>
          <Button
            onClick={handleNewChat}
            className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* 对话历史列表 */}
        <div className="flex-1 overflow-auto">
          <Conversations
            activeKey={currentConversation?.id}
            items={conversationItems}
            onActiveChange={(key) => selectConversation(key)}
            groupable={{
              sort: (a, b) => a.localeCompare(b),
            }}
            styles={{
              item: { 
                margin: '2px 12px', 
                borderRadius: '6px',
                fontSize: '14px'
              }
            }}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex">
        {/* 中央对话区域 */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto">
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentConversation?.title || '新对话'}
              </h1>
            </div>
            
            {/* 右上角模型选择器 */}
            <div className="flex items-center space-x-4">
              <div className="w-64">
                <ErrorBoundary
                  fallback={(error, retry) => (
                    <div className="text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
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
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {currentConversation ? (
            <>
              {/* 消息展示区域 */}
              <div className="flex-1 overflow-auto px-6 py-8">
                {xMessages.length === 0 && !isLoading ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-xl font-bold">AI</span>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Hello, I'm Ant Design X
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      Based on Ant Design, AGI product interface solution, create a better intelligent vision
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    
                    
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
                  </div>
                )}
              </div>

              {/* 底部输入区域 */}
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
                            // 重置当前消息ID，准备接收新消息
                            setCurrentMessageId(null)
                            
                            onRequest(message)
                            setInputValue('')
                            // 清空附件
                            setAttachments([])
                          }
                        }}
                        onPasteFile={(_, files) => {
                          // 处理粘贴的文件
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i]
                            if (file.type.startsWith('image/')) {
                              handleAddAttachment(file)
                            }
                          }
                        }}
                        loading={isStreaming}
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
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* 欢迎界面 */}
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="text-center max-w-2xl">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white text-2xl font-bold">AI</span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Hello, I'm Ant Design X
                  </h1>
                  <p className="text-gray-600 mb-8 text-lg">
                    Based on Ant Design, AGI product interface solution, create a better intelligent vision
                  </p>
                </div>
              </div>

              {/* Hot Topics 和 Design Guide 区域 */}
              <div className="px-6 pb-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Hot Topics */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Hot Topics</h3>
                    <div className="space-y-3">
                      {[
                        "What has Ant Design X upgraded?",
                        "New AGI Hybrid Interface",
                        "What components are in Ant Design X?",
                        "Come and discover the new design paradigm of the AI era.",
                        "How to quickly install and import components?"
                      ].map((topic, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 text-sm text-gray-700 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => {
                            onRequest(topic)
                          }}
                        >
                          <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                            {index + 1}
                          </span>
                          <span>{topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Design Guide */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-4">Design Guide</h3>
                    <div className="space-y-4">
                      {[
                        {
                          title: "Intention",
                          desc: "AI understands user needs and provides solutions.",
                          icon: "○"
                        },
                        {
                          title: "Role", 
                          desc: "AI's public persona and image",
                          icon: "○"
                        },
                        {
                          title: "Chat",
                          desc: "How AI Can Express Itself in a Way Users Understand",
                          icon: "○"
                        }
                      ].map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <span className="text-gray-400 mt-1">{item.icon}</span>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                            <p className="text-gray-600 text-xs mt-1">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部导航按钮 */}
              <div className="px-6 pb-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex justify-center space-x-8">
                    <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      <span>📈</span>
                      <span>Upgrades</span>
                    </button>
                    <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      <span>🧩</span>
                      <span>Components</span>
                    </button>
                    <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      <span>📖</span>
                      <span>RICH Guide</span>
                    </button>
                    <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      <span>🚀</span>
                      <span>Installation Introduction</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 底部输入框 */}
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
                            // 重置当前消息ID，准备接收新消息
                            setCurrentMessageId(null)
                            
                            onRequest(message)
                            setInputValue('')
                            // 清空附件
                            setAttachments([])
                          }
                        }}
                        onPasteFile={(_, files) => {
                          // 处理粘贴的文件
                          for (let i = 0; i < files.length; i++) {
                            const file = files[i]
                            if (file.type.startsWith('image/')) {
                              handleAddAttachment(file)
                            }
                          }
                        }}
                        loading={isStreaming}
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}