import Latex from '@ant-design/x-markdown/plugins/Latex'
import type { TokenizerAndRendererExtension } from 'marked'

const doubleInline = /^\\\\\(([\s\S]{1,10000}?)\\\\\)/
const doubleBlock = /^\\\\\[([\s\S]{1,10000}?)\\\\\]/
const entities: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
}

/** Adapt only math tokens; Marked still owns code, text and HTML boundaries. */
export function createChatLatexExtensions(): TokenizerAndRendererExtension[] {
  return Latex().map((extension) => {
    if (!('tokenizer' in extension)) return extension
    const { tokenizer, start } = extension

    return {
      ...extension,
      start(src) {
        if (extension.level !== 'inline') return undefined
        const indices = [
          start?.call(this, src),
          src.indexOf(String.raw`\\(`),
          src.indexOf(String.raw`\\[`),
        ].filter((index): index is number => index !== undefined && index >= 0)
        return indices.length ? Math.min(...indices) : undefined
      },
      tokenizer(src, tokens) {
        const match =
          src.match(doubleBlock) ??
          (extension.level === 'inline' ? src.match(doubleInline) : null)
        // A doubled delimiter signals escaped commands. Leave TeX row breaks
        // and single-delimited formulas intact; never unescape the full message.
        const body = match?.[1].replace(/(?<!\\)\\\\(?=[a-zA-Z])/g, '\\')
        const opener = match?.[0].startsWith(String.raw`\\[`) ? '[' : '('
        const closer = opener === '[' ? ']' : ')'
        const token = tokenizer.call(
          this,
          match ? `\\${opener}${body}\\${closer}` : src,
          tokens,
        )
        if (!token) return undefined
        if (match) token.raw = match[0]
        // Decode one layer directly into KaTeX input, never into Markdown/HTML.
        token.text = (token.text as string).replace(
          /&(?:lt|gt|amp);/g,
          (entity) => entities[entity],
        )
        return token
      },
    }
  })
}
