import { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { 
  Search, Globe, Database, Users, Shield, 
  Play, Copy, Check, RefreshCw, Activity, Star, FileText, 
  Key, Zap, BookOpen, ChevronDown, ChevronRight,
  Plus, Minus, Save, Archive, Edit2, Trash2, MoreHorizontal
} from "lucide-react"
import { Tabs as AntdTabs } from "antd"
import Editor from '@monaco-editor/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MethodBadge } from '@/components/ui/method-badge'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/components/ui/utils'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'

import { 
  apiLoader
} from '@/services/api-loader'
import type { 
  APIEndpoint, 
  OpenAPISpec, 
  Environment
} from '@/services/api-loader'
import { systemAPI } from '@/api/system'
import type { SystemAPIToken, APITokenCreateRequest } from '@/types/api'

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

// API Key 接口定义 - 使用系统API Token类型
type ApiKey = SystemAPIToken

const tagIcons = {
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
  
  // 分组收起状态 - 默认只展开第一个分组
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})
  
  // 环境管理 - 扩展更多环境
  const [environments] = useState<Environment[]>([
    {
      id: "staging",
      name: "演示环境",
      variables: {
        baseUrl: "https://demo-api.example.com",
        apiKey: "YOUR_DEMO_API_KEY"
      }
    },
    {
      id: "dev",
      name: "开发环境",
      variables: {
        baseUrl: "http://localhost:3000",
        apiKey: "YOUR_DEV_API_KEY"
      }
    },
    {
      id: "prod",
      name: "正式环境",
      variables: {
        baseUrl: "https://api.example.com",
        apiKey: "YOUR_PROD_API_KEY"
      }
    },
    {
      id: "test",
      name: "体验环境",
      variables: {
        baseUrl: "https://test-api.example.com",
        apiKey: "YOUR_TEST_API_KEY"
      }
    },
    {
      id: "local",
      name: "本地 Mock",
      variables: {
        baseUrl: "http://localhost:8080",
        apiKey: "MOCK_API_KEY"
      }
    },
    {
      id: "cloud",
      name: "云端 Mock",
      variables: {
        baseUrl: "https://mock-api.example.com",
        apiKey: "CLOUD_MOCK_KEY"
      }
    },
    {
      id: "local-dev",
      name: "本地开发环境",
      variables: {
        baseUrl: "http://192.168.1.100:3000",
        apiKey: "LOCAL_DEV_KEY"
      }
    },
    {
      id: "custom",
      name: "社晓龙192",
      variables: {
        baseUrl: "http://192.168.1.192:8080",
        apiKey: "CUSTOM_API_KEY"
      }
    }
  ])
  const [selectedEnvironment, setSelectedEnvironment] = useState(environments[0])
  
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
  const [urlEncodedRows, setUrlEncodedRows] = useState<FormDataRow[]>([])
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
  const [userPermissions] = useState<string[]>(["user"])
  const [envManagementOpen, setEnvManagementOpen] = useState(false)

  // 请求体格式化函数
  const formatBodyContent = useCallback((content: string, type: BodyType) => {
    if (!content.trim()) {
      // 提供默认模板
      switch (type) {
        case 'json':
          return '{\n  "name": "示例用户",\n  "email": "user@example.com",\n  "age": 25,\n  "active": true\n}'
        case 'xml':
          return '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <user>\n    <name>示例用户</name>\n    <email>user@example.com</email>\n  </user>\n</root>'
        case 'graphql':
          return 'query GetUsers {\n  users {\n    id\n    name\n    email\n    createdAt\n  }\n}'
        default:
          return content
      }
    }
    
    try {
      switch (type) {
        case 'json':
          const parsed = JSON.parse(content)
          const formatted = JSON.stringify(parsed, null, 2)
          setFormatMessage({
            type: 'success',
            text: 'JSON 格式化成功'
          })
          return formatted
        case 'xml':
          // 简单的XML格式化
          const xmlFormatted = content
            .replace(/></g, '>\n<')
            .replace(/^\s*\n/gm, '')
            .split('\n')
            .map((line) => {
              const trimmedLine = line.trim()
              if (!trimmedLine) return ''
              
              const indent = '  '.repeat(Math.max(0, 
                (trimmedLine.match(/^<[^\/]/g) ? 1 : 0) - 
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
        case 'graphql':
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
  }, [setFormatMessage])

  // 压缩内容
  const minifyBodyContent = useCallback((content: string, type: BodyType) => {
    if (!content.trim()) {
      return content
    }
    
    try {
      switch (type) {
        case 'json':
          const parsed = JSON.parse(content)
          const minified = JSON.stringify(parsed)
          setFormatMessage({
            type: 'success',
            text: 'JSON 压缩成功'
          })
          return minified
        case 'xml':
          const xmlMinified = content.replace(/>\s+</g, '><').replace(/\s+/g, ' ').trim()
          setFormatMessage({
            type: 'success',
            text: 'XML 压缩成功'
          })
          return xmlMinified
        case 'graphql':
          const graphqlMinified = content.replace(/\s+/g, ' ').trim()
          setFormatMessage({
            type: 'success',
            text: 'GraphQL 压缩成功'
          })
          return graphqlMinified
        default:
          const defaultMinified = content.replace(/\s+/g, ' ').trim()
          setFormatMessage({
            type: 'success',
            text: '内容压缩成功'
          })
          return defaultMinified
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
    const newRow: FormDataRow = {
      id: `url-encoded-${Date.now()}`,
      enabled: true,
      key: '',
      value: '',
      type: 'text'
    }
    setUrlEncodedRows(prev => [...prev, newRow])
  }, [])

  const updateUrlEncodedRow = useCallback((id: string, field: keyof FormDataRow, value: any) => {
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
    loadAPIData()
  }, [])

  // 当选中API变化时，初始化测试数据
  useEffect(() => {
    if (selectedAPI) {
      initializeTestData(selectedAPI)
    }
  }, [selectedAPI])

  // 当 API Key 管理弹窗打开时加载数据
  useEffect(() => {
    if (apiKeyManagementOpen) {
      loadApiKeys()
    }
  }, [apiKeyManagementOpen])

  // 当分页、搜索参数变化时重新加载
  useEffect(() => {
    if (apiKeyManagementOpen) {
      loadApiKeys()
    }
  }, [apiKeyPage, apiKeyPageSize])

  // 搜索关键词变化时重新加载（带防抖）
  useEffect(() => {
    if (!apiKeyManagementOpen) return
    
    const timeoutId = setTimeout(() => {
      setApiKeyPage(1) // 搜索时重置到第一页
      loadApiKeys()
    }, 300)

    return () => clearTimeout(timeoutId)
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
      const example = Object.values(api.requestBody.content)[0]?.example
      setTestBody(example ? JSON.stringify(example, null, 2) : '')
    } else {
      setTestBody('')
    }
  }

  const loadAPIData = async () => {
    setIsLoading(true)
    setLoadingProgress(0)
    
    try {
      // 模拟加载进度
      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      setLoadingSource("static")
      const spec = await apiLoader.getFullSpec({
        preferDynamic: false,
        userPermissions
      })

      const endpoints = apiLoader.convertToAPIEndpoints(spec)
      
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
      }, 300)

    } catch (error) {
      console.error('Failed to load API data:', error)
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

  // 按标签分组
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
            {/* 标题显示在搜索框上方 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-base">用户管理系统 API</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">v1.0.0</Badge>
                    <span>•</span>
                    <span>API 文档</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadAPIData}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
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

            {/* API文档描述 */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground leading-relaxed">
                开放 API 文档与调用测试；并可通过右侧按钮管理 API Key 的增删改查
              </p>
                      </div>

            {/* 统计信息 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">接口总数</div>
                <div className="text-lg font-semibold">{apiEndpoints.length}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">分组数量</div>
                <div className="text-lg font-semibold">{Object.keys(groupedEndpoints).length}</div>
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
                          {tag}
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
                            <MethodBadge method={api.method as any} size="sm" />
                            {api.deprecated && (
                              <Badge variant="destructive" className="text-xs">
                                已弃用
                              </Badge>
                          )}
                        </div>
                          <div className="font-medium mb-1">{api.summary}</div>
                          <div className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                            {api.path}
                          </div>
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
                {/* 顶部模式切换标签 - 使用 antd Tabs */}
                <div className="bg-gradient-to-r from-background to-muted/20 border-b px-6 py-4 flex items-center gap-6">
                  <AntdTabs
                    activeKey={mainMode}
                    onChange={(key) => setMainMode(key as "interface" | "test")}
                    items={[
                      {
                        key: 'interface',
                        label: (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            接口
                          </div>
                        ),
                      },
                      {
                        key: 'test',
                        label: (
                          <div className="flex items-center gap-2">
                            <Play className="h-4 w-4" />
                            运行
                          </div>
                        ),
                      },
                    ]}
                    className="ant-tabs-custom"
                    size="large"
                  />
                  
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
                      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            API Key 管理
                          </DialogTitle>
                          <DialogDescription>
                            管理您的 API Key，包括创建、编辑和删除操作
                          </DialogDescription>
                        </DialogHeader>

                        {/* API Key 管理内容 */}
                        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                          {/* 操作栏 */}
                          <div className="flex items-center justify-between gap-4">
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
                              <div className="h-96 flex items-center justify-center">
                                <div className="text-center space-y-4">
                                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                                  <p className="text-muted-foreground">加载中...</p>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col">
                                {/* 表头 */}
                                <div className="bg-muted/50 border-b">
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
                                    <div className="divide-y" style={{ position: 'relative', zIndex: 1 }}>
                                      {apiKeys.map((apiKey) => (
                                        <div key={apiKey.tenant_id} className="grid grid-cols-12 gap-3 p-4 hover:bg-muted/30 transition-colors relative">
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
                                          <div className="col-span-1 flex justify-center relative z-[100]">
                                            <div className="relative">
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
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 分页 */}
                          {apiKeyTotal > 0 && (
                            <div className="flex items-center justify-between border-t pt-4">
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
                                <div className="flex items-center space-x-2" style={{ color: 'var(--color-components-pagination-text)' }}>
                                  <button
                                    onClick={() => setApiKeyPage(Math.max(1, apiKeyPage - 1))}
                                    disabled={apiKeyPage <= 1}
                                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors border"
                                    style={{
                                      backgroundColor: apiKeyPage <= 1 ? 'var(--color-components-pagination-disabled-bg)' : 'var(--color-components-pagination-item-bg)',
                                      color: apiKeyPage <= 1 ? 'var(--color-components-pagination-disabled-text)' : 'var(--color-components-pagination-item-text)',
                                      borderColor: 'var(--color-components-pagination-border)'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (apiKeyPage > 1) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg-hover)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (apiKeyPage > 1) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg)'
                                      }
                                    }}
                                  >
                                    上一页
                                  </button>

                                  <div
                                    className="flex items-center rounded-lg p-1"
                                    style={{ backgroundColor: 'var(--color-components-pagination-bg)', border: '1px solid var(--color-components-pagination-border)' }}
                                  >
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
                                        <button
                                          key={pageNum}
                                          className="w-8 h-8 p-0 rounded-md text-sm font-medium transition-colors"
                                          style={{
                                            backgroundColor: pageNum === apiKeyPage ? 'var(--color-components-pagination-item-bg-active)' : 'var(--color-components-pagination-item-bg)',
                                            color: pageNum === apiKeyPage ? 'var(--color-components-pagination-item-text-active)' : 'var(--color-components-pagination-item-text)'
                                          }}
                                          onMouseEnter={(e) => {
                                            if (pageNum !== apiKeyPage) {
                                              e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg-hover)'
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (pageNum !== apiKeyPage) {
                                              e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg)'
                                            }
                                          }}
                                          onClick={() => setApiKeyPage(pageNum)}
                                        >
                                          {pageNum}
                                        </button>
                                      )
                                    })}
                                  </div>
                                  
                                  <button
                                    onClick={() => setApiKeyPage(Math.min(Math.ceil(apiKeyTotal / apiKeyPageSize), apiKeyPage + 1))}
                                    disabled={apiKeyPage >= Math.ceil(apiKeyTotal / apiKeyPageSize)}
                                    className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors border"
                                    style={{
                                      backgroundColor: apiKeyPage >= Math.ceil(apiKeyTotal / apiKeyPageSize) ? 'var(--color-components-pagination-disabled-bg)' : 'var(--color-components-pagination-item-bg)',
                                      color: apiKeyPage >= Math.ceil(apiKeyTotal / apiKeyPageSize) ? 'var(--color-components-pagination-disabled-text)' : 'var(--color-components-pagination-item-text)',
                                      borderColor: 'var(--color-components-pagination-border)'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (apiKeyPage < Math.ceil(apiKeyTotal / apiKeyPageSize)) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg-hover)'
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (apiKeyPage < Math.ceil(apiKeyTotal / apiKeyPageSize)) {
                                        e.currentTarget.style.backgroundColor = 'var(--color-components-pagination-item-bg)'
                                      }
                                    }}
                                  >
                                    下一页
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* 环境选择器 - 优化版 */}
                    <div className="relative">
                      <Select value={selectedEnvironment.id} onValueChange={(value) => {
                        const env = environments.find(e => e.id === value)
                        if (env) setSelectedEnvironment(env)
                      }}>
                      <SelectTrigger className="w-64 bg-background border border-border/50 shadow-sm hover:border-border transition-colors h-10">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            {(() => {
                              const getEnvDisplay = (envId: string) => {
                                switch(envId) {
                                  case 'prod': return { bg: 'bg-green-500', label: '正' }
                                  case 'staging': return { bg: 'bg-purple-500', label: '演' }  
                                  case 'dev': return { bg: 'bg-blue-500', label: '开' }
                                  case 'test': return { bg: 'bg-cyan-500', label: '体' }
                                  case 'local': return { bg: 'bg-emerald-500', label: '本' }
                                  case 'cloud': return { bg: 'bg-gray-500', label: '云' }
                                  case 'local-dev': return { bg: 'bg-teal-500', label: '本' }
                                  case 'custom': return { bg: 'bg-violet-500', label: '社' }
                                  default: return { bg: 'bg-gray-400', label: '?' }
                                }
                              }
                              const display = getEnvDisplay(selectedEnvironment.id)
                              return (
                                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm", display.bg)}>
                                  {display.label}
          </div>
                              )
                            })()}
        </div>
                          <div className="flex flex-col items-start">
                            <span className="font-medium text-sm">{selectedEnvironment.name}</span>
                          </div>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="w-64">
                        {environments.map((env) => {
                          const getEnvColor = (envId: string) => {
                            switch(envId) {
                              case 'prod': return { bg: 'bg-green-500', label: '正' }
                              case 'staging': return { bg: 'bg-purple-500', label: '演' }  
                              case 'dev': return { bg: 'bg-blue-500', label: '开' }
                              case 'test': return { bg: 'bg-cyan-500', label: '体' }
                              case 'local': return { bg: 'bg-emerald-500', label: '本' }
                              case 'cloud': return { bg: 'bg-gray-500', label: '云' }
                              case 'local-dev': return { bg: 'bg-teal-500', label: '本' }
                              case 'custom': return { bg: 'bg-violet-500', label: '社' }
                              default: return { bg: 'bg-gray-400', label: '?' }
                            }
                          }
                          const colors = getEnvColor(env.id)
                          
                          return (
                            <SelectItem key={env.id} value={env.id} className="p-3 hover:bg-muted/50">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold", colors.bg)}>
                                  {colors.label}
                                </div>
                                <span className="font-medium text-sm">{env.name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                        <div className="border-t p-2 bg-muted/30">
                          <Dialog open={envManagementOpen} onOpenChange={setEnvManagementOpen}>
                            <DialogTrigger className="w-full">
                              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground">
                                <Plus className="h-4 w-4" />
                                环境管理
                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Globe className="h-5 w-5" />
                                  环境管理
                                </DialogTitle>
                                <DialogDescription>
                                  管理API测试环境和变量配置
                                </DialogDescription>
                              </DialogHeader>

                              <div className="flex-1 overflow-hidden flex">
                                {/* 左侧环境列表 */}
                                <div className="w-80 border-r bg-muted/20">
                                  <div className="p-4 border-b">
                                    <h3 className="font-semibold mb-3">环境列表</h3>
                                    <Button variant="outline" size="sm" className="w-full gap-2">
                                      <Plus className="h-4 w-4" />
                                      新建环境
                                    </Button>
                                  </div>
                                  <div className="flex-1 overflow-auto custom-scrollbar" style={{
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: 'rgba(203, 213, 225, 0.5) transparent'
                                  }}>
                                    <div className="p-2 space-y-1">
                                      {environments.map((env) => {
                                        const getEnvColor = (envId: string) => {
                                          switch(envId) {
                                            case 'prod': return { bg: 'bg-green-500', label: '正' }
                                            case 'staging': return { bg: 'bg-purple-500', label: '演' }  
                                            case 'dev': return { bg: 'bg-blue-500', label: '开' }
                                            case 'test': return { bg: 'bg-cyan-500', label: '体' }
                                            case 'local': return { bg: 'bg-emerald-500', label: '本' }
                                            case 'cloud': return { bg: 'bg-gray-500', label: '云' }
                                            case 'local-dev': return { bg: 'bg-teal-500', label: '本' }
                                            case 'custom': return { bg: 'bg-violet-500', label: '社' }
                                            default: return { bg: 'bg-gray-400', label: '?' }
                                          }
                                        }
                                        const colors = getEnvColor(env.id)
                                        const isSelected = env.id === selectedEnvironment.id

                                        return (
                                          <button
                                            key={env.id}
                                            onClick={() => setSelectedEnvironment(env)}
                                            className={cn(
                                              "w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3",
                                              isSelected ? "bg-background shadow-sm border" : "hover:bg-background/50"
                                            )}
                                          >
                                            <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold", colors.bg)}>
                                              {colors.label}
                                            </div>
                                            <span className="font-medium">{env.name}</span>
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>

                                {/* 右侧环境详情 */}
                                <div className="flex-1 overflow-auto">
                                  <div className="p-6 space-y-6">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        {(() => {
                                          const getEnvDisplay = (envId: string) => {
                                            switch(envId) {
                                              case 'prod': return { bg: 'bg-green-500', label: '正' }
                                              case 'staging': return { bg: 'bg-purple-500', label: '演' }  
                                              case 'dev': return { bg: 'bg-blue-500', label: '开' }
                                              case 'test': return { bg: 'bg-cyan-500', label: '体' }
                                              case 'local': return { bg: 'bg-emerald-500', label: '本' }
                                              case 'cloud': return { bg: 'bg-gray-500', label: '云' }
                                              case 'local-dev': return { bg: 'bg-teal-500', label: '本' }
                                              case 'custom': return { bg: 'bg-violet-500', label: '社' }
                                              default: return { bg: 'bg-gray-400', label: '?' }
                                            }
                                          }
                                          const display = getEnvDisplay(selectedEnvironment.id)
                                          return (
                                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold", display.bg)}>
                                              {display.label}
                                            </div>
                                          )
                                        })()}
                <div>
                                          <h2 className="text-xl font-semibold">{selectedEnvironment.name}</h2>
                                          <p className="text-sm text-muted-foreground">环境配置</p>
                </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm">共享</Button>
                                        <Button variant="outline" size="sm">保存</Button>
                                      </div>
            </div>

                                    {/* 前置URL配置 */}
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base">前置 URL</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div>
                                          <Label className="text-sm text-muted-foreground mb-2 block">默认模块</Label>
                                          <Input 
                                            value={selectedEnvironment.variables.baseUrl}
                                            className="font-mono"
                                            readOnly
                                          />
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* 环境变量 */}
                                    <Card>
                                      <CardHeader>
                                        <CardTitle className="text-base flex items-center justify-between">
                                          环境变量
                                          <Button variant="outline" size="sm" className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            添加变量
              </Button>
                                        </CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="border rounded-lg overflow-hidden">
                                          <div className="bg-muted/50 border-b">
                                            <div className="grid grid-cols-5 gap-4 p-3 text-sm font-medium text-muted-foreground">
                                              <div>变量名</div>
                                              <div>类型</div>
                                              <div>远程值</div>
                                              <div>本地值</div>
                                              <div>说明</div>
            </div>
          </div>
                                          <div className="divide-y">
                                            <div className="grid grid-cols-5 gap-4 p-3 items-center">
                                              <div className="font-mono text-sm">bear_token</div>
                                              <div>
                                                <Badge variant="outline" className="text-xs">默认</Badge>
                          </div>
                                              <div className="font-mono text-xs text-blue-600">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                                              <div className="font-mono text-xs text-muted-foreground">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</div>
                                              <div>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                  <Minus className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                            <div className="grid grid-cols-5 gap-4 p-3 items-center text-muted-foreground">
                                              <div className="text-sm">+ 添加变量</div>
                                              <div></div>
                                              <div></div>
                                              <div></div>
                                              <div></div>
                                            </div>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </SelectContent>
                    </Select>
                    </div>
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
                              {selectedEnvironment.variables.baseUrl}{selectedAPI.path}
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
{`curl -X ${selectedAPI.method} "${selectedEnvironment.variables.baseUrl}${selectedAPI.path}" \\
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
                            {selectedEnvironment.variables.baseUrl}{selectedAPI.path}
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              onClick={handleTestAPI}
                              disabled={testLoading}
                              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-colors duration-150 h-10"
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
                            <AntdTabs
                              activeKey={activeTestTab}
                              onChange={setActiveTestTab}
                              items={[
                                {
                                  key: 'params',
                                  label: (
                                    <div className="flex items-center gap-2">
                                      <span>Params</span>
                                      {testParams.filter(p => p.enabled && p.name).length > 0 && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex items-center justify-center">
                                          {testParams.filter(p => p.enabled && p.name).length}
                                        </Badge>
                                      )}
                                    </div>
                                  ),
                                },
                                {
                                  key: 'body',
                                  label: (
                                    <div className="flex items-center gap-2">
                                      <span>Body</span>
                                      {testBody && testBody.trim() && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex items-center justify-center">
                                          1
                                        </Badge>
                                      )}
                                    </div>
                                  ),
                                },
                                {
                                  key: 'headers',
                                  label: (
                                    <div className="flex items-center gap-2">
                                      <span>Headers</span>
                                      {testHeaders.filter(h => h.enabled && h.name).length > 0 && (
                                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px] flex items-center justify-center">
                                          {testHeaders.filter(h => h.enabled && h.name).length}
                                        </Badge>
                                      )}
                                    </div>
                                  ),
                                },
                                {
                                  key: 'cookies',
                                  label: (
                                    <div className="flex items-center gap-2">
                                      <span>Cookies</span>
                                    </div>
                                  ),
                                },
                                {
                                  key: 'auth',
                                  label: (
                                    <div className="flex items-center gap-2">
                                      <span>Auth</span>
                                    </div>
                                  ),
                                },
                              ]}
                              className="ant-tabs-custom"
                              size="middle"
                            />
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
                                    <h3 className="text-lg font-semibold">请求体</h3>
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
                                          className="hover:bg-gray-50 hover:border-gray-200"
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
                                        <div className="p-4 space-y-3">
                                          {urlEncodedRows.map((row) => (
                                            <div key={row.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                                              <Switch
                                                checked={row.enabled}
                                                onCheckedChange={(checked) => updateUrlEncodedRow(row.id, 'enabled', checked)}
                                              />
                                              <Input
                                                placeholder="Key"
                                                value={row.key}
                                                onChange={(e) => updateUrlEncodedRow(row.id, 'key', e.target.value)}
                                                className="flex-1"
                                              />
                                              <Input
                                                placeholder="Value"
                                                value={row.value}
                                                onChange={(e) => updateUrlEncodedRow(row.id, 'value', e.target.value)}
                                                className="flex-1"
                                              />
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeUrlEncodedRow(row.id)}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ))}
                                          {urlEncodedRows.length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground">
                                              <p className="text-sm">暂无URL编码数据</p>
                                              <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={addUrlEncodedRow}
                                                className="mt-2 gap-1"
                                              >
                                                <Plus className="h-3 w-3" />
                                                添加参数
                                              </Button>
                                            </div>
                                          )}
                                        </div>
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
                                          placeholder={
                                            bodyType === 'json' ? '{\n  "name": "示例用户",\n  "email": "user@example.com",\n  "age": 25,\n  "active": true\n}' :
                                            bodyType === 'xml' ? '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <user>\n    <name>示例用户</name>\n    <email>user@example.com</email>\n  </user>\n</root>' :
                                            bodyType === 'graphql' ? 'query GetUsers {\n  users {\n    id\n    name\n    email\n    createdAt\n  }\n}' :
                                            bodyType === 'msgpack' ? '# MessagePack 格式示例\n{\n  "data": "binary encoded content"\n}' :
                                            '# 输入原始文本数据\n# 支持任意格式内容'
                                          }
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
                                        className="hover:bg-gray-50 hover:border-gray-200"
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
        <Dialog open={createApiKeyModalOpen} onOpenChange={setCreateApiKeyModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                创建 API Key
              </DialogTitle>
              <DialogDescription>
                创建新的 API Key 用于访问接口
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              setCreateApiKeyLoading(true)
              try {
                // 调用真实API创建Token
                const tokenData: APITokenCreateRequest = {
                  name: formData.get('name') as string,
                  description: formData.get('description') as string || null
                }
                
                await systemAPI.createToken(tokenData)
                setCreateApiKeyModalOpen(false)
                loadApiKeys() // 刷新列表显示新创建的token
              } catch (error) {
                console.error('Failed to create API key:', error)
                // 这里可以显示错误提示
              } finally {
                setCreateApiKeyLoading(false)
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="name">名称 *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="输入 API Key 名称"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">描述</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="输入 API Key 描述（可选）"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCreateApiKeyModalOpen(false)}
                  disabled={createApiKeyLoading}
                >
                  取消
                </Button>
                <Button type="submit" disabled={createApiKeyLoading}>
                  {createApiKeyLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      创建中...
                    </>
                  ) : (
                    '创建'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* 编辑 API Key 弹窗 */}
        <Dialog open={!!editingApiKey} onOpenChange={(open) => !open && setEditingApiKey(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="h-5 w-5" />
                编辑 API Key
              </DialogTitle>
              <DialogDescription>
                修改 API Key 的名称和描述
              </DialogDescription>
            </DialogHeader>
            {editingApiKey && (
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                setEditApiKeyLoading(true)
                try {
                  // 模拟编辑 API
                  await new Promise(resolve => setTimeout(resolve, 500))
                  console.log('编辑 API Key:', {
                    id: editingApiKey.tenant_id,
                    name: formData.get('name'),
                    description: formData.get('description')
                  })
                  setEditingApiKey(null)
                  loadApiKeys() // 不需要 await，让它在后台刷新
                } finally {
                  setEditApiKeyLoading(false)
                }
              }} className="space-y-4">
                <div>
                  <Label htmlFor="edit-name">名称 *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingApiKey.name}
                    placeholder="输入 API Key 名称"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">描述</Label>
                  <Textarea
                    id="edit-description"
                    name="description"
                    defaultValue={editingApiKey.description}
                    placeholder="输入 API Key 描述（可选）"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEditingApiKey(null)}
                    disabled={editApiKeyLoading}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={editApiKeyLoading}>
                    {editApiKeyLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      '保存'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

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
                  className="fixed w-40 bg-white border border-gray-200 rounded-md shadow-lg z-[9999]"
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
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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