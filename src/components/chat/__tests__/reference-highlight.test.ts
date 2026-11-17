import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  excerptAround,
  highlightTerms,
  markTerms,
  markedChunkHtml,
} from '../reference-highlight'
import { extractReferencesFromSSEData } from '@/utils/reference-replacer'

test('collects the matched words, longest first, without single characters', () => {
  assert.deepEqual(
    highlightTerms({
      id: 1,
      content: '',
      highlight:
        '<em>Harness</em> 支持<em>模块化</em>组合...<em><em>模块</em>化</em> <em>a</em>',
    }),
    ['Harness', '模块化', '模块'],
  )
  assert.deepEqual(highlightTerms({ id: 1, content: 'x' }), [])
})

test('marks every match in plain text and escapes the rest', () => {
  assert.equal(
    markTerms('Use <b>harness</b> and HARNESS', ['harness']),
    'Use &lt;b&gt;<em>harness</em>&lt;/b&gt; and <em>HARNESS</em>',
  )
  assert.equal(markTerms('a & b', []), 'a &amp; b')
})

test('a short preview starts a little before the first match', () => {
  const text = `${'x'.repeat(300)} the matched word here ${'y'.repeat(300)}`
  const excerpt = excerptAround(text, ['matched'], 100)
  assert.ok(excerpt.startsWith('…'))
  assert.ok(excerpt.endsWith('…'))
  assert.ok(excerpt.includes('matched'))
  assert.equal(excerptAround('short', ['short'], 100), 'short')
  // Without a match the preview starts at the beginning.
  assert.ok(excerptAround(text, ['absent'], 100).startsWith('xxx'))
})

test('a preview never cuts an English word in half', () => {
  const text = `${'中文铺垫。'.repeat(20)}the Darwin team presents HarnessX, ${'more words here '.repeat(20)}`
  const excerpt = excerptAround(text, ['HarnessX'], 60)
  assert.match(excerpt, /^…(\S+ )*HarnessX/)
  // Each Latin run at either cut is a whole word from the text.
  const first = excerpt.slice(1).split(/\s/)[0]
  const last = excerpt.slice(0, -1).split(/\s/).at(-1)!
  assert.ok(text.includes(` ${first} `) || /^[^A-Za-z]/.test(first))
  assert.ok(['more', 'words', 'here'].includes(last), last)
})

test('full text is marked only for plain-text chunks with matches', () => {
  const chunk = {
    id: 1,
    content: 'HarnessX 支持模块化组合',
    highlight: '<em>HarnessX</em> 支持<em>模块化</em>组合',
  }
  assert.equal(
    markedChunkHtml(chunk),
    '<em>HarnessX</em> 支持<em>模块化</em>组合',
  )
  assert.equal(
    markedChunkHtml({
      ...chunk,
      content: '<table><tr><td>x</td></tr></table>',
    }),
    null,
  )
  assert.equal(markedChunkHtml({ ...chunk, highlight: undefined }), null)
})

test('stream and history references keep a highlight only when it marks words', () => {
  const [marked, plain] = extractReferencesFromSSEData({
    chunks: [
      { id: 'a', content: 'text', highlight: 'te<em>xt</em>' },
      { id: 'b', content: 'text', highlight: 'text' },
    ],
  })
  assert.equal(marked.highlight, 'te<em>xt</em>')
  assert.equal(plain.highlight, undefined)
})
