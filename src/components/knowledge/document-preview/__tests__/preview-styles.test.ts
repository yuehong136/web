import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { test } from 'node:test'
import { compile } from '@tailwindcss/node'

// Document preview overrides ship with their lazily loaded preview chunks
// instead of the global sheet. They stay unlayered so they still beat the
// preview libraries' own CSS and the layered utilities, as they did globally.

const sourceRoot = path.resolve(import.meta.dirname, '../../../..')
const previews = path.join(
  sourceRoot,
  'components/knowledge/document-preview/components',
)

test('the global sheet no longer carries document preview overrides', async () => {
  const entry = await readFile(path.join(sourceRoot, 'index.css'), 'utf8')
  const css = (
    await compile(entry, { base: sourceRoot, onDependency() {} })
  ).build(['prose'])
  assert.doesNotMatch(
    css,
    /pdf-highlighter-container|ppt-previewer|ppt-scroll-area|excel-csv-previewer|docx-preview|csv-preview/u,
  )
  // Markdown overrides are shared by chat, skills and previews: still global.
  assert.match(css, /\.prose pre code \{/u)
})

test('marks on the PDF page tint the paper instead of using surface roles', async () => {
  const sheet = await readFile(path.join(previews, 'pdf-preview.css'), 'utf8')
  // The page is white in both modes; surface roles turn dark in dark mode.
  assert.doesNotMatch(
    sheet,
    /--color-(?:accent-soft|highlight-bg|citation-bg)/u,
  )
  for (const selector of [
    '.textLayer ::selection',
    "[class*='_mouseSelection_']",
    '.Highlight__part',
    '> a:hover',
  ])
    assert.ok(sheet.includes(selector), `pdf-preview.css overrides ${selector}`)
  // The area-selection override matches the library's hashed module class.
  const module = await readFile(
    path.resolve(
      sourceRoot,
      '../node_modules/react-pdf-highlighter/dist/src/style/MouseSelection.module.css.js',
    ),
    'utf8',
  )
  assert.match(module, /mouseSelection = "_mouseSelection_/u)
})

test('each preview imports its own unlayered override sheet', async () => {
  for (const [name, selector] of [
    ['pdf-preview', '.pdf-highlighter-container .Highlight__part'],
    ['ppt-preview', '.ppt-previewer .slide-wrapper'],
    ['excel-preview', '.excel-csv-previewer .preview-excel-wrapper'],
  ]) {
    const [sheet, component] = await Promise.all([
      readFile(path.join(previews, `${name}.css`), 'utf8'),
      readFile(path.join(previews, `${name}.tsx`), 'utf8'),
    ])
    assert.ok(sheet.includes(selector), `${name}.css keeps ${selector}`)
    assert.doesNotMatch(sheet, /@layer/u, `${name}.css stays unlayered`)
    assert.match(
      component,
      new RegExp(`^import '[^']*/${name}\\.css'$`, 'mu'),
      `${name}.tsx imports its sheet`,
    )
  }
})
