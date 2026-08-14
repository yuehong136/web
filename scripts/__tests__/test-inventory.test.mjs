import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyTestFile,
  createTestInventory,
  loadRepositoryTestInventory,
  TEST_LANES,
} from '../test-inventory.mjs'

test('classifies supported source runners into separate lanes', () => {
  assert.deepEqual(
    classifyTestFile('src/example.test.ts', "import test from 'node:test'\n"),
    { file: 'src/example.test.ts', lane: TEST_LANES.SOURCE_NODE },
  )
  assert.deepEqual(
    classifyTestFile('src/example.test.tsx', "import { test } from 'vitest'\n"),
    { file: 'src/example.test.tsx', lane: TEST_LANES.SOURCE_VITEST },
  )
})

test('rejects a test that declares no supported runner', () => {
  const inventory = createTestInventory(
    ['src/unassigned.test.ts'],
    () => 'export {}\n',
  )

  assert.equal(inventory.entries.length, 0)
  assert.deepEqual(inventory.errors, [
    {
      file: 'src/unassigned.test.ts',
      error: 'does not import node:test or vitest',
    },
  ])
})

test('rejects mixed runners and unsupported test roots', () => {
  const inventory = createTestInventory(
    ['src/mixed.test.ts', 'experiments/unowned.test.ts'],
    (file) =>
      file.includes('mixed')
        ? "import test from 'node:test'\nimport { expect } from 'vitest'\n"
        : "import test from 'node:test'\n",
  )

  assert.deepEqual(
    inventory.errors.map(({ file, error }) => ({ file, error })),
    [
      {
        file: 'src/mixed.test.ts',
        error: 'imports both node:test and vitest',
      },
      {
        file: 'experiments/unowned.test.ts',
        error:
          'is outside the supported src, desktop, eslint-rules, or scripts roots',
      },
    ],
  )
})

test('assigns every current repository test to exactly one lane', () => {
  const inventory = loadRepositoryTestInventory(process.cwd())

  assert.equal(inventory.errors.length, 0)
  assert.ok(inventory.entries.length >= 100)
  assert.equal(
    new Set(inventory.entries.map((entry) => entry.file)).size,
    inventory.entries.length,
  )
})
