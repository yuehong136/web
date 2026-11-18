import { createBundledHighlighter } from 'shiki/core'
import { bundledLanguages } from 'shiki/langs'
import { CODE_THEME, shikiEngine } from '@/components/chat/shiki-engine'

// Keep every existing language loader. The only theme is the CSS-variable one
// that reads the design tokens; the JavaScript engine needs no Oniguruma/WASM.
const createCodeHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: {},
  engine: () => shikiEngine,
})
export type CodeHighlighter = Awaited<ReturnType<typeof createCodeHighlighter>>
let instance: Promise<CodeHighlighter> | undefined

export async function loadCodeHighlighter(language: string) {
  const supported = Object.hasOwn(bundledLanguages, language)
  const normalized = supported
    ? (language as keyof typeof bundledLanguages)
    : 'text'
  const pending = (instance ??= createCodeHighlighter({
    langs: [],
    themes: [CODE_THEME],
  }))
  let highlighter: CodeHighlighter
  try {
    highlighter = await pending
  } catch (error) {
    if (instance === pending) instance = undefined
    throw error
  }
  if (normalized !== 'text') await highlighter.loadLanguage(normalized)
  return { highlighter, language: normalized }
}
