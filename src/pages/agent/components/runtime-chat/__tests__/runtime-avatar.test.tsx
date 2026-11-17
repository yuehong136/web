import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { useCurrentUserAvatar } from '@/hooks/use-current-user-avatar'
import { useAuthStore } from '@/stores'
import { RuntimeChatMessageList } from '../runtime-chat-message-list'
import { AgentRuntimeStatus } from '../../../features/runtime-workbench/types'

vi.mock('@/components/chat/MarkdownCodeBlock', () => ({
  mergeMarkdownComponents: () => ({}),
  useMarkdownComponents: () => ({}),
  markdownConfig: {},
}))
vi.mock('@/components/chat/streaming-x-markdown', () => ({
  StreamingXMarkdown: () => null,
}))

const account = {
  id: 'signed-in',
  nickname: 'Alice',
  email: 'alice@example.test',
  username: 'alice',
  tenant_id: 'tenant',
  is_active: true,
  created_at: '',
  updated_at: '',
}

let root: Root
let container: HTMLDivElement
/** The speaker's avatar beside the question. */
const avatar = () => container.querySelector('.chat-message-avatar')!
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  useAuthStore.setState({
    user: account,
    isAuthenticated: true,
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  useAuthStore.setState({ user: null, isAuthenticated: false })
})

function Transcript({
  owned = false,
  authorId,
}: {
  owned?: boolean
  authorId?: string
}) {
  const user = useCurrentUserAvatar()
  return (
    <RuntimeChatMessageList
      canvasId="canvas"
      messages={[
        { id: 'question', role: 'user', content: 'Question', authorId },
      ]}
      status={AgentRuntimeStatus.IDLE}
      onSubmitAwaitingInputs={() => {}}
      userId={user.seed}
      userAvatar={owned ? <EntityAvatar {...user} shape="circle" /> : undefined}
    />
  )
}

it('renders and updates the signed-in monogram only when the caller owns the transcript', async () => {
  await act(async () => root.render(<Transcript owned authorId="signed-in" />))
  expect(avatar().textContent).toBe('A')
  await act(async () =>
    useAuthStore.setState({
      user: { ...account, nickname: '张三' },
    }),
  )
  expect(avatar().textContent).toBe('张')
  expect(avatar().querySelector('img')).toBeNull()
})

it('keeps anonymous share and unowned historical speakers neutral even while signed in', async () => {
  await act(async () => root.render(<Transcript />))
  expect(avatar().textContent).toBe('')
  expect(avatar().querySelector('svg.lucide-user')).not.toBeNull()
  expect(
    avatar().querySelector('[data-slot="entity-avatar"]')?.className,
  ).toContain('rounded-full')
})

it('does not relabel another author or legacy history with the current account', async () => {
  for (const authorId of ['another-user', undefined]) {
    await act(async () => root.render(<Transcript owned authorId={authorId} />))
    expect(avatar().textContent).toBe('')
    expect(avatar().querySelector('svg.lucide-user')).not.toBeNull()
  }
})
