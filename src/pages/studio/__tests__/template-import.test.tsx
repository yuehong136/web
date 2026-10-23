import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi, type Mock } from 'vitest'
import { ImportTemplateDialog } from '../components/ImportTemplateDialog'
import { changeLanguage } from '@/locales/i18n'
import { stubNativeDialog } from '@/components/ui/__tests__/native-dialog'
const api = vi.hoisted(() => ({ importTemplates: vi.fn() }))
const toast = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
}))
vi.mock('@/api/dialog', () => ({ dialogAPI: api }))
vi.mock('@/lib/toast', () => ({ toast }))
let root: Root
let container: HTMLDivElement
let client: QueryClient
let nativeDialog: ReturnType<typeof stubNativeDialog>
let close: Mock<() => void>
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20))
  })
const button = (text: string) =>
  [...document.querySelectorAll<HTMLButtonElement>('button')].find(
    (element) => element.textContent === text,
  )!
async function choose(content: string, name = 'template.json') {
  const file = new File([content], name, { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: async () => content })
  const input = document.querySelector<HTMLInputElement>('input[type=file]')!
  Object.defineProperty(input, 'files', { configurable: true, value: [file] })
  await act(async () =>
    input.dispatchEvent(new Event('change', { bubbles: true })),
  )
  return file
}
beforeEach(async () => {
  nativeDialog = stubNativeDialog()
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.clearAllMocks()
  await changeLanguage('en-US')
  close = vi.fn<() => void>()
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <ImportTemplateDialog isOpen onClose={close} />
      </QueryClientProvider>,
    ),
  )
})
afterEach(async () => {
  await act(async () => root.unmount())
  client.clear()
  container.remove()
  nativeDialog.restore()
})
it('shows actual partial-import counts and safe guidance without exposing raw errors or warnings', async () => {
  api.importTemplates.mockResolvedValue({
    total: 2,
    imported: [
      { id: 'ok', name: 'Ready', warnings: ['private-provider-settings'] },
    ],
    failed: [{ name: 'Broken', error: 'private-server-trace' }],
  })
  await choose(JSON.stringify({ format: 'multirag_dialog_template', app: {} }))
  await act(async () => button('Import templates').click())
  await settle()
  expect(document.body.textContent).toContain('Imported: 1. Failed: 1.')
  expect(document.body.textContent).toContain('Broken')
  expect(document.body.textContent).not.toContain('private-provider-settings')
  expect(document.body.textContent).not.toContain('private-server-trace')
  expect(toast.success).not.toHaveBeenCalled()
  expect(close).not.toHaveBeenCalled()
  expect(button('Choose a template file')).toBeTruthy()
})
it('retains a failed file for explicit retry and does not report zero imports as success', async () => {
  api.importTemplates
    .mockRejectedValueOnce(new Error('private-import-error'))
    .mockResolvedValue({ total: 0, imported: [], failed: [] })
  const file = await choose(
    JSON.stringify({ format: 'multirag_dialog_template', app: {} }),
  )
  await act(async () => button('Import templates').click())
  await settle()
  expect(document.body.textContent).toContain('Your file is kept')
  expect(button('Import templates').disabled).toBe(false)
  await act(async () => button('Import templates').click())
  await settle()
  expect(api.importTemplates).toHaveBeenNthCalledWith(2, file)
  expect(toast.success).not.toHaveBeenCalled()
  expect(toast.info).toHaveBeenCalledExactlyOnceWith(
    'No apps were imported. Check the template file.',
  )
})
it('rejects unsupported JSON and unverifiable result totals without a fake completed view', async () => {
  await choose('{}')
  expect(document.body.textContent).toContain('not a supported app template')
  expect(button('Import templates').disabled).toBe(true)
  expect(api.importTemplates).not.toHaveBeenCalled()
  api.importTemplates.mockResolvedValue({ total: 3, imported: [], failed: [] })
  await choose(JSON.stringify({ format: 'multirag_dialog_template', app: {} }))
  await act(async () => button('Import templates').click())
  await settle()
  expect(document.body.textContent).toContain('result could not be verified')
  expect(document.body.textContent).not.toContain('Templates processed: 3')
})
