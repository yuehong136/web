import { createInstance } from 'i18next'
import { describe, expect, it, vi } from 'vitest'
import {
  createLocaleRuntime,
  type LocaleRuntimeOptions,
} from '../locale-runtime'
import { createIsolatedLocaleRuntime } from '../isolated-locale'
import {
  namespaceCodes,
  type LocaleNamespace,
  type ProductLocale,
} from '../locale-registry'
import { namespacesForPath } from '../route-locales'

const deferred = () => {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

async function setup(
  load: NonNullable<LocaleRuntimeOptions['loadNamespace']> = async (
    locale: ProductLocale,
    domain: LocaleNamespace,
  ) => ({
    [domain]: { label: `${locale}:${domain}` },
  }),
) {
  const instance = createInstance()
  await instance.init({
    resources: {},
    lng: 'zh-CN',
    fallbackLng: false,
    initImmediate: false,
  })
  const persist = vi.fn()
  const applyDocument = vi.fn()
  const loadNamespace = vi.fn(load)
  const runtime = createLocaleRuntime({
    instance,
    initialLocale: 'zh-CN',
    persist,
    applyDocument,
    loadNamespace,
  })
  await runtime.ensureNamespaces('zh-CN')
  return { runtime, instance, persist, applyDocument, loadNamespace }
}

describe('locale transactions', () => {
  it('keeps product preference separate from a temporary route and restores it on release', async () => {
    const { runtime, instance, persist } = await setup()
    const onProduct = vi.fn()
    runtime.subscribeProductLanguage(onProduct)
    const scope = runtime.createRouteScope()
    await expect(scope.set('en_GB')).resolves.toBe('en-US')
    expect(runtime.getSnapshot()).toEqual({
      productLocale: 'zh-CN',
      effectiveLocale: 'en-US',
    })
    expect(instance.language).toBe('en-US')
    expect(persist).not.toHaveBeenCalled()
    expect(onProduct).not.toHaveBeenCalled()
    await scope.dispose()
    expect(runtime.getSnapshot()).toEqual({
      productLocale: 'zh-CN',
      effectiveLocale: 'zh-CN',
    })
    expect(instance.language).toBe('zh-CN')
  })

  it('removes absent route locale and reveals the previous live scope', async () => {
    const { runtime } = await setup()
    const first = runtime.createRouteScope()
    const second = runtime.createRouteScope()
    await first.set('en-US')
    await second.set('zh-CN')
    await second.set(undefined)
    expect(runtime.getSnapshot().effectiveLocale).toBe('en-US')
    await first.dispose()
    expect(runtime.getSnapshot().effectiveLocale).toBe('zh-CN')
  })

  it('persists a product change after successful loading without cancelling an active route', async () => {
    const { runtime, persist } = await setup()
    const onProduct = vi.fn()
    runtime.subscribeProductLanguage(onProduct)
    await runtime.applyRouteLocale('zh-CN')
    await runtime.setProductLanguage('en-US')
    expect(persist).toHaveBeenCalledExactlyOnceWith('en-US')
    expect(onProduct).toHaveBeenCalledExactlyOnceWith('en-US')
    expect(runtime.getSnapshot()).toEqual({
      productLocale: 'en-US',
      effectiveLocale: 'zh-CN',
    })
    await runtime.clearRouteLocale()
    expect(runtime.getSnapshot().effectiveLocale).toBe('en-US')
  })

  it('lets the latest language intent win when imports resolve out of order', async () => {
    const wait = deferred()
    const { runtime, instance, persist } = await setup(
      async (locale, domain) => {
        if (locale === 'en-US') await wait.promise
        return { [domain]: { label: locale } }
      },
    )
    const first = runtime.setProductLanguage('en-US')
    const last = runtime.setProductLanguage('zh-CN')
    await last
    wait.resolve()
    await first
    expect(instance.language).toBe('zh-CN')
    expect(runtime.getSnapshot().productLocale).toBe('zh-CN')
    expect(persist).toHaveBeenCalledExactlyOnceWith('zh-CN')
  })

  it('cancels an in-flight override if its owner unmounts', async () => {
    const wait = deferred()
    const { runtime, instance, persist } = await setup(
      async (locale, domain) => {
        if (locale === 'en-US') await wait.promise
        return { [domain]: {} }
      },
    )
    const scope = runtime.createRouteScope()
    const request = scope.set('en-US')
    await scope.dispose()
    wait.resolve()
    await request
    expect(instance.language).toBe('zh-CN')
    expect(runtime.getSnapshot().effectiveLocale).toBe('zh-CN')
    expect(persist).not.toHaveBeenCalled()
  })

  it('preserves preference, runtime language and document when imports fail and allows retry', async () => {
    let fail = true
    const { runtime, instance, persist, applyDocument } = await setup(
      async (locale, domain) => {
        if (locale === 'en-US' && fail) throw new Error('offline')
        return { [domain]: {} }
      },
    )
    await expect(runtime.setProductLanguage('en-US')).rejects.toThrow('offline')
    expect(runtime.getSnapshot()).toEqual({
      productLocale: 'zh-CN',
      effectiveLocale: 'zh-CN',
    })
    expect(instance.language).toBe('zh-CN')
    expect(persist).not.toHaveBeenCalled()
    expect(applyDocument).not.toHaveBeenCalled()
    fail = false
    await runtime.setProductLanguage('en-US')
    expect(runtime.getSnapshot().productLocale).toBe('en-US')
  })

  it('rolls back a failed persistence commit', async () => {
    const { runtime, instance, persist } = await setup()
    persist.mockImplementation(() => {
      throw new Error('storage denied')
    })
    await expect(runtime.setProductLanguage('en-US')).rejects.toThrow(
      'storage denied',
    )
    expect(instance.language).toBe('zh-CN')
    expect(runtime.getSnapshot()).toEqual({
      productLocale: 'zh-CN',
      effectiveLocale: 'zh-CN',
    })
  })

  it('loads only requested language/domain bundles and retains legacy key lookup', async () => {
    const { runtime, instance, loadNamespace } = await setup()
    loadNamespace.mockClear()
    await Promise.all([
      runtime.ensureNamespaces('en-US', ['home']),
      runtime.ensureNamespaces('en-US', ['home']),
    ])
    expect(loadNamespace).toHaveBeenCalledExactlyOnceWith('en-US', 'home')
    expect(instance.hasResourceBundle('en-US', 'home')).toBe(true)
    expect(instance.hasResourceBundle('en-US', 'agent')).toBe(false)
    expect(instance.hasResourceBundle('zh-CN', 'home')).toBe(false)
    expect(instance.t('home.label', { lng: 'en-US' })).toBe('en-US:home')
    expect(instance.t('label', { lng: 'en-US', ns: 'home' })).toBe('en-US:home')
  })
})

it('isolated widget locale does not change another instance, document or storage', async () => {
  const host = await setup()
  const beforeLang = document.documentElement.lang
  localStorage.setItem('i18n_language', 'zh-CN')
  const widget = createIsolatedLocaleRuntime('en-US')
  await widget.ensureNamespaces('en-US', ['common', 'agent'])
  await widget.setProductLanguage('zh-CN')
  expect(widget.instance.language).toBe('zh-CN')
  expect(host.instance.language).toBe('zh-CN')
  expect(host.persist).not.toHaveBeenCalled()
  expect(document.documentElement.lang).toBe(beforeLang)
  expect(localStorage.getItem('i18n_language')).toBe('zh-CN')
})

it('route namespace planning excludes unrelated business catalogs from the home/auth path', () => {
  expect(namespacesForPath('/login')).toContain('auth')
  expect(namespacesForPath('/login')).not.toContain('agent')
  expect(namespacesForPath('/')).not.toContain('flow')
  expect(namespacesForPath('/agent/123')).toContain('agent')
  expect(namespacesForPath('/tools/auto-fill')).toContain('chat')
  expect(namespacesForPath('/mcp-chat')).toContain('mcp')
  expect(namespacesForPath('/agent-templates')).toContain('agent')
  expect(namespacesForPath('/dialog/1/prompt-editor')).toContain('flow')
  expect(namespacesForPath('/settings/appearance')).toContain('appearance')
  expect(
    namespacesForPath('/knowledge/1/search').every((name) =>
      namespaceCodes.includes(name),
    ),
  ).toBe(true)
})
