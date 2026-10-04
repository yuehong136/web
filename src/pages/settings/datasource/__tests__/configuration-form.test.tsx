import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AddDataSourceModal } from '@/pages/settings/datasource/components/add-datasource-modal'
import { DynamicForm } from '@/components/dynamic-form'
import { getDataSourceFormFields } from '@/pages/settings/datasource/constants/form-fields'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
} from '@/pages/settings/datasource/constants/form-values'
import { DataSourceKey } from '@/pages/settings/datasource/types'
import i18n from '@/locales/i18n'

let root: Root
let container: HTMLDivElement
const submit = vi.fn()
const click = async (element: HTMLElement) => act(async () => element.click())
const button = (text: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent === text,
  )!
const input = (name: string) =>
  document.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
const change = async (element: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
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
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})
const renderAdd = async (source: DataSourceKey, loading = false) =>
  act(async () =>
    root.render(
      <AddDataSourceModal
        visible
        loading={loading}
        hideModal={() => {}}
        onOk={submit}
        sourceData={{
          id: source,
          name: source,
          description: 'Scratch',
          icon: null,
        }}
      />,
    ),
  )

it('defaults Gmail deletion sync off and preserves credentials when enabling and saving it', async () => {
  await renderAdd(DataSourceKey.GMAIL)
  await change(input('name'), 'Gmail scratch')
  await change(
    input('config.credentials.google_primary_admin'),
    'user@example.test',
  )
  const token = document.querySelector<HTMLTextAreaElement>(
    'textarea[name="config.credentials.google_tokens"]',
  )!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!.call(token, '{"token":"synthetic"}')
    token.dispatchEvent(new Event('input', { bubbles: true }))
  })
  const deletion = Array.from(document.querySelectorAll('label')).find(
    (label) => label.textContent === 'Sync source deletions',
  )!
  expect(deletion.control?.getAttribute('aria-checked')).toBe('false')
  await click(button('Confirm'))
  expect(submit.mock.calls[0][0].config.sync_deleted_files).toBe(false)
  await click(deletion)
  await click(button('Confirm'))
  expect(submit.mock.calls[1][0].config).toMatchObject({
    sync_deleted_files: true,
    credentials: {
      google_primary_admin: 'user@example.test',
      google_tokens: '{"token":"synthetic"}',
      authentication_method: 'uploaded',
    },
  })
})

it('blocks empty Jira credentials, validates only the selected mode and submits a boolean deletion setting', async () => {
  await renderAdd(DataSourceKey.JIRA)
  await click(button('Confirm'))
  expect(submit).not.toHaveBeenCalled()
  expect(input('name').getAttribute('aria-invalid')).toBe('true')
  await change(input('name'), 'Scratch')
  await change(input('config.base_url'), 'https://example.invalid')
  await click(button('Username and password'))
  await change(input('config.credentials.jira_username'), 'scratch-user')
  await click(button('Confirm'))
  expect(submit).not.toHaveBeenCalled()
  expect(
    input('config.credentials.jira_password').getAttribute('aria-invalid'),
  ).toBe('true')
  await change(input('config.credentials.jira_password'), 'scratch-password')
  const deletion = Array.from(document.querySelectorAll('label')).find(
    (label) => label.textContent === 'Sync source deletions',
  )!
  expect(deletion.control?.getAttribute('aria-checked')).toBe('false')
  await click(deletion)
  await click(button('Confirm'))
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0][0]).not.toHaveProperty('jiraAuthMode')
  expect(submit.mock.calls[0][0].config).toMatchObject({
    sync_deleted_files: true,
    credentials: {
      jira_username: 'scratch-user',
      jira_password: 'scratch-password',
    },
  })
  expect(submit.mock.calls[0][0].config.credentials).not.toHaveProperty(
    'jira_api_token',
  )
})

it('switches to token authentication without hidden password fields blocking submission and respects pending state', async () => {
  await renderAdd(DataSourceKey.JIRA)
  await change(input('name'), 'Scratch')
  await change(input('config.base_url'), 'https://example.invalid')
  await click(button('Username and password'))
  await click(button('API token'))
  await change(input('config.credentials.jira_api_token'), 'scratch-token')
  await click(button('Confirm'))
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0][0].config.sync_deleted_files).toBe(false)
  expect(submit.mock.calls[0][0].config.credentials).not.toHaveProperty(
    'jira_password',
  )
  await renderAdd(DataSourceKey.JIRA, true)
  expect(button('Processing...').disabled).toBe(true)
  await click(button('Processing...'))
  expect(submit).toHaveBeenCalledTimes(1)
})

it('preserves an unsupported historical deletion setting when saving without displaying a control', async () => {
  const source = DataSourceKey.GITLAB
  const detail = {
    config: {
      project_owner: 'scratch',
      project_name: 'scratch',
      sync_deleted_files: true,
      custom_option: 'preserve',
      credentials: {
        gitlab_access_token: 'saved',
        custom_credential: 'preserve',
      },
    },
  }
  const fields = getDataSourceFormFields((key) => i18n.t(key))[source]
  await act(async () =>
    root.render(
      <DynamicForm.Root
        fields={fields}
        defaultValues={getDataSourceDefaultValues(source, detail)}
        onSubmit={(values) => submit(prepareDataSourceValues(source, values))}
      >
        <DynamicForm.SavingButton
          submitLoading={false}
          buttonText="Save"
          submitFunc={(values) =>
            submit(prepareDataSourceValues(source, values))
          }
        />
      </DynamicForm.Root>,
    ),
  )
  expect(document.body.textContent).not.toContain('Sync source deletions')
  await click(button('Save'))
  expect(submit.mock.calls[0][0].config).toMatchObject(detail.config)
})

it('requires Bitbucket account email and submits backend credential keys with deletion sync', async () => {
  await renderAdd(DataSourceKey.BITBUCKET)
  await change(input('name'), 'Scratch')
  await change(input('config.workspace'), 'scratch-workspace')
  await change(input('config.credentials.bitbucket_api_token'), 'scratch-token')
  await click(button('Confirm'))
  expect(submit).not.toHaveBeenCalled()
  expect(
    input('config.credentials.bitbucket_account_email').getAttribute(
      'aria-invalid',
    ),
  ).toBe('true')
  await change(
    input('config.credentials.bitbucket_account_email'),
    'scratch@example.com',
  )
  const deletion = Array.from(document.querySelectorAll('label')).find(
    (label) => label.textContent === 'Sync source deletions',
  )!
  await click(deletion)
  await click(button('Confirm'))
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0][0].config).toMatchObject({
    sync_deleted_files: true,
    credentials: {
      bitbucket_account_email: 'scratch@example.com',
      bitbucket_api_token: 'scratch-token',
    },
  })
})
