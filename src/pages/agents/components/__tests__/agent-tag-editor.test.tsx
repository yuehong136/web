import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AgentTagEditor } from '../agent-tag-editor'
import { AgentCard } from '../agent-card'
import { agentQueryKeys } from '@/hooks/use-agent-query'
import type { AgentFlow } from '@/types/agent'

const api = vi.hoisted(() => ({
  listAgentTags: vi.fn(),
  updateAgentTags: vi.fn(),
}))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('@/api/agent', async (original) => ({
  ...(await original<typeof import('@/api/agent')>()),
  agentAPI: api,
}))
vi.mock('@/lib/toast', () => ({ toast }))
vi.mock('react-i18next', async (original) => ({
  ...(await original<typeof import('react-i18next')>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

const agent = {
  id: 'owner-agent',
  title: 'Agent',
  tags: 'ml',
  description: '',
  dsl: { components: {} },
  update_time: 1,
} as AgentFlow
let root: Root
let container: HTMLDivElement
let client: QueryClient
const click = async (label: string) => {
  const button = [
    ...document.querySelectorAll<HTMLElement>('button,[role="menuitem"]'),
  ].find((node) => node.textContent === label)
  expect(button, label).toBeTruthy()
  await act(async () => button!.click())
}
const type = async (text: string) => {
  const input = document.querySelector<HTMLInputElement>('input')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
beforeEach(() => {
  api.listAgentTags.mockResolvedValue([{ tag: 'data', count: 2 }])
  api.updateAgentTags.mockReset().mockResolvedValue(true)
  toast.error.mockReset()
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
})
async function renderEditor() {
  const closed = vi.fn()
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <AgentTagEditor agent={agent} onClose={closed} />
      </QueryClientProvider>,
    ),
  )
  return closed
}
it('saves the uncommitted draft and invalidates list, tags and detail', async () => {
  const invalidated = vi.spyOn(client, 'invalidateQueries')
  const closed = await renderEditor()
  await type('Draft')
  await click('common.save')
  expect(api.updateAgentTags).toHaveBeenCalledWith(agent.id, ['ml', 'Draft'])
  expect(closed).toHaveBeenCalledOnce()
  expect(invalidated.mock.calls.map(([arg]) => arg?.queryKey)).toEqual(
    expect.arrayContaining([
      agentQueryKeys.lists(),
      agentQueryKeys.tagCounts(),
      agentQueryKeys.detail(agent.id),
    ]),
  )
})
it('keeps the draft and editor open on rejection with safe feedback', async () => {
  api.updateAgentTags.mockRejectedValueOnce(new Error('private-sql-secret'))
  const closed = await renderEditor()
  await type('Draft')
  await click('common.save')
  expect(closed).not.toHaveBeenCalled()
  expect(document.querySelector('input')?.value).toBe('Draft')
  expect(toast.error).toHaveBeenCalledWith('agents.tagsSaveFailed')
  expect(document.body.textContent).not.toContain('private-sql-secret')
})
it('commits comma/Enter, dedupes and supports Backspace/removal', async () => {
  await renderEditor()
  await type('ML')
  await act(async () =>
    document
      .querySelector('input')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      ),
  )
  await type('data')
  await act(async () =>
    document
      .querySelector('input')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: ',', bubbles: true })),
  )
  await act(async () =>
    document
      .querySelector('input')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }),
      ),
  )
  await click('common.save')
  expect(api.updateAgentTags).toHaveBeenCalledWith(agent.id, ['ml'])
})
it('retains the editor when the card dropdown unmounts', async () => {
  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <AgentCard
          flow={agent}
          onOpen={vi.fn()}
          onDelete={vi.fn()}
          onEditTags={() => setOpen(true)}
        />
        {open && (
          <AgentTagEditor agent={agent} onClose={() => setOpen(false)} />
        )}
      </>
    )
  }
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    ),
  )
  const menu = container.querySelector<HTMLButtonElement>(
    'button[aria-label="agents.actionsFor"]',
  )!
  await act(async () =>
    menu.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    ),
  )
  await click('agents.editTags')
  expect(document.querySelector('input')).toBeTruthy()
  await type('AfterMenu')
  await click('common.save')
  expect(api.updateAgentTags).toHaveBeenCalledWith(agent.id, [
    'ml',
    'AfterMenu',
  ])
})
