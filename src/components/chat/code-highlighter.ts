import { createBundledHighlighter } from 'shiki/core'
import { bundledLanguages } from 'shiki/langs'
import { shikiEngine } from '@/components/chat/shiki-engine'

// Keep every existing language loader. Only the two themes used by CodeBlock
// are emitted; the JavaScript engine needs no unused Oniguruma/WASM fallback.
const createCodeHighlighter = createBundledHighlighter({
  langs: bundledLanguages,
  themes: {
    'github-light': () => import('shiki/themes/github-light.mjs'),
    'github-dark': () => import('shiki/themes/github-dark.mjs'),
  },
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
    themes: ['github-light', 'github-dark'],
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
