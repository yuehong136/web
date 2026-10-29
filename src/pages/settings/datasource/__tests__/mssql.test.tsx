import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AddDataSourceModal } from '@/pages/settings/datasource/components/add-datasource-modal'
import {
  DataSourceGroups,
  generateDataSourceInfo,
} from '@/pages/settings/datasource/constants'
import { getDataSourceFormFields } from '@/pages/settings/datasource/constants/form-fields'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
} from '@/pages/settings/datasource/constants/form-values'
import { deletionSyncSources } from '@/pages/settings/datasource/constants/sync-settings'
import { DataSourceKey, FormFieldType } from '@/pages/settings/datasource/types'
import i18n, { setProductLanguage } from '@/locales/i18n'

const query =
  'SELECT TOP (20) id, body, updated_at FROM dbo.records WHERE active = 1 ORDER BY updated_at DESC'
const t = (key: string) => key

describe('SQL Server connector configuration', () => {
  it('registers the MSSQL source in the existing gallery and database form contract', () => {
    expect(DataSourceKey.MSSQL).toBe('mssql')
    expect(DataSourceGroups.database).toContain(DataSourceKey.MSSQL)
    expect(generateDataSourceInfo(t)[DataSourceKey.MSSQL]).toMatchObject({
      name: 'Microsoft SQL Server',
      description: 'datasource.mssqlDescription',
    })
    const defaults = getDataSourceDefaultValues(DataSourceKey.MSSQL)
    expect(defaults).toMatchObject({
      source: 'mssql',
      config: {
        host: 'localhost',
        port: 1433,
        query: '',
        sync_deleted_files: false,
        credentials: { username: '', password: '' },
      },
    })
    expect(deletionSyncSources.has(DataSourceKey.MSSQL)).toBe(true)
    const fields = getDataSourceFormFields(t)[DataSourceKey.MSSQL]
    expect(
      fields.filter((field) => field.required).map((field) => field.name),
    ).toEqual([
      'config.host',
      'config.port',
      'config.database',
      'config.credentials.username',
      'config.credentials.password',
      'config.query',
    ])
    expect(
      fields.find((field) => field.name === 'config.credentials.password')
        ?.type,
    ).toBe(FormFieldType.Password)
    expect(
      fields.find((field) => field.name === 'config.timestamp_column')?.tooltip,
    ).toBe('datasource.mssqlTimestampColumnTip')
    expect(fields.find((field) => field.name === 'config.query')).toMatchObject(
      {
        required: true,
        tooltip: 'datasource.mssqlQueryTip',
        placeholder: 'SELECT id, body FROM dbo.records',
      },
    )
  })

  it.each([DataSourceKey.MYSQL, DataSourceKey.POSTGRESQL, DataSourceKey.MSSQL])(
    'rejects invalid TCP ports for %s before submission',
    (source) => {
      const port = getDataSourceFormFields(t)[source].find(
        (field) => field.name === 'config.port',
      )!
      for (const value of [1, 1433, 65535, '1433'])
        expect(port.validate?.(value)).toBe(true)
      for (const value of [0, -1, 65536, 1.5, Infinity, NaN, '', 'abc', null])
        expect(port.validate?.(value)).toBe('datasource.invalidDatabasePort')
      expect(
        getDataSourceFormFields(t)[source].find(
          (field) => field.name === 'config.query',
        )?.required,
      ).toBe(source === DataSourceKey.MSSQL)
    },
  )

  it('preserves the SQL selection, column mapping and stored extensions when editing', () => {
    const config = {
      host: 'sql.example.test',
      port: 51433,
      database: 'records',
      query,
      content_columns: 'body,title',
      metadata_columns: 'category',
      id_column: 'id',
      timestamp_column: 'updated_at',
      sync_deleted_files: true,
      future: { limit: 0 },
      credentials: {
        username: 'reader',
        password: 'stored-test-credential',
        extension: false,
      },
    }
    const before = structuredClone(config)
    const values = getDataSourceDefaultValues(DataSourceKey.MSSQL, {
      config,
    })
    expect(
      prepareDataSourceValues(DataSourceKey.MSSQL, values, config).config,
    ).toEqual(config)
    expect(config).toEqual(before)
  })
})

let root: Root
let container: HTMLDivElement
const submit = vi.fn()
const input = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
const changeInput = async (name: string, value: string) =>
  act(async () => {
    const element = input(name)
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
const confirm = async () =>
  act(async () => {
    Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
      .find((element) => element.textContent === i18n.t('common.confirm'))!
      .click()
  })
const renderModal = async () => {
  const info = generateDataSourceInfo((key) => String(i18n.t(key)))[
    DataSourceKey.MSSQL
  ]
  await act(async () =>
    root.render(
      <AddDataSourceModal
        visible
        loading={false}
        hideModal={() => {}}
        onOk={submit}
        sourceData={{ id: DataSourceKey.MSSQL, ...info }}
      />,
    ),
  )
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
  submit.mockReset().mockResolvedValue(undefined)
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it.each(['en-US', 'zh-CN'] as const)(
  'renders a localized MSSQL form with a masked password in %s',
  async (locale) => {
    await setProductLanguage(locale)
    await renderModal()
    expect(document.body.textContent).toContain('Microsoft SQL Server')
    expect(document.body.textContent).toContain(
      i18n.t('datasource.mssqlDescription'),
    )
    expect(document.body.textContent).not.toContain('datasource.mssql')
    expect(input('config.port').value).toBe('1433')
    expect(input('config.credentials.password').type).toBe('password')
    expect(input('config.database').labels?.[0].textContent).toContain(
      i18n.t('datasource.fieldDatabase'),
    )
  },
)

it('submits through the real modal only after required fields and port are valid', async () => {
  await renderModal()
  await changeInput('name', 'SQL Server scratch')
  await confirm()
  expect(submit).not.toHaveBeenCalled()
  expect(input('config.database').getAttribute('aria-invalid')).toBe('true')
  await changeInput('config.database', 'records')
  await changeInput('config.credentials.username', 'reader')
  await changeInput('config.credentials.password', 'synthetic-password')
  await changeInput('config.port', '0')
  await confirm()
  expect(submit).not.toHaveBeenCalled()
  expect(input('config.port').getAttribute('aria-invalid')).toBe('true')
  expect(document.body.textContent).toContain(
    i18n.t('datasource.invalidDatabasePort'),
  )
  await changeInput('config.port', '1433')
  await confirm()
  expect(submit).not.toHaveBeenCalled()
  expect(
    document
      .querySelector('textarea[name="config.query"]')
      ?.getAttribute('aria-invalid'),
  ).toBe('true')
  await act(async () => {
    const element = document.querySelector<HTMLTextAreaElement>(
      'textarea[name="config.query"]',
    )!
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!.call(element, query)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await confirm()
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0][0]).toMatchObject({
    name: 'SQL Server scratch',
    source: 'mssql',
    config: {
      port: 1433,
      database: 'records',
      query,
      sync_deleted_files: false,
      credentials: { username: 'reader', password: 'synthetic-password' },
    },
  })
  expect(document.body.textContent).not.toContain('synthetic-password')
})
