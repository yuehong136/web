import { z } from 'zod'

// RAPTOR 配置 Schema
export const raptorSchema = z.object({
  use_raptor: z.boolean().default(false),
  prompt: z.string().optional(),
  max_token: z.number().min(0).max(2048).default(256),
  threshold: z.number().min(0).max(1).default(0.1),
  max_cluster: z.number().min(1).max(1024).default(64),
  random_seed: z.number().default(0),
  scope: z.enum(['dataset', 'file']).default('file'),
})

// GraphRAG 配置 Schema
export const graphragSchema = z.object({
  use_graphrag: z.boolean().default(false),
  entity_types: z.array(z.string()).default(['organization', 'person', 'geo', 'event', 'category']),
  method: z.enum(['light', 'general']).default('light'),
  resolution: z.boolean().default(false),
  community: z.boolean().default(false),
})

// MinerU 解析方法选项
export const MineruParseMethodOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Text', value: 'txt' },
  { label: 'OCR', value: 'ocr' },
] as const

// MinerU 语言选项
export const MineruLanguageOptions = [
  { label: 'English', value: 'English' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Traditional Chinese', value: 'Traditional Chinese' },
  { label: 'Russian', value: 'Russian' },
  { label: 'Ukrainian', value: 'Ukrainian' },
  { label: 'Indonesian', value: 'Indonesian' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'Vietnamese', value: 'Vietnamese' },
  { label: 'Japanese', value: 'Japanese' },
  { label: 'Korean', value: 'Korean' },
  { label: 'Portuguese BR', value: 'Portuguese BR' },
  { label: 'German', value: 'German' },
  { label: 'French', value: 'French' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Tamil', value: 'Tamil' },
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Kannada', value: 'Kannada' },
  { label: 'Thai', value: 'Thai' },
  { label: 'Greek', value: 'Greek' },
  { label: 'Hindi', value: 'Hindi' },
] as const

// Metadata 字段定义 Schema
export const metadataFieldSchema = z.object({
  key: z.string().optional(),
  description: z.string().optional(),
  enum: z.array(z.string()).optional(),
})

// 解析器配置 Schema
export const parserConfigSchema = z.object({
  layout_recognize: z.string().default('DeepDOC'),
  chunk_token_num: z.number().min(0).max(8192).default(512),
  delimiter: z.string().default('\n'),
  auto_keywords: z.number().min(0).max(30).default(0),
  auto_questions: z.number().min(0).max(10).default(0),
  html4excel: z.boolean().default(false),
  toc_extraction: z.boolean().default(false),
  image_table_context_window: z.number().min(0).max(256).default(0),
  // 后端实际使用的字段（提交时会映射）
  image_context_size: z.number().min(0).max(256).default(0),
  table_context_size: z.number().min(0).max(256).default(0),
  tag_kb_ids: z.array(z.string()).nullish(),
  topn_tags: z.number().min(1).max(10).default(3),
  raptor: raptorSchema.optional(),
  graphrag: graphragSchema.optional(),
  // MinerU 特定配置选项
  mineru_parse_method: z.enum(['auto', 'txt', 'ocr']).default('auto'),
  mineru_formula_enable: z.boolean().default(true),
  mineru_table_enable: z.boolean().default(true),
  mineru_lang: z.string().default('English'),
  // Metadata 自动提取配置
  metadata: z.array(metadataFieldSchema).optional(),
  enable_metadata: z.boolean().default(false),
  // 实体类型 (用于命名实体识别)
  entity_types: z.array(z.string()).optional(),
})

// 知识库设置表单 Schema
export const knowledgeSettingsFormSchema = z.object({
  name: z.string().min(1, { message: '知识库名称不能为空' }),
  avatar: z.any().nullish(),
  description: z.string().optional(),
  permission: z.enum(['me', 'team']).default('me'),
  embd_id: z.string().min(1, { message: '请选择嵌入模型' }),
  pagerank: z.number().min(0).max(100).default(0),
  parseType: z.number().default(1), // 1=内置, 2=手动设置Pipeline
  parser_id: z.string().min(1, { message: '请选择解析器类型' }),
  pipeline_id: z.string().optional(), // 当 parseType=2 时使用
  parser_config: parserConfigSchema.optional(),
})

// 类型导出
export type RaptorConfig = z.infer<typeof raptorSchema>
export type GraphragConfig = z.infer<typeof graphragSchema>
export type MetadataField = z.infer<typeof metadataFieldSchema>
export type ParserConfig = z.infer<typeof parserConfigSchema>
export type KnowledgeSettingsFormData = z.infer<typeof knowledgeSettingsFormSchema>

// 权限选项
export const PermissionOptions = [
  { label: '仅我可见', value: 'me' },
  { label: '团队可见', value: 'team' },
] as const

// PDF 解析器选项
export const LayoutRecognizeOptions = [
  { label: 'DeepDOC', value: 'DeepDOC' },
  { label: '纯文本', value: 'Plain Text' },
  { label: 'MinerU', value: 'MinerU' },
  { label: 'Docling', value: 'Docling' },
  { label: 'TCADP Parser', value: 'TCADP Parser' },
] as const

// GraphRAG 方法选项
export const GraphRagMethodOptions = [
  { label: 'Light', value: 'light' },
  { label: 'General', value: 'general' },
] as const

// RAPTOR 范围选项
export const RaptorScopeOptions = [
  { label: '整个知识库', value: 'dataset' },
  { label: '单个文件', value: 'file' },
] as const

// 默认实体类型
export const DefaultEntityTypes = [
  'organization',
  'person', 
  'geo',
  'event',
  'category',
]

// 默认 RAPTOR 提示词
export const DefaultRaptorPrompt = `请总结以下内容的核心要点。保持简洁、准确，突出关键信息。

{content}

总结：`

// 解析类型选项
export const ParseTypeOptions = [
  { label: '内置', value: 1 },
  { label: '手动设置', value: 2 },
] as const

// 表单默认值
export const getDefaultFormValues = (): Partial<KnowledgeSettingsFormData> => ({
  name: '',
  description: '',
  permission: 'me',
  embd_id: '',
  pagerank: 0,
  parseType: 1,
  parser_id: 'naive',
  pipeline_id: '',
  parser_config: {
    layout_recognize: 'DeepDOC',
    chunk_token_num: 512,
    delimiter: '\n',
    auto_keywords: 0,
    auto_questions: 0,
    html4excel: false,
    toc_extraction: false,
    image_table_context_window: 0,
    image_context_size: 0,
    table_context_size: 0,
    topn_tags: 3,
    // MinerU 默认配置
    mineru_parse_method: 'auto',
    mineru_formula_enable: true,
    mineru_table_enable: true,
    mineru_lang: 'English',
    // Metadata 默认配置
    metadata: [],
    enable_metadata: false,
    entity_types: [],
    raptor: {
      use_raptor: false,
      max_token: 256,
      threshold: 0.1,
      max_cluster: 64,
      random_seed: 0,
      scope: 'file',
      prompt: DefaultRaptorPrompt,
    },
    graphrag: {
      use_graphrag: false,
      entity_types: DefaultEntityTypes,
      method: 'light',
      resolution: false,
      community: false,
    },
  },
})

