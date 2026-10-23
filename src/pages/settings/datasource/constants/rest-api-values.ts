type Config = Record<string, unknown>
const jsonFields = [
  'headers',
  'query_params',
  'request_body',
  'field_type_hints',
  'field_default_values',
]

const isObject = (value: unknown): value is Config =>
  value != null && typeof value === 'object' && !Array.isArray(value)

/** Parse form text without silently discarding malformed configuration. */
export function parseRestApiObject(
  value: unknown,
  keyValueText = false,
): Config {
  if (value == null || value === '') return {}
  if (isObject(value)) return { ...value }
  if (typeof value !== 'string') throw new Error('Invalid object')
  const trimmed = value.trim()
  if (!trimmed) return {}
  try {
    const parsed: unknown = JSON.parse(trimmed)
    if (!isObject(parsed)) throw new Error('Invalid object')
    return parsed
  } catch {
    if (!keyValueText || /^[{["]/.test(trimmed))
      throw new Error('Invalid object')
    const entries = trimmed
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const equals = line.indexOf('=')
        if (equals <= 0 || !line.slice(0, equals).trim())
          throw new Error('Invalid key/value')
        return [line.slice(0, equals).trim(), line.slice(equals + 1).trim()]
      })
    return Object.fromEntries(entries)
  }
}

export function validateRestApiObject(
  value: unknown,
  message: string,
  keyValueText = false,
): true | string {
  try {
    parseRestApiObject(value, keyValueText)
    return true
  } catch {
    return message
  }
}

const toText = (value: unknown) =>
  typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2)
const toFields = (value: unknown) =>
  Array.isArray(value) ? value.join(',') : (value ?? '')
const fromFields = (value: unknown) =>
  Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)

/** Saved object/list values must remain editable in text controls. */
export function getRestApiFormConfig(config: Config): Config {
  const result = { ...config }
  for (const key of jsonFields) result[key] = toText(config[key])
  for (const key of ['content_fields', 'metadata_fields'])
    result[key] = toFields(config[key])
  const auth = isObject(config.auth_config) ? config.auth_config : {}
  const credentials = isObject(config.credentials) ? config.credentials : {}
  result.credentials = {
    ...credentials,
    api_key: credentials.api_key || auth.api_key_value || auth.api_key || '',
    token: credentials.token || auth.token || '',
    username: credentials.username || auth.username || '',
    password: credentials.password || auth.password || '',
  }
  return result
}

/** Preserve unexposed settings while emitting the backend's object/list contract. */
export function prepareRestApiConfig(
  config: Config,
  previous: Config = {},
): Config {
  const result = { ...previous, ...config }
  delete result.show_advanced
  for (const key of jsonFields) {
    result[key] = parseRestApiObject(
      result[key],
      key === 'headers' || key === 'query_params',
    )
  }
  for (const key of ['content_fields', 'metadata_fields'])
    result[key] = fromFields(result[key])
  for (const key of ['auth_config', 'pagination_config', 'credentials']) {
    result[key] = {
      ...(isObject(previous[key]) ? previous[key] : {}),
      ...(isObject(config[key]) ? config[key] : {}),
    }
  }
  const pagination = result.pagination_config as Config
  for (const key of ['start_page', 'start_offset', 'page_size', 'limit'])
    if (pagination[key] === '') delete pagination[key]
  for (const key of ['max_pages', 'request_delay', 'batch_size'])
    if (result[key] === '') delete result[key]
  return result
}
