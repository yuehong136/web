/**
 * Enhanced SSE Parser for structured and unstructured responses
 * Supports both the new structured SSE format and legacy format
 */

// SSE消息类型定义（与后端保持一致）
export type MessageType = 
  | 'text'
  | 'tool_call'
  | 'tool_result'
  | 'tool_start'
  | 'tool_end'
  | 'error'
  | 'complete'
  | 'metadata';

export const MessageTypes = {
  TEXT: 'text' as const,
  TOOL_CALL: 'tool_call' as const,
  TOOL_RESULT: 'tool_result' as const,
  TOOL_START: 'tool_start' as const,
  TOOL_END: 'tool_end' as const,
  ERROR: 'error' as const,
  COMPLETE: 'complete' as const,
  METADATA: 'metadata' as const
};

// 消息接口定义
export interface SSEMessage {
  type: MessageType;
  content: any;
  metadata?: Record<string, any>;
}

export interface TextMessage extends SSEMessage {
  type: 'text';
  content: string;
  accumulated?: string;
}

export interface ToolCallMessage extends SSEMessage {
  type: 'tool_call';
  content: {
    tool_name: string;
    arguments: Record<string, any>;
    call_id?: string;
  };
}

export interface ToolResultMessage extends SSEMessage {
  type: 'tool_result';
  content: {
    tool_name: string;
    result: any;
    call_id?: string;
    success: boolean;
    error?: string;
  };
}

export interface ToolStartMessage extends SSEMessage {
  type: 'tool_start';
  content: string;
}

export interface ToolEndMessage extends SSEMessage {
  type: 'tool_end';
  content: {
    total_calls: number;
    summary?: string;
  };
}

export interface ErrorMessage extends SSEMessage {
  type: 'error';
  content: {
    error: string;
    code?: number;
  };
}

export interface CompleteMessage extends SSEMessage {
  type: 'complete';
  content: boolean;
  metadata?: {
    total_text_length?: number;
    total_tool_calls?: number;
    token_count?: number;
    duration?: number;
  };
}

export interface MetadataMessage extends SSEMessage {
  type: 'metadata';
  content: {
    token_count?: number;
    model?: string;
    duration?: number;
    [key: string]: any;
  };
}

// 工具调用状态接口
export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: Record<string, any>;
  result?: any;
  status: 'pending' | 'running' | 'success' | 'error';
  timestamp: string;
}

// 解析器状态接口
export interface SSEParserState {
  accumulatedText: string;
  toolCalls: ToolCallInfo[];
  isToolAnalyzing: boolean;
  metadata: Record<string, any>;
}

/**
 * Enhanced SSE Parser class
 */
export class EnhancedSSEParser {
  private state: SSEParserState;
  private abortController: AbortController | null = null;
  private toolCallMap: Map<string, ToolCallInfo> = new Map();
  private syntheticCompleteSent: boolean = false;

  constructor() {
    this.state = {
      accumulatedText: '',
      toolCalls: [],
      isToolAnalyzing: false,
      metadata: {}
    };
  }

  /**
   * Connect to SSE endpoint and process streaming messages
   */
  async connect(
    url: string,
    requestBody: any,
    onMessage: (message: SSEMessage, state: SSEParserState) => void,
    onError?: (error: Error) => void,
    headers?: Record<string, string>
  ): Promise<void> {
    this.abortController = new AbortController();
    this.reset();
    
    // 从localStorage获取认证token（与原有实现保持一致）
    const token = localStorage.getItem('auth_token');
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...headers
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Avoid double COMPLETE when server already sent one
          if (!this.syntheticCompleteSent) {
            const completeMessage: CompleteMessage = {
              type: 'complete',
              content: true,
              metadata: this.state.metadata
            };
            onMessage(completeMessage, { ...this.state });
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data) {
              try {
                const parsedMessage = JSON.parse(data);
                const sseMessage = this.handleMessage(parsedMessage);
                if (sseMessage) {
                  if (sseMessage.type === 'complete') {
                    // Mark that server emitted completion
                    this.syntheticCompleteSent = true;
                  }
                  onMessage(sseMessage, { ...this.state });
                }
              } catch (e) {
                console.error('Failed to parse SSE message:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name !== 'AbortError' && onError) {
          onError(error);
        }
      }
    }
  }

  /**
   * Handle incoming messages (both structured and unstructured)
   */
  private handleMessage(message: any): SSEMessage | null {
    // Check for wrapped format (retcode/retmsg/data)
    if ('retcode' in message && 'data' in message) {
      // Handle error cases
      if (message.retcode !== 0) {
        return {
          type: MessageTypes.ERROR,
          content: { 
            error: message.retmsg || 'Unknown error',
            code: message.retcode
          }
        } as ErrorMessage;
      }
      
      // Handle completion marker
      if (message.data === true) {
        return {
          type: MessageTypes.COMPLETE,
          content: true,
          metadata: this.state.metadata
        } as CompleteMessage;
      }
      
      // Check if data contains structured message
      if (typeof message.data === 'object' && message.data && 'type' in message.data) {
        // Handle structured message
        return this.processStructuredMessage(message.data);
      } else if (typeof message.data === 'string') {
        // Handle legacy unstructured format
        return this.processLegacyMessage(message.data);
      }
    } else if ('type' in message) {
      // Direct structured message (no wrapper)
      return this.processStructuredMessage(message);
    }

    return null;
  }

  /**
   * Process structured SSE messages
   */
  private processStructuredMessage(message: any): SSEMessage | null {
    switch (message.type) {
      case 'text': {
        const nextContent = typeof message.content === 'string' ? message.content : '';
        if (nextContent === this.state.accumulatedText) {
          return null;
        }
        // Update accumulated text with content directly (backend sends full accumulated content)
        this.state.accumulatedText = nextContent;
        return {
          type: 'text' as MessageType,
          content: nextContent,
          accumulated: nextContent
        } as TextMessage;
      }

      case 'tool_call':
        this.processToolCall(message.content);
        return {
          type: 'tool_call' as MessageType,
          content: message.content
        } as ToolCallMessage;

      case 'tool_result':
        this.processToolResult(message.content);
        return {
          type: 'tool_result' as MessageType,
          content: message.content
        } as ToolResultMessage;

      case 'tool_start':
        this.state.isToolAnalyzing = true;
        return {
          type: 'tool_start' as MessageType,
          content: message.content
        } as ToolStartMessage;

      case 'tool_end':
        this.state.isToolAnalyzing = false;
        return {
          type: 'tool_end' as MessageType,
          content: message.content
        } as ToolEndMessage;

      case 'error':
      case 'complete':
      case 'metadata':
        if (message.type === 'metadata') {
          this.state.metadata = { ...this.state.metadata, ...message.content };
        }
        return message;

      default:
        return message;
    }
  }

  /**
   * Process legacy unstructured messages (for backward compatibility)
   */
  private processLegacyMessage(content: string): SSEMessage | null {
    const previousText = this.state.accumulatedText;
    
    // Parse tool calls from legacy format using existing parser
    const toolCallRegex = /<tool_call>(.*?)<\/tool_call>/gs;
    const toolCalls: ToolCallInfo[] = [];
    let cleanContent = content;
    
    let match;
    while ((match = toolCallRegex.exec(content)) !== null) {
      try {
        const toolCallData = JSON.parse(match[1]);
        const toolCall: ToolCallInfo = {
          id: `legacy_${Date.now()}_${Math.random()}`,
          name: toolCallData.name,
          arguments: toolCallData.args || {},
          result: toolCallData.result || 'Begin to call...',
          status: toolCallData.result === 'Begin to call...' ? 'running' : 'success',
          timestamp: new Date().toLocaleTimeString()
        };
        toolCalls.push(toolCall);
      } catch (error) {
        console.error('Failed to parse legacy tool call:', error);
      }
    }
    
    // Remove tool_call tags from content
    cleanContent = cleanContent.replace(toolCallRegex, '').trim();
    
    // Update state
    this.state.toolCalls = toolCalls;
    this.state.accumulatedText = cleanContent;

    if (cleanContent === previousText) {
      return null;
    }
    
    return {
      type: 'text' as MessageType,
      content: cleanContent,
      accumulated: cleanContent
    } as TextMessage;
  }

  /**
   * Process tool call message
   */
  private processToolCall(content: any): ToolCallInfo {
    const newToolCall: ToolCallInfo = {
      id: content.call_id || `call_${Date.now()}_${Math.random()}`,
      name: content.tool_name,
      arguments: content.arguments || {},
      status: 'running',
      timestamp: new Date().toLocaleTimeString()
    };

    // Add to tool call map and state
    this.toolCallMap.set(newToolCall.id, newToolCall);
    this.updateToolCallsList();
    
    return newToolCall;
  }

  /**
   * Process tool result message
   */
  private processToolResult(content: any): void {
    const callId = content.call_id;
    if (callId && this.toolCallMap.has(callId)) {
      const toolCall = this.toolCallMap.get(callId)!;
      toolCall.result = content.result;
      toolCall.status = content.success ? 'success' : 'error';
      if (content.error) {
        toolCall.result = content.error;
      }
      this.updateToolCallsList();
    }
  }

  /**
   * Update tool calls list from map
   */
  private updateToolCallsList(): void {
    this.state.toolCalls = Array.from(this.toolCallMap.values());
  }

  /**
   * Disconnect from SSE stream
   */
  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.state = {
      accumulatedText: '',
      toolCalls: [],
      isToolAnalyzing: false,
      metadata: {}
    };
    this.toolCallMap.clear();
  }

  /**
   * Get current parser state
   */
  getState(): SSEParserState {
    return { ...this.state };
  }
}
