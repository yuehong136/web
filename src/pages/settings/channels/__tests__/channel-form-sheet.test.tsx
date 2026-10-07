import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import type { ChatChannel, RenderableProviderManifest } from '@/api/channel'
import { setProductLanguage } from '@/locales/i18n'
import { ChannelFormSheet } from '../components/channel-form-sheet'

vi.mock('@/hooks/use-channel-request', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/use-channel-request')>()),
  useFetchChannelDetail: () => ({ data: undefined, isLoading: false }),
  useFetchChannelRuntime: () => ({ data: undefined }),
  useSaveChannel: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useVerifyChannel: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
    coolingDown: false,
  }),
}))
// Binding targets load Agent and app lists; they play no part in the provider.
vi.mock('../components/binding-fields', () => ({ BindingFields: () => null }))

const feishu: RenderableProviderManifest = {
  provider: 'feishu',
  display_name: 'Feishu',
  capabilities: {},
  config_schema: {},
  form: {
    version: 1,
    fields: [
      { path: 'app_id', kind: 'text', label: 'App ID', required: true },
      {
        path: 'app_secret',
        kind: 'password',
        label: 'App Secret',
        required: true,
        secret: true,
      },
    ],
  },
}

const dingtalk: RenderableProviderManifest = {
  provider: 'dingtalk',
  display_name: 'DingTalk',
  capabilities: {},
  config_schema: {},
  form: {
    version: 1,
    fields: [
      { path: 'client_id', kind: 'text', label: 'Client ID', required: true },
    ],
  },
}

const savedChannel: ChatChannel = {
  id: 'channel-1',
  name: 'Support bot',
  channel: 'feishu',
  config: { app_id: 'cli_saved' },
  status: 1,
  generation: 1,
  secret: { configured: true, version: 1 },
  binding: {
    target_type: 'multirag.canvas_agent',
    target_id: 'agent-1',
    target_revision_id: null,
    policy: {},
    enabled: true,
  },
  runtime: null,
}

let root: Root | undefined

beforeEach(async () => {
  await setProductLanguage('en-US')
})

afterEach(async () => {
  await act(async () => root?.unmount())
  root = undefined
  document.body.innerHTML = ''
})

async function mountSheet(channel: ChatChannel | null) {
  const container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  await act(async () => {
    root?.render(
      <QueryClientProvider client={client}>
        <ChannelFormSheet
          open
          onOpenChange={() => {}}
          providers={[feishu, dingtalk]}
          channel={channel}
          initialProvider="feishu"
        />
      </QueryClientProvider>,
    )
  })
}

function labelled<T extends HTMLElement>(text: string) {
  const label = Array.from(document.body.querySelectorAll('label')).find(
    (element) => element.textContent?.includes(text),
  )
  const control = label ? document.getElementById(label.htmlFor) : null
  return control as T | null
}

function providerTrigger() {
  const trigger = labelled<HTMLButtonElement>('Channel type')
  if (!trigger) throw new Error('Missing provider select')
  return trigger
}

function option(text: string) {
  return Array.from(
    document.body.querySelectorAll<HTMLElement>(
      '[role="option"], [data-select-content] button',
    ),
  ).find((element) => element.textContent?.trim() === text)
}

test('editing a channel keeps its provider and stored config', async () => {
  await mountSheet(savedChannel)
  const trigger = providerTrigger()

  expect(trigger.disabled).toBe(true)
  expect(trigger.textContent).toContain('Feishu / Lark')

  await act(async () => {
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
  for (const key of ['ArrowDown', 'Enter', ' ', 'd']) {
    await act(async () => {
      trigger.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true }),
      )
    })
  }

  // The update request carries no provider, so a switch here would save the
  // old provider with the new one's blank config and secrets.
  expect(option('DingTalk')).toBeUndefined()
  expect(trigger.textContent).toContain('Feishu / Lark')
  expect(labelled<HTMLInputElement>('App ID')?.value).toBe('cli_saved')
  expect(labelled('Client ID')).toBeNull()
})

test('a new channel can still switch provider', async () => {
  await mountSheet(null)
  const trigger = providerTrigger()

  expect(trigger.disabled).toBe(false)
  await act(async () => trigger.click())
  const dingtalkOption = option('DingTalk')
  expect(dingtalkOption).toBeDefined()
  await act(async () => dingtalkOption?.click())

  expect(providerTrigger().textContent).toContain('DingTalk')
  expect(labelled('Client ID')).not.toBeNull()
  expect(labelled('App ID')).toBeNull()
})
