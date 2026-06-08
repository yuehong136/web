// MCP聊天组件导出

export { ChatSidebar } from './ChatSidebar'
export { ChatHeader } from './ChatHeader'
export { ChatMessage } from './ChatMessage'
export { ChatInput } from './ChatInput'
export { WelcomeMessage } from './WelcomeMessage'
export { MCPToolSelector } from './MCPToolSelector'
export { ModelSelector } from './ModelSelector'
export { ToolCallDisplay } from './ToolCallDisplay'
export { MarkdownRenderer } from './MarkdownRenderer'
export { PromptSuggestion } from './PromptSuggestion'
export {
  parseStreamResponse,
  formatSearchResult,
  isValidUrl,
} from './StreamResponseParser'

// 参考文献相关组件（旧版 - 已废弃，保留用于向后兼容）
/** @deprecated 使用 ReferencePanel 代替 */
export {
  ReferenceDocumentList,
  extractDocumentsFromChunks,
} from './ReferenceDocumentList'
/** @deprecated 使用 ReferenceMarker 和 createReferenceMarkerComponent 代替 */
export { InlineSourceRef, createSupComponent } from './InlineSourceRef'
export { ImageCarousel } from './ImageCarousel'

// 新版参考文献组件（推荐使用）
export {
  ReferenceMarker,
  createReferenceMarkerComponent,
} from './ReferenceMarker'
export { ReferencePanel } from './ReferencePanel'
export { ReferenceDetailSheet } from './ReferenceDetailSheet'
export { ReferenceImageList } from './ReferenceImageList'

// 公共消息渲染组件
export { ThinkWrapper } from './ThinkWrapper'
export { AgentThoughtChain } from './AgentThoughtChain'
export { MessageActionsFooter } from './MessageActionsFooter'
export { CarouselWrapper } from './CarouselWrapper'

// 聊天设置相关组件
export { ChatSettingsPanel, defaultChatSettings } from './ChatSettingsPanel'
export {
  MetadataFilter,
  ComparisonOperators,
  MetadataFilterModes,
} from './MetadataFilter'
export {
  GenerationPresetSelector,
  generationPresetConfigMap,
  generationPresetOptions,
  detectMatchingPreset,
} from './GenerationPresetSelector'

// 重新导出类型
export type { PromptItem } from './PromptSuggestion'
export type { ChatInputProps, ActionsComponents, FooterInfo } from './ChatInput'
export type {
  ParsedToolCall,
  ParsedStreamResponse,
  SearchResult,
} from './StreamResponseParser'
export type {
  ReferenceDocument,
  ReferenceDocumentListProps,
} from './ReferenceDocumentList'
export type { InlineSourceRefProps } from './InlineSourceRef'
export type { ImageCarouselProps } from './ImageCarousel'
export type { ChatSettings } from './ChatSettingsPanel'
export type { MetadataFilterMode } from './MetadataFilter'
export type {
  GenerationPresetType,
  GenerationPresetConfig,
  LLMParameters,
  PresetOption,
} from './GenerationPresetSelector'

// 新版参考文献组件类型
export type { ReferenceMarkerProps } from './ReferenceMarker'
export type { ReferencePanelProps, DocAgg } from './ReferencePanel'
export type { ReferenceDetailSheetProps } from './ReferenceDetailSheet'
export type { ReferenceImageListProps } from './ReferenceImageList'

// 公共消息渲染组件类型
export type { ThinkWrapperProps } from './ThinkWrapper'
export type { AgentThoughtChainProps } from './AgentThoughtChain'
export type { MessageActionsFooterProps } from './MessageActionsFooter'
export type { CarouselWrapperProps } from './CarouselWrapper'
