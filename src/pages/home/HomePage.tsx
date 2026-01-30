import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { flushSync } from 'react-dom'
import {
  AtSign,
  Paperclip,
  Lightbulb,
  ArrowUp,
  Search,
  Server,
  Globe,
  Wrench,
  X,
  Bot,
  User,
  Square,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mcpAPI } from '@/api/mcp'
import { useModelStore } from '@/stores/model'
import { useDialogApps } from '@/hooks/use-dialog-apps'
import { toast } from '@/lib/toast'
import { Bubble, Think } from '@ant-design/x'
import XMarkdown from '@ant-design/x-markdown'
import '@ant-design/x-markdown/dist/x-markdown.css'
import { EnhancedSSEParser, type SSEMessage, type ToolCallInfo } from '@/components/chat/EnhancedSSEParser'
import { ToolCallRenderer } from '@/components/chat/ToolCallRenderer'
import { ProviderIcon } from '@/components/ui/provider-icon'
import { Textarea } from '@/components/ui/textarea'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import type { MCPServer, MCPChatConfig } from '@/types/mcp'
import type { MCPChatServiceRequest } from '@/api/mcp-chat-service'
import type { DialogApp } from '@/types/api'

// 功能标签数据
const functionTabs = [
  { id: 'writing', label: '写作' },
  { id: 'ppt', label: 'PPT' },
  { id: 'video', label: '视频' },
  { id: 'design', label: '设计' },
  { id: 'excel', label: 'Excel' },
  { id: 'web', label: '网页' },
  { id: 'podcast', label: '播客' },
  { id: 'chart', label: '图表' },
]

// 推荐卡片数据
const recommendCards = [
  {
    id: 1,
    title: '银发经济崛起背后有哪些新商机?',
    tag: '猜你想聊',
    bgColor: 'bg-components-recommend-card-bg-1',
  },
  {
    id: 2,
    title: '副业收入超主业，该辞职全职搞副业吗?',
    tag: '猜你想聊',
    bgColor: 'bg-components-recommend-card-bg-2',
  },
  {
    id: 3,
    title: '一键直出动植物百科',
    tag: '创意设计',
    bgColor: 'bg-components-recommend-card-bg-3',
    hasImage: true,
    imageUrl: 'https://images.unsplash.com/photo-1698844243252-520dc762243e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w4NDM0ODN8MHwxfHJhbmRvbXx8fHx8fHx8fDE3Njk3Mzg5MTV8&ixlib=rb-4.1.0&q=80&w=400',
  },
  {
    id: 4,
    title: '水贝杰我睿疑似暴雷，专班介入后现状如何?',
    tag: '聊热点',
    bgColor: 'bg-components-recommend-card-bg-4',
  },
  {
    id: 5,
    title: '470万颗冰毒坠泰国河中，生态影响与恢复需多久?',
    tag: '聊热点',
    bgColor: 'bg-components-recommend-card-bg-4',
  },
]

// 获取问候语
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return '凌晨好'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

// 波浪式文字动画组件
interface WaveTextProps {
  text: string
  className?: string
  charDelay?: number // 每个字符的延迟间隔(ms)
  duration?: number // 动画持续时间(ms)
}

const WaveText: React.FC<WaveTextProps> = ({
  text,
  className = '',
  charDelay = 40,
  duration = 600,
}) => {
  const characters = text.split('')

  return (
    <>
      <style>
        {`
          @keyframes waveCharFadeUp {
            0% {
              opacity: 0;
              transform: translateY(12px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
      <span className={className}>
        {characters.map((char, index) => (
          <span
            key={index}
            className="inline-block"
            style={{
              opacity: 0,
              animation: `waveCharFadeUp ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) forwards`,
              animationDelay: `${index * charDelay}ms`,
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    </>
  )
}

// 根据服务器类型获取图标
const getServerIcon = (serverType: string) => {
  switch (serverType) {
    case 'sse':
      return <Globe className="w-4 h-4" />
    case 'streamable-http':
    case 'http':
      return <Server className="w-4 h-4" />
    default:
      return <Wrench className="w-4 h-4" />
  }
}

// 思考状态类型
type ThinkingStatus = 'none' | 'thinking' | 'complete'

interface ThinkExtractResult {
  thinkContent: string
  mainContent: string
  isThinking: boolean
  status: ThinkingStatus
}

// 提取 think 内容
const extractThinkContent = (content: string): ThinkExtractResult => {
  if (!content) return { thinkContent: '', mainContent: '', isThinking: false, status: 'none' }

  const completeMatch = content.match(/<think(?:ing)?>([\s\S]*?)<\/think(?:ing)?>([\s\S]*)/)
  if (completeMatch) {
    return {
      thinkContent: completeMatch[1].trim(),
      mainContent: completeMatch[2].trim(),
      isThinking: false,
      status: 'complete'
    }
  }

  const hasOpenTag = content.includes('<think>') || content.includes('<thinking>')
  const hasCloseTag = content.includes('</think>') || content.includes('</thinking>')

  if (hasOpenTag && !hasCloseTag) {
    const openMatch = content.match(/<think(?:ing)?>([\s\S]*)/)
    const afterTag = openMatch ? openMatch[1] : ''
    const doubleNewlineMatch = afterTag.match(/^([\s\S]*?)\n\n+(\S[\s\S]*)$/)

    if (doubleNewlineMatch) {
      return {
        thinkContent: doubleNewlineMatch[1].trim(),
        mainContent: doubleNewlineMatch[2].trim(),
        isThinking: false,
        status: 'complete'
      }
    }

    return {
      thinkContent: afterTag.trim(),
      mainContent: '',
      isThinking: true,
      status: 'thinking'
    }
  }

  return { thinkContent: '', mainContent: content, isThinking: false, status: 'none' }
}

// 稳定的 Markdown 渲染组件
const StableMarkdown = React.memo(({ content }: { content: string }) => {
  const stableContentRef = React.useRef(content)
  const [stableContent, setStableContent] = React.useState(content)

  React.useEffect(() => {
    if (content !== stableContentRef.current) {
      stableContentRef.current = content
      const rafId = requestAnimationFrame(() => {
        setStableContent(content)
      })
      return () => cancelAnimationFrame(rafId)
    }
  }, [content])

  if (!stableContent || !stableContent.trim()) {
    return null
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert bubble-copy-text">
      <XMarkdown paragraphTag="div">
        {stableContent}
      </XMarkdown>
    </div>
  )
}, (prevProps, nextProps) => {
  if (prevProps.content === nextProps.content) return true
  const diff = Math.abs((nextProps.content?.length || 0) - (prevProps.content?.length || 0))
  return diff < 10 && nextProps.content?.startsWith(prevProps.content || '')
})

// 消息类型
interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  parsedToolCalls?: ToolCallInfo[]
}

// 技能面板组件
interface SkillPanelProps {
  open: boolean
  onClose: () => void
  onSelectSkill: (server: MCPServer) => void
  onSelectApp: (app: DialogApp) => void
  selectedSkillIds: string[]
  selectedAppIds: string[]
  anchorRef: React.RefObject<HTMLElement>
  /** 面板弹出方向：down=向下弹出，up=向上弹出 */
  direction: 'up' | 'down'
}

const SkillPanel: React.FC<SkillPanelProps> = ({
  open,
  onClose,
  onSelectSkill,
  onSelectApp,
  selectedSkillIds,
  selectedAppIds,
  anchorRef,
  direction,
}) => {
  const [activeTab, setActiveTab] = useState<'skill' | 'app'>('skill')
  const [servers, setServers] = useState<MCPServer[]>([])
  const [skillLoading, setSkillLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const panelRef = useRef<HTMLDivElement>(null)

  // 获取对话应用列表
  const { data: dialogApps = [], isLoading: appsLoading } = useDialogApps()

  // 加载 MCP 服务器列表
  useEffect(() => {
    if (open && activeTab === 'skill') {
      loadServers()
    }
  }, [open, activeTab])

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open, onClose, anchorRef])

  // 切换标签时清空搜索
  useEffect(() => {
    setSearchTerm('')
  }, [activeTab])

  const loadServers = async () => {
    try {
      setSkillLoading(true)
      const response = await mcpAPI.listServers({}, { page: 1, page_size: 100 })
      setServers(response.mcp_servers || [])
    } catch (error) {
      toast.error('加载技能列表失败')
      console.error('Load MCP servers error:', error)
    } finally {
      setSkillLoading(false)
    }
  }

  // 过滤后的技能列表
  const filteredServers = useMemo(() => {
    if (!searchTerm) return servers
    const term = searchTerm.toLowerCase()
    return servers.filter(
      (server) =>
        server.name.toLowerCase().includes(term) ||
        server.description?.toLowerCase().includes(term)
    )
  }, [servers, searchTerm])

  // 过滤后的应用列表（只显示已激活的应用）
  const filteredApps = useMemo(() => {
    const activeApps = dialogApps.filter(app => app.status === '1')
    if (!searchTerm) return activeApps
    const term = searchTerm.toLowerCase()
    return activeApps.filter(
      (app) =>
        app.name.toLowerCase().includes(term) ||
        app.description?.toLowerCase().includes(term)
    )
  }, [dialogApps, searchTerm])

  if (!open) return null

  const isLoading = activeTab === 'skill' ? skillLoading : appsLoading
  const isEmpty = activeTab === 'skill' ? filteredServers.length === 0 : filteredApps.length === 0

  return (
    <div
      ref={panelRef}
      className={cn(
        "absolute left-0 w-80 bg-components-card-bg rounded-xl border border-border-default shadow-lg overflow-hidden z-50",
        direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
      )}
      style={{
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12)',
      }}
    >
      {/* 搜索框 */}
      <div className="p-3 border-b border-border-default">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="搜索技能/应用"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background-subtle rounded-lg border-none outline-none placeholder:text-text-tertiary text-text-primary"
            autoFocus
          />
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-border-default">
        <button
          onClick={() => setActiveTab('skill')}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'skill'
              ? 'text-text-primary border-b-2 border-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          技能
        </button>
        <button
          onClick={() => setActiveTab('app')}
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'app'
              ? 'text-text-primary border-b-2 border-text-primary'
              : 'text-text-tertiary hover:text-text-secondary'
          )}
        >
          应用
        </button>
      </div>

      {/* 列表内容 */}
      <div className="max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {activeTab === 'skill' ? (
              <Wrench className="w-8 h-8 text-text-tertiary mb-2" />
            ) : (
              <MessageSquare className="w-8 h-8 text-text-tertiary mb-2" />
            )}
            <p className="text-sm text-text-secondary">
              {searchTerm
                ? `没有找到匹配的${activeTab === 'skill' ? '技能' : '应用'}`
                : `暂无可用${activeTab === 'skill' ? '技能' : '应用'}`
              }
            </p>
          </div>
        ) : activeTab === 'skill' ? (
          // 技能列表
          <div className="py-1">
            {filteredServers.map((server) => {
              const isSelected = selectedSkillIds.includes(server.id)
              return (
                <button
                  key={server.id}
                  onClick={() => onSelectSkill(server)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'bg-state-focus-subtle'
                      : 'hover:bg-background-subtle'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                      isSelected
                        ? 'bg-state-focus text-text-inverted'
                        : 'bg-background-subtle text-text-secondary'
                    )}
                  >
                    {getServerIcon(server.server_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {server.name}
                    </div>
                    {server.description && (
                      <div className="text-xs text-text-tertiary truncate">
                        {server.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-state-focus flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          // 应用列表
          <div className="py-1">
            {filteredApps.map((app) => {
              const isSelected = selectedAppIds.includes(app.id)
              return (
                <button
                  key={app.id}
                  onClick={() => onSelectApp(app)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    isSelected
                      ? 'bg-state-focus-subtle'
                      : 'hover:bg-background-subtle'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden',
                      isSelected
                        ? 'bg-state-focus text-text-inverted'
                        : 'bg-background-subtle text-text-secondary'
                    )}
                  >
                    {app.icon ? (
                      <img
                        src={app.icon}
                        alt={app.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary truncate">
                      {app.name}
                    </div>
                    {app.description && (
                      <div className="text-xs text-text-tertiary truncate">
                        {app.description}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-state-focus flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export const HomePage: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [skillPanelOpen, setSkillPanelOpen] = useState(false)
  // 技能（MCP）相关状态
  const [selectedMCPIds, setSelectedMCPIds] = useState<string[]>([])
  const [selectedMCPServers, setSelectedMCPServers] = useState<MCPServer[]>([])
  // 应用相关状态
  const [selectedAppIds, setSelectedAppIds] = useState<string[]>([])
  const [selectedApps, setSelectedApps] = useState<DialogApp[]>([])
  // 记录用户输入 @ 的位置，用于选择后删除
  const [atTriggerPosition, setAtTriggerPosition] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const atButtonRef = useRef<HTMLButtonElement>(null)

  // 对话相关状态
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCallInfo[]>([])
  const [isToolAnalyzing, setIsToolAnalyzing] = useState(false)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const sseParserRef = useRef<EnhancedSSEParser | null>(null)

  // 模型相关
  const { myLLMs, isLoading: modelsLoading, loadMyLLMs } = useModelStore()
  const [selectedModelId, setSelectedModelId] = useState<string>('')

  // 加载模型列表
  useEffect(() => {
    if (Object.keys(myLLMs || {}).length === 0 && !modelsLoading) {
      loadMyLLMs()
    }
  }, [loadMyLLMs, myLLMs, modelsLoading])

  // 自动选择第一个可用的聊天模型
  useEffect(() => {
    if (!selectedModelId && !modelsLoading && myLLMs && Object.keys(myLLMs).length > 0) {
      for (const [, provider] of Object.entries(myLLMs)) {
        if (provider && provider.llm && Array.isArray(provider.llm)) {
          const chatModel = provider.llm.find(model =>
            model && model.type === 'chat' && model.name
          )
          if (chatModel) {
            setSelectedModelId(chatModel.name)
            break
          }
        }
      }
    }
  }, [selectedModelId, modelsLoading, myLLMs])

  // 根据选中的模型名称找到对应的厂商名称
  const selectedProviderName = useMemo(() => {
    if (!selectedModelId || !myLLMs) return null
    for (const [providerName, providerData] of Object.entries(myLLMs)) {
      if (providerData?.llm?.some(model => model.name === selectedModelId)) {
        return providerName
      }
    }
    return null
  }, [selectedModelId, myLLMs])

  // 获取 AI 头像
  const getAssistantAvatar = useCallback(() => {
    if (selectedProviderName) {
      return <ProviderIcon provider={selectedProviderName} className="w-8 h-8" size={32} />
    }
    return (
      <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center flex-shrink-0 bg-components-avatar-gradient-purple-from">
        <Bot className="h-4 w-4 text-text-inverted" />
      </div>
    )
  }, [selectedProviderName])

  // 获取用户头像
  const getUserAvatar = useCallback(() => (
    <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center flex-shrink-0 bg-components-avatar-gradient-blue-from">
      <User className="h-4 w-4 text-text-inverted" />
    </div>
  ), [])

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputValue])

  // 滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, streamingContent])

  // 处理发送消息
  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return

    if (!selectedModelId) {
      toast.error('请先选择一个聊天模型')
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsStreaming(true)
    setStreamingContent('')
    setStreamingToolCalls([])
    setIsToolAnalyzing(false)

    try {
      const historyMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))

      const allMessages = [...historyMessages, {
        role: 'user' as const,
        content: userMessage.content
      }]

      const mcpConfig: MCPChatConfig = {
        mcp_ids: selectedMCPIds,
        mcp_timeout: 30000,
        verbose_tool_use: true,
      }

      const request: MCPChatServiceRequest = {
        prompt: '',
        messages: allMessages,
        llm_name: selectedModelId,
        stream: true,
        gen_conf: {},
        mcp_ids: selectedMCPIds,
        mcp_timeout: mcpConfig.mcp_timeout,
        verbose_tool_use: mcpConfig.verbose_tool_use,
        files: [],
        structured_output: selectedMCPIds.length > 0
      }

      const parser = new EnhancedSSEParser()
      sseParserRef.current = parser

      await parser.connect(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`,
        request,
        (message: SSEMessage, parserState) => {
          flushSync(() => {
            switch (message.type) {
              case 'text':
                setStreamingContent(parserState.accumulatedText)
                break
              case 'tool_call':
              case 'tool_result':
                setStreamingToolCalls([...parserState.toolCalls])
                break
              case 'tool_start':
                setIsToolAnalyzing(true)
                break
              case 'tool_end':
                setIsToolAnalyzing(false)
                break
              case 'complete': {
                const assistantMessage: ChatMessage = {
                  id: Date.now().toString(),
                  role: 'assistant',
                  content: parserState.accumulatedText,
                  timestamp: new Date().toLocaleTimeString(),
                  parsedToolCalls: parserState.toolCalls,
                }
                setMessages(prev => [...prev, assistantMessage])
                break
              }
              case 'error': {
                const errorMsg = message.content as unknown as { error?: string }
                throw new Error(errorMsg.error || 'Unknown error')
              }
            }
          })
        },
        (error) => {
          console.error('SSE Parser error:', error)
          toast.error(error.message || '连接出错')
        }
      )
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error(error instanceof Error ? error.message : '发送消息失败')
    } finally {
      if (sseParserRef.current) {
        sseParserRef.current.disconnect()
        sseParserRef.current = null
      }
      setIsStreaming(false)
      setStreamingContent('')
      setStreamingToolCalls([])
      setIsToolAnalyzing(false)
    }
  }, [inputValue, selectedModelId, selectedMCPIds, messages])

  // 停止输出
  const handleStop = () => {
    if (sseParserRef.current) {
      sseParserRef.current.disconnect()
      sseParserRef.current = null
    }
    setIsStreaming(false)
    setStreamingContent('')
    setStreamingToolCalls([])
    setIsToolAnalyzing(false)
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 处理输入变化，监听 @ 符号输入
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const prevValue = inputValue
    
    // 检查是否新输入了 @ 符号
    if (newValue.length > prevValue.length) {
      const cursorPos = e.target.selectionStart!
      const addedChar = newValue[cursorPos - 1]
      if (addedChar === '@') {
        // 检查 @ 前面是否是空格、换行或字符串开头
        const charBeforeAt = cursorPos > 1 ? newValue[cursorPos - 2] : ''
        const isAtStart = cursorPos === 1
        const isAfterWhitespace = /\s/.test(charBeforeAt)
        
        if (isAtStart || isAfterWhitespace || charBeforeAt === '') {
          // 记录 @ 的位置，打开技能面板
          setAtTriggerPosition(cursorPos - 1)
          setSkillPanelOpen(true)
        }
      }
    }
    
    setInputValue(newValue)
  }

  // 删除用户输入的 @ 符号
  const removeAtSymbol = useCallback(() => {
    if (atTriggerPosition !== null && inputValue[atTriggerPosition] === '@') {
      const newValue = inputValue.slice(0, atTriggerPosition) + inputValue.slice(atTriggerPosition + 1)
      setInputValue(newValue)
      setAtTriggerPosition(null)
    }
  }, [atTriggerPosition, inputValue])

  // 处理卡片点击
  const handleCardClick = (title: string) => {
    setInputValue(title)
    textareaRef.current?.focus()
  }

  // 处理标签点击
  const handleTabClick = (tabId: string) => {
    setActiveTab(activeTab === tabId ? null : tabId)
  }

  // 处理技能选择（技能和应用互斥，选技能时清空应用）
  const handleSkillSelect = (server: MCPServer) => {
    // 选择技能时，清空已选应用
    if (selectedAppIds.length > 0) {
      setSelectedAppIds([])
      setSelectedApps([])
    }
    
    if (selectedMCPIds.includes(server.id)) {
      setSelectedMCPIds(prev => prev.filter(id => id !== server.id))
      setSelectedMCPServers(prev => prev.filter(s => s.id !== server.id))
    } else {
      setSelectedMCPIds(prev => [...prev, server.id])
      setSelectedMCPServers(prev => [...prev, server])
      // 选择技能后删除用户输入的 @ 符号
      removeAtSymbol()
    }
  }

  // 移除已选技能
  const handleRemoveSkill = (serverId: string) => {
    setSelectedMCPIds(prev => prev.filter(id => id !== serverId))
    setSelectedMCPServers(prev => prev.filter(s => s.id !== serverId))
  }

  // 处理应用选择（技能和应用互斥，选应用时清空技能）
  const handleAppSelect = (app: DialogApp) => {
    // 选择应用时，清空已选技能
    if (selectedMCPIds.length > 0) {
      setSelectedMCPIds([])
      setSelectedMCPServers([])
    }
    
    if (selectedAppIds.includes(app.id)) {
      setSelectedAppIds(prev => prev.filter(id => id !== app.id))
      setSelectedApps(prev => prev.filter(a => a.id !== app.id))
    } else {
      setSelectedAppIds(prev => [...prev, app.id])
      setSelectedApps(prev => [...prev, app])
      // 选择应用后删除用户输入的 @ 符号
      removeAtSymbol()
    }
  }

  // 移除已选应用
  const handleRemoveApp = (appId: string) => {
    setSelectedAppIds(prev => prev.filter(id => id !== appId))
    setSelectedApps(prev => prev.filter(a => a.id !== appId))
  }

  // 转换消息为 Bubble.List 格式
  const bubbleItems = useMemo(() => {
    const items = messages.map((msg) => ({
      key: msg.id,
      role: msg.role,
      content: msg.content || '',
      loading: false,
      placement: (msg.role === 'user' ? 'end' : 'start') as 'start' | 'end',
      avatar: msg.role === 'user' ? getUserAvatar() : getAssistantAvatar(),
      typing: false,
      timestamp: msg.timestamp,
      styles: msg.role === 'user' ? {
        content: {
          backgroundColor: 'var(--color-chat-bubble-user-bg)',
          color: 'var(--color-chat-bubble-user-text)',
          borderRadius: '18px',
          padding: '12px 16px',
          border: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
        }
      } : {
        content: {
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          padding: '0',
        }
      },
      contentRender: msg.role === 'assistant' ? (() => {
        const { thinkContent, mainContent, isThinking } = extractThinkContent(msg.content || '')
        return (
          <div className="space-y-4">
            {msg.parsedToolCalls && msg.parsedToolCalls.length > 0 && (
              <ToolCallRenderer
                toolCalls={msg.parsedToolCalls.map(call => ({
                  id: call.id || `${Date.now()}_${Math.random()}`,
                  name: call.name,
                  arguments: call.arguments || {},
                  result: call.result,
                  status: call.status || 'success',
                  timestamp: call.timestamp || new Date().toLocaleTimeString()
                }))}
                showTimestamp={true}
                collapsible={true}
              />
            )}
            {thinkContent && (
              <Think
                title={isThinking ? '正在思考...' : '思考完成'}
                loading={isThinking}
                defaultExpanded={false}
              >
                <div className="text-sm whitespace-pre-wrap text-text-secondary">
                  {thinkContent}
                </div>
              </Think>
            )}
            {mainContent && <StableMarkdown content={mainContent} />}
          </div>
        )
      }) : undefined,
    }))

    // 添加流式消息
    if (isStreaming && (streamingContent || streamingToolCalls.length > 0 || isToolAnalyzing)) {
      const { thinkContent, mainContent, isThinking } = extractThinkContent(streamingContent || '')
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
          }
        },
        contentRender: () => (
          <div className="space-y-4">
            {(isToolAnalyzing || streamingToolCalls.length > 0) && (
              <div className="rounded-lg p-3 bg-components-tool-call-bg border border-components-tool-call-border">
                <h4 className="text-sm font-medium mb-2 text-components-tool-call-title">
                  🛠️ 工具调用状态
                </h4>
                <ToolCallRenderer
                  toolCalls={streamingToolCalls}
                  isAnalyzing={isToolAnalyzing}
                  showTimestamp={true}
                  collapsible={false}
                />
              </div>
            )}
            {thinkContent && (
              <Think
                title={isThinking ? '正在思考...' : '思考完成'}
                loading={isThinking}
                defaultExpanded={isThinking}
                blink={isThinking}
              >
                <div className="text-sm whitespace-pre-wrap text-text-secondary">
                  {thinkContent}
                </div>
              </Think>
            )}
            {mainContent && mainContent.trim() && <StableMarkdown content={mainContent} />}
            {!thinkContent && !mainContent && !isToolAnalyzing && streamingToolCalls.length === 0 && (
              <span className="italic text-text-tertiary">正在生成...</span>
            )}
          </div>
        ),
      })
    }

    return items
  }, [messages, isStreaming, streamingContent, streamingToolCalls, isToolAnalyzing, getAssistantAvatar, getUserAvatar])

  // 是否显示欢迎界面
  const showWelcome = messages.length === 0 && !isStreaming

  // 问候语文本
  const greetingText = `${getGreeting()}！有哪些工作要处理？`

  return (
    <div className="h-full bg-background-subtle flex flex-col">
      {showWelcome ? (
        /* 欢迎界面 */
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 overflow-y-auto">
          <div className="w-full max-w-[1240px] flex flex-col items-center gap-8">
            {/* Header - 问候语（波浪式渐隐浮起） */}
            <div className="w-full flex flex-col items-center mb-12">
              <h1 className="text-[36px] font-semibold text-text-primary text-center">
                <WaveText text={greetingText} charDelay={35} duration={500} />
              </h1>
            </div>

            {/* InputSection - 输入区域 */}
            <div className="w-full max-w-[720px] flex flex-col gap-2">
            {/* 输入框 */}
            <div className="bg-components-card-bg rounded-2xl p-5 flex flex-col justify-between min-h-[110px] relative">
                {/* 已选技能和应用标签 */}
                {(selectedMCPServers.length > 0 || selectedApps.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* 已选技能 */}
                    {selectedMCPServers.map((server) => (
                      <div
                        key={`skill-${server.id}`}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-state-focus-subtle text-state-focus rounded-full text-xs font-medium"
                      >
                        {getServerIcon(server.server_type)}
                        <span>{server.name}</span>
                        <button
                          onClick={() => handleRemoveSkill(server.id)}
                          className="hover:bg-state-focus/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {/* 已选应用 */}
                    {selectedApps.map((app) => (
                      <div
                        key={`app-${app.id}`}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-state-success-subtle text-state-success rounded-full text-xs font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{app.name}</span>
                        <button
                          onClick={() => handleRemoveApp(app.id)}
                          className="hover:bg-state-success/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 文本输入区 */}
                <Textarea
                  ref={textareaRef}
                  variant="chat"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="给我发消息或布置任务"
                  className="w-full text-base placeholder:text-text-tertiary"
                  rows={1}
                />

                {/* 工具栏 */}
                <div className="flex items-center justify-between mt-3">
                  {/* 左侧图标 */}
                  <div className="flex items-center gap-2 relative">
                    <button
                      ref={atButtonRef as React.RefObject<HTMLButtonElement>}
                      onClick={() => setSkillPanelOpen(!skillPanelOpen)}
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
                        skillPanelOpen || selectedMCPIds.length > 0 || selectedAppIds.length > 0
                          ? "bg-state-focus-subtle text-state-focus"
                          : "hover:bg-background-subtle text-text-tertiary"
                      )}
                    >
                      <AtSign className="w-5 h-5" />
                    </button>
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-background-subtle transition-colors">
                      <Paperclip className="w-5 h-5 text-text-tertiary" />
                    </button>
                    <button className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-background-subtle transition-colors">
                      <Lightbulb className="w-5 h-5 text-text-tertiary" />
                    </button>

                    {/* 技能面板 - 欢迎界面向下弹出 */}
                    <SkillPanel
                      open={skillPanelOpen}
                      onClose={() => setSkillPanelOpen(false)}
                      onSelectSkill={handleSkillSelect}
                      onSelectApp={handleAppSelect}
                      selectedSkillIds={selectedMCPIds}
                      selectedAppIds={selectedAppIds}
                      anchorRef={atButtonRef as React.RefObject<HTMLElement>}
                      direction="down"
                    />
                  </div>

                  {/* 右侧：模型选择器 + 发送按钮 */}
                  <div className="flex items-center gap-3">
                    {/* 模型选择器 - 融入输入框风格 */}
                    <ChatModelSelector
                      models={myLLMs}
                      selectedModelName={selectedModelId}
                      onSelect={(modelName) => setSelectedModelId(modelName || '')}
                      loading={modelsLoading}
                      variant="minimal"
                      dropdownDirection="down"
                    />

                    {/* 发送按钮 */}
                    <button
                      onClick={handleSend}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        inputValue.trim()
                          ? "bg-text-primary hover:bg-text-secondary"
                          : "bg-border-default"
                      )}
                    >
                      <ArrowUp className={cn(
                        "w-5 h-5",
                        inputValue.trim() ? "text-text-inverted" : "text-text-tertiary"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TabsRow - 功能标签 */}
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {functionTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[15px] font-medium border transition-colors",
                    activeTab === tab.id
                      ? "bg-text-primary text-text-inverted border-text-primary"
                      : "bg-components-card-bg text-text-primary border-border-default hover:bg-background-subtle"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CardsSection - 推荐卡片 */}
            <div className="w-full flex gap-4 mt-20">
              {recommendCards.map((card) => (
                <div
                  key={card.id}
                  className={cn(
                    "group flex-1 rounded-2xl p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden h-[200px]",
                    card.bgColor
                  )}
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-components-recommend-card-text leading-relaxed">
                      {card.title}
                    </p>
                    {card.hasImage && card.imageUrl && (
                      <div className="w-full h-20 rounded-lg overflow-hidden">
                        <img
                          src={card.imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-components-recommend-card-tag text-right">
                    {card.tag}
                  </p>
                  
                  {/* 悬停时显示的聊一聊按钮 */}
                  <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                    <div className="h-px bg-border-subtle" />
                    <div className="p-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardClick(card.title)
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-text-primary text-text-inverted rounded-full text-sm font-medium hover:bg-text-secondary transition-colors"
                      >
                        <span className="text-base">✨</span>
                        聊一聊
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 对话界面 */
        <div className="flex-1 flex flex-col min-h-0">
          {/* 对话消息区域 */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6"
          >
            <div className="max-w-4xl mx-auto">
              <Bubble.List
                items={bubbleItems as Parameters<typeof Bubble.List>[0]['items']}
                autoScroll={true}
                style={{ minHeight: '100%', paddingBottom: '8px' }}
              />
            </div>
          </div>

          {/* 底部输入区域 */}
          <div className="flex-shrink-0 px-6 pb-6 pt-2">
            <div className="max-w-4xl mx-auto">
              <div className="bg-components-card-bg rounded-2xl p-4 relative">
                {/* 已选技能和应用标签 */}
                {(selectedMCPServers.length > 0 || selectedApps.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {/* 已选技能 */}
                    {selectedMCPServers.map((server) => (
                      <div
                        key={`skill-${server.id}`}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-state-focus-subtle text-state-focus rounded-full text-xs font-medium"
                      >
                        {getServerIcon(server.server_type)}
                        <span>{server.name}</span>
                        <button
                          onClick={() => handleRemoveSkill(server.id)}
                          className="hover:bg-state-focus/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {/* 已选应用 */}
                    {selectedApps.map((app) => (
                      <div
                        key={`app-${app.id}`}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-state-success-subtle text-state-success rounded-full text-xs font-medium"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{app.name}</span>
                        <button
                          onClick={() => handleRemoveApp(app.id)}
                          className="hover:bg-state-success/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 文本输入区 */}
                <Textarea
                  ref={textareaRef}
                  variant="chat"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="输入消息，按 Enter 发送"
                  className="w-full text-base placeholder:text-text-tertiary"
                  rows={1}
                  disabled={isStreaming}
                />

                {/* 工具栏 */}
                <div className="flex items-center justify-between mt-3">
                  {/* 左侧图标 */}
                  <div className="flex items-center gap-2 relative">
                    <button
                      ref={atButtonRef as React.RefObject<HTMLButtonElement>}
                      onClick={() => setSkillPanelOpen(!skillPanelOpen)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        skillPanelOpen || selectedMCPIds.length > 0 || selectedAppIds.length > 0
                          ? "bg-state-focus-subtle text-state-focus"
                          : "hover:bg-background-subtle text-text-tertiary"
                      )}
                      disabled={isStreaming}
                    >
                      <AtSign className="w-4 h-4" />
                    </button>
                    <button
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-background-subtle transition-colors"
                      disabled={isStreaming}
                    >
                      <Paperclip className="w-4 h-4 text-text-tertiary" />
                    </button>

                    {/* 技能面板 - 对话界面向上弹出 */}
                    <SkillPanel
                      open={skillPanelOpen}
                      onClose={() => setSkillPanelOpen(false)}
                      onSelectSkill={handleSkillSelect}
                      onSelectApp={handleAppSelect}
                      selectedSkillIds={selectedMCPIds}
                      selectedAppIds={selectedAppIds}
                      anchorRef={atButtonRef as React.RefObject<HTMLElement>}
                      direction="up"
                    />
                  </div>

                  {/* 右侧：模型选择器 + 发送/停止按钮 */}
                  <div className="flex items-center gap-3">
                    {/* 模型选择器 - 对话页面使用 minimal 样式，向上弹出 */}
                    <ChatModelSelector
                      models={myLLMs}
                      selectedModelName={selectedModelId}
                      onSelect={(modelName) => setSelectedModelId(modelName || '')}
                      loading={modelsLoading}
                      variant="minimal"
                      dropdownDirection="up"
                      disabled={isStreaming}
                    />

                    {/* 发送/停止按钮 */}
                    {isStreaming ? (
                      <button
                        onClick={handleStop}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-state-error text-text-inverted hover:bg-state-error/90 transition-colors"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSend}
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                          inputValue.trim()
                            ? "bg-text-primary hover:bg-text-secondary"
                            : "bg-border-default"
                        )}
                      >
                        <ArrowUp className={cn(
                          "w-4 h-4",
                          inputValue.trim() ? "text-text-inverted" : "text-text-tertiary"
                        )} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
