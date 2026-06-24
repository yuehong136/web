import type { AgentTraceItem } from '@/types/agent'
import type { BeginQuery } from '../../types'
import { AgentRuntimeStatus } from '../runtime-workbench/types'

export { AgentRuntimeStatus as PipelineRuntimeStatus }

export enum PipelineWorkbenchView {
  RUN = 'pipeline-run',
  LOG = 'pipeline-log',
  OUTPUT = 'pipeline-output',
}

export interface PipelineRunFile {
  id?: string
  name?: string
  extension?: string
  created_by?: string
  [key: string]: unknown
}

export interface PipelineWorkbenchSummary {
  status: AgentRuntimeStatus
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
}

export interface PipelineRuntimeController {
  canvasId?: string
  beginInputs: BeginQuery[]
  status: AgentRuntimeStatus
  loading: boolean
  saving: boolean
  cancelling: boolean
  hasLogs: boolean
  outputAvailable: boolean
  trace: AgentTraceItem[]
  endOutput: unknown
  lastError?: string
  lastMessageId?: string
  lastTaskId?: string
  uploadedFile?: PipelineRunFile
  resultPath?: string
  summary: PipelineWorkbenchSummary
  handleRun: (values: BeginQuery[]) => Promise<void>
  handleCancel: () => Promise<void>
  handleReset: () => void
  handleDownloadOutput: () => void
  handleOpenResult: () => void
}

export interface PipelineWorkbenchProps {
  open: boolean
  view: PipelineWorkbenchView
  controller: PipelineRuntimeController
  onOpenChange: (open: boolean) => void
  onViewChange: (view: PipelineWorkbenchView) => void
}
