import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LoginFrame } from '../components/login-frame'
import { RegisterPage } from '../RegisterPage'
import { PlatformKind, PlatformProvider } from '@/platform'
import type { ApplicationComposition } from '@/platform'
import { setProductLanguage } from '@/locales/i18n'

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ register: vi.fn(), isLoading: false }),
}))

const composition = (kind: PlatformKind): ApplicationComposition =>
  Object.freeze({
    platform: Object.freeze({
      kind,
      capabilities: () =>
        Object.freeze({
          desktop: kind === PlatformKind.DESKTOP,
          nativeMenu: false,
          updater: false,
          notifications: false,
          localAgent: false,
          pty: false,
          localMcp: false,
        }),
    }),
    commandSource: Object.freeze({ subscribe: () => () => {} }),
  })

describe('LoginFrame', () => {
  afterEach(async () => {
    await setProductLanguage('zh-CN')
  })

  it('centres one card under the brand wordmark on web and desktop', async () => {
    await setProductLanguage('en-US')
    for (const desktop of [false, true]) {
      const markup = renderToStaticMarkup(
        <LoginFrame desktop={desktop}>
          <div>shared-login-form</div>
        </LoginFrame>,
      )
      expect(markup).toContain(
        `data-auth-frame="${desktop ? 'desktop' : 'web'}"`,
      )
      expect(markup).toContain('data-brand-mark')
      expect(markup).toContain('Cangming AI')
      expect(markup).toContain('shared-login-form')
      expect(markup).not.toContain('<img')
      expect(markup).not.toMatch(/bg-linear|from-|to-black/)
    }
  })

  it('renders registration in the same frame without hard-coded copy', async () => {
    await setProductLanguage('en-US')
    const markup = renderToStaticMarkup(
      <PlatformProvider composition={composition(PlatformKind.WEB)}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </PlatformProvider>,
    )
    expect(markup).toContain('data-auth-frame="web"')
    expect(markup).toContain('Create your account')
    expect(markup).toContain('Step 1 of 3')
    expect(markup).toContain('Display name')
    expect(markup).toContain('Already have an account?')
    expect(markup).not.toMatch(/[一-鿿]/)
  })
})
