import { initialParserFormValues } from '../form/parser/utils'

// ==================== 节点类型枚举 ====================
// 使用常量对象替代enum以符合erasableSyntaxOnly要求

export const Operator = {
  // 核心节点
  Begin: 'Begin',
  Retrieval: 'Retrieval',
  Message: 'Message',
  A2UI: 'A2UI',

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
  IterationStart: 'IterationItem',
  Code: 'CodeExec',

  // 搜索工具节点
  DuckDuckGo: 'DuckDuckGo',
  Wikipedia: 'Wikipedia',
  PubMed: 'PubMed',
  ArXiv: 'ArXiv',
  Google: 'Google',
  Bing: 'Bing',
  GoogleScholar: 'GoogleScholar',
  GitHub: 'GitHub',
  SearXNG: 'SearXNG',
  TavilySearch: 'TavilySearch',
  TavilyExtract: 'TavilyExtract',
  WenCai: 'WenCai',
  YahooFinance: 'YahooFinance',

  // 数据/工具节点
  ExeSQL: 'ExeSQL',
  Crawler: 'Crawler',
  Invoke: 'Invoke',
  Email: 'Email',
  UserFillUp: 'UserFillUp',
  StringTransform: 'StringTransform',
  PDFGenerator: 'PDFGenerator',
  ExcelProcessor: 'ExcelProcessor',

  // 数据操作节点
  DataOperations: 'DataOperations',
  ListOperations: 'ListOperations',
  VariableAssigner: 'VariableAssigner',
  VariableAggregator: 'VariableAggregator',

  // 循环节点
  Loop: 'Loop',
  LoopStart: 'LoopItem',
  ExitLoop: 'ExitLoop',

  // Pipeline节点
  File: 'File',
  Parser: 'Parser',
  Tokenizer: 'Tokenizer',
  Splitter: 'Splitter',
  HierarchicalMerger: 'HierarchicalMerger',
  Extractor: 'Extractor',
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

export const RewriteQuestionHandleId = {
  Left: 'c',
  Right: 'b',
} as const

// ==================== 节点映射 ====================
export const NodeMap: Record<string, string> = {
  [Operator.Begin]: 'beginNode',
  [Operator.Retrieval]: 'retrievalNode',
  [Operator.Message]: 'messageNode',
  [Operator.A2UI]: 'a2uiNode',
  [Operator.Categorize]: 'categorizeNode',
  [Operator.Switch]: 'switchNode',
  [Operator.Relevant]: 'relevantNode',
  [Operator.RewriteQuestion]: 'rewriteNode',
  [Operator.Agent]: 'agentNode',
  [Operator.Tool]: 'toolNode',
  [Operator.Note]: 'noteNode',
  [Operator.Placeholder]: 'placeholderNode',
  [Operator.Iteration]: 'iterationNode',
  [Operator.IterationStart]: 'iterationStartNode',
  [Operator.Code]: 'ragNode',
  [Operator.WaitingDialogue]: 'ragNode',
  [Operator.DuckDuckGo]: 'ragNode',
  [Operator.Wikipedia]: 'ragNode',
  [Operator.PubMed]: 'ragNode',
  [Operator.ArXiv]: 'ragNode',
  [Operator.Google]: 'ragNode',
  [Operator.Bing]: 'ragNode',
  [Operator.GoogleScholar]: 'ragNode',
  [Operator.GitHub]: 'ragNode',
  [Operator.SearXNG]: 'ragNode',
  [Operator.TavilySearch]: 'ragNode',
  [Operator.TavilyExtract]: 'ragNode',
  [Operator.WenCai]: 'ragNode',
  [Operator.YahooFinance]: 'ragNode',
  [Operator.ExeSQL]: 'ragNode',
  [Operator.Crawler]: 'ragNode',
  [Operator.Invoke]: 'ragNode',
  [Operator.Email]: 'ragNode',
  [Operator.UserFillUp]: 'ragNode',
  [Operator.StringTransform]: 'ragNode',
  [Operator.PDFGenerator]: 'ragNode',
  [Operator.ExcelProcessor]: 'ragNode',
  [Operator.DataOperations]: 'dataOperationsNode',
  [Operator.ListOperations]: 'listOperationsNode',
  [Operator.VariableAssigner]: 'variableAssignerNode',
  [Operator.VariableAggregator]: 'variableAggregatorNode',
  [Operator.Loop]: 'loopNode',
  [Operator.LoopStart]: 'loopStartNode',
  [Operator.ExitLoop]: 'exitLoopNode',
  [Operator.File]: 'fileNode',
  [Operator.Parser]: 'parserNode',
  [Operator.Tokenizer]: 'tokenizerNode',
  [Operator.Splitter]: 'splitterNode',
  [Operator.HierarchicalMerger]: 'splitterNode',
  [Operator.Extractor]: 'contextNode',
}

// ==================== Agent对话模式 ====================
export const AgentDialogueMode = {
  Conversational: 'conversational',
  Task: 'task',
  Webhook: 'Webhook',
} as const

export type AgentDialogueMode =
  (typeof AgentDialogueMode)[keyof typeof AgentDialogueMode]

// ==================== 初始值配置 ====================

// Agent全局变量
export const AgentGlobals = {
  SysQuery: 'sys.query',
  SysUserId: 'sys.user_id',
  SysConversationTurns: 'sys.conversation_turns',
  SysFiles: 'sys.files',
  SysHistory: 'sys.history',
  SysDate: 'sys.date',
} as const

export type AgentGlobals = (typeof AgentGlobals)[keyof typeof AgentGlobals]

export const AgentGlobalsSysQueryWithBrace = `{${AgentGlobals.SysQuery}}`

// Agent分类与查询常量
export const AgentCategory = {
  AgentCanvas: 'agent_canvas',
  DataflowCanvas: 'dataflow_canvas',
} as const

export type AgentCategory = (typeof AgentCategory)[keyof typeof AgentCategory]

export const AgentQuery = {
  Category: 'category',
} as const

export type AgentQuery = (typeof AgentQuery)[keyof typeof AgentQuery]

// Begin节点初始值
export const initialBeginValues = {
  enablePrologue: true,
  mode: AgentDialogueMode.Conversational,
  prologue: `Hi! I'm your assistant. What can I do for you?`,
  inputs: {} as Record<string, unknown>,
  layout_recognize: 'DeepDOC',
  methods: ['GET'],
  content_types: 'application/json',
  security: {
    auth_type: 'basic',
    ip_whitelist: [] as Array<{ value: string }>,
    token: {
      token_header: '',
      token_value: '',
    },
    basic_auth: {
      username: '',
      password: '',
    },
    rate_limit: {
      limit: 10,
      per: 'second',
    },
    max_body_size: '1MB',
    jwt: {
      algorithm: 'HS256',
      secret: '',
      issuer: '',
      audience: '',
      required_claims: [] as Array<{ value: string }>,
    },
    hmac: {
      header: '',
      secret: '',
    },
  },
  schema: {
    query: [] as Array<{ key: string; type: string; required: boolean }>,
    headers: [] as Array<{ key: string; type: string; required: boolean }>,
    body: [] as Array<{ key: string; type: string; required: boolean }>,
  },
  response: {
    status: 200,
    body_template: '',
  },
  execution_mode: 'Immediately',
  outputs: {} as Record<string, unknown>,
}

// Retrieval节点初始值
export const RetrievalFrom = {
  Dataset: 'dataset',
  Memory: 'memory',
} as const

export type RetrievalFrom = (typeof RetrievalFrom)[keyof typeof RetrievalFrom]

export const initialRetrievalValues = {
  query: AgentGlobalsSysQueryWithBrace,
  top_n: 8,
  top_k: 1024,
  kb_ids: [],
  memory_ids: [] as string[],
  user_id: '',
  rerank_id: '',
  empty_response: '',
  similarity_threshold: 0.2,
  keywords_similarity_weight: 0.3,
  retrieval_from: RetrievalFrom.Dataset,
  cross_languages: [] as string[],
  use_kg: false,
  toc_enhance: false,
  meta_data_filter: {
    method: 'manual',
    logic: 'and',
    manual: [] as Array<{ key: string; op: string; value: string }>,
    semi_auto: [] as string[],
  },
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

// 通用LLM基础配置
export const initialLlmBaseValues = {
  llm_id: '',
  temperature: 0.1,
  top_p: 0.3,
  presence_penalty: 0.4,
  frequency_penalty: 0.7,
  max_tokens: 512,
}

// Message节点初始值
export const initialMessageValues = {
  content: [''],
  output_format: '',
  auto_play: false,
  status: 200,
  memory_ids: [] as string[],
  user_id: '',
}

export const A2UIBasicCatalogId =
  'https://a2ui.org/specification/v0_9/basic_catalog.json'

export const initialA2UIValues = {
  commands: [
    JSON.stringify(
      [
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'message-card',
            catalogId: A2UIBasicCatalogId,
          },
        },
        {
          version: 'v0.9',
          updateComponents: {
            surfaceId: 'message-card',
            components: [
              {
                id: 'root',
                component: 'Card',
                child: 'content',
              },
              {
                id: 'content',
                component: 'Text',
                text: 'Hello A2UI',
              },
            ],
          },
        },
      ],
      null,
      2,
    ),
  ],
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
          cpn_id: '',
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
  showStructuredOutput: false,
  outputs: {
    content: {
      type: 'string',
      value: '',
    },
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
  datatype: 'json',
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
  smtp_username: '',
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
export const Channel = {
  Text: 'text',
  News: 'news',
} as const

export type Channel = (typeof Channel)[keyof typeof Channel]

export const initialDuckValues = {
  top_n: 10,
  channel: Channel.Text,
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

// PubMed节点初始值
export const initialPubMedValues = {
  top_n: 12,
  email: '',
  query: AgentGlobals.SysQuery,
  outputs: {
    formalized_content: {
      value: '',
      type: 'string',
    },
  },
}

// ArXiv节点初始值
export const initialArXivValues = {
  top_n: 12,
  sort_by: 'relevance',
  query: AgentGlobals.SysQuery,
  outputs: {
    formalized_content: {
      value: '',
      type: 'string',
    },
  },
}

// Google节点初始值
export const initialGoogleValues = {
  q: AgentGlobals.SysQuery,
  start: 0,
  num: 12,
  api_key: '',
  country: 'us',
  language: 'en',
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

// Bing节点初始值
export const initialBingValues = {
  top_n: 10,
  channel: 'Webpages',
  api_key:
    'YOUR_API_KEY (obtained from https://www.microsoft.com/en-us/bing/apis/bing-web-search-api)',
  country: 'CH',
  language: 'en',
  query: '',
}

// GoogleScholar节点初始值
export const initialGoogleScholarValues = {
  top_n: 12,
  sort_by: 'relevance',
  patents: true,
  query: AgentGlobals.SysQuery,
  year_low: undefined as number | undefined,
  year_high: undefined as number | undefined,
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

// GitHub节点初始值
export const initialGithubValues = {
  top_n: 5,
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

// ExeSQL节点初始值
export const initialExeSqlValues = {
  sql: '',
  db_type: 'mysql',
  database: '',
  username: '',
  host: '',
  port: 3306,
  password: '',
  max_records: 1024,
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

// WenCai节点初始值
export const initialWenCaiValues = {
  top_n: 20,
  query_type: 'stock',
  query: AgentGlobals.SysQuery,
  outputs: {
    report: {
      value: '',
      type: 'string',
    },
  },
}

// YahooFinance节点初始值
export const initialYahooFinanceValues = {
  stock_code: '',
  info: true,
  history: false,
  financials: false,
  balance_sheet: false,
  cash_flow_statement: false,
  news: true,
  outputs: {
    report: {
      value: '',
      type: 'string',
    },
  },
}

// Crawler节点初始值
export const initialCrawlerValues = {
  proxy: '',
  extract_type: 'markdown',
  query: '',
}

// SearXNG节点初始值
export const initialSearXNGValues = {
  top_n: '10',
  searxng_url: '',
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

// TavilySearch节点初始值
export const TavilySearchDepth = {
  Basic: 'basic',
  Advanced: 'advanced',
} as const

export const TavilyTopic = {
  News: 'news',
  General: 'general',
} as const

export const initialTavilyValues = {
  api_key: '',
  query: AgentGlobals.SysQuery,
  search_depth: TavilySearchDepth.Basic,
  topic: TavilyTopic.General,
  max_results: 5,
  days: 7,
  include_answer: false,
  include_raw_content: true,
  include_images: false,
  include_image_descriptions: false,
  include_domains: [] as string[],
  exclude_domains: [] as string[],
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

// TavilyExtract节点初始值
export const TavilyExtractDepth = {
  Basic: 'basic',
  Advanced: 'advanced',
} as const

export const TavilyExtractFormat = {
  Text: 'text',
  Markdown: 'markdown',
} as const

export const initialTavilyExtractValues = {
  urls: '',
  extract_depth: TavilyExtractDepth.Basic,
  format: TavilyExtractFormat.Markdown,
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

// UserFillUp节点初始值
export const initialUserFillUpValues = {
  enable_tips: true,
  tips: '',
  inputs: [] as unknown[],
  layout_recognize: 'DeepDOC',
  outputs: {},
}

// StringTransform节点初始值
export const StringTransformMethod = {
  Merge: 'merge',
  Split: 'split',
} as const

export const StringTransformDelimiter = {
  Comma: ',',
  Semicolon: ';',
  Period: '.',
  LineBreak: '\n',
  Tab: '\t',
  Space: ' ',
} as const

export const initialStringTransformValues = {
  method: StringTransformMethod.Merge,
  split_ref: '',
  script: '',
  delimiters: [StringTransformDelimiter.Comma],
  outputs: {
    result: {
      type: 'string',
    },
  },
}

// DataOperations节点初始值
export const ComparisonOperator = {
  Equal: '=',
  NotEqual: '≠',
  GreatThan: '>',
  GreatEqual: '≥',
  LessThan: '<',
  LessEqual: '≤',
  Contains: 'contains',
  NotContains: 'not contains',
  StartWith: 'start with',
  EndWith: 'end with',
  Empty: 'empty',
  NotEmpty: 'not empty',
  In: 'in',
  NotIn: 'not in',
} as const

export type ComparisonOperator =
  (typeof ComparisonOperator)[keyof typeof ComparisonOperator]

export const Operations = {
  SelectKeys: 'select_keys',
  LiteralEval: 'literal_eval',
  Combine: 'combine',
  FilterValues: 'filter_values',
  AppendOrUpdate: 'append_or_update',
  RemoveKeys: 'remove_keys',
  RenameKeys: 'rename_keys',
} as const

export const initialDataOperationsValues = {
  query: [] as Array<{ input: string }>,
  operations: Operations.SelectKeys,
  select_keys: [] as Array<{ name: string }>,
  remove_keys: [] as Array<{ name: string }>,
  updates: [] as Array<{ key: string; value: string }>,
  rename_keys: [] as Array<{ old_key: string; new_key: string }>,
  filter_values: [] as Array<{ key: string; operator: string; value: string }>,
  outputs: {
    result: {
      type: 'Array<Object>',
    },
  },
}

// ListOperations节点初始值
export const ListOperations = {
  TopN: 'topN',
  Head: 'head',
  Tail: 'tail',
  Filter: 'filter',
  Sort: 'sort',
  DropDuplicates: 'drop_duplicates',
} as const

export const SortMethod = {
  Asc: 'asc',
  Desc: 'desc',
} as const

export const initialListOperationsValues = {
  query: '',
  operations: ListOperations.TopN,
  n: 1,
  sort_method: SortMethod.Asc,
  filter: {
    operator: ComparisonOperator.Equal,
    value: '',
  },
  outputs: {
    result: {
      type: 'Array<unknown>',
    },
    first: {
      type: 'unknown',
    },
    last: {
      type: 'unknown',
    },
  },
}

// VariableAssigner节点初始值
export const VariableAssignerLogicalOperator = {
  Overwrite: 'overwrite',
  Clear: 'clear',
  Set: 'set',
} as const

export const VariableAssignerLogicalNumberOperator = {
  Overwrite: 'overwrite',
  Clear: 'clear',
  Set: 'set',
  Add: '+=',
  Subtract: '-=',
  Multiply: '*=',
  Divide: '/=',
} as const

export const VariableAssignerLogicalNumberOperatorLabelMap = {
  [VariableAssignerLogicalNumberOperator.Add]: 'add',
  [VariableAssignerLogicalNumberOperator.Subtract]: 'subtract',
  [VariableAssignerLogicalNumberOperator.Multiply]: 'multiply',
  [VariableAssignerLogicalNumberOperator.Divide]: 'divide',
} as const

export const VariableAssignerLogicalArrayOperator = {
  Overwrite: 'overwrite',
  Clear: 'clear',
  Append: 'append',
  Extend: 'extend',
  RemoveFirst: 'remove_first',
  RemoveLast: 'remove_last',
} as const

export const initialVariableAssignerValues = {
  variables: [] as Array<{
    variable: string
    operator: string
    parameter: string | number | boolean
  }>,
  outputs: {},
}

// VariableAggregator节点初始值
export const initialVariableAggregatorValues = {
  outputs: {},
  groups: [] as unknown[],
}

// Loop节点初始值
export const initialLoopValues = {
  loop_variables: [] as unknown[],
  loop_termination_condition: [] as unknown[],
  maximum_loop_count: 10,
  outputs: {},
}

// ExcelProcessor节点初始值
export const initialExcelProcessorValues = {
  input_files: [] as unknown[],
  operation: 'read',
  sheet_selection: 'all',
  merge_strategy: 'concat',
  join_on: '',
  transform_data: '',
  output_format: 'xlsx',
  output_filename: 'output',
  outputs: {
    data: { type: 'object', value: {} },
    summary: { type: 'string', value: '' },
    markdown: { type: 'string', value: '' },
  },
}

// PDFGenerator节点初始值
export const PDFGeneratorFontFamily = {
  Helvetica: 'Helvetica',
  TimesRoman: 'Times-Roman',
  Courier: 'Courier',
  HelveticaBold: 'Helvetica-Bold',
  TimesBold: 'Times-Bold',
} as const

export const PDFGeneratorLogoPosition = {
  Left: 'left',
  Center: 'center',
  Right: 'right',
} as const

export const PDFGeneratorPageSize = {
  A4: 'A4',
  Letter: 'Letter',
} as const

export const PDFGeneratorOrientation = {
  Portrait: 'portrait',
  Landscape: 'landscape',
} as const

export const initialPDFGeneratorValues = {
  output_format: 'pdf',
  content: '',
  title: '',
  subtitle: '',
  header_text: '',
  footer_text: '',
  logo_image: '',
  logo_position: PDFGeneratorLogoPosition.Left,
  logo_width: 2.0,
  logo_height: 1.0,
  font_family: PDFGeneratorFontFamily.Helvetica,
  font_size: 12,
  title_font_size: 24,
  heading1_font_size: 18,
  heading2_font_size: 16,
  heading3_font_size: 14,
  text_color: '#000000',
  title_color: '#000000',
  page_size: PDFGeneratorPageSize.A4,
  orientation: PDFGeneratorOrientation.Portrait,
  margin_top: 1.0,
  margin_bottom: 1.0,
  margin_left: 1.0,
  margin_right: 1.0,
  line_spacing: 1.2,
  filename: '',
  output_directory: '/tmp/pdf_outputs',
  add_page_numbers: true,
  add_timestamp: true,
  watermark_text: '',
  enable_toc: false,
  outputs: {
    file_path: { type: 'string' },
    pdf_base64: { type: 'string' },
    download: { type: 'string' },
    success: { type: 'boolean' },
  },
}

// Pipeline节点初始值
export const initialFileValues = {
  outputs: {
    name: { type: 'string', value: '' },
    file: { type: 'Object', value: {} },
  },
}

export const initialParserValues = initialParserFormValues

export const initialTokenizerValues = {
  search_method: ['embedding', 'full_text'],
  filename_embd_weight: 0.1,
  fields: 'text',
  outputs: {},
}

export const initialSplitterValues = {
  outputs: {
    chunks: { type: 'Array<Object>', value: [] },
  },
  chunk_token_size: 512,
  overlapped_percent: 0,
  delimiters: [{ value: '\n' }],
  enable_children: false,
  children_delimiters: [] as Array<{ value: string }>,
  image_table_context_window: 0,
}

export const initialHierarchicalMergerValues = {
  outputs: {
    chunks: { type: 'Array<Object>', value: [] },
  },
  hierarchy: '3',
  levels: [
    { expressions: [{ expression: '^#[^#]' }] },
    { expressions: [{ expression: '^##[^#]' }] },
    { expressions: [{ expression: '^###[^#]' }] },
    { expressions: [{ expression: '^####[^#]' }] },
  ],
}

export const initialExtractorValues = {
  ...initialLlmBaseValues,
  field_name: 'summary',
  sys_prompt:
    'Extract a concise summary for each chunk. Keep factual details and avoid unrelated commentary.',
  prompts: 'Summarize the following content:\n\n{Parser@text}',
  outputs: {
    chunks: { type: 'Array<Object>', value: [] },
  },
}

// ==================== 节点连接限制 ====================
// key是源节点类型，value是不能作为目标节点的类型列表
export const RestrictedUpstreamMap: Record<string, Operator[]> = {
  [Operator.Begin]: [Operator.Begin],
  [Operator.Retrieval]: [Operator.Begin, Operator.Retrieval],
  [Operator.Message]: [
    Operator.Begin,
    Operator.Message,
    Operator.A2UI,
    Operator.Retrieval,
    Operator.RewriteQuestion,
    Operator.Categorize,
  ],
  [Operator.A2UI]: [Operator.Begin, Operator.Message, Operator.A2UI],
  [Operator.Categorize]: [Operator.Begin],
  [Operator.Switch]: [Operator.Begin],
  [Operator.Relevant]: [Operator.Begin],
  [Operator.RewriteQuestion]: [
    Operator.Begin,
    Operator.Message,
    Operator.RewriteQuestion,
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
  [Operator.PubMed]: [Operator.Begin, Operator.Retrieval],
  [Operator.ArXiv]: [Operator.Begin, Operator.Retrieval],
  [Operator.Google]: [Operator.Begin, Operator.Retrieval],
  [Operator.Bing]: [Operator.Begin, Operator.Retrieval],
  [Operator.GoogleScholar]: [Operator.Begin, Operator.Retrieval],
  [Operator.GitHub]: [Operator.Begin, Operator.Retrieval],
  [Operator.SearXNG]: [Operator.Begin, Operator.Retrieval],
  [Operator.TavilySearch]: [Operator.Begin],
  [Operator.TavilyExtract]: [Operator.Begin],
  [Operator.WenCai]: [Operator.Begin],
  [Operator.YahooFinance]: [Operator.Begin],
  [Operator.ExeSQL]: [Operator.Begin],
  [Operator.Crawler]: [Operator.Begin],
  [Operator.Invoke]: [Operator.Begin],
  [Operator.Email]: [Operator.Begin],
  [Operator.UserFillUp]: [Operator.Begin],
  [Operator.StringTransform]: [Operator.Begin],
  [Operator.PDFGenerator]: [Operator.Begin],
  [Operator.ExcelProcessor]: [Operator.Begin],
  [Operator.DataOperations]: [Operator.Begin],
  [Operator.ListOperations]: [Operator.Begin],
  [Operator.VariableAssigner]: [Operator.Begin],
  [Operator.VariableAggregator]: [Operator.Begin],
  [Operator.Loop]: [Operator.Begin],
  [Operator.LoopStart]: [Operator.Begin],
  [Operator.ExitLoop]: [Operator.Begin],
  [Operator.File]: [Operator.Begin],
  [Operator.Parser]: [Operator.Begin],
  [Operator.Tokenizer]: [Operator.Begin],
  [Operator.Splitter]: [Operator.Begin],
  [Operator.HierarchicalMerger]: [Operator.Begin],
  [Operator.Extractor]: [Operator.Begin],
}

// ==================== 不支持调试/复制的节点 ====================
export const NoDebugOperatorsList = [
  Operator.Begin,
  Operator.Message,
  Operator.A2UI,
  Operator.RewriteQuestion,
  Operator.Switch,
  Operator.Iteration,
  Operator.UserFillUp,
  Operator.IterationStart,
  Operator.File,
  Operator.Parser,
  Operator.Tokenizer,
  Operator.Splitter,
  Operator.HierarchicalMerger,
  Operator.Extractor,
  Operator.Tool,
]

export const NoCopyOperatorsList = [
  Operator.Begin,
  Operator.File,
  Operator.Parser,
  Operator.Tokenizer,
  Operator.Splitter,
  Operator.HierarchicalMerger,
  Operator.Extractor,
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
export const SwitchLogicOperator = {
  And: 'and',
  Or: 'or',
} as const

export type SwitchLogicOperator =
  (typeof SwitchLogicOperator)[keyof typeof SwitchLogicOperator]

export const SwitchOperatorOptions = [
  { value: ComparisonOperator.Equal, label: 'equal' },
  { value: ComparisonOperator.NotEqual, label: 'notEqual' },
  { value: ComparisonOperator.GreatThan, label: 'gt' },
  { value: ComparisonOperator.GreatEqual, label: 'ge' },
  { value: ComparisonOperator.LessThan, label: 'lt' },
  { value: ComparisonOperator.LessEqual, label: 'le' },
  { value: ComparisonOperator.Contains, label: 'contains' },
  { value: ComparisonOperator.NotContains, label: 'notContains' },
  { value: ComparisonOperator.StartWith, label: 'startWith' },
  { value: ComparisonOperator.EndWith, label: 'endWith' },
  { value: ComparisonOperator.Empty, label: 'empty' },
  { value: ComparisonOperator.NotEmpty, label: 'notEmpty' },
  { value: ComparisonOperator.In, label: 'in' },
  { value: ComparisonOperator.NotIn, label: 'notIn' },
]

export const DataOperationsOperatorOptions = [
  ComparisonOperator.Equal,
  ComparisonOperator.NotEqual,
  ComparisonOperator.Contains,
  ComparisonOperator.StartWith,
  ComparisonOperator.EndWith,
]

// ==================== Agent异常处理方法 ====================
export const AgentExceptionMethod = {
  Comment: 'comment',
  Goto: 'goto',
} as const

export type AgentExceptionMethod =
  (typeof AgentExceptionMethod)[keyof typeof AgentExceptionMethod]

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
  // 与第三方厂商（datav）合作的定制化入口参数类型：候选项运行时动态拉取
  PersonData: 'persondata',
} as const

export type BeginQueryType =
  (typeof BeginQueryType)[keyof typeof BeginQueryType]

// ==================== JSON Schema数据类型 ====================
export const JsonSchemaDataType = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Array: 'array',
  Object: 'object',
} as const

export type JsonSchemaDataType =
  (typeof JsonSchemaDataType)[keyof typeof JsonSchemaDataType]

// ==================== TypesWithArray ====================
export const TypesWithArray = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Object: 'object',
  ArrayString: 'array<string>',
  ArrayNumber: 'array<number>',
  ArrayBoolean: 'array<boolean>',
  ArrayObject: 'array<object>',
} as const

export type TypesWithArray =
  (typeof TypesWithArray)[keyof typeof TypesWithArray]

export const ArrayFields = [
  JsonSchemaDataType.Array,
  TypesWithArray.ArrayBoolean,
  TypesWithArray.ArrayNumber,
  TypesWithArray.ArrayString,
  TypesWithArray.ArrayObject,
]

// ==================== InputMode ====================
export const InputMode = {
  Constant: 'constant',
  Variable: 'variable',
} as const

export type InputMode = (typeof InputMode)[keyof typeof InputMode]

// ==================== Loop终止条件操作符 ====================
export const LoopTerminationComparisonOperator = {
  Contains: ComparisonOperator.Contains,
  NotContains: ComparisonOperator.NotContains,
  StartWith: ComparisonOperator.StartWith,
  EndWith: ComparisonOperator.EndWith,
  Is: 'is',
  IsNot: 'is not',
} as const

// ==================== Agent变量类型 ====================
export const AgentVariableType = {
  Begin: 'begin',
  Conversation: 'conversation',
} as const

export type AgentVariableType =
  (typeof AgentVariableType)[keyof typeof AgentVariableType]

// ==================== Webhook相关常量 ====================
export const WebhookMethod = {
  Post: 'POST',
  Get: 'GET',
  Put: 'PUT',
  Patch: 'PATCH',
  Delete: 'DELETE',
  Head: 'HEAD',
} as const

export const WebhookContentType = {
  ApplicationJson: 'application/json',
  MultipartFormData: 'multipart/form-data',
  ApplicationXWwwFormUrlencoded: 'application/x-www-form-urlencoded',
  TextPlain: 'text/plain',
  ApplicationOctetStream: 'application/octet-stream',
} as const

export const WebhookExecutionMode = {
  Immediately: 'Immediately',
  Streaming: 'Streaming',
} as const

export const WebhookSecurityAuthType = {
  None: 'none',
  Token: 'token',
  Basic: 'basic',
  Jwt: 'jwt',
} as const

export const WebhookRateLimitPer = {
  Second: 'second',
  Minute: 'minute',
  Hour: 'hour',
  Day: 'day',
} as const

export const RateLimitPerList = Object.values(WebhookRateLimitPer)
export const WebhookMaxBodySize = ['1MB', '5MB', '10MB']

export const WebhookStatus = {
  Testing: 'testing',
  Live: 'live',
  Stopped: 'stopped',
} as const

// ==================== 导出文件类型 ====================
export const ExportFileType = {
  HTML: 'html',
  Markdown: 'md',
  DOCX: 'docx',
  Excel: 'xlsx',
} as const

// ==================== Agent操作符列表 ====================
export const CommonOperatorList = Object.values(Operator).filter(
  (x) => x !== Operator.Note,
)

export const AgentOperatorList = [
  Operator.Retrieval,
  Operator.Categorize,
  Operator.Message,
  Operator.A2UI,
  Operator.RewriteQuestion,
  Operator.Switch,
  Operator.Iteration,
  Operator.WaitingDialogue,
  Operator.Note,
  Operator.Agent,
]

// ==================== Dataflow操作符 ====================
export const DataflowOperator = {
  Begin: 'File',
  Note: 'Note',
  Parser: 'Parser',
  Tokenizer: 'Tokenizer',
  Splitter: 'Splitter',
  HierarchicalMerger: 'HierarchicalMerger',
  Extractor: 'Extractor',
} as const

// ==================== Pipeline相关常量 ====================
export const FileId = 'File'

// RetrievalFrom 已在上方定义，避免重复声明

// ==================== BeginQueryType映射 ====================
export const BeginQueryTypeMap = {
  [BeginQueryType.Line]: TypesWithArray.String,
  [BeginQueryType.Paragraph]: TypesWithArray.String,
  [BeginQueryType.Options]: TypesWithArray.ArrayString,
  [BeginQueryType.File]: 'File',
  [BeginQueryType.Integer]: TypesWithArray.Number,
  [BeginQueryType.Boolean]: TypesWithArray.Boolean,
} as const
