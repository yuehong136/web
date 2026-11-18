import assert from 'node:assert/strict'
import test from 'node:test'
import { loadCodeHighlighter } from '@/components/chat/code-highlighter'
import { CODE_THEME } from '@/components/chat/shiki-engine'

test('keeps all language loaders and one token-backed theme with a shared JavaScript engine', async () => {
  const ts = await loadCodeHighlighter('typescript')
  const python = await loadCodeHighlighter('python')
  assert.equal(ts.highlighter, python.highlighter)
  assert.deepEqual(ts.highlighter.getLoadedThemes(), [CODE_THEME.name])
  for (const [language, code] of [
    ['typescript', 'const answer: number = 42'],
    ['python', 'def answer():\n  return 42'],
  ]) {
    const html = ts.highlighter.codeToHtml(code, {
      lang: language,
      theme: CODE_THEME.name!,
    })
    // Colors are CSS variables that code-block.css maps to syntax-* tokens.
    assert.match(html, /color:var\(--shiki-token-keyword\)/)
    assert.doesNotMatch(html, /#[\da-f]{6}/i)
    assert.ok(!html.includes('undefined'))
  }
})

test('unknown model-supplied languages keep escaped readable code', async () => {
  const { highlighter, language } = await loadCodeHighlighter(
    'unregistered-model-language',
  )
  assert.equal(language, 'text')
  const html = highlighter.codeToHtml('<script>unsafe()</script>', {
    lang: language,
    theme: CODE_THEME.name!,
  })
  assert.ok(!html.includes('<script>'))
  assert.match(html, /&#x3C;script|&lt;script/)
})
