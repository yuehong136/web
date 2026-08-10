import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeDialogConfig, normalizeDialogSearchMode } from '../data'

test('restores a saved flat hybrid search mode into the page config', () => {
  const { config } = normalizeDialogConfig({
    search_mode: {
      type: 'hybrid',
      weight_dense: 0.3,
      weight_sparse: 0.7,
    },
  })

  assert.deepEqual(config.search_mode, {
    type: 'hybrid',
    weight_dense: 0.3,
    weight_sparse: 0.7,
  })
})

test('normalizes the legacy nested hybrid search mode response', () => {
  assert.deepEqual(
    normalizeDialogSearchMode({
      hybrid: {
        weight_dense: 0,
        weight_sparse: 1,
      },
    }),
    {
      type: 'hybrid',
      weight_dense: 0,
      weight_sparse: 1,
    },
  )
})

test('does not expose unknown response keys as select values', () => {
  assert.deepEqual(normalizeDialogSearchMode({ type: 'unexpected' }), {
    type: 'dense',
  })
})
