import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { agentAPI } from '@/api/agent'
import { downloadCsvFile } from '@/lib/download'
import { resolveLocalizedText } from '@/lib/agent'
import { toast } from '@/lib/toast'
import {
  adaptAgentSessionList,
  buildSessionErrorSummary,
  extractLatestSessionOutput,
  extractSessionTitle,
} from '@/pages/agent/adapters'
import { agentQueryKeys } from '@/hooks/use-agent-request'
import type {
  AgentFlow,
  AgentSession,
  AgentSessionListParams,
} from '@/types/agent'
import { AGENT_LOG_CSV_COLUMNS, AGENT_LOG_STATUS_LABELS } from '../constants'
import { AgentLogStatus, type AgentLogParams } from '../types'
import {
  buildAgentSessionServerParams,
  extractAgentLogStatus,
  filterAgentLogSessions,
} from './use-agent-log-list'

interface BuildCsvOptions {
  canvasId: string
  agent?: AgentFlow
  sessions: AgentSession[]
}

interface ExportOptions {
  canvasId: string
  agent?: AgentFlow
  params: AgentLogParams
}

function resolveUnknownText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (value && typeof value === 'object') {
    return resolveLocalizedText(
      value as Parameters<typeof resolveLocalizedText>[0],
      '',
    )
  }
  return ''
}

function normalizeCell(value: unknown): string {
  if (value === undefined || value === null) {
    return ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return JSON.stringify(value)
}

export function escapeCsvCell(value: unknown): string {
  const normalized = normalizeCell(value)
  if (!/[",\n\r]/.test(normalized)) {
    return normalized
  }
  return `"${normalized.replace(/"/g, '""')}"`
}

function toCsvTime(session: AgentSession, key: 'create' | 'update'): string {
  const dateValue = key === 'create' ? session.create_date : session.update_date
  const timestamp = key === 'create' ? session.create_time : session.update_time
  if (dateValue) {
    return dateValue
  }
  if (
    typeof timestamp === 'number' &&
    Number.isFinite(timestamp) &&
    timestamp > 0
  ) {
    return new Date(timestamp).toISOString()
  }
  return ''
}

export function extractLatestSessionQuery(session: AgentSession): string {
  const firstUserMessage = (session.messages || []).find(
    (message) => message.role === 'user',
  )
  return typeof firstUserMessage?.content === 'string'
    ? firstUserMessage.content
    : extractSessionTitle(session, '')
}

export function summarizeLatestSessionOutput(session: AgentSession): string {
  const output =
    extractLatestSessionOutput(session)?.value ?? session.latestOutput
  const text = normalizeCell(output)
  return text.length > 200 ? `${text.slice(0, 200)}...` : text
}

export function buildAgentLogCsv({
  canvasId,
  agent,
  sessions,
}: BuildCsvOptions): string {
  const agentTitle = resolveLocalizedText(agent?.title, '')
  const rows = sessions.map((session) => {
    const status = extractAgentLogStatus(session)
    const row = {
      id: session.id,
      canvas_id: session.canvas_id || canvasId,
      agent_title: agentTitle,
      user_id: session.user_id || session.exp_user_id || '',
      source: session.source || '',
      status:
        AGENT_LOG_STATUS_LABELS[status] ||
        AGENT_LOG_STATUS_LABELS[AgentLogStatus.WARN],
      round: session.round ?? '',
      duration: session.duration ?? '',
      tokens: session.tokens ?? '',
      message_count: session.message_count ?? session.messages?.length ?? '',
      error_summary: buildSessionErrorSummary(session) || '',
      latest_query: extractLatestSessionQuery(session),
      latest_output_summary: summarizeLatestSessionOutput(session),
      create_time: toCsvTime(session, 'create'),
      update_time: toCsvTime(session, 'update'),
      version_title: resolveUnknownText(session.version_title),
    }

    return AGENT_LOG_CSV_COLUMNS.map((column) =>
      escapeCsvCell(row[column]),
    ).join(',')
  })

  return [AGENT_LOG_CSV_COLUMNS.join(','), ...rows].join('\n')
}

export function buildAgentLogCsvFilename(
  canvasId: string,
  date = new Date(),
): string {
  const day = date.toISOString().slice(0, 10)
  return `agent-sessions-${canvasId}-${day}.csv`
}

export function useAgentLogExport() {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async ({ canvasId, agent, params }: ExportOptions) => {
    setIsExporting(true)
    try {
      const serverParams: AgentSessionListParams = {
        ...buildAgentSessionServerParams(params),
        page: 1,
        page_size: 100000,
      }
      const response = await queryClient.fetchQuery({
        queryKey: agentQueryKeys.sessions(canvasId, serverParams),
        queryFn: () => agentAPI.fetchSessions(canvasId, serverParams),
      })
      const sessions = filterAgentLogSessions(
        adaptAgentSessionList(response).sessions,
        params,
      )
      downloadCsvFile(
        buildAgentLogCsv({ canvasId, agent, sessions }),
        buildAgentLogCsvFilename(canvasId),
      )
      toast.success('CSV 已导出')
    } catch (error) {
      toast.error(
        `导出失败: ${error instanceof Error ? error.message : '未知错误'}`,
      )
    } finally {
      setIsExporting(false)
    }
  }

  return {
    isExporting,
    handleExport,
  }
}
