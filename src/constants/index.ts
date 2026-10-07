// API 相关常量
export const API_BASE_URL =
  import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000'
export const API_VERSION = 'v1'

// 路由常量
export const ROUTES = {
  HOME: '/home',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  KNOWLEDGE: '/knowledge',
  SKILLS: '/skills',
  MEMORY: '/memory',
  EXPLORE: '/explore',
  SEARCH: '/search',
  TOOLS: '/tools',
  AUTO_FILL: '/tools/auto-fill',
  AGENTS: '/agents',
  AGENT_LOGS: '/agents/log',
  AGENT_LOG_REDIRECT: '/agent/:id/log',
  AGENT_TEMPLATES: '/agent-templates',
  AGENT_EXPLORE: '/agent/:id/explore',
  AGENT_SHARE: '/agent/share',
  CHAT_WIDGET: '/chats/widget',
  DATAFLOW_RESULT: '/dataflow-result',
  MCP_SERVERS: '/mcp-servers',
  STUDIO: '/studio',
  STUDIO_CREATE_APP: '/studio/create-app',
  SYSTEM: '/system',
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_MODEL_PROVIDERS: '/settings/model-providers',
} as const

// 存储键名
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_INFO: 'user_info',
} as const
