// API 相关常量
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
export const API_VERSION = 'v1'

// 路由常量
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  KNOWLEDGE: '/knowledge',
  DOCUMENTS: '/documents',
  AI_TOOLS: '/ai-tools',
  WORKFLOW: '/workflow',
  MCP_SERVERS: '/mcp-servers',
  SYSTEM: '/system',
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_SECURITY: '/settings/security',
  SETTINGS_NOTIFICATIONS: '/settings/notifications',
  SETTINGS_APPEARANCE: '/settings/appearance',
  SETTINGS_MODEL_PROVIDERS: '/settings/model-providers',
  SETTINGS_API_KEYS: '/settings/api-keys',
} as const

// 存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_INFO: 'user_info',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_COLLAPSED: 'sidebar_collapsed',
} as const

// 消息类型
export const MESSAGE_TYPES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const

// 文件类型
export const SUPPORTED_FILE_TYPES = {
  DOCUMENT: ['.pdf', '.docx', '.txt', '.md'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  AUDIO: ['.mp3', '.wav', '.m4a'],
  VIDEO: ['.mp4', '.avi', '.mov'],
} as const

// 最大文件大小 (字节)
export const MAX_FILE_SIZE = {
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  IMAGE: 5 * 1024 * 1024,     // 5MB
  AUDIO: 20 * 1024 * 1024,    // 20MB
  VIDEO: 100 * 1024 * 1024,   // 100MB
} as const

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const

// 主题配置
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const

// 语言配置
export const LANGUAGES = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
} as const

// 错误消息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  UNAUTHORIZED: '登录已过期，请重新登录',
  FORBIDDEN: '没有访问权限',
  NOT_FOUND: '请求的资源不存在',
  SERVER_ERROR: '服务器内部错误，请稍后重试',
  VALIDATION_ERROR: '输入数据格式不正确',
  FILE_TOO_LARGE: '文件大小超过限制',
  UNSUPPORTED_FILE_TYPE: '不支持的文件类型',
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '登录成功',
  LOGOUT_SUCCESS: '已安全退出',
  SAVE_SUCCESS: '保存成功',
  DELETE_SUCCESS: '删除成功',
  UPLOAD_SUCCESS: '上传成功',
  COPY_SUCCESS: '已复制到剪贴板',
} as const

// WebSocket 事件
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  MESSAGE: 'message',
  ERROR: 'error',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
} as const

// 查询键
export const QUERY_KEYS = {
  USER: 'user',
  CONVERSATIONS: 'conversations',
  KNOWLEDGE_BASES: 'knowledgeBases',
  DOCUMENTS: 'documents',
  MCP_SERVERS: 'mcpServers',
  LLMS: 'llms',
  WORKFLOWS: 'workflows',
  SYSTEM_STATUS: 'systemStatus',
} as const

// 状态常量
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const

// MCP 服务器类型
export const MCP_SERVER_TYPES = {
  HTTP: 'http',
  WEBSOCKET: 'websocket',
  SSE: 'sse',
} as const

// 对话状态
export const CONVERSATION_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted',
} as const

// 知识库状态
export const KB_STATUS = {
  READY: 'ready',
  PROCESSING: 'processing',
  ERROR: 'error',
} as const

// 文档状态
export const DOCUMENT_STATUS = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
} as const