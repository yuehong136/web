import type { APIResponse } from '@/types/api'
import { STORAGE_KEYS, API_BASE_URL, API_VERSION } from '@/constants'
import { APIError, extractErrorMessage, te } from './client-types'
import type { RequestConfig } from './client-types'

// 错误契约与请求配置类型见 ./client-types，这里重新导出以保持既有导入路径不变
export { APIError } from './client-types'
export type { ApiEnvelope, RequestConfig } from './client-types'

/**
 * 登录/注册端点（RESTful `/api/v1`）：`POST /auth/login`、`POST /users`。
 *
 * 这两条要单独识别，因为它们的 JWT 只在 `Authorization` 响应头里，而且调用方需要
 * 完整信封（`auth` + `data`）而不是 `data.data`。
 */
const AUTH_ENVELOPE_ENDPOINTS = new Set(['/auth/login', '/users'])

/**
 * 判断是否登录/注册端点。
 *
 * 必须是精确路径匹配 + 方法匹配，不能用 `endpoint.includes()`：`/auth/login/channels`、
 * `/auth/login/{channel}`、`/users/me`、`/users/me/models` 都是返回普通信封的端点，
 * 一旦被顺带命中，调用方拿到的就是信封而不是数据。
 */
function isAuthEnvelopeEndpoint(endpoint: string, method?: string): boolean {
  if ((method ?? 'GET').toUpperCase() !== 'POST') return false

  const rawPath = endpoint.startsWith('http')
    ? new URL(endpoint).pathname
    : (endpoint.split('?')[0] ?? '')

  const path = rawPath
    .replace(/^\/api/, '')
    .replace(/^\/v1/, '')
    .replace(/\/+$/, '')

  return AUTH_ENVELOPE_ENDPOINTS.has(path)
}

class APIClient {
  private baseURL: string
  private defaultTimeout: number = 30000
  private authToken: string | null = null

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_BASE_URL
    this.authToken = this.readStorage(STORAGE_KEYS.AUTH_TOKEN)
  }

  private readStorage(key: string): string | null {
    if (typeof localStorage === 'undefined') {
      return null
    }

    return localStorage.getItem(key)
  }

  private getAuthToken(): string | null {
    return this.authToken || this.readStorage(STORAGE_KEYS.AUTH_TOKEN)
  }

  private hasAuthToken(): boolean {
    return Boolean(this.getAuthToken())
  }

  private clearAuthState(): void {
    this.setAuthToken(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER_INFO)
    }
  }

  private notifyUnauthorized(): void {
    if (typeof window === 'undefined') {
      return
    }

    const currentUrl = new URL(window.location.href)
    if (!currentUrl.pathname.startsWith('/auth/')) {
      currentUrl.searchParams.set('expired', 'true')
      window.history.replaceState({}, '', currentUrl.toString())
    }

    window.dispatchEvent(
      new CustomEvent('auth:logout', {
        detail: { reason: 'token_expired' },
      }),
    )
  }

  private handleUnauthorized(skipAuth = false): void {
    if (skipAuth || !this.hasAuthToken()) {
      return
    }

    this.clearAuthState()
    this.notifyUnauthorized()
  }

  // 设置认证token
  setAuthToken(token: string | null): void {
    this.authToken = token
    if (typeof localStorage === 'undefined') {
      return
    }

    if (token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    }
  }

  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      skipAuth = false,
      baseURL = this.baseURL,
      headers = {},
      params,
      data,
      withEnvelope = false,
      ...requestConfig
    } = config

    const isAuthEnvelope = isAuthEnvelopeEndpoint(
      endpoint,
      requestConfig.method,
    )

    // 构建完整URL
    let url: string
    if (endpoint.startsWith('http')) {
      url = endpoint
    } else {
      // 如果endpoint不以/v1开头，则添加API版本前缀
      const apiPath = endpoint.startsWith(`/${API_VERSION}`)
        ? endpoint
        : `/${API_VERSION}${endpoint}`
      url = `${baseURL}${apiPath}`
    }
    if (params && Object.keys(params).length > 0) {
      const search = new URLSearchParams()
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== '') search.set(k, String(v))
      }
      const q = search.toString()
      if (q) url += (url.includes('?') ? '&' : '?') + q
    }
    if (data !== undefined && !requestConfig.body) {
      requestConfig.body =
        typeof data === 'object' ? JSON.stringify(data) : (data as BodyInit)
    }

    // 设置请求头
    const requestHeaders: Record<string, string> = {
      // 只在非FormData时设置Content-Type
      ...(!(requestConfig.body instanceof FormData) && {
        'Content-Type': 'application/json',
      }),
      ...(headers as Record<string, string>),
    }

    // 过滤掉undefined值
    Object.keys(requestHeaders).forEach((key) => {
      if (requestHeaders[key] === undefined) {
        delete requestHeaders[key]
      }
    })

    // 添加认证头
    if (!skipAuth) {
      const token = this.getAuthToken()
      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`
      }
    }

    // 创建请求配置
    const requestOptions: RequestInit = {
      ...requestConfig,
      headers: requestHeaders,
    }

    // 添加超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    requestOptions.signal = controller.signal

    try {
      const response = await fetch(url, requestOptions)
      clearTimeout(timeoutId)

      // 处理非JSON响应
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        if (!response.ok) {
          // 特殊处理401错误，即使是非JSON响应也要执行认证逻辑
          if (response.status === 401) {
            this.handleUnauthorized(config.skipAuth)
          }

          throw new APIError(
            response.status,
            'HTTP_ERROR',
            `HTTP ${response.status}: ${response.statusText}`,
          )
        }
        return response as any
      }

      // 解析JSON响应
      const rawData = await response.json()

      // 兼容不同的响应格式
      let data: APIResponse<T>
      if (rawData.retcode !== undefined) {
        // 旧格式: { retcode, retmsg, data }
        data = rawData
      } else if (rawData.code !== undefined) {
        // 新格式: { code, message, data }
        data = {
          retcode: rawData.code,
          retmsg: rawData.message,
          data: rawData.data,
        } as APIResponse<T>
      } else {
        // 直接返回数据的格式，但先检查是否是401错误
        if (response.status === 401) {
          this.handleUnauthorized(config.skipAuth)

          // 抛出错误
          throw new APIError(
            401,
            'UNAUTHORIZED',
            rawData.detail || rawData.message || te('unauthorized'),
          )
        }

        // 非信封格式的错误响应（FastAPI 的 {"detail": ...}、网关返回的错误 JSON
        // 等）同样要抛错——否则调用方拿到的是一个形状完全不对的“数据”，错误会在
        // 更远的地方以更迷惑的方式爆出来。
        if (!response.ok) {
          throw new APIError(
            response.status,
            'HTTP_ERROR',
            extractErrorMessage(rawData) ||
              `HTTP ${response.status}: ${response.statusText}`,
            rawData,
          )
        }

        return rawData as T
      }

      // 对于登录接口，从响应头中提取token
      if (isAuthEnvelope) {
        const token = response.headers.get('Authorization')
        if (token) {
          ;(data as any).auth = token
        }
      }

      // 处理业务错误
      if (!response.ok || data.retcode !== 0) {
        // 处理认证错误
        if (response.status === 401) {
          this.handleUnauthorized(config.skipAuth)

          // 抛出错误让上层处理
          throw new APIError(401, 'UNAUTHORIZED', te('unauthorized'))
        }

        throw new APIError(
          response.status,
          data.retcode?.toString() || 'API_ERROR',
          data.retmsg || te('serverError'),
          data.data,
        )
      }

      // 对于登录等特殊接口，需要返回完整数据（包含auth字段）
      if (isAuthEnvelope) {
        return data as T
      }

      // opt-in：返回完整信封，保留顶层分页总数（RESTful list 的 total_datasets）
      if (withEnvelope) {
        return {
          data: data.data,
          total: rawData.total_datasets ?? rawData.total,
          retcode: data.retcode,
          retmsg: data.retmsg,
        } as T
      }

      return data.data as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof APIError) {
        throw error
      }

      const err = error as Error
      if (err.name === 'AbortError') {
        throw new APIError(408, 'TIMEOUT', te('timeout'))
      }

      if (!navigator.onLine) {
        throw new APIError(0, 'NETWORK_ERROR', te('network'))
      }

      throw new APIError(500, 'UNKNOWN_ERROR', err.message || te('serverError'))
    }
  }

  // GET 请求
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  // POST 请求
  async post<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PUT 请求
  async put<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // PATCH 请求
  async patch<T = any>(
    endpoint: string,
    data?: any,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  // DELETE 请求
  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  // 文件上传
  async upload<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    config?: Omit<RequestConfig, 'headers'>,
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file, file.name)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = config?.skipAuth ? null : this.getAuthToken()
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers,
    })
  }

  async uploadRepeated<T = any>(
    endpoint: string,
    fieldName: string,
    files: File[],
    additionalData?: Record<string, any>,
    config?: Omit<RequestConfig, 'headers'>,
  ): Promise<T> {
    const formData = new FormData()

    files.forEach((file) => {
      formData.append(fieldName, file, file.name)
    })

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = config?.skipAuth ? null : this.getAuthToken()
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers,
    })
  }

  // 多文件上传
  async uploadMultiple<T = any>(
    endpoint: string,
    files: File[],
    additionalData?: Record<string, any>,
    config?: Omit<RequestConfig, 'headers'>,
  ): Promise<T> {
    const formData = new FormData()

    files.forEach((file) => {
      // 显式传 file.name 作为文件名，防止 webkitdirectory 选择的文件
      // 被浏览器自动使用 webkitRelativePath（含文件夹路径）作为文件名
      formData.append(`files`, file, file.name)
    })

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = config?.skipAuth ? null : this.getAuthToken()
    const headers: HeadersInit = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers,
    })
  }

  // 下载文件
  async download(
    endpoint: string,
    filename?: string,
    config?: RequestConfig,
  ): Promise<void> {
    const response = await this.request<Response>(endpoint, {
      ...config,
      headers: {
        ...config?.headers,
      },
    })

    if (response instanceof Response) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // 优先使用传入的文件名，否则从响应头中获取
      let downloadFilename = filename
      if (!downloadFilename) {
        const contentDisposition = response.headers.get('Content-Disposition')
        if (contentDisposition) {
          const matches = contentDisposition.match(
            /filename\*=UTF-8''(.+)|filename="(.+)"|filename=(.+)/,
          )
          if (matches) {
            const headerFilename = matches[1] || matches[2] || matches[3]
            if (headerFilename) {
              downloadFilename = decodeURIComponent(headerFilename)
            }
          }
        }
      }

      link.download = downloadFilename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  }

  // Server-Sent Events
  createEventSource(
    endpoint: string,
    options?: {
      onMessage?: (data: any) => void
      onError?: (error: Event) => void
      onOpen?: (event: Event) => void
    },
  ): EventSource {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${this.baseURL}${endpoint}`
    const eventSource = new EventSource(url)

    if (options?.onMessage) {
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          options.onMessage!(data)
        } catch (error) {
          console.error('Failed to parse SSE data:', error)
          options.onMessage!(event.data)
        }
      }
    }

    if (options?.onError) {
      eventSource.onerror = options.onError
    }

    if (options?.onOpen) {
      eventSource.onopen = options.onOpen
    }

    return eventSource
  }

  // 设置基础URL
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL
  }

  // 设置默认超时时间
  setDefaultTimeout(timeout: number): void {
    this.defaultTimeout = timeout
  }
}

// 创建默认客户端实例
export const apiClient = new APIClient()

// 在开发环境中将apiClient暴露到全局，便于调试
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  ;(window as any).apiClient = apiClient
}

// 导出类型
export { APIClient }
