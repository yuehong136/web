import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  ModelIdentity,
  modelMessageProps,
} from '@/components/models/model-identity'
import { getAppChatBubbleProps } from '@/components/chat/app-chat-message'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createContextManifest } from '@/lib/ai-workspace/contracts'
import { setProductLanguage } from '@/locales/i18n'
import { ContextManifestSummary } from '@/components/chat/context-manifest-summary'

const manifest = createContextManifest({
  scope: { identity: 'user-a', threadId: 'conversation-a' },
  messageId: 'answer-a',
  stage: 'submitted',
  resources: [
    {
      kind: 'tool',
      id: 'server-a',
      label: '真实工具名称',
      origin: 'turn',
      availability: 'unknown',
    },
  ],
})
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('discloses actual labels with submission and unknown-availability semantics', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(<ContextManifestSummary manifest={manifest} />),
  )
  const details = container.querySelector('details')!
  expect(details.open).toBe(false)
  await act(async () => container.querySelector('summary')!.click())
  expect(details.open).toBe(true)
  expect(container.textContent).toContain('Submitted with this turn')
  expect(container.textContent).toContain(
    'does not confirm that the model read it',
  )
  expect(container.textContent).toContain('Availability unknown')
  expect(container.textContent).toContain('真实工具名称')
  expect(container.textContent).not.toContain('Used in this answer')
})

it('switches UI language using the same instance while preserving the open disclosure and resource label', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(<ContextManifestSummary manifest={manifest} />),
  )
  const details = container.querySelector('details')!
  details.open = true
  await act(async () => setProductLanguage('zh-CN'))
  expect(container.querySelector('details')).toBe(details)
  expect(details.open).toBe(true)
  expect(container.textContent).toContain('真实工具名称')
  expect(container.textContent).not.toContain('Turn context')
  expect(container.textContent).not.toContain('chat.aiWorkspace')
})

it('shows a selected scope before submission and hides an empty manifest', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(
      <ContextManifestSummary
        manifest={createContextManifest({ ...manifest, stage: 'selected' })}
      />,
    ),
  )
  expect(container.textContent).toContain('Selected')
  expect(container.textContent).toContain(
    'Actual use requires server confirmation',
  )
  await act(async () =>
    root.render(
      <ContextManifestSummary
        manifest={createContextManifest({ ...manifest, resources: [] })}
      />,
    ),
  )
  expect(container.textContent).toBe('')
})

it('resolves old numeric context cards and application titles with the matching provider logo', async () => {
  await setProductLanguage('en-US')
  const client = new QueryClient()
  client.setQueryData(['llm', 'myLLMs'], {
    OpenAI: {
      tags: 'chat',
      llm: [
        { id: 117, name: 'gpt-test', type: 'chat', status: '0', used_token: 0 },
      ],
    },
  })
  const modelManifest = createContextManifest({
    ...manifest,
    resources: [
      {
        kind: 'model',
        id: '117',
        label: '117',
        origin: 'turn',
        availability: 'unknown',
      },
    ],
  })
  const app = getAppChatBubbleProps('assistant', {
    name: 'My app',
    llm_id: '117',
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ContextManifestSummary manifest={modelManifest} />
        <div data-app-title>{app.header}</div>
      </QueryClientProvider>,
    ),
  )
  expect(container.textContent).not.toContain('117')
  expect(container.querySelector('li [data-model-identity]')?.textContent).toBe(
    'gpt-test',
  )
  expect(container.querySelector('li use')?.getAttribute('xlink:href')).toBe(
    '#icon-openai',
  )
  expect(container.querySelector('[data-app-title]')?.textContent).toBe(
    'gpt-test',
  )
  expect(modelManifest.resources[0].label).toBe('117')
  await act(async () => root.render(null))
  client.clear()
})
it('never exposes an unknown numeric reference, including outside a query provider', async () => {
  await setProductLanguage('en-US')
  await act(async () =>
    root.render(<ModelIdentity reference="987654" label="987654" />),
  )
  expect(container.textContent).toBe('Saved model')
  expect(container.textContent).not.toContain('987654')
})
it('keeps a message snapshot when a connection disappears and when current defaults change', async () => {
  const props = modelMessageProps({
    reference: '117',
    label: 'Original model',
    provider: 'OpenAI',
  })
  const client = new QueryClient()
  client.setQueryData(['llm', 'myLLMs'], {
    DeepSeek: {
      tags: 'chat',
      llm: [{ id: 118, name: 'different-model', type: 'chat', used_token: 0 }],
    },
  })
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        {props.header}
        {props.avatar}
      </QueryClientProvider>,
    ),
  )
  expect(container.textContent).toBe('Original model')
  expect(
    [...container.querySelectorAll('use')].filter(
      (el) => el.getAttribute('xlink:href') === '#icon-openai',
    ),
  ).toHaveLength(1)
  expect(
    getAppChatBubbleProps('user', { name: 'App', llm_id: '117' }).header,
  ).toBeUndefined()
  await act(async () => root.render(null))
  client.clear()
})

it('fills old identities after metadata loads and retains the last known identity on list failure', async () => {
  const client = new QueryClient()
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ModelIdentity reference="117" />
      </QueryClientProvider>,
    ),
  )
  expect(container.textContent).toBe('Saved model')
  await act(async () => {
    client.setQueryData(['llm', 'myLLMs'], {
      OpenAI: {
        tags: 'chat',
        llm: [{ id: 117, name: 'Loaded model', type: 'chat', used_token: 0 }],
      },
    })
  })
  expect(container.textContent).toBe('Loaded model')
  await act(async () => {
    await client
      .fetchQuery({
        queryKey: ['llm', 'myLLMs'],
        queryFn: () => Promise.reject(new Error('fixture failure')),
        retry: false,
      })
      .catch(() => undefined)
  })
  expect(container.textContent).toBe('Loaded model')
  expect(container.querySelector('use')?.getAttribute('xlink:href')).toBe(
    '#icon-openai',
  )
  await act(async () => root.render(null))
  client.clear()
})
