import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DynamicForm, useFormInstance } from '@/components/dynamic-form'
import { AddDataSourceModal } from '../components/add-datasource-modal'
import { getDataSourceFormFields } from '../constants/form-fields'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
} from '../constants/form-values'
import { deletionSyncSources } from '../constants/sync-settings'
import { DataSourceKey } from '../types'
import i18n from '@/locales/i18n'

const source = DataSourceKey.SALESFORCE
const credentials = {
  instance_url: 'https://scratch.my.salesforce.com',
  client_id: 'synthetic-client',
  client_secret: 'synthetic-secret',
}
let root: Root
let container: HTMLDivElement
let form: ReturnType<typeof useFormInstance>
const submit = vi.fn()
const input = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
const confirm = () =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (button) => button.textContent === i18n.t('common.confirm'),
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
const save = () => act(async () => confirm().click())

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
  await new Promise((resolve) => setTimeout(resolve, 0))
  container.remove()
  vi.unstubAllGlobals()
})

async function renderForm(config: Record<string, unknown> = {}) {
  function Controls() {
    form = useFormInstance()
    return (
      <DynamicForm.SavingButton
        submitLoading={false}
        submitFunc={(values) => submit(prepareDataSourceValues(source, values))}
      />
    )
  }
  await act(async () =>
    root.render(
      <DynamicForm.Root
        fields={getDataSourceFormFields((key) => i18n.t(key))[source]}
        defaultValues={getDataSourceDefaultValues(source, {
          config: { credentials, ...config },
        })}
        onSubmit={submit}
      >
        <Controls />
      </DynamicForm.Root>,
    ),
  )
}

it('keeps default, empty and selected object scope distinct across edit and save', async () => {
  for (const [objects, scope, expected] of [
    [undefined, 'default', undefined],
    [null, 'default', undefined],
    [[], 'none', []],
    ['', 'none', []],
    [['Account', 'Custom__c'], 'selected', ['Account', 'Custom__c']],
  ] as const) {
    const values = getDataSourceDefaultValues(source, { config: { objects } })
    expect(values.salesforceObjectScope).toBe(scope)
    expect(prepareDataSourceValues(source, values).config!.objects).toEqual(
      expected,
    )
  }
  await renderForm({ objects: ['Account'] })
  await act(async () => form.setValue('salesforceObjectScope', 'none'))
  expect(input('config.objects')).toBeNull()
  await save()
  expect(submit.mock.lastCall![0].config.objects).toEqual([])
  await act(async () => form.setValue('salesforceObjectScope', 'default'))
  await save()
  expect(submit.mock.lastCall![0].config).not.toHaveProperty('objects')
  expect(submit.mock.lastCall![0]).not.toHaveProperty('salesforceObjectScope')
})

it('discards stale credentials and unsupported deletion sync while retaining unrelated configuration', () => {
  const config = {
    credentials: { ...credentials, access_token: 'stale', username: 'old' },
    future: { limit: 0 },
    sync_deleted_files: true,
  }
  const prepared = prepareDataSourceValues(
    source,
    getDataSourceDefaultValues(source, { config }),
  )
  expect(prepared.config).toMatchObject({
    credentials,
    future: { limit: 0 },
    sync_deleted_files: false,
  })
  expect(prepared.config!.credentials).toEqual(credentials)
  expect(config.credentials.access_token).toBe('stale')
  expect(deletionSyncSources.has(source)).toBe(false)
})

it.each(['en-US', 'zh-CN'])(
  'validates the actual form before submission with localized errors (%s)',
  async (locale) => {
    await i18n.changeLanguage(locale)
    await renderForm({ objects: ['Account'] })
    expect(input('config.credentials.client_secret').type).toBe('password')
    await change('config.credentials.instance_url', 'https://example.test')
    await change('config.objects', 'Account, invalid object')
    await change('config.api_version', 'latest')
    await change('config.batch_size', '0')
    await save()
    expect(submit).not.toHaveBeenCalled()
    for (const key of [
      'instanceUrlInvalid',
      'objectsInvalid',
      'apiVersionInvalid',
      'batchSizeInvalid',
    ])
      expect(document.body.textContent).toContain(
        i18n.t(`datasource.salesforce.${key}`),
      )
    await change('config.credentials.instance_url', credentials.instance_url)
    await change('config.objects', 'Account, Custom__c')
    await change('config.api_version', '')
    await change('config.batch_size', '')
    await save()
    expect(submit).toHaveBeenCalledTimes(1)
    expect(submit.mock.lastCall![0].config).toEqual({
      objects: ['Account', 'Custom__c'],
      credentials,
      sync_deleted_files: false,
    })
  },
)

it('accepts only canonical HTTPS Salesforce org origins and bounded integer batches', () => {
  const fields = getDataSourceFormFields((key) => key)[source]
  const url = fields.find(
    (field) => field.name === 'config.credentials.instance_url',
  )!.validate!
  expect(url(credentials.instance_url)).toBe(true)
  for (const value of [
    'http://scratch.salesforce.com',
    'https://salesforce.com',
    'https://scratch.salesforce.com.evil.test',
    'https://scratch.salesforce.com/',
    'https://scratch.salesforce.com:443',
    'https://scratch.salesforce.com:444',
    'https://u:p@scratch.salesforce.com',
    'https://scratch.salesforce.com?x=y',
    'https://scratch.salesforce.com#x',
  ])
    expect(url(value)).toBe('datasource.salesforce.instanceUrlInvalid')
  const batch = fields.find(
    (field) => field.name === 'config.batch_size',
  )!.validate!
  for (const value of [1, 1000, '', undefined]) expect(batch(value)).toBe(true)
  for (const value of [0, 1001, 1.5, Infinity, '2', true])
    expect(batch(value)).toBe('datasource.salesforce.batchSizeInvalid')
  const version = fields.find(
    (field) => field.name === 'config.api_version',
  )!.validate!
  for (const value of ['v59.0', 'v1.0', '', undefined])
    expect(version(value)).toBe(true)
  for (const value of ['v0.0', 'v059.0', '59.0', 'v59', 'latest'])
    expect(version(value)).toBe('datasource.salesforce.apiVersionInvalid')
})

it('creates through the real modal without a connection test or deletion toggle and keeps a failed draft open', async () => {
  submit.mockRejectedValue(new Error('untrusted-response'))
  await act(async () =>
    root.render(
      <AddDataSourceModal
        visible
        loading={false}
        hideModal={() => {}}
        onOk={submit}
        sourceData={{
          id: source,
          name: 'Salesforce',
          description: 'Scratch',
          icon: null,
        }}
      />,
    ),
  )
  await save()
  expect(submit).not.toHaveBeenCalled()
  await change('name', 'Salesforce scratch')
  for (const [key, value] of Object.entries(credentials))
    await change(`config.credentials.${key}`, value)
  await save()
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.lastCall![0].config).not.toHaveProperty('objects')
  expect(input('name').value).toBe('Salesforce scratch')
  expect(document.body.textContent).not.toContain('untrusted-response')
  expect(document.body.textContent).not.toContain('Test connection')
  expect(document.body.textContent).not.toContain('Sync source deletions')
})
