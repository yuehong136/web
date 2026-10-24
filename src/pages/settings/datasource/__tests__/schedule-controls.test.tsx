import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DynamicForm } from '@/components/dynamic-form'
import i18n from '@/locales/i18n'
import {
  DataSourceActions,
  getScheduleFields,
} from '../detail/schedule-controls'
import { getLogSummary, getTaskCountdownSeconds } from '../detail/logs-table'
import {
  DataSourceKey,
  DataSourceStatus,
  FormFieldType,
  type IDataSourceLog,
} from '../types'

let root: Root
let container: HTMLDivElement
const save = vi.fn()
const status = vi.fn()

function Harness({
  state = DataSourceStatus.SCHEDULED,
}: {
  state?: DataSourceStatus
}) {
  const [saved, setSaved] = useState<Record<string, unknown>>()
  const submit = async (values: Record<string, unknown>) => {
    const success = await save(values)
    if (success) setSaved(values)
    return success
  }
  return (
    <DynamicForm.Root
      fields={[
        {
          name: 'config.sync_deleted_files',
          label: 'Delete source files',
          type: FormFieldType.Checkbox,
        },
        ...getScheduleFields(DataSourceKey.WEBDAV, i18n.t),
      ]}
      defaultValues={{
        refresh_freq: 5,
        prune_freq: 17,
        timeout_secs: 30,
        config: { sync_deleted_files: false },
      }}
      onSubmit={submit}
    >
      <DataSourceActions
        status={state}
        savedValues={saved}
        busy={false}
        onSave={submit}
        onStatus={status}
      />
    </DynamicForm.Root>
  )
}

const button = () =>
  container.querySelector<HTMLButtonElement>('button:not([role="checkbox"])')!
const input = (name: string) =>
  container.querySelector<HTMLInputElement>(`input[name="${name}"]`)!
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
  await i18n.changeLanguage('en-US')
  save.mockReset().mockResolvedValue(true)
  status.mockReset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('shows Save for an unstarted source and status actions for a clean active or paused form', async () => {
  await act(async () =>
    root.render(<Harness state={DataSourceStatus.PENDING} />),
  )
  expect(button().textContent).toBe('Save')
  await act(async () =>
    root.render(<Harness state={DataSourceStatus.SCHEDULED} />),
  )
  expect(button().textContent).toBe('Stop')
  await act(async () => button().click())
  expect(status).toHaveBeenLastCalledWith('2')
  await act(async () =>
    root.render(<Harness state={DataSourceStatus.PAUSED} />),
  )
  expect(button().textContent).toBe('Resume')
  await act(async () => button().click())
  expect(status).toHaveBeenLastCalledWith('5')
  expect(save).not.toHaveBeenCalled()
})

it('retains dirty values on failure and resets them after a successful keyboard save', async () => {
  await act(async () => root.render(<Harness />))
  await change(input('refresh_freq'), '7')
  expect(button().textContent).toBe('Save')
  save.mockResolvedValueOnce(false)
  await act(async () => button().click())
  expect(button().textContent).toBe('Save')
  expect(input('refresh_freq').value).toBe('7')
  await act(async () =>
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(save).toHaveBeenCalledTimes(2)
  expect(button().textContent).toBe('Stop')
  expect(status).not.toHaveBeenCalled()
})

it('shows the prune interval only for the enabled boolean switch and validates whole-number intervals', async () => {
  await act(async () => root.render(<Harness />))
  expect(input('prune_freq')).toBeNull()
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[role="checkbox"]')!.click(),
  )
  expect(input('prune_freq')).toBeTruthy()
  await change(input('prune_freq'), '1.5')
  await act(async () => button().click())
  expect(save).not.toHaveBeenCalled()
  expect(input('prune_freq').getAttribute('aria-invalid')).toBe('true')
  await change(input('prune_freq'), '0')
  await act(async () => button().click())
  expect(save.mock.calls[0][0].prune_freq).toBe(0)
})

it('uses the task-specific frequency and scheduling timestamp for countdowns and summaries', () => {
  const now = Date.parse('2026-10-24T00:00:00Z')
  const log = {
    update_date: '2026-10-24T00:00:00Z',
    time_started: null,
    refresh_freq: 5,
    prune_freq: 17,
    status: DataSourceStatus.SCHEDULED,
  } as IDataSourceLog
  expect(getTaskCountdownSeconds({ ...log, task_type: 'sync' }, now)).toBe(300)
  expect(getTaskCountdownSeconds({ ...log, task_type: 'prune' }, now)).toBe(
    1020,
  )
  expect(
    getTaskCountdownSeconds(
      { ...log, update_date: '1970-01-01T00:00:00Z' },
      now,
    ),
  ).toBe(0)
  expect(
    getTaskCountdownSeconds({ ...log, update_date: 'invalid' }, now),
  ).toBeNull()
  expect(
    getLogSummary(
      i18n.t,
      {
        ...log,
        task_type: 'prune',
        status: DataSourceStatus.COMPLETED,
        docs_removed_from_index: 2,
        error_count: 0,
      },
      now,
    ),
  ).toBe('Removed 2 documents · 0 errors')
})
