import { useState, useEffect, useRef, useCallback } from "react";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { WelcomeMessage } from "@/components/chat/WelcomeMessage";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { mcpChatAPI, parseToolCalls, type MCPChatServiceRequest, type SSEResponse, type ParsedToolCall } from "@/api/mcp-chat-service";
import { useModelStore } from "@/stores/model";
import { toast } from "@/lib/toast";
import type { ChatSession, ChatMessage, MCPChatConfig } from "@/types/mcp";

// 解析SSE响应数据
const parseSSEData = (data: string): SSEResponse | null => {
  try {
    // 移除 "data: " 前缀
    const jsonStr = data.replace(/^data:\s*/, '').trim();
    if (!jsonStr) return null;
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse SSE data:', e);
    return null;
  }
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

export default function MCPChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>(createInitialSessions());
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true); // 是否自动滚动

  
  // 聊天输入相关状态
  const [inputValue, setInputValue] = useState('');
  const [submitType] = useState<'enter' | 'shiftEnter'>('enter');
  
  // 滚动相关的ref - 移除scrollAreaRef，只保留messagesEndRef
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false); // 用户是否正在手动滚动
  
  // MCP相关状态
  const [selectedMCPIds, setSelectedMCPIds] = useState<string[]>([]);
  const [mcpConfig, setMcpConfig] = useState<MCPChatConfig>({
    mcp_ids: [],
    mcp_timeout: 1000,
    verbose_tool_use: true,
    mcp_react: true,
    mcp_max_rounds: 5,
    mcp_parallelism: 3
  });

  // 模型选择相关状态 - 使用真实的模型数据
  const { myLLMs, isLoading: modelsLoading, loadMyLLMs } = useModelStore();
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [temporaryChatEnabled, setTemporaryChatEnabled] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  // 加载模型列表
  useEffect(() => {
    loadMyLLMs();
  }, [loadMyLLMs]);

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

  // 自动滚动到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // 优化的滚动处理函数，参考Ant Design X的实现
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const { scrollTop, scrollHeight, clientHeight } = target;
    
    // 检查是否接近底部
    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 100; // 100px tolerance
    
    // 更新滚动按钮显示状态
    setShowScrollToBottom(!isAtBottom);
    
    // 更新自动滚动状态
    // 如果用户滚动到底部附近，启用自动滚动
    // 如果用户向上滚动离开底部，禁用自动滚动
    if (isAtBottom) {
      setAutoScroll(true);
      isUserScrollingRef.current = false;
    } else {
      setAutoScroll(false);
      isUserScrollingRef.current = true;
    }
  }, []);

  // 当消息变化时自动滚动到底部（仅在自动滚动启用时）
  useEffect(() => {
    // 只有当用户没有手动滚动且自动滚动启用时才滚动
    if (autoScroll && !isUserScrollingRef.current) {
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSession?.messages, isLoading, autoScroll, scrollToBottom]);

  // 当切换会话时滚动到底部
  useEffect(() => {
    if (activeSessionId) {
      const timer = setTimeout(() => {
        scrollToBottom();
        setShowScrollToBottom(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeSessionId]);

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

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString()
    };

    // 获取当前会话的历史消息（添加用户消息之前的）
    const currentSession = sessions.find(s => s.id === activeSessionId);
    const historyMessages = currentSession?.messages || [];

    // Add user message
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId 
        ? { ...session, messages: [...session.messages, userMessage] }
        : session
    ));

    setIsLoading(true);
    
    // 用户发送消息时，重新启用自动滚动
    setAutoScroll(true);
    isUserScrollingRef.current = false;

    // 中断之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // 构建完整的消息列表（历史消息 + 当前用户消息）
      const messages = [
        ...historyMessages.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as 'user' | 'assistant',
          content: content  // 当前用户输入的内容
        }
      ];

      // 构建请求参数
      const request: MCPChatServiceRequest = {
        prompt: '',  // 系统提示词，可根据需要设置
        messages: messages,
        llm_name: selectedModelId,
        stream: true,
        gen_conf: {},  // 生成配置，可根据需要设置
        mcp_ids: selectedMCPIds,
        mcp_timeout: mcpConfig.mcp_timeout,
        verbose_tool_use: mcpConfig.verbose_tool_use,
        mcp_react: mcpConfig.mcp_react,
        mcp_max_rounds: mcpConfig.mcp_max_rounds,
        mcp_parallelism: mcpConfig.mcp_parallelism
      };

      // 发送请求
      const response = await mcpChatAPI.sendMessage(request);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      // 创建助手消息
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toLocaleTimeString(),
        parsedToolCalls: []
      };

      // 添加助手消息到会话
      setSessions(prev => prev.map(session => 
        session.id === activeSessionId 
          ? { ...session, messages: [...session.messages, assistantMessage] }
          : session
      ));

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let toolCalls: ParsedToolCall[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          // 解码数据
          buffer += decoder.decode(value, { stream: true });
          
          // 按行分割
          const lines = buffer.split('\n');
          buffer = lines[lines.length - 1]; // 保留最后一行（可能不完整）
          
          for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (!line || !line.startsWith('data: ')) continue;
            
            const sseData = parseSSEData(line);
            if (!sseData) continue;
            
            if (sseData.retcode === 0) {
              if (typeof sseData.data === 'string') {
                // 累积内容（后端返回的是累积内容）
                accumulatedContent = sseData.data;
                
                // 解析工具调用
                const parsed = parseToolCalls(accumulatedContent);
                accumulatedContent = parsed.content;
                toolCalls = parsed.toolCalls;
                
                // 更新消息
                setSessions(prev => prev.map(session => 
                  session.id === activeSessionId 
                    ? { 
                        ...session, 
                        messages: session.messages.map(msg => 
                          msg.id === assistantMessage.id 
                            ? { 
                                ...msg, 
                                content: accumulatedContent,
                                parsedToolCalls: toolCalls.map(tc => ({
                                  name: tc.name,
                                  args: tc.args,
                                  result: tc.result,
                                  status: (tc.status || 'success') as 'pending' | 'running' | 'success' | 'error'
                                }))
                              }
                            : msg
                        )
                      }
                    : session
                ));
              } else if (sseData.data === true) {
                // 流结束标记
                break;
              }
            } else if (sseData.retcode !== 0) {
              throw new Error(sseData.retmsg || 'Unknown error');
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error instanceof Error ? error.message : '发送消息失败');
      setIsLoading(false);
    }

    // 更新会话标题
    setSessions(prev => prev.map(session => 
      session.id === activeSessionId && session.messages.length === 1
        ? { ...session, title: content.slice(0, 20) + '...' }
        : session
    ));
  }, [activeSessionId, selectedMCPIds, setSessions, setIsLoading, handleNewChat]);

  return (
    <div className="mcp-chat-page h-screen flex bg-background overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - 固定宽度，不会移动 */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 transition-transform duration-200 ease-in-out
        fixed md:relative z-50 md:z-0 h-full
        w-80 md:w-80 flex-shrink-0
      `}>
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

      {/* Main Content - 占据剩余空间 */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header - 固定在顶部 */}
        <div className="flex-shrink-0">
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
          />
        </div>
        
        {/* Chat Area - 可滚动区域 */}
        <div className="flex-1 overflow-hidden relative">
          
          {activeSession && activeSession.messages.length > 0 ? (
            <>
              <ScrollArea className="h-full p-4" onScroll={handleScroll}>
                <div className="max-w-4xl mx-auto pb-4">
                  {activeSession.messages.map((message, index) => {
                    // 判断是否是正在生成的最后一条助手消息
                    const isLastAssistantMessage = 
                      index === activeSession.messages.length - 1 && 
                      message.role === 'assistant';
                    const isGenerating = isLoading && isLastAssistantMessage;
                    
                    return (
                      <ChatMessageComponent
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        timestamp={message.timestamp}
                        toolCalls={message.toolCalls}
                        parsedToolCalls={message.parsedToolCalls}
                        isLoading={isGenerating}
                      />
                    );
                  })}
                  
                  {/* 用于滚动定位的元素 */}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </ScrollArea>
              
              {/* 滚动到底部按钮 */}
              {showScrollToBottom && (
                <div className="absolute bottom-4 right-8 z-10">
                  <Button
                    onClick={() => {
                      scrollToBottom();
                      setAutoScroll(true); // 重新启用自动滚动
                      isUserScrollingRef.current = false;
                    }}
                    size="sm"
                    variant="secondary"
                    className="rounded-full w-10 h-10 p-0 shadow-lg border bg-background hover:bg-accent"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="h-full overflow-y-auto">
              <WelcomeMessage />
            </div>
          )}
        </div>

        {/* Input Area - 固定在底部 */}
        <div className="flex-shrink-0">
          <ChatInput 
            value={inputValue}
            onChange={setInputValue}
            onSubmit={(message) => {
              setInputValue(''); // 清空输入框
              handleSendMessage(message);
            }}
            loading={isLoading}
            disabled={isLoading}
            submitType={submitType}
            allowSpeech={{
              enabled: true,
              continuous: true,
              interimResults: true,
              language: 'zh-CN'
            }}
            onPasteFile={(firstFile, files) => {
              console.log('粘贴文件:', firstFile, files);
            }}
            autoSize={{ minRows: 1, maxRows: 6 }}
            footer={
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    提交模式: {submitType === 'enter' ? 'Enter 发送' : 'Shift+Enter 发送'}
                  </span>
                </div>
                <div>
                  {submitType === 'enter' ? 'Enter 发送 • Shift+Enter 换行' : 'Shift+Enter 发送 • Enter 换行'}
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}