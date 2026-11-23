import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanGeneratedPrompt, llmAPI } from '@/api/llm'
import i18n, { setProductLanguage } from '@/locales/i18n'
import { missingPlaceholders, PromptAssist } from '../prompt-assist'

vi.mock('@/components/chat/ChatModelSelector', () => ({
  ChatModelSelector: ({ onSelect }: { onSelect: (value: string) => void }) => (
    <button type="button" data-pick-model onClick={() => onSelect('m@P')}>
      pick
    </button>
  ),
}))
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: () => ({
    myLLMs: {},
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

let root: Root
let host: HTMLDivElement
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  // jsdom has no modal dialog API.
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
  }
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('cleans reasoning and fences from a generated prompt', () => {
  expect(cleanGeneratedPrompt('<think>plan</think>\nAnswer well.')).toBe(
    'Answer well.',
  )
  expect(cleanGeneratedPrompt('half a thought</think>Answer.')).toBe('Answer.')
  expect(cleanGeneratedPrompt('```markdown\nAnswer {query}.\n```')).toBe(
    'Answer {query}.',
  )
})

it('names placeholders a suggestion dropped', () => {
  expect(
    missingPlaceholders(
      'Use {knowledge} for {begin@query}.',
      'Use {knowledge} only.',
    ),
  ).toEqual(['{begin@query}'])
})

const button = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent?.trim() === name,
  )

it('refines the current prompt and applies it only on request', async () => {
  const finePrompt = vi
    .spyOn(llmAPI, 'finePrompt')
    .mockResolvedValue('Answer {question} from sources.\n\nCite them.')
  const onApply = vi.fn()
  const client = new QueryClient()
  await act(async () =>
    root.render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <PromptAssist
            value={'Answer {question} from sources.\n\nUse {knowledge}.'}
            onApply={onApply}
          />
        </QueryClientProvider>
      </MemoryRouter>,
    ),
  )
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[data-prompt-assist]')!.click(),
  )
  await act(async () =>
    document.querySelector<HTMLButtonElement>('[data-pick-model]')!.click(),
  )
  await act(async () => button(i18n.t('chat.promptAssist.optimize'))!.click())
  await vi.waitFor(() =>
    expect(
      document.querySelector('[data-prompt-assist-state="ready"]'),
    ).not.toBeNull(),
  )
  expect(finePrompt).toHaveBeenCalledWith(
    {
      prompt: 'Answer {question} from sources.\n\nUse {knowledge}.',
      model: 'm@P',
    },
    expect.any(AbortSignal),
  )
  // The changed paragraphs are marked on both sides.
  expect(
    [...document.querySelectorAll('[data-changed]')].map((p) => p.textContent),
  ).toEqual(['Use {knowledge}.', 'Cite them.'])
  expect(
    document.querySelector('[data-prompt-assist-missing]')?.textContent,
  ).toContain('{knowledge}')
  expect(onApply).not.toHaveBeenCalled()
  await act(async () => button(i18n.t('chat.promptAssist.replace'))!.click())
  expect(onApply).toHaveBeenCalledWith(
    'Answer {question} from sources.\n\nCite them.',
  )
  client.clear()
})
