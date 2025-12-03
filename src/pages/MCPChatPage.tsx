import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";
import { Bubble } from "@ant-design/x";
import type { BubbleProps } from "@ant-design/x";
import { UserOutlined, RobotOutlined, CopyOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import { Typography, Button as AntdButton, Space } from 'antd';
import { ProviderIcon } from '@/components/ui/provider-icon';
import markdownit from "markdown-it";
import type { MCPChatServiceRequest } from "@/api/mcp-chat-service";
import { EnhancedSSEParser, type SSEMessage, type ToolCallInfo } from "@/components/chat/EnhancedSSEParser";
import { ToolCallRenderer } from "@/components/chat/ToolCallRenderer";
import { useModelStore } from "@/stores/model";
import { toast } from "@/lib/toast";
import { copyToClipboard } from "@/lib/utils";
import type { ChatSession, MCPChatConfig } from "@/types/mcp";

// 初始化 markdown-it
const md = markdownit({ html: true, breaks: true, linkify: true });

// Markdown 渲染函数 - 参考Ant Design X示例 - 移到组件外部避免重复创建
const renderMarkdown: BubbleProps['messageRender'] = (content) => {
  if (!content || typeof content !== 'string') return content;
  
  return (
    <Typography>
      <div 
        dangerouslySetInnerHTML={{ __html: md.render(content) }} 
        className="prose prose-sm max-w-none dark:prose-invert"
      />
    </Typography>
  );
};


// 创建初始会话数据
const createInitialSessions = (): ChatSession[] => {
  return [
    {
      id: Date.now().toString(),
      title: '新对话',
      timestamp: '刚刚',
      messages: []
    }
  ];
};

// 定义布局类型
type ChatLayout = 'default' | 'center' | 'full';

export default function MCPChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(createInitialSessions());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const initial = createInitialSessions();
    return initial[0]?.id || null;
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [chatLayout, setChatLayout] = useState<ChatLayout>('default');
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const isUserScrollingRef = useRef(false); // 使用ref避免闭包问题
  const bubbleListRef = useRef<any>(null);

  // 滚动处理函数
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const target = e.target as HTMLDivElement;
    // 增加容差值到50像素，因为有时候滚动可能不会完全到底
    const tolerance = 50;
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - tolerance;
    
    // 如果用户滚动到底部，则恢复自动滚动
    // 如果用户滚动离开底部，则暂停自动滚动
    const scrollingState = !isAtBottom;
    setIsUserScrolling(scrollingState);
    isUserScrollingRef.current = scrollingState; // 同时更新ref
    
    // 调试信息
    if (!isAtBottom) {
      console.log('User scrolling away from bottom:', { 
        scrollTop: target.scrollTop, 
        scrollHeight: target.scrollHeight, 
        clientHeight: target.clientHeight,
        distanceFromBottom: target.scrollHeight - (target.scrollTop + target.clientHeight)
      });
    }
  }, []);

  
  // 聊天输入相关状态
  const [inputValue, setInputValue] = useState('');
  const [submitType] = useState<'enter' | 'shiftEnter'>('enter');
  
  
  // MCP相关状态
  const [selectedMCPIds, setSelectedMCPIds] = useState<string[]>([]);
  const [mcpConfig, setMcpConfig] = useState<MCPChatConfig>({
    mcp_ids: [],
    mcp_timeout: 1000,
    verbose_tool_use: true
  });

  // 模型选择相关状态 - 使用真实的模型数据
  const { myLLMs, isLoading: modelsLoading, loadMyLLMs } = useModelStore();
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [temporaryChatEnabled, setTemporaryChatEnabled] = useState<boolean>(false);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // 加载和流式响应状态（保留用于其他功能）
  // const abortControllerRef = useRef<AbortController | null>(null);

  // 流式响应状态管理
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingToolCalls, setStreamingToolCalls] = useState<ToolCallInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isToolAnalyzing, setIsToolAnalyzing] = useState(false);
  
  // SSE解析器实例
  const sseParserRef = useRef<EnhancedSSEParser | null>(null);

  // 复制消息内容
  const handleCopy = async (content?: string, ev?: React.MouseEvent) => {
    try {
      let textToCopy = '';
      if (typeof content === 'string' && content.length >= 0) {
        textToCopy = content;
      }
      if (!textToCopy && ev) {
        let node: HTMLElement | null = ev.currentTarget as HTMLElement;
        let safety = 0;
        while (node && safety < 20) {
          const textEl = node.querySelector('.bubble-copy-text') as HTMLElement | null;
          if (textEl && textEl.innerText && textEl.innerText.trim()) {
            textToCopy = textEl.innerText.trim();
            break;
          }
          node = node.parentElement;
          safety += 1;
        }
      }
      if (!textToCopy || !textToCopy.trim()) {
        toast.error('内容为空');
        return;
      }
      await copyToClipboard(textToCopy);
      toast.success('已复制到剪贴板');
    } catch {
      toast.error('复制失败，请手动复制');
    }
  };

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

  // 根据布局配置角色样式
  const getRolesConfig = (layout: ChatLayout) => {
    // 获取当前选择模型的厂商图标
    const assistantIcon = selectedProviderName 
      ? <ProviderIcon provider={selectedProviderName} className="w-5 h-5" size={20} />
      : <RobotOutlined />;
    
    const baseRoles = {
      assistant: {
        placement: 'start' as const,
        avatar: { 
          icon: assistantIcon,
          style: { 
            background: 'var(--color-chat-bubble-assistant-avatar-bg)', 
            color: 'var(--color-chat-bubble-assistant-avatar-text)' 
          } 
        },
        typing: {
          step: 5,
          interval: 20,
        },
        styles: {
          content: {
            maxWidth: layout === 'full' ? '45%' : (layout === 'center' ? 600 : 600),
            backgroundColor: 'transparent',
            border: 'none',
            boxShadow: 'none',
            padding: '0',
            fontSize: '14px',
            lineHeight: '1.6',
          }
        },
        footer: (messageContext: any) => (
          <div style={{ marginTop: '8px' }}>
            <Space size={4}>
              <AntdButton
                type="text"
                size="small"
                onClick={(e) => handleCopy(typeof messageContext === 'string' ? messageContext : undefined, e as any)}
                icon={<CopyOutlined />}
                title="复制"
                style={{
                  height: '28px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary)',
                  border: 'none',
                  background: 'transparent'
                }}
              />
              <AntdButton
                type="text"
                size="small"
                onClick={() => toast.success('感谢您的反馈')}
                icon={<LikeOutlined />}
                title="点赞"
                style={{
                  height: '28px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary)',
                  border: 'none',
                  background: 'transparent'
                }}
              />
              <AntdButton
                type="text"
                size="small"
                onClick={() => toast.info('我们会努力改进')}
                icon={<DislikeOutlined />}
                title="点踩"
                style={{
                  height: '28px',
                  padding: '0 8px',
                  fontSize: '12px',
                  color: 'var(--color-text-tertiary)',
                  border: 'none',
                  background: 'transparent'
                }}
              />
            </Space>
          </div>
        ),
      },
      user: {
        placement: 'end' as const,
        avatar: { 
          icon: <UserOutlined />, 
          style: { 
            background: 'var(--color-chat-bubble-user-avatar-bg)', 
            color: 'var(--color-chat-bubble-user-avatar-text)' 
          } 
        },
        styles: {
          content: {
            maxWidth: layout === 'full' ? '45%' : (layout === 'center' ? 600 : 600),
            backgroundColor: 'var(--color-chat-bubble-user-bg)',
            color: 'var(--color-chat-bubble-user-text)',
            borderRadius: '18px',
            padding: '12px 16px',
            border: 'none',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
          }
        },
        footer: (messageContext: string) => (
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
            <AntdButton
              type="text"
              size="small"
              onClick={(e) => handleCopy(messageContext, e as any)}
              icon={<CopyOutlined />}
              title="复制"
              style={{
                height: '28px',
                padding: '0 8px',
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                border: 'none',
                background: 'transparent'
              }}
            />
          </div>
        ),
      },
    };

    return baseRoles;
  };

  // 转换消息数据为 Bubble.List 需要的格式
  const bubbleItems = React.useMemo(() => {
    // 获取历史消息（如果存在）
    const sessionMessages = activeSession?.messages ? activeSession.messages.map((msg, index) => ({
      key: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content || '',
      loading: false,
      // 只对最新的助手消息启用打字效果（且不在流式输出时）
      typing: msg.role === 'assistant' &&
              index === activeSession.messages.length - 1 &&
              !isStreaming ? { step: 50, interval: 10 } : false,
      timestamp: msg.timestamp,
      // 助手消息：在自定义 messageRender 中渲染工具卡片 + Markdown
      messageRender: msg.role === 'assistant' ? ((content: string) => (
        <div className="space-y-4">
          {msg.parsedToolCalls && msg.parsedToolCalls.length > 0 && (
            <ToolCallRenderer
              toolCalls={msg.parsedToolCalls.map(call => ({
                id: call.id || `${Date.now()}_${Math.random()}`,
                name: call.name,
                arguments: call.args || call.arguments || {},
                result: call.result,
                status: call.status || 'success',
                timestamp: call.timestamp || new Date().toLocaleTimeString()
              }))}
              showTimestamp={true}
              collapsible={true}
            />
          )}
          <div
            dangerouslySetInnerHTML={{ __html: md.render(content || '') }}
            className="prose prose-sm max-w-none dark:prose-invert bubble-copy-text"
          />
        </div>
      )) : undefined,
      toolCalls: undefined,
    })) : [];
    
    // 如果正在流式输出，添加流式消息（只添加一次）
    if (isStreaming && (streamingContent || streamingToolCalls.length > 0 || isToolAnalyzing)) {
          // 检查是否已经有流式消息，避免重复添加
    const hasExistingStreamingMessage = sessionMessages.some(msg => msg.key === 'streaming-assistant');
    
    console.log('🎯 Adding streaming message:', { 
      contentLength: streamingContent?.length, 
      toolCallsCount: streamingToolCalls.length, 
      isToolAnalyzing,
      sessionMessagesLength: sessionMessages.length,
      hasExistingStreamingMessage
    });
    
    if (hasExistingStreamingMessage) {
      console.log('⚠️ Streaming message already exists, skipping duplicate');
      return sessionMessages;
    }
      
      // 检查是否有工具调用需要显示
      const hasToolCalls = streamingToolCalls.length > 0;
      
      // 使用字符串内容 + 自定义 messageRender，保证复制为原始 Markdown
      sessionMessages.push({
        key: 'streaming-assistant',
        role: 'assistant',
        content: streamingContent || '',
        loading: false,
        typing: false,
        timestamp: new Date().toLocaleTimeString(),
        messageRender: (content: string) => (
          <div className="space-y-4">
            {(isToolAnalyzing || streamingToolCalls.length > 0) && (
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">🛠️ 工具调用状态</h4>
                <ToolCallRenderer
                  toolCalls={streamingToolCalls}
                  isAnalyzing={isToolAnalyzing}
                  showTimestamp={true}
                  collapsible={false}
                />
              </div>
            )}
            {content && content.trim() && (
              <div
                dangerouslySetInnerHTML={{ __html: md.render(content) }}
                className="prose prose-sm max-w-none dark:prose-invert bubble-copy-text"
              />
            )}
          </div>
        ),
        toolCalls: undefined,
      });
    }
    
    return sessionMessages;
  }, [activeSessionId, activeSession?.messages?.length, isStreaming, streamingContent, streamingToolCalls, isToolAnalyzing]);

  // 加载模型列表
  useEffect(() => {
    if (Object.keys(myLLMs || {}).length === 0 && !modelsLoading) {
      console.log('Loading models...');
      loadMyLLMs();
    }
  }, [loadMyLLMs, myLLMs, modelsLoading]);

  // 当消息更新时自动滚动到底部（仅在用户未手动滚动时）
  useEffect(() => {
    // 如果用户正在查看历史消息，不自动滚动
    if (isUserScrolling) {
      return;
    }

    // 使用多个延迟确保DOM完全更新
    const timers: NodeJS.Timeout[] = [];
    
    // 立即尝试滚动
    const scrollToBottom = () => {
      const scrollContainer = document.getElementById('chat-scroll-container');
      if (scrollContainer) {
        const { scrollHeight, clientHeight } = scrollContainer;
        // 确保滚动到真正的底部
        scrollContainer.scrollTo({
          top: scrollHeight - clientHeight,
          behavior: 'smooth'
        });
      }
    };

    // 多次尝试滚动，确保内容完全渲染
    timers.push(setTimeout(scrollToBottom, 0));    // 立即
    timers.push(setTimeout(scrollToBottom, 100));  // 100ms后
    timers.push(setTimeout(scrollToBottom, 300));  // 300ms后（用于处理图片等异步内容）

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [activeSession?.messages?.length, streamingContent, isUserScrolling]);

  // 使用ResizeObserver监听内容区域的大小变化
  useEffect(() => {
    const scrollContainer = document.getElementById('chat-scroll-container');
    if (!scrollContainer) return;

    const resizeObserver = new ResizeObserver(() => {
      // 内容区域大小变化时，如果不在用户滚动状态，则滚动到底部
      if (!isUserScrolling) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTo({
            top: scrollContainer.scrollHeight,
            behavior: 'smooth'
          });
        });
      }
    });

    // 观察滚动容器的第一个子元素（内容容器）
    const contentContainer = scrollContainer.firstElementChild;
    if (contentContainer) {
      resizeObserver.observe(contentContainer);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [isUserScrolling]);

  // 自动选择第一个可用的聊天模型
  useEffect(() => {
    if (!selectedModelId && !modelsLoading && myLLMs && Object.keys(myLLMs).length > 0) {
      // 找到第一个可用的聊天模型
      for (const [, provider] of Object.entries(myLLMs)) {
        if (provider && provider.llm && Array.isArray(provider.llm)) {
          const chatModel = provider.llm.find(model => 
            model && model.type === 'chat' && model.name
          );
          if (chatModel) {
            setSelectedModelId(chatModel.name);
            break;
          }
        }
      }
    }
  }, [selectedModelId, modelsLoading, myLLMs]);


  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: '新对话',
      timestamp: '刚刚',
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleMCPSelectionChange = (selectedIds: string[], config: MCPChatConfig) => {
    setSelectedMCPIds(selectedIds);
    setMcpConfig({ ...config, mcp_ids: selectedIds });
  };

  // 发送消息函数 - 使用自定义流式处理
  const handleSendMessage = useCallback(async (content: string) => {    
    if (!activeSessionId) {
      handleNewChat();
      return;
    }

    // 检查是否选择了模型
    if (!selectedModelId) {
      toast.error('请先选择一个聊天模型');
      return;
    }

    // 发送新消息时，重置滚动状态，确保能看到新消息
    setIsUserScrolling(false);
    isUserScrollingRef.current = false;
    
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingToolCalls([]);
    setIsToolAnalyzing(false);

    try {
      // 添加用户消息到会话
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: content,
        timestamp: new Date().toLocaleTimeString(),
      };

      setSessions(prev => prev.map(session => 
        session.id === activeSessionId 
          ? { ...session, messages: [...session.messages, userMessage] }
          : session
      ));

      // 获取当前会话的历史消息
      const currentSession = sessions.find(s => s.id === activeSessionId);
      const historyMessages = currentSession?.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })) || [];

      // 添加当前用户消息
      const allMessages = [...historyMessages, {
        role: 'user' as const,
        content: content
      }];

      // 构建请求参数
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
        structured_output: selectedMCPIds.length > 0 // 根据是否有MCP工具自动设置结构化输出
      };

      // 初始化增强SSE解析器
      const parser = new EnhancedSSEParser();
      sseParserRef.current = parser;

      // 使用增强SSE解析器处理流式响应  
      await parser.connect(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/v1/llm/enhanced_chat_sse`,
        request,
        (message: SSEMessage, parserState) => {
          // 添加调试信息
          console.log('🔄 SSE Message received:', message.type);
          if (message.type === 'text') {
            console.log('📝 Text content length:', parserState.accumulatedText?.length);
          } else if (message.type === 'tool_call') {
            console.log('🛠️ Tool call:', message.content);
          } else if (message.type === 'tool_result') {
            console.log('✅ Tool result:', message.content);
          }
          console.log('📊 Parser state - Tools:', parserState.toolCalls.length, 'Analyzing:', parserState.isToolAnalyzing);
          
          // 使用flushSync确保即时更新
          flushSync(() => {
            switch (message.type) {
              case 'text':
                setStreamingContent(parserState.accumulatedText);
                break;

              case 'tool_call':
                // 工具调用开始，更新工具列表
                setStreamingToolCalls([...parserState.toolCalls]);
                break;

              case 'tool_result':
                // 工具结果返回，更新工具列表
                setStreamingToolCalls([...parserState.toolCalls]);
                break;

              case 'tool_start':
                setIsToolAnalyzing(true);
                break;

              case 'tool_end':
                setIsToolAnalyzing(false);
                break;

              case 'complete':
                // 流结束，保存消息
                const assistantMessage = {
                  id: Date.now().toString(),
                  role: 'assistant' as const,
                  content: parserState.accumulatedText,
                  timestamp: new Date().toLocaleTimeString(),
                  parsedToolCalls: parserState.toolCalls.map(call => ({
                    id: call.id,
                    name: call.name,
                    args: call.arguments || {},
                    result: call.result || '',
                    status: call.status,
                    timestamp: call.timestamp
                  })),
                };

                setSessions(prev => prev.map(session => 
                  session.id === activeSessionId 
                    ? { ...session, messages: [...session.messages, assistantMessage] }
                    : session
                ));
                break;

              case 'error':
                const errorMsg = message.content as any;
                throw new Error(errorMsg.error || 'Unknown error');
            }
          });

          // 自动滚动到底部
          if (!isUserScrollingRef.current) {
            requestAnimationFrame(() => {
              const scrollContainer = document.getElementById('chat-scroll-container');
              if (scrollContainer) {
                scrollContainer.scrollTo({
                  top: scrollContainer.scrollHeight,
                  behavior: 'smooth'
                });
              }
            });
          }
        },
        (error) => {
          console.error('Enhanced SSE Parser error:', error);
          toast.error(error.message || '连接出错');
        }
      );
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      // 清理状态和连接
      if (sseParserRef.current) {
        sseParserRef.current.disconnect();
        sseParserRef.current = null;
      }
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
      setStreamingToolCalls([]);
      setIsToolAnalyzing(false);
    }
  }, [activeSessionId, selectedModelId, selectedMCPIds, mcpConfig, sessions, handleNewChat]);

  // 组件卸载时清理SSE连接
  useEffect(() => {
    return () => {
      if (sseParserRef.current) {
        sseParserRef.current.disconnect();
        sseParserRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mcp-chat-page h-screen flex overflow-hidden" style={{ backgroundColor: 'var(--color-chat-content-bg)' }}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - 现代化的半透明设计 */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-all duration-300 ease-out
        fixed md:relative z-50 md:z-0 h-full
        w-80 md:w-80 flex-shrink-0
      `} style={{
        backgroundColor: 'var(--color-components-sidebar-bg)',
        borderRight: '1px solid var(--color-components-sidebar-border)',
        backdropFilter: 'var(--color-components-sidebar-backdrop)'
      }}>
        <ChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSessionSelect={(id) => {
            setActiveSessionId(id);
            setIsMobileMenuOpen(false);
          }}
          onNewChat={handleNewChat}
          temporaryChatEnabled={temporaryChatEnabled}
        />
      </div>

      {/* Main Content - 统一背景的主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Header - 半透明效果 */}
        <div 
          className="flex-shrink-0 relative z-10" 
          style={{
            backgroundColor: 'var(--color-chat-header-bg)',
            borderBottom: '1px solid var(--color-chat-header-border)',
            backdropFilter: 'var(--color-chat-header-backdrop)',
            WebkitBackdropFilter: 'var(--color-chat-header-backdrop)'
          }}
        >
          <ChatHeader 
            onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            isMobileMenuOpen={isMobileMenuOpen}
            selectedMCPIds={selectedMCPIds}
            mcpConfig={mcpConfig}
            onMCPSelectionChange={handleMCPSelectionChange}
            selectedModelId={selectedModelId}
            onModelChange={setSelectedModelId}
            temporaryChatEnabled={temporaryChatEnabled}
            onTemporaryChatChange={setTemporaryChatEnabled}
            models={myLLMs}
            modelsLoading={modelsLoading}
            chatLayout={chatLayout}
            onLayoutChange={setChatLayout}
          />
        </div>
        
        {/* Chat Area - 使用 Bubble.List 的聊天区域 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div 
            className="flex-1 overflow-y-auto p-6"
            onScroll={handleScroll}
            id="chat-scroll-container"
          >
            {bubbleItems.length > 0 ? (
              <div className={`${chatLayout === 'full' ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
                <Bubble.List
                  items={bubbleItems}
                  ref={bubbleListRef}
                  autoScroll={!isUserScrolling}
                  roles={getRolesConfig(chatLayout)}
                  style={{ 
                    minHeight: '100%',
                    paddingBottom: '8px' // 给底部留出一些空间，更紧凑的过渡
                  }}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <WelcomeMessage />
              </div>
            )}
          </div>

          {/* ChatInput - 固定在底部但不遮挡内容 */}
          <div className="flex-shrink-0 px-6 pb-6 pt-2">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={(message) => {
                  setInputValue('');
                  handleSendMessage(message);
                }}
                loading={isLoading}
                disabled={isLoading}
                floating={true}
                autoSize={{ minRows: 1, maxRows: 6 }}
                allowSpeech={{
                  enabled: true,
                  continuous: true,
                  interimResults: true,
                  language: 'zh-CN'
                }}
                onPasteFile={(firstFile, files) => {
                  console.log('粘贴文件:', firstFile, files);
                }}
                submitType={submitType}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}