import type { APIResponse } from '@/types/api'
import { STORAGE_KEYS, API_BASE_URL, API_VERSION, ERROR_MESSAGES } from '@/constants'

export class APIError extends Error {
  public status: number
  public code: string
  public details?: any

  constructor(
    status: number,
    code: string,
    message: string,
    details?: any
  ) {
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
}

class APIClient {
  private baseURL: string
  private defaultTimeout: number = 30000
  private authToken: string | null = null

  constructor(baseURL?: string) {
    this.baseURL = baseURL || API_BASE_URL
    // 初始化时从localStorage获取token
    this.authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  }

  private getAuthToken(): string | null {
    return this.authToken || localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  }

  // 设置认证token
  setAuthToken(token: string | null): void {
    this.authToken = token
    if (token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token)
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN)
    }
  }

  private async request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      skipAuth = false,
      baseURL = this.baseURL,
      headers = {},
      ...requestConfig
    } = config

    // 构建完整URL
    let url: string
    if (endpoint.startsWith('http')) {
      url = endpoint
    } else {
      // 如果endpoint不以/v1开头，则添加API版本前缀
      const apiPath = endpoint.startsWith(`/${API_VERSION}`) ? endpoint : `/${API_VERSION}${endpoint}`
      url = `${baseURL}${apiPath}`
    }

    // 设置请求头
    const requestHeaders: Record<string, string> = {
      // 只在非FormData时设置Content-Type
      ...(!(requestConfig.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(headers as Record<string, string>),
    }
    
    // 过滤掉undefined值
    Object.keys(requestHeaders).forEach(key => {
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
          throw new APIError(
            response.status,
            'HTTP_ERROR',
            `HTTP ${response.status}: ${response.statusText}`
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
          data: rawData.data
        } as APIResponse<T>
      } else {
        // 直接返回数据的格式
        return rawData as T
      }

      // 对于登录接口，从响应头中提取token
      if (endpoint.includes('/user/login') || endpoint.includes('/user/register')) {
        const token = response.headers.get('Authorization')
        if (token) {
          (data as any).auth = token
        }
      }

      // 处理业务错误
      if (!response.ok || data.retcode !== 0) {
        // 处理认证错误
        if (response.status === 401) {
          // 清除无效token
          this.setAuthToken(null)
          // 抛出错误让上层处理重定向
          throw new APIError(401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED)
        }

        throw new APIError(
          response.status,
          data.retcode?.toString() || 'API_ERROR',
          data.retmsg || ERROR_MESSAGES.SERVER_ERROR,
          data.data
        )
      }

      // 对于登录等特殊接口，需要返回完整数据（包含auth字段）
      // 检查URL是否是登录接口
      if (endpoint.includes('/user/login') || endpoint.includes('/user/register')) {
        return data as T
      }
      
      return data.data as T
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof APIError) {
        throw error
      }

      const err = error as Error
      if (err.name === 'AbortError') {
        throw new APIError(408, 'TIMEOUT', '请求超时，请重试')
      }

      if (!navigator.onLine) {
        throw new APIError(0, 'NETWORK_ERROR', ERROR_MESSAGES.NETWORK_ERROR)
      }

      throw new APIError(
        500,
        'UNKNOWN_ERROR',
        err.message || ERROR_MESSAGES.SERVER_ERROR
      )
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
    config?: RequestConfig
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
    config?: RequestConfig
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
    config?: RequestConfig
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
    config?: Omit<RequestConfig, 'headers'>
  ): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = this.getAuthToken()
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
    config?: Omit<RequestConfig, 'headers'>
  ): Promise<T> {
    const formData = new FormData()
    
    files.forEach((file) => {
      formData.append(`files`, file)
    })

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    const token = this.getAuthToken()
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
    config?: RequestConfig
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
          const matches = contentDisposition.match(/filename\*=UTF-8''(.+)|filename="(.+)"|filename=(.+)/)
          if (matches) {
            downloadFilename = decodeURIComponent(matches[1] || matches[2] || matches[3])
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
    }
  ): EventSource {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`
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
if (import.meta.env.DEV) {
  ;(window as any).apiClient = apiClient
}

// 导出类型
export { APIClient }