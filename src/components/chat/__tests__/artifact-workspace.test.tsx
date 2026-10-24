import { act, useLayoutEffect, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ChatWorkspace } from '@/components/chat/chat-workspace'
import { useChatWorkspace } from '@/components/chat/chat-workspace-context'
import { MessageParts } from '@/components/chat/message-parts'
import { setProductLanguage } from '@/locales/i18n'
import { useAuthStore } from '@/stores/auth'
import { stubChatDOM } from '@/components/chat/__tests__/chat-dom'
import type { ReferenceChunk } from '@/utils/reference-replacer'

// The real resource state, markdown and preview panel run inside a stable layout.
// Browser sizing, focus and the native sheet are verified by the layout lane.
vi.mock('@/components/layout/ai-workspace', () => ({
  AiWorkspace: ({
    children,
    detail,
    open,
  }: {
    children: ReactNode
    detail: ReactNode
    open: boolean
  }) => (
    <div>
      <main>{children}</main>
      {open && detail}
    </div>
  ),
}))
vi.mock('../reference-detail-panel', () => ({
  ReferenceDetailPanel: ({ chunk }: { chunk: ReferenceChunk }) => (
    <div data-reference-chunk={chunk.id}>
      <div data-context-panel-body>{chunk.content}</div>
    </div>
  ),
}))
vi.mock('@ant-design/x', () => ({ Mermaid: () => null }))
vi.mock('react-shiki/core', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))

const artifactUrl = (name: string) =>
  `/api/v1/documents/artifact/${name}?run_id=run-1`
const fileResponse = (contents: string, name: string, type: string) =>
  new Response(contents, {
    headers: {
      'content-type': type,
      'content-disposition': `inline; filename="${name}"`,
    },
  })
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
let root: Root
let host: HTMLDivElement
let objectUrlCount: number
let oldIdentity: ReturnType<typeof useAuthStore.getState>
let originalCreate: PropertyDescriptor | undefined
let originalRevoke: PropertyDescriptor | undefined
const fetchFile = vi.fn<typeof fetch>()
const revoked = vi.fn()
const chunk: ReferenceChunk = {
  id: 'source-1',
  content: 'Evidence remains selected',
  document_id: 'doc-1',
  document_name: 'Source.pdf',
  dataset_id: 'kb-1',
}
let workspace: NonNullable<ReturnType<typeof useChatWorkspace>>

function WorkspaceContents({
  name = 'report.json',
  messageId = 'message-1',
}: {
  name?: string
  messageId?: string
}) {
  const actions = useChatWorkspace()!
  useLayoutEffect(() => {
    workspace = actions
  }, [actions])
  return (
    <>
      <input aria-label="Draft" defaultValue="Keep my draft" />
      <button
        type="button"
        data-open-evidence
        onClick={() => actions.viewReference(chunk, [chunk], messageId)}
      >
        Evidence
      </button>
      <MessageParts
        messageId={messageId}
        content={`Result [Report](${artifactUrl(name)})`}
        run={{ phase: 'completed' }}
        onViewReference={() => {}}
      />
    </>
  )
}
const render = async (
  scope = 'thread-A',
  name = 'report.json',
  messageId = 'message-1',
) =>
  act(async () =>
    root.render(
      <ChatWorkspace scopeKey={scope}>
        <WorkspaceContents name={name} messageId={messageId} />
      </ChatWorkspace>,
    ),
  )
const click = async (selector: string) =>
  act(async () => {
    const target = host.querySelector<HTMLElement>(selector)
    expect(target).not.toBeNull()
    target!.click()
    await vi.dynamicImportSettled()
  })
const settle = () =>
  act(async () => {
    await vi.dynamicImportSettled()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

beforeEach(async () => {
  stubChatDOM()
  await setProductLanguage('en-US')
  oldIdentity = useAuthStore.getState()
  useAuthStore.setState({ token: 'identity-A' })
  fetchFile.mockReset()
  revoked.mockReset()
  objectUrlCount = 0
  vi.stubGlobal('fetch', fetchFile)
  originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
  originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => `blob:artifact-${++objectUrlCount}`),
  })
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revoked,
  })
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  useAuthStore.setState(oldIdentity)
  if (originalCreate)
    Object.defineProperty(URL, 'createObjectURL', originalCreate)
  else Reflect.deleteProperty(URL, 'createObjectURL')
  if (originalRevoke)
    Object.defineProperty(URL, 'revokeObjectURL', originalRevoke)
  else Reflect.deleteProperty(URL, 'revokeObjectURL')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('keeps stable message attribution and an unknown availability until authenticated preview opens', async () => {
  fetchFile.mockResolvedValue(
    fileResponse('{"answer":42}', 'report.json', 'application/json'),
  )
  await render()
  const card = host.querySelector('[data-artifact-card]')!
  const id = card.getAttribute('data-artifact-card')
  expect(card.getAttribute('data-artifact-message-id')).toBe('message-1')
  expect(card.textContent).toContain('Availability unknown')
  expect(fetchFile).not.toHaveBeenCalled()
  await act(async () => setProductLanguage('zh-CN'))
  expect(
    host
      .querySelector('[data-artifact-card]')
      ?.getAttribute('data-artifact-card'),
  ).toBe(id)
  await act(async () => setProductLanguage('en-US'))
  await click('[data-artifact-card]')
  expect(
    host.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
  ).toBe('Artifacts')
  expect(
    host
      .querySelector('[data-artifact-panel]')
      ?.getAttribute('data-artifact-state'),
  ).toBe('ready')
  expect(host.querySelector('pre')?.textContent).toBe('{"answer":42}')
  expect(host.textContent).not.toMatch(/Save|Revision/)
})

it('previews HTML only in a scriptless opaque sandbox with a restrictive resource policy', async () => {
  fetchFile.mockResolvedValue(
    fileResponse(
      '<h1>Report</h1><script>parent.stolen=true</script><img src="https://outside.example/track" onerror="alert(1)"><form action="https://outside.example"></form>',
      'report.html',
      'text/html',
    ),
  )
  await render('thread-A', 'report.html')
  await click('[data-artifact-card]')
  const iframe = host.querySelector('iframe')!
  expect(iframe.getAttribute('sandbox')).toBe('')
  expect(iframe.getAttribute('srcdoc')).toContain("default-src 'none'")
  expect(iframe.getAttribute('srcdoc')).toContain('Report')
  expect(iframe.getAttribute('srcdoc')).not.toMatch(/<script|onerror=|<form/)
  expect(host.querySelector('h1')).toBeNull()
})

it('displays code and JSON as escaped text rather than application HTML', async () => {
  fetchFile.mockResolvedValue(
    fileResponse('<img src=x onerror=alert(1)>', 'report.tsx', 'text/plain'),
  )
  await render('thread-A', 'report.tsx')
  await click('[data-artifact-card]')
  expect(host.querySelector('pre code')?.textContent).toContain(
    '<img src=x onerror=alert(1)>',
  )
  expect(host.querySelector('[data-artifact-panel] img')).toBeNull()
})

it('shares the ready preview blob with download and revokes its image URL on close', async () => {
  fetchFile.mockResolvedValue(
    fileResponse('safe raster bytes', 'chart.png', 'image/png'),
  )
  await render('thread-A', 'chart.png')
  const input = host.querySelector('input')!
  await click('[data-artifact-card]')
  expect(
    host.querySelector('[data-artifact-panel] img')?.getAttribute('src'),
  ).toBe('blob:artifact-1')
  await click('[data-artifact-panel] button:not([aria-label])')
  expect(fetchFile).toHaveBeenCalledTimes(1)
  expect(revoked).toHaveBeenCalledWith('blob:artifact-2')
  await click('button[aria-label="Return to answer"]')
  expect(revoked).toHaveBeenCalledWith('blob:artifact-1')
  expect(host.querySelector('[data-artifact-panel]')).toBeNull()
  expect(host.querySelector('input')).toBe(input)
  expect(input.value).toBe('Keep my draft')
})

it('aborts a closed pending preview and ignores a late response without creating a blob URL', async () => {
  const pending = deferred<Response>()
  fetchFile.mockReturnValue(pending.promise)
  await render('thread-A', 'chart.png')
  await click('[data-artifact-card]')
  const signal = fetchFile.mock.calls[0][1]?.signal
  await click('button[aria-label="Return to answer"]')
  expect(signal?.aborted).toBe(true)
  await act(async () =>
    pending.resolve(fileResponse('late bytes', 'chart.png', 'image/png')),
  )
  await settle()
  expect(objectUrlCount).toBe(0)
  expect(host.querySelector('[data-artifact-panel]')).toBeNull()
  expect(host.querySelector('.markdown-content')?.textContent).toContain(
    'Result',
  )
})

it('switching resources invalidates the previous request and keeps the new preview', async () => {
  const old = deferred<Response>()
  fetchFile
    .mockReturnValueOnce(old.promise)
    .mockResolvedValueOnce(fileResponse('New body', 'second.txt', 'text/plain'))
  await render('thread-A', 'first.png')
  await click('[data-artifact-card]')
  const signal = fetchFile.mock.calls[0][1]?.signal
  await render('thread-A', 'second.txt')
  await click('[data-artifact-card]')
  expect(signal?.aborted).toBe(true)
  await act(async () =>
    old.resolve(fileResponse('Old body', 'first.png', 'image/png')),
  )
  await settle()
  expect(host.querySelector('[data-artifact-panel] pre')?.textContent).toBe(
    'New body',
  )
  expect(objectUrlCount).toBe(0)
})

it.each(['thread', 'identity', 'identity-cycle'] as const)(
  'clears the selection and aborts old bytes on %s change',
  async (change) => {
    const pending = deferred<Response>()
    fetchFile.mockReturnValue(pending.promise)
    await render('thread-A', 'chart.png')
    await click('[data-artifact-card]')
    const oldActions = workspace
    const signal = fetchFile.mock.calls[0][1]?.signal
    if (change === 'thread') await render('thread-B', 'chart.png')
    else
      await act(async () => {
        useAuthStore.setState({ token: 'identity-B' })
        if (change === 'identity-cycle')
          useAuthStore.setState({ token: 'identity-A' })
      })
    expect(signal?.aborted).toBe(true)
    expect(host.querySelector('[data-workspace-resources]')).toBeNull()
    await act(async () => {
      oldActions.viewReference(chunk, [chunk])
      pending.resolve(
        fileResponse('Private old image', 'chart.png', 'image/png'),
      )
    })
    await settle()
    expect(host.querySelector('[data-workspace-resources]')).toBeNull()
    expect(objectUrlCount).toBe(0)
  },
)

it.each([
  [403, 'You do not have access to this artifact.'],
  [404, 'This artifact is unavailable.'],
  [500, 'Could not load this artifact.'],
] as const)(
  'renders fixed safe feedback for HTTP %s without replacing the message',
  async (status, text) => {
    fetchFile.mockResolvedValue(
      new Response(JSON.stringify({ message: 'sensitive backend details' }), {
        status,
        headers: { 'content-type': 'application/json' },
      }),
    )
    await render()
    await click('[data-artifact-card]')
    expect(
      host.querySelector('[data-artifact-panel] [role="alert"]')?.textContent,
    ).toBe(text)
    expect(host.textContent).not.toContain('sensitive backend details')
    expect(host.querySelector('.markdown-content')?.textContent).toContain(
      'Result',
    )
  },
)

it('leaves SVG and unknown types as a download fallback and keeps failed downloads recoverable', async () => {
  fetchFile
    .mockRejectedValueOnce(new Error('private network details'))
    .mockResolvedValueOnce(
      fileResponse('Binary content', 'report.bin', 'application/octet-stream'),
    )
  await render('thread-A', 'report.bin')
  await click('[data-artifact-card]')
  expect(host.textContent).toContain('Preview is unavailable for this format.')
  expect(fetchFile).not.toHaveBeenCalled()
  await click('[data-artifact-panel] button:not([aria-label])')
  expect(host.textContent).toContain('Could not load this artifact.')
  expect(host.textContent).not.toContain('private network details')
  await click('[data-artifact-panel] button:not([aria-label])')
  expect(fetchFile).toHaveBeenCalledTimes(2)
  expect(host.textContent).not.toContain('Could not load this artifact.')
  expect(host.querySelector('.markdown-content')?.textContent).toContain(
    'Result',
  )
})

it('keeps evidence, artifact and their scroll positions while tabs change with mouse or keyboard', async () => {
  fetchFile.mockResolvedValue(
    fileResponse('Code body', 'report.txt', 'text/plain'),
  )
  await render('thread-A', 'report.txt')
  await click('[data-open-evidence]')
  const source = host.querySelector<HTMLElement>(
    '[data-reference-chunk] [data-context-panel-body]',
  )!
  source.scrollTop = 87
  await click('[data-artifact-card]')
  const artifactPanel = host.querySelector<HTMLElement>(
    '[data-artifact-panel] [data-context-panel-body]',
  )!
  artifactPanel.scrollTop = 123
  const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')]
  await act(async () =>
    tabs[1].dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    ),
  )
  expect(tabs[0].getAttribute('aria-selected')).toBe('true')
  expect(document.activeElement).toBe(tabs[0])
  expect(
    host.querySelector('[data-reference-chunk] [data-context-panel-body]'),
  ).toBe(source)
  expect(source.scrollTop).toBe(87)
  await act(async () => tabs[1].click())
  expect(
    host.querySelector('[data-artifact-panel] [data-context-panel-body]'),
  ).toBe(artifactPanel)
  expect(artifactPanel.scrollTop).toBe(123)
  expect(fetchFile).toHaveBeenCalledTimes(1)
})

it('revokes a ready image synchronously on an identity cycle with no duplicate release', async () => {
  fetchFile.mockResolvedValue(
    fileResponse('Raster bytes', 'chart.png', 'image/png'),
  )
  await render('thread-A', 'chart.png')
  await click('[data-artifact-card]')
  await act(async () => {
    useAuthStore.setState({ token: 'identity-B' })
    expect(revoked).toHaveBeenCalledWith('blob:artifact-1')
    useAuthStore.setState({ token: 'identity-A' })
  })
  expect(
    revoked.mock.calls.filter(([url]) => url === 'blob:artifact-1'),
  ).toHaveLength(1)
  expect(host.querySelector('[data-artifact-panel]')).toBeNull()
})

it('aborts a pending download on close and discards its late bytes', async () => {
  const pending = deferred<Response>()
  fetchFile.mockReturnValue(pending.promise)
  await render('thread-A', 'report.bin')
  await click('[data-artifact-card]')
  await click('[data-artifact-panel] button:not([aria-label])')
  const signal = fetchFile.mock.calls[0][1]?.signal
  await click('button[aria-label="Return to answer"]')
  expect(signal?.aborted).toBe(true)
  await act(async () =>
    pending.resolve(
      fileResponse('Late file', 'report.bin', 'application/octet-stream'),
    ),
  )
  await settle()
  expect(objectUrlCount).toBe(0)
  expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled()
  expect(host.querySelector('.markdown-content')?.textContent).toContain(
    'Result',
  )
})

it('projects markdown artifact images into the same message-linked card surface', async () => {
  await act(async () =>
    root.render(
      <ChatWorkspace scopeKey="thread-A">
        <MessageParts
          messageId="image-message"
          content={`![Chart](${artifactUrl('chart.png')})`}
          run={{ phase: 'completed' }}
          onViewReference={() => {}}
        />
      </ChatWorkspace>,
    ),
  )
  expect(
    host
      .querySelector('[data-artifact-card]')
      ?.getAttribute('data-artifact-message-id'),
  ).toBe('image-message')
  expect(host.querySelector('main img')).toBeNull()
  expect(fetchFile).not.toHaveBeenCalled()
})

it('never embeds an SVG response disguised as a raster file and reuses its bytes for download', async () => {
  fetchFile.mockResolvedValue(
    fileResponse('<svg onload="alert(1)"/>', 'chart.png', 'image/svg+xml'),
  )
  await render('thread-A', 'chart.png')
  await click('[data-artifact-card]')
  expect(host.querySelector('[data-artifact-panel] img')).toBeNull()
  expect(host.querySelector('[data-artifact-panel] iframe')).toBeNull()
  expect(host.textContent).toContain('Preview is unavailable for this format.')
  await click('[data-artifact-panel] button:not([aria-label])')
  expect(fetchFile).toHaveBeenCalledTimes(1)
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
})

it('permanently invalidates old resource callbacks after thread A to B to A', async () => {
  await render('thread-A')
  const oldActions = workspace
  await render('thread-B')
  await render('thread-A')
  await act(async () => {
    oldActions.viewReference(chunk, [chunk])
    oldActions.viewArtifact({
      id: 'old-artifact',
      messageId: 'old-message',
      name: 'report.json',
      url: artifactUrl('report.json'),
      state: 'unknown',
      capabilities: { preview: true, download: true },
    })
  })
  expect(host.querySelector('[data-workspace-resources]')).toBeNull()
  expect(fetchFile).not.toHaveBeenCalled()
})
