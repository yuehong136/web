import { apiClient } from './client'
import type {
  IDataSource,
  IDataSourceBase,
  IDataSourceLog,
  DataSourceKey,
} from '@/pages/settings/datasource/types'

export interface DataSourceSetRequest {
  id?: string
  name: string
  source: DataSourceKey
  config: Record<string, unknown>
}

export interface DataSourceLogsParams {
  page?: number
  page_size?: number
}

export interface DataSourceLogsResponse {
  logs: IDataSourceLog[]
  total: number
}

export interface OAuthStartPayload {
  credentials: string
}

export interface OAuthPollPayload {
  flow_id: string
}

export interface BoxOAuthStartPayload {
  client_id: string
  client_secret: string
  redirect_uri?: string
}

export const datasourceAPI = {
  // 数据源 CRUD
  connector: {
    // 获取数据源列表
    list: (): Promise<IDataSource[]> =>
      apiClient.get('/v1/connector/list'),

    // 获取数据源详情
    get: (id: string): Promise<IDataSource> =>
      apiClient.get(`/v1/connector/${id}`),

    // 创建/更新数据源
    set: (data: DataSourceSetRequest): Promise<{ id: string }> =>
      apiClient.post('/v1/connector/set', data),

    // 删除数据源
    delete: (id: string): Promise<void> =>
      apiClient.post(`/v1/connector/${id}/rm`),

    // 暂停/恢复数据源
    resume: (id: string, resume: boolean): Promise<void> =>
      apiClient.put(`/v1/connector/${id}/resume`, { resume }),

    // 重建数据源
    rebuild: (id: string, kbId: string): Promise<void> =>
      apiClient.put(`/v1/connector/${id}/rebuild`, { kb_id: kbId }),

    // 获取数据源日志
    logs: (id: string, params?: DataSourceLogsParams): Promise<DataSourceLogsResponse> =>
      apiClient.get(`/v1/connector/${id}/logs`, { params }),

    // 链接数据源到知识库
    link: (connectorId: string, kbId: string, autoParse?: boolean): Promise<void> =>
      apiClient.post('/v1/connector/link', {
        connector_id: connectorId,
        kb_id: kbId,
        auto_parse: autoParse ? '1' : '0',
      }),

    // 解除数据源与知识库的链接
    unlink: (connectorId: string, kbId: string): Promise<void> =>
      apiClient.post('/v1/connector/unlink', {
        connector_id: connectorId,
        kb_id: kbId,
      }),

    // 更新数据源自动解析设置
    updateAutoParse: (connectorId: string, kbId: string, autoParse: boolean): Promise<void> =>
      apiClient.post('/v1/connector/update_auto_parse', {
        connector_id: connectorId,
        kb_id: kbId,
        auto_parse: autoParse ? '1' : '0',
      }),

    // 获取知识库关联的数据源列表
    listByKb: (kbId: string): Promise<IDataSourceBase[]> =>
      apiClient.get(`/v1/connector/list_by_kb?kb_id=${kbId}`),
  },

  // OAuth 认证
  oauth: {
    // Google Drive OAuth 开始
    startGoogleDrive: (payload: OAuthStartPayload): Promise<{ flow_id: string; auth_url: string }> =>
      apiClient.post('/v1/connector/google-drive/auth/start', payload),

    // Google Drive OAuth 轮询结果
    pollGoogleDrive: (payload: OAuthPollPayload): Promise<{ status: string; tokens?: string }> =>
      apiClient.post('/v1/connector/google-drive/auth/result', payload),

    // Gmail OAuth 开始
    startGmail: (payload: OAuthStartPayload): Promise<{ flow_id: string; auth_url: string }> =>
      apiClient.post('/v1/connector/gmail/auth/start', payload),

    // Gmail OAuth 轮询结果
    pollGmail: (payload: OAuthPollPayload): Promise<{ status: string; tokens?: string }> =>
      apiClient.post('/v1/connector/gmail/auth/result', payload),

    // Box OAuth 开始
    startBox: (payload: BoxOAuthStartPayload): Promise<{ flow_id: string; auth_url: string }> =>
      apiClient.post('/v1/connector/box/auth/start', payload),

    // Box OAuth 轮询结果
    pollBox: (payload: OAuthPollPayload): Promise<{ status: string; tokens?: string }> =>
      apiClient.post('/v1/connector/box/auth/result', payload),
  },
}
