/** Shared protocol splitting for live answers and persisted history. */
export type ThinkingStatus = 'none' | 'thinking' | 'complete'
type ProcessKind = 'think' | 'thinking' | 'retrieving'

export interface ThinkExtractResult {
  thinkContent: string
  mainContent: string
  /** Preserve retrieval envelopes through reducers/stores without new message fields. */
  contentWithoutThinking: string
  retrievalContent: string
  retrievalMarkup: string
  retrievalStatus: ThinkingStatus
  /** @deprecated Use status. */
  isThinking: boolean
  status: ThinkingStatus
  openThinkingTag: 'think' | 'thinking' | null
}

const markers = ['think', 'thinking', 'retrieving'].flatMap((name) => [
  `<${name}>`,
  `</${name}>`,
])

/** Skip literal Markdown/code/math/HTML before looking for protocol markers. */
function literalLength(source: string, index: number): number {
  const rest = source.slice(index)
  const lineStart = index === 0 || source[index - 1] === '\n'
  if (lineStart) {
    const fence = /^ {0,3}(`{3,}|~{3,})[^\n]*(?:\n|$)/.exec(rest)
    if (fence) {
      const closer = new RegExp(
        `^ {0,3}${fence[1][0]}{${fence[1].length},}[^\\S\\r\\n]*(?:\\r?\\n|$)`,
        'm',
      ).exec(rest.slice(fence[0].length))
      return closer
        ? fence[0].length + closer.index + closer[0].length
        : rest.length
    }
    if (/^(?: {4}|\t)/.test(rest)) {
      return rest.indexOf('\n') < 0 ? rest.length : rest.indexOf('\n') + 1
    }
  }
  const ticks = /^`+/.exec(rest)
  if (ticks) {
    const closer = new RegExp(
      `(?<!\u0060)\u0060{${ticks[0].length}}(?!\u0060)`,
    ).exec(rest.slice(ticks[0].length))
    return closer
      ? ticks[0].length + closer.index + closer[0].length
      : rest.length
  }
  const math = /^(\${1,2}|\\{1,2}\(|\\{1,2}\[)/.exec(rest)
  if (math) {
    const opener = math[0]
    const closer = opener.endsWith('(')
      ? opener.slice(0, -1) + ')'
      : opener.endsWith('[')
        ? opener.slice(0, -1) + ']'
        : opener
    let end = source.indexOf(closer, index + opener.length)
    while (end >= 0 && source[end - 1] === '\\' && closer.startsWith('$')) {
      end = source.indexOf(closer, end + closer.length)
    }
    return end < 0 ? 0 : end + closer.length - index
  }
  if (rest.startsWith('\\')) return Math.min(2, rest.length)
  if (rest.startsWith('<!--')) {
    const end = rest.indexOf('-->')
    return end < 0 ? rest.length : end + 3
  }
  // Exact bare process tags are handled by the caller. Other HTML remains raw
  // for XMarkdown's sanitizer; tags inside attributes/HTML are never controls.
  const html = /^<([a-z][\w-]*)(?=[\s/>])(?:[^>"']|"[^"]*"|'[^']*')*>/i.exec(
    rest,
  )
  if (html) {
    if (markers.includes(html[0].toLowerCase())) return 0
    if (
      /\/\s*>$/.test(html[0]) ||
      /^(?:br|hr|img|input|meta|link|wbr)$/i.test(html[1])
    ) {
      return html[0].length
    }
    const end = new RegExp(`</${html[1]}\\s*>`, 'i').exec(
      rest.slice(html[0].length),
    )
    return end ? html[0].length + end.index + end[0].length : rest.length
  }
  return 0
}

/**
 * Only explicit matching closing tags end a process. Paragraphs and stream
 * termination do not promote unfinished retrieval/reasoning into the answer.
 * No entity/backslash decoding or HTML generation happens here.
 */
export function extractThinkContent(content: string): ThinkExtractResult {
  let active: ProcessKind | null = null
  let mainContent = ''
  let contentWithoutThinking = ''
  let thinkContent = ''
  let retrievalContent = ''
  let retrievalMarkup = ''
  let status: ThinkingStatus = 'none'
  let retrievalStatus: ThinkingStatus = 'none'
  const append = (text: string) => {
    if (active === 'retrieving') {
      retrievalContent += text
      retrievalMarkup += text
    } else if (active) {
      thinkContent += text
    } else {
      mainContent += text
    }
    if (!active || active === 'retrieving') contentWithoutThinking += text
  }
  for (let index = 0; index < content.length; ) {
    const length = literalLength(content, index)
    if (length) {
      append(content.slice(index, index + length))
      index += length
      continue
    }
    const rest = content.slice(index)
    const marker = /^<(\/)?(think|thinking|retrieving)>/i.exec(rest)
    if (marker) {
      const kind = marker[2].toLowerCase() as ProcessKind
      if (!active && !marker[1]) {
        active = kind
        if (kind === 'retrieving') {
          if (retrievalStatus !== 'none') retrievalContent += '\n'
          retrievalStatus = 'thinking'
          retrievalMarkup += marker[0]
          contentWithoutThinking += marker[0]
        } else {
          if (status !== 'none') thinkContent += '\n'
          status = 'thinking'
        }
      } else if (active === kind && marker[1]) {
        if (kind === 'retrieving') {
          retrievalStatus = 'complete'
          retrievalMarkup += marker[0]
          contentWithoutThinking += marker[0]
        } else {
          status = 'complete'
        }
        active = null
      } else {
        append(marker[0])
      }
      index += marker[0].length
      continue
    }
    // Buffer partial markers split across SSE frames, including closing tags.
    if (
      rest.startsWith('<') &&
      markers.some((tag) => tag.startsWith(rest.toLowerCase()))
    ) {
      if (!active || active === 'retrieving') contentWithoutThinking += rest
      break
    }
    append(content[index])
    index += 1
  }
  return {
    mainContent: mainContent.replace(/^\n+|\n+$/g, ''),
    contentWithoutThinking: contentWithoutThinking.replace(/^\n+|\n+$/g, ''),
    thinkContent: thinkContent.trim(),
    retrievalContent: retrievalContent.trim(),
    retrievalMarkup,
    status,
    retrievalStatus,
    isThinking: status === 'thinking',
    openThinkingTag:
      active === 'think' || active === 'thinking' ? active : null,
  }
}
