export function formatTraceDuration(duration?: number) {
  if (typeof duration !== 'number' || Number.isNaN(duration)) {
    return '未记录'
  }

  if (duration <= 0) {
    return '未记录'
  }

  if (duration < 60) {
    return `${Math.max(duration, 0.001).toFixed(3)}s`
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  return `${minutes}m ${seconds.toFixed(1)}s`
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }

  return JSON.stringify(value)
}

function dedupeDisplayPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    const seen = new Set<string>()
    return value.reduce<unknown[]>((items, item) => {
      const normalized = dedupeDisplayPayload(item)
      const key = stableStringify(normalized)

      if (seen.has(key)) {
        return items
      }

      seen.add(key)
      items.push(normalized)
      return items
    }, [])
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        dedupeDisplayPayload(item),
      ]),
    )
  }

  return value
}

export function formatTracePayload(
  value: unknown,
  emptyLabel = '接口未提供',
  options: { dedupeArrays?: boolean } = {},
) {
  if (value === undefined || value === null || value === '') {
    return {
      language: 'plaintext',
      text: emptyLabel,
    }
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed)
        return {
          language: 'json',
          text: JSON.stringify(
            options.dedupeArrays ? dedupeDisplayPayload(parsed) : parsed,
            null,
            2,
          ),
        }
      } catch {
        return {
          language: 'plaintext',
          text: value,
        }
      }
    }

    return {
      language: 'plaintext',
      text: value,
    }
  }

  try {
    const displayValue = options.dedupeArrays
      ? dedupeDisplayPayload(value)
      : value
    return {
      language: 'json',
      text: JSON.stringify(displayValue, null, 2),
    }
  } catch {
    return {
      language: 'plaintext',
      text: String(value),
    }
  }
}

export function getTraceDurationPercent(
  duration?: number,
  totalDuration?: number,
) {
  if (
    typeof duration !== 'number' ||
    typeof totalDuration !== 'number' ||
    duration <= 0 ||
    totalDuration <= 0
  ) {
    return 0
  }

  return Math.max(2, Math.min(100, (duration / totalDuration) * 100))
}
