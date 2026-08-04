import i18n from 'i18next'

/**
 * APIClient 的共享契约 —— 从 client.ts 抽出（ENG-1 文件体积棘轮）。
 *
 * 这里只放错误类型、错误消息解析与请求配置/信封的类型定义，
 * 不含任何请求逻辑。client.ts 重新导出这些符号，既有导入路径不变。
 */

/** API 错误文案统一走 common.errors.* 命名空间 */
export const te = (key: string) => i18n.t(`common.errors.${key}`)

/**
 * 从非信封格式的错误响应里取一条可读消息。
 *
 * FastAPI 的 `detail` 既可能是字符串（HTTPException），也可能是 422 校验错误的
 * 数组（每项带 `msg`）；网关返回的错误 JSON 一般是 `message`。
 */
export const extractErrorMessage = (rawData: unknown): string | null => {
  if (typeof rawData !== 'object' || rawData === null) return null
  const record = rawData as Record<string, unknown>

  const detail = record.detail
  if (typeof detail === 'string' && detail) return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        typeof item === 'object' && item !== null && 'msg' in item
          ? String((item as { msg: unknown }).msg)
          : null,
      )
      .filter((msg): msg is string => Boolean(msg))
    if (messages.length > 0) return messages.join('; ')
  }

  return typeof record.message === 'string' && record.message
    ? record.message
    : null
}

export class APIError extends Error {
  public status: number
  public code: string
  public details?: any

  constructor(status: number, code: string, message: string, details?: any) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export interface RequestConfig extends RequestInit {
  timeout?: number
  skipAuth?: boolean
  baseURL?: string
  _isRetry?: boolean
  /** GET 等请求的 URL 查询参数，会在 request 中序列化到 URL */
  params?: Record<string, any> | any
  /** POST/PUT 等请求体（若由调用方直接传入 config 时使用） */
  data?: unknown
  /**
   * 返回完整信封而非仅 data.data。开启后返回 {@link ApiEnvelope}，
   * 用于取回信封顶层的分页总数（如 RESTful list 的 `total_datasets`）。
   * 默认 false —— 其它接口行为完全不变（opt-in）。
   */
  withEnvelope?: boolean
}

/**
 * opt-in 信封返回（{@link RequestConfig.withEnvelope}）。
 * `total` 取自响应顶层 `total_datasets`（兼容 `total`），不在 `data` 内。
 */
export interface ApiEnvelope<T = any> {
  data: T
  total?: number
  retcode: number
  retmsg?: string
}
