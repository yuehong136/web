import { StrictMode, act } from 'react'
import { createRoot } from 'react-dom/client'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { afterEach, describe, expect, it } from 'vitest'
import i18n, {
  getCurrentLanguage,
  getProductLanguage,
  setProductLanguage,
} from '../i18n'
import {
  IsolatedLocaleBoundary,
  LocaleResourceBoundary,
} from '../locale-boundary'
import { createInstance } from 'i18next'
import { createLocaleRuntime } from '../locale-runtime'
import { useRouteLocale } from '../use-route-locale'
import { useTypedTranslation } from '../use-typed-translation'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
const roots: ReturnType<typeof createRoot>[] = []
afterEach(async () => {
  for (const root of roots.splice(0)) await act(async () => root.unmount())
  document.body.replaceChildren()
})
const mount = () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  roots.push(root)
  return { root, container }
}
const Label = () => {
  const { t } = useTranslation()
  return <span>{t('common.save')}</span>
}
const ScopedRoute = ({ locale }: { locale?: string }) => {
  useRouteLocale(locale)
  return <Label />
}
const TypedWorkspaceLabel = () => {
  const { t } = useTypedTranslation('chat.aiWorkspace')
  return <span>{t('context')}</span>
}

describe('locale provider boundaries', () => {
  it('updates typed workspace labels through an isolated provider without remounting drafts', async () => {
    await setProductLanguage('zh-CN')
    const { root, container } = mount()
    const render = (locale: string) => (
      <IsolatedLocaleBoundary locale={locale} namespaces={['chat']}>
        <TypedWorkspaceLabel />
        <input defaultValue="kept draft" />
      </IsolatedLocaleBoundary>
    )
    await act(async () => root.render(render('en-US')))
    expect(container.textContent).toBe('Turn context')
    const input = container.querySelector('input')!
    input.value = 'edited draft'
    await act(async () => root.render(render('zh-CN')))
    expect(container.textContent).toBe('本轮上下文')
    expect(container.querySelector('input')).toBe(input)
    expect(input.value).toBe('edited draft')
    expect(getProductLanguage()).toBe('zh-CN')
  })

  it('keeps simultaneous host/widgets independent and retains an edited draft across widget language changes', async () => {
    await setProductLanguage('zh-CN')
    const { root, container } = mount()
    const render = (locale: string) => (
      <I18nextProvider i18n={i18n}>
        <div data-host>
          <Label />
        </div>
        <div data-first>
          <IsolatedLocaleBoundary locale={locale} namespaces={['common']}>
            <Label />
            <input defaultValue="draft" />
          </IsolatedLocaleBoundary>
        </div>
        <div data-second>
          <IsolatedLocaleBoundary locale="zh-CN" namespaces={['common']}>
            <Label />
          </IsolatedLocaleBoundary>
        </div>
      </I18nextProvider>
    )
    await act(async () => root.render(render('en-US')))
    expect(container.querySelector('[data-host]')?.textContent).toBe('保存')
    expect(container.querySelector('[data-first]')?.textContent).toBe('Save')
    expect(container.querySelector('[data-second]')?.textContent).toBe('保存')
    const draft = container.querySelector('input')!
    draft.value = 'kept draft'
    await act(async () => root.render(render('zh-CN')))
    expect(container.querySelector('[data-first]')?.textContent).toBe('保存')
    expect(container.querySelector('input')).toBe(draft)
    expect(draft.value).toBe('kept draft')
    expect(getProductLanguage()).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it('cleans route overrides on locale removal and unmount even under StrictMode', async () => {
    await setProductLanguage('zh-CN')
    const { root, container } = mount()
    const render = (locale?: string) => (
      <StrictMode>
        <ScopedRoute locale={locale} />
      </StrictMode>
    )
    await act(async () => root.render(render('en-US')))
    expect(container.textContent).toBe('Save')
    expect(getCurrentLanguage()).toBe('en-US')
    expect(getProductLanguage()).toBe('zh-CN')
    expect(localStorage.getItem('i18n_language')).toBe('zh-CN')
    await act(async () => root.render(render()))
    expect(getCurrentLanguage()).toBe('zh-CN')
    await act(async () => root.render(render('en-US')))
    await act(async () => root.render(null))
    expect(getCurrentLanguage()).toBe('zh-CN')
    expect(i18n.language).toBe('zh-CN')
  })
})

it('gates a new domain, exposes a translated retry and keeps an existing draft on language failure', async () => {
  let fail = true
  const instance = createInstance()
  await instance.init({
    resources: {},
    lng: 'en-US',
    fallbackLng: false,
    initImmediate: false,
  })
  const runtime = createLocaleRuntime({
    instance,
    initialLocale: 'en-US',
    loadNamespace: async (locale, namespace) => {
      if (namespace === 'home' && fail) throw new Error('offline')
      if (locale === 'zh-CN') throw new Error('language offline')
      return namespace === 'common'
        ? {
            common: {
              save: 'Save',
              loading: 'Loading',
              operationFailed: 'Could not load',
              retry: 'Retry',
            },
          }
        : { [namespace]: {} }
    },
  })
  await runtime.ensureNamespaces('en-US', ['common'])
  const { root, container } = mount()
  await act(async () =>
    root.render(
      <I18nextProvider i18n={instance}>
        <LocaleResourceBoundary runtime={runtime} namespaces={['home']}>
          <Label />
          <input defaultValue="kept draft" />
        </LocaleResourceBoundary>
      </I18nextProvider>,
    ),
  )
  expect(container.textContent).toContain('Could not load')
  expect(container.querySelector('input')).toBeNull()
  fail = false
  await act(async () => container.querySelector('button')!.click())
  const input = container.querySelector('input')!
  expect(container.textContent).toBe('Save')
  await act(async () => {
    await expect(runtime.setProductLanguage('zh-CN')).rejects.toThrow(
      'language offline',
    )
  })
  expect(container.querySelector('input')).toBe(input)
  expect(input.value).toBe('kept draft')
  expect(container.textContent).toBe('Save')
})
