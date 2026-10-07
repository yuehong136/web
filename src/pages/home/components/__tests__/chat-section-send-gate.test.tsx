import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import { ChatSection } from '../ChatSection'

// W1：历史载入期间发送会被拒绝，发送按钮要一并禁用；切换应用、技能或模型仍可进行，
// 所以只禁用发送、不锁定范围。流式与发送准备期间仍由 scopeLocked 锁定

interface InputBoxProps {
  scopeLocked?: boolean
  sendBlocked?: boolean
}

let inputBox: InputBoxProps | undefined

// 与 chat-section-citations 相同：@ant-design/x 与代码块渲染器会拉入 Vitest
// 解析不了的样式，这里只关心传给输入框的发送能力
vi.mock('@ant-design/x', () => {
  const Stub = () => null
  return {
    Bubble: { List: Stub },
    Actions: Stub,
    Mermaid: Stub,
    Think: Stub,
    ThoughtChain: Stub,
  }
})
vi.mock('@/components/chat/CodeBlock', () => ({ CodeBlock: () => null }))
vi.mock('@/components/chat/MarkdownCodeBlock', () => ({
  markdownConfig: {},
  getMarkdownStreamingOptions: (isStreaming: boolean) => ({
    hasNextChunk: isStreaming,
  }),
  mergeMarkdownComponents: (components?: object) => components ?? {},
  useMarkdownComponents: (components?: object) => components ?? {},
}))
vi.mock('@/hooks/use-llm-request', () => ({
  useFetchMyLLMs: () => ({ myLLMs: {}, isLoading: false }),
}))
vi.mock('../ChatInputBox', () => ({
  ChatInputBox: (props: InputBoxProps) => {
    inputBox = props
    return null
  },
}))
vi.mock('../SkillPanel', () => ({ SkillPanel: () => null }))
vi.mock('@/components/patterns/chat/chat-scroll-viewport', () => ({
  ChatScrollViewport: ({ children }: { children: ReactNode }) => (
    <div role="log">{children}</div>
  ),
}))

let root: Root
let container: HTMLDivElement

const render = (props: {
  isLoadingHistory?: boolean
  isStreaming?: boolean
  isSendPending?: boolean
}) =>
  act(async () =>
    root.render(
      <ChatSection
        messages={[]}
        inputValue="下一条草稿"
        onInputChange={() => undefined}
        onSend={() => undefined}
        onStop={() => undefined}
        isStreaming={false}
        streamingContent=""
        isToolAnalyzing={false}
        {...props}
      />,
    ),
  )

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  await setProductLanguage('zh-CN')
  inputBox = undefined
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('blocks send without locking the scope while history loads', async () => {
  await render({ isLoadingHistory: true })
  expect(inputBox).toMatchObject({ sendBlocked: true, scopeLocked: false })

  await render({ isLoadingHistory: false })
  expect(inputBox).toMatchObject({ sendBlocked: false, scopeLocked: false })
})

it('keeps send preparation and streaming on the scope lock', async () => {
  await render({ isSendPending: true })
  expect(inputBox).toMatchObject({ sendBlocked: false, scopeLocked: true })

  await render({ isStreaming: true })
  expect(inputBox).toMatchObject({ sendBlocked: false, scopeLocked: true })
})
