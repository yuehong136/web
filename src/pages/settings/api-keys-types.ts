import type { SystemAPIToken } from '@/types/api'

export interface APIEndpoint {
  id: string
  operationId?: string
  summary: string
  description?: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  path: string
  tags?: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses?: Response[]
  security?: Record<string, string[]>[]
  deprecated?: boolean
}

export type ApiMethod = APIEndpoint['method']

export interface Parameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  schema?: Schema
  type?: string
  required: boolean
  description: string
  example?: unknown
}

export interface Schema {
  type?: string
  properties?: Record<string, Schema>
  required?: string[]
  example?: unknown
  default?: unknown
  minimum?: number
  description?: string
  format?: string
  items?: Schema
  enum?: string[]
  $ref?: string
}

export interface RequestBody {
  description?: string
  required?: boolean
  content: Record<
    string,
    {
      schema?: Schema
      example?: unknown
    }
  >
}

export interface Response {
  status: number
  description: string
  content?: Record<
    string,
    {
      schema?: Schema
      example?: unknown
    }
  >
  headers?: Record<string, Parameter>
}

export interface TestResponse {
  status: number
  statusText: string
  time: number
  size?: string
  headers?: Record<string, string>
  data?: unknown
}

export interface OpenAPIParameter {
  name: string
  in: Parameter['in']
  schema?: Schema
  type?: string
  required?: boolean
  description?: string
  example?: unknown
}

export interface OpenAPIContent {
  schema?: Schema
  example?: unknown
}

export interface OpenAPIRequestBody {
  description?: string
  required?: boolean
  content?: Record<string, OpenAPIContent>
}

export interface OpenAPIResponseObject {
  description?: string
  content?: Record<string, OpenAPIContent>
  headers?: Record<string, Parameter>
}

export interface OpenAPIOperation {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: OpenAPIRequestBody
  responses?: Record<string, OpenAPIResponseObject>
  security?: Record<string, string[]>[]
  deprecated?: boolean
}

export type OpenAPIPathItem = Partial<
  Record<Lowercase<ApiMethod>, OpenAPIOperation>
>

export interface ParamRow {
  id: string
  enabled: boolean
  name: string
  value: string
  type: string
  description: string
  required?: boolean
  in?: string
}

export interface HeaderRow {
  id: string
  enabled: boolean
  name: string
  value: string
  description: string
}

export type BodyType =
  | 'none'
  | 'form-data'
  | 'x-www-form-urlencoded'
  | 'json'
  | 'xml'
  | 'raw'
  | 'binary'
  | 'graphql'
  | 'msgpack'

export interface FormDataRow {
  id: string
  enabled: boolean
  key: string
  value: string
  type: 'text' | 'file'
  description?: string
}

export interface UrlEncodedRow {
  id: string
  enabled: boolean
  key: string
  value: string
  type:
    | 'string'
    | 'integer'
    | 'number'
    | 'boolean'
    | 'file'
    | 'array'
    | 'object'
  description?: string
}

export type ApiKey = SystemAPIToken

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'delete',
  'patch',
  'head',
  'options',
] as const

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isHttpMethod = (method: string): method is Lowercase<ApiMethod> =>
  (HTTP_METHODS as readonly string[]).includes(method)
