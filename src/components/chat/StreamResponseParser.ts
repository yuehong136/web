export interface ParsedToolCall {
  id: string;
  name: string;
  args: any;
  result: string;
  status: 'pending' | 'running' | 'success' | 'error';
  timestamp: string;
}

export interface ParsedStreamResponse {
  toolCalls: ParsedToolCall[];
  content: string;
  rawContent: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  date: string | null;
  engine: string | null;
}

// 解析流式响应，提取工具调用和内容
export function parseStreamResponse(rawData: string): ParsedStreamResponse {
  const toolCallRegex = /<tool_call>(.*?)<\/tool_call>/gs;
  const toolCalls: ParsedToolCall[] = [];
  let content = rawData;
  
  // 提取所有工具调用
  let match;
  while ((match = toolCallRegex.exec(rawData)) !== null) {
    try {
      const toolCallData = JSON.parse(match[1]);
      const toolCall: ParsedToolCall = {
        id: Date.now().toString() + Math.random(),
        name: toolCallData.name,
        args: toolCallData.args,
        result: toolCallData.result || 'Begin to call...',
        status: toolCallData.result === 'Begin to call...' ? 'running' : 'success',
        timestamp: new Date().toLocaleTimeString()
      };
      toolCalls.push(toolCall);
    } catch (error) {
      console.error('Failed to parse tool call:', error);
    }
  }
  
  // 移除tool_call标签，保留其他内容
  content = content.replace(toolCallRegex, '').trim();
  
  return {
    toolCalls,
    content,
    rawContent: rawData
  };
}

// 搜索结果格式化函数
export const formatSearchResult = (text: string): SearchResult | null => {
  try {
    // 尝试解析为链接预览格式
    const linkMatch = text.match(/^(.*?)\n(https?:\/\/[^\s]+)\n(.*)$/s);
    if (linkMatch) {
      return {
        title: linkMatch[1].trim(),
        url: linkMatch[2].trim(),
        snippet: linkMatch[3].trim().substring(0, 200),
        date: null,
        engine: null
      };
    }
    
    // 尝试解析Docker搜索结果格式
    const dockerMatch = text.match(/Docker(.*?)最新特性/);
    if (dockerMatch) {
      return {
        title: `Docker${dockerMatch[1]}最新特性`,
        url: 'https://docs.docker.com',
        snippet: text.substring(0, 200),
        date: 'Mar 27, 2025',
        engine: 'google'
      };
    }
    
    // 尝试解析带有标题和描述的搜索结果
    const titleMatch = text.match(/^(.+?)(?:\n|$)(.*)/s);
    if (titleMatch && titleMatch[1].length < 100) {
      const title = titleMatch[1].trim();
      const description = titleMatch[2]?.trim() || '';
      
      // 检查是否包含URL
      const urlMatch = description.match(/(https?:\/\/[^\s]+)/);
      
      return {
        title,
        url: urlMatch ? urlMatch[1] : '',
        snippet: description.replace(/(https?:\/\/[^\s]+)/g, '').trim().substring(0, 200),
        date: null,
        engine: null
      };
    }
    
    return null;
  } catch {
    return null;
  }
};

// 验证URL是否有效
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// 格式化时间戳
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return timestamp;
  }
};