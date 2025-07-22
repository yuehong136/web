# Multi-RAG API TypeScript 类型定义总结

本文档总结了从OpenAPI.json文件中提取并创建的完整TypeScript接口定义。

## 📋 概述

已从OpenAPI 3.1规范中提取了所有API相关的请求和响应类型定义，创建了完整的TypeScript接口文件 `/src/types/index.ts`，包含2000+行的详细类型定义。

## 🗂️ 类型定义分类

### 1. 基础API类型
- **BaseResponse<T>** - 标准API响应结构 (retcode, retmsg, data)
- **HTTPValidationError** - HTTP验证错误类型
- **PaginationParams** - 分页参数
- **PaginatedResponse<T>** - 分页响应
- **StatusEnum** - 通用状态枚举

### 2. 用户认证和授权
- **User** - 用户实体，包含角色和权限
- **LoginRequest/RegisterRequest** - 登录注册请求
- **AuthResponse** - 认证响应，包含JWT token
- **Tenant** - 租户管理
- **Permission/Role** - 权限和角色管理

### 3. MCP服务器管理
- **MCPServer** - MCP服务器实体
- **MCPTool** - MCP工具定义
- **CreateMCPServerRequest/UpdateMCPServerRequest** - 创建/更新请求
- **ImportMCPServerRequest/ExportMCPServerRequest** - 导入/导出请求
- **ListToolsRequest** - 获取工具列表

### 4. 对话和聊天
- **Message** - 消息实体，支持多种角色和工具调用
- **Conversation** - 对话实体
- **api__apps__conversation__CompletionRequest** - AI完成请求
- **DialogRequest** - 对话请求
- **MessageRole** - 消息角色类型

### 5. 知识库和文档管理
- **KnowledgeBase** - 知识库实体
- **Document** - 文档实体
- **Chunk** - 文档块处理
- **CreateKnowledgebaseRequest/UpdateKnowledgebaseRequest** - 知识库管理
- **DocumentUploadRequest** - 文档上传
- **ChangeParserRequest** - 解析器配置

### 6. 文件上传和处理
- **FileEntity** - 文件实体
- **DocumentParseRequest** - 文档解析
- **ASRRequest/TTSRequest** - 语音识别和合成
- **DocxToFormConvertRequest** - 文档转换
- **BatchCreateItemsRequest** - 批量处理

### 7. 工作流和组件
- **Workflow** - 工作流实体
- **WorkflowNode/WorkflowEdge** - 工作流节点和边
- **RunRequest** - 工作流执行
- **ComponentRunRequest** - 组件运行
- **Canvas操作** - 画布相关请求

### 8. NL2SQL和数据分析
- **NL2SQLRequest** - 自然语言转SQL请求
- **TableSchema** - 数据库表结构
- **GenerateEChartsRequest** - 图表生成
- **DBConnectionRequest** - 数据库连接
- **ChartTypeReqBody** - 图表类型请求

### 9. AI工具和服务
- **AITranslateRequest/AIBatchTranslateReqBody** - AI翻译
- **QuickInterpretRequest** - 快速解释
- **RecognizeIntentRequest** - 意图识别
- **MindmapRequest/OutlineRequest** - 思维导图和大纲生成
- **SuggestionRequest** - 建议生成

### 10. 内容管理
- **QATemplate/QATemplateV2** - 问答模板
- **Tag/Category** - 标签和分类
- **Library/LibraryItem** - 库和库项目
- **Label/Level/Dimension** - 标签、层级和维度管理

### 11. 搜索和检索
- **RAGAnswerRequest** - RAG问答请求
- **SearchVectorsRequest** - 向量搜索
- **RetrievalTestRequest** - 检索测试
- **FusionSearchMode/HybridSearchMode** - 搜索模式配置

### 12. 安全和过滤
- **ContentFilterRequest** - 内容过滤
- **DetectionRequest** - 敏感词检测
- **CreateSensitiveWordRequest** - 敏感词管理
- **CreateWhitelistRequest** - 白名单管理

### 13. 系统监控
- **SystemStats** - 系统统计信息
- **APIUsageStats** - API使用统计
- **Notification** - 通知系统
- **SystemConfig** - 系统配置

### 14. 通用工具类型
- **BaseEntity** - 实体基类
- **QueryParams** - 通用查询参数
- **HttpStatus** - HTTP状态码枚举
- **WebSocketMessage** - WebSocket消息
- **EventData** - 事件数据

## 🔧 特殊功能

### 类型别名
为了向后兼容，提供了多个类型别名：
```typescript
export type ChatRequest = api__apps__conversation__CompletionRequest
export type CompletionRequest = api__apps__api__CompletionRequest
```

### 搜索模式别名
```typescript
export type ChunkFusionSearchMode = api__apps__chunk__FusionSearchMode
export type DialogHybridSearchMode = api__apps__dialog__HybridSearchMode
```

### 实体继承体系
```typescript
// 基础实体
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// 租户实体
export interface TenantEntity extends BaseEntity {
  tenant_id: string
}

// 用户实体  
export interface UserEntity extends TenantEntity {
  user_id: string
}
```

## 📊 数据统计

- **总类型定义数量**: 300+ 个接口和类型
- **代码行数**: 2000+ 行
- **覆盖的API模块**: 14个主要模块
- **支持的功能**: 用户认证、对话、知识库、文档、MCP服务器、工作流等所有核心功能

## 🚀 使用方式

```typescript
import { 
  BaseResponse, 
  MCPServer, 
  CreateMCPServerRequest,
  ChatRequest,
  KnowledgeBase,
  Document
} from '@/types'

// API调用示例
const createMCPServer = async (request: CreateMCPServerRequest): Promise<BaseResponse<{ id: string }>> => {
  // API实现
}

// 类型安全的状态管理
const [servers, setServers] = useState<MCPServer[]>([])
```

## ✅ 质量保证

- ✅ 所有类型通过TypeScript编译检查
- ✅ 基于实际OpenAPI 3.1规范文档
- ✅ 包含完整的请求和响应类型
- ✅ 支持泛型和类型复用
- ✅ 提供向后兼容的类型别名
- ✅ 详细的注释和文档

## 📝 更新维护

此类型定义文件应与OpenAPI.json保持同步，当API规范更新时需要相应更新类型定义。建议设置自动化流程来检测API变更并更新类型定义。

---

**文件位置**: `/src/types/index.ts`  
**生成时间**: 2025-07-21  
**基于**: OpenAPI 3.1规范 (Multi-RAG API v0.0.1)