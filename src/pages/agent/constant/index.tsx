// ==================== 节点类型枚举 ====================
// 使用常量对象替代enum以符合erasableSyntaxOnly要求

export const Operator = {
  // 核心节点
  Begin: 'Begin',
  Retrieval: 'Retrieval',
  Generate: 'Generate',
  Message: 'Message',
  
  // 控制流节点
  Categorize: 'Categorize',
  Switch: 'Switch',
  Relevant: 'Relevant',
  
  // 问题处理节点
  RewriteQuestion: 'RewriteQuestion',
  KeywordExtract: 'KeywordExtract',
  
  // Agent相关
  Agent: 'Agent',
  Tool: 'Tool',
  WaitingDialogue: 'WaitingDialogue',
  
  // 其他
  Note: 'Note',
  Placeholder: 'Placeholder',
  Iteration: 'Iteration',
  IterationStart: 'IterationStart',
  Code: 'Code',
  
  // 工具节点 (简化版，后续可扩展)
  DuckDuckGo: 'DuckDuckGo',
  Wikipedia: 'Wikipedia',
  
  // Invoke相关
  Invoke: 'Invoke',
  Email: 'Email',
} as const

export type Operator = (typeof Operator)[keyof typeof Operator]

// ==================== 节点ID常量 ====================
export const BeginId = 'begin'

export const NodeHandleId = {
  Start: 'start',
  End: 'end',
  Tool: 'tool',
  AgentTop: 'agentTop',
  AgentBottom: 'agentBottom',
  AgentException: 'agentException',
} as const

export type NodeHandleId = (typeof NodeHandleId)[keyof typeof NodeHandleId]

// ==================== 节点映射 ====================
export const NodeMap = {
  [Operator.Begin]: 'beginNode',
  [Operator.Retrieval]: 'retrievalNode',
  [Operator.Generate]: 'ragNode',
  [Operator.Message]: 'messageNode',
  [Operator.Categorize]: 'categorizeNode',
  [Operator.Switch]: 'switchNode',
  [Operator.Relevant]: 'relevantNode',
  [Operator.RewriteQuestion]: 'rewriteNode',
  [Operator.KeywordExtract]: 'keywordNode',
  [Operator.Agent]: 'agentNode',
  [Operator.Tool]: 'toolNode',
  [Operator.Note]: 'noteNode',
  [Operator.Placeholder]: 'placeholderNode',
  [Operator.Iteration]: 'group',
  [Operator.IterationStart]: 'iterationStartNode',
  [Operator.Code]: 'ragNode',
  [Operator.WaitingDialogue]: 'ragNode',
  [Operator.DuckDuckGo]: 'ragNode',
  [Operator.Wikipedia]: 'ragNode',
  [Operator.Invoke]: 'ragNode',
  [Operator.Email]: 'ragNode',
}

// ==================== Agent对话模式 ====================
export const AgentDialogueMode = {
  Conversational: 'conversational',
  Task: 'task',
} as const

export type AgentDialogueMode = (typeof AgentDialogueMode)[keyof typeof AgentDialogueMode]

// ==================== 初始值配置 ====================

// Agent全局变量
export const AgentGlobals = {
  SysQuery: 'query',
}

export const AgentGlobalsSysQueryWithBrace = '{query}'

// Begin节点初始值
export const initialBeginValues = {
  mode: AgentDialogueMode.Conversational,
  prologue: `Hi! I'm your assistant. What can I do for you?`,
}

// Retrieval节点初始值
export const initialRetrievalValues = {
  query: AgentGlobalsSysQueryWithBrace,
  top_n: 8,
  top_k: 1024,
  kb_ids: [],
  rerank_id: '',
  empty_response: '',
  similarity_threshold: 0.2,
  keywords_similarity_weight: 0.3,
}

// Generate节点初始值 (基础LLM配置)
export const initialLlmBaseValues = {
  llm_id: '',
  temperature: 0.1,
  top_p: 0.3,
  presence_penalty: 0.4,
  frequency_penalty: 0.7,
  max_tokens: 512,
}

export const initialGenerateValues = {
  ...initialLlmBaseValues,
  prompt: 'Please summarize the following content:\n\n{context}',
  cite: true,
  message_history_window_size: 12,
  parameters: [],
}

// Message节点初始值
export const initialMessageValues = {
  content: [''],
}

// Categorize节点初始值
export const initialCategorizeValues = {
  ...initialLlmBaseValues,
  query: AgentGlobals.SysQuery,
  parameter: 'precise',
  message_history_window_size: 1,
  items: [],
  outputs: {
    category_name: {
      type: 'string',
    },
  },
}

// Switch节点初始值
export const SwitchLogicOperatorOptions = ['and', 'or']

export const SwitchElseTo = 'end_cpn_ids'

export const initialSwitchValues = {
  conditions: [
    {
      logical_operator: SwitchLogicOperatorOptions[0],
      items: [
        {
          operator: '=',
        },
      ],
      to: [],
    },
  ],
  [SwitchElseTo]: [],
}

// RewriteQuestion节点初始值
export const initialRewriteQuestionValues = {
  ...initialLlmBaseValues,
  language: '',
  message_history_window_size: 6,
}

// KeywordExtract节点初始值
export const initialKeywordExtractValues = {
  ...initialLlmBaseValues,
  top_n: 3,
  query: [],
}

// Relevant节点初始值
export const initialRelevantValues = {
  ...initialLlmBaseValues,
}

// Note节点初始值
export const initialNoteValues = {
  text: '',
}

// Code节点初始值
export const ProgrammingLanguage = {
  Python: 'python',
  JavaScript: 'javascript',
}

export const CodeTemplateStrMap = {
  [ProgrammingLanguage.Python]: `def main(arg1, arg2):
    # Your code here
    return {"result": "success"}`,
  [ProgrammingLanguage.JavaScript]: `function main(arg1, arg2) {
    // Your code here
    return { result: "success" };
}`,
}

export const initialCodeValues = {
  lang: ProgrammingLanguage.Python,
  script: CodeTemplateStrMap[ProgrammingLanguage.Python],
  arguments: {
    arg1: '',
    arg2: '',
  },
  outputs: {},
}

// Agent节点初始值
export const PromptRole = {
  User: 'user',
  Assistant: 'assistant',
} as const

export type PromptRole = (typeof PromptRole)[keyof typeof PromptRole]

export const AgentStructuredOutputField = 'structured'

export const initialAgentValues = {
  ...initialLlmBaseValues,
  description: '',
  user_prompt: '',
  sys_prompt: 'You are a helpful AI assistant.',
  prompts: [{ role: PromptRole.User, content: `{${AgentGlobals.SysQuery}}` }],
  message_history_window_size: 12,
  max_retries: 3,
  delay_after_error: 1,
  visual_files_var: '',
  max_rounds: 1,
  exception_method: '',
  exception_goto: [],
  exception_default_value: '',
  tools: [],
  mcp: [],
  cite: true,
  outputs: {
    content: {
      type: 'string',
      value: '',
    },
    [AgentStructuredOutputField]: {},
  },
}

// Iteration节点初始值
export const initialIterationValues = {
  items_ref: '',
  outputs: {},
}

export const initialIterationStartValues = {
  outputs: {
    item: {
      type: 'unkown',
    },
    index: {
      type: 'integer',
    },
  },
}

// Placeholder节点初始值
export const initialPlaceholderValues = {}

// WaitingDialogue节点初始值
export const initialWaitingDialogueValues = {}

// Invoke节点初始值
export const initialInvokeValues = {
  url: '',
  method: 'GET',
  timeout: 60,
  headers: `{
  "Accept": "*/*",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive"
}`,
  proxy: '',
  clean_html: false,
  variables: [],
  outputs: {
    result: {
      value: '',
      type: 'string',
    },
  },
}

// Email节点初始值
export const initialEmailValues = {
  smtp_server: '',
  smtp_port: 465,
  email: '',
  password: '',
  sender_name: '',
  to_email: '',
  cc_email: '',
  subject: '',
  content: '',
  outputs: {
    success: {
      value: true,
      type: 'boolean',
    },
  },
}

// DuckDuckGo节点初始值
export const initialDuckValues = {
  top_n: 10,
  channel: 'text',
  query: AgentGlobals.SysQuery,
  outputs: {
    formalized_content: {
      value: '',
      type: 'string',
    },
    json: {
      value: [],
      type: 'Array<Object>',
    },
  },
}

// Wikipedia节点初始值
export const initialWikipediaValues = {
  top_n: 10,
  language: 'en',
  query: AgentGlobals.SysQuery,
  outputs: {
    formalized_content: {
      value: '',
      type: 'string',
    },
  },
}

// ==================== 节点连接限制 ====================
// key是源节点类型，value是不能作为目标节点的类型列表
export const RestrictedUpstreamMap: Record<Operator, Operator[]> = {
  [Operator.Begin]: [Operator.Relevant],
  [Operator.Retrieval]: [Operator.Begin, Operator.Retrieval],
  [Operator.Generate]: [],
  [Operator.Message]: [
    Operator.Begin,
    Operator.Message,
    Operator.Retrieval,
    Operator.RewriteQuestion,
    Operator.Categorize,
  ],
  [Operator.Categorize]: [Operator.Begin, Operator.Categorize],
  [Operator.Switch]: [Operator.Begin],
  [Operator.Relevant]: [Operator.Begin],
  [Operator.RewriteQuestion]: [
    Operator.Begin,
    Operator.Message,
    Operator.RewriteQuestion,
    Operator.Relevant,
  ],
  [Operator.KeywordExtract]: [
    Operator.Begin,
    Operator.Message,
    Operator.Relevant,
  ],
  [Operator.Agent]: [Operator.Begin],
  [Operator.Tool]: [Operator.Begin],
  [Operator.Note]: [],
  [Operator.Placeholder]: [Operator.Begin],
  [Operator.Iteration]: [Operator.Begin],
  [Operator.IterationStart]: [Operator.Begin],
  [Operator.Code]: [Operator.Begin],
  [Operator.WaitingDialogue]: [Operator.Begin],
  [Operator.DuckDuckGo]: [Operator.Begin, Operator.Retrieval],
  [Operator.Wikipedia]: [Operator.Begin, Operator.Retrieval],
  [Operator.Invoke]: [Operator.Begin],
  [Operator.Email]: [Operator.Begin],
}

// ==================== 不支持调试/复制的节点 ====================
export const NoDebugOperatorsList = [
  Operator.Begin,
  Operator.Message,
  Operator.RewriteQuestion,
  Operator.Switch,
  Operator.Iteration,
  Operator.IterationStart,
]

export const NoCopyOperatorsList = [
  Operator.Begin,
]

// ==================== Placeholder节点尺寸 ====================
export const PLACEHOLDER_NODE_WIDTH = 200
export const PLACEHOLDER_NODE_HEIGHT = 60
export const DROPDOWN_SPACING = 25
export const DROPDOWN_ADDITIONAL_OFFSET = 50
export const HALF_PLACEHOLDER_NODE_WIDTH = PLACEHOLDER_NODE_WIDTH / 2
export const HALF_PLACEHOLDER_NODE_HEIGHT =
  PLACEHOLDER_NODE_HEIGHT + DROPDOWN_SPACING + DROPDOWN_ADDITIONAL_OFFSET
export const DROPDOWN_HORIZONTAL_OFFSET = 28
export const DROPDOWN_VERTICAL_OFFSET = 74
export const PREVENT_CLOSE_DELAY = 300

// ==================== Categorize节点Handle位置 ====================
export const CategorizeAnchorPointPositions = [
  { top: 1, right: 34 },
  { top: 8, right: 18 },
  { top: 15, right: 10 },
  { top: 24, right: 4 },
  { top: 31, right: 1 },
  { top: 38, right: -2 },
  { top: 62, right: -2 }, // bottom
  { top: 71, right: 1 },
  { top: 79, right: 6 },
  { top: 86, right: 12 },
  { top: 91, right: 20 },
  { top: 98, right: 34 },
]

// ==================== Switch操作符选项 ====================
export const SwitchOperatorOptions = [
  { value: '=', label: 'equal' },
  { value: '≠', label: 'notEqual' },
  { value: '>', label: 'gt' },
  { value: '≥', label: 'ge' },
  { value: '<', label: 'lt' },
  { value: '≤', label: 'le' },
  { value: 'contains', label: 'contains' },
  { value: 'not contains', label: 'notContains' },
  { value: 'start with', label: 'startWith' },
  { value: 'end with', label: 'endWith' },
  { value: 'empty', label: 'empty' },
  { value: 'not empty', label: 'notEmpty' },
]

// ==================== Agent异常处理方法 ====================
export const AgentExceptionMethod = {
  Comment: 'comment',
  Goto: 'goto',
} as const

export type AgentExceptionMethod = (typeof AgentExceptionMethod)[keyof typeof AgentExceptionMethod]

// ==================== 变量类型 ====================
export const VariableType = {
  String: 'string',
  Array: 'array',
  File: 'file',
} as const

export type VariableType = (typeof VariableType)[keyof typeof VariableType]

// ==================== Begin节点查询类型 ====================
export const BeginQueryType = {
  Line: 'line',
  Paragraph: 'paragraph',
  Options: 'options',
  File: 'file',
  Integer: 'integer',
  Boolean: 'boolean',
} as const

export type BeginQueryType = (typeof BeginQueryType)[keyof typeof BeginQueryType]

