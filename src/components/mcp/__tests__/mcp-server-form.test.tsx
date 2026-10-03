// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { MCPServerForm } from '@/components/mcp/MCPServerForm'
import i18n from '@/locales/i18n'
import type { MCPServer } from '@/types/mcp'

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
