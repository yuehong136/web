// OpenAPI 数据加载服务
// 支持静态文件 + 动态切片的架构

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
    contact?: {
      name?: string
      email?: string
    }
    license?: {
      name?: string
      url?: string
    }
  }
  servers: Array<{
    url: string
    description?: string
  }>
  paths: Record<string, any>
  components?: {
    schemas?: Record<string, any>
    securitySchemes?: Record<string, any>
  }
  tags?: Array<{
    name: string
    description?: string
  }>
  security?: Array<Record<string, string[]>>
}

export interface APIEndpoint {
  id: string
  operationId?: string
  summary: string
  description?: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
  path: string
  tags?: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Response[]
  security?: Record<string, string[]>[]
  deprecated?: boolean
}

export interface Parameter {
  name: string
  in: "query" | "header" | "path" | "cookie"
  schema?: Schema
  type?: string
  required: boolean
  description: string
  example?: any
}

export interface Schema {
  type: string
  properties?: Record<string, Schema>
  required?: string[]
  example?: any
  description?: string
  format?: string
  items?: Schema
  enum?: string[]
  $ref?: string
}

export interface RequestBody {
  description?: string
  required?: boolean
  content: Record<string, {
    schema: Schema
    example?: any
  }>
}

export interface Response {
  status: number
  description: string
  content?: Record<string, {
    schema: Schema
    example?: any
  }>
  headers?: Record<string, Parameter>
}

export interface Environment {
  id: string
  name: string
  variables: Record<string, string>
}

export interface LoaderConfig {
  staticUrl?: string
  dynamicApiUrl?: string
  cacheEnabled?: boolean
  cacheTTL?: number
  userPermissions?: string[]
}

class APILoader {
  private config: LoaderConfig
  private cache: Map<string, { data: any; timestamp: number }> = new Map()
  private staticSpec: OpenAPISpec | null = null

  constructor(config: LoaderConfig = {}) {
    this.config = {
      staticUrl: '/openapi.json',
      dynamicApiUrl: '/api/docs/slice',
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5分钟
      ...config
    }
  }

  /**
   * 加载静态OpenAPI规范作为保底
   */
  async loadStaticSpec(): Promise<OpenAPISpec> {
    if (this.staticSpec) {
      return this.staticSpec
    }

    try {
      const response = await fetch(this.config.staticUrl!)
      if (!response.ok) {
        throw new Error(`Failed to load static spec: ${response.status}`)
      }
      
      this.staticSpec = await response.json()
      return this.staticSpec as OpenAPISpec
    } catch (error) {
      console.warn('Failed to load static OpenAPI spec from file, using fallback:', error)
      
      // 使用内置的静态数据作为后备
      this.staticSpec = this.getFallbackStaticSpec()
      return this.staticSpec
    }
  }

  /**
   * 获取内置的静态API规范数据
   */
  private getFallbackStaticSpec(): OpenAPISpec {
    return {
      "openapi": "3.0.3",
      "info": {
        "title": "用户管理系统 API",
        "version": "v1.0.0",
        "description": "一个完整的用户管理系统API，支持用户注册、登录、信息管理等功能",
        "contact": {
          "name": "API Support",
          "email": "support@example.com"
        },
        "license": {
          "name": "MIT",
          "url": "https://opensource.org/licenses/MIT"
        }
      },
      "servers": [
        {
          "url": "https://api.example.com",
          "description": "生产环境"
        },
        {
          "url": "https://staging-api.example.com",
          "description": "测试环境"
        },
        {
          "url": "http://localhost:3000",
          "description": "本地开发环境"
        }
      ],
      "paths": {
        "/api/v1/users": {
          "get": {
            "operationId": "getUsers",
            "summary": "获取用户列表",
            "description": "获取系统中所有用户的分页列表，支持搜索和筛选功能",
            "tags": ["用户管理"],
            "parameters": [
              {
                "name": "page",
                "in": "query",
                "schema": {
                  "type": "integer",
                  "default": 1,
                  "minimum": 1
                },
                "required": false,
                "description": "页码，默认为1",
                "example": 1
              },
              {
                "name": "limit",
                "in": "query",
                "schema": {
                  "type": "integer",
                  "default": 20,
                  "minimum": 1,
                  "maximum": 100
                },
                "required": false,
                "description": "每页数量，默认为20，最大100",
                "example": 20
              },
              {
                "name": "search",
                "in": "query",
                "schema": {
                  "type": "string"
                },
                "required": false,
                "description": "搜索关键词，支持用户名和邮箱搜索",
                "example": "admin"
              },
              {
                "name": "role",
                "in": "query",
                "schema": {
                  "type": "string",
                  "enum": ["admin", "user", "moderator"]
                },
                "required": false,
                "description": "按角色筛选",
                "example": "admin"
              }
            ],
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "responses": {
              "200": {
                "description": "成功返回用户列表",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/User"
                          }
                        },
                        "meta": {
                          "$ref": "#/components/schemas/PaginationMeta"
                        }
                      }
                    },
                    "example": {
                      "data": [
                        {
                          "id": 1,
                          "username": "admin",
                          "email": "admin@example.com",
                          "role": "admin",
                          "createdAt": "2023-01-01T00:00:00Z",
                          "updatedAt": "2023-01-01T00:00:00Z"
                        }
                      ],
                      "meta": {
                        "total": 150,
                        "page": 1,
                        "limit": 20,
                        "totalPages": 8
                      }
                    }
                  }
                }
              },
              "400": {
                "description": "请求参数错误",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    },
                    "example": {
                      "error": "Invalid parameters",
                      "code": 400001,
                      "details": {
                        "field": "limit",
                        "message": "Limit must be between 1 and 100"
                      }
                    }
                  }
                }
              },
              "401": {
                "description": "未授权访问",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    },
                    "example": {
                      "error": "Unauthorized",
                      "code": 401001,
                      "details": {
                        "message": "Invalid or expired token"
                      }
                    }
                  }
                }
              }
            }
          },
          "post": {
            "operationId": "createUser",
            "summary": "创建用户",
            "description": "创建新的用户账户，需要管理员权限",
            "tags": ["用户管理"],
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "requestBody": {
              "description": "用户创建信息",
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/CreateUserRequest"
                  },
                  "example": {
                    "username": "johndoe",
                    "email": "john@example.com",
                    "password": "password123",
                    "role": "user"
                  }
                }
              }
            },
            "responses": {
              "201": {
                "description": "用户创建成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/User"
                    },
                    "example": {
                      "id": 123,
                      "username": "johndoe",
                      "email": "john@example.com",
                      "role": "user",
                      "createdAt": "2023-12-01T10:00:00Z",
                      "updatedAt": "2023-12-01T10:00:00Z"
                    }
                  }
                }
              },
              "400": {
                "description": "请求参数错误",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              },
              "409": {
                "description": "用户名或邮箱已存在",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/users/{id}": {
          "get": {
            "operationId": "getUserById",
            "summary": "获取用户详情",
            "description": "根据用户ID获取用户详细信息",
            "tags": ["用户管理"],
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "integer"
                },
                "description": "用户ID",
                "example": 123
              }
            ],
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "responses": {
              "200": {
                "description": "成功返回用户信息",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/User"
                    }
                  }
                }
              },
              "404": {
                "description": "用户不存在",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          },
          "put": {
            "operationId": "updateUser",
            "summary": "更新用户信息",
            "description": "更新指定用户的信息",
            "tags": ["用户管理"],
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "integer"
                },
                "description": "用户ID",
                "example": 123
              }
            ],
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "requestBody": {
              "description": "更新用户信息",
              "required": true,
              "content": {
                "application/json": {
                  "schema": {
                    "$ref": "#/components/schemas/UpdateUserRequest"
                  },
                  "example": {
                    "email": "newemail@example.com",
                    "role": "admin"
                  }
                }
              }
            },
            "responses": {
              "200": {
                "description": "用户信息更新成功",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/User"
                    }
                  }
                }
              },
              "404": {
                "description": "用户不存在",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          },
          "delete": {
            "operationId": "deleteUser",
            "summary": "删除用户",
            "description": "删除指定的用户账户",
            "tags": ["用户管理"],
            "parameters": [
              {
                "name": "id",
                "in": "path",
                "required": true,
                "schema": {
                  "type": "integer"
                },
                "description": "用户ID",
                "example": 123
              }
            ],
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "responses": {
              "204": {
                "description": "用户删除成功"
              },
              "404": {
                "description": "用户不存在",
                "content": {
                  "application/json": {
                    "schema": {
                      "$ref": "#/components/schemas/ErrorResponse"
                    }
                  }
                }
              }
            }
          }
        },
        "/api/v1/orders": {
          "get": {
            "operationId": "getOrders",
            "summary": "获取订单列表",
            "description": "获取用户的订单列表",
            "tags": ["订单管理"],
            "parameters": [
              {
                "name": "user_id",
                "in": "query",
                "schema": {
                  "type": "integer"
                },
                "required": false,
                "description": "用户ID",
                "example": 123
              },
              {
                "name": "status",
                "in": "query",
                "schema": {
                  "type": "string",
                  "enum": ["pending", "processing", "completed", "cancelled"]
                },
                "required": false,
                "description": "订单状态",
                "example": "completed"
              }
            ],
            "security": [
              {
                "bearerAuth": []
              }
            ],
            "responses": {
              "200": {
                "description": "成功返回订单列表",
                "content": {
                  "application/json": {
                    "schema": {
                      "type": "object",
                      "properties": {
                        "data": {
                          "type": "array",
                          "items": {
                            "$ref": "#/components/schemas/Order"
                          }
                        },
                        "meta": {
                          "$ref": "#/components/schemas/PaginationMeta"
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      "components": {
        "securitySchemes": {
          "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
          },
          "apiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key"
          }
        },
        "schemas": {
          "User": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": "用户ID",
                "example": 1
              },
              "username": {
                "type": "string",
                "description": "用户名",
                "example": "johndoe"
              },
              "email": {
                "type": "string",
                "format": "email",
                "description": "邮箱地址",
                "example": "john@example.com"
              },
              "role": {
                "type": "string",
                "enum": ["admin", "user", "moderator"],
                "description": "用户角色",
                "example": "user"
              },
              "createdAt": {
                "type": "string",
                "format": "date-time",
                "description": "创建时间"
              },
              "updatedAt": {
                "type": "string",
                "format": "date-time",
                "description": "更新时间"
              }
            },
            "required": ["id", "username", "email", "role"]
          },
          "CreateUserRequest": {
            "type": "object",
            "properties": {
              "username": {
                "type": "string",
                "description": "用户名，必须唯一",
                "example": "johndoe",
                "minLength": 3,
                "maxLength": 50
              },
              "email": {
                "type": "string",
                "format": "email",
                "description": "邮箱地址",
                "example": "john@example.com"
              },
              "password": {
                "type": "string",
                "description": "密码，至少8位",
                "example": "password123",
                "minLength": 8
              },
              "role": {
                "type": "string",
                "enum": ["admin", "user", "moderator"],
                "description": "用户角色",
                "example": "user",
                "default": "user"
              }
            },
            "required": ["username", "email", "password"]
          },
          "UpdateUserRequest": {
            "type": "object",
            "properties": {
              "email": {
                "type": "string",
                "format": "email",
                "description": "新的邮箱地址",
                "example": "newemail@example.com"
              },
              "role": {
                "type": "string",
                "enum": ["admin", "user", "moderator"],
                "description": "新的用户角色",
                "example": "admin"
              }
            }
          },
          "Order": {
            "type": "object",
            "properties": {
              "id": {
                "type": "integer",
                "description": "订单ID",
                "example": 1001
              },
              "userId": {
                "type": "integer",
                "description": "用户ID",
                "example": 123
              },
              "status": {
                "type": "string",
                "enum": ["pending", "processing", "completed", "cancelled"],
                "description": "订单状态",
                "example": "completed"
              },
              "total": {
                "type": "number",
                "format": "float",
                "description": "订单总金额",
                "example": 299.99
              },
              "createdAt": {
                "type": "string",
                "format": "date-time",
                "description": "创建时间"
              }
            },
            "required": ["id", "userId", "status", "total"]
          },
          "PaginationMeta": {
            "type": "object",
            "properties": {
              "total": {
                "type": "integer",
                "description": "总记录数",
                "example": 150
              },
              "page": {
                "type": "integer",
                "description": "当前页码",
                "example": 1
              },
              "limit": {
                "type": "integer",
                "description": "每页数量",
                "example": 20
              },
              "totalPages": {
                "type": "integer",
                "description": "总页数",
                "example": 8
              }
            },
            "required": ["total", "page", "limit", "totalPages"]
          },
          "ErrorResponse": {
            "type": "object",
            "properties": {
              "error": {
                "type": "string",
                "description": "错误信息"
              },
              "code": {
                "type": "integer",
                "description": "错误代码"
              },
              "details": {
                "type": "object",
                "description": "详细错误信息"
              }
            },
            "required": ["error", "code"]
          }
        }
      },
      "tags": [
        {
          "name": "用户管理",
          "description": "用户相关的操作接口"
        },
        {
          "name": "订单管理",
          "description": "订单相关的操作接口"
        }
      ]
    }
  }

  /**
   * 从动态API获取切片数据
   */
  async loadDynamicSlice(options: {
    tags?: string[]
    paths?: string[]
    userPermissions?: string[]
    includeSchemas?: boolean
  } = {}): Promise<Partial<OpenAPISpec>> {
    const cacheKey = JSON.stringify(options)
    
    // 检查缓存
    if (this.config.cacheEnabled) {
      const cached = this.cache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL!) {
        return cached.data
      }
    }

    try {
      const queryParams = new URLSearchParams()
      
      if (options.tags?.length) {
        queryParams.append('tags', options.tags.join(','))
      }
      if (options.paths?.length) {
        queryParams.append('paths', options.paths.join(','))
      }
      if (options.userPermissions?.length) {  
        queryParams.append('permissions', options.userPermissions.join(','))
      }
      if (options.includeSchemas !== undefined) {
        queryParams.append('includeSchemas', options.includeSchemas.toString())
      }

      const url = `${this.config.dynamicApiUrl}?${queryParams.toString()}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Dynamic API request failed: ${response.status}`)
      }

      const data = await response.json()
      
      // 缓存结果
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
      }

      return data
    } catch (error) {
      console.warn('Failed to load dynamic slice, falling back to static:', error)
      // 回退到静态数据
      const staticSpec = await this.loadStaticSpec()
      return this.filterStaticSpec(staticSpec, options)
    }
  }

  /**
   * 根据选项过滤静态规范
   */
  private filterStaticSpec(spec: OpenAPISpec, options: {
    tags?: string[]
    paths?: string[]
  }): Partial<OpenAPISpec> {
    const filtered: Partial<OpenAPISpec> = {
      ...spec,
      paths: {}
    }

    // 过滤路径
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      let shouldInclude = true

      if (options.paths?.length && !options.paths.includes(path)) {
        shouldInclude = false
      }

      if (options.tags?.length && shouldInclude) {
        const pathTags = Object.values(pathItem).flatMap((operation: any) => 
          operation.tags || []
        )
        shouldInclude = options.tags.some(tag => pathTags.includes(tag))
      }

      if (shouldInclude) {
        filtered.paths![path] = pathItem
      }
    }

    return filtered
  }

  /**
   * 获取完整的API规范（静态 + 动态）
   */
  async getFullSpec(options: {
    preferDynamic?: boolean
    userPermissions?: string[]
  } = {}): Promise<OpenAPISpec> {
    try {
      // 首先加载静态规范作为基础
      const staticSpec = await this.loadStaticSpec()

      if (!options.preferDynamic) {
        return staticSpec
      }

      // 尝试获取动态更新
      try {
        const dynamicSlice = await this.loadDynamicSlice({
          userPermissions: options.userPermissions || this.config.userPermissions,
          includeSchemas: true
        })

        // 合并静态和动态数据
        return this.mergeSpecs(staticSpec, dynamicSlice)
      } catch (error) {
        console.warn('Dynamic loading failed, using static spec:', error)
        return staticSpec
      }
    } catch (error) {
      console.error('Failed to load API specification:', error)
      throw error
    }
  }

  /**
   * 合并静态和动态规范
   */
  private mergeSpecs(staticSpec: OpenAPISpec, dynamicSlice: Partial<OpenAPISpec>): OpenAPISpec {
    return {
      ...staticSpec,
      ...dynamicSlice,
      paths: {
        ...staticSpec.paths,
        ...dynamicSlice.paths
      },
      components: {
        ...staticSpec.components,
        ...dynamicSlice.components,
        schemas: {
          ...staticSpec.components?.schemas,
          ...dynamicSlice.components?.schemas
        }
      }
    }
  }

  /**
   * 将OpenAPI规范转换为内部API端点格式
   */
  convertToAPIEndpoints(spec: OpenAPISpec): APIEndpoint[] {
    const endpoints: APIEndpoint[] = []

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || !operation) continue

        // Type assertion for OpenAPI operation object
        const op = operation as any

        const endpoint: APIEndpoint = {
          id: op.operationId || `${method}-${path}`.replace(/[^\w-]/g, '-'),
          operationId: op.operationId,
          summary: op.summary || `${method.toUpperCase()} ${path}`,
          description: op.description,
          method: method.toUpperCase() as APIEndpoint['method'],
          path,
          tags: op.tags,
          parameters: this.convertParameters(op.parameters || []),
          requestBody: this.convertRequestBody(op.requestBody),
          responses: this.convertResponses(op.responses || {}),
          security: op.security,
          deprecated: op.deprecated
        }

        endpoints.push(endpoint)
      }
    }

    return endpoints
  }

  private convertParameters(params: any[]): Parameter[] {
    return params.map(param => ({
      name: param.name,
      in: param.in,
      schema: param.schema,
      type: param.schema?.type || param.type,
      required: param.required || false,
      description: param.description || '',
      example: param.example || param.schema?.example
    }))
  }

  private convertRequestBody(requestBody: any): RequestBody | undefined {
    if (!requestBody) return undefined

    return {
      description: requestBody.description,
      required: requestBody.required,
      content: requestBody.content || {}
    }
  }

  private convertResponses(responses: any): Response[] {
    return Object.entries(responses).map(([status, response]: [string, any]) => ({
      status: parseInt(status),
      description: response.description || '',
      content: response.content,
      headers: response.headers
    }))
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * 预加载指定标签的数据
   */
  async preloadTags(tags: string[]): Promise<void> {
    try {
      await this.loadDynamicSlice({ tags, includeSchemas: true })
    } catch (error) {
      console.warn('Preload failed:', error)
    }
  }
}

// 默认实例
export const apiLoader = new APILoader()

// 工具函数
export function createAPILoader(config?: LoaderConfig): APILoader {
  return new APILoader(config)
}

// Mock 后端切片API响应（用于演示）
export async function mockSliceAPI(params: URLSearchParams): Promise<Partial<OpenAPISpec>> {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 200))

  const tags = params.get('tags')?.split(',') || []
  const permissions = params.get('permissions')?.split(',') || []

  // 根据用户权限和标签返回过滤后的数据
  const filteredPaths: Record<string, any> = {}

  // 示例：根据权限过滤接口
  if (permissions.includes('admin')) {
    // 管理员可以看到所有接口
    filteredPaths['/api/v1/users'] = {
      get: { operationId: 'getUsers', tags: ['用户管理'] },
      post: { operationId: 'createUser', tags: ['用户管理'] }
    }
    filteredPaths['/api/v1/users/{id}'] = {
      get: { operationId: 'getUserById', tags: ['用户管理'] },
      put: { operationId: 'updateUser', tags: ['用户管理'] },
      delete: { operationId: 'deleteUser', tags: ['用户管理'] }
    }
  } else {
    // 普通用户只能看到查看接口
    filteredPaths['/api/v1/users'] = {
      get: { operationId: 'getUsers', tags: ['用户管理'] }
    }
    filteredPaths['/api/v1/users/{id}'] = {
      get: { operationId: 'getUserById', tags: ['用户管理'] }
    }
  }

  return {
    paths: filteredPaths,
    info: {
      title: "动态切片API",
      version: "v1.0.0",
      description: `基于权限 [${permissions.join(', ')}] 和标签 [${tags.join(', ')}] 的API切片`
    }
  }
}