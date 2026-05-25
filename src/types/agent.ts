import type { Edge, Node } from '@xyflow/react'

export enum AgentCanvasType {
  AGENT = 'agent',
  PIPELINE = 'pipeline',
}

export enum AgentCanvasCategory {
  AGENT = 'agent_canvas',
  INGESTION = 'dataflow_canvas',
}

export enum AgentOperatorCategory {
  CORE = 'core',
  CONTROL = 'control',
  AGENT = 'agent',
  TOOL = 'tool',
  DATA = 'data',
  CONTENT = 'content',
  PIPELINE = 'pipeline',
  UTILITY = 'utility',
}

export enum AgentOperatorMode {
  AGENT = 'agent',
  PIPELINE = 'pipeline',
  SHARED = 'shared',
}

export type LocalizedText =
  | string
  | {
      en?: string
      zh?: string
      [locale: string]: string | undefined
    }

export interface AgentOperatorNode {
  component_name: string
  params: Record<string, unknown>
}

export interface AgentOperator {
  obj: AgentOperatorNode
  downstream: string[]
  upstream: string[]
  parent_id?: string
}

export interface AgentOperatorDefinition {
  type: string
  category: AgentOperatorCategory
  mode: AgentOperatorMode
  nodeType: string
  defaultName: string
  description: string
  iconKey: string
  allowSingleStepDebug?: boolean
  consumesBeginInputs?: boolean
  supportsStructuredOutput?: boolean
  supportsGlobalVariables?: boolean
  excludeFromDsl?: boolean
  isRootNode?: boolean
}

export type AgentDslComponents = Record<string, AgentOperator>

export interface AgentGlobalVariable {
  name?: string
  type?: string
  value?: unknown
  description?: string
  required?: boolean
  [key: string]: unknown
}

export interface AgentNodeData<TForm = unknown> {
  label: string
  name: string
  color?: string
  form?: TForm
  component_id?: string
  [key: string]: unknown
}

export type AgentGraphNode<TForm = unknown> = Node<AgentNodeData<TForm>>

export interface AgentGraph {
  nodes: AgentGraphNode[]
  edges: Edge[]
}

export interface AgentDsl {
  components: AgentDslComponents
  history: unknown[]
  path?: string[][]
  answer?: unknown[]
  graph?: AgentGraph
  messages: unknown[]
  reference: unknown[]
  globals: Record<string, unknown>
  variables?: Record<string, AgentGlobalVariable>
  retrieval: unknown[]
}

export interface AgentFlow {
  id: string
  title: LocalizedText
  description: LocalizedText
  avatar?: string
  canvas_type: AgentCanvasType | 'agent' | 'pipeline' | 'Recommended' | null
  canvas_category?: string
  create_time: number
  update_time: number
  create_date?: string
  update_date?: string
  user_id: string
  permission: string
  nickname?: string
  release?: boolean
  release_time?: number
  last_publish_time?: number
  datasets?: Array<{
    id: string
    name: string
    avatar?: string
  }>
  dsl: AgentDsl
}

export interface AgentTemplate extends AgentFlow {
  canvas_type: AgentCanvasType | 'agent' | 'pipeline' | 'Recommended' | null
}

export interface AgentListParams {
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  keywords?: string
  name?: string
  canvas_type?: AgentCanvasType | string
  canvas_category?: string
}

export interface AgentSessionListParams {
  page?: number
  page_size?: number
  keywords?: string
  from_date?: string
  to_date?: string
  orderby?: string
  desc?: boolean
  exp_user_id?: string
}

export interface AgentListResponse {
  canvas: AgentFlow[]
  total: number
}

export interface SetAgentPayload {
  id?: string
  title: string
  description?: string
  dsl?: unknown
  canvas_type?: AgentCanvasType | 'agent' | 'pipeline'
  canvas_category?: string
  avatar?: string
  permission?: string
  release?: boolean
}

export interface UpdateAgentSettingsPayload {
  id: string
  title: string
  description?: string
  avatar?: string
  permission?: string
}

export interface RunAgentPayload {
  id: string
  query?: string
  session_id?: string | null
  files?: unknown[]
  inputs?: Record<string, unknown>
  a2ui?: Array<Record<string, unknown>>
  metadata?: Record<string, unknown>
  release?: boolean | string
  user_id?: string
}

export interface ExternalAgentCompletionPayload extends RunAgentPayload {
  betaToken: string
}

export interface DebugAgentNodePayload {
  canvas_id: string
  component_id: string
  inputs?: Record<string, unknown>
}

export interface AgentTraceItem {
  component_id: string
  component_name: string
  status: string
  elapsed_time?: number
  inputs?: Record<string, unknown>
  outputs?: Record<string, unknown>
  message?: string
  trace?: Array<{ message?: string } | AgentTraceItem>
  traces?: AgentTraceItem[]
  [key: string]: unknown
}

export interface AgentVersionSummary {
  id: string
  title?: string
  description?: string
  version_id?: string
  label?: string
  release?: boolean
  create_time?: number
  create_date?: string
  update_time?: number
  update_date?: string
  release_time?: number
  last_publish_time?: number
  [key: string]: unknown
}

export interface AgentSessionMessage {
  id?: string
  role?: string
  content?: string
  files?: unknown[]
  create_time?: number
  update_time?: number
  [key: string]: unknown
}

export interface AgentSession {
  id: string
  name?: string
  canvas_id?: string
  create_time?: number
  update_time?: number
  create_date?: string
  update_date?: string
  message_count?: number
  messages?: AgentSessionMessage[]
  errors?: string
  source?: string
  round?: number
  duration?: number
  tokens?: number
  reference?: unknown[]
  latestMessageId?: string
  latestOutput?: unknown
  [key: string]: unknown
}

export interface AgentSessionListResponse {
  sessions: AgentSession[]
  total: number
}

export interface AgentExternalInputs {
  avatar?: string
  title?: string
  prologue?: string
  mode?: string
  inputs?: Record<string, AgentShareInputField>
}

export interface AgentInputFormSchema {
  [key: string]: unknown
}

export interface AgentShareInputField {
  key?: string
  type?: string
  value?: string
  optional?: boolean
  required?: boolean
  name?: string
  label?: string
  options?: Array<string | number | boolean>
  [key: string]: unknown
}

export interface AgentShareSummary {
  avatar?: string
  title: string
  prologue?: string
  mode: string
  inputs: Record<string, AgentShareInputField>
}

/**
 * datav workflow inputPlugin 人员数据项。
 * Begin 节点 `persondata` 输入类型的候选项：列表展示 `title`，选中推送 `dataobject`。
 */
export interface PersonDataItem {
  checked: boolean
  dataobject: string
  title: string
}

export interface AgentPublishSummary {
  id: string
  title: string
  avatar?: string
  isPublished: boolean
  lastPublishedAt?: number
  datasets: Array<{
    id: string
    name: string
    avatar?: string
  }>
}

export interface AgentWebhookSummary {
  canvasId: string
  url: string
  status: 'active' | 'inactive'
  title: string
  lastTriggeredAt?: number
}

export interface AgentWebhookTestRequest {
  canvasId: string
  method: string
  query?: Record<string, string>
  headers?: Record<string, string>
  body?: unknown
  contentType?: string
}

export interface AgentWebhookTraceRequest {
  since_ts?: number
  webhook_id?: string
}

export interface AgentWebhookTraceEvent {
  event?: string
  message_id?: string
  task_id?: string
  timestamp?: number
  time?: number
  message?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

export interface AgentWebhookTraceResponse {
  webhook_id?: string | null
  events?: AgentWebhookTraceEvent[]
  next_since_ts?: number
  finished?: boolean
  [key: string]: unknown
}

export interface AgentWebhookTraceSummary {
  webhookId?: string
  events: AgentWebhookTraceEvent[]
  nextSinceTs?: number
  finished: boolean
  status: 'idle' | 'running' | 'success' | 'error'
  errorMessage?: string
  firstInput?: unknown
  latestOutput?: unknown
}

export interface AgentCanvasUploadResult {
  id?: string
  name?: string
  filename?: string
  extension?: string
  mime_type?: string
  mimeType?: string
  preview_url?: string | null
  url?: string
  size?: number
  created_at?: number
  created_by?: string
  [key: string]: unknown
}
