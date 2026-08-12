import { act } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError } from '@/api/client-types'
import { useSetAgent, useUpdateAgentSetting } from '@/hooks/use-agent-mutation'
import { agentQueryKeys } from '@/hooks/use-agent-query'
import { createQueryClient } from '@/lib/query-client'
import { MutationErrorFeedback } from '@/lib/mutation-error-feedback'
import type { AgentFlow } from '@/types/agent'

const agentApiMock = vi.hoisted(() => ({
  setAgent: vi.fn(),
  updateSetting: vi.fn(),
}))
const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}))

vi.mock('@/api/agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/agent')>()
  return {
    ...actual,
    agentAPI: {
      ...actual.agentAPI,
      setAgent: agentApiMock.setAgent,
      updateSetting: agentApiMock.updateSetting,
    },
  }
})

vi.mock('@/lib/toast', () => ({
  toast: toastMock,
}))

type UpdateSettingMutation = ReturnType<typeof useUpdateAgentSetting>

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

describe('useSetAgent error feedback ownership', () => {
  async function runFailure(
    options: Parameters<typeof useSetAgent>[0],
    backendMessage = 'unsafe backend detail',
  ): Promise<number> {
    const notifyMutationError = vi.fn()
    const queryClient = createQueryClient({ notifyMutationError })
    const container = document.createElement('div')
    const root = createRoot(container)
    let mutation: ReturnType<typeof useSetAgent>

    function Harness() {
      mutation = useSetAgent(options)
      return null
    }

    document.body.append(container)
    agentApiMock.setAgent.mockRejectedValueOnce(
      new APIError(500, 'SERVER_ERROR', backendMessage),
    )

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      )
    })

    await act(async () => {
      await mutation.setAgent({ title: 'Agent' }).catch(() => undefined)
    })

    await act(async () => root.unmount())
    queryClient.clear()
    container.remove()
    return notifyMutationError.mock.calls.length
  }

  beforeEach(() => {
    agentApiMock.setAgent.mockReset()
    toastMock.success.mockReset()
    toastMock.error.mockReset()
  })

  it('keeps no-toast mutations globally visible unless explicitly silent', async () => {
    expect(await runFailure({ showToast: false })).toBe(1)
    expect(
      await runFailure({
        showToast: false,
        errorFeedback: MutationErrorFeedback.Silent,
      }),
    ).toBe(0)
    expect(await runFailure({ showToast: true })).toBe(0)
  })

  it('never renders backend error details from a locally owned mutation', async () => {
    const secret = 'database-password-do-not-render'

    await runFailure({ showToast: true }, secret)

    expect(toastMock.error).toHaveBeenCalledWith('保存失败')
    expect(JSON.stringify(toastMock.error.mock.calls)).not.toContain(secret)
  })
})

describe('useUpdateAgentSetting cache contract', () => {
  let container: HTMLDivElement
  let root: Root
  let queryClient: QueryClient
  let mutation: UpdateSettingMutation

  function Harness() {
    mutation = useUpdateAgentSetting()
    return null
  }

  beforeEach(async () => {
    agentApiMock.updateSetting.mockReset()
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <Harness />
        </QueryClientProvider>,
      )
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await act(async () => root.unmount())
    queryClient.clear()
    container.remove()
  })

  it('writes the detail cache and invalidates detail and list after success', async () => {
    const id = 'agent-1'
    const detailKey = agentQueryKeys.detail(id)
    queryClient.setQueryData(detailKey, {
      id,
      title: 'Old title',
      description: 'Old description',
      avatar: 'old-avatar.svg',
      permission: 'read',
    } as AgentFlow)
    agentApiMock.updateSetting.mockResolvedValue(true)
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    await act(async () => {
      await mutation.updateAgentSetting({
        id,
        title: 'New title',
        description: 'New description',
      })
    })

    expect(queryClient.getQueryData<AgentFlow>(detailKey)).toMatchObject({
      id,
      title: 'New title',
      description: 'New description',
      avatar: 'old-avatar.svg',
      permission: 'read',
    })
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: agentQueryKeys.lists(),
    })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: detailKey })
  })

  it('leaves cached settings untouched when the update fails', async () => {
    const id = 'agent-2'
    const detailKey = agentQueryKeys.detail(id)
    const cached = {
      id,
      title: 'Keep title',
      description: 'Keep description',
    } as AgentFlow
    queryClient.setQueryData(detailKey, cached)
    agentApiMock.updateSetting.mockRejectedValue(
      new Error('backend unavailable'),
    )
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries')

    let caught: unknown
    await act(async () => {
      try {
        await mutation.updateAgentSetting({
          id,
          title: 'Do not keep',
          description: 'Do not keep',
        })
      } catch (error) {
        caught = error
      }
    })

    expect(caught).toEqual(new Error('backend unavailable'))
    expect(queryClient.getQueryData(detailKey)).toEqual(cached)
    expect(invalidateQueries).not.toHaveBeenCalled()
  })
})
