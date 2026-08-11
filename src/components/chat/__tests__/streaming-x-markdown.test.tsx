import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StreamingXMarkdown } from '../streaming-x-markdown'

vi.mock('@ant-design/x-markdown', async () => {
  const React = await import('react')

  return {
    default: React.memo(({ children }: { children?: string }) => (
      <div data-testid="markdown-output">{children}</div>
    )),
  }
})

vi.mock('../MarkdownCodeBlock', () => ({
  getMarkdownStreamingOptions: (isStreaming: boolean) => ({
    hasNextChunk: isStreaming,
  }),
}))

describe('StreamingXMarkdown', () => {
  let container: HTMLDivElement
  let root: Root
  let nextFrameId: number
  let frameCallbacks: Map<number, FrameRequestCallback>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    nextFrameId = 0
    frameCallbacks = new Map()

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      nextFrameId += 1
      frameCallbacks.set(nextFrameId, callback)
      return nextFrameId
    })
    vi.stubGlobal('cancelAnimationFrame', (frameId: number) => {
      frameCallbacks.delete(frameId)
    })
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it('coalesces a burst of streaming updates into the latest animation frame', async () => {
    await act(async () => {
      root.render(<StreamingXMarkdown content="chunk 0" isStreaming={true} />)
    })

    for (let index = 1; index <= 300; index += 1) {
      await act(async () => {
        root.render(
          <StreamingXMarkdown content={`chunk ${index}`} isStreaming={true} />,
        )
      })
    }

    expect(container.textContent).toBe('chunk 0')
    expect(frameCallbacks.size).toBe(1)

    const pendingCallbacks = [...frameCallbacks.values()]
    frameCallbacks.clear()
    await act(async () => {
      pendingCallbacks.forEach((callback) => callback(performance.now()))
    })

    expect(container.textContent).toBe('chunk 300')
  })

  it('renders completed content synchronously without scheduling a frame', async () => {
    await act(async () => {
      root.render(<StreamingXMarkdown content="complete" isStreaming={false} />)
    })

    expect(container.textContent).toBe('complete')
    expect(frameCallbacks.size).toBe(0)
  })
})
