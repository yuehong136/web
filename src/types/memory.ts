/**
 * 记忆库类型定义
 * 参考 ragflow 的 Memory 功能设计
 */

// ============ 枚举和常量类型 ============

/**
 * 记忆类型枚举
 * - raw: 原始记忆 - 用户与智能体之间的原始对话内容（默认必需）
 * - semantic: 语义记忆 - 关于用户和世界的通用知识和事实
 * - episodic: 情景记忆 - 带时间戳的特定事件和经历记录
 * - procedural: 程序记忆 - 学习的技能、习惯和自动化程序
 */
export enum MemoryType {
  Raw = 'raw',
  Semantic = 'semantic',
  Episodic = 'episodic',
  Procedural = 'procedural',
}

/**
 * 存储类型
 */
export type StorageType = 'table' | 'graph'

/**
 * 权限类型
 */
export type PermissionType = 'me' | 'team'

/**
 * 遗忘策略
 * - fifo: 先进先出
 * - lru: 最近最少使用
 */
export type ForgettingPolicy = 'fifo' | 'lru'

// ============ 核心实体类型 ============

/**
 * 记忆库实体
 */
export interface Memory {
  id: string
  name: string
  description?: string
  avatar?: string
  
  // 记忆配置
  memory_type: MemoryType[]
  storage_type: StorageType
  permissions: PermissionType
  
  // 模型配置
  embd_id: string      // 嵌入模型 ID
  llm_id: string       // LLM 模型 ID
  
  // 容量和策略
  memory_size: number
  forgetting_policy: ForgettingPolicy
  
  // 高级设置
  temperature?: number
  system_prompt?: string
  user_prompt?: string
  
  // 元数据
  tenant_id: string
  owner_name: string
  create_time: number
  update_time?: number
  create_date?: string
  update_date?: string
}

/**
 * 记忆消息实体
 */
export interface MemoryMessage {
  id: string
  session_id: string
  memory_id: string
  
  // 消息内容
  content: string
  content_embed?: string
  
  // 消息元数据
  agent_name?: string
  message_type: MemoryType
  source_id?: string
  
  // 时间和状态
  valid_at: string
  forget_at?: string
  status: boolean
  
  // 子消息（用于展开显示）
  extract?: MemoryMessage[]
}

// ============ API 请求参数类型 ============

/**
 * 创建记忆库请求参数
 * 后端必需字段: name, memory_type, embd_id, llm_id
 */
export interface CreateMemoryParams {
  name: string
  memory_type: string[]  // 后端接受字符串数组，如 ['raw', 'semantic']
  embd_id: string
  llm_id: string
}

/**
 * 更新记忆库请求参数
 * 注意：后端不允许修改 id, tenant_id, memory_type, storage_type, embd_id
 */
export interface UpdateMemoryParams {
  name?: string
  description?: string
  avatar?: string
  permissions?: PermissionType
  llm_id?: string
  memory_size?: number
  forgetting_policy?: ForgettingPolicy
  temperature?: number
  system_prompt?: string
  user_prompt?: string
}

/**
 * 记忆库列表查询参数
 */
export interface MemoryListParams {
  page?: number
  page_size?: number
  keywords?: string
  memory_type?: string[]
  storage_type?: StorageType
  tenant_id?: string[]
}

/**
 * 消息列表查询参数
 */
export interface MessageListParams {
  page?: number
  page_size?: number
  keywords?: string
  message_type?: MemoryType[]
  status?: boolean
  session_id?: string
}

// ============ API 响应类型 ============

/**
 * 记忆库列表响应
 */
export interface MemoryListResponse {
  memory_list: Memory[]
  total_count: number
}

/**
 * 消息列表响应
 */
export interface MessageListResponse {
  message_list: MemoryMessage[]
  total_count: number
}

/**
 * 消息内容响应
 */
export interface MessageContentResponse {
  content: string
  content_embed?: string
}

// ============ 前端状态类型 ============

/**
 * 记忆库筛选状态
 */
export interface MemoryFilterState {
  keywords: string
  memoryType: string[]
  storageType: StorageType | ''
  tenantId: string[]
}

/**
 * 消息筛选状态
 */
export interface MessageFilterState {
  keywords: string
  messageType: MemoryType[]
  status: boolean | null
}

// ============ 表单类型 ============

/**
 * 创建记忆库表单值
 */
export interface CreateMemoryFormValues {
  name: string
  memory_type: string[]  // 如 ['raw', 'semantic']
  embd_id: string
  llm_id: string
}

/**
 * 记忆库设置表单值
 * 注意：memory_type, storage_type, embd_id 不可编辑（只读展示）
 */
export interface MemorySettingsFormValues {
  name: string
  description: string
  avatar: string
  permissions: PermissionType
  llm_id: string
  memory_size: number
  forgetting_policy: ForgettingPolicy
  temperature: number
  system_prompt: string
  user_prompt: string
}
