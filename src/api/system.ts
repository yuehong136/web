import { apiClient } from './client'

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
  doc_engine: DocEngineStatus
  redis: RedisStatus
  storage: StorageStatus
  task_executor_heartbeats: Record<string, TaskExecutorHeartbeat[]>
}

// 系统API客户端
export const systemAPI = {
  // 获取系统状态
  async getStatus(): Promise<SystemStatusResponse> {
    return apiClient.get<SystemStatusResponse>('/system/status')
  },
}