import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SystemSetting } from '../system-setting'
import { teamKeys } from '@/hooks/use-team-request'
import { TenantRole, type TenantInfo } from '@/types/team'
import type { TenantModelSettings } from '@/api/auth'
import type { SelectWithSearchProps } from '@/components/ui/select-with-search'
import i18n, { setProductLanguage } from '@/locales/i18n'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  retryModels: vi.fn(),
}))
vi.mock('@/api/team', () => ({ teamAPI: { getTenantInfo: mocks.get } }))
vi.mock('@/api/auth', () => ({ authAPI: { updateTenantInfo: mocks.update } }))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: () => ({
    myLLMs: {
      Provider: {
        tags: '',
        llm: [
          { name: 'old-chat', type: 'chat', used_token: 0 },
          { name: 'new-chat', type: 'chat', used_token: 0 },
          { name: 'new-embed', type: 'embedding', used_token: 0 },
          { name: 'disabled-chat', type: 'chat', used_token: 0, status: '0' },
        ],
      },
    },
    isError: false,
    refetch: mocks.retryModels,
  }),
}))
vi.mock('@/components/ui/select-with-search', () => ({
  SelectWithSearch: (props: SelectWithSearchProps) => (
    <select
      aria-label={props.ariaLabel}
      value={props.value}
      disabled={props.disabled}
      onChange={(event) => props.onChange?.(event.target.value)}
    >
      <option value="">—</option>
      {props.options
        ?.flatMap((group) => group.options ?? [])
        .map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
    </select>
  ),
}))

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root
let container: HTMLDivElement
let client: QueryClient
let server: TenantInfo
const pause = () => new Promise((resolve) => setTimeout(resolve, 0))
const button = (key: string) =>
  [...container.querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === i18n.t(key),
  )!
const select = (kind: string) =>
  container.querySelector<HTMLSelectElement>(
    `select[aria-label="${i18n.t(`settings.models.defaultFields.${kind}.label`)}"]`,
  )!
const choose = async (kind: string, value: string) => {
  await act(async () => {
    select(kind).value = value
    select(kind).dispatchEvent(new Event('change', { bubbles: true }))
  })
}
const render = async () => {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <SystemSetting />
      </QueryClientProvider>,
    )
    await pause()
  })
  await act(async () => {
    await pause()
  })
}

beforeEach(async () => {
  await setProductLanguage('en-US')
  Object.values(mocks).forEach((mock) => mock.mockReset())
  server = {
    tenant_id: 'tenant-a',
    name: 'Fixture',
    role: TenantRole.Owner,
    llm_id: 'old-chat@Provider',
    embd_id: 'existing-embed@Hidden',
    img2txt_id: '',
    asr_id: '',
    rerank_id: '',
    tts_id: '',
    parser_ids: '',
  }
  mocks.get.mockImplementation(async () => server)
  mocks.update.mockImplementation(async (values: TenantModelSettings) => {
    server = { ...server, ...values }
    return true
  })
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
})

describe('default model settings', () => {
  it('collects multiple choices and saves one explicit complete snapshot', async () => {
    await render()
    expect(select('chat').value).toBe('old-chat@Provider')
    expect(select('embedding').value).toBe('existing-embed@Hidden')
    expect(container.textContent).not.toContain('disabled-chat')
    await choose('chat', 'new-chat@Provider')
    await choose('embedding', 'new-embed@Provider')
    expect(mocks.update).not.toHaveBeenCalled()
    await act(async () => {
      button('common.save').click()
      await pause()
    })
    expect(mocks.update).toHaveBeenCalledExactlyOnceWith({
      tenant_id: 'tenant-a',
      name: 'Fixture',
      llm_id: 'new-chat@Provider',
      embd_id: 'new-embed@Provider',
      img2txt_id: '',
      asr_id: '',
      rerank_id: '',
      tts_id: '',
    })
    expect(select('chat').value).toBe('new-chat@Provider')
    expect(mocks.success).toHaveBeenCalledWith(
      i18n.t('settings.models.defaultsSaved'),
    )
    expect(button('common.save').disabled).toBe(true)
  })

  it('keeps a failed draft, hides private errors and retries without automatic writes', async () => {
    await render()
    mocks.update.mockRejectedValueOnce(new Error('credential=private-secret'))
    await choose('chat', 'new-chat@Provider')
    await act(async () => {
      button('common.save').click()
      await pause()
    })
    expect(select('chat').value).toBe('new-chat@Provider')
    expect(client.getQueryData<TenantInfo>(teamKeys.tenantInfo())?.llm_id).toBe(
      'old-chat@Provider',
    )
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      i18n.t('settings.models.defaultsSaveFailed'),
    )
    expect(container.textContent).not.toContain('private-secret')
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain(
      'private-secret',
    )
    await act(async () => {
      await setProductLanguage('zh-CN')
    })
    expect(select('chat').value).toBe('new-chat@Provider')
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      i18n.t('settings.models.defaultsSaveFailed'),
    )
    await act(async () => {
      button('common.save').click()
      await pause()
    })
    expect(mocks.update).toHaveBeenCalledTimes(2)
    expect(select('chat').value).toBe('new-chat@Provider')
  })

  it('treats false acknowledgement as failure and prevents overlapping save snapshots', async () => {
    let finish!: (value: boolean) => void
    mocks.update.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await render()
    await choose('chat', 'new-chat@Provider')
    await act(async () => {
      button('common.save').click()
      button('common.save').click()
      await pause()
    })
    expect(mocks.update).toHaveBeenCalledOnce()
    expect(select('chat').disabled).toBe(true)
    expect(mocks.success).not.toHaveBeenCalled()
    await act(async () => {
      finish(false)
      await pause()
    })
    expect(select('chat').value).toBe('new-chat@Provider')
    expect(mocks.error).toHaveBeenCalledWith(
      i18n.t('settings.models.defaultsSaveFailed'),
    )
    expect(mocks.success).not.toHaveBeenCalled()
  })

  it('does not overwrite a new tenant cache or announce an old tenant save', async () => {
    let finish!: (value: boolean) => void
    mocks.update.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    await render()
    await choose('chat', 'new-chat@Provider')
    await act(async () => {
      button('common.save').click()
      await pause()
    })
    const next = {
      ...server,
      tenant_id: 'tenant-b',
      llm_id: 'old-chat@Provider',
    }
    await act(async () => {
      client.setQueryData(teamKeys.tenantInfo(), next)
      await pause()
    })
    await act(async () => {
      finish(true)
      await pause()
    })
    expect(
      client.getQueryData<TenantInfo>(teamKeys.tenantInfo())?.tenant_id,
    ).toBe('tenant-b')
    expect(select('chat').value).toBe('old-chat@Provider')
    expect(mocks.success).not.toHaveBeenCalled()
  })
})
