/** Partial Korean catalog: absent entries deliberately use this domain's English. */
export const withEnglishFallback = <T extends object>(
  english: T,
  translations: Readonly<Record<string, string>>,
): T => {
  const visit = (value: unknown, path: string): unknown => {
    if (typeof value === 'string') return translations[path] ?? value
    if (Array.isArray(value))
      return value.map((item, index) => visit(item, `${path}.${index}`))
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          visit(child, path ? `${path}.${key}` : key),
        ]),
      )
    return value
  }
  return visit(english, '') as T
}
