// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { adminAPI, setAdminToken } from '@/api/admin'
import { changeLanguage } from '@/locales/i18n'
import { SandboxPage } from '../sandbox-page'
import { sandboxSubmitConfig } from '../config-values'
import type { SandboxConfig, SandboxSchema } from '../types'

vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn() } }))
const config: SandboxConfig = {
  provider_type: 'ssh',
  config: { host: 'owned.invalid', username: 'runner', port: 22 },
  configured_secrets: ['password'],
  active_provider_type: 'ssh',
  effective_provider_type: 'ssh',
  environment_overrides: [],
}
const schema: SandboxSchema = {
  host: { type: 'string', required: true },
  username: { type: 'string', required: true },
  port: { type: 'integer', default: 22, min: 1, max: 65535 },
  password: { type: 'string', secret: true },
  private_key: { type: 'string', secret: true, multiline: true },
  passphrase: { type: 'string', secret: true },
  known_hosts: { type: 'string', default: '' },
}
let root: Root
let container: HTMLDivElement
let client: QueryClient
const tick = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
}
const input = (name: string) =>
  container.querySelector<HTMLInputElement>(`#sandbox-${name}`)!
async function fill(name: string, value: string) {
  await act(async () => {
    const element = input(name)
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await changeLanguage('en-US')
  setAdminToken('owned.admin.jwt')
  vi.spyOn(adminAPI, 'listSandboxProviders').mockResolvedValue([
    { id: 'ssh', name: 'SSH', description: '', available: true },
  ])
  vi.spyOn(adminAPI, 'getSandboxConfig').mockImplementation(async () =>
    structuredClone(config),
  )
  vi.spyOn(adminAPI, 'getSandboxSchema').mockResolvedValue(schema)
  vi.spyOn(adminAPI, 'saveSandboxConfig').mockImplementation(
    async (_provider, values) => ({
      ...config,
      config: {
        host: values.host!,
        username: values.username!,
        port: values.port!,
      },
    }),
  )
  client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        staleTime: 0,
      },
    },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <SandboxPage />
        </MemoryRouter>
      </QueryClientProvider>,
    ),
  )
  await tick()
  await tick()
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps dirty credentials across a background refetch and clears them after explicit save', async () => {
  await fill('host', 'draft.invalid')
  await fill('password', 'owned-draft-secret')
  expect(input('password').value).toBe('owned-draft-secret')
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['admin', 'sandbox', 'config'] })
  })
  await tick()
  expect(input('host').value).toBe('draft.invalid')
  expect(input('password').value).toBe('owned-draft-secret')
  await act(async () =>
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  await tick()
  expect(adminAPI.saveSandboxConfig).toHaveBeenCalledWith(
    'ssh',
    expect.objectContaining({
      host: 'draft.invalid',
      password: 'owned-draft-secret',
      private_key: '',
      passphrase: '',
    }),
    true,
  )
  expect(input('password').value).toBe('')
  expect(input('host').value).toBe('draft.invalid')
})

it('omits readonly fields, keeps integer zero and clears only the unused SSH method', () => {
  const values = sandboxSubmitConfig(
    {
      max_artifacts: 0,
      local_enabled: true,
      password: '',
      private_key: 'owned-key',
    },
    {
      max_artifacts: { type: 'integer' },
      local_enabled: { type: 'boolean', readonly: true },
      ...schema,
    },
    'ssh',
    'private_key',
    [],
  )
  expect(values.max_artifacts).toBe(0)
  expect(values.password).toBe('')
  expect(values.private_key).toBe('owned-key')
  expect(values).not.toHaveProperty('local_enabled')
})
