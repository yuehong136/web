export interface MessageContentItem {
  value: string
}

function getMessageContentValue(item: unknown): string {
  if (typeof item === 'string') {
    return item
  }

  if (typeof item === 'number' || typeof item === 'boolean') {
    return String(item)
  }

  if (
    typeof item === 'object' &&
    item !== null &&
    'value' in item
  ) {
    const value = (item as { value?: unknown }).value

    if (typeof value === 'string') {
      return value
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value)
    }
  }

  return ''
}

export function convertMessageContentToStringArray(
  content: unknown,
): string[] {
  if (!Array.isArray(content)) {
    return []
  }

  return content.map(getMessageContentValue)
}

export function convertMessageContentToObjectArray(
  content: unknown,
): MessageContentItem[] {
  const values = convertMessageContentToStringArray(content)

  if (values.length === 0) {
    return [{ value: '' }]
  }

  return values.map((value) => ({ value }))
}

export function normalizeMessageFormForStore(
  form?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(form || {}),
    content: convertMessageContentToStringArray(form?.content),
  }
}

export function normalizeMessageFormForEditor(
  form?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...(form || {}),
    content: convertMessageContentToObjectArray(form?.content),
  }
}

export function getMessagePreviewText(content: unknown): string {
  return convertMessageContentToStringArray(content)[0] || ''
}
