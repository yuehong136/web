import { afterEach, expect, it } from 'vitest'
import { useUIStore } from '@/stores/ui'
import {
  createRouteLocaleScope,
  getProductLanguage,
  setProductLanguage,
} from '@/locales/i18n'
import { setAppearance, DEFAULT_APPEARANCE } from '@/themes'

afterEach(async () => {
  await setProductLanguage('zh-CN')
  setAppearance(DEFAULT_APPEARANCE)
})

it('mirrors product preferences while temporary entry languages stay out of persisted UI state', async () => {
  await setProductLanguage('en-US')
  useUIStore.getState().setSidebarCollapsed(false)
  expect(useUIStore.getState().language).toBe('en-US')
  const scope = createRouteLocaleScope()
  try {
    await scope.set('zh-CN')
    expect(getProductLanguage()).toBe('en-US')
    expect(useUIStore.getState().language).toBe('en-US')
    const state = JSON.parse(localStorage.getItem('ui-storage')!).state
    expect(state).not.toHaveProperty('language')
    expect(state).not.toHaveProperty('theme')
  } finally {
    await scope.dispose()
  }
})

it('keeps legacy theme controls synchronized with the complete appearance owner', () => {
  setAppearance({ preset: 'ocean', mode: 'dark' })
  expect(useUIStore.getState().theme).toBe('dark')
  useUIStore.getState().setTheme('light')
  expect(JSON.parse(localStorage.getItem('appearance')!).preset).toBe('ocean')
  expect(JSON.parse(localStorage.getItem('appearance')!).mode).toBe('light')
})
