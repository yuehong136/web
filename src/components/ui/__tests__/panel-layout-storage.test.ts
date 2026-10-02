import assert from 'node:assert/strict'
import test from 'node:test'
import { createPanelLayoutStorage } from '../panel-layout-storage'

const panelIds = ['left', 'center', 'right']
const legacyKey = 'react-resizable-panels:fixture'
const currentKey = `${legacyKey}:left:center:right`

function createStorage(entries: Record<string, string> = {}) {
  const data = new Map(Object.entries(entries))
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }
}

test('migrates sorted v2 keys using original panel order and preserves new layouts', () => {
  const raw = JSON.stringify({
    'center,left,right': { layout: [28, 44, 28], expandToSizes: {} },
  })
  const storage = createStorage({ [legacyKey]: raw })
  const adapter = createPanelLayoutStorage(storage, 'fixture', panelIds)
  assert.deepEqual(JSON.parse(adapter.getItem(currentKey)!), {
    left: 28,
    center: 44,
    right: 28,
  })
  assert.equal(storage.getItem(legacyKey), raw)
  const resized = JSON.stringify({ left: 20, center: 50, right: 30 })
  adapter.setItem(currentKey, resized)
  assert.equal(
    createPanelLayoutStorage(storage, 'fixture', panelIds).getItem(currentKey),
    resized,
  )
  assert.equal(adapter.getItem('react-resizable-panels:another'), null)
})

test('ignores malformed, nonfinite and incomplete saved layouts', () => {
  for (const raw of [
    '{',
    'null',
    '{"left":50}',
    '{"left":-1,"center":51,"right":50}',
    '{"left":1e999,"center":0,"right":0}',
    '{"left":20,"center":20,"right":20}',
  ]) {
    const adapter = createPanelLayoutStorage(
      createStorage({ [currentKey]: raw }),
      'fixture',
      panelIds,
    )
    assert.equal(adapter.getItem(currentKey), null)
  }
  const unavailable = createPanelLayoutStorage(
    {
      getItem() {
        throw new Error('Unavailable')
      },
      setItem() {},
    },
    'fixture',
    panelIds,
  )
  assert.equal(unavailable.getItem(currentKey), null)
})
