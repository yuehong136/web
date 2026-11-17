import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'
import type { ExploreMessage } from '../../hooks/use-explore-conversation'
import { ExploreThread } from '../explore-thread'

vi.mock('../explore-chat-answer', () => ({
  ExploreChatAnswer: ({ content }: { content: string }) => <p>{content}</p>,
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

const conversation: ExploreMessage[] = [
  { id: 'q1', role: 'user', content: 'First question' },
  {
    id: 'a1',
    role: 'assistant',
    content: 'First answer',
    runPhase: 'completed',
  },
  { id: 'q2', role: 'user', content: 'Second question' },
  {
    id: 'a2',
    role: 'assistant',
    content: 'Second answer',
    runPhase: 'completed',
  },
]

it('offers copy, read aloud and regenerate, and no feedback that is never saved', async () => {
  const regenerate = vi.fn()
  await act(async () =>
    root.render(
      <ExploreThread
        messages={conversation}
        isStreaming={false}
        onCopy={() => {}}
        onRegenerate={regenerate}
      />,
    ),
  )
  const labels = [...host.querySelectorAll('button')].map((button) =>
    button.getAttribute('aria-label'),
  )
  expect(labels).toContain('Read aloud')
  expect(labels.filter((label) => label === 'Regenerate')).toHaveLength(2)
  // Thumbs up/down only showed a toast; the web never sent the feedback.
  expect(host.querySelector('.ant-actions-feedback')).toBeNull()
  expect(labels.some((label) => /like|helpful/i.test(label ?? ''))).toBe(false)
  const regenerateButtons = [
    ...host.querySelectorAll<HTMLButtonElement>('[aria-label="Regenerate"]'),
  ]
  await act(async () => regenerateButtons[1].click())
  expect(regenerate).toHaveBeenCalledWith(3)
})

it('keeps only the latest answer’s actions visible and marks each question as a turn', async () => {
  await act(async () =>
    root.render(
      <ExploreThread
        messages={conversation}
        isStreaming={false}
        onCopy={() => {}}
        onRegenerate={() => {}}
      />,
    ),
  )
  const answers = [...host.querySelectorAll('[data-message-role="assistant"]')]
  expect(
    answers.map((answer) =>
      answer
        .querySelector('.chat-message-actions')
        ?.hasAttribute('data-persistent'),
    ),
  ).toEqual([false, true])
  expect(
    [...host.querySelectorAll('[data-turn-id]')].map(
      (turn) => turn.textContent,
    ),
  ).toEqual(['First question', 'Second question'])
  // Two turns are not long enough for the turn rail
  expect(host.querySelector('[data-turn-rail]')).toBeNull()
})

it('hides the actions of the answer that is still streaming', async () => {
  await act(async () =>
    root.render(
      <ExploreThread
        messages={[
          ...conversation.slice(0, 3),
          { id: 'a2', role: 'assistant', content: 'Part', runPhase: 'running' },
        ]}
        isStreaming
        onCopy={() => {}}
        onRegenerate={() => {}}
      />,
    ),
  )
  const answers = [...host.querySelectorAll('[data-message-role="assistant"]')]
  expect(answers[1].querySelector('.chat-message-actions')).toBeNull()
  expect(answers[0].querySelector('.chat-message-actions')).not.toBeNull()
})
