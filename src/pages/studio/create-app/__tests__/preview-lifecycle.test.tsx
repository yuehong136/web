import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import { setProductLanguage } from '@/locales/i18n'
import { createInitialConfig } from '../constants'
import { useCreateAppPreview } from '../hooks/use-create-app-preview'
import type { AppConfig } from '../types'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const sse = (answer: string) =>
  new Response(
    `data: ${JSON.stringify({ retcode: 0, data: { answer, final: true } })}\n\ndata: ${JSON.stringify({ retcode: 0, data: true })}\n\n`,
    { headers: { 'content-type': 'text/event-stream' } },
  )
let root: Root
let container: HTMLDivElement
let preview!: ReturnType<typeof useCreateAppPreview>
let snapshot: AppConfig
function Harness({
  config = snapshot,
  id = 'app-1',
  canSend = true,
}: {
  config?: AppConfig
  id?: string
  canSend?: boolean
}) {
  const current = useCreateAppPreview({
    dialogId: id,
    savedConfig: config,
    canSend,
  })
  useEffect(() => {
    preview = current
  }, [current])
  return null
}
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  vi.spyOn(toast, 'error').mockImplementation(() => 1)
  snapshot = {
    ...createInitialConfig({ name: 'Test application' }),
    llm_id: 'model-1',
  }
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Studio preview request ownership', () => {
  it('locks sends while a conversation is being created', async () => {
    const pending = deferred<{ id: string }>()
    const create = vi
      .spyOn(conversationAPI, 'setConversation')
      .mockReturnValue(pending.promise)
    const complete = vi
      .spyOn(conversationAPI, 'completion')
      .mockResolvedValue(sse('answer'))
    await act(async () => root.render(<Harness />))
    await act(async () => preview.setInputValue('first'))
    let task!: Promise<void>
    await act(async () => {
      task = preview.handleSendPreviewMessage('first')
      await preview.handleSendPreviewMessage('second')
    })
    expect(preview.status).toBe('preparing')
    expect(create).toHaveBeenCalledOnce()
    await act(async () => preview.setInputValue('next message draft'))
    await act(async () => {
      pending.resolve({ id: 'conversation-1' })
      await task
    })
    expect(complete).toHaveBeenCalledOnce()
    expect(preview.status).toBe('completed')
    expect(preview.inputValue).toBe('next message draft')
  })
  it('ignores a late conversation after stop and reset', async () => {
    const pending = deferred<{ id: string }>()
    vi.spyOn(conversationAPI, 'setConversation').mockReturnValue(
      pending.promise,
    )
    const complete = vi.spyOn(conversationAPI, 'completion')
    await act(async () => root.render(<Harness />))
    let task!: Promise<void>
    await act(async () => {
      task = preview.handleSendPreviewMessage('first')
      preview.handleStopOutput()
      preview.handleResetPreview()
    })
    await act(async () => {
      pending.resolve({ id: 'late-conversation' })
      await task
    })
    expect(complete).not.toHaveBeenCalled()
    expect(preview.previewConversationId).toBeNull()
    expect(preview.status).toBe('idle')
    expect(preview.previewMessages).toHaveLength(1)
  })
  it('ignores a late completion after the conversation is reset', async () => {
    vi.spyOn(conversationAPI, 'setConversation').mockResolvedValue({
      id: 'conversation-1',
    })
    const pending = deferred<Response>()
    vi.spyOn(conversationAPI, 'completion').mockReturnValue(pending.promise)
    await act(async () => root.render(<Harness />))
    let task!: Promise<void>
    await act(async () => {
      task = preview.handleSendPreviewMessage('first')
    })
    await act(async () => preview.handleResetPreview())
    await act(async () => {
      pending.resolve(sse('late answer'))
      await task
    })
    expect(preview.previewMessages).toHaveLength(1)
    expect(preview.status).toBe('idle')
  })
  it('does not replace history when a new opener is saved', async () => {
    vi.spyOn(conversationAPI, 'setConversation').mockResolvedValue({
      id: 'conversation-1',
    })
    vi.spyOn(conversationAPI, 'completion').mockResolvedValue(sse('answer'))
    await act(async () => root.render(<Harness />))
    await act(async () => preview.handleSendPreviewMessage('first'))
    const messages = preview.previewMessages
    const changed = {
      ...snapshot,
      prompt_config: {
        ...snapshot.prompt_config,
        prologue: 'Different opener',
      },
    }
    await act(async () => root.render(<Harness config={changed} />))
    expect(preview.previewMessages).toEqual(messages)
    await act(async () => preview.handleResetPreview())
    expect(preview.previewMessages[0].content).toBe('Different opener')
  })
  it('blocks unsaved configurations and stale sessions even for direct calls', async () => {
    const create = vi.spyOn(conversationAPI, 'setConversation')
    await act(async () => root.render(<Harness canSend={false} />))
    await act(async () => preview.handleSendPreviewMessage('blocked'))
    expect(create).not.toHaveBeenCalled()
    await act(async () =>
      root.render(<Harness config={{ ...snapshot, llm_id: 'new-model' }} />),
    )
    await act(async () => preview.handleSendPreviewMessage('stale'))
    expect(create).not.toHaveBeenCalled()
  })
  it('does not reuse a session belonging to another application with identical settings', async () => {
    const create = vi
      .spyOn(conversationAPI, 'setConversation')
      .mockResolvedValue({ id: 'conversation-2' })
    vi.spyOn(conversationAPI, 'completion').mockResolvedValue(sse('answer'))
    await act(async () => root.render(<Harness />))
    await act(async () => root.render(<Harness id="app-2" />))
    await act(async () => preview.handleSendPreviewMessage('blocked'))
    expect(create).not.toHaveBeenCalled()
    await act(async () => preview.handleResetPreview())
    await act(async () => preview.handleSendPreviewMessage('new session'))
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ dialog_id: 'app-2' }),
    )
  })
  it('retries the last turn explicitly without duplicating the user message', async () => {
    vi.spyOn(conversationAPI, 'setConversation').mockResolvedValue({
      id: 'conversation-1',
    })
    const complete = vi
      .spyOn(conversationAPI, 'completion')
      .mockRejectedValueOnce(new Error('private error'))
      .mockResolvedValue(sse('retry answer'))
    await act(async () => root.render(<Harness />))
    await act(async () => preview.handleSendPreviewMessage('question'))
    expect(preview.status).toBe('failed')
    await act(async () => preview.handleRetryPreview())
    expect(
      preview.previewMessages.filter((message) => message.role === 'user'),
    ).toHaveLength(1)
    expect(preview.previewMessages.at(-1)?.content).toBe('retry answer')
    expect(complete.mock.calls[1][0].messages).toEqual([
      { role: 'user', content: 'question' },
    ])
  })
})
