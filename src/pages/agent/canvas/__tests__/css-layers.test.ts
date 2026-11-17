import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { test } from 'node:test'
import { compile } from '@tailwindcss/node'

// xyflow 13 ships its styles in `@layer xyflow`. A layer first named by the
// lazily loaded canvas chunk would land after `utilities` and beat every
// utility class on the canvas, so the app declares it up front.

const root = path.resolve(import.meta.dirname, '../../../../..')
const sourceRoot = path.join(root, 'src')
const require = createRequire(import.meta.url)

/** Cascade order: each layer counts from the statement that first names it. */
function layerOrder(css: string) {
  const order: string[] = []
  for (const match of css.matchAll(/@layer\s+([\w\s,.-]+?)\s*[;{]/gu)) {
    for (const name of match[1].split(',').map((part) => part.trim())) {
      if (name && !order.includes(name)) order.push(name)
    }
  }
  return order
}

test('the app names the xyflow layer between vendor and component layers', async () => {
  const result = await compile(
    '@import "./styles/application-reset.css";\n@import "./index.css";',
    { base: sourceRoot, onDependency() {} },
  )
  const order = layerOrder(result.build([]))
  const at = (name: string) => order.indexOf(name)
  assert.ok(at('xyflow') > at('antdx'), order.join(', '))
  assert.ok(at('xyflow') < at('components'), order.join(', '))
  assert.ok(at('components') < at('utilities'), order.join(', '))
})

test('xyflow still ships its styles inside the xyflow layer', async () => {
  const css = await readFile(
    require.resolve('@xyflow/react/dist/style.css'),
    'utf8',
  )
  assert.deepEqual(layerOrder(css), ['xyflow'])
})

test('canvas overrides stay unlayered so they beat the library defaults', async () => {
  const css = await readFile(
    path.join(sourceRoot, 'pages/agent/canvas/overrides.css'),
    'utf8',
  )
  assert.doesNotMatch(css, /@layer/u)
})
