import type { OpenAPISpec } from '@/types/api'
import { systemAPI } from '@/api/system'
import {
  isHttpMethod,
  type APIEndpoint,
  type OpenAPIPathItem,
  type OpenAPIParameter,
  type Parameter,
  type OpenAPIRequestBody,
  type RequestBody,
  type OpenAPIResponseObject,
  type Response,
} from '@/pages/settings/api-keys-types'

/** Query keys for the API reference specification. */
export const apiDocumentationKeys = {
  all: ['apiDocumentation'] as const,
  spec: (dynamic: boolean) =>
    [...apiDocumentationKeys.all, 'spec', dynamic] as const,
}

export const convertToAPIEndpoints = (spec: OpenAPISpec): APIEndpoint[] => {
  const endpoints: APIEndpoint[] = []

  for (const [path, pathItem] of Object.entries(
    spec.paths as Record<string, OpenAPIPathItem>,
  )) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!isHttpMethod(method) || !operation) continue

      const op = operation

      const endpoint: APIEndpoint = {
        id: op.operationId || `${method}-${path}`.replace(/[^\w-]/g, '-'),
        operationId: op.operationId,
        summary: op.summary || `${method.toUpperCase()} ${path}`,
        description: op.description,
        method: method.toUpperCase() as APIEndpoint['method'],
        path,
        tags: op.tags,
        parameters: convertParameters(op.parameters || []),
        requestBody: convertRequestBody(op.requestBody),
        responses: convertResponses(op.responses || {}),
        security: op.security,
        deprecated: op.deprecated,
      }

      endpoints.push(endpoint)
    }
  }

  return endpoints
}

export const convertParameters = (params: OpenAPIParameter[]): Parameter[] => {
  return params.map((param) => ({
    name: param.name,
    in: param.in,
    schema: param.schema,
    type: param.schema?.type || param.type,
    required: param.required || false,
    description: param.description || '',
    example: param.example ?? param.schema?.example,
  }))
}

export const convertRequestBody = (
  requestBody: OpenAPIRequestBody | undefined,
): RequestBody | undefined => {
  if (!requestBody) return undefined

  return {
    description: requestBody.description,
    required: requestBody.required,
    content: requestBody.content || {},
  }
}

export const convertResponses = (
  responses: Record<string, OpenAPIResponseObject>,
): Response[] => {
  return Object.entries(responses).map(([status, response]) => ({
    status: parseInt(status),
    description: response.description || '',
    content: response.content,
    headers: response.headers,
  }))
}

export const loadStaticAPIData = async (
  signal?: AbortSignal,
): Promise<OpenAPISpec> => {
  const response = await fetch('/openapi.json', { signal })
  if (!response.ok) {
    throw new Error(`Failed to load static spec: ${response.status}`)
  }
  return response.json()
}

export const loadFilteredAPIData = async (): Promise<OpenAPISpec> => {
  const filterRule = {
    paths: ['/api/v1/*'],
    match: 'glob' as const,
    include_tags: ['chat', 'session', 'dataset', 'doc', 'files', 'agent'],
    exclude_paths: [],
    exclude_tags: [],
    strict: true,
    prune_examples: true,
    oas_version_target: 'keep' as const,
  }

  return await systemAPI.filterOpenAPI(filterRule)
}

export async function loadApiSpecification(
  dynamic: boolean,
  signal?: AbortSignal,
) {
  if (dynamic) {
    try {
      return { spec: await loadFilteredAPIData(), source: 'dynamic' as const }
    } catch (error) {
      if (signal?.aborted) throw error
      return {
        spec: await loadStaticAPIData(signal),
        source: 'static' as const,
        /** The page shows a fixed, translated notice for this code. */
        warning: 'dynamic-fallback' as const,
      }
    }
  }
  return { spec: await loadStaticAPIData(signal), source: 'static' as const }
}
