import assert from 'node:assert/strict'
import test from 'node:test'
import type { VariableOptionGroup } from '@/components/prompt-editor/types'
import { Operator } from '../../constant'
import { filterDocGeneratorDownloadOutputOptions } from '../use-get-begin-query'

const groups: VariableOptionGroup[] = [
  {
    label: 'Document',
    title: 'Document',
    options: [
      { label: 'download', value: 'DocGenerator:One@download' },
      { label: 'content', value: 'Other:One@content' },
    ],
  },
]

const getOperatorTypeFromId = (nodeId?: string | null) =>
  nodeId?.startsWith('DocGenerator:') ? Operator.DocGenerator : Operator.Message

test('DocGenerator download output is available to Message nodes', () => {
  assert.deepEqual(
    filterDocGeneratorDownloadOutputOptions(
      groups,
      true,
      getOperatorTypeFromId,
    ),
    groups,
  )
})

test('DocGenerator download output is hidden from non-Message nodes', () => {
  const filtered = filterDocGeneratorDownloadOutputOptions(
    groups,
    false,
    getOperatorTypeFromId,
  )

  assert.deepEqual(
    filtered[0]?.options.map((option) => option.value),
    ['Other:One@content'],
  )
})
