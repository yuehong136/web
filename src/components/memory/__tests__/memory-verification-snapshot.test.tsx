import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { MemoryVerificationRecord } from '../memory-verification-record'
import { verificationRecord } from './memory-verification-fixture'
import { MemoryVerificationSnapshot } from '../memory-verification-snapshot'
let host: HTMLDivElement, root: Root
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  await setProductLanguage('zh-CN')
})
it.each(['en-US', 'zh-CN'] as const)(
  'shows exact version-bound review data as untrusted text in %s',
  async (locale) => {
    await setProductLanguage(locale)
    const content =
      '<script>window.verificationInjected=true</script> 仅供核验的正文'
    await act(async () =>
      root.render(
        <MemoryVerificationSnapshot
          entryId={'e'.repeat(32)}
          revision="9007199254740993"
          content={content}
          contentHash={'a'.repeat(64)}
          sources={[
            {
              sourceId: '9007199254741001',
              revision: '9007199254741003',
              generation: '9007199254741005',
              contentHash: 'b'.repeat(64),
            },
          ]}
          scope={{ user_id: ' alpha ', agent_id: '' }}
        />,
      ),
    )
    expect(host.textContent).toContain(content)
    expect(host.querySelector('script')).toBeNull()
    expect(host.textContent).toContain('9007199254740993')
    expect(host.textContent).toContain('9007199254741005')
    expect(host.textContent).toContain(
      locale === 'en-US' ? 'provenance only' : '只证明可追溯性',
    )
    expect(host.textContent).not.toContain('memory.verification.')
  },
)
it('retains version metadata while making unavailable review content explicit', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(
      <MemoryVerificationSnapshot
        entryId="entry"
        revision="2"
        content={null}
        contentHash={'a'.repeat(64)}
        sources={[]}
        scope={{}}
      />,
    ),
  )
  expect(host.textContent).toContain('Do not confirm this snapshot')
  expect(host.querySelectorAll('input,button')).toHaveLength(0)
})

it.each(['en-US', 'zh-CN'] as const)(
  'distinguishes an explicitly reported check time from the submission-time default in %s',
  async (locale) => {
    await setProductLanguage(locale)
    await act(async () =>
      root.render(
        <MemoryVerificationRecord
          value={{
            ...verificationRecord(),
            checked_at_is_user_reported: false,
          }}
        />,
      ),
    )
    expect(host.textContent).toContain(
      locale === 'en-US' ? 'defaults to submission time' : '默认取提交时刻',
    )
    expect(host.textContent).toContain(
      locale === 'en-US'
        ? 'does not mean the server performed'
        : '不表示服务端执行',
    )
    expect(host.textContent).toContain(
      locale === 'en-US' ? 'Original human conclusion' : '原人工结论',
    )
    expect(host.querySelectorAll('a')).toHaveLength(0)
    await act(async () =>
      root.render(<MemoryVerificationRecord value={verificationRecord()} />),
    )
    expect(host.textContent).toContain(
      locale === 'en-US' ? 'Human-reported check time' : '人工报告的检查时间',
    )
    expect(host.textContent).not.toContain(
      locale === 'en-US' ? 'defaults to submission time' : '默认取提交时刻',
    )
  },
)
