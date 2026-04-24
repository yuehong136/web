import {
  BeginId,
  JsonSchemaDataType,
  WebhookContentType,
  WebhookMethod,
  WebhookSecurityAuthType,
} from '../constant'
import type { AgentFlow, AgentWebhookTestRequest } from '@/types/agent'
import type { IBeginForm } from '../types'

interface SchemaField {
  key?: string
  type?: string
  required?: boolean
}

export interface WebhookTestBuildResult {
  request: AgentWebhookTestRequest
  warnings: string[]
}

export function getWebhookBeginConfig(flow?: AgentFlow): IBeginForm {
  const begin = flow?.dsl?.components?.[BeginId]?.obj?.params
  return (begin || {}) as IBeginForm
}

const sampleValueByType = (field: SchemaField) => {
  switch (field.type) {
    case JsonSchemaDataType.Number:
    case 'integer':
      return 1
    case JsonSchemaDataType.Boolean:
      return true
    case 'file':
      return 'sample.txt'
    default:
      return `sample_${field.key || 'value'}`
  }
}

const buildObjectFromSchema = (fields: SchemaField[] = []) => {
  return fields.reduce<Record<string, unknown>>((result, field) => {
    if (!field.key) {
      return result
    }
    result[field.key] = sampleValueByType(field)
    return result
  }, {})
}

const stringifyRecord = (value: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, String(item ?? '')]),
  )

const encodeBasicAuth = (username?: string, password?: string) => {
  const raw = `${username || ''}:${password || ''}`
  if (typeof btoa === 'function') {
    return btoa(raw)
  }
  return raw
}

export function buildWebhookTestRequest(
  canvasId: string,
  config: IBeginForm,
): WebhookTestBuildResult {
  const warnings: string[] = []
  const method = (config.methods?.[0] || WebhookMethod.Post).toUpperCase()
  const contentType = config.content_types || WebhookContentType.ApplicationJson
  const headers = stringifyRecord(buildObjectFromSchema(config.schema?.headers))
  const query = stringifyRecord(buildObjectFromSchema(config.schema?.query))
  const body = buildObjectFromSchema(config.schema?.body)
  const authType = config.security?.auth_type || WebhookSecurityAuthType.None

  if (authType === WebhookSecurityAuthType.Token) {
    const headerName = config.security?.token?.token_header || 'Authorization'
    const headerValue = config.security?.token?.token_value || ''
    if (headerValue) {
      headers[headerName] = headerValue
    }
  }

  if (authType === WebhookSecurityAuthType.Basic) {
    headers.Authorization = `Basic ${encodeBasicAuth(
      config.security?.basic_auth?.username,
      config.security?.basic_auth?.password,
    )}`
  }

  if (authType === WebhookSecurityAuthType.Jwt) {
    headers.Authorization = 'Bearer <paste-test-jwt>'
    warnings.push('JWT 测试需要手动替换 Authorization header，前端不会生成或签名 JWT。')
  }

  return {
    request: {
      canvasId,
      method,
      query,
      headers,
      body,
      contentType,
    },
    warnings,
  }
}

export function buildWebhookCurlExample(
  webhookUrl: string,
  request: AgentWebhookTestRequest,
) {
  const params = new URLSearchParams(request.query)
  const url = `${webhookUrl}${params.toString() ? `?${params.toString()}` : ''}`
  const headers = Object.entries(request.headers || {})
    .map(([key, value]) => `  -H "${key}: ${value}"`)
    .join(' \\\n')

  const contentHeader =
    request.contentType && request.contentType !== WebhookContentType.MultipartFormData
      ? `  -H "Content-Type: ${request.contentType}"`
      : ''
  const allHeaders = [contentHeader, headers].filter(Boolean).join(' \\\n')
  const hasBody = !['GET', 'HEAD'].includes(request.method.toUpperCase())
  const body = hasBody
    ? ` \\\n  -d '${JSON.stringify(request.body || {})}'`
    : ''

  return [`curl -X ${request.method} "${url}"`, allHeaders, body]
    .filter(Boolean)
    .join(' \\\n')
}

export function summarizeWebhookResponse(response: Response, bodyText: string) {
  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    body: bodyText,
  }
}
