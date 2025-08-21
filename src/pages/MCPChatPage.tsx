import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";
import { Bubble, useXAgent, useXChat, XStream } from "@ant-design/x";
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

  // 配置 X Agent 处理流式数据
  const [agent] = useXAgent({
    request: async (info, callbacks) => {
      const { message, messages = [] } = info;
      const { onUpdate, onSuccess, onError } = callbacks;

      try {
        // 使用现有的会话逻辑
        if (!selectedModelId) {
          throw new Error('请先选择一个聊天模型');
        }

        // 处理历史消息上下文
        const historyMessages = Array.isArray(messages) 
          ? messages.map((msg, index) => {
              // 根据索引正确判断角色：偶数索引为用户消息，奇数索引为助手消息
              const role: 'user' | 'assistant' = index % 2 === 0 ? 'user' : 'assistant';
              
              if (typeof msg === 'string') {
                return { role, content: msg };
              }
              return {
                role,
                content: typeof msg === 'string' ? msg : String((msg as any)?.content || '')
              };
            })
          : [];

        // 构建当前用户消息
        const currentUserMessage = {
          role: 'user' as const,
          content: typeof message === 'string' ? message : String(message)
        };
        
        // 检查历史消息中最后一条是否已经是当前用户消息
        const lastMessage = historyMessages[historyMessages.length - 1];
        const shouldAddCurrentMessage = !lastMessage || 
          lastMessage.role !== 'user' || 
          lastMessage.content !== currentUserMessage.content;

        // 构建消息列表
        const allMessages = shouldAddCurrentMessage 
          ? [...historyMessages, currentUserMessage]
          : historyMessages;

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

        // 使用 XStream 解析 SSE 响应
        for await (const chunk of XStream({
          readableStream: response.body
        })) {
          try {
            // 根据Ant Design X文档，chunk应该有data属性
            const chunkData = (chunk as any)?.data;
            if (chunkData) {
              // 过滤掉可能的分隔符或异常字符
              const cleanChunkData = chunkData.replace(/^-+\\?$/gm, '').trim();
              if (!cleanChunkData) continue;
              
              const data: SSEResponse = JSON.parse(cleanChunkData);
              
              if (data.retcode === 0 && typeof data.data === 'string') {
                // 清理内容中的异常字符
                const cleanContent = data.data.replace(/^-+\\?$/gm, '').trim();
                if (cleanContent) {
                  // 后端返回的已经是累积内容，直接使用
                  fullContent = cleanContent;
                  
                  // 解析工具调用
                  const parsed = parseToolCalls(fullContent);
                  const content = parsed.content;
                  
                  // 实时更新内容
                  onUpdate?.(content as any);
                }
              } else if (data.data === true) {
                // 流结束标记
                const finalParsed = parseToolCalls(fullContent);
                onSuccess?.(finalParsed.content as any);
                break;
              } else if (data.retcode !== 0) {
                throw new Error(data.retmsg || 'Unknown error');
              }
            }
          } catch (parseError) {
            console.error('Parse error:', parseError, 'Chunk data:', (chunk as any)?.data);
            // 继续处理下一个 chunk
          }
        }

        
      } catch (error) {
        console.error('Error in agent request:', error);
        onError(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  });

  // 使用 useXChat 管理对话状态
  const { onRequest, messages: xMessages } = useXChat({ 
    agent
  });

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

  // 转换消息数据为 Bubble.List 需要的格式，结合流式效果和会话管理
  const bubbleItems = React.useMemo(() => {
    // 优先使用 xMessages 获得流式打字效果
    if (xMessages && xMessages.length > 0) {
      return xMessages.map((msg: any, index: number) => {
        // 确定消息角色和内容 - 偶数索引为用户消息，奇数为AI回复
        const isUser = index % 2 === 0;
        const rawContent = typeof msg === 'string' ? msg : 
          (typeof (msg as any)?.message === 'string' ? (msg as any).message :
           typeof (msg as any)?.content === 'string' ? (msg as any).content :
           typeof msg === 'object' && msg ? JSON.stringify(msg) : String(msg));
        
        // 清理thinking标签，只保留实际内容
        const contentWithoutThinking = rawContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();
        const content = contentWithoutThinking.replace(/^-+\\?$/gm, '').replace(/^-{6,}\\?/gm, '').trim();
        
        // 为每个消息保存创建时间
        const messageTime = (msg as any)?.timestamp || Date.now();
        
        return {
          key: `message-${index}`,
          role: isUser ? 'user' : 'assistant',
          content: content,
          loading: false,
          typing: false,
          timestamp: new Date(messageTime).toLocaleTimeString(),
          messageRender: !isUser ? renderMarkdown : undefined,
        };
      });
    }
    
    // 回退到会话消息（非流式状态）
    if (!activeSession?.messages) return [];
    
    return activeSession.messages.map((msg) => ({
      key: msg.id,
      role: msg.role as 'user' | 'assistant',
      content: msg.content || '',
      loading: false,
      typing: false,
      timestamp: msg.timestamp,
      messageRender: msg.role === 'assistant' ? renderMarkdown : undefined,
      // 保留工具调用信息
      toolCalls: msg.parsedToolCalls,
    }));
  }, [xMessages, activeSession?.messages, renderMarkdown]);

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

  // 发送消息函数 - 使用 onRequest 处理流式响应
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

    try {
      // 使用 onRequest 处理流式响应和打字效果
      onRequest(content);
      
      // 流式响应会通过 xMessages 自动显示在 Bubble.List 中
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : '发送消息失败');
    }
  }, [activeSessionId, selectedModelId, onRequest, handleNewChat]);

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
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 p-6">
            {bubbleItems.length > 0 ? (
              <div className={`h-full ${chatLayout === 'full' ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
                <Bubble.List
                  items={bubbleItems}
                  ref={bubbleListRef}
                  autoScroll
                  onScroll={handleScroll}
                  roles={getRolesConfig(chatLayout)}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <WelcomeMessage />
              </div>
            )}
          </div>

          {/* ChatInput - 固定在底部但不遮挡内容 */}
          <div className="flex-shrink-0 p-6 pt-0">
            <div className="max-w-4xl mx-auto">
              <ChatInput
                value={inputValue}
                onChange={setInputValue}
                onSubmit={(message) => {
                  setInputValue('');
                  handleSendMessage(message);
                }}
                loading={agent.isRequesting()}
                disabled={agent.isRequesting()}
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