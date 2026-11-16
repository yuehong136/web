import type { OpenAPISpec } from '@/types/api'
import type { APIEndpoint, Schema } from '@/pages/settings/api-keys-types'

/** Resolves `#/components/schemas/*` references, including array items, without looping. */
export function resolveSchemaRef(
  spec: OpenAPISpec | null,
  input: Schema | undefined,
): Schema | undefined {
  const seen = new Set<string>()
  const schemas = spec?.components?.schemas as
    | Record<string, Schema | undefined>
    | undefined
  const resolveOnce = (schema: Schema | undefined): Schema | undefined => {
    if (!schema) return schema
    if (typeof schema.$ref === 'string') {
      if (seen.has(schema.$ref)) return schema
      seen.add(schema.$ref)
      const name = schema.$ref.match(/^#\/components\/schemas\/(.+)$/)?.[1]
      const target = name && schemas ? schemas[name] : undefined
      return target ? resolveOnce(target) : schema
    }
    if (schema.type === 'array' && schema.items)
      return { ...schema, items: resolveOnce(schema.items) }
    return schema
  }
  return resolveOnce(input)
}

/** A short type label: `string`, `array<integer>`, `enum`, or the referenced schema name. */
export function schemaType(
  spec: OpenAPISpec | null,
  schema: Schema | undefined,
): string {
  const resolved = resolveSchemaRef(spec, schema)
  if (!resolved) return 'unknown'
  if (resolved.type === 'array')
    return `array<${schemaType(spec, resolved.items)}>`
  if (resolved.enum) return 'enum'
  if (resolved.type) return resolved.type
  if (resolved.$ref) return resolved.$ref.split('/').pop() || 'object'
  return 'object'
}

export interface EndpointGroup {
  tag: string
  endpoints: APIEndpoint[]
}

/** Filters by summary, path or tag and groups by first tag, keeping spec order. */
export function groupEndpoints(
  endpoints: readonly APIEndpoint[],
  query: string,
  fallbackTag: string,
): EndpointGroup[] {
  const needle = query.trim().toLowerCase()
  const groups = new Map<string, APIEndpoint[]>()
  for (const endpoint of endpoints) {
    const matches =
      !needle ||
      endpoint.summary.toLowerCase().includes(needle) ||
      endpoint.path.toLowerCase().includes(needle) ||
      endpoint.tags?.some((tag) => tag.toLowerCase().includes(needle))
    if (!matches) continue
    const tag = endpoint.tags?.[0] ?? fallbackTag
    groups.set(tag, [...(groups.get(tag) ?? []), endpoint])
  }
  return [...groups].map(([tag, items]) => ({ tag, endpoints: items }))
}

/** Stable element id for an endpoint section, used by the table of contents. */
export const endpointAnchor = (endpoint: Pick<APIEndpoint, 'id'>) =>
  `api-${endpoint.id.replace(/[^\w-]/g, '-')}`

/** A copyable curl call. The key stays a placeholder; secrets never enter docs. */
export function buildCurlExample(
  method: APIEndpoint['method'],
  url: string,
  body?: unknown,
): string {
  const lines = [
    `curl -X ${method} "${url}"`,
    '  -H "Authorization: Bearer YOUR_API_KEY"',
    '  -H "Content-Type: application/json"',
  ]
  if (body !== undefined && body !== null)
    lines.push(`  -d '${JSON.stringify(body).replace(/'/g, "'\\''")}'`)
  return lines.join(' \\\n')
}

/** The first JSON example of a request body, if the spec gives one. */
export function requestBodyExample(
  spec: OpenAPISpec | null,
  endpoint: APIEndpoint,
): unknown {
  const content = endpoint.requestBody?.content
  if (!content) return undefined
  const json = content['application/json'] ?? Object.values(content)[0]
  if (!json) return undefined
  return json.example ?? resolveSchemaRef(spec, json.schema)?.example
}

/** Base URL from the selected environment, its variables, or this origin. */
export function resolveBaseUrl(
  environmentBaseUrl: string | undefined,
  variables: Record<string, string>,
  origin: string,
): string {
  const candidate =
    environmentBaseUrl ||
    [
      'baseUrl',
      'base_url',
      'BASE_URL',
      'host',
      'HOST',
      'server',
      'SERVER',
      'url',
      'URL',
      'api_url',
      'API_URL',
    ]
      .map((name) => variables[name])
      .find(Boolean) ||
    origin
  return candidate.replace(/\/+$/, '')
}
