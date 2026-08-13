import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import {
  PlatformProvider,
  PlatformKind,
  useApplicationComposition,
  usePlatform,
} from '@/platform'
import { createBrowserApplicationComposition } from '@/platform/browser'

describe('PlatformProvider', () => {
  it('provides the exact application composition and platform port', () => {
    const composition = createBrowserApplicationComposition()
    let observedComposition: unknown
    let observedPlatform: unknown

    function Probe() {
      observedComposition = useApplicationComposition()
      observedPlatform = usePlatform()
      return <span>ready</span>
    }

    expect(
      renderToStaticMarkup(
        <PlatformProvider composition={composition}>
          <Probe />
        </PlatformProvider>,
      ),
    ).toContain('ready')
    expect(observedComposition).toBe(composition)
    expect(observedPlatform).toBe(composition.platform)
  })

  it('fails explicitly when a consumer is outside the provider', () => {
    function Probe() {
      usePlatform()
      return null
    }

    expect(() => renderToStaticMarkup(<Probe />)).toThrow(
      'Application composition provider is unavailable.',
    )
  })

  it('keeps the browser adapter immutable and capability-accurate', () => {
    const first = createBrowserApplicationComposition()
    const second = createBrowserApplicationComposition()

    expect(first).toBe(second)
    expect(first.platform.kind).toBe(PlatformKind.WEB)
    expect(first.platform.capabilities()).toEqual({
      desktop: false,
      nativeMenu: false,
      updater: false,
      notifications: false,
      localAgent: false,
      pty: false,
      localMcp: false,
    })
    expect(Object.isFrozen(first)).toBe(true)
    expect(Object.isFrozen(first.platform)).toBe(true)
    expect(Object.isFrozen(first.platform.capabilities())).toBe(true)
    expect(typeof first.commandSource.subscribe(() => undefined)).toBe(
      'function',
    )
  })
})
