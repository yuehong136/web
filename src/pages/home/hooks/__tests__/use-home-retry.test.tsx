import { act, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ChatMessage } from '../../types'
import { useHomeRetry } from '../use-home-retry'

const message = (
  id: string,
  role: ChatMessage['role'],
  content: string,
): ChatMessage => ({ id, role, content, timestamp: '' }) as ChatMessage

const thread = [
  message('a0', 'assistant', 'Hello'),
  message('q1', 'user', 'First question'),
  message('a1', 'assistant', 'First answer'),
  message('q2', 'user', 'Second question'),
  message('a2', 'assistant', ''),
]

let root: Root
let host: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

async function setup(send: Parameters<typeof useHomeRetry>[0]['send']) {
  const shown: ChatMessage[][] = []
  let retry!: (id: string) => boolean
  function Probe() {
    const messagesRef = useRef(thread)
    retry = useHomeRetry({
      messagesRef,
      updateMessages: (next) => {
        messagesRef.current = next
        shown.push(next)
      },
      send,
    })
    return null
  }
  await act(async () => root.render(<Probe />))
  return { shown, retry: (id: string) => retry(id) }
}

it('asks the newest question again in place of its failed answer', async () => {
  const send = vi.fn(() => Promise.resolve())
  const { shown, retry } = await setup(send)

  expect(retry('a2')).toBe(true)
  // The failed pair leaves; the send appends the question and a new answer.
  expect(shown.at(-1)?.map((item) => item.id)).toEqual(['a0', 'q1', 'a1'])
  expect(send).toHaveBeenCalledWith('Second question', [], {
    regenerate: true,
  })
})

it('only retries the newest answer and restores the thread when refused', async () => {
  const send = vi.fn((): false => false)
  const { shown, retry } = await setup(send)

  expect(retry('a1')).toBe(false)
  expect(send).not.toHaveBeenCalled()
  expect(retry('a2')).toBe(false)
  expect(shown.at(-1)).toBe(thread)
})
