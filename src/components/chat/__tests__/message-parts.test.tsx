import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MessageParts } from '../message-parts'
import { ChatTranscript } from '../chat-transcript'
import { stubChatDOM } from './chat-dom'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'

// The diagram's vendor highlighter has an unresolved extensionless ESM import in Node.
// Markdown, citations, tool steps and React escaping remain the real components.
vi.mock('@ant-design/x', () => ({ Mermaid: () => null }))

vi.mock('react-shiki', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))
let root: Root
let host: HTMLDivElement
beforeEach(async () => {
  stubChatDOM()
  await setProductLanguage('en-US')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('retains interrupted content, honest step state and neutral reasoning details', async () => {
  await act(async () =>
    root.render(
      <ChatTranscript
        items={[
          {
            id: 'partial',
            role: 'assistant',
            phase: 'interrupted',
            body: (
              <MessageParts
                content="<think>internal reasoning</think>Partial answer"
                messageId="partial"
                run={{
                  phase: 'interrupted',
                  steps: [
                    {
                      id: 'lookup',
                      kind: 'tool',
                      title: 'lookup',
                      status: 'loading',
                      content: { arguments: {} },
                    },
                  ],
                }}
                onViewReference={() => {}}
              />
            ),
          },
        ]}
      />,
    ),
  )
  expect(
    host
      .querySelector('[data-message-id="partial"]')
      ?.getAttribute('data-run-phase'),
  ).toBe('interrupted')
  expect(host.querySelector('.markdown-content')?.textContent).toContain(
    'Partial answer',
  )
  expect(host.querySelector('[data-step-status="unconfirmed"]')).not.toBeNull()
  expect(host.querySelector('.animate-spin')).toBeNull()
  expect(host.querySelectorAll('[data-message-id]')).toHaveLength(1)
})

it('a completed body never loses small updates and preserves actual citation markers', async () => {
  const references: ReferenceChunk[] = [
    {
      id: 'chunk-0',
      content: 'Evidence text',
      document_name: 'Evidence.pdf',
      document_id: 'doc-1',
      dataset_id: 'kb-1',
    },
  ]
  const view = vi.fn()
  const render = (content: string) =>
    act(async () =>
      root.render(
        <MessageParts
          content={content}
          references={references}
          run={{ phase: 'completed' }}
          onViewReference={view}
        />,
      ),
    )
  await render('Evidence [ID:0]')
  expect(host.querySelector('sup')).not.toBeNull()
  expect(host.querySelector('.markdown-content')?.textContent).not.toContain(
    '[ID:0]',
  )
  await render('Evidence [ID:0].')
  expect(host.querySelector('.markdown-content')?.textContent).toContain('.')
  expect(host.textContent).toContain('Sources')
})

it('historical tool rows without a result never become invented completed steps', async () => {
  await act(async () =>
    root.render(
      <MessageParts
        content="Answer"
        run={{
          phase: 'completed',
          steps: [
            {
              id: 'observed-call',
              kind: 'tool',
              title: 'lookup',
              status: 'loading',
            },
          ],
        }}
        onViewReference={() => {}}
      />,
    ),
  )
  expect(host.querySelectorAll('[data-step-status]')).toHaveLength(1)
  expect(host.querySelector('[data-step-status="unconfirmed"]')).not.toBeNull()
  expect(host.textContent).not.toContain('Completed')
})
