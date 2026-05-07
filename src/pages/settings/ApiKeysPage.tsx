import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { 
  Search, Globe, Database, Users, Shield, 
  Play, Copy, Check, RefreshCw, Activity, Star, FileText, 
  Key, Zap, BookOpen, ChevronDown, ChevronRight,
  Plus, Minus, Save, Archive, Edit2, Trash2, MoreHorizontal, Settings2
} from "lucide-react"
import Editor from '@monaco-editor/react'
import { configureMonacoLoader } from '@/components/jsonjoy-builder/lib/configure-monaco-loader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MethodBadge } from '@/components/ui/method-badge'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/components/ui/utils'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { CreateApiKeyDialog } from '@/pages/settings/components/create-api-key-dialog'
import { ModernEnvironmentSelector, NewEnvironmentManager } from '@/components/environment'
import { EditApiKeyDialog } from '@/pages/settings/components/edit-api-key-dialog'
import { useEnvironmentStore } from '@/stores/environmentStore'

import type { 
  OpenAPISpec
} from '@/types/api'
import { systemAPI } from '@/api/system'
import type { SystemAPIToken, APITokenCreateRequest } from '@/types/api'

configureMonacoLoader()

// API端点简化定义
interface APIEndpoint {
  id: string
  operationId?: string
  summary: string
  description?: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS"
  path: string
  tags?: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses?: Response[]
  security?: Record<string, string[]>[]
  deprecated?: boolean
}

interface Parameter {
  name: string
  in: "query" | "header" | "path" | "cookie"
  schema?: Schema
  type?: string
  required: boolean
  description: string
  example?: any
}

interface Schema {
  type: string
  properties?: Record<string, Schema>
  required?: string[]
  example?: any
  description?: string
  format?: string
  items?: Schema
  enum?: string[]
  $ref?: string
}

interface RequestBody {
  description?: string
  required?: boolean
  content: Record<string, {
    schema: Schema
    example?: any
  }>
}

interface Response {
  status: number
  description: string
  content?: Record<string, {
    schema: Schema
    example?: any
  }>
  headers?: Record<string, Parameter>
}

// 参数行接口定义
interface ParamRow {
  id: string
  enabled: boolean
  name: string
  value: string
  type: string
  description: string
  required?: boolean
  in?: string
}

// Header行接口定义
interface HeaderRow {
  id: string
  enabled: boolean
  name: string
  value: string
  description: string
}

// 请求体类型定义
type BodyType = 'none' | 'form-data' | 'x-www-form-urlencoded' | 'json' | 'xml' | 'raw' | 'binary' | 'graphql' | 'msgpack'

// Form-data行接口定义
interface FormDataRow {
  id: string
  enabled: boolean
  key: string
  value: string
  type: 'text' | 'file'
  description?: string
}

// URL-encoded行接口定义
interface UrlEncodedRow {
  id: string
  enabled: boolean
  key: string
  value: string
  type: 'string' | 'integer' | 'number' | 'boolean' | 'file' | 'array' | 'object'
  description?: string
}

// API Key 接口定义 - 使用系统API Token类型
type ApiKey = SystemAPIToken

const tagIcons = {
  // 标准的tag图标映射
  "chat": Users,
  "session": Activity, 
  "files": FileText,
  "file": FileText,
  "dataset": Database,
  "document": FileText,
  "agent": Shield,
  // 兼容原有的标签图标
  "用户管理": Users,
  "订单管理": Database,
  "认证授权": Shield,
  "系统配置": Globe,
  "文件管理": FileText,
  "通知服务": Zap,
  "支付管理": Key,
  "数据分析": Activity,
  "消息推送": Star
}

// 代码编辑器组件
interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  placeholder?: string
  height?: string
  theme?: string
  readOnly?: boolean
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  placeholder,
  height = '300px',
  theme = 'vs',
  readOnly = false
}) => {
  const handleEditorChange = (value: string | undefined) => {
    if (!readOnly) {
      onChange(value || '')
    }
  }

  const editorOptions = {
    minimap: { enabled: false },
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    readOnly: readOnly,
    fontSize: 14,
    fontFamily: 'Monaco, "Cascadia Code", "Source Code Pro", Consolas, "Courier New", monospace',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true
    },
    renderWhitespace: 'boundary' as const,
    wordWrap: 'on' as const,
    automaticLayout: true,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12
    },
    suggest: {
      showKeywords: readOnly ? false : true,
      showSnippets: readOnly ? false : true
    },
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    glyphMargin: false,
    folding: true,
    selectOnLineNumbers: !readOnly,
    matchBrackets: 'always' as const,
    contextmenu: !readOnly,
    quickSuggestions: readOnly ? false : true
  }

  return (
    <div className="relative border-0 h-full">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        options={editorOptions}
        theme={theme}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">加载编辑器中...</div>
          </div>
        }
      />
      {/* 优化的 placeholder overlay - 适配 Monaco Editor 布局 */}
      {!value && placeholder && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="flex h-full">
            {/* 行号区域 - 匹配 Monaco 的行号宽度 */}
            <div className="w-14 flex-shrink-0 bg-transparent"></div>
            {/* 内容区域 - 匹配 Monaco 的内容区域 */}
            <div className="flex-1 pt-1 pl-1">
              <div className="text-muted-foreground/50 text-sm font-mono leading-[1.6] whitespace-pre-wrap select-none">
                {placeholder}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 时间格式化函数
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    
    // 格式化为 YYYY-MM-DD HH:mm
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hour}:${minute}`
  } catch (error) {
    return dateStr
  }
}

const ApiDocumentationPage: React.FC = () => {
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [apiSpec, setApiSpec] = useState<OpenAPISpec | null>(null)
  const [apiEndpoints, setApiEndpoints] = useState<APIEndpoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingSource, setLoadingSource] = useState<"static" | "dynamic" | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  
  // 分组收起状态 - 默认只展开第一个分组
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  
  // 使用新的环境管理store
  const {
    currentEnvironment,
    selectedEnvironmentId,
    selectEnvironment,
    resolveText,
    getVariableMap
  } = useEnvironmentStore()

  // 环境管理弹窗状态
  const [showEnvironmentManager, setShowEnvironmentManager] = useState(false)
  
  // 强制更新状态
  const [, forceUpdate] = useState({})

  // 获取基础URL的辅助函数
  const getBaseUrl = useCallback(() => {
    if (!currentEnvironment) return 'https://api.example.com'
    
    // 优先使用环境对象上的base_url字段（后端新增支持）
    if (currentEnvironment.base_url) {
      return currentEnvironment.base_url
    }
    
    // 如果环境对象没有base_url，再从变量中查找
    const variables = getVariableMap()
    const baseUrl = variables.baseUrl || 
                   variables.base_url || 
                   variables.BASE_URL ||
                   variables.host ||
                   variables.HOST ||
                   variables.server ||
                   variables.SERVER ||
                   variables.url ||
                   variables.URL ||
                   variables.api_url ||
                   variables.API_URL ||
                   'https://api.example.com'
    return baseUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 保留 selectedEnvironmentId 依赖以便切换环境时重算 baseUrl
  }, [currentEnvironment, selectedEnvironmentId, getVariableMap])

  // 获取完整的API URL
  const getFullApiUrl = useCallback((path: string) => {
    const baseUrl = getBaseUrl()
    const fullUrl = resolveText(`${baseUrl}${path}`)
    return fullUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 保留 selectedEnvironmentId/currentEnvironment 依赖以便切换环境时重新绑定 URL
  }, [getBaseUrl, resolveText, selectedEnvironmentId, currentEnvironment])
  
  // API测试相关状态
  const [testLoading, setTestLoading] = useState(false)
  const [testResponse, setTestResponse] = useState<any>(null)
  const [formattedResponse, setFormattedResponse] = useState<string>('')
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  
  // Apifox风格的测试状态
  const [testParams, setTestParams] = useState<ParamRow[]>([])
  const [testHeaders, setTestHeaders] = useState<HeaderRow[]>([])
  const [testBody, setTestBody] = useState("")
  const [bodyType, setBodyType] = useState<BodyType>("json")
  const [formDataRows, setFormDataRows] = useState<FormDataRow[]>([])
  const [urlEncodedRows, setUrlEncodedRows] = useState<UrlEncodedRow[]>([{
    id: 'urlencoded-new',
    enabled: false,
    key: '',
    value: '',
    type: 'string'
  }])
  const [activeTestTab, setActiveTestTab] = useState("params")
  
  // 格式化状态提示
  const [formatMessage, setFormatMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  
  // 编辑器主题
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs')
  
  // 响应数据语言检测函数
  const detectResponseLanguage = useCallback((response: any) => {
    if (!response || !response.headers) return 'json'
    
    const contentType = Object.entries(response.headers).find(
      ([key]) => key.toLowerCase() === 'content-type'
    )?.[1] as string || ''
    
    if (contentType.includes('json')) return 'json'
    if (contentType.includes('xml')) return 'xml'
    if (contentType.includes('html')) return 'html'
    if (contentType.includes('text/plain')) return 'plaintext'
    if (contentType.includes('javascript')) return 'javascript'
    if (contentType.includes('css')) return 'css'
    
    return 'json' // 默认使用JSON高亮
  }, [])
  
  // 格式化响应数据
  const formatResponseData = useCallback((response: any) => {
    if (!response?.data) return ''
    
    try {
      if (typeof response.data === 'string') {
        // 尝试解析为JSON
        try {
          const parsed = JSON.parse(response.data)
          return JSON.stringify(parsed, null, 2)
        } catch {
          return response.data
        }
      } else {
        return JSON.stringify(response.data, null, 2)
      }
    } catch {
      return String(response.data)
    }
  }, [])
  
  // 更新格式化响应数据
  useEffect(() => {
    if (testResponse) {
      setFormattedResponse(formatResponseData(testResponse))
    } else {
      setFormattedResponse('')
    }
  }, [testResponse, formatResponseData])
  
  // 自动清除格式化提示
  useEffect(() => {
    if (formatMessage) {
      const timer = setTimeout(() => {
        setFormatMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [formatMessage])
  
  // 主面板模式切换：接口详情 vs 测试面板
  const [mainMode, setMainMode] = useState<"interface" | "test">("interface")
  
  // 界面状态

  // 生成动态的placeholder文本
  const getBodyPlaceholder = useCallback((type: BodyType) => {
    // 如果有选中的API，使用其生成的示例数据作为placeholder
    if (selectedAPI && selectedAPI.requestBody) {
      const jsonContent = selectedAPI.requestBody.content?.['application/json']
      if (jsonContent && type === 'json') {
        if (jsonContent.example) {
          return JSON.stringify(jsonContent.example, null, 2)
        } else if (jsonContent.schema) {
          const generatedExample = generateExampleFromSchema(jsonContent.schema)
          if (generatedExample) {
            return JSON.stringify(generatedExample, null, 2)
          }
        }
      }
    }

    // 兜底：提供简化的占位符
    switch (type) {
      case 'json':
        return '{\n  "key": "value"\n}'
      case 'xml':
        return '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <data>value</data>\n</root>'
      case 'graphql':
        return 'query {\n  field\n}'
      case 'msgpack':
        return '{\n  "data": "binary encoded content"\n}'
      default:
        return '# 输入数据内容'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateExampleFromSchema 在同文件定义，随 selectedAPI 计算，不需要额外依赖
  }, [selectedAPI])

  // 请求体格式验证函数
  const validateBodyContent = useCallback((content: string, type: BodyType, api?: APIEndpoint) => {
    if (!content.trim()) {
      return { isValid: true, error: null }
    }

    // 检查用户选择的bodyType是否与API要求匹配
    if (api && api.requestBody) {
      const apiSupportedTypes = Object.keys(api.requestBody.content || {})
      const typeContentTypeMap: Record<BodyType, string> = {
        'json': 'application/json',
        'xml': 'application/xml',
        'form-data': 'multipart/form-data',
        'x-www-form-urlencoded': 'application/x-www-form-urlencoded',
        'raw': 'text/plain',
        'graphql': 'application/graphql',
        'binary': 'application/octet-stream',
        'msgpack': 'application/msgpack',
        'none': ''
      }
      
      const selectedContentType = typeContentTypeMap[type]
      if (selectedContentType && !apiSupportedTypes.includes(selectedContentType)) {
        return { 
          isValid: false, 
          error: `请求体类型不匹配：API要求 ${apiSupportedTypes.join(' 或 ')}，但您选择了 ${selectedContentType}` 
        }
      }
    }

    // 验证内容格式
    try {
      switch (type) {
        case 'json':
          JSON.parse(content)
          return { isValid: true, error: null }
        
        case 'xml': {
          // 简单的XML验证 - 检查是否有成对的标签
          const hasOpenTags = /<\w+/g.test(content)
          const hasCloseTags = /<\/\w+>/g.test(content)
          if (hasOpenTags && !hasCloseTags) {
            return { isValid: false, error: 'XML格式错误：缺少闭合标签' }
          }
          return { isValid: true, error: null }
        }

        case 'graphql': {
          // 简单的GraphQL验证 - 检查是否包含query/mutation/subscription关键字
          const hasGraphQLKeyword = /\b(query|mutation|subscription)\b/i.test(content)
          if (!hasGraphQLKeyword) {
            return { isValid: false, error: 'GraphQL格式错误：缺少query、mutation或subscription关键字' }
          }
          return { isValid: true, error: null }
        }
        
        default:
          return { isValid: true, error: null }
      }
    } catch (error) {
      switch (type) {
        case 'json':
          return { isValid: false, error: 'JSON格式错误：' + (error as Error).message }
        default:
          return { isValid: false, error: '格式错误：' + (error as Error).message }
      }
    }
  }, [])

  // 请求体格式化函数
  const formatBodyContent = useCallback((content: string, type: BodyType) => {
    if (!content.trim()) {
      // 如果有选中的API，使用其生成的示例数据
      if (selectedAPI && selectedAPI.requestBody) {
        const jsonContent = selectedAPI.requestBody.content?.['application/json']
        if (jsonContent) {
          if (jsonContent.example) {
            return JSON.stringify(jsonContent.example, null, 2)
          } else if (jsonContent.schema) {
            const generatedExample = generateExampleFromSchema(jsonContent.schema)
            if (generatedExample) {
              return JSON.stringify(generatedExample, null, 2)
            }
          }
        }
      }
      
      // 兜底：提供简化的默认模板
      switch (type) {
        case 'json':
          return '{\n  "key": "value"\n}'
        case 'xml':
          return '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <data>value</data>\n</root>'
        case 'graphql':
          return 'query {\n  field\n}'
        default:
          return content
      }
    }
    
    try {
      switch (type) {
        case 'json': {
          const parsed = JSON.parse(content)
          const formatted = JSON.stringify(parsed, null, 2)
          setFormatMessage({
            type: 'success',
            text: 'JSON 格式化成功'
          })
          return formatted
        }
        case 'xml': {
          // 简单的XML格式化
          const xmlFormatted = content
            .replace(/></g, '>\n<')
            .replace(/^\s*\n/gm, '')
            .split('\n')
            .map((line) => {
              const trimmedLine = line.trim()
              if (!trimmedLine) return ''

              const indent = '  '.repeat(Math.max(0,
                (trimmedLine.match(/^<[^/]/g) ? 1 : 0) -
                (trimmedLine.match(/<\//g) || []).length
              ))
              return indent + trimmedLine
            })
            .join('\n')
            .trim()
          setFormatMessage({
            type: 'success',
            text: 'XML 格式化成功'
          })
          return xmlFormatted
        }
        case 'graphql': {
          // GraphQL简单格式化
          const graphqlFormatted = content
            .replace(/\s*{\s*/g, ' {\n  ')
            .replace(/\s*}\s*/g, '\n}')
            .replace(/,\s*/g, '\n  ')
          setFormatMessage({
            type: 'success',
            text: 'GraphQL 格式化成功'
          })
          return graphqlFormatted
        }
        default:
          return content
      }
    } catch (error) {
      console.error('Format error:', error)
      setFormatMessage({
        type: 'error',
        text: `格式化失败: ${error instanceof Error ? error.message : '无效的格式'}`
      })
      return content
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- generateExampleFromSchema/selectedAPI 仅在 body 初始化路径使用，不影响格式化
  }, [setFormatMessage])

  // 压缩内容
  const minifyBodyContent = useCallback((content: string, type: BodyType) => {
    if (!content.trim()) {
      return content
    }
    
    try {
      switch (type) {
        case 'json': {
          const parsed = JSON.parse(content)
          const minified = JSON.stringify(parsed)
          setFormatMessage({
            type: 'success',
            text: 'JSON 压缩成功'
          })
          return minified
        }
        case 'xml': {
          const xmlMinified = content.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
          setFormatMessage({
            type: 'success',
            text: 'XML 压缩成功'
          })
          return xmlMinified
        }
        case 'graphql': {
          const graphqlMinified = content.replace(/\s+/g, ' ').trim()
          setFormatMessage({
            type: 'success',
            text: 'GraphQL 压缩成功'
          })
          return graphqlMinified
        }
        default: {
          const defaultMinified = content.replace(/\s+/g, ' ').trim()
          setFormatMessage({
            type: 'success',
            text: '内容压缩成功'
          })
          return defaultMinified
        }
      }
    } catch (error) {
      console.error('Minify error:', error)
      setFormatMessage({
        type: 'error',
        text: `压缩失败: ${error instanceof Error ? error.message : '无效的格式'}`
      })
      return content
    }
  }, [setFormatMessage])

  // Form-data和URL-encoded行管理函数
  const addFormDataRow = useCallback(() => {
    const newRow: FormDataRow = {
      id: `form-data-${Date.now()}`,
      enabled: true,
      key: '',
      value: '',
      type: 'text'
    }
    setFormDataRows(prev => [...prev, newRow])
  }, [])

  const updateFormDataRow = useCallback((id: string, field: keyof FormDataRow, value: any) => {
    setFormDataRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }, [])

  const removeFormDataRow = useCallback((id: string) => {
    setFormDataRows(prev => prev.filter(row => row.id !== id))
  }, [])

  const addUrlEncodedRow = useCallback(() => {
    const newId = `urlencoded-${Date.now()}`
    setUrlEncodedRows(prev => [
      ...prev.slice(0, -1), // 移除最后一个空行
      {
        id: newId,
        enabled: true,
        key: '',
        value: '',
        type: 'string'
      },
      { // 添加新的空行
        id: `urlencoded-new`,
        enabled: false,
        key: '',
        value: '',
        type: 'string'
      }
    ])
  }, [])

  const updateUrlEncodedRow = useCallback((id: string, field: keyof UrlEncodedRow, value: any) => {
    setUrlEncodedRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ))
  }, [])

  const removeUrlEncodedRow = useCallback((id: string) => {
    setUrlEncodedRows(prev => prev.filter(row => row.id !== id))
  }, [])

  // API Key 管理状态
  const [apiKeyManagementOpen, setApiKeyManagementOpen] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [apiKeyLoading, setApiKeyLoading] = useState(false)
  const [apiKeyPage, setApiKeyPage] = useState(1)
  const [apiKeyPageSize, setApiKeyPageSize] = useState(10)
  const [apiKeyTotal, setApiKeyTotal] = useState(0)
  const [apiKeySearchQuery, setApiKeySearchQuery] = useState('')
  const [editingApiKey, setEditingApiKey] = useState<ApiKey | null>(null)
  const [createApiKeyModalOpen, setCreateApiKeyModalOpen] = useState(false)
  const [createApiKeyLoading, setCreateApiKeyLoading] = useState(false)
  const [editApiKeyLoading, setEditApiKeyLoading] = useState(false)
  const [operatingKeys, setOperatingKeys] = useState<Set<string>>(new Set())
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())
  const [dropdownPositions, setDropdownPositions] = useState<Record<string, { top: number, right: number }>>({})

  // 解析 $ref 引用的 schema，支持嵌套与数组
  const resolveSchemaRef = useCallback((input: any): any => {
    if (!input) return input
    const seen = new Set<string>()
    const resolveOnce = (schema: any): any => {
      if (!schema) return schema
      if (schema.$ref && typeof schema.$ref === 'string') {
        const ref = schema.$ref as string
        if (seen.has(ref)) return schema
        seen.add(ref)
        const match = ref.match(/^#\/components\/schemas\/(.+)$/)
        const refName = match?.[1]
        const target = refName && apiSpec?.components?.schemas ? (apiSpec.components.schemas as any)[refName] : undefined
        return target ? resolveOnce(target) : schema
      }
      if (schema.type === 'array' && schema.items) {
        return { ...schema, items: resolveOnce(schema.items) }
      }
      return schema
    }
    return resolveOnce(input)
  }, [apiSpec])

  const getSchemaType = useCallback((schema: any): string => {
    const s = resolveSchemaRef(schema)
    if (!s) return 'unknown'
    if (s.type === 'array') {
      const itemType = getSchemaType((s as any).items)
      return `array<${itemType}>`
    }
    if (s.enum) return 'enum'
    if (s.type) return s.type
    if (s.$ref) return (s.$ref as string).split('/').pop() || 'object'
    return 'object'
  }, [resolveSchemaRef])

  // 数据加载
  useEffect(() => {
    loadAPIData(false) // 默认加载静态数据
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 首次挂载加载一次静态 API 数据
  }, [])

  // 当选中API变化时，初始化测试数据
  useEffect(() => {
    if (selectedAPI) {
      initializeTestData(selectedAPI)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initializeTestData 在组件内，仅随 selectedAPI 变化触发
  }, [selectedAPI])

  // 当 API Key 管理弹窗打开时加载数据
  useEffect(() => {
    if (apiKeyManagementOpen) {
      loadApiKeys()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 只在弹窗开关切换时触发一次加载
  }, [apiKeyManagementOpen])

  // 当分页、搜索参数变化时重新加载
  useEffect(() => {
    if (apiKeyManagementOpen) {
      loadApiKeys()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 仅在分页变化时触发，loadApiKeys 另有入口
  }, [apiKeyPage, apiKeyPageSize])

  // 搜索关键词变化时重新加载（带防抖）
  useEffect(() => {
    if (!apiKeyManagementOpen) return
    
    const timeoutId = setTimeout(() => {
      setApiKeyPage(1) // 搜索时重置到第一页
      loadApiKeys()
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 搜索防抖仅在 searchQuery 变化时触发，apiKeyManagementOpen/loadApiKeys 另有 effect 管理
  }, [apiKeySearchQuery])

  // 初始化分组收起状态
  useEffect(() => {
    if (apiEndpoints.length > 0) {
      const allTags = Array.from(new Set(apiEndpoints.flatMap(endpoint => endpoint.tags || ['未分组'])))
      const defaultCollapsed: Record<string, boolean> = {}
      allTags.forEach((groupName, index) => {
        defaultCollapsed[groupName] = index > 0 // 只展开第一个分组
      })
      setCollapsedGroups(defaultCollapsed)
    }
  }, [apiEndpoints])

  const initializeTestData = (api: APIEndpoint) => {
    // 初始化参数表格
    const params: ParamRow[] = api.parameters?.map((param, index) => ({
      id: `param-${index}`,
      enabled: param.required || false,
      name: param.name,
      value: param.example ? String(param.example) : '',
      type: param.type || param.schema?.type || 'string',
      description: param.description,
      required: param.required,
      in: param.in
    })) || []

    // 添加空行用于用户添加新参数
    params.push({
      id: `param-new`,
      enabled: false,
      name: '',
      value: '',
      type: 'string',
      description: ''
    })

    setTestParams(params)

    // 初始化Headers
    const headers: HeaderRow[] = [
      {
        id: 'header-content-type',
        enabled: !!api.requestBody,
        name: 'Content-Type',
        value: 'application/json',
        description: '请求体类型'
      },
      {
        id: 'header-auth',
        enabled: false,
        name: 'Authorization',
        value: 'Bearer YOUR_TOKEN',
        description: '认证头'
      },
      {
        id: 'header-new',
        enabled: false,
        name: '',
        value: '',
        description: ''
      }
    ]

    setTestHeaders(headers)

    // 初始化请求体
    if (api.requestBody) {
      let exampleBody = ''
      const content = api.requestBody.content
      
      if (content) {
        // 尝试获取 application/json 的示例
        const jsonContent = content['application/json']
        if (jsonContent) {
          // 首先检查是否有直接的 example
          if (jsonContent.example) {
            exampleBody = JSON.stringify(jsonContent.example, null, 2)
          } 
          // 如果有 schema，尝试生成示例数据
          else if (jsonContent.schema) {
            const generatedExample = generateExampleFromSchema(jsonContent.schema)
            if (generatedExample) {
              exampleBody = JSON.stringify(generatedExample, null, 2)
            }
          }
        }
        // 如果没有 application/json，尝试其他 content type
        else {
          const firstContent = Object.values(content)[0] as any
          if (firstContent?.example) {
            exampleBody = typeof firstContent.example === 'string' 
              ? firstContent.example 
              : JSON.stringify(firstContent.example, null, 2)
          } else if (firstContent?.schema) {
            const generatedExample = generateExampleFromSchema(firstContent.schema)
            if (generatedExample) {
              exampleBody = JSON.stringify(generatedExample, null, 2)
            }
          }
        }
      }
      
      setTestBody(exampleBody)
    } else {
      setTestBody('')
    }
  }

  // 根据schema生成示例数据
  const generateExampleFromSchema = useCallback((schema: any, fieldName?: string): any => {
    if (!schema) return null

    // 如果schema有直接的example，优先使用
    if (schema.example !== undefined) {
      return schema.example
    }

    // 如果是引用类型 ($ref)，解析引用
    if (schema.$ref && apiSpec) {
      const refPath = schema.$ref.replace('#/', '').split('/')
      let referencedSchema: any = apiSpec
      
      // 遍历路径找到引用的schema
      for (const pathSegment of refPath) {
        referencedSchema = referencedSchema[pathSegment]
        if (!referencedSchema) break
      }
      
      // 如果找到了引用的schema，递归生成示例
      if (referencedSchema) {
        return generateExampleFromSchema(referencedSchema, fieldName)
      }
    }

    // 根据数据类型生成示例
    switch (schema.type) {
      case 'object': {
        const obj: any = {}
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            // 检查是否是必需字段或有默认值
            const isRequired = schema.required?.includes(key)
            const hasDefault = (propSchema as any).default !== undefined
            
            if (isRequired || hasDefault) {
              // 优先使用默认值
              if (hasDefault) {
                obj[key] = (propSchema as any).default
              } else {
                obj[key] = generateExampleFromSchema(propSchema, key)
              }
            } else {
              // 非必需字段也生成示例，但使用更简单的值
              obj[key] = generateExampleFromSchema(propSchema, key)
            }
          }
        }
        return obj
      }

      case 'array':
        if (schema.items) {
          return [generateExampleFromSchema(schema.items, fieldName)]
        }
        return []
      
      case 'string':
        // 根据字段名生成更有意义的示例
        if (schema.enum) {
          return schema.enum[0]
        }
        // 根据字段名生成更有意义的示例值
        if (fieldName) {
          const lowerFieldName = fieldName.toLowerCase()
          if (lowerFieldName.includes('question')) {
            return 'What is your question?'
          } else if (lowerFieldName.includes('industry')) {
            return 'Technology'
          } else if (lowerFieldName.includes('title') || lowerFieldName.includes('name')) {
            return 'Example Title'
          } else if (lowerFieldName.includes('email')) {
            return 'user@example.com'
          } else if (lowerFieldName.includes('id')) {
            return 'example-id-123'
          }
        }
        return 'example string'
      
      case 'number':
      case 'integer':
        return schema.minimum !== undefined ? schema.minimum : 
               schema.default !== undefined ? schema.default : 1
      
      case 'boolean':
        return schema.default !== undefined ? schema.default : false
      
      default:
        return null
    }
  }, [apiSpec])

  // 将OpenAPI规范转换为内部API端点格式
  const convertToAPIEndpoints = useCallback((spec: OpenAPISpec): APIEndpoint[] => {
    const endpoints: APIEndpoint[] = []

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation !== 'object' || !operation) continue

        // Type assertion for OpenAPI operation object
        const op = operation as any

        const endpoint: APIEndpoint = {
          id: op.operationId || `${method}-${path}`.replace(/[^\w-]/g, '-'),
          operationId: op.operationId,
          summary: op.summary || `${method.toUpperCase()} ${path}`,
          description: op.description,
          method: method.toUpperCase() as APIEndpoint['method'],
          path,
          tags: op.tags,
          parameters: convertParameters(op.parameters || []),
          requestBody: convertRequestBody(op.requestBody),
          responses: convertResponses(op.responses || {}),
          security: op.security,
          deprecated: op.deprecated
        }

        endpoints.push(endpoint)
      }
    }

    return endpoints
  }, [])

  const convertParameters = (params: any[]): Parameter[] => {
    return params.map(param => ({
      name: param.name,
      in: param.in,
      schema: param.schema,
      type: param.schema?.type || param.type,
      required: param.required || false,
      description: param.description || '',
      example: param.example || param.schema?.example
    }))
  }

  const convertRequestBody = (requestBody: any): RequestBody | undefined => {
    if (!requestBody) return undefined

    return {
      description: requestBody.description,
      required: requestBody.required,
      content: requestBody.content || {}
    }
  }

  const convertResponses = (responses: any): Response[] => {
    return Object.entries(responses).map(([status, response]: [string, any]) => ({
      status: parseInt(status),
      description: response.description || '',
      content: response.content,
      headers: response.headers
    }))
  }

  // 加载静态OpenAPI数据
  const loadStaticAPIData = async (): Promise<OpenAPISpec> => {
    const response = await fetch('/openapi.json')
    if (!response.ok) {
      throw new Error(`Failed to load static spec: ${response.status}`)
    }
    return response.json()
  }

  // 加载过滤的OpenAPI数据
  const loadFilteredAPIData = async (): Promise<OpenAPISpec> => {
    const filterRule = {
      paths: ["/api/v1/*"],
      match: "glob" as const,
      include_tags: ["chat", "session", "dataset", "doc", "files", "agent"],
      exclude_paths: [],
      exclude_tags: [],
      strict: true,
      prune_examples: true,
      oas_version_target: "keep" as const
    }

    return await systemAPI.filterOpenAPI(filterRule)
  }

  const loadAPIData = async (useFiltered: boolean = false) => {
    setIsLoading(true)
    setLoadingProgress(0)
    setLoadingError(null)
    
    try {
      // 模拟加载进度
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      let spec: OpenAPISpec
      
      if (useFiltered) {
        setLoadingSource("dynamic")
        try {
          spec = await loadFilteredAPIData()
        } catch (error) {
          console.warn('Failed to load filtered data, falling back to static:', error)
          setLoadingError("后端接口加载失败，已切换到静态文件")
          setLoadingSource("static")
          spec = await loadStaticAPIData()
        }
      } else {
        setLoadingSource("static")
        spec = await loadStaticAPIData()
      }

      const endpoints = convertToAPIEndpoints(spec)
      
      setApiSpec(spec)
      setApiEndpoints(endpoints)
      
      // Initialize selected API if none selected
      if (endpoints.length > 0 && !selectedAPI) {
        setSelectedAPI(endpoints[0])
      }
      
      clearInterval(progressInterval)
      setLoadingProgress(100)
      
      setTimeout(() => {
        setIsLoading(false)
        // 清除错误提示
        if (loadingError) {
          setTimeout(() => setLoadingError(null), 3000)
        }
      }, 300)

    } catch (error) {
      console.error('Failed to load API data:', error)
      setLoadingError(error instanceof Error ? error.message : "加载API数据失败")
      setIsLoading(false)
    }
  }

  // 筛选API
  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = !searchQuery || 
      endpoint.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesSearch
  })

  // 按标签分组（Apifox标准方式）
  const groupedEndpoints = filteredEndpoints.reduce((groups, endpoint) => {
    const tags = endpoint.tags || ['未分组']
    tags.forEach(tag => {
      if (!groups[tag]) {
        groups[tag] = []
      }
      groups[tag].push(endpoint)
    })
    return groups
  }, {} as Record<string, APIEndpoint[]>)

  const handleCopy = useCallback((text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedStates({ ...copiedStates, [key]: true })
    setTimeout(() => {
      setCopiedStates({ ...copiedStates, [key]: false })
    }, 2000)
  }, [copiedStates])

  // API Key 相关函数
  const loadApiKeys = async () => {
    setApiKeyLoading(true)
    try {
      // 调用真实API获取Token列表
      const apiKeys = await systemAPI.getTokenList()
      
      // 应用搜索筛选
      const filteredKeys = apiKeys.filter(key => 
        !apiKeySearchQuery || 
        key.name.toLowerCase().includes(apiKeySearchQuery.toLowerCase()) ||
        (key.description && key.description.toLowerCase().includes(apiKeySearchQuery.toLowerCase())) ||
        key.tenant_id.includes(apiKeySearchQuery)
      )
      
      // 应用分页
      const startIndex = (apiKeyPage - 1) * apiKeyPageSize
      const endIndex = startIndex + apiKeyPageSize
      const paginatedKeys = filteredKeys.slice(startIndex, endIndex)
      
      setApiKeys(paginatedKeys)
      setApiKeyTotal(filteredKeys.length)
    } catch (error) {
      console.error('Failed to load API keys:', error)
      // 如果API调用失败，可以显示空列表或错误信息
      setApiKeys([])
      setApiKeyTotal(0)
    } finally {
      setApiKeyLoading(false)
    }
  }

  const maskToken = (token: string) => {
    if (token.length <= 8) return token
    return token.slice(0, 4) + '•'.repeat(20) + token.slice(-4)
  }

  const deleteApiKey = async (apiKey: ApiKey) => {
    // 显示确认对话框
    if (!window.confirm(`确定要删除 API Key "${apiKey.name}" 吗？此操作不可撤销。`)) {
      return
    }
    
    setOperatingKeys(prev => new Set(prev).add(apiKey.tenant_id))
    try {
      // 调用真实的删除API
      await systemAPI.deleteToken(apiKey.token)
      loadApiKeys() // 刷新列表
    } catch (error) {
      console.error('Failed to delete API key:', error)
      // 这里可以显示错误提示
    } finally {
      setOperatingKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(apiKey.tenant_id)
        return newSet
      })
    }
  }

  const regenerateApiKey = async (apiKey: ApiKey) => {
    // 显示确认对话框
    if (!window.confirm(`确定要重新生成 API Key "${apiKey.name}" 的令牌吗？旧令牌将立即失效。`)) {
      return
    }
    
    setOperatingKeys(prev => new Set(prev).add(apiKey.tenant_id))
    try {
      // 先删除原有token
      await systemAPI.deleteToken(apiKey.token)
      
      // 使用原有的名称和描述重新创建token
      const tokenData: APITokenCreateRequest = {
        name: apiKey.name,
        description: apiKey.description || null
      }
      
      await systemAPI.createToken(tokenData)
      loadApiKeys() // 刷新列表显示新的token
    } catch (error) {
      console.error('Failed to regenerate API key:', error)
      // 这里可以显示错误提示
    } finally {
      setOperatingKeys(prev => {
        const newSet = new Set(prev)
        newSet.delete(apiKey.tenant_id)
        return newSet
      })
    }
  }

  const handleCreateApiKey = async ({ name, description }: { name: string; description: string | null }) => {
    setCreateApiKeyLoading(true)
    try {
      const tokenData: APITokenCreateRequest = { name, description }
      await systemAPI.createToken(tokenData)
      setCreateApiKeyModalOpen(false)
      loadApiKeys() // 刷新列表显示新创建的 token
    } catch (error) {
      console.error('Failed to create API key:', error)
      throw error
    } finally {
      setCreateApiKeyLoading(false)
    }
  }

  const handleEditApiKey = async ({ name, description }: { name: string; description: string | null }) => {
    if (!editingApiKey) return

    setEditApiKeyLoading(true)
    try {
      // 当前后端尚未提供更新接口，暂时保留现有模拟流程
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('编辑 API Key:', {
        id: editingApiKey.tenant_id,
        name,
        description,
      })
      setEditingApiKey(null)
      loadApiKeys() // 不需要 await，让它在后台刷新
    } catch (error) {
      console.error('Failed to edit API key:', error)
      throw error
    } finally {
      setEditApiKeyLoading(false)
    }
  }

  const toggleDropdown = (apiKeyId: string, buttonElement: HTMLButtonElement) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(apiKeyId)) {
        newSet.delete(apiKeyId)
      } else {
        newSet.clear() // 关闭其他的下拉菜单
        newSet.add(apiKeyId)
        
        // 计算按钮位置
        const rect = buttonElement.getBoundingClientRect()
        setDropdownPositions(prev => ({
          ...prev,
          [apiKeyId]: {
            top: rect.bottom + window.scrollY + 4,
            right: window.innerWidth - rect.right + window.scrollX
          }
        }))
      }
      return newSet
    })
  }

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns(new Set())
    }
    
    if (openDropdowns.size > 0) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdowns.size])

  const handleTestAPI = async () => {
    if (!selectedAPI) return
    
    setTestLoading(true)
    setTestResponse(null)
    
    try {
      // 真实API调用示例（当前为模拟）：
      // const url = getFullApiUrl(selectedAPI.path)
      // const response = await fetch(url, {
      //   method: selectedAPI.method,
      //   headers: resolveText(JSON.stringify(testHeaders))
      //   body: resolveText(testBody)
      // })
      
      // 模拟API测试
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockResponse = {
        status: 200,
        statusText: "OK",
        time: Math.floor(Math.random() * 500) + 100,
        size: "1.2KB",
        headers: {
          "Content-Type": "application/json",
          "Date": new Date().toISOString(),
          "X-RateLimit-Remaining": "99",
          "X-Request-ID": "req_" + Math.random().toString(36).substr(2, 9)
        },
        data: {
          message: "API测试成功",
          timestamp: new Date().toISOString(),
          data: {
            id: Math.floor(Math.random() * 1000),
            name: "Test Data",
            status: "success"
          }
        }
      }
      
      setTestResponse(mockResponse)
    } catch (error) {
      setTestResponse({
        status: 500,
        statusText: "Internal Server Error",
        time: 1000,
        data: { error: "API测试失败" }
      })
    } finally {
      setTestLoading(false)
    }
  }

  // 处理参数表格更新
  const updateParamRow = (id: string, field: keyof ParamRow, value: any) => {
    setTestParams(prev => prev.map(param => 
      param.id === id ? { ...param, [field]: value } : param
    ))
  }

  // 处理Header表格更新
  const updateHeaderRow = (id: string, field: keyof HeaderRow, value: any) => {
    setTestHeaders(prev => prev.map(header => 
      header.id === id ? { ...header, [field]: value } : header
    ))
  }

  // 添加新参数行
  const addParamRow = () => {
    const newId = `param-${Date.now()}`
    setTestParams(prev => [
      ...prev.slice(0, -1), // 移除最后一个空行
      {
        id: newId,
        enabled: true,
        name: '',
        value: '',
        type: 'string',
        description: ''
      },
      { // 添加新的空行
        id: `param-new`,
        enabled: false,
        name: '',
        value: '',
        type: 'string',
        description: ''
      }
    ])
  }

  // 添加新Header行
  const addHeaderRow = () => {
    const newId = `header-${Date.now()}`
    setTestHeaders(prev => [
      ...prev.slice(0, -1), // 移除最后一个空行
      {
        id: newId,
        enabled: true,
        name: '',
        value: '',
        description: ''
      },
      { // 添加新的空行
        id: `header-new`,
        enabled: false,
        name: '',
        value: '',
        description: ''
      }
    ])
  }

  // 删除参数行
  const removeParamRow = (id: string) => {
    setTestParams(prev => prev.filter(param => param.id !== id))
  }

  // 删除Header行
  const removeHeaderRow = (id: string) => {
    setTestHeaders(prev => prev.filter(header => header.id !== id))
  }

  // 切换分组收起状态
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }))
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-background-body via-background-default to-background-subtle">
        <Card className="p-8 max-w-md w-full text-center space-y-4 bg-components-glassmorphism-bg border-components-glassmorphism-border shadow-2xl">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              正在加载 API 文档
            </h3>
            <p className="text-text-secondary text-sm mb-4">
              从{loadingSource === 'static' ? '静态文件' : '动态接口'}获取API规范...
            </p>
            <Progress value={loadingProgress} className="h-2" />
            <p className="text-xs text-text-tertiary mt-2">{loadingProgress}%</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-body via-background-default to-muted/20">

      <div className="flex h-screen bg-background">
        {/* 左侧导航 - API列表 */}
        <div className="w-80 border-r bg-background flex flex-col">
          <div className="p-4 space-y-4">
            {/* 精美的标题区域 */}
            <div className="space-y-4">
              {/* 主标题和图标 */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-lg ring-2 ring-blue-500/10">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-foreground mb-1">用户管理系统 API</h1>
                  <p className="text-sm text-muted-foreground">开放接口文档与测试平台</p>
                </div>
              </div>

              {/* 元信息和操作区 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-medium px-2.5 py-1">
                    v1.0.0
                  </Badge>
                  {loadingSource && (
                    <Badge 
                      variant={loadingSource === "dynamic" ? "default" : "secondary"} 
                      className="text-xs font-medium px-2.5 py-1"
                    >
                      {loadingSource === "dynamic" ? "🔄 实时数据" : "📁 本地缓存"}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAPIData(true)}
                  disabled={isLoading}
                  className="gap-2 hover:bg-primary/5 hover:border-primary/20 transition-all duration-200"
                  title="刷新API文档数据（从后端获取过滤后的接口）"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? "加载中" : "刷新"}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="搜索 API 接口..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 功能说明卡片 */}
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-muted/40 via-muted/30 to-background p-4">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">功能特性</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  📋 完整的API接口文档浏览<br/>
                  🧪 在线接口测试工具<br/>
                  🔑 API密钥管理与权限控制
                </p>
              </div>
              {/* 装饰性背景 */}
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-8 translate-x-8"></div>
            </div>

            {/* 错误提示 */}
            {loadingError && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ {loadingError}
                </p>
              </div>
            )}

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-background to-muted/20 p-3 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-muted-foreground">接口总数</span>
                </div>
                <div className="text-xl font-bold text-foreground">{apiEndpoints.length}</div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500/5 rounded-full"></div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-gradient-to-br from-background to-muted/20 p-3 transition-all duration-200 hover:shadow-md hover:border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-xs font-medium text-muted-foreground">分组数量</span>
                </div>
                <div className="text-xl font-bold text-foreground">{Object.keys(groupedEndpoints).length}</div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500/5 rounded-full"></div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(203, 213, 225, 0.5) transparent'
          }}>
            <style dangerouslySetInnerHTML={{
              __html: `
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(203, 213, 225, 0.4);
                  border-radius: 4px;
                  transition: all 0.2s ease;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(148, 163, 184, 0.7);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: rgba(71, 85, 105, 0.5);
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: rgba(100, 116, 139, 0.8);
                }
              `
            }} />
            <div className="px-4 pb-4 space-y-4">
              {Object.entries(groupedEndpoints).map(([tag, endpoints]) => {
                const IconComponent = tagIcons[tag as keyof typeof tagIcons] || Globe
                const isCollapsed = collapsedGroups[tag]
                
                // 格式化显示名称
                const getDisplayName = (tagName: string) => {
                  const tagDisplayNames: Record<string, string> = {
                    'chat': '聊天',
                    'session': '会话',
                    'files': '文件',
                    'dataset': '数据集',
                    'document': '文档',
                    'agent': '智能体',
                    // 保持原有的显示名称
                    '用户管理': '用户管理',
                    '订单管理': '订单管理',
                    '认证授权': '认证授权',
                    '系统配置': '系统配置',
                    '文件管理': '文件管理',
                    '通知服务': '通知服务',
                    '支付管理': '支付管理',
                    '数据分析': '数据分析',
                    '消息推送': '消息推送'
                  }
                  
                  return tagDisplayNames[tagName] || tagName
                }
                
                return (
                  <Collapsible
                    key={tag}
                    open={!isCollapsed}
                    onOpenChange={() => toggleGroup(tag)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          {getDisplayName(tag)}
                        </h3>
                      <Badge variant="secondary" className="text-xs">{endpoints.length}</Badge>
                      </div>
                      {isCollapsed ? 
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" /> : 
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                      }
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 mt-2">
                      {endpoints.map((api) => (
                        <button
                          key={api.id}
                          onClick={() => setSelectedAPI(api)}
                          className={`w-full text-left p-3 rounded-lg transition-colors duration-150 hover:bg-muted/50 border-2 border-transparent ${
                            selectedAPI?.id === api.id 
                              ? 'bg-primary/5 border-primary/20 shadow-sm' 
                              : 'hover:border-muted'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <MethodBadge method={api.method as any} size="sm" />
                              {/* 显示路径的关键部分 */}
                              <Tooltip 
                                content={api.path}
                                position="top"
                                maxWidth="max-w-md"
                              >
                                <span className="text-xs text-muted-foreground font-mono truncate cursor-help">
                                  /{api.path.split('/').filter(p => p).slice(-2).join('/')}
                                </span>
                              </Tooltip>
                            </div>
                            {api.deprecated && (
                              <Badge variant="destructive" className="text-xs shrink-0">
                                已弃用
                              </Badge>
                            )}
                          </div>
                          <div className="font-medium text-sm leading-relaxed mb-1">{api.summary}</div>
                          {api.description && (
                            <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {api.description}
                            </div>
                          )}
                        </button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )
              })}
            </div>
          </div>
        </div>

        {/* 右侧主内容区 - 两栏布局的第二栏 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            {selectedAPI ? (
              <div className="h-full flex flex-col">
                {/* 顶部模式切换标签 */}
                <div className="bg-gradient-to-r from-background to-muted/20 border-b px-6 py-4 flex items-center gap-6">
                  <Tabs value={mainMode} onValueChange={(value) => setMainMode(value as "interface" | "test")}>
                    <TabsList className="h-10">
                      <TabsTrigger value="interface" className="gap-2 px-4">
                        <FileText className="h-4 w-4" />
                        接口
                      </TabsTrigger>
                      <TabsTrigger value="test" className="gap-2 px-4">
                        <Play className="h-4 w-4" />
                        运行
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="flex items-center gap-3 ml-auto">
                    {/* API Key 管理按钮 */}
                    <Dialog open={apiKeyManagementOpen} onOpenChange={setApiKeyManagementOpen}>
                      <DialogTrigger>
                        <Button
                          variant="outline" 
                          size="default"
                          className="gap-2 bg-background border border-border/50 shadow-sm hover:border-border transition-colors h-10"
                        >
                          <Key className="h-4 w-4" />
                          API Key
                        </Button>
                      </DialogTrigger>
                      <DialogContent size="3xl" className="h-[80vh] flex flex-col p-0 gap-0">
                        <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
                          <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            API Key 管理
                          </DialogTitle>
                          <DialogDescription>
                            管理您的 API Key，包括创建、编辑和删除操作
                          </DialogDescription>
                        </DialogHeader>

                        {/* API Key 管理内容 */}
                        <div className="flex-1 overflow-hidden flex flex-col px-6 pb-4">
                          {/* 操作栏 */}
                          <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                  placeholder="搜索 API Key..."
                                  value={apiKeySearchQuery}
                                  onChange={(e) => setApiKeySearchQuery(e.target.value)}
                                  className="pl-10 w-80"
                                />
                              </div>
                            </div>
                            <Button 
                              onClick={() => setCreateApiKeyModalOpen(true)}
                              className="gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              新增 API Key
                            </Button>
                          </div>

                          {/* 表格容器 */}
                          <div className="flex-1 overflow-hidden border rounded-lg">
                            {apiKeyLoading ? (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center space-y-4">
                                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                  <p className="text-muted-foreground">加载中...</p>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col">
                                {/* 表头 */}
                                <div className="bg-muted/50 border-b shrink-0">
                                  <div className="grid grid-cols-12 gap-3 p-4 text-sm font-semibold">
                                    <div className="col-span-2">名称</div>
                                    <div className="col-span-3">Token</div>
                                    <div className="col-span-2">描述</div>
                                    <div className="col-span-2">创建时间</div>
                                    <div className="col-span-2">更新时间</div>
                                    <div className="col-span-1 text-center">操作</div>
                                  </div>
                                </div>
                                
                                {/* 表格内容 */}
                                <div className="flex-1 overflow-auto">
                                  {apiKeys.length === 0 ? (
                                    <div className="h-64 flex items-center justify-center">
                                      <div className="text-center text-muted-foreground">
                                        <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                        <p>暂无 API Key</p>
                                        <p className="text-sm mt-1">点击"新增 API Key"来创建第一个密钥</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="divide-y">
                                      {apiKeys.map((apiKey) => (
                                        <div key={apiKey.tenant_id} className="grid grid-cols-12 gap-3 p-4 hover:bg-muted/30 transition-colors">
                                          {/* 名称 */}
                                          <div className="col-span-2">
                                            <div className="font-medium">{apiKey.name}</div>
                                          </div>
                                          
                                          {/* Token */}
                                          <div className="col-span-3">
                                            <div className="flex items-center gap-2">
                                              <code className="font-mono text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                                                {maskToken(apiKey.token)}
                                              </code>
                                              <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => handleCopy(apiKey.token, `token-${apiKey.tenant_id}`)}
                                                className="shrink-0"
                                              >
                                                {copiedStates[`token-${apiKey.tenant_id}`] ? (
                                                  <Check className="h-3 w-3 text-green-600" />
                                                ) : (
                                                  <Copy className="h-3 w-3" />
                                                )}
                                              </Button>
                                            </div>
                                          </div>
                                          
                                          {/* 描述 */}
                                          <div className="col-span-2">
                                            {apiKey.description ? (
                                              <Tooltip 
                                                content={apiKey.description}
                                                position="top"
                                                maxWidth="max-w-sm"
                                              >
                                                <div className="text-muted-foreground text-sm truncate cursor-help">
                                                  {apiKey.description}
                                                </div>
                                              </Tooltip>
                                            ) : (
                                              <div className="text-muted-foreground text-sm">—</div>
                                            )}
                                          </div>
                                          
                                          {/* 创建时间 */}
                                          <div className="col-span-2">
                                            <div className="text-sm text-muted-foreground font-mono">
                                              {formatDateTime(apiKey.create_date)}
                                            </div>
                                          </div>
                                          
                                          {/* 更新时间 */}
                                          <div className="col-span-2">
                                            <div className="text-sm text-muted-foreground font-mono">
                                              {apiKey.update_date ? formatDateTime(apiKey.update_date) : '—'}
                                            </div>
                                          </div>
                                          
                                          {/* 操作 */}
                                          <div className="col-span-1 flex justify-center">
                                            <Button 
                                              variant="ghost" 
                                              size="icon-sm"
                                              disabled={operatingKeys.has(apiKey.tenant_id)}
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                toggleDropdown(apiKey.tenant_id, e.currentTarget)
                                              }}
                                            >
                                              {operatingKeys.has(apiKey.tenant_id) ? (
                                                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                              ) : (
                                                <MoreHorizontal className="h-4 w-4" />
                                              )}
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 分页 - 使用 DialogFooter */}
                        {apiKeyTotal > 0 && (
                          <DialogFooter className="justify-between px-6 py-4 shrink-0">
                            <div className="text-sm text-muted-foreground">
                              共 {apiKeyTotal} 项
                            </div>
                            <div className="flex items-center gap-4">
                              {/* 页面大小选择器 */}
                              <PageSizeSelector
                                pageSize={apiKeyPageSize}
                                onChange={(size) => {
                                  setApiKeyPageSize(size)
                                  setApiKeyPage(1)
                                }}
                                options={[10, 20, 50]}
                              />

                              {/* 页码导航 */}
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setApiKeyPage(Math.max(1, apiKeyPage - 1))}
                                  disabled={apiKeyPage <= 1}
                                >
                                  上一页
                                </Button>

                                <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                                  {Array.from({ length: Math.min(5, Math.ceil(apiKeyTotal / apiKeyPageSize)) }, (_, i) => {
                                    const totalPages = Math.ceil(apiKeyTotal / apiKeyPageSize)
                                    let pageNum
                                    
                                    if (totalPages <= 5) {
                                      pageNum = i + 1
                                    } else {
                                      if (apiKeyPage <= 3) {
                                        pageNum = i + 1
                                      } else if (apiKeyPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                      } else {
                                        pageNum = apiKeyPage - 2 + i
                                      }
                                    }
                                    
                                    return (
                                      <Button
                                        key={pageNum}
                                        variant={pageNum === apiKeyPage ? 'default' : 'ghost'}
                                        size="sm"
                                        className="w-8 h-8 p-0"
                                        onClick={() => setApiKeyPage(pageNum)}
                                      >
                                        {pageNum}
                                      </Button>
                                    )
                                  })}
                                </div>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setApiKeyPage(Math.min(Math.ceil(apiKeyTotal / apiKeyPageSize), apiKeyPage + 1))}
                                  disabled={apiKeyPage >= Math.ceil(apiKeyTotal / apiKeyPageSize)}
                                >
                                  下一页
                                </Button>
                              </div>
                            </div>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* 现代化环境选择器 */}
                        <div className="flex items-center gap-3">
                      <ModernEnvironmentSelector
                        onEnvironmentChange={(id) => {
                          if (id) {
                            selectEnvironment(id).then(() => {
                              // 强制触发重新渲染
                              forceUpdate({})
                            })
                          }
                        }}
                        onManageClick={() => setShowEnvironmentManager(true)}
                      />
                      
                      {/* 环境管理图标按钮 */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEnvironmentManager(true)}
                        className="w-10 h-10 p-0"
                        title="管理环境"
                      >
                        <Settings2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* 环境管理弹窗 */}
                    <NewEnvironmentManager
                      isOpen={showEnvironmentManager}
                      onClose={() => setShowEnvironmentManager(false)}
                    />
                  </div>
                </div>

                {/* 主内容区 */}
                <div className="flex-1 overflow-auto">
                  {mainMode === "interface" ? (
                    /* 接口详情模式 - 全宽度 */
                    <div className="p-6">
                      <div className="max-w-6xl mx-auto space-y-6">
                        {/* API 头部信息 */}
                        <div className="mb-8">
                          <div className="flex items-center gap-3 mb-4">
                            <MethodBadge method={selectedAPI.method as any} />
                            <code className="text-lg font-mono bg-muted px-4 py-2 rounded-lg border">
                              {getFullApiUrl(selectedAPI.path)}
                            </code>
                            {selectedAPI.deprecated && (
                              <Badge variant="destructive">已弃用</Badge>
                            )}
                          </div>
                          <h1 className="text-3xl font-semibold mb-3">{selectedAPI.summary}</h1>
                          {selectedAPI.description && (
                            <div className="text-muted-foreground text-base leading-relaxed">
                              <MarkdownRenderer 
                                content={selectedAPI.description}
                                className="prose-lg [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_code]:bg-muted/80 [&_code]:px-2 [&_code]:py-1 [&_code]:text-sm [&_code]:text-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:ml-4 [&_ol]:ml-4 [&_li]:text-sm [&_blockquote]:bg-muted/30 [&_blockquote]:py-2 [&_blockquote]:rounded-r"
                              />
                        </div>
                          )}
                    </div>

                        <Tabs defaultValue="parameters" className="space-y-6">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="parameters">参数说明</TabsTrigger>
                            <TabsTrigger value="responses">响应说明</TabsTrigger>
                            <TabsTrigger value="examples">代码示例</TabsTrigger>
                      </TabsList>

                          <TabsContent value="parameters" className="space-y-6">
                            {selectedAPI.parameters && selectedAPI.parameters.length > 0 && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>请求参数</CardTitle>
                                  <CardDescription>该接口支持的请求参数列表</CardDescription>
                                </CardHeader>
                                <CardContent>
                                  {/* 表格形式展示参数 */}
                                  <div className="border rounded-lg">
                                    <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 border-b font-medium text-sm">
                                      <div>参数名</div>
                                      <div>位置</div>
                                      <div>类型</div>
                                      <div>说明</div>
                                    </div>
                                    <div className="divide-y">
                                      {selectedAPI.parameters.map((param, index) => (
                                        <div key={index} className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/20">
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <code className="font-mono font-medium text-purple-600 dark:text-purple-400">
                                                {param.name}
                                              </code>
                                              {param.required && (
                                                <span className="text-red-500 text-xs">*</span>
                                              )}
                                            </div>
                                          </div>
                                          <div>
                                            <Badge variant="outline" className="text-xs">
                                              {param.in}
                                            </Badge>
                                          </div>
                                          <div>
                                            <Badge variant="secondary" className="text-xs">
                                              {param.type || 'string'}
                                            </Badge>
                                          </div>
                                          <div className="space-y-2">
                                            <div className="text-sm text-muted-foreground">
                                              <MarkdownRenderer 
                                                content={param.description}
                                                className="prose-xs [&_p]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_code]:text-xs [&_code]:px-1 [&_code]:py-0.5 [&_strong]:font-medium"
                                              />
                                            </div>
                                            {param.example && (
                                              <code className="text-xs bg-muted px-2 py-1 rounded block mt-1">
                                                示例: {JSON.stringify(param.example)}
                                              </code>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}

                            {selectedAPI.requestBody && (
                              <Card>
                                <CardHeader>
                                  <CardTitle>请求体</CardTitle>
                                  {selectedAPI.requestBody.description && (
                                    <CardDescription>{selectedAPI.requestBody.description}</CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {Object.entries(selectedAPI.requestBody.content).map(([mime, content]) => {
                                    const rawSchema: any = (content as any).schema
                                    const schema: any = resolveSchemaRef(rawSchema)
                                    const example = (content as any).example || schema?.example
                                    const properties = (schema?.type === 'object' ? schema?.properties : {}) || {}
                                    const requiredProps: string[] = schema?.required || []
                                    return (
                                      <div key={mime} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">内容类型</span>
                                          <code className="text-xs bg-muted px-2 py-1 rounded border">{mime}</code>
                                          {selectedAPI.requestBody?.required && (
                                            <Badge variant="secondary" className="text-xs">必填</Badge>
                                          )}
                                        </div>

                                        {schema?.type === 'array' && (
                                          <div className="text-sm text-muted-foreground">
                                            数组元素类型: <code className="font-mono">{getSchemaType(schema.items)}</code>
                                          </div>
                                        )}

                                        {schema?.type === 'object' && Object.keys(properties).length > 0 && (
                                          <div className="border rounded-lg">
                                            <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 border-b text-sm font-medium">
                                              <div>字段名</div>
                                              <div>类型</div>
                                              <div>必填</div>
                                              <div>说明</div>
                                            </div>
                                            <div className="divide-y">
                                              {Object.entries(properties).map(([name, propSchema]: any) => {
                                                const resolved = resolveSchemaRef(propSchema)
                                                const type = getSchemaType(resolved)
                                                return (
                                                <div key={name} className="grid grid-cols-4 gap-4 p-3 items-start">
                                                  <code className="font-mono text-purple-600 dark:text-purple-400">{name}</code>
                                                  <Badge variant="secondary" className="text-xs">{type}</Badge>
                                                  <div className="text-xs">{requiredProps.includes(name) ? '是' : '否'}</div>
                                                  <div className="text-sm text-muted-foreground">{resolved?.description || ''}</div>
                                                </div>
                                                )
                                              })}
                                            </div>
                                          </div>
                                        )}

                                        {example && (
                                          <div className="bg-muted/30 rounded border">
                                            <div className="p-3">
                                              <div className="text-sm font-medium mb-2">示例</div>
                                              <pre className="text-xs overflow-x-auto"><code>{JSON.stringify(example, null, 2)}</code></pre>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </CardContent>
                              </Card>
                            )}

                            {!((selectedAPI.parameters && selectedAPI.parameters.length > 0) || selectedAPI.requestBody) && (
                              <Card>
                                <CardContent className="flex items-center justify-center h-32">
                                  <p className="text-muted-foreground">该接口无需参数</p>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>

                          <TabsContent value="responses" className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle>响应说明</CardTitle>
                                <CardDescription>接口可能返回的响应状态码和数据结构</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {selectedAPI.responses?.map((response, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <Badge variant={response.status < 300 ? "default" : "destructive"}>
                                    {response.status}
                                  </Badge>
                                </div>
                                      <p className="text-sm text-muted-foreground">{response.description}</p>
                              </div>
                            ))}
                          </div>
                              </CardContent>
                        </Card>
                      </TabsContent>

                          <TabsContent value="examples" className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle>代码示例</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="bg-muted p-4 rounded-lg">
                                  <pre className="text-sm overflow-x-auto">
{`curl -X ${selectedAPI.method} "${getFullApiUrl(selectedAPI.path)}" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_TOKEN"`}
                                  </pre>
                            </div>
                              </CardContent>
                        </Card>
                      </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  ) : (
                    /* 测试模式 - Apifox风格全宽度测试面板 */
                    <div className="h-full flex flex-col">
                      {/* 顶部：API 地址栏 */}
                      <div className="flex-shrink-0 px-6 py-4 border-b bg-gradient-to-r from-background to-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center h-10">
                            <MethodBadge method={selectedAPI.method as any} />
                          </div>
                          <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 font-mono text-sm border h-10 flex items-center">
                            {getFullApiUrl(selectedAPI.path)}
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={handleTestAPI}
                              disabled={testLoading}
                              className="shadow-lg hover:shadow-xl transition-colors duration-150 h-10"
                              variant="default"
                              size="default"
                            >
                              {testLoading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                  发送中...
                                </>
                              ) : (
                                "发送"
                              )}
                            </Button>
                            <Button variant="outline" size="default" className="px-3 h-10" title="保存为用例">
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="default" className="px-3 h-10" title="保存为环境">
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* 主体：参数配置和响应区域 */}
                      <div className="flex-1 flex">
                        {/* 左侧：参数配置区域 */}
                        <div className="flex-1 flex flex-col border-r">
                        <div className="h-full flex flex-col">
                          <div className="border-b bg-gradient-to-r from-muted/20 to-muted/40 px-6 py-3">
                            <Tabs value={activeTestTab} onValueChange={setActiveTestTab}>
                              <TabsList className="h-9">
                                <TabsTrigger value="params" className="gap-2 px-3">
                                  <span>Params</span>
                                  {testParams.filter(p => p.enabled && p.name).length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex items-center justify-center">
                                      {testParams.filter(p => p.enabled && p.name).length}
                                    </Badge>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="body" className="gap-2 px-3">
                                  <span>Body</span>
                                  {testBody && testBody.trim() && (
                                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex items-center justify-center">
                                      1
                                    </Badge>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="headers" className="gap-2 px-3">
                                  <span>Headers</span>
                                  {testHeaders.filter(h => h.enabled && h.name).length > 0 && (
                                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex items-center justify-center">
                                      {testHeaders.filter(h => h.enabled && h.name).length}
                                    </Badge>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="cookies" className="px-3">
                                  Cookies
                                </TabsTrigger>
                                <TabsTrigger value="auth" className="px-3">
                                  Auth
                                </TabsTrigger>
                              </TabsList>
                            </Tabs>
                          </div>
                            
                          <div className="flex-1 overflow-auto">
                            {activeTestTab === 'params' && (
                              <div className="m-0 h-full p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                      Query 参数
                                      {testParams.filter(p => p.enabled && p.name).length > 0 && (
                                        <Badge variant="secondary" className="h-5 px-2 text-xs">
                                          {testParams.filter(p => p.enabled && p.name).length} 个参数
                                        </Badge>
                                      )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">配置API请求的Query参数</p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addParamRow}
                                    className="gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                                  >
                                    <Plus className="h-4 w-4" />
                                    添加参数
                                  </Button>
                                </div>
                                
                                {/* 参数表格 - 精美设计 */}
                                <div className="border rounded-xl overflow-hidden shadow-sm bg-background">
                                  <div className="bg-gradient-to-r from-muted/40 to-muted/60 border-b">
                                    <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-foreground">
                                      <div className="col-span-1 text-center">✓</div>
                                      <div className="col-span-3">参数名</div>
                                      <div className="col-span-4">参数值</div>
                                      <div className="col-span-2">类型</div>
                                      <div className="col-span-2 text-center">操作</div>
                                </div>
                              </div>
                                  <div className="divide-y max-h-96 overflow-auto">
                                    {testParams.map((param) => (
                                      <div key={param.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors group">
                                        <div className="col-span-1 flex justify-center">
                                          <Switch
                                            checked={param.enabled}
                                            onCheckedChange={(checked) => updateParamRow(param.id, 'enabled', checked)}
                                          />
                            </div>
                                        <div className="col-span-3">
                                          <Input
                                            placeholder="参数名"
                                            value={param.name}
                                            onChange={(e) => updateParamRow(param.id, 'name', e.target.value)}
                                            className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all"
                                            onBlur={() => {
                                              if (param.id === 'param-new' && param.name) {
                                                addParamRow()
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="col-span-4">
                                          <Input
                                            placeholder="参数值"
                                            value={param.value}
                                            onChange={(e) => updateParamRow(param.id, 'value', e.target.value)}
                                            className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all"
                                          />
                                        </div>
                                        <div className="col-span-2">
                                          <Select 
                                            value={param.type} 
                                            onValueChange={(value) => updateParamRow(param.id, 'type', value)}
                                          >
                                            <SelectTrigger className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="string">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                  string
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="integer">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                  integer
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="number">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                                  number
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="boolean">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                                  boolean
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="file">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                  file
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="array">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                                  array
                                                </div>
                                              </SelectItem>
                                              <SelectItem value="object">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-2 h-2 bg-pink-500 rounded-full" />
                                                  object
                                                </div>
                                              </SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                          {param.id !== 'param-new' && param.name && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeParamRow(param.id)}
                                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                            >
                                              <Minus className="h-4 w-4" />
                            </Button>
                                          )}
                                        </div>
                                        {param.description && (
                                          <div className="col-span-12 pl-4 py-2 bg-blue-50/50 dark:bg-blue-950/20 rounded-md -mx-1 mt-2">
                                            <div className="flex items-start gap-2">
                                              <span className="text-blue-500 mt-0.5">💡</span>
                                              <div className="flex-1 text-sm">
                                                <MarkdownRenderer 
                                                  content={param.description}
                                                  className="prose-xs [&_p]:mb-1 [&_p]:text-sm [&_p]:text-blue-700 [&_p]:dark:text-blue-300 [&_code]:text-xs [&_code]:bg-blue-100 [&_code]:dark:bg-blue-900 [&_code]:px-1 [&_code]:py-0.5 [&_strong]:font-medium"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeTestTab === 'body' && (
                              <div className="m-0 h-full p-6 flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                  <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                      请求体
                                      {(() => {
                                        const validation = validateBodyContent(testBody, bodyType, selectedAPI)
                                        if (!validation.isValid) {
                                          return (
                                            <Tooltip 
                                              content={validation.error || '格式错误'}
                                              position="top"
                                              maxWidth="max-w-sm"
                                            >
                                              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse cursor-help"></div>
                                            </Tooltip>
                                          )
                                        } else if (testBody.trim()) {
                                          return (
                                            <Tooltip 
                                              content="格式正确"
                                              position="top"
                                              maxWidth="max-w-sm"
                                            >
                                              <div className="w-2 h-2 bg-green-500 rounded-full cursor-help"></div>
                                            </Tooltip>
                                          )
                                        }
                                        return null
                                      })()}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">配置API请求的数据体</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {(bodyType === 'json' || bodyType === 'xml' || bodyType === 'graphql') && (
                                      <>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => setTestBody(formatBodyContent(testBody, bodyType))}
                                          className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
                                        >
                                          格式化
                                        </Button>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={() => setTestBody(minifyBodyContent(testBody, bodyType))}
                                          className="hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
                                        >
                                          压缩
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setEditorTheme(prev => prev === 'vs' ? 'vs-dark' : 'vs')}
                                          className="hover:bg-background-subtle hover:border-border-default"
                                          title="切换编辑器主题"
                                        >
                                          {editorTheme === 'vs' ? '🌙' : '☀️'}
                                        </Button>
                                      </>
                                    )}
                                    {formatMessage && (
                                      <div className={cn(
                                        "px-3 py-1 rounded-md text-xs font-medium transition-all duration-300",
                                        formatMessage.type === 'success' 
                                          ? "bg-green-50 text-green-700 border border-green-200" 
                                          : "bg-red-50 text-red-700 border border-red-200"
                                      )}>
                                        {formatMessage.text}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* 请求体类型选择器 */}
                                <div className="mb-4">
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { key: 'none', label: 'None', desc: '无请求体' },
                                      { key: 'form-data', label: 'form-data', desc: '表单数据（支持文件）' },
                                      { key: 'x-www-form-urlencoded', label: 'x-www-form-urlencoded', desc: 'URL编码表单' },
                                      { key: 'json', label: 'JSON', desc: 'JSON格式数据' },
                                      { key: 'xml', label: 'XML', desc: 'XML格式数据' },
                                      { key: 'raw', label: 'Raw', desc: '原始文本数据' },
                                      { key: 'binary', label: 'Binary', desc: '二进制文件' },
                                      { key: 'graphql', label: 'GraphQL', desc: 'GraphQL查询' },
                                      { key: 'msgpack', label: 'MessagePack', desc: 'MessagePack格式' }
                                    ].map((type) => (
                                      <Button
                                        key={type.key}
                                        variant={bodyType === type.key ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setBodyType(type.key as BodyType)}
                                        className={cn(
                                          "transition-all duration-200",
                                          bodyType === type.key 
                                            ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md" 
                                            : "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                                        )}
                                        title={type.desc}
                                      >
                                        {type.label}
                                      </Button>
                                    ))}
                                  </div>
                                </div>

                                {/* 请求体内容区域 */}
                                <div className="flex-1 border rounded-lg overflow-hidden flex flex-col">
                                  {bodyType === 'none' && (
                                    <div className="flex-1 flex items-center justify-center text-center p-12">
                                      <div className="text-muted-foreground">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                                          <Minus className="h-8 w-8" />
                                        </div>
                                        <p className="text-sm">此请求无需请求体</p>
                                      </div>
                                    </div>
                                  )}

                                  {bodyType === 'form-data' && (
                                    <div className="flex-1 flex flex-col">
                                      <div className="bg-muted/50 border-b p-3 flex items-center justify-between">
                                        <span className="text-sm font-medium">multipart/form-data</span>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={addFormDataRow}
                                          className="gap-1"
                                        >
                                          <Plus className="h-3 w-3" />
                                          添加
                                        </Button>
                                      </div>
                                      <div className="flex-1 overflow-auto">
                                        <div className="p-4 space-y-3">
                                          {formDataRows.map((row) => (
                                            <div key={row.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                                              <Switch
                                                checked={row.enabled}
                                                onCheckedChange={(checked) => updateFormDataRow(row.id, 'enabled', checked)}
                                              />
                                              <Input
                                                placeholder="Key"
                                                value={row.key}
                                                onChange={(e) => updateFormDataRow(row.id, 'key', e.target.value)}
                                                className="flex-1"
                                              />
                                              <Select value={row.type} onValueChange={(value) => updateFormDataRow(row.id, 'type', value)}>
                                                <SelectTrigger className="w-20">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="text">Text</SelectItem>
                                                  <SelectItem value="file">File</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              {row.type === 'text' ? (
                                                <Input
                                                  placeholder="Value"
                                                  value={row.value}
                                                  onChange={(e) => updateFormDataRow(row.id, 'value', e.target.value)}
                                                  className="flex-1"
                                                />
                                              ) : (
                                                <div className="flex-1">
                                                  <label className="flex items-center gap-2 cursor-pointer">
                                                    <div className="px-3 py-2 border border-dashed rounded-md text-sm text-muted-foreground hover:bg-muted/50">
                                                      选择文件...
                                                    </div>
                                                    <input
                                                      type="file"
                                                      className="hidden"
                                                      onChange={(e) => {
                                                        const file = e.target.files?.[0]
                                                        if (file) updateFormDataRow(row.id, 'value', file.name)
                                                      }}
                                                    />
                                                  </label>
                                                </div>
                                              )}
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFormDataRow(row.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ))}
                                          {formDataRows.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                              <p className="text-sm">暂无表单数据</p>
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={addFormDataRow}
                                                className="mt-2 gap-1"
                                              >
                                                <Plus className="h-3 w-3" />
                                                添加表单项
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {bodyType === 'x-www-form-urlencoded' && (
                                    <div className="flex-1 flex flex-col">
                                      <div className="bg-muted/50 border-b p-3 flex items-center justify-between">
                                        <span className="text-sm font-medium">application/x-www-form-urlencoded</span>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          onClick={addUrlEncodedRow}
                                          className="gap-1"
                                        >
                                          <Plus className="h-3 w-3" />
                                          添加
                                        </Button>
                                      </div>
                                      <div className="flex-1 overflow-auto">
                                        {urlEncodedRows.length > 0 ? (
                                          <div className="px-6 py-4">
                                            {/* 表头 */}
                                            <div className="grid grid-cols-12 gap-4 pb-3 border-b border-border/60 text-sm font-medium text-muted-foreground">
                                              <div className="col-span-1 text-center">启用</div>
                                              <div className="col-span-3">参数名</div>
                                              <div className="col-span-4">参数值</div>
                                              <div className="col-span-2">类型</div>
                                              <div className="col-span-2 text-center">操作</div>
                                            </div>
                                            
                                            {/* 参数行 */}
                                            <div className="space-y-2 mt-4">
                                              {urlEncodedRows.map((row) => (
                                                <div key={row.id} className="grid grid-cols-12 gap-4 items-center py-2 group hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors">
                                                  <div className="col-span-1 flex justify-center">
                                                    <Switch
                                                      checked={row.enabled}
                                                      onCheckedChange={(checked) => updateUrlEncodedRow(row.id, 'enabled', checked)}
                                                    />
                                                  </div>
                                                  <div className="col-span-3">
                                                    <Input
                                                      placeholder="参数名"
                                                      value={row.key}
                                                      onChange={(e) => updateUrlEncodedRow(row.id, 'key', e.target.value)}
                                                      className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all"
                                                      onBlur={() => {
                                                        if (row.id === 'urlencoded-new' && row.key) {
                                                          addUrlEncodedRow()
                                                        }
                                                      }}
                                                    />
                                                  </div>
                                                  <div className="col-span-4">
                                                    <Input
                                                      placeholder="参数值"
                                                      value={row.value}
                                                      onChange={(e) => updateUrlEncodedRow(row.id, 'value', e.target.value)}
                                                      className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all"
                                                    />
                                                  </div>
                                                  <div className="col-span-2">
                                                    <Select 
                                                      value={row.type} 
                                                      onValueChange={(value) => updateUrlEncodedRow(row.id, 'type', value)}
                                                    >
                                                      <SelectTrigger className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all">
                                                        <SelectValue />
                                                      </SelectTrigger>
                                                      <SelectContent>
                                                        <SelectItem value="string">
                                                          <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                            string
                                                          </div>
                                                        </SelectItem>
                                                        <SelectItem value="integer">
                                                          <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                                                            integer
                                                          </div>
                                                        </SelectItem>
                                                        <SelectItem value="number">
                                                          <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                                            number
                                                          </div>
                                                        </SelectItem>
                                                        <SelectItem value="boolean">
                                                          <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                                                            boolean
                                                          </div>
                                                        </SelectItem>
                                                        <SelectItem value="file">
                                                          <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                            file
                                                          </div>
                                                        </SelectItem>
                                                        <SelectItem value="array">
                                                          <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                                                            array
                                                          </div>
                                                        </SelectItem>
                                                        <SelectItem value="object">
                                                          <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-pink-500 rounded-full" />
                                                            object
                                                          </div>
                                                        </SelectItem>
                                                      </SelectContent>
                                                    </Select>
                                                  </div>
                                                  <div className="col-span-2 flex justify-center">
                                                    {row.id !== 'urlencoded-new' && row.key && (
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeUrlEncodedRow(row.id)}
                                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex-1 flex items-center justify-center">
                                            <div className="text-center text-muted-foreground">
                                              <Database className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                              <p className="text-sm mb-2">暂无URL编码数据</p>
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={addUrlEncodedRow}
                                                className="gap-1"
                                              >
                                                <Plus className="h-3 w-3" />
                                                添加URL编码项
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {(bodyType === 'json' || bodyType === 'xml' || bodyType === 'raw' || bodyType === 'graphql' || bodyType === 'msgpack') && (
                                    <div className="flex-1 flex flex-col">
                                      <div className="bg-muted/50 border-b p-3 flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                          {bodyType === 'json' && 'application/json'}
                                          {bodyType === 'xml' && 'application/xml'}
                                          {bodyType === 'raw' && 'text/plain'}
                                          {bodyType === 'graphql' && 'application/graphql'}
                                          {bodyType === 'msgpack' && 'application/msgpack'}
                                        </span>
                                      </div>
                                      <div className="flex-1 relative">
                                        <CodeEditor
                                          value={testBody}
                                          onChange={setTestBody}
                                          language={
                                            bodyType === 'json' ? 'json' :
                                            bodyType === 'xml' ? 'xml' :
                                            bodyType === 'graphql' ? 'graphql' :
                                            bodyType === 'msgpack' ? 'json' : // MessagePack显示为JSON格式
                                            bodyType === 'raw' ? 'plaintext' : 'plaintext'
                                          }
                                          placeholder={getBodyPlaceholder(bodyType)}
                                          height="100%"
                                          theme={editorTheme}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {bodyType === 'binary' && (
                                    <div className="flex-1 flex items-center justify-center text-center p-12">
                                      <div className="text-muted-foreground">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                                          <FileText className="h-8 w-8" />
                                        </div>
                                        <p className="text-sm mb-4">选择要上传的二进制文件</p>
                                        <label className="cursor-pointer">
                                          <Button variant="outline" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            选择文件
                                          </Button>
                                          <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) {
                                                setTestBody(`[Binary File: ${file.name}, Size: ${file.size} bytes]`)
                                              }
                                            }}
                                          />
                                        </label>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {activeTestTab === 'headers' && (
                              <div className="m-0 h-full p-6 space-y-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                      请求头
                                      {testHeaders.filter(h => h.enabled && h.name).length > 0 && (
                                        <Badge variant="secondary" className="h-5 px-2 text-xs">
                                          {testHeaders.filter(h => h.enabled && h.name).length} 个Header
                                        </Badge>
                                      )}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mt-1">配置HTTP请求头信息</p>
                                  </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addHeaderRow}
                                    className="gap-2 hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                                  >
                                    <Plus className="h-4 w-4" />
                                    添加Header
                                </Button>
                              </div>
                                
                                {/* Headers表格 */}
                                <div className="border rounded-xl overflow-hidden shadow-sm bg-background">
                                  <div className="bg-gradient-to-r from-muted/40 to-muted/60 border-b">
                                    <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-foreground">
                                      <div className="col-span-1 text-center">✓</div>
                                      <div className="col-span-4">Header名</div>
                                      <div className="col-span-5">Header值</div>
                                      <div className="col-span-2 text-center">操作</div>
                                    </div>
                                  </div>
                                  <div className="divide-y max-h-96 overflow-auto">
                                    {testHeaders.map((header) => (
                                      <div key={header.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-green-50/50 dark:hover:bg-green-950/20 transition-colors group">
                                        <div className="col-span-1 flex justify-center">
                                          <Switch
                                            checked={header.enabled}
                                            onCheckedChange={(checked) => updateHeaderRow(header.id, 'enabled', checked)}
                                          />
                                        </div>
                                        <div className="col-span-4">
                                          <Input
                                            placeholder="Header名"
                                            value={header.name}
                                            onChange={(e) => updateHeaderRow(header.id, 'name', e.target.value)}
                                            className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all"
                                            onBlur={() => {
                                              if (header.id === 'header-new' && header.name) {
                                                addHeaderRow()
                                              }
                                            }}
                                          />
                                        </div>
                                        <div className="col-span-5">
                                          <Input
                                            placeholder="Header值"
                                            value={header.value}
                                            onChange={(e) => updateHeaderRow(header.id, 'value', e.target.value)}
                                            className="h-9 text-sm border-0 bg-transparent focus:bg-background focus:border focus:rounded-md transition-all"
                                          />
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                          {header.id !== 'header-new' && header.name && (
                                <Button
                                  variant="ghost"
                                              size="sm"
                                              onClick={() => removeHeaderRow(header.id)}
                                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
                                            >
                                              <Minus className="h-4 w-4" />
                                </Button>
                                          )}
                                        </div>
                                        {header.description && (
                                          <div className="col-span-12 pl-4 py-2 bg-green-50/50 dark:bg-green-950/20 rounded-md -mx-1 mt-2">
                                            <div className="flex items-start gap-2">
                                              <span className="text-green-500 mt-0.5">💡</span>
                                              <div className="flex-1 text-sm">
                                                <MarkdownRenderer 
                                                  content={header.description}
                                                  className="prose-xs [&_p]:mb-1 [&_p]:text-sm [&_p]:text-green-700 [&_p]:dark:text-green-300 [&_code]:text-xs [&_code]:bg-green-100 [&_code]:dark:bg-green-900 [&_code]:px-1 [&_code]:py-0.5 [&_strong]:font-medium"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {activeTestTab === 'cookies' && (
                              <div className="m-0 h-full p-6 flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                  <Key className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                  <p>Cookies 功能开发中...</p>
                                </div>
                              </div>
                            )}

                            {activeTestTab === 'auth' && (
                              <div className="m-0 h-full p-6 flex items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
                                  <p>认证功能开发中...</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        </div>
                      
                      {/* 右侧：响应区域 */}
                      <div className="w-2/5 flex flex-col bg-muted/30">
                        {/* 响应标题栏 */}
                        <div className="flex-shrink-0 px-6 py-3 border-b bg-background">
                          <h3 className="text-sm font-medium text-muted-foreground">响应结果</h3>
                        </div>
                        
                        {/* 响应内容区域 - 全高度 */}
                        <div className="flex-1 overflow-auto">
                          {testResponse ? (
                            <div className="p-6 space-y-4">
                              {/* 响应状态栏 */}
                              <div className="bg-background border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold">响应状态</h4>
                                  <div className="flex items-center gap-3 text-sm">
                                    <Badge 
                                      variant={testResponse.status < 300 ? "default" : "destructive"}
                                      className="font-mono"
                                    >
                                      {testResponse.status} {testResponse.statusText}
                                    </Badge>
                                    <span className="text-muted-foreground">耗时: {testResponse.time}ms</span>
                                    {testResponse.size && (
                                      <span className="text-muted-foreground">大小: {testResponse.size}</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* 响应Headers */}
                              {testResponse.headers && (
                                <Card>
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">响应头</CardTitle>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="space-y-2 max-h-48 overflow-auto">
                                      {Object.entries(testResponse.headers).map(([key, value]) => (
                                        <div key={key} className="grid grid-cols-3 gap-4 text-sm py-2 border-b border-border/30 last:border-0">
                                          <div className="font-mono text-purple-600 dark:text-purple-400 font-medium">{key}</div>
                                          <div className="col-span-2 font-mono text-muted-foreground break-all">{String(value)}</div>
                              </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                              
                              {/* 响应体 */}
                              <Card>
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">响应体</CardTitle>
                                    <div className="flex gap-2">
                                      <Badge 
                                        variant="outline" 
                                        className="bg-blue-50 text-blue-700 border-blue-200"
                                      >
                                        {detectResponseLanguage(testResponse).toUpperCase()}
                                      </Badge>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const newFormatted = formatResponseData(testResponse)
                                          setFormattedResponse(newFormatted)
                                          setFormatMessage({
                                            type: 'success',
                                            text: '响应数据已重新格式化'
                                          })
                                        }}
                                        className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700"
                                        title="重新格式化响应数据"
                                      >
                                        格式化
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditorTheme(prev => prev === 'vs' ? 'vs-dark' : 'vs')}
                                        className="hover:bg-background-subtle hover:border-border-default"
                                        title="切换编辑器主题"
                                      >
                                        {editorTheme === 'vs' ? '🌙' : '☀️'}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleCopy(formattedResponse || formatResponseData(testResponse), 'response')}
                                        className="gap-2"
                                      >
                                        {copiedStates.response ? (
                                          <Check className="h-4 w-4 text-green-600" />
                                        ) : (
                                          <Copy className="h-4 w-4" />
                                        )}
                                        复制
                                      </Button>
                                      {formatMessage && (
                                        <div className={cn(
                                          "px-3 py-1 rounded-md text-xs font-medium transition-all duration-300",
                                          formatMessage.type === 'success' 
                                            ? "bg-green-50 text-green-700 border border-green-200" 
                                            : "bg-red-50 text-red-700 border border-red-200"
                                        )}>
                                          {formatMessage.text}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                  <div className="border rounded-lg overflow-hidden h-96">
                                    <CodeEditor
                                      value={formattedResponse || formatResponseData(testResponse)}
                                      onChange={() => {}} // 只读模式，空函数
                                      language={detectResponseLanguage(testResponse)}
                                      height="100%"
                                      theme={editorTheme}
                                      readOnly={true}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                  </div>
                          ) : (
                            <div className="h-full flex items-center justify-center p-6">
                              <div className="text-center space-y-4">
                                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500/20 to-green-500/20 rounded-full flex items-center justify-center">
                                  <Play className="h-10 w-10 text-muted-foreground/50" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-lg mb-2">点击"发送"按钮获取响应结果</h4>
                                  <p className="text-muted-foreground text-sm">
                                    配置好参数后点击发送按钮来测试API
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <Card className="p-12 text-center max-w-md">
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
                  <h3 className="text-xl font-semibold mb-2">
                    选择一个 API 接口
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    从左侧列表中选择一个 API 接口来查看详细信息和进行测试
                  </p>
                  {apiSpec && (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>API 文档: {apiSpec.info.title} v{apiSpec.info.version}</p>
                      <p>共 {apiEndpoints.length} 个接口</p>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* 移动端遮罩（内嵌设置页时不再需要）*/}

        {/* 创建 API Key 弹窗 */}
        <CreateApiKeyDialog
          open={createApiKeyModalOpen}
          isLoading={createApiKeyLoading}
          onOpenChange={setCreateApiKeyModalOpen}
          onSubmit={handleCreateApiKey}
        />

        {/* 编辑 API Key 弹窗 */}
        <EditApiKeyDialog
          apiKey={editingApiKey}
          isLoading={editApiKeyLoading}
          onOpenChange={(open) => {
            if (!open) setEditingApiKey(null)
          }}
          onSubmit={handleEditApiKey}
        />

        {/* Portal 渲染的下拉菜单 */}
        {openDropdowns.size > 0 && createPortal(
          <>
            {Array.from(openDropdowns).map((apiKeyId) => {
              const position = dropdownPositions[apiKeyId]
              const apiKey = apiKeys.find(k => k.tenant_id === apiKeyId)
              
              if (!position || !apiKey) return null
              
              return (
                <div 
                  key={apiKeyId}
                  className="fixed w-40 bg-background-surface border border-border-default rounded-md shadow-lg z-[9999]"
                  style={{
                    top: position.top,
                    right: position.right
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    <button 
                      onClick={() => {
                        setEditingApiKey(apiKey)
                        setOpenDropdowns(new Set())
                      }}
                      disabled={operatingKeys.has(apiKey.tenant_id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-subtle transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="h-4 w-4" />
                      编辑
                    </button>
                    <button 
                      onClick={() => {
                        regenerateApiKey(apiKey)
                        setOpenDropdowns(new Set())
                      }}
                      disabled={operatingKeys.has(apiKey.tenant_id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-subtle transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="h-4 w-4" />
                      重新生成
                    </button>
                    <button 
                      onClick={() => {
                        deleteApiKey(apiKey)
                        setOpenDropdowns(new Set())
                      }}
                      disabled={operatingKeys.has(apiKey.tenant_id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-background-subtle transition-colors flex items-center gap-2 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </button>
                  </div>
                </div>
              )
            })}
          </>,
          document.body
        )}
      </div>
    </div>
  )
}

export default ApiDocumentationPage
