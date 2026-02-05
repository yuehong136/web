import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { agentAPI } from '@/api/agent'
import type {
  IAgentListRequest,
  IAgentListResponse,
  IFlow,
  IInputs,
  ITraceData,
} from '@/pages/agent/types'

export const agentQueryKeys = {
  all: ['agent'] as const,
  lists: () => [...agentQueryKeys.all, 'list'] as const,
  list: (params: Record<string, any>) => [...agentQueryKeys.lists(), params] as const,
  details: () => [...agentQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentQueryKeys.details(), id] as const,
  versions: () => [...agentQueryKeys.all, 'versions'] as const,
  versionList: (id: string) => [...agentQueryKeys.versions(), 'list', id] as const,
  version: (id: string) => [...agentQueryKeys.versions(), 'detail', id] as const,
  trace: (canvasId: string, messageId: string) =>
    [...agentQueryKeys.all, 'trace', canvasId, messageId] as const,
  inputForm: (canvasId: string, componentId: string) =>
    [...agentQueryKeys.all, 'inputForm', canvasId, componentId] as const,
  logs: (canvasId: string, params: Record<string, any>) =>
    [...agentQueryKeys.all, 'logs', canvasId, params] as const,
  avatar: (id: string) => [...agentQueryKeys.all, 'avatar', id] as const,
  sse: (id: string) => [...agentQueryKeys.all, 'sse', id] as const,
  externalInputs: (id: string) => [...agentQueryKeys.all, 'external-inputs', id] as const,
}

const normalizeFlow = (payload: unknown): IFlow => {
  let flow = payload as any
  if (Array.isArray(flow)) {
    flow = flow[1] ?? flow[0] ?? {}
  }

  if (flow?.dsl && typeof flow.dsl === 'string') {
    try {
      flow.dsl = JSON.parse(flow.dsl)
    } catch {
      // keep raw string when parsing fails
    }
  }

  return flow as IFlow
}

export const useAgentId = (): string => {
  const { id } = useParams<{ id: string }>()
  return id || ''
}

export const useFetchAgent = (id?: string) => {
  const agentId = id || useAgentId()

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: agentQueryKeys.detail(agentId),
    enabled: !!agentId,
    queryFn: async () => {
      const response = await agentAPI.fetchAgent(agentId)
      return normalizeFlow(response)
    },
  })

  return {
    agent: data,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

export const useFetchAgentListByPage = (params: IAgentListRequest = {}) => {
  const {
    page = 1,
    page_size = 20,
    orderby = 'update_time',
    desc = true,
    name,
    canvas_type,
  } = params

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: agentQueryKeys.list({ page, page_size, orderby, desc, name, canvas_type }),
    queryFn: async () => {
      const response = await agentAPI.listAgents({
        page,
        page_size,
        orderby,
        desc,
        name,
        canvas_type,
      })
      return response as IAgentListResponse
    },
    placeholderData: (previous) => previous ?? { canvas: [], total: 0 },
  })

  return {
    agents: data?.canvas ?? [],
    total: data?.total ?? 0,
    isLoading: isFetching,
    isError,
    error,
    refetch,
  }
}

export const useFetchVersionList = (id?: string) => {
  const agentId = id || useAgentId()

  const { data, isFetching, isError, error } = useQuery({
    queryKey: agentQueryKeys.versionList(agentId),
    enabled: !!agentId,
    queryFn: async () => {
      return agentAPI.fetchVersions(agentId)
    },
    placeholderData: () => [],
  })

  return { data: data ?? [], isLoading: isFetching, isError, error }
}

export const useFetchVersion = (versionId?: string) => {
  const { data, isFetching, isError, error } = useQuery({
    queryKey: agentQueryKeys.version(versionId || ''),
    enabled: !!versionId,
    queryFn: async () => {
      if (!versionId) return undefined
      const response = await agentAPI.fetchVersion(versionId)
      return normalizeFlow(response)
    },
  })

  return { data, isLoading: isFetching, isError, error }
}

export const useFetchAgentAvatar = (id?: string) => {
  const agentId = id || useAgentId()

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: agentQueryKeys.avatar(agentId),
    enabled: !!agentId,
    queryFn: async () => {
      const response = await agentAPI.fetchAgentAvatar(agentId)
      return normalizeFlow(response)
    },
  })

  return { data, isLoading: isFetching, isError, error, refetch }
}

export const useFetchMessageTrace = (canvasId?: string, messageId?: string) => {
  const { data, isFetching, isError, error } = useQuery({
    queryKey: agentQueryKeys.trace(canvasId || '', messageId || ''),
    enabled: !!canvasId && !!messageId,
    queryFn: async () => {
      if (!canvasId || !messageId) return [] as ITraceData[]
      return agentAPI.fetchTrace(canvasId, messageId)
    },
    placeholderData: () => [],
  })

  return { data: data ?? [], isLoading: isFetching, isError, error }
}

export const useFetchInputForm = (canvasId?: string, componentId?: string) => {
  const { data, isFetching, isError, error } = useQuery({
    queryKey: agentQueryKeys.inputForm(canvasId || '', componentId || ''),
    enabled: !!canvasId && !!componentId,
    queryFn: async () => {
      if (!canvasId || !componentId) return {}
      return agentAPI.inputForm(canvasId, componentId)
    },
    placeholderData: () => ({}),
  })

  return { data: data as Record<string, any>, isLoading: isFetching, isError, error }
}

export interface AgentLogParams {
  page?: number
  page_size?: number
}

export const useFetchAgentLog = (canvasId?: string, params: AgentLogParams = {}) => {
  const { page = 1, page_size = 20 } = params

  const { data, isFetching, isError, error } = useQuery({
    queryKey: agentQueryKeys.logs(canvasId || '', { page, page_size }),
    enabled: !!canvasId,
    queryFn: async () => {
      if (!canvasId) return { sessions: [], total: 0 }
      return agentAPI.fetchSessions(canvasId)
    },
    placeholderData: () => ({ sessions: [], total: 0 }),
  })

  return { data, isLoading: isFetching, isError, error }
}

export const useFetchFlowSSE = (id?: string) => {
  const agentId = id || useAgentId()

  const { data, isFetching, isError, error, refetch } = useQuery({
    queryKey: agentQueryKeys.sse(agentId),
    enabled: !!agentId,
    queryFn: async () => {
      const response = await agentAPI.fetchCanvasSSE(agentId)
      return normalizeFlow(response)
    },
  })

  return { data, isLoading: isFetching, isError, error, refetch }
}

export const useFetchExternalAgentInputs = (canvasId?: string) => {
  const agentId = canvasId || useAgentId()

  const { data, isFetching, isError, error, refetch } = useQuery<IInputs>({
    queryKey: agentQueryKeys.externalInputs(agentId),
    enabled: !!agentId,
    queryFn: async () => {
      if (!agentId) return {} as IInputs
      return agentAPI.fetchExternalAgentInputs(agentId)
    },
    placeholderData: () => ({} as IInputs),
  })

  return { data, isLoading: isFetching, isError, error, refetch }
}
