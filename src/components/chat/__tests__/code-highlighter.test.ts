import assert from 'node:assert/strict'
import test from 'node:test'
import { loadCodeHighlighter } from '@/components/chat/code-highlighter'

test('keeps all language loaders and the two existing themes with a shared JavaScript engine', async () => {
  const ts = await loadCodeHighlighter('typescript')
  const python = await loadCodeHighlighter('python')
  assert.equal(ts.highlighter, python.highlighter)
  assert.deepEqual(ts.highlighter.getLoadedThemes().sort(), [
    'github-dark',
    'github-light',
  ])
  for (const [language, code] of [
    ['typescript', 'const answer: number = 42'],
    ['python', 'def answer():\n  return 42'],
  ]) {
    const html = ts.highlighter.codeToHtml(code, {
      lang: language,
      theme: 'github-dark',
    })
    assert.match(html, /<span style=/)
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
    theme: 'github-light',
  })
  assert.ok(!html.includes('<script>'))
  assert.match(html, /&#x3C;script|&lt;script/)
})
