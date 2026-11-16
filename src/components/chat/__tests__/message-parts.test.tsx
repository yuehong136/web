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

vi.mock('react-shiki/core', () => ({
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
  // One source line under the answer: the inline chip names the document
  const chip = host.querySelector<HTMLButtonElement>(
    'sup [data-citation-chip]',
  )!
  expect(chip.textContent).toContain('Evidence')
  expect(chip.querySelector('[data-slot="file-kind-tile"]')?.textContent).toBe(
    'PDF',
  )
  // The source pill expands to the cited sources; each opens its evidence
  const toggle = host.querySelector<HTMLButtonElement>(
    '[data-source-strip] [data-source-toggle]',
  )!
  expect(toggle.textContent).toContain('1 source')
  expect(host.querySelector('[data-source-chunk]')).toBeNull()
  await act(async () => toggle.click())
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  const source = host.querySelector<HTMLButtonElement>(
    '[data-source-strip] [data-source-chunk]',
  )!
  expect(source.getAttribute('aria-label')).toBe('Citation 1: Evidence.pdf')
  await act(async () => source.click())
  expect(view).toHaveBeenLastCalledWith(references[0], references, {
    cited: [references[0]],
    messageId: undefined,
  })
  await act(async () =>
    host.querySelector<HTMLButtonElement>('[data-retrieval-summary]')!.click(),
  )
  expect(view).toHaveBeenLastCalledWith(references[0], references, {
    view: 'chunks',
    cited: [references[0]],
    messageId: undefined,
  })
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

it('renders unresolved citation markers as plain superscripts instead of protocol text', async () => {
  await act(async () =>
    root.render(
      <MessageParts
        content="History answer[ID:3]"
        messageId="history"
        run={{ phase: 'completed' }}
        onViewReference={() => {}}
      />,
    ),
  )

  expect(host.textContent).not.toContain('[ID:3]')
  const marker = host.querySelector('sup')
  expect(marker).not.toBeNull()
  expect(marker?.querySelector('button')).toBeNull()
})

it.each(['en-US', 'zh-CN'] as const)(
  'shows localized waiting only while an empty answer is active in %s',
  async (locale) => {
    await setProductLanguage(locale)
    const render = (
      content: string,
      phase:
        | 'running'
        | 'cancelRequested'
        | 'failed'
        | 'locallyStopped'
        | 'completed'
        | 'interrupted',
      thinking = '',
    ) =>
      act(async () =>
        root.render(
          <MessageParts
            content={content}
            thinking={thinking}
            run={{ phase }}
            onViewReference={() => {}}
          />,
        ),
      )
    for (const phase of ['running', 'cancelRequested'] as const) {
      await render('', phase)
      expect(host.querySelector('output')?.getAttribute('aria-label')).toBe(
        locale === 'en-US' ? 'Loading...' : '加载中...',
      )
      await render('First answer', phase)
      expect(host.querySelector('output')).toBeNull()
      expect(host.textContent).toContain('First answer')
      await render('', phase, 'Observed reasoning')
      expect(host.querySelector('output')).toBeNull()
      expect(host.querySelector('button[aria-expanded]')).not.toBeNull()
    }
    for (const phase of [
      'failed',
      'locallyStopped',
      'completed',
      'interrupted',
    ] as const) {
      await render('', phase)
      expect(host.querySelector('output')).toBeNull()
    }
  },
)

it('names the answering model with its provider logo and the answer time', async () => {
  await act(async () =>
    root.render(
      <MessageParts
        content="Answer"
        identity={{
          reference: 'deepseek-v3@DeepSeek',
          label: 'DeepSeek-V3.2',
          provider: 'DeepSeek',
          time: '14:32',
        }}
        run={{ phase: 'completed' }}
        onViewReference={() => {}}
      />,
    ),
  )
  const identity = host.querySelector('[data-answer-identity]')!
  expect(identity.textContent).toBe('DeepSeek-V3.214:32')
  expect(
    identity.querySelector('[data-model-identity] [data-slot="provider-logo"]'),
  ).not.toBeNull()
})

it('groups back-to-back citations into one chip whose card pages through them', async () => {
  const references: ReferenceChunk[] = [
    {
      id: 'a',
      content: 'Alpha passage',
      document_name: 'Retrieval paper.pdf',
      document_id: 'd1',
      dataset_id: 'kb',
      similarity: 0.82,
    },
    {
      id: 'b',
      content: 'Beta passage',
      document_name: 'Eval log.xlsx',
      document_id: 'd2',
      dataset_id: 'kb',
    },
    {
      id: 'c',
      content: 'Gamma passage',
      document_name: 'notes.md',
      document_id: 'd3',
      dataset_id: 'kb',
    },
  ]
  const view = vi.fn()
  await act(async () =>
    root.render(
      <MessageParts
        content="Claim [ID:0][ID:1][ID:0]. Other [ID:2]"
        messageId="m1"
        references={references}
        run={{ phase: 'completed' }}
        onViewReference={view}
      />,
    ),
  )
  const chips = [
    ...host.querySelectorAll<HTMLButtonElement>('sup [data-citation-chip]'),
  ]
  expect(chips).toHaveLength(2)
  expect(chips[0].textContent).toBe('PDFRetrieval paper+1')
  expect(chips[0].dataset.citationNumber).toBe('1,2')
  expect(chips[0].getAttribute('aria-label')).toBe(
    'Citation 1: Retrieval paper.pdf, and 1 more source',
  )
  expect(chips[1].textContent).toBe('MDnotes')
  await act(async () => chips[0].click())
  await act(async () => new Promise((resolve) => setTimeout(resolve, 0)))
  const card = document.querySelector<HTMLElement>('[role="dialog"]')!
  expect(card.textContent).toContain('Retrieval paper.pdf')
  expect(card.textContent).toContain('82%')
  expect(card.textContent).toContain('Alpha passage')
  expect(card.textContent).toContain('1/2')
  await act(async () =>
    card
      .querySelector<HTMLButtonElement>('[aria-label="Next source"]')!
      .click(),
  )
  expect(card.textContent).toContain('Eval log.xlsx')
  expect(card.textContent).toContain('Citation 2')
  // No score was returned for this chunk, so none is shown
  expect(card.textContent).not.toContain('%')
  await act(async () =>
    card.querySelector<HTMLButtonElement>('[data-reference-details]')!.click(),
  )
  expect(view).toHaveBeenLastCalledWith(references[1], references, {
    cited: references,
    messageId: 'm1',
  })
})
