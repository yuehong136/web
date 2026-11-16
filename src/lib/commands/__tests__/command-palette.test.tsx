// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApplicationCommandProvider,
  ProductCommandId,
  useApplicationCommands,
} from '@/lib/commands'
import {
  PlatformKind,
  PlatformProvider,
  type ApplicationComposition,
} from '@/platform'
import { chatKeys } from '@/hooks/use-chat-request'
import { useHomeStore } from '@/stores/home'
import { useUIStore } from '@/stores/ui'
import { setProductLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'

const apps = [
  {
    id: 'app-1',
    name: 'Explore fallback',
    description: '',
    icon: '',
    update_time: 2,
  },
  {
    id: 'app-2',
    name: 'Citation checks',
    description: 'Harness evals',
    icon: '',
    update_time: 1,
  },
] as unknown as DialogApp[]

vi.mock('@/hooks/use-dialog-apps', () => ({
  useDialogApps: () => ({ data: apps, isLoading: false }),
}))
vi.mock('@/hooks/use-knowledge-request', () => ({
  useFetchKnowledgeList: ({ keywords }: { keywords?: string }) => ({
    knowledgeBases: [
      { id: 'kb-1', name: 'Harness handbook', doc_num: 4 },
      { id: 'kb-2', name: 'Support FAQ', doc_num: 1 },
    ].filter((kb) =>
      keywords ? kb.name.toLowerCase().includes(keywords) : true,
    ),
    isLoading: false,
  }),
}))
vi.mock('@/hooks/use-chat-request', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/use-chat-request')>()),
  useFetchConversationsByDialog: () => ({ conversations: [] }),
}))

class TestResizeObserver implements ResizeObserver {
  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
}

const composition: ApplicationComposition = Object.freeze({
  platform: Object.freeze({
    kind: PlatformKind.WEB,
    capabilities: () =>
      Object.freeze({
        desktop: false,
        nativeMenu: false,
        updater: false,
        notifications: false,
        localAgent: false,
        pty: false,
        localMcp: false,
      }),
  }),
  commandSource: Object.freeze({ subscribe: () => () => {} }),
})

const Probe = () => {
  const { execute } = useApplicationCommands()
  const location = useLocation()
  return (
    <>
      <button
        id="open"
        type="button"
        onClick={() => void execute(ProductCommandId.OPEN_PALETTE)}
      >
        open
      </button>
      <input aria-label="Draft" />
      <output data-testid="location">{location.pathname}</output>
    </>
  )
}

let container: HTMLDivElement
let root: Root
let client: QueryClient

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  globalThis.ResizeObserver = TestResizeObserver
  HTMLElement.prototype.scrollIntoView = vi.fn()
  await setProductLanguage('en-US')
  useHomeStore.getState().reset()
  useUIStore.setState({ sidebarCollapsed: false })
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const now = Math.floor(Date.now() / 1000)
  client.setQueryData(chatKeys.conversationsByDialog('app-1'), [
    { id: 'c-1', name: 'How does Harness avoid forgetting?', update_time: now },
    { id: 'c-2', name: 'hi', update_time: now - 60 },
  ])
  client.setQueryData(chatKeys.conversationsByDialog('app-2'), [
    { id: 'c-3', name: 'Harness benchmarks', update_time: now - 120 },
  ])
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <PlatformProvider composition={composition}>
          <MemoryRouter initialEntries={['/knowledge']}>
            <ApplicationCommandProvider>
              <Probe />
            </ApplicationCommandProvider>
          </MemoryRouter>
        </PlatformProvider>
      </QueryClientProvider>,
    ),
  )
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  client.clear()
  vi.useRealTimers()
})

const input = () => document.querySelector<HTMLInputElement>('[cmdk-input]')!
const headings = () =>
  Array.from(document.querySelectorAll('[cmdk-group-heading]')).map(
    (heading) => heading.textContent,
  )
const press = (key: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    input().dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, ...init }),
    )
  })
const type = async (value: string) => {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!
    setter.call(input(), value)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
  // Knowledge keywords are debounced before the list query.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 300))
  })
}
const open = () =>
  act(async () => container.querySelector<HTMLButtonElement>('#open')!.click())

describe('CommandPalette', () => {
  it('groups conversations, knowledge, apps and commands and highlights the match', async () => {
    await open()
    expect(headings()).toEqual([
      'Conversations',
      'Knowledge bases',
      'Apps',
      'Go to',
      'Commands',
    ])
    await type('harness')
    expect(headings()).toEqual(['Conversations', 'Knowledge bases', 'Apps'])
    const rows = Array.from(document.querySelectorAll('[cmdk-item]')).map(
      (item) => item.textContent,
    )
    expect(rows[0]).toContain('How does Harness avoid forgetting?')
    expect(rows[0]).toContain('Explore fallback')
    expect(rows[1]).toContain('Harness benchmarks')
    expect(rows).toContainEqual(expect.stringContaining('Harness handbook'))
    expect(rows).toContainEqual(expect.stringContaining('Citation checks'))
    expect(document.querySelector('[cmdk-item] mark')?.textContent).toBe(
      'Harness',
    )
  })

  it('moves with the arrow keys and opens a conversation in its app with Enter', async () => {
    await open()
    await type('harness')
    const selected = () =>
      document
        .querySelector('[cmdk-item][aria-selected="true"]')
        ?.getAttribute('data-value')
    expect(selected()).toBe('conversation c-1')
    await press('ArrowDown')
    expect(selected()).toBe('conversation c-3')
    await press('Enter')
    expect(useHomeStore.getState().selectedApps[0]?.id).toBe('app-2')
    expect(useHomeStore.getState().selectedConversationId).toBe('c-3')
    expect(
      container.querySelector('[data-testid="location"]')?.textContent,
    ).toBe('/home')
    expect(document.querySelector('[data-command-palette]')).toBeNull()
  })

  it('cycles the search scope with Tab and Shift+Tab', async () => {
    await open()
    await press('Tab')
    expect(headings()).toEqual(['Conversations'])
    expect(
      document.querySelector('[role="radio"][aria-checked="true"]')
        ?.textContent,
    ).toBe('Chats')
    await press('Tab', { shiftKey: true })
    await press('Tab', { shiftKey: true })
    expect(headings()).toEqual(['Go to', 'Commands'])
    expect(document.activeElement).toBe(input())
  })

  it('opens from a focused field with Ctrl+K but leaves other shortcuts to typing', async () => {
    const field = container.querySelector<HTMLInputElement>(
      'input[aria-label="Draft"]',
    )!
    field.focus()
    await act(async () => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'b',
          ctrlKey: true,
          bubbles: true,
        }),
      )
    })
    expect(useUIStore.getState().sidebarCollapsed).toBe(false)
    expect(document.querySelector('[data-command-palette]')).toBeNull()
    await act(async () => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
        }),
      )
    })
    expect(document.querySelector('[data-command-palette]')).not.toBeNull()
    expect(document.activeElement).toBe(input())
  })

  it('leaves Ctrl+K to an editor that handled it', async () => {
    const field = container.querySelector<HTMLInputElement>(
      'input[aria-label="Draft"]',
    )!
    field.addEventListener('keydown', (event) => event.preventDefault())
    await act(async () => {
      field.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'k',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      )
    })
    expect(document.querySelector('[data-command-palette]')).toBeNull()
  })
})
