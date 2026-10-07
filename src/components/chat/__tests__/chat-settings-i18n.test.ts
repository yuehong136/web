import assert from 'node:assert/strict'
import test from 'node:test'
import { generationPresetOptions } from '@/constants/llm'
import enUS from '@/locales/en-US/chat'
import zhCN from '@/locales/zh-CN/chat'
import { CROSS_LANGUAGE_OPTIONS } from '../chat-settings.constants'

type Resource = Record<string, unknown>

const leafKeys = (node: Resource, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === 'object'
      ? leafKeys(value as Resource, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )

const lookup = (resource: Resource, key: string) =>
  key
    .split('.')
    .reduce<unknown>((node, part) => (node as Resource)?.[part], resource)

test('zh-CN and en-US chat resources define the same keys', () => {
  assert.deepEqual(leafKeys(enUS).sort(), leafKeys(zhCN).sort())
})

test('label keys stored in chat setting options resolve in both languages', () => {
  const keys = [
    ...generationPresetOptions.flatMap((option) => [
      option.labelKey,
      option.descriptionKey,
    ]),
    ...CROSS_LANGUAGE_OPTIONS.map((option) => option.labelKey),
  ]

  for (const resource of [zhCN, enUS]) {
    for (const key of keys) {
      assert.equal(typeof lookup(resource, key), 'string', key)
    }
  }
})
