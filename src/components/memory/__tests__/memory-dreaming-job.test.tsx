import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { MemoryDreamingJob } from '../memory-dreaming-job'
import type { MemoryMaintenanceJob } from '@/types/memory-dreaming'

const unavailableJob: MemoryMaintenanceJob = {
  job_id: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  operation_id: 'create-original',
  state: 'redacted',
  generation: 3,
  policy: 'general',
  input_budget_tokens: 16384,
  output_budget_tokens: 4096,
  estimated_input_tokens: 60,
  coverage: { selected: 2, included: 0, analyzed: 0, deferred: 0 },
  inputs: [
    {
      input_id: 'source-9007199254740993',
      source_id: '9007199254740993',
      source_revision: 1,
      source_generation: 1,
      content_sha256: 'a'.repeat(64),
      scope: {},
      coverage: 'stale',
      defer_reason: 'source_state_changed',
    },
    {
      input_id: 'source-9007199254740995',
      source_id: '9007199254740995',
      source_revision: 1,
      source_generation: 1,
      content_sha256: 'b'.repeat(64),
      scope: {},
      coverage: 'redacted',
      defer_reason: 'source_withdrawn',
    },
  ],
  analysis_operation_id: 'analysis-original',
  error_code: 'source_withdrawn',
  model_reference: 'controlled-fixture',
  usage: {},
  created_at: '2026-11-15T09:00:00+00:00',
  updated_at: '2026-11-15T10:00:00+00:00',
}

it.each([
  [
    'en-US',
    'Source changed; saved body unavailable',
    'Source withdrawn; saved body withheld',
    'This input is deferred; its body was not analyzed.',
  ],
  [
    'zh-CN',
    '来源已变更，快照正文不可用',
    '来源已撤回，快照正文已隐藏',
    '此输入已延后，正文尚未分析。',
  ],
] as const)(
  'renders real unavailable input coverage without budget-deferral claims in %s',
  async (locale, changed, withdrawn, deferred) => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    await setProductLanguage(locale)
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host)
    try {
      await act(async () =>
        root.render(
          <MemoryDreamingJob job={structuredClone(unavailableJob)} />,
        ),
      )
      expect(host.textContent).toContain(changed)
      expect(host.textContent).toContain(withdrawn)
      expect(host.textContent).toContain('9007199254740993')
      expect(host.textContent).toContain('9007199254740995')
      expect(host.textContent).not.toContain(deferred)
      expect(host.textContent).not.toContain('memory.dreaming.')
    } finally {
      await act(async () => root.unmount())
      host.remove()
      await setProductLanguage('zh-CN')
    }
  },
)
