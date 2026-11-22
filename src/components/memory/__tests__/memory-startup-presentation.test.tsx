import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { expect, it } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { MemoryStartupItems } from '../memory-startup-items'
import { MemorySourceExcerptView } from '../memory-source-excerpt-view'
import { startupPackage } from './memory-startup-fixture'
it.each(['en-US', 'zh-CN'] as const)(
  'renders full applicability, bounded omissions and untrusted data plainly in %s',
  async (locale) => {
    Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
    await setProductLanguage(locale)
    const host = document.createElement('div')
    document.body.append(host)
    const root = createRoot(host),
      value = startupPackage(),
      source = value.items[0].sources[0]
    try {
      await act(async () =>
        root.render(
          <MemoryRouter>
            <MemoryStartupItems value={value} onSource={() => {}} />
            <MemorySourceExcerptView
              sourceId={source.source_id}
              sourceRevision={source.source_revision}
              sourceGeneration={source.source_generation}
              contentHash={source.content_sha256}
              excerpt="🔭<script>window.sourceInjected=true</script>"
              range={{ start: 512, end: 555, total: 900 }}
              pending={false}
              previous
              next
              onFirst={() => {}}
              onPrevious={() => {}}
              onNext={() => {}}
            />
          </MemoryRouter>,
        ),
      )
      expect(host.textContent).toContain(value.items[0].content)
      expect(host.textContent).toContain(
        value.items[0].verification.applicability,
      )
      expect(host.textContent).toContain('unverified')
      expect(host.textContent).toContain(source.source_revision)
      expect(host.textContent).toContain(
        locale === 'en-US'
          ? 'Scanned 4 / inventory limit 64'
          : '已扫描 4 / 库存上限 64',
      )
      expect(host.textContent).toContain(
        locale === 'en-US' ? 'Selection was bounded' : '本次选择有界',
      )
      expect(host.textContent).toContain(
        locale === 'en-US' ? 'Source scope' : '来源范围',
      )
      expect(host.textContent).not.toContain('memory.startup.')
      expect(host.querySelector('script')).toBeNull()
      expect(host.querySelectorAll('section[aria-label]')).toHaveLength(3)
    } finally {
      await act(async () => root.unmount())
      host.remove()
      await setProductLanguage('zh-CN')
    }
  },
)
