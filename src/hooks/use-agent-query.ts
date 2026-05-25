import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { agentAPI } from '@/api/agent'
import {
  adaptAgentFlow,
  adaptAgentListResponse,
  adaptAgentSession,
  adaptAgentSessionList,
  adaptAgentShareSummary,
  adaptAgentTemplate,
  adaptAgentTraceItems,
  adaptAgentVersionSummaries,
  adaptAgentWebhookTrace,
} from '@/pages/agent/adapters'
import type {
  AgentExternalInputs,
  AgentInputFormSchema,
  AgentListParams,
  AgentListResponse,
  AgentSessionListParams,
  AgentSessionListResponse,
  AgentTemplate,
  AgentTraceItem,
  AgentVersionSummary,
  AgentWebhookTraceRequest,
  PersonDataItem,
} from '@/types/agent'

export const agentQueryKeys = {
  all: ['agent'] as const,
  lists: () => [...agentQueryKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) =>
    [...agentQueryKeys.lists(), params] as const,
  detail: (id: string) => [...agentQueryKeys.all, 'detail', id] as const,
  templates: () => [...agentQueryKeys.all, 'templates'] as const,
  prompts: () => [...agentQueryKeys.all, 'prompts'] as const,
  versions: (id: string) => [...agentQueryKeys.all, 'versions', id] as const,
  version: (id: string) => [...agentQueryKeys.all, 'version', id] as const,
  trace: (canvasId: string, messageId: string) =>
    [...agentQueryKeys.all, 'trace', canvasId, messageId] as const,
  inputForm: (canvasId: string, componentId: string) =>
    [...agentQueryKeys.all, 'input-form', canvasId, componentId] as const,
  sessions: (canvasId: string, params?: AgentSessionListParams) =>
    [...agentQueryKeys.all, 'sessions', canvasId, params || {}] as const,
  session: (canvasId: string, sessionId: string) =>
    [...agentQueryKeys.all, 'session', canvasId, sessionId] as const,
  avatar: (id: string) => [...agentQueryKeys.all, 'avatar', id] as const,
  sse: (id: string) => [...agentQueryKeys.all, 'sse', id] as const,
  externalInputs: (id: string, betaToken?: string) =>
    [
      ...agentQueryKeys.all,
      'external-inputs',
      id,
      betaToken || 'missing-beta',
    ] as const,
  webhookTrace: (id: string, params: AgentWebhookTraceRequest) =>
    [...agentQueryKeys.all, 'webhook-trace', id, params] as const,
  personDataList: (workflowId: string, external: boolean) =>
    [...agentQueryKeys.all, 'persondata-list', workflowId, external] as const,
}

function useResolvedAgentId(id?: string) {
  const params = useParams<{ id: string }>()
  return id || params.id || ''
}

export const useFetchAgent = (id?: string) => {
  const agentId = useResolvedAgentId(id)

  const query = useQuery({
    queryKey: agentQueryKeys.detail(agentId),
    enabled: Boolean(agentId),
    queryFn: async () => adaptAgentFlow(await agentAPI.fetchAgent(agentId)),
  })

  const isInitialLoading = query.isPending || (query.isFetching && !query.data)

  return {
    agent: query.data,
    data: query.data,
    isLoading: isInitialLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchAgentList = (params: AgentListParams = {}) => {
  const queryParams = {
    page: params.page ?? 1,
    page_size: params.page_size ?? 12,
    orderby: params.orderby ?? 'update_time',
    desc: params.desc ?? true,
    keywords: params.keywords || params.name || '',
    canvas_type: params.canvas_type,
    canvas_category: params.canvas_category,
  }

  const query = useQuery({
    queryKey: agentQueryKeys.list(queryParams),
    queryFn: async () =>
      adaptAgentListResponse(await agentAPI.listAgents(queryParams)),
    placeholderData: () =>
      ({ canvas: [], total: 0 }) satisfies AgentListResponse,
  })

  return {
    agents: query.data?.canvas || [],
    data: query.data,
    total: query.data?.total || 0,
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchAgentListByPage = useFetchAgentList

export const useFetchAgentTemplates = () => {
  const query = useQuery({
    queryKey: agentQueryKeys.templates(),
    queryFn: async () =>
      (await agentAPI.fetchTemplates()).map(adaptAgentTemplate),
    placeholderData: () => [] satisfies AgentTemplate[],
  })

  return {
    data: query.data || [],
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchPrompt = () => {
  const query = useQuery({
    queryKey: agentQueryKeys.prompts(),
    queryFn: async () => agentAPI.fetchPrompt(),
    placeholderData: () => ({}) satisfies Record<string, string>,
  })

  return {
    data: query.data || {},
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchVersionList = (id?: string) => {
  const agentId = useResolvedAgentId(id)
  const query = useQuery({
    queryKey: agentQueryKeys.versions(agentId),
    enabled: Boolean(agentId),
    queryFn: async () =>
      adaptAgentVersionSummaries(await agentAPI.fetchVersions(agentId)),
    placeholderData: () => [] satisfies AgentVersionSummary[],
  })

  return {
    data: query.data || [],
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}

export const useFetchVersion = (versionId?: string) => {
  const query = useQuery({
    queryKey: agentQueryKeys.version(versionId || ''),
    enabled: Boolean(versionId),
    queryFn: async () =>
      adaptAgentFlow(await agentAPI.fetchVersion(versionId || '')),
  })

  return {
    data: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}

export const useFetchAgentAvatar = (id?: string) => {
  const agentId = useResolvedAgentId(id)
  const query = useQuery({
    queryKey: agentQueryKeys.avatar(agentId),
    enabled: Boolean(agentId),
    queryFn: async () =>
      adaptAgentFlow(await agentAPI.fetchAgentAvatar(agentId)),
  })

  return {
    data: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchMessageTrace = (canvasId?: string, messageId?: string) => {
  const query = useQuery({
    queryKey: agentQueryKeys.trace(canvasId || '', messageId || ''),
    enabled: Boolean(canvasId) && Boolean(messageId),
    queryFn: async () =>
      adaptAgentTraceItems(
        await agentAPI.fetchTrace(canvasId || '', messageId || ''),
      ),
    placeholderData: () => [] satisfies AgentTraceItem[],
  })

  return {
    data: query.data || [],
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchInputForm = (canvasId?: string, componentId?: string) => {
  const query = useQuery({
    queryKey: agentQueryKeys.inputForm(canvasId || '', componentId || ''),
    enabled: Boolean(canvasId) && Boolean(componentId),
    queryFn: async () => agentAPI.inputForm(canvasId || '', componentId || ''),
    placeholderData: () => ({}) satisfies AgentInputFormSchema,
  })

  return {
    data: query.data || ({} as AgentInputFormSchema),
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
  }
}

export const useFetchAgentSessions = (
  canvasId?: string,
  params: AgentSessionListParams = {},
) => {
  const resolvedCanvasId = useResolvedAgentId(canvasId)
  const queryParams: AgentSessionListParams = {
    page: params.page ?? 1,
    page_size: params.page_size ?? 12,
    orderby: params.orderby ?? 'update_time',
    desc: params.desc ?? true,
    keywords: params.keywords || '',
    from_date: params.from_date || '',
    to_date: params.to_date || '',
    exp_user_id: params.exp_user_id || '',
  }
  const query = useQuery({
    queryKey: agentQueryKeys.sessions(resolvedCanvasId, queryParams),
    enabled: Boolean(resolvedCanvasId),
    queryFn: async () =>
      adaptAgentSessionList(
        await agentAPI.fetchSessions(resolvedCanvasId, queryParams),
      ),
    placeholderData: () =>
      ({
        sessions: [],
        total: 0,
      }) satisfies AgentSessionListResponse,
  })

  return {
    data: query.data || { sessions: [], total: 0 },
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchAgentSession = (canvasId?: string, sessionId?: string) => {
  const resolvedCanvasId = useResolvedAgentId(canvasId)
  const query = useQuery({
    queryKey: agentQueryKeys.session(resolvedCanvasId, sessionId || ''),
    enabled: Boolean(resolvedCanvasId) && Boolean(sessionId),
    queryFn: async () =>
      adaptAgentSession(
        await agentAPI.fetchSession(resolvedCanvasId, sessionId || ''),
      ),
  })

  return {
    data: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchFlowSSE = (id?: string) => {
  const agentId = useResolvedAgentId(id)
  const query = useQuery({
    queryKey: agentQueryKeys.sse(agentId),
    enabled: Boolean(agentId),
    queryFn: async () => adaptAgentFlow(await agentAPI.fetchCanvasSSE(agentId)),
  })

  return {
    data: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchExternalAgentInputs = (
  canvasId?: string,
  betaToken?: string,
) => {
  const resolvedCanvasId = useResolvedAgentId(canvasId)
  const query = useQuery({
    queryKey: agentQueryKeys.externalInputs(resolvedCanvasId, betaToken),
    enabled: Boolean(resolvedCanvasId) && Boolean(betaToken),
    retry: false,
    queryFn: async () =>
      adaptAgentShareSummary(
        await agentAPI.fetchExternalAgentInputs(
          resolvedCanvasId,
          betaToken || '',
        ),
      ),
    placeholderData: () =>
      ({
        title: 'Agent Share',
        mode: 'conversation',
        inputs: {},
      }) satisfies AgentExternalInputs,
  })

  return {
    data: query.data || ({} as AgentExternalInputs),
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Begin 节点 persondata 输入类型候选项。
 * 传入 betaToken 走分享/嵌入公开接口（agentbots/{id}/persondataList），
 * 否则走登录态接口（/v1/datav/persondataList/{id}）。
 */
export const useFetchPersonDataList = ({
  workflowId,
  betaToken,
}: {
  workflowId?: string
  betaToken?: string
}) => {
  const external = Boolean(betaToken)
  const query = useQuery({
    queryKey: agentQueryKeys.personDataList(workflowId || '', external),
    enabled: Boolean(workflowId),
    retry: false,
    staleTime: 5 * 60 * 1000,
    queryFn: async () =>
      external
        ? await agentAPI.fetchExternalPersonDataList(
            workflowId || '',
            betaToken || '',
          )
        : await agentAPI.fetchPersonDataList(workflowId || ''),
    placeholderData: () => [] as PersonDataItem[],
  })

  return {
    items: query.data || ([] as PersonDataItem[]),
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export const useFetchWebhookTrace = (
  canvasId?: string,
  params: AgentWebhookTraceRequest = {},
  enabled = false,
) => {
  const resolvedCanvasId = useResolvedAgentId(canvasId)
  const query = useQuery({
    queryKey: agentQueryKeys.webhookTrace(resolvedCanvasId, params),
    enabled: Boolean(resolvedCanvasId) && enabled,
    refetchOnWindowFocus: false,
    retry: false,
    queryFn: async () =>
      adaptAgentWebhookTrace(
        await agentAPI.fetchWebhookTrace(resolvedCanvasId, params),
      ),
  })

  return {
    data: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
