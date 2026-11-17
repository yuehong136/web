import type { TFunction } from 'i18next'
import { Operator } from '../../constant'
import type { INodeData } from '../../hooks/use-node-loading'

const ACTION_LABEL_KEY_MAP = {
  action: 'agent.runtimePanel.thoughtChain.actions.action',
  tool: 'agent.runtimePanel.thoughtChain.actions.tool',
  control: 'agent.runtimePanel.thoughtChain.actions.control',
  data: 'agent.runtimePanel.thoughtChain.actions.data',
  system: 'agent.runtimePanel.thoughtChain.actions.system',
} as const

const NODE_NAME_KEY_MAP = {
  begin: 'agent.runtimePanel.thoughtChain.nodeNames.begin',
  workflowFinished:
    'agent.runtimePanel.thoughtChain.nodeNames.workflowFinished',
  error: 'agent.runtimePanel.thoughtChain.nodeNames.error',
  event: 'agent.runtimePanel.thoughtChain.nodeNames.event',
} as const

type RuntimeThoughtChainActionKind = keyof typeof ACTION_LABEL_KEY_MAP

export interface RuntimeThoughtChainNode {
  key: string
  componentId: string
  /** Name from the run data (component name, id or event name). */
  componentName: string
  /** i18n key for a fallback name when the run data carries none. */
  componentNameKey?: (typeof NODE_NAME_KEY_MAP)[keyof typeof NODE_NAME_KEY_MAP]
  componentType?: string
  actionKind: RuntimeThoughtChainActionKind
  actionLabelKey: (typeof ACTION_LABEL_KEY_MAP)[RuntimeThoughtChainActionKind]
  eventName: string
  eventCount: number
  status: 'loading' | 'success' | 'error' | 'abort'
  blink: boolean
  elapsedTime?: number
  inputs?: unknown
  outputs?: unknown
  thoughts?: string
  error?: string
}

const TOOL_COMPONENT_TYPES = new Set<string>([
  Operator.Retrieval,
  Operator.Tool,
  Operator.DuckDuckGo,
  Operator.Wikipedia,
  Operator.PubMed,
  Operator.ArXiv,
  Operator.Google,
  Operator.Bing,
  Operator.GoogleScholar,
  Operator.GitHub,
  Operator.SearXNG,
  Operator.TavilySearch,
  Operator.TavilyExtract,
  Operator.WenCai,
  Operator.YahooFinance,
  Operator.Crawler,
  Operator.Invoke,
  Operator.Email,
])

const CONTROL_COMPONENT_TYPES = new Set<string>([
  Operator.Categorize,
  Operator.Switch,
  Operator.Relevant,
  Operator.Iteration,
  Operator.IterationStart,
  Operator.Loop,
  Operator.LoopStart,
  Operator.ExitLoop,
  Operator.UserFillUp,
  Operator.WaitingDialogue,
])

const DATA_COMPONENT_TYPES = new Set<string>([
  Operator.ExeSQL,
  Operator.StringTransform,
  Operator.DocGenerator,
  Operator.HTMLReport,
  Operator.ExcelProcessor,
  Operator.DataOperations,
  Operator.ListOperations,
  Operator.VariableAssigner,
  Operator.VariableAggregator,
  Operator.File,
  Operator.Parser,
  Operator.Tokenizer,
  Operator.TokenChunker,
  Operator.TitleChunker,
  Operator.Extractor,
])

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const resolveActionKind = (
  componentType?: string,
): RuntimeThoughtChainNode['actionKind'] => {
  if (
    !componentType ||
    componentType === Operator.Begin ||
    componentType === Operator.Message
  ) {
    return 'system'
  }

  if (TOOL_COMPONENT_TYPES.has(componentType)) {
    return 'tool'
  }

  if (CONTROL_COMPONENT_TYPES.has(componentType)) {
    return 'control'
  }

  if (DATA_COMPONENT_TYPES.has(componentType)) {
    return 'data'
  }

  return 'action'
}

const getNodeDisplayName = (
  data: INodeData,
  event: string,
): Pick<RuntimeThoughtChainNode, 'componentName' | 'componentNameKey'> => {
  if (data.component_name) {
    return { componentName: data.component_name }
  }

  if (data.component_id === 'begin') {
    return { componentName: '', componentNameKey: NODE_NAME_KEY_MAP.begin }
  }

  if (data.component_id) {
    return { componentName: data.component_id }
  }

  if (event === 'workflow_finished') {
    return {
      componentName: '',
      componentNameKey: NODE_NAME_KEY_MAP.workflowFinished,
    }
  }

  if (event === 'error') {
    return { componentName: '', componentNameKey: NODE_NAME_KEY_MAP.error }
  }

  return event
    ? { componentName: event }
    : { componentName: '', componentNameKey: NODE_NAME_KEY_MAP.event }
}

export const resolveRuntimeThoughtNodeName = (
  node: Pick<RuntimeThoughtChainNode, 'componentName' | 'componentNameKey'>,
  t: TFunction,
) => (node.componentNameKey ? t(node.componentNameKey) : node.componentName)

const collectNodeField = (
  nodeEvents: Array<{ data: INodeData }>,
  field: 'inputs' | 'outputs',
) => {
  const values = nodeEvents
    .map((item) => item.data[field])
    .filter((value) => value !== undefined && value !== null)

  if (values.length === 0) {
    return undefined
  }

  if (values.length === 1) {
    return values[0]
  }

  return values
}

const collectNodeThoughts = (nodeEvents: Array<{ data: INodeData }>) => {
  const thoughts: string[] = []

  nodeEvents.forEach((event) => {
    if (typeof event.data.thoughts === 'string' && event.data.thoughts.trim()) {
      thoughts.push(event.data.thoughts)
    }

    const trace = Array.isArray(event.data.trace) ? event.data.trace : []
    trace.forEach((row) => {
      if (
        isRecord(row) &&
        typeof row.message === 'string' &&
        row.message.trim()
      ) {
        thoughts.push(row.message)
      }
    })
  })

  return thoughts.length ? Array.from(new Set(thoughts)).join('\n') : undefined
}

const getNodeError = (nodeEvents: Array<{ data: INodeData }>) => {
  for (const event of nodeEvents) {
    if (typeof event.data.error === 'string' && event.data.error.trim()) {
      return event.data.error
    }

    const outputs = event.data.outputs
    if (isRecord(outputs) && typeof outputs._ERROR === 'string') {
      return outputs._ERROR
    }
  }

  return undefined
}

export function shouldStoreRuntimeThoughtEvent(
  event: string,
  data?: INodeData,
) {
  return (
    event === 'node_started' ||
    event === 'node_finished' ||
    event === 'workflow_finished' ||
    event === 'error' ||
    Boolean(data?.component_id)
  )
}

export function buildRuntimeThoughtChainNodes(
  events: Array<{ event: string; data: INodeData }> = [],
  running = false,
): RuntimeThoughtChainNode[] {
  const visibleEvents = events.filter((item) => {
    return shouldStoreRuntimeThoughtEvent(item.event, item.data)
  })

  const preferredEvents = visibleEvents.some(
    (item) => item.event === 'node_started',
  )
    ? visibleEvents.filter(
        (item) => item.event === 'node_started' || item.event === 'error',
      )
    : visibleEvents

  const orderedEvents = preferredEvents.reduce<
    Array<{ event: string; data: INodeData; index: number }>
  >((result, item, index) => {
    const componentId =
      item.data.component_id || `${item.event || 'event'}-${index}`

    if (
      result.every(
        (existing) =>
          (existing.data.component_id ||
            `${existing.event || 'event'}-${existing.index}`) !== componentId,
      )
    ) {
      result.push({ ...item, index })
    }

    return result
  }, [])

  return orderedEvents.map((item) => {
    const componentId =
      item.data.component_id || `${item.event || 'event'}-${item.index}`
    const nodeEvents = visibleEvents.filter((event) => {
      const eventComponentId =
        event.data.component_id ||
        (event.event === item.event ? componentId : '')
      return eventComponentId === componentId
    })
    const finishedEvent = nodeEvents.find(
      (event) => event.event === 'node_finished',
    )
    const error = getNodeError(nodeEvents)
    const actionKind = resolveActionKind(item.data.component_type)
    const status = error
      ? 'error'
      : finishedEvent || item.event === 'workflow_finished'
        ? 'success'
        : running
          ? 'loading'
          : 'abort'

    return {
      key: componentId,
      componentId,
      ...getNodeDisplayName(item.data, item.event),
      componentType: item.data.component_type,
      actionKind,
      actionLabelKey: ACTION_LABEL_KEY_MAP[actionKind],
      eventName: item.event,
      eventCount: nodeEvents.length,
      status,
      blink: status === 'loading',
      elapsedTime:
        typeof finishedEvent?.data.elapsed_time === 'number'
          ? finishedEvent.data.elapsed_time
          : undefined,
      inputs: collectNodeField(nodeEvents, 'inputs'),
      outputs: collectNodeField(nodeEvents, 'outputs'),
      thoughts: collectNodeThoughts(nodeEvents),
      error,
    }
  })
}
