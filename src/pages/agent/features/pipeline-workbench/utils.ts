import get from 'lodash/get.js'
import isEmpty from 'lodash/isEmpty.js'
import { downloadJsonFile } from '@/lib/download'
import type { AgentTraceItem } from '@/types/agent'
import {
  PipelineRuntimeStatus,
  PipelineWorkbenchView,
  type PipelineRunFile,
  type PipelineWorkbenchSummary,
} from './types'

const END_COMPONENT_ID = 'END'
const DATAFLOW_RESULT_PATH = '/dataflow-result'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function findPipelineEndOutput(trace?: AgentTraceItem[]): unknown {
  if (!Array.isArray(trace)) {
    return undefined
  }

  const endNode = trace.find((item) => item?.component_id === END_COMPONENT_ID)
  const message = get(endNode, 'trace.0.message') as string | undefined

  if (!message || isEmpty(message)) {
    return undefined
  }

  try {
    return JSON.parse(message)
  } catch {
    return message
  }
}

export function isPipelineEndOutputEmpty(trace?: AgentTraceItem[]): boolean {
  return isEmpty(findPipelineEndOutput(trace))
}

export function isPipelineCompleted(trace?: AgentTraceItem[]): boolean {
  if (!Array.isArray(trace) || trace.length === 0) {
    return false
  }

  const latest = trace[trace.length - 1]
  const message = get(latest, 'trace.0.message') as string | undefined
  return latest?.component_id === END_COMPONENT_ID && !isEmpty(message)
}

export function findLastFailureMessage(trace?: AgentTraceItem[]): string | undefined {
  if (!Array.isArray(trace)) {
    return undefined
  }

  for (let index = trace.length - 1; index >= 0; index -= 1) {
    const item = trace[index]
    const status = String(item?.status || '').toLowerCase()
    if (status === 'fail' || status === 'failed' || status === 'error') {
      const message =
        (typeof item?.message === 'string' ? item.message : undefined) ||
        (get(item, 'trace.0.message') as string | undefined)

      if (message) {
        return message
      }
    }
  }

  return undefined
}

export { downloadJsonFile }

export function buildPipelineSummary(params: {
  status: PipelineRuntimeStatus
  currentView: PipelineWorkbenchView
  messageCount: number
  hasLogs: boolean
  outputAvailable: boolean
  lastRunAt?: number
  lastMessageId?: string
  lastTaskId?: string
  lastError?: string
  uploadedFile?: PipelineRunFile
  resultPath?: string
}): PipelineWorkbenchSummary {
  return {
    status: params.status,
    currentView: params.currentView,
    messageCount: params.messageCount,
    hasLogs: params.hasLogs,
    outputAvailable: params.outputAvailable,
    lastRunAt: params.lastRunAt,
    lastMessageId: params.lastMessageId,
    lastTaskId: params.lastTaskId,
    lastError: params.lastError,
    uploadedFile: params.uploadedFile,
    resultPath: params.resultPath,
  }
}

export function extractMessageIdFromChunk(chunk: string | undefined): string | undefined {
  if (!chunk) {
    return undefined
  }

  try {
    const parsed = JSON.parse(chunk) as { data?: { message_id?: string }; message_id?: string }
    return parsed?.data?.message_id || parsed?.message_id
  } catch {
    return undefined
  }
}

type PipelineInputItem = Record<string, unknown> & { key?: string }

export function buildPipelineInputObject(values: readonly PipelineInputItem[]) {
  return values.reduce<Record<string, unknown>>((result, item) => {
    if (!item?.key) {
      return result
    }

    const { key, ...rest } = item
    result[key] = rest
    return result
  }, {})
}

export function normalizePipelineRunFile(file: unknown): PipelineRunFile | undefined {
  if (!isRecord(file)) {
    return undefined
  }

  return file as PipelineRunFile
}

export function findFirstPipelineRunFile(
  values: readonly PipelineInputItem[],
): PipelineRunFile | undefined {
  for (const item of values) {
    const value = item?.value
    if (!Array.isArray(value)) {
      continue
    }

    const file = value.map(normalizePipelineRunFile).find(Boolean)
    if (file) {
      return file
    }
  }

  return undefined
}

export function buildPipelineResultPath(params: {
  agentId?: string
  agentTitle?: string
  messageId?: string
  file?: PipelineRunFile
}): string | undefined {
  const docId = params.file?.id
  if (!params.agentId || !params.messageId || !docId) {
    return undefined
  }

  const searchParams = new URLSearchParams()
  searchParams.set('id', params.messageId)
  searchParams.set('agent_id', params.agentId)
  searchParams.set('doc_id', docId)
  searchParams.set('type', 'dataflow')
  searchParams.set('is_read_only', 'true')

  if (params.agentTitle) {
    searchParams.set('agent_title', params.agentTitle)
  }
  if (typeof params.file?.created_by === 'string' && params.file.created_by) {
    searchParams.set('created_by', params.file.created_by)
  }
  if (typeof params.file?.extension === 'string' && params.file.extension) {
    searchParams.set('extension', params.file.extension)
  }

  return `${DATAFLOW_RESULT_PATH}?${searchParams.toString()}`
}
