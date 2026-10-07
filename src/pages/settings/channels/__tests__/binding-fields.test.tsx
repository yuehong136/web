import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { useForm } from 'react-hook-form'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { Form } from '@/components/ui/form'
import { setProductLanguage } from '@/locales/i18n'
import { BindingFields } from '../components/binding-fields'
import type { ChannelFormValues } from '../form-model'

const agentSearches = vi.hoisted(() => [] as string[])

vi.mock('@/hooks/use-agent-query', () => ({
  useFetchAgentList: ({ keywords }: { keywords: string }) => {
    agentSearches.push(keywords)
    const agents = [
      { id: 'agent-support', title: 'Support bot', release: true },
      { id: 'agent-sales', title: 'Sales bot', release: true },
    ]
    return {
      agents: agents.filter((agent) =>
        agent.title.toLowerCase().includes(keywords.toLowerCase()),
      ),
      isLoading: false,
      isError: false,
    }
  },
  useFetchVersionList: () => ({ data: [], isLoading: false, isError: false }),
}))
vi.mock('@/hooks/use-dialog-apps', () => ({
  useDialogApps: () => ({ data: [], isLoading: false, isError: false }),
}))

let root: Root | undefined

beforeEach(async () => {
  agentSearches.length = 0
  // The private-chat switch measures itself.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await setProductLanguage('en-US')
})

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

function Harness() {
  const form = useForm<ChannelFormValues>({
    defaultValues: {
      name: 'Support channel',
      provider: 'feishu',
      config: {},
      secrets: {},
      targetType: 'multirag.canvas_agent',
      targetId: 'agent-support',
      targetRevisionId: '',
      privateChatOnly: true,
    },
  })
  return (
    <Form {...form}>
      <form>
        <BindingFields />
      </form>
    </Form>
  )
}

async function typeInto(input: HTMLInputElement, text: string) {
  for (const character of text) {
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set?.call(input, input.value + character)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
}

test('the target search sits outside the list and keeps focus while it searches', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root?.render(<Harness />))

  // Reachable without opening the list, where options would take its focus.
  const search = document.querySelector<HTMLInputElement>(
    'input[aria-label="Search agents…"]',
  )
  expect(search).not.toBeNull()
  if (!search) return
  expect(search.closest('[role="listbox"]')).toBeNull()

  await act(async () => search.focus())
  await typeInto(search, 'sal')

  expect(document.activeElement).toBe(search)
  expect(search.value).toBe('sal')
  await vi.waitFor(() => expect(agentSearches.at(-1)).toBe('sal'))
})
