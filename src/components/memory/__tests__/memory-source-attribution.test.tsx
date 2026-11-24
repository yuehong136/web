import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { MemorySourceAttribution } from '../memory-source-attribution'
import type { MemorySourceAttribution as Attribution } from '@/types/memory-sources'
const value: Attribution = {
  format: 'structured',
  role_status: 'caller_declared',
  segments: null,
  segments_included: false,
  segment_count: 3,
  declared_roles: ['user', 'assistant', 'tool'],
  event_time: { value: '2026-11-12T08:00:00+08:00', status: 'caller_declared' },
  received_at: '2026-11-16T13:00:00+00:00',
  reference_time: '2026-11-12T08:00:00+08:00',
  provenance: {
    kind: 'authenticated_submission',
    submitted_by: '<script>speakerVerified=true</script>',
    authenticated_submitter: true,
    speaker_identity_verified: false,
    content_verified: false,
  },
}
it.each(['en-US', 'zh-CN'] as const)(
  'separates authentication, client declarations and human review in %s without downloading segments',
  async (locale) => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    await setProductLanguage(locale)
    const host = document.createElement('div'),
      root = createRoot(host)
    document.body.append(host)
    try {
      await act(async () =>
        root.render(<MemorySourceAttribution value={value} />),
      )
      const text = host.textContent!
      expect(text).toContain(value.received_at)
      expect(text).toContain(value.event_time.value)
      expect(text).toContain(value.provenance.submitted_by)
      expect(text).toContain(
        locale === 'en-US' ? 'A tool label does not prove' : '“工具”标签不证明',
      )
      expect(text).toContain(
        locale === 'en-US'
          ? 'Human verification is a separate judgment'
          : '人工核验是针对当前条目',
      )
      expect(text).not.toContain('memory.sources.')
      expect(host.querySelector('script')).toBeNull()
      expect(host.querySelector('pre')).toBeNull()
      await act(async () =>
        root.render(
          <MemorySourceAttribution
            value={{
              ...value,
              format: 'legacy_combined',
              role_status: 'role_unknown',
              segment_count: null,
              declared_roles: [],
              event_time: { value: null, status: 'unknown' },
              received_at: null,
              provenance: {
                ...value.provenance,
                kind: 'legacy_unknown',
                submitted_by: null,
                authenticated_submitter: false,
              },
            }}
          />,
        ),
      )
      expect(host.textContent).toContain(
        locale === 'en-US'
          ? 'no structured role receipt'
          : '没有结构化角色回执',
      )
      expect(host.textContent).not.toContain(value.provenance.submitted_by)
    } finally {
      await act(async () => root.unmount())
      host.remove()
      await setProductLanguage('zh-CN')
    }
  },
)
