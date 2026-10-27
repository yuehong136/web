import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { afterEach, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client'
import { useTestDataSource } from '@/hooks/use-datasource-request'
import { createQueryClient } from '@/lib/query-client'
import { changeLanguage } from '@/locales/i18n'

const mocks = vi.hoisted(() => ({
  test: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}))
vi.mock('@/api/datasource', async (original) => {
  const actual = await original<typeof import('@/api/datasource')>()
  return {
    ...actual,
    datasourceAPI: {
      ...actual.datasourceAPI,
      connector: { ...actual.datasourceAPI.connector, test: mocks.test },
    },
  }
})
vi.mock('@/lib/toast', () => ({
  toast: { success: mocks.success, error: mocks.error },
}))
afterEach(() => vi.clearAllMocks())

it('tests only on demand, disables the action while pending, and gives safe localized success/failure feedback', async () => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  await changeLanguage('en-US')
  const notifyMutationError = vi.fn()
  const client = createQueryClient({ notifyMutationError })
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  function Harness() {
    const { handleTest, isTesting } = useTestDataSource('saved-connector')
    return (
      <button onClick={handleTest} disabled={isTesting}>
        {isTesting ? 'pending' : 'test'}
      </button>
    )
  }
  let finish!: (value: { message: string }) => void
  mocks.test.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  try {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    )
    expect(mocks.test).not.toHaveBeenCalled()
    const button = container.querySelector('button')!
    await act(async () => button.click())
    expect(mocks.test).toHaveBeenCalledExactlyOnceWith('saved-connector')
    await act(async () => new Promise((resolve) => setTimeout(resolve, 5)))
    expect(button.disabled).toBe(true)
    await act(async () =>
      finish({ message: 'do not render arbitrary backend text' }),
    )
    await act(async () => new Promise((resolve) => setTimeout(resolve, 5)))
    expect(button.disabled).toBe(false)
    expect(mocks.success).toHaveBeenCalledWith('Connection successful.')
    mocks.test.mockRejectedValueOnce(
      new APIError(200, '102', 'secret-token-must-not-render'),
    )
    await act(async () => button.click())
    await act(async () => new Promise((resolve) => setTimeout(resolve, 5)))
    expect(mocks.error).toHaveBeenCalledWith(
      'Connection test failed. Check the saved URL, authentication and response mapping.',
    )
    expect(JSON.stringify(mocks.error.mock.calls)).not.toContain('secret-token')
    expect(notifyMutationError).not.toHaveBeenCalled()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  } finally {
    await act(async () => root.unmount())
    client.clear()
    container.remove()
  }
})
