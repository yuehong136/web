import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import type { AgentSession } from '@/types/agent'
import { AgentLogStatus, type AgentLogParams } from '../../types'
import { SessionListPane, summarizeSessionPage } from '../session-list-pane'

const params: AgentLogParams = {
  canvas: 'canvas-1',
  status: AgentLogStatus.ALL,
  page: 1,
  pageSize: 12,
}
const sessions = [
  { id: 's1', status: 'success', update_time: 2000, round: 2 },
  { id: 's2', status: 'failed', update_time: 1000, round: 1 },
  { id: 's3', status: 'running', update_time: 500 },
] as AgentSession[]
let root: Root
let container: HTMLDivElement

beforeEach(async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  await changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

async function renderPane(
  overrides: Partial<Parameters<typeof SessionListPane>[0]> = {},
) {
  const onChange = vi.fn()
  await act(async () =>
    root.render(
      <SessionListPane
        params={params}
        pageSessions={sessions}
        sessions={sessions}
        total={40}
        isLoading={false}
        isError={false}
        isFiltered={false}
        onChange={onChange}
        onRetry={vi.fn()}
        onOpenExplore={vi.fn()}
        {...overrides}
      />,
    ),
  )
  return onChange
}

it('summarises only the current server page', () => {
  expect(summarizeSessionPage(sessions)).toEqual({ ok: 1, err: 1, run: 1 })
})

it('labels page-scoped counts and pages with the shared pager over the server total', async () => {
  const onChange = await renderPane()
  expect(container.querySelectorAll('li')).toHaveLength(3)
  expect(container.textContent).toContain(
    'This page: 1 succeeded · 1 failed · 1 running',
  )
  expect(container.textContent).toContain('1–12 / 40')
  await act(async () =>
    container
      .querySelector<HTMLButtonElement>('button[aria-label="Next"]')!
      .click(),
  )
  expect(onChange).toHaveBeenCalledWith({ page: 2 })
  await act(async () =>
    container.querySelector<HTMLButtonElement>('li button')!.click(),
  )
  expect(onChange).toHaveBeenCalledWith({ sessionId: 's1' })
})

it('keeps the pager when a page-scoped filter leaves no rows', async () => {
  await renderPane({ sessions: [], isFiltered: true })
  expect(container.textContent).toContain('No runs yet')
  expect(container.textContent).toContain('Status filters apply to this page.')
  expect(container.textContent).toContain('1–12 / 40')
})
