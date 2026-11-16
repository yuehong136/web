import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { conversationAPI } from '@/api/conversation'
import { toast } from '@/lib/toast'
import { setProductLanguage } from '@/locales/i18n'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { PreviewAnswer } from '../components/preview-answer'
import { useCreateAppPreview } from '../hooks/use-create-app-preview'
import { createInitialConfig } from '../constants'

// Tool steps share CodeBlock; keep citations real without importing its browser CSS.
vi.mock('react-shiki/core', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))

// The code-block renderers pull syntax-highlighter styles Vitest cannot resolve;
// citations only need the merge of custom components.
vi.mock('@/components/chat/MarkdownCodeBlock', () => ({
  markdownConfig: {},
  getMarkdownStreamingOptions: (isStreaming: boolean) => ({
    hasNextChunk: isStreaming,
  }),
  useMarkdownComponents: (components?: object) => components ?? {},
}))

const chunk: ReferenceChunk = {
  id: 'chunk-0',
  content: 'HarnessX 在五个基准上评测。',
  document_id: 'doc-1',
  document_name: 'harness.html',
  dataset_id: 'kb-1',
}

const sse = (...frames: unknown[]) =>
  new Response(
    frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } },
  )

let root: Root
let container: HTMLDivElement

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
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('Studio preview citations', () => {
  it('uses the application reasoning surface for separate streamed reasoning', async () => {
    await act(async () =>
      root.render(
        <PreviewAnswer
          content=""
          thinking="先核对数据来源"
          isStreaming
          onViewReference={() => {}}
        />,
      ),
    )
    expect(container.textContent).toContain('正在思考…')
    const trigger = container.querySelector<HTMLButtonElement>(
      '[data-reasoning="thinking"] button',
    )!
    // Reasoning streams open; the reader can fold it and open it again
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.textContent).toContain('先核对数据来源')
    await act(async () => trigger.click())
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(container.textContent).not.toContain('先核对数据来源')
    await act(async () => trigger.click())
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.textContent).toContain('先核对数据来源')
    expect(container.querySelector('output[aria-label="加载中..."]')).toBeNull()
    await act(async () =>
      root.render(
        <PreviewAnswer
          content="完成分析"
          thinking="先核对数据来源"
          isStreaming={false}
          onViewReference={() => {}}
        />,
      ),
    )
    // One collapsed line: “已思考 N 秒”, timed on this device
    expect(trigger.textContent).toMatch(/^已思考 \d+ 秒$/)
    expect(container.querySelector('[data-run-phase="completed"]')).toBeNull()
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.textContent).toContain('先核对数据来源')
    expect(container.querySelector('.markdown-content')?.textContent).toContain(
      '完成分析',
    )
  })

  it('separates historical inline thinking from the final answer', async () => {
    await act(async () =>
      root.render(
        <PreviewAnswer
          content="<think>检查已保存配置</think>结果一致"
          isStreaming={false}
          onViewReference={() => {}}
        />,
      ),
    )
    // History has no observed timing, so the line reads only “已思考”
    expect(
      container.querySelector('[data-reasoning="complete"] button')
        ?.textContent,
    ).toBe('已思考')
    expect(container.querySelector('[data-run-phase="completed"]')).toBeNull()
    expect(
      container.querySelector('.markdown-content')?.textContent?.trim(),
    ).toBe('结果一致')
  })

  it('shows the shared thinking line only during active generation', async () => {
    await act(async () =>
      root.render(
        <PreviewAnswer content="" isStreaming onViewReference={() => {}} />,
      ),
    )
    expect(container.querySelector('output .text-shimmer')?.textContent).toBe(
      '正在思考…',
    )
    await act(async () =>
      root.render(
        <PreviewAnswer
          content=""
          isStreaming={false}
          onViewReference={() => {}}
        />,
      ),
    )
    expect(container.querySelector('output')).toBeNull()
  })
  it('attaches the final frame references to the streamed answer', async () => {
    let preview!: ReturnType<typeof useCreateAppPreview>
    function Surface() {
      const current = useCreateAppPreview({
        dialogId: 'dialog-1',
        canSend: true,
        savedConfig: {
          ...createInitialConfig({}),
          prompt_config: {
            ...createInitialConfig({}).prompt_config,
            prologue: '您好',
          },
        },
      })
      useEffect(() => {
        preview = current
      }, [current])
      return null
    }
    vi.spyOn(toast, 'error').mockImplementation(() => 1)
    vi.spyOn(conversationAPI, 'createConversation').mockResolvedValue({
      id: 'conversation-1',
      messages: [],
      reference: [],
    })
    vi.spyOn(conversationAPI, 'completion').mockResolvedValue(
      sse(
        { retcode: 0, data: { answer: '在五个基准上', reference: {} } },
        {
          retcode: 0,
          data: {
            answer: '在五个基准上评测 [ID:0]。',
            reference: { chunks: [chunk] },
            final: true,
          },
        },
        { retcode: 0, data: true },
      ),
    )

    await act(async () => root.render(<Surface />))
    await act(async () => preview.handleSendPreviewMessage('评测了哪些基准？'))

    const answer = preview.previewMessages.at(-1)
    expect(answer?.content).toBe('在五个基准上评测 [ID:0]。')
    expect(answer?.references).toEqual([chunk])
  })

  it('renders citation markers and sources instead of raw [ID:n] text', async () => {
    await act(async () =>
      root.render(
        <PreviewAnswer
          content="在五个基准上评测 [ID:0]。"
          references={[chunk]}
          isStreaming={false}
          onViewReference={() => undefined}
        />,
      ),
    )

    expect(container.textContent).not.toContain('[ID:0]')
    expect(container.querySelector('sup')).not.toBeNull()
    expect(container.querySelector('[data-source-strip]')).not.toBeNull()
  })

  it('opens lightweight sources and keeps document detail callbacks without inventing a score', async () => {
    const view = vi.fn()
    await act(async () =>
      root.render(
        <PreviewAnswer
          content="来源 [ID:0]"
          references={[chunk]}
          isStreaming={false}
          onViewReference={view}
        />,
      ),
    )
    // The shared source line under the answer; no score when none was returned
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>(
          '[data-source-strip] [data-source-toggle]',
        )!
        .click(),
    )
    const source = container.querySelector<HTMLButtonElement>(
      '[data-source-strip] [data-source-chunk]',
    )!
    expect(source.getAttribute('aria-label')).toBe('引用 1：harness.html')
    expect(source.textContent).not.toContain('%')
    await act(async () => source.click())
    expect(view).toHaveBeenCalledWith(chunk, [chunk], {
      cited: [chunk],
      messageId: undefined,
    })
    await act(async () => setProductLanguage('en-US'))
    expect(source.getAttribute('aria-label')).toBe('Citation 1: harness.html')
  })

  it('keeps the text unchanged until references arrive', async () => {
    await act(async () =>
      root.render(
        <PreviewAnswer
          content="在五个基准上评测 [ID:0]"
          isStreaming
          onViewReference={() => undefined}
        />,
      ),
    )

    expect(container.querySelector('sup')).toBeNull()
    expect(container.querySelector('[data-source-strip]')).toBeNull()
  })
})
