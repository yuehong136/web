import type { TokenizerAndRendererExtension, Tokens } from 'marked'

/**
 * Marked extensions for TeX in answers. The tokenizers follow
 * @ant-design/x-markdown's Latex plugin (MIT), whose module imports KaTeX and
 * its stylesheet at load; that put ~600 KB of KaTeX on every first page,
 * the login page included. Here the renderer only writes a `<math-formula>`
 * placeholder, and MathFormula loads KaTeX the first time an answer has one.
 */

/** The custom element MathFormula renders; XMarkdown allows mapped tags. */
export const MATH_FORMULA_TAG = 'math-formula'

/** Inline formula; `block-inline` is a `\[…\]` with line breaks in a paragraph. */
export type MathDisplay = 'inline' | 'block-inline' | 'block'

const inlineDollarRule = /^(\${1,2})((?:\\.|[^\\$]){1,10000}?)\1/
const inlineRuleNonStandard =
  /^(?:\\\(([\s\S]{1,10000}?)\\\)|\\\[((?:\\.|[^\\]){1,10000}?)\\\])/
const blockRule =
  /^(\${1,2})\n([\s\S]{1,10000}?)\n\1(?:\s*(?:\n|$))|^\\\[((?:\\.|[^\\]){1,10000}?)\\\]/
const doubleInline = /^\\\\\(([\s\S]{1,10000}?)\\\\\)/
const doubleBlock = /^\\\\\[([\s\S]{1,10000}?)\\\\\]/
const entities: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
}

// KaTeX has no align*: https://github.com/KaTeX/KaTeX/issues/1007
const replaceAlign = (text: string) => text.replace(/\{align\*\}/g, '{aligned}')

/** Pandoc's single-dollar rule, so currency is not read as math. */
function isValidInlineDollarMatch(match: RegExpMatchArray, src: string) {
  const [, delimiter, text] = match
  if (delimiter === '$$') return true
  return !/^\s|\s$/.test(text) && !/^\d/.test(src.slice(match[0].length))
}

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Decode one entity layer straight into TeX, never into Markdown or HTML. */
const decodeEntities = (text: string) =>
  text.replace(/&(?:lt|gt|amp);/g, (entity) => entities[entity])

/**
 * A doubled delimiter (`\\(`, `\\[`) means the model escaped its commands.
 * Undo that for the formula only; TeX row breaks and single-delimited
 * formulas stay as written, and the rest of the message is never unescaped.
 */
function undoubled(src: string): { src: string; raw?: string } {
  const match = src.match(doubleBlock) ?? src.match(doubleInline)
  if (!match) return { src }
  const body = match[1].replace(/(?<!\\)\\\\(?=[a-zA-Z])/g, '\\')
  const opener = match[0].startsWith(String.raw`\\[`) ? '[' : '('
  const closer = opener === '[' ? ']' : ')'
  return { src: `\\${opener}${body}\\${closer}`, raw: match[0] }
}

const placeholder = (text: string, display: MathDisplay) =>
  `<${MATH_FORMULA_TAG} data-display="${display}">${escapeHtml(text)}</${MATH_FORMULA_TAG}>`

interface MathToken extends Tokens.Generic {
  text: string
  display: MathDisplay
}

/** Adapt only math tokens; Marked still owns code, text and HTML boundaries. */
export function createChatLatexExtensions(): TokenizerAndRendererExtension[] {
  const inline: TokenizerAndRendererExtension = {
    name: 'inlineKatex',
    level: 'inline',
    start(src) {
      const indices = [
        src.indexOf('$'),
        src.indexOf('\\('),
        src.indexOf('\\['),
        src.indexOf(String.raw`\\(`),
        src.indexOf(String.raw`\\[`),
      ].filter((index) => index >= 0)
      return indices.length ? Math.min(...indices) : undefined
    },
    tokenizer(input): MathToken | undefined {
      const doubled = undoubled(input)
      const src = doubled.src
      const dollarMatch = src.match(inlineDollarRule)
      if (dollarMatch && !isValidInlineDollarMatch(dollarMatch, src)) return
      const nonStandardMatch = src.match(inlineRuleNonStandard)
      const match = dollarMatch ?? nonStandardMatch
      if (!match) return
      const rawText =
        dollarMatch?.[2] || nonStandardMatch?.[1] || nonStandardMatch?.[2] || ''
      // `\[…\]` spanning lines inside a paragraph is laid out as a block.
      const isBlock =
        nonStandardMatch?.[2] !== undefined && rawText.includes('\n')
      return {
        type: 'inlineKatex',
        raw: doubled.raw ?? match[0],
        text: decodeEntities(replaceAlign(rawText.trim())),
        display: isBlock ? 'block-inline' : 'inline',
      }
    },
    renderer: (token) => placeholder(token.text, (token as MathToken).display),
  }
  const block: TokenizerAndRendererExtension = {
    name: 'blockKatex',
    level: 'block',
    tokenizer(input): MathToken | undefined {
      const doubled = undoubled(input)
      const match = doubled.src.match(blockRule)
      if (!match) return
      return {
        type: 'blockKatex',
        raw: doubled.raw ?? match[0],
        text: decodeEntities(replaceAlign(match[2] || match[3].trim())),
        display: 'block',
      }
    },
    renderer: (token) => `${placeholder(token.text, 'block')}\n`,
  }
  return [inline, block]
}
