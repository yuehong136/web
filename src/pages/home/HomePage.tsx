import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  MessageSquare, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useChatStore } from '@/stores/chat'
import { useModelStore } from '@/stores/model'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Welcome, Prompts, Sender } from '@ant-design/x'
import type { PromptsProps } from '@ant-design/x'

// Logo 组件
const LogoIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <div 
    className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center"
    style={{ width: size, height: size }}
  >
    <span className="text-white font-bold" style={{ fontSize: size * 0.4 }}>F</span>
  </div>
)

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    conversations, 
    currentConversation, 
    createConversation, 
    selectConversation 
  } = useChatStore()
  const { myLLMs, isLoading: modelsLoading, loadMyLLMs } = useModelStore()
  
  const [chatSidebarCollapsed, setChatSidebarCollapsed] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [selectedModel, setSelectedModel] = useState<string | null>(null)

  // 加载模型列表
  useEffect(() => {
    loadMyLLMs()
  }, [])

  // 自动选择第一个可用的聊天模型
  useEffect(() => {
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

  // 处理新对话
  const handleNewChat = () => {
    createConversation()
  }

  // 处理发送消息
  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      if (!currentConversation) {
        createConversation()
      }
      navigate('/chat')
    }
  }

  // 处理提示词点击
  const handlePromptClick: PromptsProps['onItemClick'] = (info) => {
    const label = info.data.label
    if (typeof label === 'string') {
      setInputValue(label)
    }
  }

  // 格式化时间
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  // 转换对话列表
  const conversationList = conversations.map(conv => ({
    id: conv.id,
    title: conv.title || '新对话',
    timestamp: formatTime(new Date(conv.updatedAt)),
    isActive: conv.id === currentConversation?.id
  }))

  // 提示词列表
  const promptItems: PromptsProps['items'] = [
    {
      key: '1',
      label: '今天有什么新鲜事？',
      description: '获取最新资讯',
    },
    {
      key: '2',
      label: '帮我写一段代码',
      description: '编程助手',
    },
    {
      key: '3',
      label: '解释一个概念',
      description: '知识百科',
    },
    {
      key: '4',
      label: '翻译一段文字',
      description: '多语言翻译',
    },
  ]

  return (
    <div className="h-full flex">
      {/* 中间聊天侧边栏 */}
      <div 
        className={cn(
          "border-r border-gray-100 flex flex-col transition-all duration-300 relative",
          chatSidebarCollapsed ? "w-0 overflow-hidden" : "w-72"
        )}
      >
        {/* 聊天标题 */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h2 className="text-base font-medium text-gray-900">聊天</h2>
        </div>

        {/* 新对话按钮区域 */}
        <div className="px-3 py-3 flex items-center gap-2">
          <Button
            onClick={handleNewChat}
            variant="outline"
            className="flex-1 h-9 justify-center gap-2 text-sm font-normal rounded-lg border-gray-200 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            新对话
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-gray-200 hover:bg-gray-50"
          >
            <Lock className="h-4 w-4 text-gray-400" />
          </Button>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="space-y-1">
            {conversationList.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  selectConversation(conv.id)
                  navigate('/chat')
                }}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                  conv.isActive 
                    ? "bg-blue-50 text-blue-600" 
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  conv.isActive ? "bg-blue-500" : "bg-blue-400"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{conv.title}</div>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {conv.timestamp}
                </span>
                <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity">
                  <MoreHorizontal className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
          
          {conversationList.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              暂无对话记录
            </div>
          )}
          
          {conversationList.length > 0 && (
            <div className="text-center py-4 text-xs text-gray-400">
              已加载全部
            </div>
          )}
        </div>

        {/* 折叠按钮 */}
        <button
          onClick={() => setChatSidebarCollapsed(!chatSidebarCollapsed)}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center shadow-md hover:bg-gray-600 transition-colors z-10"
        >
          {chatSidebarCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5 text-white" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-white" />
          )}
        </button>
      </div>

      {/* 右侧主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 items-center justify-center p-8">
        <div className="w-full max-w-2xl space-y-8">
          {/* Welcome 欢迎组件 */}
          <Welcome
            variant="borderless"
            icon={<LogoIcon size={56} />}
            title="FastGPT"
            description="你好👋，我是 FastGPT！请问有什么可以帮你?"
            styles={{
              icon: { 
                background: 'transparent',
              },
              title: { 
                fontSize: '28px', 
                fontWeight: 600,
                color: '#1f2937',
              },
              description: { 
                fontSize: '15px',
                color: '#6b7280',
              },
            }}
          />

          {/* 输入框 - 放在中间 */}
          <div className="w-full">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <Sender
                value={inputValue}
                onChange={setInputValue}
                placeholder="你可以问我任何问题"
                onSubmit={handleSendMessage}
                style={{
                  boxShadow: 'none',
                  border: 'none',
                }}
                suffix={
                  <div className="flex items-center gap-2">
                    <ErrorBoundary
                      fallback={() => (
                        <span className="text-xs text-gray-400">gpt-4o-mini</span>
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
                }
              />
            </div>
          </div>

          {/* Prompts 提示词建议 */}
          <Prompts
            items={promptItems}
            onItemClick={handlePromptClick}
            wrap
            styles={{
              item: {
                background: '#f9fafb',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default HomePage
