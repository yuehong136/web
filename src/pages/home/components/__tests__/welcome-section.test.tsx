import { act, type RefObject } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { useHomeStore } from '@/stores/home'
import type { DialogApp, KnowledgeBase } from '@/types/api'
import { WelcomeSection } from '../WelcomeSection'

const overview = vi.hoisted(() => ({
  current: {
    apps: [] as unknown[],
    knowledgeBases: [] as unknown[],
    loading: false,
    knowledgeTotal: null as number | null,
    mcpTotal: null as number | null,
  },
}))
const focus = vi.hoisted(() => vi.fn())

vi.mock('../../hooks/use-home-overview', () => ({
  useHomeOverview: () => overview.current,
}))
vi.mock('../home-composer', () => ({
  HomeComposer: ({
    inputRef,
    value,
  }: {
    inputRef: RefObject<{ focus: () => void } | null>
    value: string
  }) => {
    inputRef.current = { focus }
    return <output aria-label="Draft">{value}</output>
  },
}))
vi.mock('@/hooks/use-chat-request', () => ({
  useFetchConversationsByDialog: () => ({
    conversations: [],
    isLoading: false,
    isError: false,
  }),
}))

const hour = 3600
const now = Math.floor(Date.now() / 1000)
const app = {
  id: 'app-1',
  name: 'Research desk',
  description: 'Answers with citations',
  icon: '',
  llm_id: 'qwen-plus@Tongyi-Qianwen',
  status: '1',
  update_time: now - 2 * hour,
} as DialogApp
const knowledge = {
  id: 'kb-1',
  name: 'Product handbook',
  description: '',
  doc_num: 12,
  chunk_num: 340,
  update_time: (now - hour) * 1000,
} as KnowledgeBase
const stale = { ...app, id: 'app-old', name: 'Old app', update_time: 10 }
const older = { ...app, id: 'app-2', name: 'Older app', update_time: 20 }

let root: Root
let host: HTMLDivElement
const onInputChange = vi.fn()
const render = () =>
  act(async () =>
    root.render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route
            path="/home"
            element={
              <WelcomeSection
                inputValue=""
                onInputChange={onInputChange}
                onSend={() => undefined}
              />
            }
          />
          <Route path="/knowledge/:id" element={<p>Knowledge page</p>} />
        </Routes>
      </MemoryRouter>,
    ),
  )

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('en-US')
  useHomeStore.getState().reset()
  overview.current = {
    apps: [stale, app, older],
    knowledgeBases: [knowledge],
    loading: false,
    knowledgeTotal: 3,
    mcpTotal: 2,
  }
  onInputChange.mockReset()
  focus.mockReset()
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  useHomeStore.getState().reset()
  vi.unstubAllGlobals()
})

it('greets with the page heading once and only the counts that loaded', async () => {
  await render()
  const headings = [...host.querySelectorAll('h1')].map((h) => h.textContent)
  expect(headings).toEqual(['What can AI help you with today?'])
  const chip = host.querySelector('[data-home-greeting]')!
  expect(chip.querySelector('[data-tide-mark]')).not.toBeNull()
  expect(chip.textContent).toMatch(
    /Good (morning|afternoon|evening) · 3 knowledge bases and 2 connectors available/,
  )

  overview.current = { ...overview.current, knowledgeTotal: null, mcpTotal: 1 }
  await render()
  expect(chip.textContent).toMatch(/· 1 connector available$/)

  overview.current = { ...overview.current, mcpTotal: null }
  await render()
  expect(chip.textContent).not.toContain('·')
})

it('fills the draft from a starter and returns focus to the composer', async () => {
  await render()
  const starters = host.querySelectorAll<HTMLButtonElement>(
    '[aria-label="Ways to start"] button',
  )
  expect(starters).toHaveLength(4)
  await act(async () => starters[3].click())
  expect(onInputChange).toHaveBeenCalledWith(
    'Explain this concept in plain language and give one example:',
  )
  expect(focus).toHaveBeenCalled()
})

it('continues the most recent apps and knowledge bases', async () => {
  await render()
  const section = host.querySelector('section')!
  expect(section.querySelector('h2')?.textContent).toBe('Continue working')
  const cards = [...section.querySelectorAll('[data-slot="resource-card"]')]
  expect(cards.map((card) => card.querySelector('h3')?.textContent)).toEqual([
    'Product handbook',
    'Research desk',
    'Older app',
  ])
  expect(cards[0].textContent).toContain('12 documents')
  expect(cards[0].textContent).toContain('340 chunks')
  expect(cards[1].textContent).toContain('qwen-plus')

  await act(async () =>
    cards[1].querySelector<HTMLButtonElement>('h3 button')!.click(),
  )
  expect(useHomeStore.getState().selectedApps[0]?.id).toBe('app-1')

  useHomeStore.getState().reset()
  await render()
  await act(async () =>
    host
      .querySelector<HTMLButtonElement>(
        '[data-slot="resource-card"] h3 button',
      )!
      .click(),
  )
  expect(host.textContent).toContain('Knowledge page')
})

it('waits for both lists before showing recent work', async () => {
  overview.current = { ...overview.current, loading: true }
  await render()
  expect(host.querySelector('section')).toBeNull()
})
