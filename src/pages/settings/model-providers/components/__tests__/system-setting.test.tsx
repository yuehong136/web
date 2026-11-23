import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { SystemSetting } from '../system-setting'
import { modelProviderKeys } from '@/hooks/use-model-provider-request'
import { apiClient } from '@/api/client'
import type { SelectWithSearchProps } from '@/components/ui/select-with-search'
import i18n, { setProductLanguage } from '@/locales/i18n'
const fixtureId = (index: number) => index.toString(16).padStart(32, 'a')
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
            id: fixtureId(1),
            reference: fixtureId(1),
            name: 'same',
            instance_name: 'a',
            type: 'chat',
            used_token: 0,
            status: '1',
          },
          {
            id: fixtureId(2),
            reference: fixtureId(2),
            name: 'same',
            instance_name: 'b',
            type: 'chat',
            used_token: 0,
            status: '1',
          },
          {
            id: fixtureId(3),
            reference: fixtureId(3),
            name: 'ocr',
            type: 'ocr',
            used_token: 0,
            status: '1',
          },
          {
            id: fixtureId(4),
            reference: fixtureId(4),
            name: 'disabled',
            type: 'chat',
            used_token: 0,
            status: '0',
          },
          {
            id: fixtureId(5),
            reference: fixtureId(5),
            name: 'vision-only',
            type: 'image2text',
            used_token: 0,
            status: '1',
          },
          {
            id: fixtureId(6),
            reference: fixtureId(6),
            name: 'configured-embedding',
            type: 'embedding',
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
  model_id: string
  enable: boolean
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
    {
      model_type: 'chat',
      model_id: fixtureId(1),
      enable: true,
      model_name: 'same',
      model_provider: 'Provider',
      model_instance: 'a',
    },
  ]
  mocks.get.mockResolvedValue({
    tenant_id: 'owner-a',
    name: 'Fixture',
    llm_id: 'old-name@Provider',
    parser_ids: '',
  })
  mocks.defaults.mockImplementation(async () => defaults)
  mocks.update.mockImplementation(async (type: string, id: string) => {
    defaults = defaults.filter((row) => row.model_type !== type)
    if (id)
      defaults.push({
        model_type: type,
        model_id: id,
        enable: true,
        model_name: 'configured',
        model_provider: 'Provider',
        model_instance: 'default',
      })
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
it('uses opaque identities for two same-named instances, exposes OCR, and writes only changed capabilities after explicit save', async () => {
  await render()
  expect(select('chat').value).toBe(fixtureId(1))
  expect(select('chat').textContent).toContain('same · b')
  expect(container.textContent).not.toContain('disabled')
  expect(select('chat').textContent).not.toContain('vision-only')
  expect(select('ocr')).toBeTruthy()
  await choose('chat', fixtureId(2))
  await choose('ocr', fixtureId(3))
  expect(mocks.update).not.toHaveBeenCalled()
  await act(async () => {
    save().click()
    await settle()
  })
  await act(settle)
  expect(mocks.update.mock.calls).toEqual([
    ['chat', fixtureId(2)],
    ['ocr', fixtureId(3)],
  ])
  expect(select('chat').value).toBe(fixtureId(2))
  expect(mocks.success).toHaveBeenCalledOnce()
  await choose('ocr', '')
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenLastCalledWith('ocr', '')
})
it('keeps failed selections and does not expose server errors or credential values', async () => {
  await render()
  mocks.update.mockRejectedValueOnce(Error('private-secret'))
  await choose('chat', fixtureId(2))
  await act(async () => {
    save().click()
    await settle()
  })
  await act(settle)
  expect(select('chat').value).toBe(fixtureId(2))
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
  await choose('chat', fixtureId(2))
  await act(async () => {
    save().click()
    await settle()
  })
  apiClient.setAuthToken('owner-b')
  client.setQueryData(modelProviderKeys.defaults(), [
    { model_type: 'chat', model_id: fixtureId(10) },
  ])
  await act(async () => {
    finish()
    await settle()
  })
  expect(client.getQueryData(modelProviderKeys.defaults())).toEqual([
    { model_type: 'chat', model_id: fixtureId(10) },
  ])
  expect(mocks.success).not.toHaveBeenCalled()
})

it('saves and explicitly clears OCR independently when no chat default is configured', async () => {
  defaults = []
  await render()
  await choose('ocr', fixtureId(3))
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenCalledExactlyOnceWith('ocr', fixtureId(3))
})

it('clears the chat default explicitly without a prerequisite model', async () => {
  await render()
  await choose('chat', '')
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenCalledExactlyOnceWith('chat', '')
})

it('shows an unregistered built-in embedding default without creating a selectable identity or writing it back', async () => {
  defaults.push({
    model_type: 'embedding',
    model_id: '',
    enable: true,
    model_name: 'tei-model',
    model_provider: 'Builtin',
    model_instance: 'default',
  })
  await render()
  expect(container.textContent).toContain(
    i18n.t('settings.models.defaultsBuiltin', {
      model: 'tei-model',
      instance: 'default',
    }),
  )
  expect(select('embedding').value).toBe('')
  expect(select('embedding').textContent).not.toContain('tei-model')
  await choose('chat', fixtureId(2))
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update.mock.calls).toEqual([['chat', fixtureId(2)]])
  await choose('embedding', fixtureId(6))
  expect(container.textContent).not.toContain('tei-model')
  await act(async () => {
    save().click()
    await settle()
  })
  expect(mocks.update).toHaveBeenLastCalledWith('embedding', fixtureId(6))
})

it('flags missing and unavailable defaults as default-model rows with a warning', async () => {
  defaults = defaults.map((row) =>
    row.model_type === 'chat'
      ? { ...row, model_id: fixtureId(4), model_name: 'disabled' }
      : row,
  )
  await render()
  const row = (kind: string) =>
    [...container.querySelectorAll('[data-slot="default-model-row"]')].find(
      (element) =>
        element.textContent?.includes(
          i18n.t(`settings.models.defaultFields.${kind}.label`),
        ),
    )!
  expect(row('chat').textContent).toContain(
    i18n.t('settings.models.defaultUnavailableHint'),
  )
  expect(row('ocr').textContent).toContain(
    'Not set: text in scanned PDFs cannot be extracted.',
  )
  expect(row('ocr').querySelector('.text-status-warning')).toBeTruthy()
  await choose('ocr', fixtureId(3))
  expect(row('ocr').textContent).toContain(
    i18n.t('settings.models.defaultFields.ocr.hint'),
  )
  expect(row('ocr').querySelector('.text-status-warning')).toBeNull()
})
