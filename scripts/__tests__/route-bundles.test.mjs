import assert from 'node:assert/strict'
import test from 'node:test'
import { collectStaticAssets } from '../profile-route-bundles.mjs'

test('counts the entry and route static closure once and excludes unopened dynamic resources', () => {
  const manifest = {
    entry: { file: 'entry.js', imports: ['shared'], dynamicImports: ['route'] },
    route: {
      file: 'route.js',
      imports: ['shared'],
      css: ['route.css'],
      dynamicImports: ['preview'],
    },
    shared: { file: 'shared.js', imports: ['entry'], assets: ['font.woff2'] },
    preview: { file: 'preview.js' },
  }
  assert.deepEqual(collectStaticAssets(manifest, ['entry', 'route']), [
    'entry.js',
    'route.css',
    'route.js',
    'shared.js',
  ])
  assert.ok(
    collectStaticAssets(manifest, ['entry', 'route'], {
      includeReferencedAssets: true,
    }).includes('font.woff2'),
  )
  assert.throws(
    () => collectStaticAssets(manifest, ['missing']),
    /Missing manifest chunk/,
  )
})
