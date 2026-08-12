import { act } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUpdateAgentSetting } from '@/hooks/use-agent-mutation'
import { agentQueryKeys } from '@/hooks/use-agent-query'
import type { AgentFlow } from '@/types/agent'

const agentApiMock = vi.hoisted(() => ({
  updateSetting: vi.fn(),
}))

vi.mock('@/api/agent', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/agent')>()
  return {
    ...actual,
    agentAPI: {
      ...actual.agentAPI,
      updateSetting: agentApiMock.updateSetting,
    },
  }
})

vi.mock('@/lib/toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

type UpdateSettingMutation = ReturnType<typeof useUpdateAgentSetting>

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

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
