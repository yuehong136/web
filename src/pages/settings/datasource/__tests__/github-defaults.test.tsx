import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DynamicForm } from '@/components/dynamic-form'
import { AddDataSourceModal } from '../components/add-datasource-modal'
import { getDataSourceFormFields } from '../constants/form-fields'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
} from '../constants/form-values'
import { DataSourceKey } from '../types'
import i18n from '@/locales/i18n'

let root: Root
let container: HTMLDivElement
const submit = vi.fn()
const source = DataSourceKey.GITHUB
const click = async (element: HTMLElement) => act(async () => element.click())
const button = (name: string) =>
  Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find(
    (element) => element.textContent === name,
  )!
const label = (name: string) =>
  Array.from(document.querySelectorAll('label')).find(
    (element) => element.textContent === name,
  )!
const change = async (name: string, value: string) =>
  act(async () => {
    const element = document.querySelector<HTMLInputElement>(
      `input[name="${name}"]`,
    )!
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

it('creates a GitHub source with both kinds enabled and submits explicit opt-outs', async () => {
  await act(async () =>
    root.render(
      <AddDataSourceModal
        visible
        loading={false}
        hideModal={() => {}}
        onOk={submit}
        sourceData={{ id: source, name: 'GitHub', description: '', icon: null }}
      />,
    ),
  )
  await change('name', 'GitHub scratch')
  await change('config.repository_owner', 'fixture')
  await change('config.repository_name', 'project')
  await change('config.credentials.github_access_token', 'synthetic')
  for (const name of ['Include Pull Requests', 'Include Issues']) {
    expect(label(name).control?.getAttribute('aria-checked')).toBe('true')
  }
  await click(button('Confirm'))
  expect(submit.mock.calls[0][0].config).toMatchObject({
    include_pull_requests: true,
    include_issues: true,
  })
  await click(label('Include Pull Requests'))
  await click(label('Include Issues'))
  await click(button('Confirm'))
  expect(submit.mock.calls[1][0].config).toMatchObject({
    include_pull_requests: false,
    include_issues: false,
    credentials: { github_access_token: 'synthetic' },
  })
})

it.each([
  [{}, true, true],
  [{ include_pull_requests: false, include_issues: false }, false, false],
  [{ include_pull_requests: true, include_issues: false }, true, false],
  [{ include_pull_requests: false }, false, true],
] as const)(
  'edits saved options %o without losing explicit false or unknown fields',
  async (options, pullRequests, issues) => {
    const config = {
      repository_owner: 'fixture',
      repository_name: 'project',
      custom: 'preserve',
      credentials: { github_access_token: 'saved', custom: 'preserve' },
      ...options,
    }
    const before = structuredClone(config)
    const values = getDataSourceDefaultValues(source, { config })
    await act(async () =>
      root.render(
        <DynamicForm.Root
          fields={getDataSourceFormFields((key) => i18n.t(key))[source]}
          defaultValues={values}
          onSubmit={(data) => submit(prepareDataSourceValues(source, data))}
        >
          <DynamicForm.SavingButton
            submitLoading={false}
            buttonText="Save"
            submitFunc={(data) => submit(prepareDataSourceValues(source, data))}
          />
        </DynamicForm.Root>,
      ),
    )
    expect(
      label('Include Pull Requests').control?.getAttribute('aria-checked'),
    ).toBe(String(pullRequests))
    expect(label('Include Issues').control?.getAttribute('aria-checked')).toBe(
      String(issues),
    )
    await click(button('Save'))
    expect(submit.mock.calls[0][0].config).toMatchObject({
      ...config,
      include_pull_requests: pullRequests,
      include_issues: issues,
    })
    expect(config).toEqual(before)
  },
)
