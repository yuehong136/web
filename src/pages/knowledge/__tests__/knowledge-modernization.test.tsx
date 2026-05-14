import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import zhCN from '@/locales/zh-CN/knowledge'
import enUS from '@/locales/en-US/knowledge'
import { DocumentParserType } from '@/types/document-parser'
import { getParserImageFileNames } from '../settings/parser-image-map'

const flattenKeys = (value: unknown, prefix = ''): string[] => {
  if (!value || typeof value !== 'object') return [prefix]

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  )
}

test('knowledge locale namespace keeps zh-CN and en-US keys in sync', () => {
  assert.deepEqual(flattenKeys(zhCN).sort(), flattenKeys(enUS).sort())
})

test('knowledge page templates expose stable scroll roots', () => {
  const readTemplate = (name: string) =>
    readFileSync(
      new URL(`../../../components/page-templates/${name}`, import.meta.url),
      'utf8',
    )

  assert.match(
    readTemplate('console-page-template.tsx'),
    /data-scroll-root=.*console-body/,
  )
  assert.match(
    readTemplate('list-page-template.tsx'),
    /data-scroll-root="list-body"/,
  )
  assert.match(
    readTemplate('split-detail-page-template.tsx'),
    /data-scroll-root="split-left"/,
  )
  assert.match(
    readTemplate('split-detail-page-template.tsx'),
    /data-scroll-root="split-right"/,
  )
  assert.match(
    readTemplate('workspace-page-template.tsx'),
    /data-scroll-root="workspace-body"/,
  )
})

test('parser image resolver returns deterministic lazy-load filenames', () => {
  assert.deepEqual(getParserImageFileNames(DocumentParserType.Naive), [
    'naive-01',
    'naive-02',
  ])
  assert.deepEqual(getParserImageFileNames(DocumentParserType.Book), [
    'book-01',
    'book-02',
    'book-03',
    'book-04',
  ])
  assert.deepEqual(getParserImageFileNames('unknown'), [])
})
