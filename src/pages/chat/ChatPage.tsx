import React from 'react'
import { Send, Plus, MoreVertical, Paperclip, Mic, Square } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Loading } from '../../components/ui/loading'
import { useChatStore } from '../../stores/chat'
import { useUIStore } from '../../stores/ui'
import { cn } from '../../lib/utils'

export const ChatPage: React.FC = () => {
  const {
    conversations,
    currentConversation,
    messages,
    isStreaming,
    isLoading,
    sendMessage,
    stopStreaming,
    createConversation,
    selectConversation,
    deleteConversation,
  } = useChatStore()

  const { isMobile } = useUIStore()
  const [input, setInput] = React.useState('')
  const [showSidebar, setShowSidebar] = React.useState(!isMobile())
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return

    const message = input.trim()
    setInput('')
    
    try {
      await sendMessage(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = () => {
    createConversation()
  }

  return (
    <div className="h-full flex bg-white">
      {/* 对话列表侧边栏 */}
      <div className={cn(
        "bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300",
        showSidebar ? "w-80" : "w-0",
        "lg:w-80 lg:flex",
        !showSidebar && "hidden lg:flex"
      )}>
        {/* 侧边栏头部 */}
        <div className="p-4 border-b border-gray-200">
          <Button
            onClick={handleNewChat}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建对话
          </Button>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-auto">
          <div className="p-2 space-y-1">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={cn(
                  "p-3 rounded-lg cursor-pointer group relative",
                  currentConversation?.id === conversation.id
                    ? "bg-primary-50 border border-primary-200"
                    : "hover:bg-gray-100"
                )}
                onClick={() => selectConversation(conversation.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {conversation.title || '新对话'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {conversation.updatedAt && new Date(conversation.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conversation.id)
                    }}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* 聊天头部 */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="lg:hidden"
                    onClick={() => setShowSidebar(!showSidebar)}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {currentConversation.title || '新对话'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      Multi-RAG AI Assistant
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {isStreaming && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopStreaming}
                    >
                      <Square className="h-3 w-3 mr-2" />
                      停止生成
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {messages.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Send className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    开始新的对话
                  </h3>
                  <p className="text-gray-500 max-w-sm mx-auto">
                    向AI助手提出问题，获得智能回答和建议
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-3xl rounded-lg px-4 py-3",
                      message.role === 'user'
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className={cn(
                      "text-xs mt-2 opacity-70",
                      message.role === 'user' ? "text-primary-100" : "text-gray-500"
                    )}>
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <Loading variant="dots" size="sm" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <div className="relative">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="输入消息..."
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 pr-12 focus:border-primary-500 focus:ring-primary-500 max-h-32"
                      rows={1}
                      style={{
                        height: 'auto',
                        minHeight: '48px',
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.style.height = 'auto'
                        target.style.height = Math.min(target.scrollHeight, 128) + 'px'
                      }}
                      disabled={isStreaming}
                    />
                    <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isStreaming}
                  size="icon"
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                按 Enter 发送，Shift + Enter 换行
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                选择或创建对话
              </h2>
              <p className="text-gray-500 mb-4">
                点击左侧对话开始聊天，或创建新的对话
              </p>
              <Button onClick={handleNewChat}>
                <Plus className="h-4 w-4 mr-2" />
                新建对话
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}