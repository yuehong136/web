// MCP实验场聊天API接口

import type { ChatSession, ChatMessage, MCPChatConfig } from '@/types/mcp';

// 模拟聊天API响应
export interface ChatResponse {
  content: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, any>;
    result: string;
  }>;
}

// 发送聊天消息
export async function sendChatMessage(
  message: string,
  config: MCPChatConfig,
  sessionId?: string
): Promise<ChatResponse> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 模拟响应
  if (config.mcp_ids.length > 0 && message.includes('docker')) {
    return {
      content: `根据MCP工具搜索的结果，我来为您介绍Docker的最新信息：

## Docker 27.0 最新特性

Docker 27.0 版本带来了许多重要的更新和改进：

### 🚀 主要新特性
- **改进的容器启动速度**: 通过优化镜像层处理，启动时间减少了20-30%
- **增强的安全性**: 新增rootless模式的改进，支持更多安全特性
- **BuildKit增强**: 支持更高效的多阶段构建和并行构建

这些改进使Docker在云原生开发中更加高效和安全。您对哪个方面特别感兴趣呢？`,
      toolCalls: [
        {
          name: 'search_web',
          args: { query: 'docker 最新介绍' },
          result: 'title: Docker最新版本安装指南及常见问题解析\\nurl: https://edu.51cto.com/article/note/20757.html\\nsnippet: 本文详细介绍了Docker最新版本的安装步骤，包括必备组件安装、密钥添加、APT仓库配置、版本验证等，并提供了常见问题的FAQ解析，帮助用户快速上手Docker\\ndate: Mar 27, 2025\\nengine: google'
        }
      ]
    };
  }
  
  return {
    content: `感谢您的问题！我是 MCP 实验场助手，可以帮助您了解和使用各种工具功能。

关于您提到的"${message}"，我可以为您提供详细的解答和指导。

${config.mcp_ids.length > 0 ? '我已经启用了MCP工具来为您提供更准确和实时的信息。' : '您可以启用MCP工具来获取更丰富的功能支持。'}

有什么具体问题需要我协助解决吗？`
  };
}

// 获取聊天会话列表
export async function getChatSessions(): Promise<ChatSession[]> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 返回空列表，实际使用中会从服务器获取
  return [];
}

// 创建新的聊天会话
export async function createChatSession(title?: string): Promise<ChatSession> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    id: Date.now().toString(),
    title: title || '新对话',
    timestamp: '刚刚',
    messages: []
  };
}

// 保存聊天会话
export async function saveChatSession(session: ChatSession): Promise<void> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 实际使用中会保存到服务器
  console.log('保存会话:', session);
}

// 删除聊天会话
export async function deleteChatSession(sessionId: string): Promise<void> {
  // 模拟API调用延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // 实际使用中会从服务器删除
  console.log('删除会话:', sessionId);
}