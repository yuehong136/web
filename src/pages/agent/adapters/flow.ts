import type {
  AgentFlow,
  AgentListResponse,
  AgentTemplate,
} from '@/types/agent'
import { buildDefaultDslGlobals, deserializeDslToGraph } from '../operators'

function parseDslPayload(dsl: AgentFlow['dsl'] | string | undefined) {
  if (!dsl) {
    return undefined
  }

  if (typeof dsl === 'string') {
    try {
      return JSON.parse(dsl) as AgentFlow['dsl']
    } catch {
      return undefined
    }
  }

  return dsl
}

export function adaptAgentFlow(payload: unknown): AgentFlow {
  let flow = payload as AgentFlow | AgentFlow[] | undefined

  if (Array.isArray(flow)) {
    flow = flow[1] ?? flow[0]
  }

  const parsedDsl = parseDslPayload(flow?.dsl)
  const normalizedGraph = deserializeDslToGraph(parsedDsl)

  return {
    ...(flow || {}),
    id: flow?.id || '',
    title: flow?.title || '未命名资产',
    description: flow?.description || '',
    dsl: {
      components: parsedDsl?.components || {},
      history: parsedDsl?.history || [],
      path: parsedDsl?.path ?? [],
      answer: parsedDsl?.answer,
      graph: normalizedGraph.graph,
      messages: parsedDsl?.messages || [],
      reference: parsedDsl?.reference || [],
      globals: { ...buildDefaultDslGlobals(), ...(parsedDsl?.globals || {}) },
      variables: parsedDsl?.variables || {},
      retrieval: parsedDsl?.retrieval || [],
    },
  } as AgentFlow
}

export function adaptAgentTemplate(payload: unknown): AgentTemplate {
  return adaptAgentFlow(payload) as AgentTemplate
}

export function adaptAgentListResponse(
  payload: AgentListResponse | undefined,
): AgentListResponse {
  return {
    canvas: (payload?.canvas || []).map(adaptAgentFlow),
    total: payload?.total || 0,
  }
}
