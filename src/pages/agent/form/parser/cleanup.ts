const headerFooterTypes = new Set(['pdf', 'doc', 'docx', 'html'])
const tocTypes = new Set([...headerFooterTypes, 'markdown'])

export function supportsHeaderFooterRemoval(fileType?: string) {
  return !!fileType && headerFooterTypes.has(fileType)
}

export function supportsTocRemoval(fileType?: string) {
  return !!fileType && tocTypes.has(fileType)
}

export function normalizeParserCleanup(
  fileType: string,
  value: Record<string, unknown>,
) {
  return {
    ...(supportsHeaderFooterRemoval(fileType)
      ? { remove_header_footer: normalizeFlag(value.remove_header_footer) }
      : {}),
    ...(supportsTocRemoval(fileType)
      ? { remove_toc: normalizeFlag(value.remove_toc) }
      : {}),
  }
}

export function parserCleanupDefaults(fileType: string) {
  return normalizeParserCleanup(fileType, {})
}

function normalizeFlag(value: unknown): boolean {
  return (
    value === true ||
    (typeof value === 'string' && value.trim().toLowerCase() === 'true')
  )
}
