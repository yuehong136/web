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
    expect(container.textContent).toContain('思考中...')
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
    expect(container.textContent).toContain('思考过程')
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
    expect(container.textContent).toContain('思考过程')
    expect(
      container.querySelector('.markdown-content')?.textContent?.trim(),
    ).toBe('结果一致')
  })

  it('shows the shared three-dot waiting indicator only during active generation', async () => {
    await act(async () =>
      root.render(
        <PreviewAnswer content="" isStreaming onViewReference={() => {}} />,
      ),
    )
    expect(container.querySelectorAll('.ant-bubble-dot-item')).toHaveLength(3)
    await act(async () =>
      root.render(
        <PreviewAnswer
          content=""
          isStreaming={false}
          onViewReference={() => {}}
        />,
      ),
    )
    expect(container.querySelector('.ant-bubble-dot-item')).toBeNull()
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
    vi.spyOn(conversationAPI, 'setConversation').mockResolvedValue({
      id: 'conversation-1',
    } as Awaited<ReturnType<typeof conversationAPI.setConversation>>)
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
    expect(container.textContent).toContain('引用来源')
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
    const sources = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes('引用来源'),
    )!
    expect(sources.getAttribute('aria-expanded')).toBe('false')
    await act(async () => sources.click())
    expect(sources.getAttribute('aria-expanded')).toBe('true')
    const detail = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent?.includes(chunk.content!),
    )!
    expect(detail.textContent).not.toContain('0%')
    await act(async () => detail.click())
    expect(view).toHaveBeenCalledWith(chunk, [chunk])
    await act(async () => setProductLanguage('en-US'))
    expect(sources.textContent).toContain('Sources')
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
    expect(container.textContent).not.toContain('引用来源')
  })
})
