'use client'

import React from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { Divider } from '@/components/ui/divider'
import { SelectWithSearch, type SelectOptionGroup } from '@/components/ui/select-with-search'
import { IconFontFill } from '@/components/ui/icon-font'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import { useModelStore, IconMap, LLMFactory, isLLMModelEnabled } from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { ROUTES } from '@/constants'
import type { KnowledgeBase, UpdateKBRequest } from '@/types/api'
import { DocumentParserType, DOCUMENT_PARSER_TYPE_LABELS, DOCUMENT_PARSER_TYPE_DESCRIPTIONS } from '@/types/document-parser'
import {
  knowledgeSettingsFormSchema,
  getDefaultFormValues,
  ParseTypeOptions,
  type KnowledgeSettingsFormData,
} from '@/types/knowledge-form'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { GraphRagFormFields } from '@/components/forms/GraphRagFormFields'
import { RaptorFormFields } from '@/components/forms/RaptorFormFields'
import { AutoMetadataFormField } from '@/components/forms/KnowledgeFormFields'
import { GeneralForm } from './settings/GeneralForm'
import { ChunkMethodForm } from './settings/ChunkMethodForm'
import { PipelineSelect, type PipelineOption } from './settings/PipelineSelect'
import { LinkDataSource } from './settings/LinkDataSource'
import ParserVisualizationPanel from './settings/ParserVisualizationPanel'
import { ManageMetadataModal } from './metadata/ManageMetadataModal'
import { MetadataManageType } from '@/types/api'

type KnowledgeBaseWithPipeline = KnowledgeBase & {
  pipeline_id?: string | null
}

// 需要主题切换的厂商
const THEME_AWARE_FACTORIES: readonly string[] = [
  LLMFactory.FishAudio,
  LLMFactory.TogetherAI,
  LLMFactory.Meituan,
  LLMFactory.Longcat,
]

// 获取图标名称
const getIconName = (provider: string, isDark: boolean): string => {
  const baseIcon = IconMap[provider as keyof typeof IconMap] || 'moxing-default'
  if (THEME_AWARE_FACTORIES.includes(provider)) {
    return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
  }
  return baseIcon
}

// 构建带图标的选项 Label（与模型提供商页面保持一致）
const ModelOptionLabel: React.FC<{ provider: string; modelName: string }> = ({ 
  provider, 
  modelName
}) => {
  const isDark = useIsDarkTheme()
  const iconName = getIconName(provider, isDark)
  
  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      <IconFontFill name={iconName} className="w-5 h-5 shrink-0" />
      <span className="truncate">{modelName}</span>
    </div>
  )
}

// 解析器类型选项
const parserTypeOptions: SelectOptionGroup[] = Object.values(DocumentParserType).map((type) => ({
  label: DOCUMENT_PARSER_TYPE_LABELS[type],
  value: type,
}))

const buildKnowledgeSettingsFormValues = (
  currentKnowledgeBase: KnowledgeBaseWithPipeline,
  normalizeEmbdId: (value: string) => string,
): KnowledgeSettingsFormData => {
  const defaultValues = getDefaultFormValues()
  const rawValues = {
    name: currentKnowledgeBase.name || '',
    description: currentKnowledgeBase.description || '',
    permission: (currentKnowledgeBase.permission as 'me' | 'team') || 'me',
    avatar: currentKnowledgeBase.avatar || '',
    parseType: currentKnowledgeBase.pipeline_id ? 2 : 1,
    parser_id: currentKnowledgeBase.parser_id || 'naive',
    pipeline_id: currentKnowledgeBase.pipeline_id || '',
    embd_id: normalizeEmbdId(currentKnowledgeBase.embd_id || ''),
    pagerank: currentKnowledgeBase.pagerank || 0,
    parser_config: {
      ...defaultValues.parser_config,
      ...currentKnowledgeBase.parser_config,
      // 回退兼容：优先使用 image_table_context_window，否则回退到 image_context_size 或 table_context_size
      image_table_context_window:
        currentKnowledgeBase.parser_config?.image_table_context_window ??
        currentKnowledgeBase.parser_config?.image_context_size ??
        currentKnowledgeBase.parser_config?.table_context_size ??
        0,
    },
  }

  return knowledgeSettingsFormSchema.parse(rawValues)
}

// 区块标题组件
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-medium text-text-primary">{children}</h3>
  )
}

const KnowledgeSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { currentKnowledgeBase, updateKnowledgeBase } = useKnowledgeStore()
  const { addNotification } = useUIStore()
  const { myLLMs, loadMyLLMs, isLoading: isLoadingModels } = useModelStore()

  const [isLoading, setIsLoading] = React.useState(false)

  // Pipeline 列表（后端暂不支持，前端先实现）
  const [pipelineOptions] = React.useState<PipelineOption[]>([
    // 模拟数据，实际应该从后端获取
    // { id: '1', name: '默认文档处理流程' },
    // { id: '2', name: '多语言文档处理' },
  ])

  // Metadata 设置模态框状态
  const [metadataModalOpen, setMetadataModalOpen] = React.useState(false)

  // 检查 URL 参数，自动打开元数据设置弹窗
  React.useEffect(() => {
    if (searchParams.get('openMetadata') === 'true') {
      setMetadataModalOpen(true)
      // 清除 URL 参数
      searchParams.delete('openMetadata')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // 初始化表单
  const form = useForm({
    resolver: zodResolver(knowledgeSettingsFormSchema),
    defaultValues: getDefaultFormValues() as KnowledgeSettingsFormData,
  })

  // 监听解析类型和解析器
  const parseType = useWatch({
    control: form.control,
    name: 'parseType',
    defaultValue: 1,
  })

  const selectedParserId = useWatch({
    control: form.control,
    name: 'parser_id',
  })

  // 当解析类型变化时，清空相关字段
  React.useEffect(() => {
    if (parseType === 1) {
      form.setValue('pipeline_id', '')
    }
  }, [parseType, form])

  // 加载模型列表（复用 modelStore）
  React.useEffect(() => {
    // 如果 store 中还没有数据，则加载
    if (Object.keys(myLLMs).length === 0) {
      loadMyLLMs()
    }
  }, [myLLMs, loadMyLLMs])

  // 构建所有嵌入模型的 value 映射（用于查找匹配）
  const allEmbeddingModelValues = React.useMemo(() => {
    const values: Map<string, string> = new Map()
    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      providerData.llm
        .filter(model => model.type === 'embedding' && isLLMModelEnabled(model))
        .forEach(model => {
          const fullValue = `${model.name}@${providerName}`
          // 存储多种可能的匹配格式
          values.set(fullValue.toLowerCase(), fullValue)
          values.set(model.name.toLowerCase(), fullValue)
        })
    })
    return values
  }, [myLLMs])

  // 规范化嵌入模型 ID（匹配 API 返回格式与选择器 value 格式）
  const normalizeEmbdId = React.useCallback((value: string): string => {
    if (!value) return ''
    const lowerValue = value.toLowerCase()
    // 直接匹配
    if (allEmbeddingModelValues.has(lowerValue)) {
      return allEmbeddingModelValues.get(lowerValue)!
    }
    // 尝试匹配（忽略大小写和连字符变化）
    for (const [key, fullValue] of allEmbeddingModelValues) {
      if (key.replace(/-/g, '').includes(lowerValue.replace(/-/g, '').replace(/@.*$/, ''))) {
        return fullValue
      }
    }
    return value
  }, [allEmbeddingModelValues])

  // 初始化表单数据
  React.useEffect(() => {
    if (currentKnowledgeBase) {
      form.reset(buildKnowledgeSettingsFormValues(currentKnowledgeBase, normalizeEmbdId))
    }
  }, [currentKnowledgeBase, form, normalizeEmbdId])

  // 嵌入模型选项（带厂商图标），复用与模型提供商页面相同的逻辑
  const embeddingModelOptions: SelectOptionGroup[] = React.useMemo(() => {
    const groups: SelectOptionGroup[] = []
    
    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      // 过滤出 embedding 类型的模型
      const embeddingModels = providerData.llm.filter(
        model => model.type === 'embedding' && isLLMModelEnabled(model)
      )
      
      if (embeddingModels.length > 0) {
        groups.push({
          label: providerName,
          options: embeddingModels.map((model) => ({
            label: (
              <ModelOptionLabel 
                provider={providerName} 
                modelName={model.name} 
              />
            ),
            // 使用 name@provider 格式作为 value，与系统设置页面保持一致
            value: `${model.name}@${providerName}`,
          })),
        })
      }
    })
    
    return groups
  }, [myLLMs])

  // 提交表单
  const handleSubmit = async (data: KnowledgeSettingsFormData) => {
    if (!id) return

    const trimmedName = data.name.trim()
    if (!trimmedName) {
      addNotification({
        type: 'error',
        title: '表单验证失败',
        message: '知识库名称不能为空',
      })
      return
    }

    try {
      setIsLoading(true)

      // 处理 parser_config，添加字段映射
      const parserConfig = data.parseType === 1 && data.parser_config ? {
        ...data.parser_config,
        // 将 image_table_context_window 映射到后端的两个字段
        image_context_size: data.parser_config.image_table_context_window,
        table_context_size: data.parser_config.image_table_context_window,
      } : null

      const updateData: UpdateKBRequest = {
        kb_id: id,
        name: trimmedName,
        description: data.description?.trim() || null,
        permission: data.permission || null,
        avatar: data.avatar || null,
        parser_id: data.parseType === 1 ? data.parser_id : null,
        embd_id: data.embd_id?.trim() || null,
        pagerank: data.pagerank || 0,
        parser_config: parserConfig,
        // pipeline_id: data.parseType === 2 ? data.pipeline_id : null, // 后端暂不支持
      }

      await updateKnowledgeBase(updateData)

      addNotification({
        type: 'success',
        title: '更新成功',
        message: '知识库设置已成功更新',
      })
    } catch (error) {
      console.error('Update knowledge base failed:', error)
      addNotification({
        type: 'error',
        title: '更新失败',
        message: '更新知识库设置时发生错误',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    if (currentKnowledgeBase) {
      form.reset(buildKnowledgeSettingsFormValues(currentKnowledgeBase, normalizeEmbdId))
    }
  }


  const parserDescription = selectedParserId
    ? DOCUMENT_PARSER_TYPE_DESCRIPTIONS[selectedParserId as DocumentParserType]
    : ''

  if (!currentKnowledgeBase) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-text-tertiary">知识库不存在</p>
          <Button className="mt-4" onClick={() => navigate(ROUTES.KNOWLEDGE)}>
            返回知识库列表
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      {/* 固定头部 */}
      <div className="border-b border-border px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-text-primary flex items-center">
              <Settings2 className="h-5 w-5 text-primary mr-2" />
              知识库设置
            </h1>
            <p className="text-sm text-text-tertiary mt-1">配置解析方式和参数选项</p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={handleReset} disabled={isLoading}>
              取消
            </Button>
            <Button
              loading={isLoading}
              leftIcon={<Save className="h-4 w-4" />}
              onClick={form.handleSubmit(handleSubmit)}
            >
              保存
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex gap-10 overflow-hidden p-6">
        <Form {...form}>
          <form className="flex-1 flex gap-10 overflow-hidden">
            {/* 左侧配置面板 */}
            <div className="w-[720px] shrink-0 overflow-y-auto pr-2 scrollbar-thin">
              <div className="space-y-1 text-text-secondary">
                {/* ==================== 1. 基本信息 ==================== */}
                <SectionTitle>基本信息</SectionTitle>
                <div className="mt-4">
                  <GeneralForm
                    embeddingModelOptions={embeddingModelOptions}
                    embeddingModelLoading={isLoadingModels}
                  />
                </div>

                <Divider />

                {/* ==================== 2. 全局索引 ==================== */}
                <SectionTitle>全局索引</SectionTitle>
                
                {/* GraphRAG 配置 */}
                <div className="mt-4">
                  <GraphRagFormFields />
                </div>

                <Divider className="my-3" />

                {/* RAPTOR 配置 */}
                <div>
                  <RaptorFormFields />
                </div>

                <Divider />

                {/* ==================== 3. 数据管道 (Ingestion Pipeline) ==================== */}
                <SectionTitle>数据管道</SectionTitle>
                
                <div className="mt-4 space-y-4">
                  {/* 解析类型选择：内置 / 手动设置 */}
                  <FormField
                    control={form.control}
                    name="parseType"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-1 space-y-0">
                        <FormLabel className="text-sm text-text-secondary w-1/4 shrink-0">
                          解析类型
                        </FormLabel>
                        <div className="w-3/4">
                          <FormControl>
                            <RadioGroup
                              value={String(field.value)}
                              onValueChange={(val) => field.onChange(Number(val))}
                              className="flex gap-6"
                            >
                              {ParseTypeOptions.map((opt) => (
                                <label
                                  key={opt.value}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <RadioGroupItem value={String(opt.value)} />
                                  <span className="text-sm text-text-secondary">{opt.label}</span>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="mt-1" />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* 内置解析器选项 */}
                  {parseType === 1 && (
                    <>
                      {/* 分块方法选择 */}
                      <FormField
                        control={form.control}
                        name="parser_id"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-1 space-y-0">
                            <FormLabel
                              required
                              tooltip="选择文档的解析方式，不同的解析器适用于不同类型的文档。"
                              className="text-sm text-text-secondary w-1/4 shrink-0"
                            >
                              分块方法
                            </FormLabel>
                            <div className="w-3/4">
                              <FormControl>
                                <SelectWithSearch
                                  value={field.value}
                                  onChange={field.onChange}
                                  options={parserTypeOptions}
                                  placeholder="请选择分块方法"
                                />
                              </FormControl>
                              <FormMessage className="mt-1" />
                            </div>
                          </FormItem>
                        )}
                      />

                      {/* 解析器说明 */}
                      {parserDescription && (
                        <div className="flex items-start gap-1">
                          <div className="w-1/4" />
                          <div className="w-3/4 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md">
                            <p className="text-sm text-primary">{parserDescription}</p>
                          </div>
                        </div>
                      )}

                      {/* 解析器配置参数 */}
                      {selectedParserId && (
                        <div className="border-t border-border pt-4 space-y-4">
                          <ChunkMethodForm />

                          {/* 自动元数据设置 - 使用独立组件，带设置按钮 */}
                          <AutoMetadataFormField
                            onSettingsClick={() => setMetadataModalOpen(true)}
                            metadataCount={currentKnowledgeBase?.metadata_settings?.length ?? 0}
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* 手动设置 Pipeline 选项 */}
                  {parseType === 2 && (
                    <PipelineSelect
                      options={pipelineOptions}
                      showNavigateLink
                    />
                  )}
                </div>

                <Divider />

                {/* ==================== 5. 数据源 ==================== */}
                <LinkDataSource kbId={id!} />
              </div>
            </div>

            {/* 右侧可视化面板 */}
            <div className="flex-1 min-w-[360px] overflow-y-auto bg-background rounded-xl border border-border/50">
              {parseType === 1 && (
                <ParserVisualizationPanel selectedParser={selectedParserId} />
              )}
              {parseType === 2 && (
                <div className="p-6">
                  <h3 className="text-base font-medium text-text-primary mb-4">数据管道</h3>
                  <p className="text-sm text-text-tertiary">
                    使用数据管道可以自定义文档的处理流程，包括解析、清洗、分块等步骤。
                  </p>
                  <p className="text-sm text-text-tertiary mt-2">
                    如果没有合适的数据管道，可以点击「从头创建」来创建新的数据管道。
                  </p>
                </div>
              )}
            </div>
          </form>
        </Form>
      </div>

      {/* Metadata 设置模态框 */}
      {id && (
        <ManageMetadataModal
          open={metadataModalOpen}
          onClose={() => setMetadataModalOpen(false)}
          kbId={id}
          mode={MetadataManageType.SETTING}
          initialSettings={currentKnowledgeBase?.metadata_settings || []}
          onSuccess={() => {
            // 刷新知识库详情以获取最新的 metadata_settings
            // 这里依赖 useUpdateKBMetadataSettings 的缓存失效逻辑
          }}
        />
      )}
    </div>
  )
}

export { KnowledgeSettingsPage }
