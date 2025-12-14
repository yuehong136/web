// MCP聊天组件导出

export { ChatSidebar } from './ChatSidebar';
export { ChatHeader } from './ChatHeader';
export { ChatMessage } from './ChatMessage';
export { ChatInput } from './ChatInput';
export { WelcomeMessage } from './WelcomeMessage';
export { MCPToolSelector } from './MCPToolSelector';
export { ModelSelector } from './ModelSelector';
export { ToolCallDisplay } from './ToolCallDisplay';
export { MarkdownRenderer } from './MarkdownRenderer';
export { PromptSuggestion } from './PromptSuggestion';
export { parseStreamResponse, formatSearchResult, isValidUrl } from './StreamResponseParser';

// 参考文献相关组件
export { ReferenceDocumentList, extractDocumentsFromChunks } from './ReferenceDocumentList';
export { InlineSourceRef, createSupComponent } from './InlineSourceRef';

// 重新导出类型
export type { PromptItem } from './PromptSuggestion';
export type { ChatInputProps, ActionsComponents, FooterInfo } from './ChatInput';
export type { ParsedToolCall, ParsedStreamResponse, SearchResult } from './StreamResponseParser';
export type { ReferenceDocument, ReferenceDocumentListProps } from './ReferenceDocumentList';
export type { InlineSourceRefProps } from './InlineSourceRef';