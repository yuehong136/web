import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";
import { Bubble } from "@ant-design/x";
import type { BubbleProps } from "@ant-design/x";
import { UserOutlined, RobotOutlined, CopyOutlined, LikeOutlined, DislikeOutlined } from '@ant-design/icons';
import { Typography, Button as AntdButton, Space } from 'antd';
import { getProviderIcon } from '@/components/ui/provider-icon';
import markdownit from "markdown-it";
import { mcpChatAPI, parseToolCalls, type MCPChatServiceRequest, type SSEResponse } from "@/api/mcp-chat-service";
import { useModelStore } from "@/stores/model";
import { toast } from "@/lib/toast";
import type { ChatSession, MCPChatConfig } from "@/types/mcp";

// 初始化 markdown-it
const md = markdownit({ html: true, breaks: true, linkify: true });

// Markdown 渲染函数 - 参考Ant Design X示例
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
  const bubbleListRef = useRef<any>(null);

  // 滚动处理函数
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement, UIEvent>) => {
    const target = e.target as HTMLDivElement;
    // 可以添加更多滚动逻辑，比如监听是否滚动到底部
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    console.log('Bubble scroll:', { 
      scrollTop: target.scrollTop, 
      scrollHeight: target.scrollHeight, 
      clientHeight: target.clientHeight,
      isAtBottom
    });
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
  const [isStreaming, setIsStreaming] = useState(false);

  // 复制消息内容
  const handleCopy = (content: string) => {
    if (!content) return toast.error('内容为空');
    navigator.clipboard?.writeText(content).then(() => {
      toast.success('已复制到剪贴板');
    }).catch(() => {
      toast.error('复制失败');
    });
  };

  // 根据布局配置角色样式
  const getRolesConfig = (layout: ChatLayout) => {
    // 获取当前选择模型的厂商图标
    const assistantIcon = selectedModelId ? getProviderIcon(selectedModelId) : <RobotOutlined />;
    
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
        footer: (messageContext: string) => (
          <div style={{ marginTop: '8px' }}>
            <Space size={4}>
              <AntdButton
                type="text"
                size="small"
                onClick={() => handleCopy(messageContext)}
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
              onClick={() => handleCopy(messageContext)}
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
    if (!activeSession?.messages) {
      // 如果正在流式输出，显示流式内容
      if (isStreaming && streamingContent) {
        return [
          {
            key: 'streaming-assistant',
            role: 'assistant',
            content: streamingContent,
            loading: false,
            typing: true,
            timestamp: new Date().toLocaleTimeString(),
            messageRender: renderMarkdown,
          }
        ];
      }
      return [];
    }
    
    const sessionMessages = activeSession.messages.map((msg) => ({
      key: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content || '',
      loading: false,
      typing: false,
      timestamp: msg.timestamp,
      messageRender: msg.role === 'assistant' ? renderMarkdown : undefined,
      toolCalls: msg.parsedToolCalls,
    }));
    
    // 如果正在流式输出，添加流式消息
    if (isStreaming && streamingContent) {
      sessionMessages.push({
        key: 'streaming-assistant',
        role: 'assistant',
        content: streamingContent,
        loading: false,
        typing: true,
        timestamp: new Date().toLocaleTimeString(),
        messageRender: renderMarkdown,
        toolCalls: undefined,
      });
    }
    
    return sessionMessages;
  }, [activeSession?.messages, isStreaming, streamingContent, renderMarkdown]);

  // 加载模型列表
  useEffect(() => {
    if (Object.keys(myLLMs || {}).length === 0 && !modelsLoading) {
      console.log('Loading models...');
      loadMyLLMs();
    }
  }, [loadMyLLMs, myLLMs, modelsLoading]);

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

    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

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
        files: []
      };

      // 发送请求
      const response = await mcpChatAPI.sendMessage(request);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      let fullContent = '';
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                
                const data: SSEResponse = JSON.parse(jsonStr);
                
                if (data.retcode === 0 && typeof data.data === 'string') {
                  const cleanContent = data.data.replace(/^-+\\?$/gm, '').trim();
                  if (cleanContent) {
                    fullContent = cleanContent;
                    const parsed = parseToolCalls(fullContent);
                    setStreamingContent(parsed.content);
                  }
                } else if (data.data === true) {
                  // 流结束，保存消息
                  const finalParsed = parseToolCalls(fullContent);
                  const assistantMessage = {
                    id: Date.now().toString(),
                    role: 'assistant' as const,
                    content: finalParsed.content,
                    timestamp: new Date().toLocaleTimeString(),
                    parsedToolCalls: finalParsed.toolCalls,
                  };

                  setSessions(prev => prev.map(session => 
                    session.id === activeSessionId 
                      ? { ...session, messages: [...session.messages, assistantMessage] }
                      : session
                  ));
                  break;
                } else if (data.retcode !== 0) {
                  throw new Error(data.retmsg || 'Unknown error');
                }
              } catch (parseError) {
                console.error('Parse error:', parseError, 'Line:', line);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : '发送消息失败');
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [activeSessionId, selectedModelId, selectedMCPIds, mcpConfig, sessions, handleNewChat]);

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
          <div className="flex-1 overflow-y-auto p-6">
            {bubbleItems.length > 0 ? (
              <div className={`${chatLayout === 'full' ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
                <Bubble.List
                  items={bubbleItems}
                  ref={bubbleListRef}
                  autoScroll
                  onScroll={handleScroll}
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