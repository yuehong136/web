import { API_BASE_URL } from '@/constants'
import { APIError, apiClient } from './client'
import { withLegacyFallback } from './legacy-fallback'
import type {
  IDataSource,
  IDataSourceBase,
  IDataSourceLog,
  DataSourceKey,
} from '@/pages/settings/datasource/types'
import { DataSourceStatus } from '@/pages/settings/datasource/types'

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

export interface OAuthStartResponse {
  flow_id: string
  authorization_url: string
  expires_in: number
}

/** Google 的 credentials 是 JSON 字符串，Box 的是 {client_id, client_secret, access_token, refresh_token} 对象。 */
export type OAuthPollResult =
  | { status: 'pending' }
  | { status: 'completed'; credentials: unknown }

export interface BoxOAuthStartPayload {
  client_id: string
  client_secret: string
  redirect_uri?: string
}

const connectorRestConfig = { baseURL: `${API_BASE_URL}/api` }

const connectorPath = (id: string) => `/v1/connectors/${encodeURIComponent(id)}`

const datasetConnectorPath = (kbId: string, connectorId: string) =>
  `/v1/datasets/${encodeURIComponent(kbId)}/connectors/${encodeURIComponent(connectorId)}`

/** 后端「授权尚未完成」用信封里的 RetCode.RUNNING 表达，apiClient 会把它抛成 APIError。 */
const RETCODE_RUNNING = '106'

type RawDataSource = Omit<IDataSource, 'status'> & { status: unknown }
type RawDataSourceLog = Omit<IDataSourceLog, 'status'> & { status: unknown }

const DATA_SOURCE_STATUS_MAP: Record<string, DataSourceStatus> = {
  '0': DataSourceStatus.PENDING,
  UNSTART: DataSourceStatus.PENDING,
  pending: DataSourceStatus.PENDING,
  '1': DataSourceStatus.RUNNING,
  RUNNING: DataSourceStatus.RUNNING,
  running: DataSourceStatus.RUNNING,
  '2': DataSourceStatus.PAUSED,
  CANCEL: DataSourceStatus.PAUSED,
  CANCELLED: DataSourceStatus.PAUSED,
  canceled: DataSourceStatus.PAUSED,
  cancelled: DataSourceStatus.PAUSED,
  paused: DataSourceStatus.PAUSED,
  '3': DataSourceStatus.COMPLETED,
  DONE: DataSourceStatus.COMPLETED,
  SUCCESS: DataSourceStatus.COMPLETED,
  completed: DataSourceStatus.COMPLETED,
  done: DataSourceStatus.COMPLETED,
  success: DataSourceStatus.COMPLETED,
  '4': DataSourceStatus.FAILED,
  FAIL: DataSourceStatus.FAILED,
  FAILED: DataSourceStatus.FAILED,
  fail: DataSourceStatus.FAILED,
  failed: DataSourceStatus.FAILED,
  '5': DataSourceStatus.SCHEDULED,
  SCHEDULE: DataSourceStatus.SCHEDULED,
  scheduled: DataSourceStatus.SCHEDULED,
  schedule: DataSourceStatus.SCHEDULED,
}

export function normalizeDataSourceStatus(status: unknown): DataSourceStatus {
  if (typeof status !== 'string') return DataSourceStatus.PENDING
  return DATA_SOURCE_STATUS_MAP[status] ?? DataSourceStatus.PENDING
}

function normalizeDataSource(source: RawDataSource): IDataSource {
  return { ...source, status: normalizeDataSourceStatus(source.status) }
}

function normalizeDataSourceLog(log: RawDataSourceLog): IDataSourceLog {
  return { ...log, status: normalizeDataSourceStatus(log.status) }
}

/**
 * 轮询 OAuth 结果：未完成回 pending，完成回凭证；其余错误照抛。
 *
 * 旧实现打的是 `/v1/connector/<source>/auth/result` 且指望后端回 `{status, tokens}`
 * ——路径和响应形状后端都不存在，所以整套浏览器授权流从来没通过。
 */
async function pollOAuthResult(
  endpoint: string,
  flowId: string,
): Promise<OAuthPollResult> {
  try {
    const result = await apiClient.post<{ credentials: unknown }>(
      endpoint,
      { flow_id: flowId },
      connectorRestConfig,
    )
    return { status: 'completed', credentials: result.credentials }
  } catch (error) {
    if (error instanceof APIError && error.code === RETCODE_RUNNING) {
      return { status: 'pending' }
    }
    throw error
  }
}

export const datasourceAPI = {
  // 数据源 CRUD
  connector: {
    // 获取数据源列表
    list: async (): Promise<IDataSource[]> => {
      const sources = await withLegacyFallback(
        () =>
          apiClient.get<RawDataSource[]>('/v1/connectors', connectorRestConfig),
        () => apiClient.get<RawDataSource[]>('/v1/connector/list'),
      )
      return sources.map(normalizeDataSource)
    },

    // 获取数据源详情
    get: async (id: string): Promise<IDataSource> => {
      const source = await withLegacyFallback(
        () =>
          apiClient.get<RawDataSource>(connectorPath(id), connectorRestConfig),
        () => apiClient.get<RawDataSource>(`/v1/connector/${id}`),
      )
      return normalizeDataSource(source)
    },

    // 创建/更新数据源（RESTful 面拆成了建 POST /connectors 与改 PATCH /connectors/{id}）
    set: ({ id, ...data }: DataSourceSetRequest): Promise<{ id: string }> =>
      withLegacyFallback(
        () =>
          id
            ? apiClient.patch<{ id: string }>(
                connectorPath(id),
                { config: data.config },
                connectorRestConfig,
              )
            : apiClient.post<{ id: string }>(
                '/v1/connectors',
                data,
                connectorRestConfig,
              ),
        () =>
          apiClient.post<{ id: string }>('/v1/connector/set', { id, ...data }),
      ),

    // 删除数据源
    delete: (id: string): Promise<void> =>
      withLegacyFallback(
        () => apiClient.delete<void>(connectorPath(id), connectorRestConfig),
        () => apiClient.post<void>(`/v1/connector/${id}/rm`),
      ),

    // 暂停/恢复数据源
    resume: (id: string, resume: boolean): Promise<void> =>
      withLegacyFallback(
        () =>
          apiClient.post<void>(
            `${connectorPath(id)}/resume`,
            { resume },
            connectorRestConfig,
          ),
        () => apiClient.put<void>(`/v1/connector/${id}/resume`, { resume }),
      ),

    // 重建数据源
    rebuild: (id: string, kbId: string): Promise<void> =>
      withLegacyFallback(
        () =>
          apiClient.post<void>(
            `${connectorPath(id)}/rebuild`,
            { kb_id: kbId },
            connectorRestConfig,
          ),
        () =>
          apiClient.put<void>(`/v1/connector/${id}/rebuild`, { kb_id: kbId }),
      ),

    // 获取数据源日志
    logs: (
      id: string,
      params?: DataSourceLogsParams,
    ): Promise<DataSourceLogsResponse> =>
      withLegacyFallback(
        () =>
          apiClient.get<{ logs: RawDataSourceLog[]; total: number }>(
            `${connectorPath(id)}/logs`,
            {
              ...connectorRestConfig,
              params,
            },
          ),
        () =>
          apiClient.get<{ logs: RawDataSourceLog[]; total: number }>(
            `/v1/connector/${id}/logs`,
            { params },
          ),
      ).then((response) => ({
        ...response,
        logs: response.logs.map(normalizeDataSourceLog),
      })),

    // 链接数据源到知识库（PUT 幂等：已关联时只更新 auto_parse）
    link: (
      connectorId: string,
      kbId: string,
      autoParse?: boolean,
    ): Promise<void> =>
      apiClient.put<void>(
        datasetConnectorPath(kbId, connectorId),
        { auto_parse: autoParse ?? true },
        connectorRestConfig,
      ),

    // 解除数据源与知识库的链接
    unlink: (connectorId: string, kbId: string): Promise<void> =>
      apiClient.delete<void>(
        datasetConnectorPath(kbId, connectorId),
        connectorRestConfig,
      ),

    // 更新数据源自动解析设置（与 link 同一端点）
    updateAutoParse: (
      connectorId: string,
      kbId: string,
      autoParse: boolean,
    ): Promise<void> =>
      apiClient.put<void>(
        datasetConnectorPath(kbId, connectorId),
        { auto_parse: autoParse },
        connectorRestConfig,
      ),

    // 获取知识库关联的数据源列表
    listByKb: (kbId: string): Promise<IDataSourceBase[]> =>
      apiClient.get<IDataSourceBase[]>(
        `/v1/datasets/${encodeURIComponent(kbId)}/connectors`,
        connectorRestConfig,
      ),
  },

  // OAuth 认证（浏览器弹窗授权，替代手工粘贴 token JSON）
  oauth: {
    // Google Drive OAuth 开始
    startGoogleDrive: (
      payload: OAuthStartPayload,
    ): Promise<OAuthStartResponse> =>
      apiClient.post<OAuthStartResponse>(
        '/v1/connectors/google/oauth/web/start?source=google-drive',
        payload,
        connectorRestConfig,
      ),

    // Google Drive OAuth 轮询结果
    pollGoogleDrive: ({
      flow_id,
    }: OAuthPollPayload): Promise<OAuthPollResult> =>
      pollOAuthResult(
        '/v1/connectors/google/oauth/web/result?source=google-drive',
        flow_id,
      ),

    // Gmail OAuth 开始
    startGmail: (payload: OAuthStartPayload): Promise<OAuthStartResponse> =>
      apiClient.post<OAuthStartResponse>(
        '/v1/connectors/google/oauth/web/start?source=gmail',
        payload,
        connectorRestConfig,
      ),

    // Gmail OAuth 轮询结果
    pollGmail: ({ flow_id }: OAuthPollPayload): Promise<OAuthPollResult> =>
      pollOAuthResult(
        '/v1/connectors/google/oauth/web/result?source=gmail',
        flow_id,
      ),

    // Box OAuth 开始
    startBox: (payload: BoxOAuthStartPayload): Promise<OAuthStartResponse> =>
      apiClient.post<OAuthStartResponse>(
        '/v1/connectors/box/oauth/web/start',
        payload,
        connectorRestConfig,
      ),

    // Box OAuth 轮询结果
    pollBox: ({ flow_id }: OAuthPollPayload): Promise<OAuthPollResult> =>
      pollOAuthResult('/v1/connectors/box/oauth/web/result', flow_id),
  },
}
