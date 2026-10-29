// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { MCPServerForm } from '@/components/mcp/MCPServerForm'
import i18n from '@/locales/i18n'
import { MCP_SERVER_TYPES, type MCPServer } from '@/types/mcp'
import { toast } from '@/lib/toast'

const api = vi.hoisted(() => ({
  createServer: vi.fn(),
  updateServer: vi.fn(),
  testConnection: vi.fn(),
}))
vi.mock('@/api/mcp', () => ({ mcpAPI: api }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
let root: Root
let container: HTMLDivElement
const onSuccess = vi.fn()
const onCancel = vi.fn()
const existing = {
  id: 'server',
  name: 'Example server',
  url: 'https://example.com/mcp',
  server_type: 'streamable-http',
  headers: { Authorization: 'fixture' },
  variables: { options: { count: 2 } },
} as MCPServer
beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  api.createServer.mockResolvedValue(undefined)
  api.updateServer.mockResolvedValue(undefined)
  api.testConnection.mockResolvedValue([])
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <MCPServerForm
        server={existing}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})
const tab = (name: string) =>
  Array.from(
    container.querySelectorAll<HTMLButtonElement>('[role="tab"]'),
  ).find((element) => element.textContent?.startsWith(name))!
const click = (element: HTMLElement) =>
  act(async () => {
    if (element.getAttribute('role') === 'tab')
      element.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      )
    else element.click()
  })
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })

it('uses native arrow-key tabs and preserves draft headers and JSON variables across panel changes', async () => {
  tab('Basic').focus()
  await act(async () =>
    tab('Basic').dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    ),
  )
  await settle()
  expect(tab('Headers').getAttribute('aria-selected')).toBe('true')
  const value = container.querySelector<HTMLTextAreaElement>('textarea')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      'value',
    )!.set!.call(value, 'fixture-updated')
    value.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await click(tab('Variables'))
  expect(container.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe(
    '{"count":2}',
  )
  await click(tab('Basic'))
  await click(tab('Headers'))
  expect(container.querySelector<HTMLTextAreaElement>('textarea')?.value).toBe(
    'fixture-updated',
  )
  await act(async () =>
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(api.updateServer).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      mcp_id: 'server',
      headers: { Authorization: 'fixture-updated' },
      variables: { options: { count: 2 } },
    }),
  )
  expect(onSuccess).toHaveBeenCalledOnce()
  expect(api.createServer).not.toHaveBeenCalled()
})

it('localizes the complete configuration flow and exposes a named close action', async () => {
  await act(async () => i18n.changeLanguage('zh-CN'))
  expect(container.textContent).toContain('编辑 MCP 服务器')
  expect(tab('基本配置')).toBeTruthy()
  expect(container.querySelector('label[for]')?.textContent).toContain(
    '服务器名称',
  )
  const close = container.querySelector<HTMLElement>(
    'button[aria-label="关闭"]',
  )!
  await click(close)
  expect(onCancel).toHaveBeenCalledOnce()
  expect(api.updateServer).not.toHaveBeenCalled()
})

it('offers the two protocols supported by the production API', () => {
  expect(MCP_SERVER_TYPES).toEqual(['sse', 'streamable-http'])
  expect(
    Array.from(container.querySelectorAll('button[aria-pressed]')).map(
      (element) => element.textContent,
    ),
  ).toEqual([
    'Streamable HTTPStreamable HTTP transport',
    'SSEServer-sent events',
  ])
})

it.each(['en-US', 'zh-CN'])(
  'sends seconds for a preview test and keeps a safe failure with the draft in %s',
  async (language) => {
    await act(async () => i18n.changeLanguage(language))
    api.testConnection.mockRejectedValueOnce(new Error('private-credential'))
    await click(tab(i18n.t('mcp.form.test')))
    await click(
      Array.from(container.querySelectorAll<HTMLButtonElement>('button')).find(
        (element) => element.textContent === i18n.t('mcp.form.startTest'),
      )!,
    )
    expect(api.testConnection).toHaveBeenCalledExactlyOnceWith({
      url: existing.url,
      server_type: 'streamable-http',
      headers: existing.headers,
      variables: existing.variables,
      timeout: 10,
    })
    expect(container.textContent).toContain(i18n.t('mcp.form.testFailed'))
    expect(container.textContent).not.toContain('private-credential')
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      i18n.t('mcp.form.testFailed'),
    )
    expect(onSuccess).not.toHaveBeenCalled()
    await click(tab(i18n.t('mcp.form.basic')))
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe(
      existing.name,
    )
    await click(tab(i18n.t('mcp.form.headers')))
    expect(
      container.querySelector<HTMLTextAreaElement>('textarea')?.value,
    ).toBe('fixture')
  },
)

it.each(['en-US', 'zh-CN'])(
  'keeps the edit open and reports a localized save failure in %s',
  async (language) => {
    await act(async () => i18n.changeLanguage(language))
    api.updateServer.mockRejectedValueOnce(new Error('private-sql-secret'))
    await act(async () =>
      container
        .querySelector('form')!
        .dispatchEvent(
          new Event('submit', { bubbles: true, cancelable: true }),
        ),
    )
    expect(onSuccess).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledExactlyOnceWith(
      i18n.t('mcp.form.updateFailed'),
    )
    expect(container.textContent).not.toContain('private-sql-secret')
    expect(container.querySelector<HTMLInputElement>('input')?.value).toBe(
      existing.name,
    )
  },
)

it('keeps the new server draft when creation fails without displaying the response', async () => {
  await act(async () =>
    root.render(<MCPServerForm onSuccess={onSuccess} onCancel={onCancel} />),
  )
  api.createServer.mockRejectedValueOnce(new Error('private-provider-response'))
  await act(async () => {
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!
    for (const [input, value] of [
      [container.querySelector<HTMLInputElement>('input')!, 'New server'],
      [
        container.querySelector<HTMLInputElement>(
          'input[placeholder="http://localhost:3000/mcp"]',
        )!,
        existing.url,
      ],
    ] as const) {
      setValue.call(input, value)
      input.dispatchEvent(new Event('input', { bubbles: true }))
    }
  })
  await act(async () =>
    container
      .querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  )
  expect(api.createServer).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({ name: 'New server', url: existing.url }),
  )
  expect(toast.error).toHaveBeenCalledExactlyOnceWith(
    i18n.t('mcp.form.createFailed'),
  )
  expect(onSuccess).not.toHaveBeenCalled()
  expect(container.textContent).not.toContain('private-provider-response')
  expect(container.querySelector<HTMLInputElement>('input')?.value).toBe(
    'New server',
  )
})
