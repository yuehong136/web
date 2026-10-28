import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DynamicForm, useFormInstance } from '@/components/dynamic-form'
import { AddDataSourceModal } from '@/pages/settings/datasource/components/add-datasource-modal'
import { getDataSourceFormFields } from '@/pages/settings/datasource/constants/form-fields'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
} from '@/pages/settings/datasource/constants/form-values'
import { deletionSyncSources } from '@/pages/settings/datasource/constants/sync-settings'
import { DataSourceKey } from '@/pages/settings/datasource/types'
import i18n from '@/locales/i18n'

const source = DataSourceKey.AZURE_BLOB
let root: Root
let container: HTMLDivElement
let form: ReturnType<typeof useFormInstance>
const submit = vi.fn()
const input = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
const click = async (element: HTMLElement) => act(async () => element.click())
const confirm = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent === i18n.t('common.confirm'),
  )!
const change = async (name: string, value: string) =>
  act(async () => {
    const element = input(name)
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  submit.mockReset().mockResolvedValue(undefined)
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  // Radix restores focus on the next task; finish that lifecycle in this DOM.
  await new Promise((resolve) => setTimeout(resolve, 0))
  container.remove()
  vi.unstubAllGlobals()
})

const renderForm = async (config: Record<string, unknown>) => {
  const save = (values: Record<string, unknown>) =>
    submit(prepareDataSourceValues(source, values))
  function Controls() {
    form = useFormInstance()
    return <DynamicForm.SavingButton submitLoading={false} submitFunc={save} />
  }
  await act(async () =>
    root.render(
      <DynamicForm.Root
        fields={getDataSourceFormFields((key) => i18n.t(key))[source]}
        defaultValues={getDataSourceDefaultValues(source, { config })}
        onSubmit={save}
      >
        <Controls />
      </DynamicForm.Root>,
    ),
  )
}

const modes = [
  {
    mode: 'account_key',
    credentials: {
      account_name: 'scratchaccount',
      account_key: 'synthetic-key',
      container_name: 'documents',
    },
    secret: 'account_key',
  },
  {
    mode: 'connection_string',
    credentials: {
      connection_string:
        'DefaultEndpointsProtocol=https;AccountName=scratchaccount;AccountKey=synthetic',
      container_name: 'documents',
    },
    secret: 'connection_string',
  },
  {
    mode: 'sas_token',
    credentials: {
      container_url: 'https://scratchaccount.blob.core.windows.net/documents',
      sas_token: 'sv=synthetic&sig=synthetic',
    },
    secret: 'sas_token',
  },
] as const

it.each(modes)(
  'validates only active $mode fields, masks secrets and submits active credentials',
  async ({ mode, credentials, secret }) => {
    await renderForm({ auth_mode: mode })
    await click(confirm())
    expect(submit).not.toHaveBeenCalled()
    for (const [key, value] of Object.entries(credentials)) {
      expect(
        input(`config.credentials.${key}`).getAttribute('aria-invalid'),
      ).toBe('true')
      await change(`config.credentials.${key}`, value)
    }
    expect(input(`config.credentials.${secret}`).type).toBe('password')
    await click(confirm())
    expect(submit).toHaveBeenCalledTimes(1)
    expect(submit.mock.lastCall![0].config).toEqual({
      auth_mode: mode,
      prefix: '',
      batch_size: 2,
      allow_images: false,
      sync_deleted_files: false,
      credentials,
    })
    expect(document.body.textContent).not.toContain('Sync source deletions')
    expect(document.body.textContent).not.toContain('Test connection')
    expect(deletionSyncSources.has(source)).toBe(false)
  },
)

it('drops stale credentials after changing auth mode and retains unrelated stored config exactly', () => {
  const config = {
    auth_mode: 'account_key',
    prefix: '/Docs 2026/',
    batch_size: 2,
    allow_images: false,
    future: { limit: 0, enabled: false },
    credentials: {
      ...modes[0].credentials,
      ...modes[1].credentials,
      ...modes[2].credentials,
      future_credential: 0,
    },
  }
  const values = getDataSourceDefaultValues(source, { config })
  values.config!.auth_mode = 'sas_token'
  const prepared = prepareDataSourceValues(source, values, config)
  expect(prepared.config).toMatchObject({
    prefix: '/Docs 2026/',
    allow_images: false,
    future: { limit: 0, enabled: false },
    credentials: { ...modes[2].credentials, future_credential: 0 },
  })
  expect(prepared.config!.credentials).toEqual({
    ...modes[2].credentials,
    future_credential: 0,
  })
  expect(config.credentials).toHaveProperty('account_key', 'synthetic-key')
  expect(config.auth_mode).toBe('account_key')
})

it('allows a switch away from invalid hidden fields and omits an empty batch size', async () => {
  await renderForm({ auth_mode: 'account_key' })
  await click(confirm())
  expect(submit).not.toHaveBeenCalled()
  await act(async () => form.setValue('config.auth_mode', 'sas_token'))
  expect(input('config.credentials.account_key')).toBeNull()
  for (const [key, value] of Object.entries(modes[2].credentials))
    await change(`config.credentials.${key}`, value)
  await change('config.batch_size', '')
  await click(confirm())
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.lastCall![0].config).not.toHaveProperty('batch_size')
})

it.each(['en-US', 'zh-CN'])(
  'shows localized batch and endpoint errors without submitting (%s)',
  async (locale) => {
    await i18n.changeLanguage(locale)
    await renderForm({
      auth_mode: 'sas_token',
      credentials: modes[2].credentials,
    })
    await change('config.batch_size', '0')
    await change(
      'config.credentials.container_url',
      'https://scratchaccount.blob.core.windows.net/documents?sig=synthetic',
    )
    await click(confirm())
    expect(submit).not.toHaveBeenCalled()
    for (const key of ['batchSizeInvalid', 'containerUrlInvalid']) {
      expect(document.body.textContent).toContain(
        i18n.t(`datasource.azureBlob.${key}`),
      )
      expect(document.body.textContent).not.toContain(
        `datasource.azureBlob.${key}`,
      )
    }
    await change('config.batch_size', '1')
    await change(
      'config.credentials.container_url',
      modes[2].credentials.container_url,
    )
    await click(confirm())
    expect(submit).toHaveBeenCalledTimes(1)
  },
)

it('validates batch bounds and only accepts official HTTPS container addresses', () => {
  const fields = getDataSourceFormFields((key) => key)[source]
  const validateBatch = fields.find(
    (field) => field.name === 'config.batch_size',
  )!.validate!
  for (const value of [1, 2, 1000, '', undefined])
    expect(validateBatch(value)).toBe(true)
  for (const value of [0, -1, 1001, 1.5, NaN, Infinity, true, '2'])
    expect(validateBatch(value)).toBe('datasource.azureBlob.batchSizeInvalid')
  const validateUrl = fields.find(
    (field) => field.name === 'config.credentials.container_url',
  )!.validate!
  for (const cloud of ['windows.net', 'chinacloudapi.cn', 'usgovcloudapi.net'])
    expect(
      validateUrl(`https://scratchaccount.blob.core.${cloud}/documents`),
    ).toBe(true)
  for (const value of [
    'http://scratchaccount.blob.core.windows.net/documents',
    'https://scratchaccount.blob.core.windows.net.evil.test/documents',
    'https://scratchaccount.blob.core.windows.net:444/documents',
    'https://scratchaccount.blob.core.windows.net:443/documents',
    'https://user:password@scratchaccount.blob.core.windows.net/documents',
    'https://scratchaccount.blob.core.windows.net/documents?sig=synthetic',
    'https://scratchaccount.blob.core.windows.net/documents#fragment',
    'https://scratchaccount.blob.core.windows.net/documents/folder',
    'https://scratchaccount.blob.core.windows.net/documents/',
    'https://scratchaccount.blob.core.windows.net/documents?',
    'https://scratchaccount.blob.core.windows.net/invalid--container',
  ])
    expect(validateUrl(value)).toBe('datasource.azureBlob.containerUrlInvalid')
})

it('adds an account-key source through the real modal without exposing unsupported actions', async () => {
  await act(async () =>
    root.render(
      <AddDataSourceModal
        visible
        loading={false}
        hideModal={() => {}}
        onOk={submit}
        sourceData={{
          id: source,
          name: 'Azure Blob Storage',
          description: 'Scratch',
          icon: null,
        }}
      />,
    ),
  )
  await click(confirm())
  expect(submit).not.toHaveBeenCalled()
  expect(input('name').getAttribute('aria-invalid')).toBe('true')
  await change('name', 'Azure scratch')
  for (const [key, value] of Object.entries(modes[0].credentials))
    await change(`config.credentials.${key}`, value)
  await change('config.prefix', '/Reports 2026/')
  await click(confirm())
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.lastCall![0]).toMatchObject({
    source: 'azure_blob',
    name: 'Azure scratch',
    config: { prefix: '/Reports 2026/', credentials: modes[0].credentials },
  })
  expect(document.body.textContent).not.toContain('Sync source deletions')
  expect(document.body.textContent).not.toContain('Test connection')
})
