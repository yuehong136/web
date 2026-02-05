import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Send, Square } from 'lucide-react'
import { memo, useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function AgentChatBox() {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const messageContainerRef = useRef<HTMLDivElement>(null)

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || sendLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setSendLoading(true)

    try {
      // TODO: 集成实际的 API 调用
      // 模拟 AI 响应
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: t('chat.mockResponse', '这是一个模拟的 AI 响应。请集成实际的 API 调用。'),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } finally {
      setSendLoading(false)
    }

    // 滚动到底部
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [inputValue, sendLoading, t])

  const handleStopMessage = useCallback(() => {
    // TODO: 实现停止消息生成
    setSendLoading(false)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  return (
    <section className="flex flex-1 flex-col px-space-lg min-h-0 pb-space-base">
      {/* 消息列表 */}
      <div className="flex-1 overflow-auto" ref={messageContainerRef}>
        <div className="space-y-space-base py-space-base">
          {messages.length === 0 ? (
            <div className="text-center text-text-secondary py-space-xl">
              {t('chat.startConversation', '开始对话...')}
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.role === 'user' ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-radius-lg px-space-base py-space-sm',
                    message.role === 'user'
                      ? 'bg-surface-accent text-text-on-accent'
                      : 'bg-surface-secondary text-text-primary',
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {sendLoading && (
            <div className="flex justify-start">
              <div className="bg-surface-secondary rounded-radius-lg px-space-base py-space-sm">
                <div className="flex items-center gap-space-xs">
                  <span className="animate-pulse">{t('chat.thinking', '思考中...')}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <div ref={scrollRef} />
      </div>

      {/* 输入区域 */}
      <div className="flex gap-space-sm pt-space-sm border-t border-border-default">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.inputPlaceholder', '输入消息...')}
          disabled={sendLoading}
          className="flex-1"
        />
        {sendLoading ? (
          <Button variant="outline" onClick={handleStopMessage}>
            <Square className="size-4" />
          </Button>
        ) : (
          <Button onClick={handleSendMessage} disabled={!inputValue.trim()}>
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </section>
  )
}

export default memo(AgentChatBox)
