import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { flushSync } from "react-dom";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";
import { Bubble, Think, Sender, Attachments } from "@ant-design/x";
import type { BubbleProps } from "@ant-design/x";
import { User, Bot, Paperclip, Square, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProviderIcon } from '@/components/ui/provider-icon';
import XMarkdown, { type ComponentProps } from '@ant-design/x-markdown';
import '@ant-design/x-markdown/dist/x-markdown.css';
import type { MCPChatServiceRequest } from "@/api/mcp-chat-service";
import { EnhancedSSEParser, type SSEMessage, type ToolCallInfo } from "@/components/chat/EnhancedSSEParser";
import { ToolCallRenderer } from "@/components/chat/ToolCallRenderer";
import { useModelStore } from "@/stores/model";
import { useMcpUpload } from "@/hooks/use-mcp-upload";
import { toast } from "@/lib/toast";
import { cn, copyToClipboard } from "@/lib/utils";
import { uploadConfig, type UploadFile } from "@/config/chat";
import type { ChatSession, MCPChatConfig } from "@/types/mcp";

// Think 组件 - 处理 <think> 标签
const ThinkComponent = React.memo((props: ComponentProps) => {
  const [title, setTitle] = React.useState('正在思考...')
  const [loading, setLoading] = React.useState(true)
  const [expand, setExpand] = React.useState(true)

  React.useEffect(() => {
    if (props.streamStatus === 'done') {
      setTitle('思考完成')
      setLoading(false)
      setExpand(false)
    }
  }, [props.streamStatus])

  return (
    <Think 
      title={title} 
      loading={loading} 
      expanded={expand} 
      onClick={() => setExpand(!expand)}
    >
      <div className="text-gray-600 text-sm whitespace-pre-wrap">
        {props.children}
      </div>
    </Think>
  )
})

// 稳定的 Markdown 渲染组件 - 避免 XMarkdown 内部状态更新导致无限循环
const StableMarkdown = React.memo(({ content }: { content: string }) => {
  // 使用 ref 存储最后稳定的内容，避免频繁更新触发 XMarkdown 内部状态循环
  const stableContentRef = React.useRef(content)
  const [stableContent, setStableContent] = React.useState(content)
  
  // 使用 debounce 效果，避免流式输出时过于频繁的更新
  React.useEffect(() => {
    // 只有内容真正变化时才更新
    if (content !== stableContentRef.current) {
      stableContentRef.current = content
      // 使用 RAF 来批量处理更新，避免过于频繁的渲染
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
  // 自定义比较函数，只有内容长度变化超过阈值或内容完全相同时才重新渲染
  // 这可以减少流式输出时的渲染次数
  if (prevProps.content === nextProps.content) return true
  // 如果内容变化不大（小于 10 个字符），跳过更新
  const diff = Math.abs((nextProps.content?.length || 0) - (prevProps.content?.length || 0))
  return diff < 10 && nextProps.content?.startsWith(prevProps.content || '')
})

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
  
  // 检查是否有开始标签
  const hasOpenTag = content.includes('<think>') || content.includes('<thinking>')
  const hasCloseTag = content.includes('</think>') || content.includes('</thinking>')
  
  if (hasOpenTag && !hasCloseTag) {
    // 提取 <think> 标签后的内容
    const openMatch = content.match(/<think(?:ing)?>([\s\S]*)/)
    const afterTag = openMatch ? openMatch[1] : ''
    
    // 后端可能不返回 </think> 闭合标签，而是用双换行分隔思考和主内容
    // 格式: <think>\n思考内容\n\n\n主内容 或 <think>\n思考内容\n\n主内容
    // 检查是否有双换行（2个或更多连续换行），表示思考已完成
    const doubleNewlineMatch = afterTag.match(/^([\s\S]*?)\n\n+(\S[\s\S]*)$/)
    
    if (doubleNewlineMatch) {
      // 有双换行分隔，说明思考已完成，后面是主内容
      return {
        thinkContent: doubleNewlineMatch[1].trim(),
        mainContent: doubleNewlineMatch[2].trim(),
        isThinking: false,
        status: 'complete'
      }
    }
    
    // 没有双换行分隔，还在思考中
    return {
      thinkContent: afterTag.trim(),
      mainContent: '',
      isThinking: true,
      status: 'thinking'
    }
  }
  
  // 没有 think 标签
  return { thinkContent: '', mainContent: content, isThinking: false, status: 'none' }
}


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
  
  
  // MCP相关状态
  const [selectedMCPIds, setSelectedMCPIds] = useState<string[]>([]);
  const [mcpConfig, setMcpConfig] = useState<MCPChatConfig>({
    mcp_ids: [],
    mcp_timeout: 1000,
    verbose_tool_use: true
  });

  // 文件上传面板状态（参考 ExplorePage）
  const [headerOpen, setHeaderOpen] = useState(false);
  
  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const dropContainerRef = useRef<HTMLDivElement>(null);
  const dragCounterRef = useRef(0);
  
  // 文件上传 Hook（使用 MCP 专用的 upload_info 接口）
  const {
    files: uploadFiles,
    uploading: isUploading,
    upload: uploadFile,
    removeFile: removeUploadFile,
    clearFiles: clearUploadFiles,
    getFileIds,
    setFiles: setUploadFiles,
  } = useMcpUpload();
  
  // 全局拖拽事件处理
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragging(true);
        setHeaderOpen(true); // 自动打开上传面板
      }
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
      }
    };
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      
      // 文件会由 Attachments 组件处理
    };
    
    const container = dropContainerRef.current;
    if (container) {
      container.addEventListener('dragenter', handleDragEnter);
      container.addEventListener('dragleave', handleDragLeave);
      container.addEventListener('dragover', handleDragOver);
      container.addEventListener('drop', handleDrop);
      
      return () => {
        container.removeEventListener('dragenter', handleDragEnter);
        container.removeEventListener('dragleave', handleDragLeave);
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

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

  // 获取 AI 头像 - 直接使用厂商 logo，不包裹气泡框
  const getAssistantAvatar = () => {
    if (selectedProviderName) {
      return <ProviderIcon provider={selectedProviderName} className="w-8 h-8" size={32} />
    }
    // 没有厂商信息时使用默认图标
    return (
      <div 
        className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center flex-shrink-0"
        style={{ 
          background: 'var(--color-chat-bubble-assistant-avatar-bg)', 
          color: 'var(--color-chat-bubble-assistant-avatar-text)' 
        }}
      >
        <Bot className="h-4 w-4" />
      </div>
    )
  }

  // 获取用户头像
  const getUserAvatar = () => (
    <div 
      className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center flex-shrink-0"
      style={{ 
        background: 'var(--color-chat-bubble-user-avatar-bg)', 
        color: 'var(--color-chat-bubble-user-avatar-text)' 
      }}
    >
      <User className="h-4 w-4" />
    </div>
  )

  // 转换消息数据为 Bubble.List 需要的格式
  const bubbleItems = React.useMemo(() => {
    // 获取历史消息（如果存在）
    const sessionMessages = activeSession?.messages ? activeSession.messages.map((msg, index) => ({
      key: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content || '',
      loading: false,
      // 设置消息位置：用户消息在右边，AI 消息在左边
      placement: (msg.role === 'user' ? 'end' : 'start') as 'start' | 'end',
      // 设置头像
      avatar: msg.role === 'user' ? getUserAvatar() : getAssistantAvatar(),
      // 只对最新的助手消息启用打字效果（且不在流式输出时）
      typing: msg.role === 'assistant' &&
              index === activeSession.messages.length - 1 &&
              !isStreaming ? { step: 50, interval: 10 } : false,
      timestamp: msg.timestamp,
      // 消息样式
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
      // 助手消息：使用 contentRender 渲染工具卡片 + XMarkdown（支持 think 标签）
      contentRender: msg.role === 'assistant' ? (() => {
        const { thinkContent, mainContent, isThinking } = extractThinkContent(msg.content || '')
        return (
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
            {/* Think 组件展示思考过程 */}
            {thinkContent && (
              <Think
                title={isThinking ? '正在思考...' : '思考完成'}
                loading={isThinking}
                defaultExpanded={false}
              >
                <div className="text-gray-600 text-sm whitespace-pre-wrap">
                  {thinkContent}
                </div>
              </Think>
            )}
            {/* 使用稳定的 Markdown 组件渲染主内容 */}
            {mainContent && (
              <StableMarkdown content={mainContent} />
            )}
          </div>
        )
      }) : undefined,
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
      
      // 使用字符串内容 + 自定义 contentRender，支持 think 标签
      const { thinkContent, mainContent, isThinking } = extractThinkContent(streamingContent || '')
      sessionMessages.push({
        key: 'streaming-assistant',
        role: 'assistant',
        content: streamingContent || '',
        loading: false,
        typing: false,
        timestamp: new Date().toLocaleTimeString(),
        // 设置消息位置：AI 消息在左边
        placement: 'start' as const,
        // 设置 AI 头像
        avatar: getAssistantAvatar(),
        // 消息样式
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
            {/* Think 组件展示思考过程 */}
            {thinkContent && (
              <Think
                title={isThinking ? '正在思考...' : '思考完成'}
                loading={isThinking}
                defaultExpanded={isThinking}
                blink={isThinking}
              >
                <div className="text-gray-600 text-sm whitespace-pre-wrap">
                  {thinkContent}
                </div>
              </Think>
            )}
            {/* 使用稳定的 Markdown 组件渲染主内容 */}
            {mainContent && mainContent.trim() && (
              <StableMarkdown content={mainContent} />
            )}
            {/* 如果没有内容且没有思考内容，显示加载提示 */}
            {!thinkContent && !mainContent && !isToolAnalyzing && streamingToolCalls.length === 0 && (
              <span className="text-gray-400 italic">正在生成...</span>
            )}
          </div>
        ),
        toolCalls: undefined,
      });
    }
    
    return sessionMessages;
  }, [activeSessionId, activeSession?.messages?.length, isStreaming, streamingContent, streamingToolCalls, isToolAnalyzing, selectedProviderName]);

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

      // 获取已上传文件的 ID 列表
      const fileIds = getFileIds();
      
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
        files: fileIds, // 传递已上传文件的 ID 列表
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
  }, [activeSessionId, selectedModelId, selectedMCPIds, mcpConfig, sessions, handleNewChat, getFileIds]);

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
    <div 
      ref={dropContainerRef}
      className="mcp-chat-page h-screen flex overflow-hidden" 
      style={{ backgroundColor: 'var(--color-chat-content-bg)' }}
    >
      {/* 全屏拖拽指示器 */}
      {isDragging && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          style={{ 
            backgroundColor: 'rgba(var(--color-surface-primary-rgb, 0, 0, 0), 0.6)',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="flex flex-col items-center gap-4 p-8 rounded-2xl"
            style={{ 
              backgroundColor: 'var(--color-components-card-bg)',
              border: '3px dashed var(--color-border-accent)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}
          >
            <Upload className="w-16 h-16" style={{ color: 'var(--color-text-accent)' }} />
            <div className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
              释放以上传文件
            </div>
            <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              支持图片、文档等格式
            </div>
          </div>
        </div>
      )}
      
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
                  items={bubbleItems as any}
                  ref={bubbleListRef}
                  autoScroll={!isUserScrolling}
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

          {/* 输入区域（参考 ExplorePage 重构） */}
          <div className="flex-shrink-0 px-6 pb-6 pt-2">
            <div 
              className={cn(
                "mx-auto mcp-sender-area rounded-2xl overflow-hidden",
                chatLayout === 'full' ? 'max-w-none px-4' : 'max-w-4xl'
              )}
              style={{
                border: '1px solid var(--color-components-input-border)',
                backgroundColor: 'var(--color-components-input-bg)',
              }}
            >
                    {/* Sender 和 Attachments 样式覆盖 */}
                    <style>{`
                      /* Sender 输入框样式 - 现代化无高亮设计，边框在外层容器 */
                      .mcp-sender-area .ant-sender {
                        background-color: transparent !important;
                        border: none !important;
                        box-shadow: none !important;
                        outline: none !important;
                        padding-bottom: 0 !important;
                      }
                      .mcp-sender-area .ant-sender:hover {
                        border: none !important;
                      }
                      .mcp-sender-area .ant-sender:focus-within {
                        border: none !important;
                        box-shadow: none !important;
                        outline: none !important;
                      }
                      .mcp-sender-area .ant-sender-content {
                        background-color: transparent !important;
                        padding-bottom: 0 !important;
                      }
                      /* 移除 Sender 内部可能的分隔线和边距 */
                      .mcp-sender-area .ant-sender-actions {
                        border-top: none !important;
                        padding-top: 0 !important;
                        margin-top: 0 !important;
                      }
                      .mcp-sender-area .ant-sender textarea,
                      .mcp-sender-area .ant-sender input,
                      .mcp-sender-area .ant-sender .ant-input,
                      .mcp-sender-area .ant-sender textarea.ant-input,
                      .mcp-sender-area .ant-input-borderless,
                      .mcp-sender-area textarea.ant-input-borderless {
                        color: var(--color-components-input-text) !important;
                        background-color: transparent !important;
                        background: transparent !important;
                        outline: none !important;
                        box-shadow: none !important;
                        padding-left: 4px !important;
                      }
                      .mcp-sender-area .ant-sender textarea:focus,
                      .mcp-sender-area .ant-sender input:focus,
                      .mcp-sender-area .ant-sender .ant-input:focus,
                      .mcp-sender-area .ant-input-borderless:focus {
                        outline: none !important;
                        box-shadow: none !important;
                        background-color: transparent !important;
                        background: transparent !important;
                      }
                      .mcp-sender-area .ant-sender textarea::placeholder,
                      .mcp-sender-area .ant-sender input::placeholder,
                      .mcp-sender-area .ant-input::placeholder {
                        color: var(--color-components-input-text-placeholder) !important;
                      }
                      /* 发送按钮样式 - 移动到工具栏区域 */
                      .mcp-sender-area .ant-sender-actions-btn {
                        background-color: var(--color-components-button-primary-bg) !important;
                        color: var(--color-components-button-primary-text) !important;
                        border: none !important;
                      }
                      .mcp-sender-area .ant-sender-actions-btn:hover {
                        background-color: var(--color-components-button-primary-bg-hover) !important;
                      }
                      .mcp-sender-area .ant-sender-actions-btn:disabled {
                        background-color: var(--color-components-button-primary-bg-disabled) !important;
                        color: var(--color-components-button-primary-text-disabled) !important;
                      }
                      /* 当 Header 打开时，Sender 顶部不要圆角 */
                      .mcp-sender-area .ant-sender-header ~ .ant-sender,
                      .mcp-sender-area .ant-sender-header + .ant-sender {
                        border-radius: 0 !important;
                        border-top: none !important;
                      }
                /* 关闭按钮 - 现代化圆形设计 */
                .mcp-sender-area .ant-sender-header-close,
                .mcp-sender-area [class*="sender-header"] button,
                .mcp-sender-area [class*="header-close"] {
                  color: var(--color-text-tertiary) !important;
                  background-color: transparent !important;
                  border-color: transparent !important;
                  border-radius: 8px !important;
                  width: 32px !important;
                  height: 32px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  transition: all 0.2s ease !important;
                }
                .mcp-sender-area .ant-sender-header-close:hover,
                .mcp-sender-area [class*="sender-header"] button:hover,
                .mcp-sender-area [class*="header-close"]:hover {
                  color: var(--color-text-primary) !important;
                  background-color: var(--color-state-hover) !important;
                }
                /* 标题栏整体样式优化 */
                .mcp-sender-area .ant-sender-header {
                  padding: 12px 16px !important;
                  border-bottom: 1px solid var(--color-border-default) !important;
                }
                .mcp-sender-area .ant-sender-header-title {
                  font-weight: 500 !important;
                  font-size: 14px !important;
                  color: var(--color-text-primary) !important;
                  display: flex !important;
                  align-items: center !important;
                  gap: 8px !important;
                }
                /* Attachments 容器背景 - 简洁设计 */
                .mcp-sender-area .ant-attachments {
                  background-color: var(--color-components-card-bg) !important;
                }
                /* 移除内层多余边框 */
                .mcp-sender-area .ant-attachment-placeholder,
                .mcp-sender-area .ant-attachment-placeholder-inner {
                  border: none !important;
                  background: transparent !important;
                  padding: 0 !important;
                  margin: 0 !important;
                }
                /* 悬停效果 */
                .mcp-sender-area .ant-attachments:hover {
                  background-color: var(--color-state-hover) !important;
                }
                /* 已上传文件列表项 */
                .mcp-sender-area .ant-attachments-list-item {
                  background-color: var(--color-components-input-bg) !important;
                  border: 1px solid var(--color-border-default) !important;
                  border-radius: 8px !important;
                  transition: all 0.2s ease !important;
                }
                .mcp-sender-area .ant-attachments-list-item:hover {
                  background-color: var(--color-components-input-bg-hover) !important;
                  border-color: var(--color-border-accent) !important;
                }
                .mcp-sender-area .ant-attachments-list-item-name {
                  color: var(--color-text-primary) !important;
                }
              `}</style>
              
              <Sender
                value={inputValue}
                onChange={setInputValue}
                placeholder="输入消息，按 Enter 发送"
                loading={isStreaming}
                // 文件上传面板
                header={
                  <Sender.Header
                    title={
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        color: 'var(--color-text-primary)',
                        fontWeight: 500,
                        fontSize: '14px',
                      }}>
                        <Upload className="w-4 h-4" style={{ color: 'var(--color-state-focus)' }} />
                        上传文件
                      </span>
                    }
                    open={headerOpen}
                    onOpenChange={setHeaderOpen}
                    styles={{
                      header: {
                        backgroundColor: 'var(--color-components-card-bg)',
                        borderRadius: '16px 16px 0 0',
                        border: 'none',
                        borderBottom: '1px solid var(--color-border-default)',
                        padding: '12px 16px',
                      },
                      content: {
                        padding: 0,
                        backgroundColor: 'var(--color-components-card-bg)',
                        border: 'none',
                      },
                    }}
                  >
                    <Attachments
                      items={uploadFiles as any}
                      maxCount={uploadConfig.maxCount}
                      getDropContainer={() => dropContainerRef.current}
                      onChange={(info) => {
                        // 处理 Attachments 组件的文件变化
                        if (info && Array.isArray(info)) {
                          setUploadFiles(info as UploadFile[])
                        }
                      }}
                      onRemove={(file) => {
                        if (file && typeof file === 'object' && 'uid' in file) {
                          removeUploadFile((file as UploadFile).uid)
                        }
                      }}
                      overflow="scrollX"
                      placeholder={(type) => ({
                        icon: (
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            backgroundColor: type === 'drop' ? 'var(--color-state-focus-10)' : 'var(--color-surface-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '12px',
                            transition: 'all 0.2s ease',
                          }}>
                            <Upload 
                              className="w-5 h-5" 
                              style={{ 
                                color: type === 'drop' ? 'var(--color-state-focus)' : 'var(--color-text-tertiary)',
                                transition: 'color 0.2s ease',
                              }} 
                            />
                          </div>
                        ),
                        title: (
                          <span style={{ 
                            color: 'var(--color-text-primary)', 
                            fontWeight: 500,
                            fontSize: '14px',
                          }}>
                            {type === 'drop' ? '释放以上传' : '点击或拖拽文件到此处'}
                          </span>
                        ),
                        description: (
                          <span style={{ 
                            color: 'var(--color-text-tertiary)',
                            fontSize: '12px',
                            marginTop: '4px',
                            display: 'block',
                          }}>
                            {`支持图片、文档等，最多 ${uploadConfig.maxCount} 个，单个最大 ${Math.round(uploadConfig.maxSize / 1024 / 1024)}MB`}
                          </span>
                        ),
                      })}
                      styles={{
                        root: {
                          backgroundColor: 'var(--color-components-card-bg)',
                          padding: '20px 16px',
                          transition: 'background-color 0.2s ease',
                        },
                        placeholder: {
                          padding: 0,
                          margin: 0,
                          border: 'none',
                          background: 'transparent',
                        },
                        list: {
                          padding: '0 0 8px 0',
                          gap: '8px',
                        },
                        card: {
                          backgroundColor: 'var(--color-components-input-bg)',
                          border: '1px solid var(--color-border-default)',
                          borderRadius: '10px',
                          padding: '8px 12px',
                          transition: 'all 0.2s ease',
                        },
                        name: {
                          color: 'var(--color-text-primary)',
                          fontWeight: 500,
                          fontSize: '13px',
                        },
                        description: {
                          color: 'var(--color-text-tertiary)',
                          fontSize: '12px',
                        },
                      }}
                      // 自定义上传请求，使用 /v1/document/upload_info 接口
                      customRequest={async (options) => {
                        const { file, onSuccess, onError } = options
                        try {
                          // 调用上传 API
                          const result = await uploadFile(file as File)
                          
                          if (result) {
                            onSuccess?.(result, new XMLHttpRequest())
                            toast.success(`文件 ${(file as File).name} 上传成功`)
                            // 上传成功后自动收起面板
                            setHeaderOpen(false)
                          } else {
                            onError?.(new Error('Upload failed'))
                          }
                        } catch (error) {
                          console.error('Upload error:', error)
                          onError?.(error as Error)
                          toast.error(`上传失败: ${(error as Error).message}`)
                        }
                      }}
                    />
                  </Sender.Header>
                }
                // 右侧操作区：停止按钮或发送按钮
                suffix={isStreaming ? (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      // 停止输出（断开 SSE 连接）
                      if (sseParserRef.current) {
                        sseParserRef.current.disconnect()
                        sseParserRef.current = null
                      }
                      setIsLoading(false)
                      setIsStreaming(false)
                      setStreamingContent('')
                      setStreamingToolCalls([])
                      setIsToolAnalyzing(false)
                    }}
                    title="停止输出"
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                ) : undefined}
                onSubmit={(message) => {
                  if (message) {
                    handleSendMessage(message)
                    setInputValue('')
                    // 清空上传的文件
                    clearUploadFiles()
                    // 关闭上传面板
                    setHeaderOpen(false)
                  }
                }}
                onCancel={() => {
                  // 停止输出
                  if (sseParserRef.current) {
                    sseParserRef.current.disconnect()
                    sseParserRef.current = null
                  }
                  setIsLoading(false)
                  setIsStreaming(false)
                  setStreamingContent('')
                  setStreamingToolCalls([])
                  setIsToolAnalyzing(false)
                }}
                onPasteFile={(files) => {
                  // 粘贴文件时触发上传
                  for (let i = 0; i < files.length; i++) {
                    const file = files[i]
                    // 检查文件大小
                    if (file.size <= uploadConfig.maxSize) {
                      uploadFile(file)
                    } else {
                      toast.error(`文件 ${file.name} 超过大小限制`)
                    }
                  }
                  // 打开上传面板显示文件
                  if (files.length > 0) {
                    setHeaderOpen(true)
                  }
                }}
                style={{
                  borderRadius: '0',
                  border: 'none',
                  backgroundColor: 'transparent',
                }}
                styles={{
                  input: {
                    color: 'var(--color-components-input-text)',
                  },
                }}
              />
              
              {/* 输入框下方工具栏 - 与输入框无缝融合，参考 Claude 设计 */}
              <div 
                className="flex items-center justify-between"
                style={{ 
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  paddingBottom: '10px',
                  paddingTop: '4px',
                }}
              >
                <div className="flex items-center gap-1">
                  {/* 附件按钮 */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-1.5 gap-1.5"
                    onClick={() => setHeaderOpen(!headerOpen)}
                    title="上传文件"
                  >
                    <Paperclip className="w-4 h-4" style={{ color: headerOpen ? 'var(--color-text-accent)' : 'var(--color-text-tertiary)' }} />
                    {uploadFiles.length > 0 && (
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {uploadFiles.filter(f => f.status === 'done').length}
                      </span>
                    )}
                  </Button>
                  
                  {/* 可以在这里添加更多功能按钮，如 Thinking、联网搜索等 */}
                </div>
                
                {/* 右侧状态提示 */}
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  {isUploading && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      <span>上传中...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}