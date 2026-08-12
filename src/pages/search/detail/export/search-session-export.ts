import type { SearchTurn } from '@/types/search'
import { extractThinkContent } from '@/utils/think-utils'

type ExportableSearchTurn = Readonly<
  Pick<SearchTurn, 'query' | 'summary' | 'relatedQuestions'>
>
type SearchSessionExportState = Readonly<Pick<SearchTurn, 'isStreaming'>>

export interface SearchSessionExportCopy {
  exportedAt: string
  round: (index: number) => string
  question: string
  answer: string
  relatedQuestions: string
  noSummary: string
}

export interface SearchSessionExportInput {
  appName: string
  turns: readonly ExportableSearchTurn[]
  copy: SearchSessionExportCopy
  now?: Date
}

export interface SearchSessionDownload {
  content: string
  filename: string
}

const WINDOWS_RESERVED_FILENAME =
  /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i
const MAX_FILENAME_BYTES = 255

const normalizeText = (value: string): string =>
  value.replace(/\r\n?/g, '\n').trim()

const isUnsafeFilenameCharacter = (character: string): boolean => {
  const codePoint = character.codePointAt(0) ?? 0
  return (
    codePoint <= 0x1f || codePoint === 0x7f || '<>:"/\\|?*'.includes(character)
  )
}

const truncateUtf8 = (value: string, maxBytes: number): string => {
  const encoder = new TextEncoder()
  let result = ''

  for (const character of value) {
    if (encoder.encode(result + character).byteLength > maxBytes) break
    result += character
  }

  return result
}

/**
 * Keep exported model/user text inert when the Markdown file is opened by a
 * renderer that supports raw HTML or active links. The document structure is
 * ours; dynamic content is emitted as plain Markdown text.
 */
const escapeMarkdownText = (value: string): string =>
  normalizeText(value)
    .replace(/\\/g, '\\\\')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\b(javascript|data|vbscript)\s*:/gi, '$1-blocked:')
    .replace(/([`*_#!|])/g, '\\$1')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')

export const canExportSearchSession = (
  turns: readonly SearchSessionExportState[],
): boolean => turns.length > 0 && turns.every((turn) => !turn.isStreaming)

export const buildSearchSessionFilename = (
  appName: string,
  now: Date = new Date(),
): string => {
  let stem = Array.from(appName.normalize('NFKC'))
    .map((character) =>
      isUnsafeFilenameCharacter(character) ? '-' : character,
    )
    .join('')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^[.\s-]+|[.\s-]+$/g, '')
    .trim()

  if (!stem) stem = 'search-session'
  if (WINDOWS_RESERVED_FILENAME.test(stem)) stem = `search-${stem}`

  const date = Number.isNaN(now.getTime())
    ? 'export'
    : now.toISOString().slice(0, 10)
  const suffix = `-${date}.md`
  stem = truncateUtf8(
    Array.from(stem).slice(0, 64).join(''),
    MAX_FILENAME_BYTES - new TextEncoder().encode(suffix).byteLength,
  ).replace(/[.\s-]+$/g, '')

  return `${stem || 'search-session'}${suffix}`
}

/**
 * The export contract is deliberately allowlisted. Internal turn IDs,
 * knowledge/document/chunk IDs, raw chunks, thinking and error details are
 * not accepted by this serializer and therefore cannot leak by object spread.
 */
export const buildSearchSessionMarkdown = ({
  appName,
  turns,
  copy,
}: SearchSessionExportInput): string => {
  const lines = [`# ${escapeMarkdownText(appName)}`, '', copy.exportedAt, '']

  turns.forEach((turn, index) => {
    const visibleSummary =
      extractThinkContent(turn.summary).mainContent || copy.noSummary

    lines.push(
      `## ${escapeMarkdownText(copy.round(index + 1))}`,
      '',
      `### ${escapeMarkdownText(copy.question)}`,
      '',
      escapeMarkdownText(turn.query),
      '',
      `### ${escapeMarkdownText(copy.answer)}`,
      '',
      escapeMarkdownText(visibleSummary),
      '',
    )

    const relatedQuestions = turn.relatedQuestions
      .map(escapeMarkdownText)
      .filter(Boolean)

    if (relatedQuestions.length > 0) {
      lines.push(
        `### ${escapeMarkdownText(copy.relatedQuestions)}`,
        '',
        ...relatedQuestions.map((question) => `- ${question}`),
        '',
      )
    }
  })

  return `${lines.join('\n').trimEnd()}\n`
}

export const downloadSearchSessionMarkdown = (
  input: SearchSessionExportInput,
): SearchSessionDownload => {
  const content = buildSearchSessionMarkdown(input)
  const filename = buildSearchSessionFilename(input.appName, input.now)
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  try {
    link.href = objectUrl
    link.download = filename
    link.hidden = true
    document.body.appendChild(link)
    link.click()
  } finally {
    link.remove()
    // Let the browser consume the Blob URL after click dispatch before it is
    // reclaimed. Some engines resolve the download asynchronously.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  }

  return { content, filename }
}
