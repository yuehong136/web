import type { INodeEvent } from '../../hooks/use-node-loading'
import type { BeginQuery } from '../../types'
import type {
  AgentXCardActionPayload,
  AgentXCardCommand,
  XCardStatus,
} from '../../x-card'

export enum RuntimeWorkbenchView {
  RUN = 'run',
  CONVERSATION = 'conversation',
  LOG = 'log',
}

export enum AgentRuntimeStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  STOPPED = 'stopped',
}

export interface RuntimeAttachment {
  id?: string
  name: string
  type?: string
  mimeType?: string
  size?: number
  url?: string
  [key: string]: unknown
}

export interface RuntimeMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  thinking?: string
  logEvents?: INodeEvent[]
  tips?: string
  awaitingInputs?: BeginQuery[]
  files?: RuntimeAttachment[]
  reference?: unknown
  error?: string
  isStreaming?: boolean
  xCardCommands?: AgentXCardCommand[]
  xCardSurfaceIds?: string[]
  xCardStatus?: XCardStatus
  messageId?: string
  taskId?: string
}

export interface RuntimeWorkbenchSummary {
  status: AgentRuntimeStatus
  currentView: RuntimeWorkbenchView
  messageCount: number
  hasLogs: boolean
  sessionId?: string
  sessionName?: string
  lastRunAt?: number
  lastMessageId?: string
  lastTaskId?: string
  lastError?: string
}

export interface RuntimeWorkbenchProps {
  open: boolean
  view: RuntimeWorkbenchView
  controller: AgentRuntimeController
  onOpenChange: (open: boolean) => void
  onViewChange: (view: RuntimeWorkbenchView) => void
}

export interface StartRuntimeRequest {
  content?: string
  files?: RuntimeAttachment[]
}

export interface AgentRuntimeController {
  canvasId?: string
  beginInputs: BeginQuery[]
  isTaskMode: boolean
  sessionId?: string
  viewingSessionId?: string
  messages: RuntimeMessage[]
  logEvents: INodeEvent[]
  summary: RuntimeWorkbenchSummary
  currentMessageId: string
  latestTaskId: string
  status: AgentRuntimeStatus
  loading: boolean
  saving: boolean
  hasMessages: boolean
  hasLogs: boolean
  lastNodeId?: string
  startButNotFinishedNodeIds: string[]
  lastError?: string
  handleRun: (values: BeginQuery[]) => Promise<void>
  handleSendMessage: (request: StartRuntimeRequest) => Promise<void>
  handleSubmitAwaitingInputs: (
    messageId: string,
    values: BeginQuery[],
  ) => Promise<void>
  handleXCardAction: (payload: AgentXCardActionPayload) => Promise<void>
  handleStop: () => Promise<void>
  handleReset: () => void
  handleCreateSession: (name?: string) => Promise<void>
  handleSwitchViewingSession: (id: string | undefined) => void
  handleAdoptViewingSession: () => void
}
