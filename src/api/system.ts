import { apiClient } from '@/api/client'
import { API_BASE_URL } from '@/constants'
import type {
  APITokenCreateRequest,
  SystemAPIToken,
  FilterRule,
  FilterResponse,
} from '@/types/api'

// RESTful 端点（/api/v1）使用的 base，区别于默认的 /v1
const sdkBase = { baseURL: `${API_BASE_URL}/api` }

// 系统状态相关类型定义
export interface SystemComponentStatus {
  status: 'green' | 'red' | 'yellow'
  elapsed: string
  error?: string
}

export interface DatabaseStatus extends SystemComponentStatus {
  database: string
}

export interface DocEngineStatus extends SystemComponentStatus {
  type: string
  version?: string
}

export interface RedisStatus extends SystemComponentStatus {
  // Redis specific status properties can be added here if needed
}

export interface StorageStatus extends SystemComponentStatus {
  storage: string
}

export interface DatabasePoolStatus extends SystemComponentStatus {
  pool_size: number
  checked_out: number
  checked_in: number
  overflow: number
  total_connections: number
  usage_rate: string
}

export interface TaskExecutorHeartbeat {
  name: string
  now: string // ISO 8601 format
  boot_at: string // ISO 8601 format
  pending: number
  lag: number
  done: number
  failed: number
  current: Record<string, any> // 当前任务信息
}

export interface SystemStatusResponse {
  database: DatabaseStatus
  database_pool?: DatabasePoolStatus
  doc_engine: DocEngineStatus
  redis: RedisStatus
  storage: StorageStatus
  task_executor_heartbeats: Record<string, TaskExecutorHeartbeat[]>
}

// 系统版本信息类型定义
export interface SystemVersionResponse {
  version: string
  build_time?: string
  git_commit?: string
  git_branch?: string
  python_version?: string
  platform?: string
  [key: string]: any // 允许其他版本相关字段
}

// 如果后端返回的是简单字符串，可以使用这个类型
export type SystemVersionString = string

// 系统API客户端
export const systemAPI = {
  // 获取系统状态
  async getStatus(): Promise<SystemStatusResponse> {
    return apiClient.get<SystemStatusResponse>('/system/status')
  },

  // 获取系统版本信息（已迁移到 RESTful /api/v1/system/version）
  async getVersion(): Promise<SystemVersionResponse | SystemVersionString> {
    return apiClient.get<SystemVersionResponse | SystemVersionString>(
      '/system/version',
      sdkBase,
    )
  },

  // API Token 管理
  // 创建新的API访问令牌
  async createToken(data: APITokenCreateRequest): Promise<SystemAPIToken> {
    return apiClient.post<SystemAPIToken>('/system/tokens', data, sdkBase)
  },

  // 获取API访问令牌列表
  async getTokenList(): Promise<SystemAPIToken[]> {
    return apiClient.get<SystemAPIToken[]>('/system/tokens', sdkBase)
  },

  // 删除API访问令牌
  async deleteToken(token: string): Promise<boolean> {
    return apiClient.delete<boolean>(
      `/system/tokens/${encodeURIComponent(token)}`,
      sdkBase,
    )
  },

  // OpenAPI 文档过滤
  // 根据指定规则过滤 OpenAPI 文档
  async filterOpenAPI(rule: FilterRule): Promise<FilterResponse> {
    return apiClient.post<FilterResponse>(
      '/openapi_filter/openapi-filtered',
      rule,
    )
  },
}
