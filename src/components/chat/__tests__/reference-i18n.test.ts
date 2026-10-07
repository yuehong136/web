import assert from 'node:assert/strict'
import test from 'node:test'
import enUS from '@/locales/en-US/reference'
import zhCN from '@/locales/zh-CN/reference'

type Resource = Record<string, unknown>

const leafKeys = (node: Resource, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? leafKeys(value as Resource, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

test('zh-CN and en-US reference resources define the same keys', () => {
  assert.deepEqual(leafKeys(enUS).sort(), leafKeys(zhCN).sort())
})
