import { useQuery } from '@tanstack/react-query'
import {
  convertToAPIEndpoints,
  loadApiSpecification,
} from '@/pages/settings/api-documentation-data'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import './api-keys-page.css'
import {
  Search,
  Globe,
  Database,
  Users,
  Shield,
  Play,
  Copy,
  Check,
  RefreshCw,
  Activity,
  Star,
  FileText,
  Key,
  Zap,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
  Save,
  Archive,
  Trash2,
  Settings2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import MonacoEditor from '@monaco-editor/react'
import { configureMonacoLoader } from '@/components/jsonjoy-builder/lib/configure-monaco-loader'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { MethodBadge } from '@/components/ui/method-badge'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/components/ui/utils'
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer'
import { ApiKeyManagerDialog } from '@/pages/settings/components/api-key-manager-dialog'
import {
  ModernEnvironmentSelector,
  NewEnvironmentManager,
} from '@/components/environment'
import { useEnvironmentResolver } from '@/hooks/use-environment-request'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { apiKeysCapabilities } from '@/pages/settings/api-keys-capabilities'
import {
  isRecord,
  type APIEndpoint,
  type BodyType,
  type FormDataRow,
  type HeaderRow,
  type ParamRow,
  type Schema,
  type TestResponse,
  type UrlEncodedRow,
} from '@/pages/settings/api-keys-types'

configureMonacoLoader()

const tagIcons = {
  // 标准的tag图标映射
  chat: Users,
  session: Activity,
  files: FileText,
  file: FileText,
  dataset: Database,
  document: FileText,
  agent: Shield,
  // 兼容原有的标签图标
  用户管理: Users,
  订单管理: Database,
  认证授权: Shield,
  系统配置: Globe,
  文件管理: FileText,
  通知服务: Zap,
  支付管理: Key,
  数据分析: Activity,
  消息推送: Star,
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
  readOnly = false,
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
    fontFamily:
      'Monaco, "Cascadia Code", "Source Code Pro", Consolas, "Courier New", monospace',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    renderWhitespace: 'boundary' as const,
    wordWrap: 'on' as const,
    automaticLayout: true,
    scrollbar: {
      vertical: 'visible' as const,
      horizontal: 'visible' as const,
      verticalScrollbarSize: 12,
      horizontalScrollbarSize: 12,
    },
    suggest: {
      showKeywords: readOnly ? false : true,
      showSnippets: readOnly ? false : true,
    },
    tabSize: 2,
    insertSpaces: true,
    detectIndentation: false,
    glyphMargin: false,
    folding: true,
    selectOnLineNumbers: !readOnly,
    matchBrackets: 'always' as const,
    contextmenu: !readOnly,
    quickSuggestions: readOnly ? false : true,
  }

  return (
    <div className="relative h-full border-0">
      <MonacoEditor
        height={height}
        language={language}
        value={value}
        onChange={handleEditorChange}
        options={editorOptions}
        theme={theme}
        loading={
          <div className="flex h-full items-center justify-center">
            <div className="text-sm text-muted-foreground">加载编辑器中...</div>
          </div>
        }
      />
      {/* 优化的 placeholder overlay - 适配 Monaco Editor 布局 */}
      {!value && placeholder && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="flex h-full">
            {/* 行号区域 - 匹配 Monaco 的行号宽度 */}
            <div className="w-14 shrink-0 bg-transparent"></div>
            {/* 内容区域 - 匹配 Monaco 的内容区域 */}
            <div className="flex-1 pt-1 pl-1">
              <div className="font-mono text-sm leading-[1.6] whitespace-pre-wrap text-muted-foreground/50 select-none">
                {placeholder}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ApiDocumentationPage: React.FC = () => {
  const { t } = useTranslation()
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [dynamicSource, setDynamicSource] = useState(false)
  const specQuery = useQuery({
    queryKey: ['apiDocumentation', 'spec', dynamicSource],
    queryFn: ({ signal }) => loadApiSpecification(dynamicSource, signal),
    staleTime: 60_000,
  })
  const apiSpec = specQuery.data?.spec ?? null
  const apiEndpoints = useMemo(
    () => (apiSpec ? convertToAPIEndpoints(apiSpec) : []),
    [apiSpec],
  )
  const isLoading = specQuery.isFetching
  const loadingSource =
    specQuery.data?.source ?? (dynamicSource ? 'dynamic' : 'static')
  const loadingError =
    specQuery.error?.message ?? specQuery.data?.warning ?? null
  const loadAPIData = async (dynamic = false) => {
    if (dynamic !== dynamicSource) setDynamicSource(dynamic)
    else await specQuery.refetch()
  }
  const [previousEndpoints, setPreviousEndpoints] = useState<
    APIEndpoint[] | null
  >(null)
  if (previousEndpoints !== apiEndpoints) {
    setPreviousEndpoints(apiEndpoints)
    setSelectedAPI(
      apiEndpoints.find((endpoint) => endpoint.id === selectedAPI?.id) ??
        apiEndpoints[0] ??
        null,
    )
  }

  // 分组收起状态 - 默认只展开第一个分组
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({})

  // 使用新的环境管理store
  const {
    currentEnvironment,
    selectedEnvironmentId,
    selectEnvironment,
    resolveText,
    getVariableMap,
  } = useEnvironmentResolver()

  // 环境管理弹窗状态
  const [showEnvironmentManager, setShowEnvironmentManager] = useState(false)

  // 获取基础URL的辅助函数
  const getBaseUrl = useCallback(() => {
    if (!currentEnvironment) return 'https://api.example.com'

    // 优先使用环境对象上的base_url字段（后端新增支持）
    if (currentEnvironment.base_url) {
      return currentEnvironment.base_url
    }

    // 如果环境对象没有base_url，再从变量中查找
    const variables = getVariableMap()
    const baseUrl =
      variables.baseUrl ||
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
  const getFullApiUrl = useCallback(
    (path: string) => {
      const baseUrl = getBaseUrl()
      const fullUrl = resolveText(`${baseUrl}${path}`)
      return fullUrl
    },
    [getBaseUrl, resolveText],
  )

  // API测试相关状态
  const [testResponse] = useState<TestResponse | null>(null)
  const { copiedStates, copyWithFeedback: handleCopy } = useCopyFeedback()

  // Apifox风格的测试状态
  const [testParams, setTestParams] = useState<ParamRow[]>([])
  const [testHeaders, setTestHeaders] = useState<HeaderRow[]>([])
  const [testBody, setTestBody] = useState('')
  const [bodyType, setBodyType] = useState<BodyType>('json')
  const [formDataRows, setFormDataRows] = useState<FormDataRow[]>([])
  const [urlEncodedRows, setUrlEncodedRows] = useState<UrlEncodedRow[]>([
    {
      id: 'urlencoded-new',
      enabled: false,
      key: '',
      value: '',
      type: 'string',
    },
  ])
  const [activeTestTab, setActiveTestTab] = useState('params')

  // 格式化状态提示
  const [formatMessage, setFormatMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // 编辑器主题
  const [editorTheme, setEditorTheme] = useState<'vs' | 'vs-dark'>('vs')

  // 响应数据语言检测函数
  const detectResponseLanguage = useCallback(
    (response: TestResponse | null) => {
      if (!response || !response.headers) return 'json'

      const contentType =
        (Object.entries(response.headers).find(
          ([key]) => key.toLowerCase() === 'content-type',
        )?.[1] as string) || ''

      if (contentType.includes('json')) return 'json'
      if (contentType.includes('xml')) return 'xml'
      if (contentType.includes('html')) return 'html'
      if (contentType.includes('text/plain')) return 'plaintext'
      if (contentType.includes('javascript')) return 'javascript'
      if (contentType.includes('css')) return 'css'

      return 'json' // 默认使用JSON高亮
    },
    [],
  )

  // 格式化响应数据
  const formatResponseData = useCallback((response: TestResponse | null) => {
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

  const formattedResponse = formatResponseData(testResponse)

  // 自动清除格式化提示
  useEffect(() => {
    if (formatMessage) {
      const timer = setTimeout(() => {
        setFormatMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [formatMessage])

  // 根据schema生成示例数据
  const generateExampleFromSchema = useCallback(
    function generateExampleFromSchema(
      schema: Schema | undefined,
      fieldName?: string,
    ): unknown {
      if (!schema) return null

      // 如果schema有直接的example，优先使用
      if (schema.example !== undefined) {
        return schema.example
      }

      // 如果是引用类型 ($ref)，解析引用
      if (schema.$ref && apiSpec) {
        const refPath = schema.$ref.replace('#/', '').split('/')
        let referencedSchema: unknown = apiSpec

        // 遍历路径找到引用的schema
        for (const pathSegment of refPath) {
          if (!isRecord(referencedSchema)) {
            referencedSchema = undefined
            break
          }
          referencedSchema = referencedSchema[pathSegment]
          if (!referencedSchema) break
        }

        // 如果找到了引用的schema，递归生成示例
        if (isRecord(referencedSchema)) {
          return generateExampleFromSchema(
            referencedSchema as Schema,
            fieldName,
          )
        }
      }

      // 根据数据类型生成示例
      switch (schema.type) {
        case 'object': {
          const obj: Record<string, unknown> = {}
          if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
              // 检查是否是必需字段或有默认值
              const isRequired = schema.required?.includes(key)
              const hasDefault = propSchema.default !== undefined

              if (isRequired || hasDefault) {
                // 优先使用默认值
                if (hasDefault) {
                  obj[key] = propSchema.default
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
            } else if (
              lowerFieldName.includes('title') ||
              lowerFieldName.includes('name')
            ) {
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
          return schema.minimum !== undefined
            ? schema.minimum
            : schema.default !== undefined
              ? schema.default
              : 1

        case 'boolean':
          return schema.default !== undefined ? schema.default : false

        default:
          return null
      }
    },
    [apiSpec],
  )

  // 主面板模式切换：接口详情 vs 测试面板
  const [mainMode, setMainMode] = useState<'interface' | 'test'>('interface')

  // 界面状态

  // 生成动态的placeholder文本
  const getBodyPlaceholder = useCallback(
    (type: BodyType) => {
      // 如果有选中的API，使用其生成的示例数据作为placeholder
      if (selectedAPI && selectedAPI.requestBody) {
        const jsonContent =
          selectedAPI.requestBody.content?.['application/json']
        if (jsonContent && type === 'json') {
          if (jsonContent.example) {
            return JSON.stringify(jsonContent.example, null, 2)
          } else if (jsonContent.schema) {
            const generatedExample = generateExampleFromSchema(
              jsonContent.schema,
            )
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
    },
    [selectedAPI, generateExampleFromSchema],
  )

  // 请求体格式验证函数
  const validateBodyContent = useCallback(
    (content: string, type: BodyType, api?: APIEndpoint) => {
      if (!content.trim()) {
        return { isValid: true, error: null }
      }

      // 检查用户选择的bodyType是否与API要求匹配
      if (api && api.requestBody) {
        const apiSupportedTypes = Object.keys(api.requestBody.content || {})
        const typeContentTypeMap: Record<BodyType, string> = {
          json: 'application/json',
          xml: 'application/xml',
          'form-data': 'multipart/form-data',
          'x-www-form-urlencoded': 'application/x-www-form-urlencoded',
          raw: 'text/plain',
          graphql: 'application/graphql',
          binary: 'application/octet-stream',
          msgpack: 'application/msgpack',
          none: '',
        }

        const selectedContentType = typeContentTypeMap[type]
        if (
          selectedContentType &&
          !apiSupportedTypes.includes(selectedContentType)
        ) {
          return {
            isValid: false,
            error: `请求体类型不匹配：API要求 ${apiSupportedTypes.join(' 或 ')}，但您选择了 ${selectedContentType}`,
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
            const hasGraphQLKeyword = /\b(query|mutation|subscription)\b/i.test(
              content,
            )
            if (!hasGraphQLKeyword) {
              return {
                isValid: false,
                error:
                  'GraphQL格式错误：缺少query、mutation或subscription关键字',
              }
            }
            return { isValid: true, error: null }
          }

          default:
            return { isValid: true, error: null }
        }
      } catch (error) {
        switch (type) {
          case 'json':
            return {
              isValid: false,
              error: 'JSON格式错误：' + (error as Error).message,
            }
          default:
            return {
              isValid: false,
              error: '格式错误：' + (error as Error).message,
            }
        }
      }
    },
    [],
  )

  // 请求体格式化函数
  const formatBodyContent = useCallback(
    (content: string, type: BodyType) => {
      if (!content.trim()) {
        // 如果有选中的API，使用其生成的示例数据
        if (selectedAPI && selectedAPI.requestBody) {
          const jsonContent =
            selectedAPI.requestBody.content?.['application/json']
          if (jsonContent) {
            if (jsonContent.example) {
              return JSON.stringify(jsonContent.example, null, 2)
            } else if (jsonContent.schema) {
              const generatedExample = generateExampleFromSchema(
                jsonContent.schema,
              )
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
              text: 'JSON 格式化成功',
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

                const indent = '  '.repeat(
                  Math.max(
                    0,
                    (trimmedLine.match(/^<[^/]/g) ? 1 : 0) -
                      (trimmedLine.match(/<\//g) || []).length,
                  ),
                )
                return indent + trimmedLine
              })
              .join('\n')
              .trim()
            setFormatMessage({
              type: 'success',
              text: 'XML 格式化成功',
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
              text: 'GraphQL 格式化成功',
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
          text: `格式化失败: ${error instanceof Error ? error.message : '无效的格式'}`,
        })
        return content
      }
    },
    [generateExampleFromSchema, selectedAPI, setFormatMessage],
  )

  // 压缩内容
  const minifyBodyContent = useCallback(
    (content: string, type: BodyType) => {
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
              text: 'JSON 压缩成功',
            })
            return minified
          }
          case 'xml': {
            const xmlMinified = content
              .replace(/>\s+</g, '><')
              .replace(/\s+/g, ' ')
              .trim()
            setFormatMessage({
              type: 'success',
              text: 'XML 压缩成功',
            })
            return xmlMinified
          }
          case 'graphql': {
            const graphqlMinified = content.replace(/\s+/g, ' ').trim()
            setFormatMessage({
              type: 'success',
              text: 'GraphQL 压缩成功',
            })
            return graphqlMinified
          }
          default: {
            const defaultMinified = content.replace(/\s+/g, ' ').trim()
            setFormatMessage({
              type: 'success',
              text: '内容压缩成功',
            })
            return defaultMinified
          }
        }
      } catch (error) {
        console.error('Minify error:', error)
        setFormatMessage({
          type: 'error',
          text: `压缩失败: ${error instanceof Error ? error.message : '无效的格式'}`,
        })
        return content
      }
    },
    [setFormatMessage],
  )

  // Form-data和URL-encoded行管理函数
  const addFormDataRow = useCallback(() => {
    const newRow: FormDataRow = {
      id: `form-data-${Date.now()}`,
      enabled: true,
      key: '',
      value: '',
      type: 'text',
    }
    setFormDataRows((prev) => [...prev, newRow])
  }, [])

  const updateFormDataRow = useCallback(
    <K extends keyof FormDataRow>(
      id: string,
      field: K,
      value: FormDataRow[K],
    ) => {
      setFormDataRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      )
    },
    [],
  )

  const removeFormDataRow = useCallback((id: string) => {
    setFormDataRows((prev) => prev.filter((row) => row.id !== id))
  }, [])

  const addUrlEncodedRow = useCallback(() => {
    const newId = `urlencoded-${Date.now()}`
    setUrlEncodedRows((prev) => [
      ...prev.slice(0, -1), // 移除最后一个空行
      {
        id: newId,
        enabled: true,
        key: '',
        value: '',
        type: 'string',
      },
      {
        // 添加新的空行
        id: `urlencoded-new`,
        enabled: false,
        key: '',
        value: '',
        type: 'string',
      },
    ])
  }, [])

  const updateUrlEncodedRow = useCallback(
    <K extends keyof UrlEncodedRow>(
      id: string,
      field: K,
      value: UrlEncodedRow[K],
    ) => {
      setUrlEncodedRows((prev) =>
        prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
      )
    },
    [],
  )

  const removeUrlEncodedRow = useCallback((id: string) => {
    setUrlEncodedRows((prev) => prev.filter((row) => row.id !== id))
  }, [])

  // 解析 $ref 引用的 schema，支持嵌套与数组
  const resolveSchemaRef = useCallback(
    (input: Schema | undefined): Schema | undefined => {
      if (!input) return input
      const seen = new Set<string>()
      const resolveOnce = (schema: Schema | undefined): Schema | undefined => {
        if (!schema) return schema
        if (schema.$ref && typeof schema.$ref === 'string') {
          const ref = schema.$ref as string
          if (seen.has(ref)) return schema
          seen.add(ref)
          const match = ref.match(/^#\/components\/schemas\/(.+)$/)
          const refName = match?.[1]
          const schemas = apiSpec?.components?.schemas as
            | Record<string, Schema | undefined>
            | undefined
          const target = refName && schemas ? schemas[refName] : undefined
          return target ? resolveOnce(target) : schema
        }
        if (schema.type === 'array' && schema.items) {
          return { ...schema, items: resolveOnce(schema.items) }
        }
        return schema
      }
      return resolveOnce(input)
    },
    [apiSpec],
  )

  const getSchemaType = useCallback(
    function getSchemaType(schema: Schema | undefined): string {
      const s = resolveSchemaRef(schema)
      if (!s) return 'unknown'
      if (s.type === 'array') {
        const itemType = getSchemaType(s.items)
        return `array<${itemType}>`
      }
      if (s.enum) return 'enum'
      if (s.type) return s.type
      if (s.$ref) return (s.$ref as string).split('/').pop() || 'object'
      return 'object'
    },
    [resolveSchemaRef],
  )

  const [previousAPI, setPreviousAPI] = useState(selectedAPI)
  if (previousAPI !== selectedAPI) {
    setPreviousAPI(selectedAPI)
    if (selectedAPI) initializeTestData(selectedAPI)
  }

  // 初始化分组收起状态
  const [previousGroups, setPreviousGroups] = useState<APIEndpoint[] | null>(
    null,
  )
  if (previousGroups !== apiEndpoints) {
    setPreviousGroups(apiEndpoints)
    if (apiEndpoints.length > 0) {
      const allTags = Array.from(
        new Set(
          apiEndpoints.flatMap((endpoint) => endpoint.tags || ['未分组']),
        ),
      )
      const defaultCollapsed: Record<string, boolean> = {}
      allTags.forEach((groupName, index) => {
        defaultCollapsed[groupName] = index > 0 // 只展开第一个分组
      })
      setCollapsedGroups(defaultCollapsed)
    }
  }

  function initializeTestData(api: APIEndpoint) {
    // 初始化参数表格
    const params: ParamRow[] =
      api.parameters?.map((param, index) => ({
        id: `param-${index}`,
        enabled: param.required || false,
        name: param.name,
        value: param.example ? String(param.example) : '',
        type: param.type || param.schema?.type || 'string',
        description: param.description,
        required: param.required,
        in: param.in,
      })) || []

    // 添加空行用于用户添加新参数
    params.push({
      id: `param-new`,
      enabled: false,
      name: '',
      value: '',
      type: 'string',
      description: '',
    })

    setTestParams(params)

    // 初始化Headers
    const headers: HeaderRow[] = [
      {
        id: 'header-content-type',
        enabled: !!api.requestBody,
        name: 'Content-Type',
        value: 'application/json',
        description: '请求体类型',
      },
      {
        id: 'header-auth',
        enabled: false,
        name: 'Authorization',
        value: 'Bearer YOUR_TOKEN',
        description: '认证头',
      },
      {
        id: 'header-new',
        enabled: false,
        name: '',
        value: '',
        description: '',
      },
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
            const generatedExample = generateExampleFromSchema(
              jsonContent.schema,
            )
            if (generatedExample) {
              exampleBody = JSON.stringify(generatedExample, null, 2)
            }
          }
        }
        // 如果没有 application/json，尝试其他 content type
        else {
          const firstContent = Object.values(content)[0]
          if (firstContent?.example) {
            exampleBody =
              typeof firstContent.example === 'string'
                ? firstContent.example
                : JSON.stringify(firstContent.example, null, 2)
          } else if (firstContent?.schema) {
            const generatedExample = generateExampleFromSchema(
              firstContent.schema,
            )
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

  // 将OpenAPI规范转换为内部API端点格式

  // 加载静态OpenAPI数据

  // 加载过滤的OpenAPI数据

  // 筛选API
  const filteredEndpoints = apiEndpoints.filter((endpoint) => {
    const matchesSearch =
      !searchQuery ||
      endpoint.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.tags?.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      )

    return matchesSearch
  })

  // 按标签分组（Apifox标准方式）
  const groupedEndpoints = filteredEndpoints.reduce(
    (groups, endpoint) => {
      const tags = endpoint.tags || ['未分组']
      tags.forEach((tag) => {
        if (!groups[tag]) {
          groups[tag] = []
        }
        groups[tag].push(endpoint)
      })
      return groups
    },
    {} as Record<string, APIEndpoint[]>,
  )

  // 处理参数表格更新
  const updateParamRow = <K extends keyof ParamRow>(
    id: string,
    field: K,
    value: ParamRow[K],
  ) => {
    setTestParams((prev) =>
      prev.map((param) =>
        param.id === id ? { ...param, [field]: value } : param,
      ),
    )
  }

  // 处理Header表格更新
  const updateHeaderRow = <K extends keyof HeaderRow>(
    id: string,
    field: K,
    value: HeaderRow[K],
  ) => {
    setTestHeaders((prev) =>
      prev.map((header) =>
        header.id === id ? { ...header, [field]: value } : header,
      ),
    )
  }

  // 添加新参数行
  const addParamRow = () => {
    const newId = `param-${Date.now()}`
    setTestParams((prev) => [
      ...prev.slice(0, -1), // 移除最后一个空行
      {
        id: newId,
        enabled: true,
        name: '',
        value: '',
        type: 'string',
        description: '',
      },
      {
        // 添加新的空行
        id: `param-new`,
        enabled: false,
        name: '',
        value: '',
        type: 'string',
        description: '',
      },
    ])
  }

  // 添加新Header行
  const addHeaderRow = () => {
    const newId = `header-${Date.now()}`
    setTestHeaders((prev) => [
      ...prev.slice(0, -1), // 移除最后一个空行
      {
        id: newId,
        enabled: true,
        name: '',
        value: '',
        description: '',
      },
      {
        // 添加新的空行
        id: `header-new`,
        enabled: false,
        name: '',
        value: '',
        description: '',
      },
    ])
  }

  // 删除参数行
  const removeParamRow = (id: string) => {
    setTestParams((prev) => prev.filter((param) => param.id !== id))
  }

  // 删除Header行
  const removeHeaderRow = (id: string) => {
    setTestHeaders((prev) => prev.filter((header) => header.id !== id))
  }

  // 切换分组收起状态
  const toggleGroup = (groupName: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }))
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-linear-to-br from-background-body via-background-default to-background-subtle">
        <Card className="w-full max-w-md space-y-4 border-components-glassmorphism-border bg-components-glassmorphism-bg p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-semibold text-text-primary">
              正在加载 API 文档
            </h3>
            <p className="mb-4 text-sm text-text-secondary">
              从{loadingSource === 'static' ? '静态文件' : '动态接口'}
              获取API规范...
            </p>
            <RefreshCw
              className="mx-auto h-5 w-5 animate-spin text-text-accent"
              aria-hidden
            />
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="@container/api h-full min-h-0 overflow-auto bg-background">
      <div className="flex min-h-full min-w-0 flex-col bg-background @3xl/api:h-full @3xl/api:min-h-0 @3xl/api:flex-row">
        {/* 左侧导航 - API列表 */}
        <div className="flex h-72 min-h-0 w-full shrink-0 flex-col border-b bg-background @3xl/api:h-auto @3xl/api:w-80 @3xl/api:border-r @3xl/api:border-b-0">
          <div className="shrink-0 space-y-4 p-4">
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-text-primary">
                {t('settings.api.documentation')}
              </h2>

              {/* 元信息和操作区 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="px-2.5 py-1 text-xs font-medium"
                  >
                    v1.0.0
                  </Badge>
                  {loadingSource && (
                    <Badge
                      variant={
                        loadingSource === 'dynamic' ? 'default' : 'secondary'
                      }
                      className="px-2.5 py-1 text-xs font-medium"
                    >
                      {loadingSource === 'dynamic'
                        ? '🔄 实时数据'
                        : '📁 本地缓存'}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadAPIData(true)}
                  disabled={isLoading}
                  className="gap-2 transition-all duration-200 hover:border-primary/20 hover:bg-primary/5"
                  aria-label={t('settings.api.refreshDocumentation')}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  {isLoading ? t('common.loading') : t('common.refresh')}
                </Button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="搜索 API 接口..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 功能说明卡片 */}
            <div className="relative hidden overflow-hidden rounded-xl border bg-linear-to-r from-muted/40 via-muted/30 to-background p-4 @3xl/api:block">
              <div className="relative z-10">
                <div className="mb-2 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    功能特性
                  </span>
                </div>
                <div className="space-y-1 text-sm leading-relaxed text-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>完整的API接口文档浏览</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Play className="h-4 w-4 text-muted-foreground" />
                    <span>在线接口调试（尚未开放）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span>API密钥管理与权限控制</span>
                  </div>
                </div>
              </div>
              {/* 装饰性背景 */}
              <div className="absolute top-0 right-0 h-16 w-16 translate-x-8 -translate-y-8 rounded-full bg-linear-to-br from-blue-500/5 to-purple-500/5"></div>
            </div>

            {/* 错误提示 */}
            {loadingError && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                <p className="flex items-center gap-2 text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{loadingError}</span>
                </p>
              </div>
            )}

            {/* 统计信息 */}
            <div className="hidden grid-cols-2 gap-3 @3xl/api:grid">
              <div className="group relative overflow-hidden rounded-lg border bg-linear-to-br from-background to-muted/20 p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-md">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    接口总数
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {apiEndpoints.length}
                </div>
                <div className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-blue-500/5"></div>
              </div>
              <div className="group relative overflow-hidden rounded-lg border bg-linear-to-br from-background to-muted/20 p-3 transition-all duration-200 hover:border-primary/20 hover:shadow-md">
                <div className="mb-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    分组数量
                  </span>
                </div>
                <div className="text-xl font-bold text-foreground">
                  {Object.keys(groupedEndpoints).length}
                </div>
                <div className="absolute -right-1 -bottom-1 h-8 w-8 rounded-full bg-purple-500/5"></div>
              </div>
            </div>
          </div>

          <div className="api-keys-scrollbar min-h-0 flex-1 overflow-auto">
            <div className="space-y-4 px-4 pb-4">
              {Object.entries(groupedEndpoints).map(([tag, endpoints]) => {
                const IconComponent =
                  tagIcons[tag as keyof typeof tagIcons] || Globe
                const isCollapsed = collapsedGroups[tag]

                // 格式化显示名称
                const getDisplayName = (tagName: string) => {
                  const tagDisplayNames: Record<string, string> = {
                    chat: '聊天',
                    session: '会话',
                    files: '文件',
                    dataset: '数据集',
                    document: '文档',
                    agent: '智能体',
                    // 保持原有的显示名称
                    用户管理: '用户管理',
                    订单管理: '订单管理',
                    认证授权: '认证授权',
                    系统配置: '系统配置',
                    文件管理: '文件管理',
                    通知服务: '通知服务',
                    支付管理: '支付管理',
                    数据分析: '数据分析',
                    消息推送: '消息推送',
                  }

                  return tagDisplayNames[tagName] || tagName
                }

                return (
                  <Collapsible
                    key={tag}
                    open={!isCollapsed}
                    onOpenChange={() => toggleGroup(tag)}
                  >
                    <CollapsibleTrigger className="group flex w-full items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                          {getDisplayName(tag)}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {endpoints.length}
                        </Badge>
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-foreground" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 space-y-1">
                      {endpoints.map((api) => (
                        <button
                          key={api.id}
                          onClick={() => setSelectedAPI(api)}
                          className={`w-full rounded-lg border-2 border-transparent p-3 text-left transition-colors duration-150 hover:bg-muted/50 ${
                            selectedAPI?.id === api.id
                              ? 'border-primary/20 bg-primary/5 shadow-xs'
                              : 'hover:border-muted'
                          }`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <MethodBadge method={api.method} size="sm" />
                              {/* 显示路径的关键部分 */}
                              <Tooltip
                                content={api.path}
                                position="top"
                                maxWidth="max-w-md"
                              >
                                <span className="cursor-help truncate font-mono text-xs text-muted-foreground">
                                  /
                                  {api.path
                                    .split('/')
                                    .filter((p) => p)
                                    .slice(-2)
                                    .join('/')}
                                </span>
                              </Tooltip>
                            </div>
                            {api.deprecated && (
                              <Badge
                                variant="destructive"
                                className="shrink-0 text-xs"
                              >
                                已弃用
                              </Badge>
                            )}
                          </div>
                          <div className="mb-1 text-sm leading-relaxed font-medium">
                            {api.summary}
                          </div>
                          {api.description && (
                            <div className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
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
        <div className="flex h-[32rem] min-h-0 min-w-0 shrink-0 grow flex-col @3xl/api:h-auto @3xl/api:flex-1">
          <div className="min-h-0 flex-1 overflow-hidden">
            {selectedAPI ? (
              <div className="flex h-full flex-col">
                {/* 顶部模式切换标签 */}
                <div className="flex shrink-0 flex-wrap items-center gap-3 border-b bg-linear-to-r from-background to-muted/20 px-4 py-3 lg:px-6">
                  <Tabs
                    value={mainMode}
                    onValueChange={(value) => {
                      if (
                        value === 'interface' ||
                        apiKeysCapabilities.liveRequest.enabled
                      ) {
                        setMainMode(value as 'interface' | 'test')
                      }
                    }}
                  >
                    <TabsList className="h-10">
                      <TabsTrigger value="interface" className="gap-2 px-4">
                        <FileText className="h-4 w-4" />
                        接口
                      </TabsTrigger>
                      <TabsTrigger
                        value="test"
                        className="gap-2 px-4"
                        disabled={!apiKeysCapabilities.liveRequest.enabled}
                      >
                        <Play className="h-4 w-4" />
                        运行（未开放）
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="ml-auto flex min-w-0 flex-wrap items-center gap-3">
                    <ApiKeyManagerDialog />

                    {/* 现代化环境选择器 */}
                    <div className="flex items-center gap-3">
                      <ModernEnvironmentSelector
                        onEnvironmentChange={(id) => {
                          if (id) {
                            selectEnvironment(id)
                          }
                        }}
                        onManageClick={() => setShowEnvironmentManager(true)}
                      />

                      {/* 环境管理图标按钮 */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEnvironmentManager(true)}
                        className="h-10 w-10 p-0"
                        title="管理环境"
                      >
                        <Settings2 className="h-4 w-4" />
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
                <div className="min-h-0 flex-1 overflow-auto">
                  {mainMode === 'interface' ? (
                    /* 接口详情模式 - 全宽度 */
                    <div className="p-6">
                      <div className="mx-auto max-w-6xl space-y-6">
                        {/* API 头部信息 */}
                        <div className="mb-8">
                          <div className="mb-4 flex flex-wrap items-center gap-3">
                            <MethodBadge method={selectedAPI.method} />
                            <code className="min-w-0 rounded-lg border bg-muted px-4 py-2 font-mono text-sm break-all lg:text-lg">
                              {getFullApiUrl(selectedAPI.path)}
                            </code>
                            {selectedAPI.deprecated && (
                              <Badge variant="destructive">已弃用</Badge>
                            )}
                          </div>
                          <h2 className="mb-3 text-3xl font-semibold">
                            {selectedAPI.summary}
                          </h2>
                          {selectedAPI.description && (
                            <div className="text-base leading-relaxed text-muted-foreground">
                              <MarkdownRenderer
                                content={selectedAPI.description}
                                className="prose-lg [&_blockquote]:rounded-r [&_blockquote]:bg-muted/30 [&_blockquote]:py-2 [&_code]:bg-muted/80 [&_code]:px-2 [&_code]:py-1 [&_code]:text-sm [&_code]:text-foreground [&_li]:text-sm [&_ol]:ml-4 [&_p]:mb-3 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:ml-4"
                              />
                            </div>
                          )}
                        </div>

                        <Tabs defaultValue="parameters" className="space-y-6">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="parameters">
                              参数说明
                            </TabsTrigger>
                            <TabsTrigger value="responses">
                              响应说明
                            </TabsTrigger>
                            <TabsTrigger value="examples">代码示例</TabsTrigger>
                          </TabsList>

                          <TabsContent value="parameters" className="space-y-6">
                            {selectedAPI.parameters &&
                              selectedAPI.parameters.length > 0 && (
                                <Card>
                                  <CardHeader>
                                    <CardTitle>请求参数</CardTitle>
                                    <CardDescription>
                                      该接口支持的请求参数列表
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    {/* 表格形式展示参数 */}
                                    <div className="rounded-lg border">
                                      <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 p-4 text-sm font-medium">
                                        <div>参数名</div>
                                        <div>位置</div>
                                        <div>类型</div>
                                        <div>说明</div>
                                      </div>
                                      <div className="divide-y">
                                        {selectedAPI.parameters.map(
                                          (param, index) => (
                                            <div
                                              key={index}
                                              className="grid grid-cols-4 gap-4 p-4 hover:bg-muted/20"
                                            >
                                              <div>
                                                <div className="flex items-center gap-2">
                                                  <code className="font-mono font-medium text-purple-600 dark:text-purple-400">
                                                    {param.name}
                                                  </code>
                                                  {param.required && (
                                                    <span className="text-xs text-red-500">
                                                      *
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs"
                                                >
                                                  {param.in}
                                                </Badge>
                                              </div>
                                              <div>
                                                <Badge
                                                  variant="secondary"
                                                  className="text-xs"
                                                >
                                                  {param.type || 'string'}
                                                </Badge>
                                              </div>
                                              <div className="space-y-2">
                                                <div className="text-sm text-muted-foreground">
                                                  <MarkdownRenderer
                                                    content={param.description}
                                                    className="prose-xs [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_p]:mb-1 [&_p]:text-sm [&_p]:text-muted-foreground [&_strong]:font-medium"
                                                  />
                                                </div>
                                                {param.example !==
                                                  undefined && (
                                                  <code className="mt-1 block rounded bg-muted px-2 py-1 text-xs">
                                                    示例:{' '}
                                                    {JSON.stringify(
                                                      param.example,
                                                    )}
                                                  </code>
                                                )}
                                              </div>
                                            </div>
                                          ),
                                        )}
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
                                    <CardDescription>
                                      {selectedAPI.requestBody.description}
                                    </CardDescription>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  {Object.entries(
                                    selectedAPI.requestBody.content,
                                  ).map(([mime, content]) => {
                                    const rawSchema = content.schema
                                    const schema = resolveSchemaRef(rawSchema)
                                    const example =
                                      content.example || schema?.example
                                    const properties =
                                      (schema?.type === 'object'
                                        ? schema?.properties
                                        : {}) || {}
                                    const requiredProps: string[] =
                                      schema?.required || []
                                    return (
                                      <div key={mime} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm">
                                            内容类型
                                          </span>
                                          <code className="rounded border bg-muted px-2 py-1 text-xs">
                                            {mime}
                                          </code>
                                          {selectedAPI.requestBody
                                            ?.required && (
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              必填
                                            </Badge>
                                          )}
                                        </div>

                                        {schema?.type === 'array' && (
                                          <div className="text-sm text-muted-foreground">
                                            数组元素类型:{' '}
                                            <code className="font-mono">
                                              {getSchemaType(schema.items)}
                                            </code>
                                          </div>
                                        )}

                                        {schema?.type === 'object' &&
                                          Object.keys(properties).length >
                                            0 && (
                                            <div className="rounded-lg border">
                                              <div className="grid grid-cols-4 gap-4 border-b bg-muted/50 p-3 text-sm font-medium">
                                                <div>字段名</div>
                                                <div>类型</div>
                                                <div>必填</div>
                                                <div>说明</div>
                                              </div>
                                              <div className="divide-y">
                                                {Object.entries(properties).map(
                                                  ([name, propSchema]) => {
                                                    const resolved =
                                                      resolveSchemaRef(
                                                        propSchema,
                                                      )
                                                    const type =
                                                      getSchemaType(resolved)
                                                    return (
                                                      <div
                                                        key={name}
                                                        className="grid grid-cols-4 items-start gap-4 p-3"
                                                      >
                                                        <code className="font-mono text-purple-600 dark:text-purple-400">
                                                          {name}
                                                        </code>
                                                        <Badge
                                                          variant="secondary"
                                                          className="text-xs"
                                                        >
                                                          {type}
                                                        </Badge>
                                                        <div className="text-xs">
                                                          {requiredProps.includes(
                                                            name,
                                                          )
                                                            ? '是'
                                                            : '否'}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                          {resolved?.description ||
                                                            ''}
                                                        </div>
                                                      </div>
                                                    )
                                                  },
                                                )}
                                              </div>
                                            </div>
                                          )}

                                        {example !== undefined &&
                                          example !== null && (
                                            <div className="rounded border bg-muted/30">
                                              <div className="p-3">
                                                <div className="mb-2 text-sm font-medium">
                                                  示例
                                                </div>
                                                <pre className="overflow-x-auto text-xs">
                                                  <code>
                                                    {JSON.stringify(
                                                      example,
                                                      null,
                                                      2,
                                                    )}
                                                  </code>
                                                </pre>
                                              </div>
                                            </div>
                                          )}
                                      </div>
                                    )
                                  })}
                                </CardContent>
                              </Card>
                            )}

                            {!(
                              (selectedAPI.parameters &&
                                selectedAPI.parameters.length > 0) ||
                              selectedAPI.requestBody
                            ) && (
                              <Card>
                                <CardContent className="flex h-32 items-center justify-center">
                                  <p className="text-muted-foreground">
                                    该接口无需参数
                                  </p>
                                </CardContent>
                              </Card>
                            )}
                          </TabsContent>

                          <TabsContent value="responses" className="space-y-6">
                            <Card>
                              <CardHeader>
                                <CardTitle>响应说明</CardTitle>
                                <CardDescription>
                                  接口可能返回的响应状态码和数据结构
                                </CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-4">
                                  {selectedAPI.responses?.map(
                                    (response, index) => (
                                      <div
                                        key={index}
                                        className="rounded-lg border p-4"
                                      >
                                        <div className="mb-2 flex items-center justify-between">
                                          <Badge
                                            variant={
                                              response.status < 300
                                                ? 'default'
                                                : 'destructive'
                                            }
                                          >
                                            {response.status}
                                          </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                          {response.description}
                                        </p>
                                      </div>
                                    ),
                                  )}
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
                                <div className="rounded-lg bg-muted p-4">
                                  <pre className="overflow-x-auto text-sm">
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
                    <div className="flex h-full flex-col">
                      {/* 顶部：API 地址栏 */}
                      <div className="shrink-0 border-b bg-linear-to-r from-background to-muted/20 px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 items-center">
                            <MethodBadge method={selectedAPI.method} />
                          </div>
                          <div className="flex h-10 flex-1 items-center rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm">
                            {getFullApiUrl(selectedAPI.path)}
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              disabled={
                                !apiKeysCapabilities.liveRequest.enabled
                              }
                              className="h-10 shadow-lg transition-colors duration-150 hover:shadow-xl"
                              variant="default"
                              size="default"
                              title={apiKeysCapabilities.liveRequest.reason}
                            >
                              在线调试未开放
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              className="h-10 px-3"
                              disabled={!apiKeysCapabilities.saveCase.enabled}
                              title={apiKeysCapabilities.saveCase.reason}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="default"
                              className="h-10 px-3"
                              disabled={
                                !apiKeysCapabilities.saveEnvironment.enabled
                              }
                              title={apiKeysCapabilities.saveEnvironment.reason}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 主体：参数配置和响应区域 */}
                      <div className="flex flex-1">
                        {/* 左侧：参数配置区域 */}
                        <div className="flex flex-1 flex-col border-r">
                          <div className="flex h-full flex-col">
                            <div className="border-b bg-linear-to-r from-muted/20 to-muted/40 px-6 py-3">
                              <Tabs
                                value={activeTestTab}
                                onValueChange={setActiveTestTab}
                              >
                                <TabsList className="h-9">
                                  <TabsTrigger
                                    value="params"
                                    className="gap-2 px-3"
                                  >
                                    <span>Params</span>
                                    {testParams.filter(
                                      (p) => p.enabled && p.name,
                                    ).length > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="flex h-4 items-center justify-center px-1.5 text-[10px]"
                                      >
                                        {
                                          testParams.filter(
                                            (p) => p.enabled && p.name,
                                          ).length
                                        }
                                      </Badge>
                                    )}
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="body"
                                    className="gap-2 px-3"
                                  >
                                    <span>Body</span>
                                    {testBody && testBody.trim() && (
                                      <Badge
                                        variant="secondary"
                                        className="flex h-4 items-center justify-center px-1.5 text-[10px]"
                                      >
                                        1
                                      </Badge>
                                    )}
                                  </TabsTrigger>
                                  <TabsTrigger
                                    value="headers"
                                    className="gap-2 px-3"
                                  >
                                    <span>Headers</span>
                                    {testHeaders.filter(
                                      (h) => h.enabled && h.name,
                                    ).length > 0 && (
                                      <Badge
                                        variant="secondary"
                                        className="flex h-4 items-center justify-center px-1.5 text-[10px]"
                                      >
                                        {
                                          testHeaders.filter(
                                            (h) => h.enabled && h.name,
                                          ).length
                                        }
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
                                <div className="m-0 h-full space-y-6 p-6">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                                        Query 参数
                                        {testParams.filter(
                                          (p) => p.enabled && p.name,
                                        ).length > 0 && (
                                          <Badge
                                            variant="secondary"
                                            className="h-5 px-2 text-xs"
                                          >
                                            {
                                              testParams.filter(
                                                (p) => p.enabled && p.name,
                                              ).length
                                            }{' '}
                                            个参数
                                          </Badge>
                                        )}
                                      </h3>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        配置API请求的Query参数
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={addParamRow}
                                      className="gap-2 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                    >
                                      <Plus className="h-4 w-4" />
                                      添加参数
                                    </Button>
                                  </div>

                                  {/* 参数表格 - 精美设计 */}
                                  <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
                                    <div className="border-b bg-linear-to-r from-muted/40 to-muted/60">
                                      <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-foreground">
                                        <div className="col-span-1 text-center">
                                          ✓
                                        </div>
                                        <div className="col-span-3">参数名</div>
                                        <div className="col-span-4">参数值</div>
                                        <div className="col-span-2">类型</div>
                                        <div className="col-span-2 text-center">
                                          操作
                                        </div>
                                      </div>
                                    </div>
                                    <div className="max-h-96 divide-y overflow-auto">
                                      {testParams.map((param) => (
                                        <div
                                          key={param.id}
                                          className="group grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-blue-50/50 dark:hover:bg-blue-950/20"
                                        >
                                          <div className="col-span-1 flex justify-center">
                                            <Switch
                                              checked={param.enabled}
                                              onCheckedChange={(checked) =>
                                                updateParamRow(
                                                  param.id,
                                                  'enabled',
                                                  checked,
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Input
                                              placeholder="参数名"
                                              value={param.name}
                                              onChange={(e) =>
                                                updateParamRow(
                                                  param.id,
                                                  'name',
                                                  e.target.value,
                                                )
                                              }
                                              className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background"
                                              onBlur={() => {
                                                if (
                                                  param.id === 'param-new' &&
                                                  param.name
                                                ) {
                                                  addParamRow()
                                                }
                                              }}
                                            />
                                          </div>
                                          <div className="col-span-4">
                                            <Input
                                              placeholder="参数值"
                                              value={param.value}
                                              onChange={(e) =>
                                                updateParamRow(
                                                  param.id,
                                                  'value',
                                                  e.target.value,
                                                )
                                              }
                                              className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background"
                                            />
                                          </div>
                                          <div className="col-span-2">
                                            <Select
                                              value={param.type}
                                              onValueChange={(value) =>
                                                updateParamRow(
                                                  param.id,
                                                  'type',
                                                  value,
                                                )
                                              }
                                            >
                                              <SelectTrigger className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="string">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                    string
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="integer">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                                    integer
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="number">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                    number
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="boolean">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                                                    boolean
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="file">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-red-500" />
                                                    file
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="array">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                    array
                                                  </div>
                                                </SelectItem>
                                                <SelectItem value="object">
                                                  <div className="flex items-center gap-2">
                                                    <div className="h-2 w-2 rounded-full bg-pink-500" />
                                                    object
                                                  </div>
                                                </SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="col-span-2 flex justify-center">
                                            {param.id !== 'param-new' &&
                                              param.name && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    removeParamRow(param.id)
                                                  }
                                                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                                                >
                                                  <Minus className="h-4 w-4" />
                                                </Button>
                                              )}
                                          </div>
                                          {param.description && (
                                            <div className="col-span-12 -mx-1 mt-2 rounded-md bg-blue-50/50 py-2 pl-4 dark:bg-blue-950/20">
                                              <div className="flex items-start gap-2">
                                                <Lightbulb className="mt-0.5 h-4 w-4 text-blue-500" />
                                                <div className="flex-1 text-sm">
                                                  <MarkdownRenderer
                                                    content={param.description}
                                                    className="prose-xs [&_code]:bg-blue-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:dark:bg-blue-900 [&_p]:mb-1 [&_p]:text-sm [&_p]:text-blue-700 [&_p]:dark:text-blue-300 [&_strong]:font-medium"
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
                                <div className="m-0 flex h-full flex-col p-6">
                                  <div className="mb-6 flex items-center justify-between">
                                    <div>
                                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                                        请求体
                                        {(() => {
                                          const validation =
                                            validateBodyContent(
                                              testBody,
                                              bodyType,
                                              selectedAPI,
                                            )
                                          if (!validation.isValid) {
                                            return (
                                              <Tooltip
                                                content={
                                                  validation.error || '格式错误'
                                                }
                                                position="top"
                                                maxWidth="max-w-sm"
                                              >
                                                <div className="h-2 w-2 animate-pulse cursor-help rounded-full bg-red-500"></div>
                                              </Tooltip>
                                            )
                                          } else if (testBody.trim()) {
                                            return (
                                              <Tooltip
                                                content="格式正确"
                                                position="top"
                                                maxWidth="max-w-sm"
                                              >
                                                <div className="h-2 w-2 cursor-help rounded-full bg-green-500"></div>
                                              </Tooltip>
                                            )
                                          }
                                          return null
                                        })()}
                                      </h3>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        配置API请求的数据体
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {(bodyType === 'json' ||
                                        bodyType === 'xml' ||
                                        bodyType === 'graphql') && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setTestBody(
                                                formatBodyContent(
                                                  testBody,
                                                  bodyType,
                                                ),
                                              )
                                            }
                                            className="hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                                          >
                                            格式化
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setTestBody(
                                                minifyBodyContent(
                                                  testBody,
                                                  bodyType,
                                                ),
                                              )
                                            }
                                            className="hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                                          >
                                            压缩
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              setEditorTheme((prev) =>
                                                prev === 'vs'
                                                  ? 'vs-dark'
                                                  : 'vs',
                                              )
                                            }
                                            className="hover:border-border-default hover:bg-background-subtle"
                                            title="切换编辑器主题"
                                          >
                                            {editorTheme === 'vs' ? '🌙' : '☀️'}
                                          </Button>
                                        </>
                                      )}
                                      {formatMessage && (
                                        <div
                                          className={cn(
                                            'rounded-md px-3 py-1 text-xs font-medium transition-all duration-300',
                                            formatMessage.type === 'success'
                                              ? 'border border-green-200 bg-green-50 text-green-700'
                                              : 'border border-red-200 bg-red-50 text-red-700',
                                          )}
                                        >
                                          {formatMessage.text}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 请求体类型选择器 */}
                                  <div className="mb-4">
                                    <div className="flex flex-wrap gap-2">
                                      {[
                                        {
                                          key: 'none',
                                          label: 'None',
                                          desc: '无请求体',
                                        },
                                        {
                                          key: 'form-data',
                                          label: 'form-data',
                                          desc: '表单数据（支持文件）',
                                        },
                                        {
                                          key: 'x-www-form-urlencoded',
                                          label: 'x-www-form-urlencoded',
                                          desc: 'URL编码表单',
                                        },
                                        {
                                          key: 'json',
                                          label: 'JSON',
                                          desc: 'JSON格式数据',
                                        },
                                        {
                                          key: 'xml',
                                          label: 'XML',
                                          desc: 'XML格式数据',
                                        },
                                        {
                                          key: 'raw',
                                          label: 'Raw',
                                          desc: '原始文本数据',
                                        },
                                        {
                                          key: 'binary',
                                          label: 'Binary',
                                          desc: '二进制文件',
                                        },
                                        {
                                          key: 'graphql',
                                          label: 'GraphQL',
                                          desc: 'GraphQL查询',
                                        },
                                        {
                                          key: 'msgpack',
                                          label: 'MessagePack',
                                          desc: 'MessagePack格式',
                                        },
                                      ].map((type) => (
                                        <Button
                                          key={type.key}
                                          variant={
                                            bodyType === type.key
                                              ? 'default'
                                              : 'outline'
                                          }
                                          size="sm"
                                          onClick={() =>
                                            setBodyType(type.key as BodyType)
                                          }
                                          className={cn(
                                            'transition-all duration-200',
                                            bodyType === type.key
                                              ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                                              : 'hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
                                          )}
                                          title={type.desc}
                                        >
                                          {type.label}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 请求体内容区域 */}
                                  <div className="flex flex-1 flex-col overflow-hidden rounded-lg border">
                                    {bodyType === 'none' && (
                                      <div className="flex flex-1 items-center justify-center p-12 text-center">
                                        <div className="text-muted-foreground">
                                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                                            <Minus className="h-8 w-8" />
                                          </div>
                                          <p className="text-sm">
                                            此请求无需请求体
                                          </p>
                                        </div>
                                      </div>
                                    )}

                                    {bodyType === 'form-data' && (
                                      <div className="flex flex-1 flex-col">
                                        <div className="flex items-center justify-between border-b bg-muted/50 p-3">
                                          <span className="text-sm font-medium">
                                            multipart/form-data
                                          </span>
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
                                          <div className="space-y-3 p-4">
                                            {formDataRows.map((row) => (
                                              <div
                                                key={row.id}
                                                className="flex items-center gap-3 rounded-md bg-muted/30 p-3"
                                              >
                                                <Switch
                                                  checked={row.enabled}
                                                  onCheckedChange={(checked) =>
                                                    updateFormDataRow(
                                                      row.id,
                                                      'enabled',
                                                      checked,
                                                    )
                                                  }
                                                />
                                                <Input
                                                  placeholder="Key"
                                                  value={row.key}
                                                  onChange={(e) =>
                                                    updateFormDataRow(
                                                      row.id,
                                                      'key',
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="flex-1"
                                                />
                                                <Select
                                                  value={row.type}
                                                  onValueChange={(value) =>
                                                    updateFormDataRow(
                                                      row.id,
                                                      'type',
                                                      value as FormDataRow['type'],
                                                    )
                                                  }
                                                >
                                                  <SelectTrigger className="w-20">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="text">
                                                      Text
                                                    </SelectItem>
                                                    <SelectItem value="file">
                                                      File
                                                    </SelectItem>
                                                  </SelectContent>
                                                </Select>
                                                {row.type === 'text' ? (
                                                  <Input
                                                    placeholder="Value"
                                                    value={row.value}
                                                    onChange={(e) =>
                                                      updateFormDataRow(
                                                        row.id,
                                                        'value',
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="flex-1"
                                                  />
                                                ) : (
                                                  <div className="flex-1">
                                                    <Input
                                                      id={`form-data-file-${row.id}`}
                                                      type="file"
                                                      className="sr-only"
                                                      onChange={(e) => {
                                                        const file =
                                                          e.target.files?.[0]
                                                        if (file)
                                                          updateFormDataRow(
                                                            row.id,
                                                            'value',
                                                            file.name,
                                                          )
                                                      }}
                                                    />
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      type="button"
                                                      onClick={() =>
                                                        document
                                                          .getElementById(
                                                            `form-data-file-${row.id}`,
                                                          )
                                                          ?.click()
                                                      }
                                                    >
                                                      选择文件...
                                                    </Button>
                                                  </div>
                                                )}
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    removeFormDataRow(row.id)
                                                  }
                                                  className="text-red-500 hover:bg-red-50 hover:text-red-700"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ))}
                                            {formDataRows.length === 0 && (
                                              <div className="py-8 text-center text-muted-foreground">
                                                <p className="text-sm">
                                                  暂无表单数据
                                                </p>
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
                                      <div className="flex flex-1 flex-col">
                                        <div className="flex items-center justify-between border-b bg-muted/50 p-3">
                                          <span className="text-sm font-medium">
                                            application/x-www-form-urlencoded
                                          </span>
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
                                              <div className="grid grid-cols-12 gap-4 border-b border-border/60 pb-3 text-sm font-medium text-muted-foreground">
                                                <div className="col-span-1 text-center">
                                                  启用
                                                </div>
                                                <div className="col-span-3">
                                                  参数名
                                                </div>
                                                <div className="col-span-4">
                                                  参数值
                                                </div>
                                                <div className="col-span-2">
                                                  类型
                                                </div>
                                                <div className="col-span-2 text-center">
                                                  操作
                                                </div>
                                              </div>

                                              {/* 参数行 */}
                                              <div className="mt-4 space-y-2">
                                                {urlEncodedRows.map((row) => (
                                                  <div
                                                    key={row.id}
                                                    className="group -mx-2 grid grid-cols-12 items-center gap-4 rounded-md px-2 py-2 transition-colors hover:bg-muted/30"
                                                  >
                                                    <div className="col-span-1 flex justify-center">
                                                      <Switch
                                                        checked={row.enabled}
                                                        onCheckedChange={(
                                                          checked,
                                                        ) =>
                                                          updateUrlEncodedRow(
                                                            row.id,
                                                            'enabled',
                                                            checked,
                                                          )
                                                        }
                                                      />
                                                    </div>
                                                    <div className="col-span-3">
                                                      <Input
                                                        placeholder="参数名"
                                                        value={row.key}
                                                        onChange={(e) =>
                                                          updateUrlEncodedRow(
                                                            row.id,
                                                            'key',
                                                            e.target.value,
                                                          )
                                                        }
                                                        className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background"
                                                        onBlur={() => {
                                                          if (
                                                            row.id ===
                                                              'urlencoded-new' &&
                                                            row.key
                                                          ) {
                                                            addUrlEncodedRow()
                                                          }
                                                        }}
                                                      />
                                                    </div>
                                                    <div className="col-span-4">
                                                      <Input
                                                        placeholder="参数值"
                                                        value={row.value}
                                                        onChange={(e) =>
                                                          updateUrlEncodedRow(
                                                            row.id,
                                                            'value',
                                                            e.target.value,
                                                          )
                                                        }
                                                        className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background"
                                                      />
                                                    </div>
                                                    <div className="col-span-2">
                                                      <Select
                                                        value={row.type}
                                                        onValueChange={(
                                                          value,
                                                        ) =>
                                                          updateUrlEncodedRow(
                                                            row.id,
                                                            'type',
                                                            value as UrlEncodedRow['type'],
                                                          )
                                                        }
                                                      >
                                                        <SelectTrigger className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background">
                                                          <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          <SelectItem value="string">
                                                            <div className="flex items-center gap-2">
                                                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                              string
                                                            </div>
                                                          </SelectItem>
                                                          <SelectItem value="integer">
                                                            <div className="flex items-center gap-2">
                                                              <div className="h-2 w-2 rounded-full bg-green-500" />
                                                              integer
                                                            </div>
                                                          </SelectItem>
                                                          <SelectItem value="number">
                                                            <div className="flex items-center gap-2">
                                                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                              number
                                                            </div>
                                                          </SelectItem>
                                                          <SelectItem value="boolean">
                                                            <div className="flex items-center gap-2">
                                                              <div className="h-2 w-2 rounded-full bg-purple-500" />
                                                              boolean
                                                            </div>
                                                          </SelectItem>
                                                          <SelectItem value="file">
                                                            <div className="flex items-center gap-2">
                                                              <div className="h-2 w-2 rounded-full bg-red-500" />
                                                              file
                                                            </div>
                                                          </SelectItem>
                                                          <SelectItem value="array">
                                                            <div className="flex items-center gap-2">
                                                              <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                                              array
                                                            </div>
                                                          </SelectItem>
                                                          <SelectItem value="object">
                                                            <div className="flex items-center gap-2">
                                                              <div className="h-2 w-2 rounded-full bg-pink-500" />
                                                              object
                                                            </div>
                                                          </SelectItem>
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                    <div className="col-span-2 flex justify-center">
                                                      {row.id !==
                                                        'urlencoded-new' &&
                                                        row.key && (
                                                          <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                              removeUrlEncodedRow(
                                                                row.id,
                                                              )
                                                            }
                                                            className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
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
                                            <div className="flex flex-1 items-center justify-center">
                                              <div className="text-center text-muted-foreground">
                                                <Database className="mx-auto mb-4 h-12 w-12 opacity-30" />
                                                <p className="mb-2 text-sm">
                                                  暂无URL编码数据
                                                </p>
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

                                    {(bodyType === 'json' ||
                                      bodyType === 'xml' ||
                                      bodyType === 'raw' ||
                                      bodyType === 'graphql' ||
                                      bodyType === 'msgpack') && (
                                      <div className="flex flex-1 flex-col">
                                        <div className="flex items-center justify-between border-b bg-muted/50 p-3">
                                          <span className="text-sm font-medium">
                                            {bodyType === 'json' &&
                                              'application/json'}
                                            {bodyType === 'xml' &&
                                              'application/xml'}
                                            {bodyType === 'raw' && 'text/plain'}
                                            {bodyType === 'graphql' &&
                                              'application/graphql'}
                                            {bodyType === 'msgpack' &&
                                              'application/msgpack'}
                                          </span>
                                        </div>
                                        <div className="relative flex-1">
                                          <CodeEditor
                                            value={testBody}
                                            onChange={setTestBody}
                                            language={
                                              bodyType === 'json'
                                                ? 'json'
                                                : bodyType === 'xml'
                                                  ? 'xml'
                                                  : bodyType === 'graphql'
                                                    ? 'graphql'
                                                    : bodyType === 'msgpack'
                                                      ? 'json' // MessagePack显示为JSON格式
                                                      : bodyType === 'raw'
                                                        ? 'plaintext'
                                                        : 'plaintext'
                                            }
                                            placeholder={getBodyPlaceholder(
                                              bodyType,
                                            )}
                                            height="100%"
                                            theme={editorTheme}
                                          />
                                        </div>
                                      </div>
                                    )}

                                    {bodyType === 'binary' && (
                                      <div className="flex flex-1 items-center justify-center p-12 text-center">
                                        <div className="text-muted-foreground">
                                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
                                            <FileText className="h-8 w-8" />
                                          </div>
                                          <p className="mb-4 text-sm">
                                            选择要上传的二进制文件
                                          </p>
                                          <Input
                                            id="api-test-binary-file"
                                            type="file"
                                            className="sr-only"
                                            onChange={(e) => {
                                              const file = e.target.files?.[0]
                                              if (file) {
                                                setTestBody(
                                                  `[Binary File: ${file.name}, Size: ${file.size} bytes]`,
                                                )
                                              }
                                            }}
                                          />
                                          <Button
                                            variant="outline"
                                            className="gap-2"
                                            type="button"
                                            onClick={() =>
                                              document
                                                .getElementById(
                                                  'api-test-binary-file',
                                                )
                                                ?.click()
                                            }
                                          >
                                            <Plus className="h-4 w-4" />
                                            选择文件
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {activeTestTab === 'headers' && (
                                <div className="m-0 h-full space-y-6 p-6">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h3 className="flex items-center gap-2 text-lg font-semibold">
                                        请求头
                                        {testHeaders.filter(
                                          (h) => h.enabled && h.name,
                                        ).length > 0 && (
                                          <Badge
                                            variant="secondary"
                                            className="h-5 px-2 text-xs"
                                          >
                                            {
                                              testHeaders.filter(
                                                (h) => h.enabled && h.name,
                                              ).length
                                            }{' '}
                                            个Header
                                          </Badge>
                                        )}
                                      </h3>
                                      <p className="mt-1 text-sm text-muted-foreground">
                                        配置HTTP请求头信息
                                      </p>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={addHeaderRow}
                                      className="gap-2 hover:border-green-200 hover:bg-green-50 hover:text-green-700"
                                    >
                                      <Plus className="h-4 w-4" />
                                      添加Header
                                    </Button>
                                  </div>

                                  {/* Headers表格 */}
                                  <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
                                    <div className="border-b bg-linear-to-r from-muted/40 to-muted/60">
                                      <div className="grid grid-cols-12 gap-4 p-4 text-sm font-semibold text-foreground">
                                        <div className="col-span-1 text-center">
                                          ✓
                                        </div>
                                        <div className="col-span-4">
                                          Header名
                                        </div>
                                        <div className="col-span-5">
                                          Header值
                                        </div>
                                        <div className="col-span-2 text-center">
                                          操作
                                        </div>
                                      </div>
                                    </div>
                                    <div className="max-h-96 divide-y overflow-auto">
                                      {testHeaders.map((header) => (
                                        <div
                                          key={header.id}
                                          className="group grid grid-cols-12 items-center gap-4 p-4 transition-colors hover:bg-green-50/50 dark:hover:bg-green-950/20"
                                        >
                                          <div className="col-span-1 flex justify-center">
                                            <Switch
                                              checked={header.enabled}
                                              onCheckedChange={(checked) =>
                                                updateHeaderRow(
                                                  header.id,
                                                  'enabled',
                                                  checked,
                                                )
                                              }
                                            />
                                          </div>
                                          <div className="col-span-4">
                                            <Input
                                              placeholder="Header名"
                                              value={header.name}
                                              onChange={(e) =>
                                                updateHeaderRow(
                                                  header.id,
                                                  'name',
                                                  e.target.value,
                                                )
                                              }
                                              className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background"
                                              onBlur={() => {
                                                if (
                                                  header.id === 'header-new' &&
                                                  header.name
                                                ) {
                                                  addHeaderRow()
                                                }
                                              }}
                                            />
                                          </div>
                                          <div className="col-span-5">
                                            <Input
                                              placeholder="Header值"
                                              value={header.value}
                                              onChange={(e) =>
                                                updateHeaderRow(
                                                  header.id,
                                                  'value',
                                                  e.target.value,
                                                )
                                              }
                                              className="h-9 border-0 bg-transparent text-sm transition-all focus:rounded-md focus:border focus:bg-background"
                                            />
                                          </div>
                                          <div className="col-span-2 flex justify-center">
                                            {header.id !== 'header-new' &&
                                              header.name && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() =>
                                                    removeHeaderRow(header.id)
                                                  }
                                                  className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                                                >
                                                  <Minus className="h-4 w-4" />
                                                </Button>
                                              )}
                                          </div>
                                          {header.description && (
                                            <div className="col-span-12 -mx-1 mt-2 rounded-md bg-green-50/50 py-2 pl-4 dark:bg-green-950/20">
                                              <div className="flex items-start gap-2">
                                                <Lightbulb className="mt-0.5 h-4 w-4 text-green-500" />
                                                <div className="flex-1 text-sm">
                                                  <MarkdownRenderer
                                                    content={header.description}
                                                    className="prose-xs [&_code]:bg-green-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_code]:dark:bg-green-900 [&_p]:mb-1 [&_p]:text-sm [&_p]:text-green-700 [&_p]:dark:text-green-300 [&_strong]:font-medium"
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
                                <div className="m-0 flex h-full items-center justify-center p-6">
                                  <div className="text-center text-muted-foreground">
                                    <Key className="mx-auto mb-4 h-12 w-12 opacity-30" />
                                    <p>Cookies 功能开发中...</p>
                                  </div>
                                </div>
                              )}

                              {activeTestTab === 'auth' && (
                                <div className="m-0 flex h-full items-center justify-center p-6">
                                  <div className="text-center text-muted-foreground">
                                    <Shield className="mx-auto mb-4 h-12 w-12 opacity-30" />
                                    <p>认证功能开发中...</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 右侧：响应区域 */}
                        <div className="flex w-2/5 flex-col bg-muted/30">
                          {/* 响应标题栏 */}
                          <div className="shrink-0 border-b bg-background px-6 py-3">
                            <h3 className="text-sm font-medium text-muted-foreground">
                              响应结果
                            </h3>
                          </div>

                          {/* 响应内容区域 - 全高度 */}
                          <div className="flex-1 overflow-auto">
                            {testResponse ? (
                              <div className="space-y-4 p-6">
                                {/* 响应状态栏 */}
                                <div className="rounded-lg border bg-background p-4">
                                  <div className="mb-3 flex items-center justify-between">
                                    <h4 className="font-semibold">响应状态</h4>
                                    <div className="flex items-center gap-3 text-sm">
                                      <Badge
                                        variant={
                                          testResponse.status < 300
                                            ? 'default'
                                            : 'destructive'
                                        }
                                        className="font-mono"
                                      >
                                        {testResponse.status}{' '}
                                        {testResponse.statusText}
                                      </Badge>
                                      <span className="text-muted-foreground">
                                        耗时: {testResponse.time}ms
                                      </span>
                                      {testResponse.size && (
                                        <span className="text-muted-foreground">
                                          大小: {testResponse.size}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* 响应Headers */}
                                {testResponse.headers && (
                                  <Card>
                                    <CardHeader className="pb-3">
                                      <CardTitle className="text-base">
                                        响应头
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                      <div className="max-h-48 space-y-2 overflow-auto">
                                        {Object.entries(
                                          testResponse.headers,
                                        ).map(([key, value]) => (
                                          <div
                                            key={key}
                                            className="grid grid-cols-3 gap-4 border-b border-border/30 py-2 text-sm last:border-0"
                                          >
                                            <div className="font-mono font-medium text-purple-600 dark:text-purple-400">
                                              {key}
                                            </div>
                                            <div className="col-span-2 font-mono break-all text-muted-foreground">
                                              {String(value)}
                                            </div>
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
                                      <CardTitle className="text-base">
                                        响应体
                                      </CardTitle>
                                      <div className="flex gap-2">
                                        <Badge
                                          variant="outline"
                                          className="border-blue-200 bg-blue-50 text-blue-700"
                                        >
                                          {detectResponseLanguage(
                                            testResponse,
                                          ).toUpperCase()}
                                        </Badge>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            setFormatMessage({
                                              type: 'success',
                                              text: '响应数据已重新格式化',
                                            })
                                          }}
                                          className="hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
                                          title="重新格式化响应数据"
                                        >
                                          格式化
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setEditorTheme((prev) =>
                                              prev === 'vs' ? 'vs-dark' : 'vs',
                                            )
                                          }
                                          className="hover:border-border-default hover:bg-background-subtle"
                                          title="切换编辑器主题"
                                        >
                                          {editorTheme === 'vs' ? '🌙' : '☀️'}
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleCopy(
                                              formattedResponse ||
                                                formatResponseData(
                                                  testResponse,
                                                ),
                                              'response',
                                            )
                                          }
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
                                          <div
                                            className={cn(
                                              'rounded-md px-3 py-1 text-xs font-medium transition-all duration-300',
                                              formatMessage.type === 'success'
                                                ? 'border border-green-200 bg-green-50 text-green-700'
                                                : 'border border-red-200 bg-red-50 text-red-700',
                                            )}
                                          >
                                            {formatMessage.text}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-0">
                                    <div className="h-96 overflow-hidden rounded-lg border">
                                      <CodeEditor
                                        value={
                                          formattedResponse ||
                                          formatResponseData(testResponse)
                                        }
                                        onChange={() => {}} // 只读模式，空函数
                                        language={detectResponseLanguage(
                                          testResponse,
                                        )}
                                        height="100%"
                                        theme={editorTheme}
                                        readOnly={true}
                                      />
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center p-6">
                                <div className="space-y-4 text-center">
                                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500/20 to-green-500/20">
                                    <Play className="h-10 w-10 text-muted-foreground/50" />
                                  </div>
                                  <div>
                                    <h4 className="mb-2 text-lg font-semibold">
                                      在线调试尚未开放
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      当前仅提供接口文档与请求参数预览，不会发送真实请求。
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
              <div className="flex h-full items-center justify-center">
                <Card className="max-w-md p-12 text-center">
                  <BookOpen className="mx-auto mb-6 h-16 w-16 text-muted-foreground" />
                  <h3 className="mb-2 text-xl font-semibold">
                    选择一个 API 接口
                  </h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    从左侧列表中选择一个 API 接口来查看详细文档
                  </p>
                  {apiSpec && (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p>
                        API 文档: {apiSpec.info.title} v{apiSpec.info.version}
                      </p>
                      <p>共 {apiEndpoints.length} 个接口</p>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* 移动端遮罩（内嵌设置页时不再需要）*/}
      </div>
    </div>
  )
}

export default ApiDocumentationPage
