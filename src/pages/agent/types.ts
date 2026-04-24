import type { Edge, Node } from '@xyflow/react'

// ==================== DSL相关类型 ====================

export type DSLComponents = Record<string, IOperator>

export interface IOperator {
  obj: IOperatorNode
  downstream: string[]
  upstream: string[]
  parent_id?: string
}

export interface IOperatorNode {
  component_name: string
  params: Record<string, unknown>
}

export interface DSL {
  components: DSLComponents
  history: any[]
  path?: string[][]
  answer?: any[]
  graph?: IGraph
  messages: any[]
  reference: any[]
  globals: Record<string, any>
  retrieval: any[]
}

export interface IGraph {
  nodes: RAGFlowNodeType[]
  edges: Edge[]
}

// ==================== Flow/Agent相关类型 ====================

export interface IFlow {
  avatar?: string
  canvas_type: 'agent' | 'pipeline' | 'Recommended' | null
  canvas_category?: string
  create_date?: string
  create_time: number
  description: string | { en?: string; zh?: string }
  dsl: DSL
  id: string
  title: string | { en?: string; zh?: string }
  update_date?: string
  update_time: number
  user_id: string
  permission: string
  nickname?: string
  release?: boolean
  release_time?: number
  last_publish_time?: number
}

// ==================== 节点表单类型 ====================

// LLM基础配置
export interface ILLMConfig {
  llm_id?: string
  temperature?: number
  top_p?: number
  presence_penalty?: number
  frequency_penalty?: number
  max_tokens?: number
}

// Begin节点表单
export interface IBeginForm {
  enablePrologue?: boolean
  prologue?: string
  mode?: string
  inputs?: Record<string, any>
  layout_recognize?: string
  methods?: string[]
  content_types?: string
  security?: {
    auth_type?: string
    ip_whitelist?: Array<{ value?: string }>
    token?: {
      token_header?: string
      token_value?: string
    }
    basic_auth?: {
      username?: string
      password?: string
    }
    rate_limit?: {
      limit?: number
      per?: string
    }
    max_body_size?: string
    jwt?: {
      algorithm?: string
      secret?: string
      issuer?: string
      audience?: string
      required_claims?: Array<{ value?: string }>
    }
    hmac?: {
      header?: string
      secret?: string
    }
  }
  schema?: {
    query?: Array<{ key?: string; type?: string; required?: boolean }>
    headers?: Array<{ key?: string; type?: string; required?: boolean }>
    body?: Array<{ key?: string; type?: string; required?: boolean }>
  }
  response?: {
    status?: number
    body_template?: string
  }
  execution_mode?: string
  outputs?: Record<string, any>
}

// Retrieval节点表单
export interface IRetrievalForm {
  similarity_threshold?: number
  keywords_similarity_weight?: number
  top_n?: number
  top_k?: number
  rerank_id?: string
  empty_response?: string
  kb_ids: string[]
  query?: string
}

// Message节点表单
export interface IMessageForm {
  content: string[]
  output_format?: string
  auto_play?: boolean
  status?: number
  memory_ids?: string[]
  user_id?: string
}

// Categorize节点表单
export interface ICategorizeItem {
  name: string
  description?: string
  examples?: Array<{ value: string | number | boolean }>
  to?: string
  index: number
  uuid?: string
}

// ICategorizeItemResult中的examples是string数组
export interface ICategorizeItemResultItem {
  description?: string
  examples?: (string | number | boolean)[]
  to?: string
  index: number
  uuid?: string
}

export type ICategorizeItemResult = Record<string, ICategorizeItemResultItem>

export interface ICategorizeForm extends ILLMConfig {
  query?: string
  parameter?: string
  message_history_window_size?: number
  items?: ICategorizeItem[]
  category_description?: ICategorizeItemResult
  outputs?: Record<string, any>
}

// Switch节点表单
export interface ISwitchItem {
  cpn_id: string
  operator: string
  value: string
}

export interface ISwitchCondition {
  items: ISwitchItem[]
  logical_operator: string
  to: string[] | string
}

export interface ISwitchForm {
  conditions: ISwitchCondition[]
  end_cpn_id?: string
  end_cpn_ids?: string[]
}

// Relevant节点表单
export interface IRelevantForm extends ILLMConfig {
  yes?: string
  no?: string
}

// Code节点表单
export interface ICodeForm {
  inputs?: Array<{ name?: string; component_id?: string }>
  lang: string
  script?: string
  arguments?: Record<string, any>
  outputs?: Record<string, any>
}

// Agent节点表单
export interface IAgentForm extends ILLMConfig {
  description?: string
  user_prompt?: string
  sys_prompt?: string
  prompts?: Array<{ role: string; content: string }>
  showStructuredOutput?: boolean
  message_history_window_size?: number
  max_retries?: number
  delay_after_error?: number
  visual_files_var?: string
  max_rounds?: number
  exception_method?: string
  exception_goto?: string[]
  exception_default_value?: string
  tools?: Array<{
    component_name: string
    id: string
    name: string
    params: Record<string, any>
  }>
  mcp?: any[]
  cite?: boolean
  outputs?: Record<string, any>
}

// ==================== 节点数据类型 ====================

export type BaseNodeData<TForm = any> = {
  label: string // operator type
  name: string // operator name
  color?: string
  form?: TForm
}

export type BaseNode<T = any> = Node<BaseNodeData<T>>

// 具体节点类型
export type IBeginNode = BaseNode<IBeginForm>
export type IRetrievalNode = BaseNode<IRetrievalForm>
export type IMessageNode = BaseNode<IMessageForm>
export type ICategorizeNode = BaseNode<ICategorizeForm>
export type ISwitchNode = BaseNode<ISwitchForm>
export type IRelevantNode = BaseNode<IRelevantForm>
export type ICodeNode = BaseNode<ICodeForm>
export type IAgentNode<T = any> = BaseNode<T>
export type IRagNode = BaseNode
export type INoteNode = BaseNode
export type IRewriteNode = BaseNode
export type IKeywordNode = BaseNode
export type IInvokeNode = BaseNode
export type IEmailNode = BaseNode
export type IIterationNode = BaseNode
export type IIterationStartNode = BaseNode
export type IPlaceholderNode = BaseNode

// 联合类型
export type RAGFlowNodeType =
  | IBeginNode
  | IRetrievalNode
  | IMessageNode
  | ICategorizeNode
  | ISwitchNode
  | IRelevantNode
  | ICodeNode
  | IAgentNode
  | IRagNode
  | INoteNode
  | IRewriteNode
  | IKeywordNode
  | IInvokeNode
  | IEmailNode
  | IIterationNode
  | IIterationStartNode
  | IPlaceholderNode
  | ILoopNode
  | IDataOperationsNode
  | IListOperationsNode
  | IVariableAggregatorNode
  | IVariableAssignerNode
  | IExitLoopNode
  | ILoopStartNode
  | ICrawlerNode
  | IExeSQLNode
  | IUserFillUpNode
  | IStringTransformNode
  | IPDFGeneratorNode
  | IFileNode
  | IParserNode
  | ITokenizerNode
  | ISplitterNode
  | IExtractorNode
  | IExcelProcessorNode

// ==================== 新增节点表单类型 ====================

// Loop节点表单
export interface ILoopForm {
  loop_variables?: any[]
  loop_termination_condition?: any[]
  maximum_loop_count?: number
  outputs?: Record<string, any>
}

// DataOperations节点表单
export interface IDataOperationsForm {
  query?: Array<{ input?: string }>
  operations?: string
  select_keys?: Array<{ name?: string }>
  remove_keys?: Array<{ name?: string }>
  updates?: Array<{ key?: string; value?: string }>
  rename_keys?: Array<{ old_key?: string; new_key?: string }>
  filter_values?: Array<{ key?: string; operator?: string; value?: string }>
  outputs?: Record<string, any>
}

// ListOperations节点表单
export interface IListOperationsForm {
  query?: string
  operations?: string
  n?: number
  sort_method?: string
  filter?: {
    operator?: string
    value?: string
  }
  outputs?: Record<string, any>
}

// VariableAggregator节点表单
export interface IVariableAggregatorForm {
  outputs?: Record<string, any>
  groups?: any[]
}

// VariableAssigner节点表单
export interface IVariableAssignerForm {
  variables?: Array<{
    variable?: string
    operator?: string
    parameter?: string | number | boolean
  }>
  outputs?: Record<string, any>
}

// ExitLoop节点表单
export interface IExitLoopForm {
  [key: string]: any
}

// Crawler节点表单
export interface ICrawlerForm {
  extract_type?: string
  query?: string
}

// ExeSQL节点表单
export interface IExeSQLForm {
  sql?: string
  db_type?: string
  database?: string
  username?: string
  host?: string
  port?: number
  password?: string
  max_records?: number
  outputs?: Record<string, any>
}

// UserFillUp节点表单
export interface IUserFillUpForm {
  enable_tips?: boolean
  tips?: string
  inputs?: any[]
  layout_recognize?: string
  outputs?: Record<string, any>
}

// StringTransform节点表单
export interface IStringTransformForm {
  method?: string
  split_ref?: string
  script?: string
  delimiters?: string[]
  outputs?: Record<string, any>
}

// PDFGenerator节点表单
export interface IPDFGeneratorForm {
  output_format?: string
  content?: string
  title?: string
  subtitle?: string
  outputs?: Record<string, any>
  [key: string]: any
}

// Pipeline节点表单
export interface IFileForm {
  outputs?: Record<string, any>
}

export interface IParserForm {
  outputs?: Record<string, any>
  setups?: any[]
}

export interface ITokenizerForm {
  search_method?: string[]
  filename_embd_weight?: number
  fields?: string
  outputs?: Record<string, any>
}

export interface ISplitterForm {
  outputs?: Record<string, any>
  chunk_token_size?: number
  overlapped_percent?: number
  delimiters?: Array<{ value: string }>
  image_table_context_window?: number
}

export interface IExtractorForm extends ILLMConfig {
  field_name?: string
  outputs?: Record<string, any>
}

// ==================== 新增具体节点类型 ====================
export type ILoopNode = BaseNode<ILoopForm>
export type IDataOperationsNode = BaseNode<IDataOperationsForm>
export type IListOperationsNode = BaseNode<IListOperationsForm>
export type IVariableAggregatorNode = BaseNode<IVariableAggregatorForm>
export type IVariableAssignerNode = BaseNode<IVariableAssignerForm>
export type IExitLoopNode = BaseNode<IExitLoopForm>
export type ILoopStartNode = BaseNode
export type ICrawlerNode = BaseNode<ICrawlerForm>
export type IExeSQLNode = BaseNode<IExeSQLForm>
export type IUserFillUpNode = BaseNode<IUserFillUpForm>
export type IStringTransformNode = BaseNode<IStringTransformForm>
export type IPDFGeneratorNode = BaseNode<IPDFGeneratorForm>
export type IFileNode = BaseNode<IFileForm>
export type IParserNode = BaseNode<IParserForm>
export type ITokenizerNode = BaseNode<ITokenizerForm>
export type ISplitterNode = BaseNode<ISplitterForm>
export type IExtractorNode = BaseNode<IExtractorForm>
export type IExcelProcessorNode = BaseNode

// ==================== 辅助类型 ====================

export interface IPosition {
  top: number
  right: number
  idx: number
}

export interface BeginQuery {
  key: string
  type: string
  value: string
  optional: boolean
  name: string
  label?: string
  required?: boolean
  options?: (number | string | boolean)[]
}

// Export BeginQuery from this module
export type { BeginQuery as IBeginQuery }

export type IInputs = {
  avatar: string
  title: string
  inputs: Record<string, BeginQuery>
  prologue: string
  mode: string
}

export type IOutputs = Record<
  string,
  {
    type?: string
    value?: string
  }
>

// ==================== Form接口 ====================
export interface IOperatorForm {
  onValuesChange?(changedValues: any, values: any): void
  node?: RAGFlowNodeType
  nodeId?: string
}

export interface INextOperatorForm {
  node?: RAGFlowNodeType
  nodeId?: string
}

export interface IGenerateParameter {
  id?: string
  key: string
  component_id?: string
}

export interface IInvokeVariable extends IGenerateParameter {
  value?: string
}

// ==================== 执行/事件相关类型 ====================
export const MessageEventType = {
  NodeStarted: 'node_started',
  NodeFinished: 'node_finished',
  Message: 'message',
  MessageEnd: 'message_end',
  WorkflowFinished: 'workflow_finished',
  UserInputs: 'user_inputs',
  Error: 'error',
} as const

export type MessageEventType =
  (typeof MessageEventType)[keyof typeof MessageEventType]

export interface IEventList {
  event_type: MessageEventType
  data: any
  message_id?: string
  task_id?: string
  component_id?: string
  elapsed_time?: number
}

// `ITraceData` is the legacy alias for the unified domain trace shape from
// `@/types/agent`. Pipeline workbench (T6) and trace adapter both consume the
// shared `AgentTraceItem` type — this re-export keeps any historical import
// paths compatible without diverging the data model again.
export type { AgentTraceItem as ITraceData } from '@/types/agent'

// ==================== API请求/响应类型 ====================

export interface IAgentListRequest {
  page?: number
  page_size?: number
  orderby?: string
  desc?: boolean
  name?: string
  canvas_type?: string
}

export interface IAgentListResponse {
  canvas: IFlow[]
  total: number
}

export interface ISetAgentRequest {
  id?: string
  title: string
  description?: string
  dsl?: DSL
  canvas_type?: 'agent' | 'pipeline'
  avatar?: string
  permission?: string
}

export interface IRunAgentRequest {
  id: string
  query?: string
  session_id?: string | null
  files?: any[]
}

export interface IDebugNodeRequest {
  canvas_id: string
  component_id: string
  inputs?: Record<string, any>
}
