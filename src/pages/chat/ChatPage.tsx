import React from 'react'
import { 
  Conversations, 
  Bubble, 
  Sender, 
  Prompts,
  Welcome,
  Attachments
} from '@ant-design/x'
import type { PromptsProps } from '@ant-design/x'
import markdownit from 'markdown-it'
import { 
  Plus, 
  MessageSquare,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChatStore } from '@/stores/chat'
import { useUIStore } from '@/stores/ui'
import { useModelStore } from '@/stores/model'
import { cn } from '@/lib/utils'
import { chatConfig, type ChatMessage, type ChatServiceRequest, type SSEResponse, type ChatAttachment } from '@/config/chat'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { ErrorBoundary } from '@/components/ui/error-boundary'

// 初始化 markdown-it
const md = markdownit({ html: true, breaks: true, linkify: true })

// Markdown 渲染函数
const renderMarkdown = (content: string) => {
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
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null)
  const [messages, setMessages] = React.useState<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const [isRequesting, setIsRequesting] = React.useState(false)

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

  const handleNewChat = () => {
    createConversation()
    setMessages([])
  }

  // 发送消息
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isRequesting) return

    // 添加用户消息
    const newMessages = [...messages, { role: 'user' as const, content: message }]
    setMessages(newMessages)
    setIsRequesting(true)

    try {
      const historyMessages: ChatMessage[] = newMessages.map(msg => ({
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response body')
      }

      // 添加助手消息占位
      setMessages(prev => [...prev, { role: 'assistant' as const, content: '' }])

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

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
                fullContent = data.data
                  .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                  .trim()
                
                setMessages(prev => {
                  const newMsgs = [...prev]
                  newMsgs[newMsgs.length - 1] = { role: 'assistant', content: fullContent }
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
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => {
        const newMsgs = [...prev]
        newMsgs[newMsgs.length - 1] = { role: 'assistant', content: '抱歉，发生了错误，请重试。' }
        return newMsgs
      })
    } finally {
      setIsRequesting(false)
    }
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
        prev.map(item => 
          item.uid === attachment.uid 
            ? { ...item, status: 'error' as const }
            : item
        )
      )
    }
  }

  // 移除附件
  const handleRemoveAttachment = (attachment: ChatAttachment) => {
    setAttachments(prev => prev.filter(item => item.uid !== attachment.uid))
  }

  // 转换对话数据为 Conversations 组件需要的格式
  const conversationItems = conversations.map(conv => ({
    key: conv.id,
    label: conv.title || '新对话',
    timestamp: new Date(conv.updatedAt).getTime(),
    icon: <MessageSquare className="h-4 w-4" />,
  }))

  // 转换消息数据为 Bubble.List 需要的格式
  const bubbleItems = messages.map((msg, index) => ({
    key: `message-${index}`,
    content: msg.content || (msg.role === 'assistant' ? '正在思考...' : ''),
    placement: (msg.role === 'user' ? 'end' : 'start') as 'start' | 'end',
    avatar: msg.role === 'user'
      ? { style: { backgroundColor: '#3b82f6' }, children: 'U' }
      : { style: { backgroundColor: '#f8fafc' }, children: 'AI' },
    contentRender: msg.role === 'assistant' ? () => renderMarkdown(msg.content) : undefined,
    variant: 'borderless' as const,
    styles: {
      content: {
        backgroundColor: msg.role === 'user' ? '#3b82f6' : '#f8fafc',
        color: msg.role === 'user' ? '#ffffff' : '#1f2937',
        borderRadius: '16px',
        padding: '12px 16px',
      },
    },
  }))

  // 提示词
  const promptItems: PromptsProps['items'] = [
    { key: '1', label: '解释这个概念' },
    { key: '2', label: '写一段代码' },
    { key: '3', label: '总结要点' },
    { key: '4', label: '翻译文本' },
  ]

  return (
    <div className="h-full flex">
      {/* 左侧对话历史侧边栏 */}
      <div className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        showSidebar ? "w-64" : "w-0",
        "lg:w-64 lg:flex",
        !showSidebar && "hidden lg:flex"
      )}>
        <div className="p-4 border-b border-gray-100">
          <Button
            onClick={handleNewChat}
            className="w-full bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            新对话
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <Conversations
            activeKey={currentConversation?.id}
            items={conversationItems}
            onActiveChange={(key) => selectConversation(key)}
          />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">
            {currentConversation?.title || '新对话'}
          </h1>
          
          <div className="flex items-center space-x-4">
            <div className="w-64">
              <ErrorBoundary
                fallback={() => (
                  <div className="text-xs text-gray-500">模型加载失败</div>
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
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 消息展示区域 */}
        <div className="flex-1 overflow-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <Welcome
                variant="borderless"
                icon={
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">AI</span>
                  </div>
                }
                title="智能对话助手"
                description="你好！我是你的 AI 助手，有什么可以帮你的吗？"
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
            <div className="max-w-3xl mx-auto" style={{ height: '100%' }}>
              <Bubble.List
                items={bubbleItems}
                autoScroll
                style={{ height: '100%' }}
              />
            </div>
          )}
        </div>

        {/* 底部输入区域 */}
        <div className="px-6 pb-6">
          <div className="max-w-3xl mx-auto">
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
              placeholder="输入消息..."
              onSubmit={(message) => {
                if (message) {
                  handleSendMessage(message)
                  setInputValue('')
                  setAttachments([])
                }
              }}
              onPasteFile={(files) => {
                for (let i = 0; i < files.length; i++) {
                  const file = files[i]
                  if (file.type.startsWith('image/')) {
                    handleAddAttachment(file)
                  }
                }
              }}
              loading={isRequesting || isStreaming}
              style={{
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
