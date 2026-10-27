import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SystemSetting } from '../system-setting'
import { modelProviderKeys } from '@/hooks/use-model-provider-request'
import { apiClient } from '@/api/client'
import type { SelectWithSearchProps } from '@/components/ui/select-with-search'
import i18n, { setProductLanguage } from '@/locales/i18n'
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  defaults: vi.fn(),
  update: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))
vi.mock('@/api/team', () => ({ teamAPI: { getTenantInfo: mocks.get } }))
vi.mock('@/api/llm-providers', () => ({
  modelProvidersAPI: { defaults: mocks.defaults, setDefault: mocks.update },
}))
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))
vi.mock('@/hooks/use-llm-request', () => ({
  llmKeys: { all: ['llm'] },
  useFetchMyLLMs: () => ({
    myLLMs: {
      Provider: {
        tags: '',
        llm: [
          {
            id: '1',
            reference: '1',
            name: 'same',
            instance_name: 'a',
            type: 'chat',
            used_token: 0,
            status: '1',
          },
          {
            id: '2',
            reference: '2',
            name: 'same',
            instance_name: 'b',
            type: 'chat',
            used_token: 0,
            status: '1',
          },
          {
            id: '3',
            reference: '3',
            name: 'ocr',
            type: 'ocr',
            used_token: 0,
            status: '1',
          },
          {
            id: '4',
            reference: '4',
            name: 'disabled',
            type: 'chat',
            used_token: 0,
            status: '0',
          },
          {
            id: '5',
            reference: '5',
            name: 'vision-only',
            type: 'image2text',
            used_token: 0,
            status: '1',
          },
        ],
      },
    },
    isError: false,
    refetch: vi.fn(),
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
let root: Root, container: HTMLDivElement, client: QueryClient
let defaults: {
  model_type: string
  model_id: number | null
  reference: string
  model_name: string
  model_provider: string
  model_instance: string
}[]
const settle = () => new Promise((resolve) => setTimeout(resolve, 10))
const select = (kind: string) =>
  container.querySelector<HTMLSelectElement>(
    `select[aria-label="${i18n.t(`settings.models.defaultFields.${kind}.label`)}"]`,
  )!
const save = () =>
  [...container.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === i18n.t('common.save'),
  )!
const choose = async (kind: string, value: string) =>
  act(async () => {
    select(kind).value = value
    select(kind).dispatchEvent(new Event('change', { bubbles: true }))
  })
const render = async () => {
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <SystemSetting />
      </QueryClientProvider>,
    )
    await settle()
  })
  await act(settle)
}
beforeEach(async () => {
  Object.values(mocks).forEach((mock) => mock.mockReset())
  apiClient.setAuthToken('owner-a')
  await setProductLanguage('en-US')
  defaults = [
    'chat',
    'embedding',
    'image2text',
    'speech2text',
    'rerank',
    'tts',
    'ocr',
  ].map((model_type) => ({
    model_type,
    model_id: model_type === 'chat' ? 1 : null,
    reference: model_type === 'chat' ? '1' : '',
    model_name: model_type === 'chat' ? 'same' : '',
    model_provider: model_type === 'chat' ? 'Provider' : '',
    model_instance: model_type === 'chat' ? 'a' : '',
  }))
  mocks.get.mockResolvedValue({
    tenant_id: 'owner-a',
    name: 'Fixture',
    llm_id: 'old-name@Provider',
    parser_ids: '',
  })
  mocks.defaults.mockImplementation(async () => defaults)
  mocks.update.mockImplementation(async (type: string, id: number | null) => {
    defaults = defaults.map((row) =>
      row.model_type === type
        ? { ...row, model_id: id, reference: id ? String(id) : '' }
        : row,
    )
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
  container.remove()
  client.clear()
  apiClient.setAuthToken(null)
  vi.restoreAllMocks()
})
it('uses numeric identities for two same-named instances, exposes OCR, and writes only changed capabilities after explicit save', async () => {
  await render()
  expect(select('chat').value).toBe('1')
  expect(select('chat').textContent).toContain('same · b')
  expect(container.textContent).not.toContain('disabled')
  expect(select('chat').textContent).not.toContain('vision-only')
  expect(select('ocr')).toBeTruthy()
  await choose('chat', '2')
  await choose('ocr', '3')
  expect(mocks.update).not.toHaveBeenCalled()
  await act(async () => {
    save().click()
    await settle()
  })
  await act(settle)
  expect(mocks.update.mock.calls).toEqual([
    ['chat', 2],
    ['ocr', 3],
  ])
  expect(select('chat').value).toBe('2')
  expect(mocks.success).toHaveBeenCalledOnce()
  await choose('ocr', '')
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenLastCalledWith('ocr', null)
})
it('keeps failed selections and does not expose server errors or credential values', async () => {
  await render()
  mocks.update.mockRejectedValueOnce(Error('private-secret'))
  await choose('chat', '2')
  await act(async () => {
    save().click()
    await settle()
  })
  await act(settle)
  expect(select('chat').value).toBe('2')
  expect(container.textContent).toContain(
    i18n.t('settings.models.defaultsSaveFailed'),
  )
  expect(container.textContent).not.toContain('private-secret')
  expect(mocks.success).not.toHaveBeenCalled()
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenCalledTimes(2)
})
it('withholds defaults on a failed inventory instead of saving empty fields', async () => {
  mocks.defaults.mockRejectedValue(Error('unavailable'))
  await render()
  expect(container.querySelector('form')).toBeNull()
  expect(container.textContent).toContain(
    i18n.t('settings.models.defaultsLoadFailed'),
  )
  expect(mocks.update).not.toHaveBeenCalled()
})
it('rejects an old account continuation before touching the next account cache', async () => {
  let finish!: () => void
  mocks.update.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve
      }),
  )
  await render()
  await choose('chat', '2')
  await act(async () => {
    save().click()
    await settle()
  })
  apiClient.setAuthToken('owner-b')
  client.setQueryData(modelProviderKeys.defaults(), [
    { model_type: 'chat', reference: 'other-account' },
  ])
  await act(async () => {
    finish()
    await settle()
  })
  expect(client.getQueryData(modelProviderKeys.defaults())).toEqual([
    { model_type: 'chat', reference: 'other-account' },
  ])
  expect(mocks.success).not.toHaveBeenCalled()
})

it('saves and explicitly clears OCR independently when no chat default is configured', async () => {
  defaults = defaults.map((row) => ({ ...row, reference: '', model_id: null }))
  await render()
  await choose('ocr', '3')
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenCalledExactlyOnceWith('ocr', 3)
})

it('clears the chat default explicitly without a prerequisite model', async () => {
  await render()
  await choose('chat', '')
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenCalledExactlyOnceWith('chat', null)
})
