import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { ChatMessage } from '../../types'
import { ChatSection } from '../ChatSection'

// W4：[ID:n] → <sup>n</sup> → 角标；解析到的引用是按钮，编号与来源面板、详情侧栏
// 指向同一片段；解析不到的保留文本语义，渲染为不可交互的上标

// @ant-design/x and the code-block renderers pull syntax-highlighter styles
// Vitest cannot resolve. Citations only need each bubble's contentRender and the
// merge of custom markdown components.
vi.mock('@ant-design/x', () => {
  const Stub = () => null
  return {
    Bubble: {
      List: ({
        items = [],
      }: {
        items?: Array<{
          key: string
          content: string
          contentRender?: (content: string) => ReactNode
        }>
      }) => (
        <div>
          {items.map((item) => (
            <div key={item.key}>
              {item.contentRender?.(item.content) ?? item.content}
            </div>
          ))}
        </div>
      ),
    },
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
vi.mock('../ChatInputBox', () => ({ ChatInputBox: () => null }))
vi.mock('../SkillPanel', () => ({ SkillPanel: () => null }))
vi.mock('@/components/patterns/chat/chat-scroll-viewport', () => ({
  ChatScrollViewport: ({ children }: { children: ReactNode }) => (
    <div role="log">{children}</div>
  ),
}))

let root: Root
let container: HTMLDivElement

const chunk = (
  index: number,
  overrides: Partial<ReferenceChunk> = {},
): ReferenceChunk => ({
  id: `chunk-${index}`,
  content: `片段 ${index} 的内容`,
  document_id: 'doc-1',
  document_name: 'harness.pdf',
  dataset_id: 'kb-1',
  similarity: 0.62,
  ...overrides,
})

const answer = (
  content: string,
  references: ReferenceChunk[] = [],
): ChatMessage => ({
  id: 'answer-1',
  role: 'assistant',
  content,
  timestamp: '',
  references,
})

const render = (messages: ChatMessage[]) =>
  act(async () =>
    root.render(
      <ChatSection
        messages={messages}
        inputValue=""
        onInputChange={() => undefined}
        onSend={() => undefined}
        onStop={() => undefined}
        isStreaming={false}
        streamingContent=""
        isToolAnalyzing={false}
      />,
    ),
  )

// Radix 在超时里挂载/归还焦点
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

const markers = () => [...container.querySelectorAll<HTMLElement>('sup')]
const markerButtons = () =>
  [...container.querySelectorAll<HTMLButtonElement>('sup button')].map(
    (button) => button.textContent,
  )
const sheetTitle = () =>
  document.querySelector('[role="dialog"] h2')?.textContent ?? null
const buttonWithText = (scope: ParentNode, text: string) =>
  [...scope.querySelectorAll<HTMLButtonElement>('button')].find((button) =>
    button.textContent?.includes(text),
  )

beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  await setProductLanguage('zh-CN')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('renders citations it cannot resolve as plain superscripts, not raw markers or buttons', async () => {
  // 终帧前停止、历史引用对不上：消息没有引用数据
  await render([answer('依据[ID:0]，另见[ID:3]。')])

  expect(container.textContent).not.toContain('[ID:')
  expect(markers().map((sup) => sup.textContent)).toEqual(['1', '4'])
  expect(container.querySelector('sup button, sup [tabindex]')).toBeNull()
})

it('leaves answers without citation markers untouched', async () => {
  await render([answer('没有引用的回答，x<sup>2</sup> 保持原样。')])

  expect(markers().map((sup) => sup.textContent)).toEqual(['2'])
  expect(container.querySelector('sup button')).toBeNull()
})

it('numbers repeated, out-of-order and unknown citations by reference position', async () => {
  const references = [
    chunk(0),
    chunk(1),
    chunk(2, { document_id: 'doc-2', document_name: 'report.pdf' }),
    chunk(3),
  ]
  await render([answer('乙[ID:2]甲[ID:0][ID:0]丁[ID:3]缺[ID:9]。', references)])

  // 解析到的是按钮，编号取引用位置 + 1；越界的 [ID:9] 是不可交互的上标
  expect(markerButtons()).toEqual(['3', '1', '1', '4'])
  const unknown = markers().find((sup) => !sup.querySelector('button'))
  expect(unknown?.textContent).toBe('10')

  // 角标 3 指向 report.pdf：打开浮层，再从"详情"打开侧栏
  const marker = container.querySelector<HTMLButtonElement>('sup button')!
  await act(async () => marker.click())
  await settle()
  const popover = document.querySelector('[role="dialog"]')!
  expect(popover.textContent).toContain('report.pdf')
  expect(popover.textContent).toContain('片段 2 的内容')
  await act(async () => buttonWithText(popover, '详情')!.click())
  await settle()
  expect(sheetTitle()).toBe('report.pdf')
})

it('gives same-document chunks in the source panel the numbers their citations show', async () => {
  const references = [
    chunk(0),
    chunk(1, { document_id: 'doc-2', document_name: 'report.pdf' }),
    chunk(2),
  ]
  await render([answer('甲[ID:0]乙[ID:1]丙[ID:2]。', references)])
  expect(markerButtons()).toEqual(['1', '2', '3'])

  await act(async () => buttonWithText(container, '引用来源')!.click())
  // 同文档两段在 harness.pdf 下，编号仍是 1 和 3
  for (const [number, content] of [
    ['1', '片段 0 的内容'],
    ['2', '片段 1 的内容'],
    ['3', '片段 2 的内容'],
  ]) {
    const item = buttonWithText(container, content)!
    expect(item.textContent?.startsWith(number)).toBe(true)
  }

  await act(async () => buttonWithText(container, '片段 2 的内容')!.click())
  await settle()
  expect(sheetTitle()).toBe('harness.pdf')
  expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
    '片段 2 的内容',
  )
})
