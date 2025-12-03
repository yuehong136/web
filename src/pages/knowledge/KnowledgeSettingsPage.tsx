'use client'

import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
import { useIsDarkTheme } from '@/themes'
import { llmAPI } from '@/api/llm'
import { ROUTES } from '@/constants'
import type { UpdateKBRequest, LLMModel } from '@/types/api'
import { DocumentParserType, DOCUMENT_PARSER_TYPE_LABELS, DOCUMENT_PARSER_TYPE_DESCRIPTIONS } from '@/types/document-parser'
import { IconMap, LLMFactory } from '@/stores/model'
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
import { GraphRagFormFields } from '@/components/forms/GraphRagFormFields'
import { RaptorFormFields } from '@/components/forms/RaptorFormFields'
import { GeneralForm } from './settings/GeneralForm'
import { ChunkMethodForm } from './settings/ChunkMethodForm'
import { PipelineSelect, type PipelineOption } from './settings/PipelineSelect'
import { LinkDataSource, type DataSourceItem } from './settings/LinkDataSource'
import ParserVisualizationPanel from './settings/ParserVisualizationPanel'

// 需要主题切换的厂商
const THEME_AWARE_FACTORIES = [
  LLMFactory.FishAudio,
  LLMFactory.TogetherAI,
  LLMFactory.Meituan,
  LLMFactory.Longcat,
]

// 获取图标名称
const getIconName = (provider: string, isDark: boolean): string => {
  const baseIcon = IconMap[provider as keyof typeof IconMap] || 'moxing-default'
  if (THEME_AWARE_FACTORIES.includes(provider as any)) {
    return isDark ? `${baseIcon}-dark` : `${baseIcon}-bright`
  }
  return baseIcon
}

// 构建带图标的选项 Label
const ModelOptionLabel: React.FC<{ provider: string; modelName: string; maxTokens?: number }> = ({ 
  provider, 
  modelName,
  maxTokens
}) => {
  const isDark = useIsDarkTheme()
  const iconName = getIconName(provider, isDark)
  
  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      <IconFontFill name={iconName} className="w-5 h-5 shrink-0" />
      <span className="truncate flex-1">{modelName}</span>
      {maxTokens && (
        <span className="text-xs text-text-tertiary shrink-0">
          {Math.round(maxTokens / 1000)}K
        </span>
      )}
    </div>
  )
}

// 解析器类型选项
const parserTypeOptions: SelectOptionGroup[] = Object.values(DocumentParserType).map((type) => ({
  label: DOCUMENT_PARSER_TYPE_LABELS[type],
  value: type,
}))

// 区块标题组件
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-medium text-text-primary">{children}</h3>
  )
}

const KnowledgeSettingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentKnowledgeBase, updateKnowledgeBase } = useKnowledgeStore()
  const { addNotification } = useUIStore()

  const [isLoading, setIsLoading] = React.useState(false)
  const [embeddingModels, setEmbeddingModels] = React.useState<LLMModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)
  const [, setModelsError] = React.useState<string | undefined>()
  
  // 数据源状态（后端暂不支持，前端先实现）
  const [dataSources, setDataSources] = React.useState<DataSourceItem[]>([])
  
  // Pipeline 列表（后端暂不支持，前端先实现）
  const [pipelineOptions] = React.useState<PipelineOption[]>([
    // 模拟数据，实际应该从后端获取
    // { id: '1', name: '默认文档处理流程' },
    // { id: '2', name: '多语言文档处理' },
  ])

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

  // 加载嵌入模型列表
  React.useEffect(() => {
    const loadEmbeddingModels = async () => {
      try {
        setIsLoadingModels(true)
        setModelsError(undefined)
        const response = await llmAPI.list({
          mdl_type: 'embedding',
          available: true,
        })

        let modelArray: LLMModel[] = []
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          Object.values(response).forEach((providerModels: any) => {
            if (Array.isArray(providerModels)) {
              const availableEmbeddingModels = providerModels.filter(
                (model: any) => model.available === true && model.mdl_type === 'embedding'
              )
              modelArray.push(...availableEmbeddingModels)
            }
          })
        }

        setEmbeddingModels(modelArray)
      } catch (error: any) {
        console.error('Failed to load embedding models:', error)
        setEmbeddingModels([])
        setModelsError('无法加载嵌入模型列表')
        addNotification({
          type: 'error',
          title: '加载失败',
          message: '无法加载嵌入模型列表，请刷新页面重试',
        })
      } finally {
        setIsLoadingModels(false)
      }
    }

    loadEmbeddingModels()
  }, [addNotification])

  // 初始化表单数据
  React.useEffect(() => {
    if (currentKnowledgeBase) {
      const defaultValues = getDefaultFormValues()
      form.reset({
        name: currentKnowledgeBase.name || '',
        description: currentKnowledgeBase.description || '',
        permission: (currentKnowledgeBase.permission as 'me' | 'team') || 'me',
        avatar: currentKnowledgeBase.avatar || '',
        parseType: (currentKnowledgeBase as any).pipeline_id ? 2 : 1,
        parser_id: currentKnowledgeBase.parser_id || 'naive',
        pipeline_id: (currentKnowledgeBase as any).pipeline_id || '',
        embd_id: currentKnowledgeBase.embd_id || '',
        pagerank: currentKnowledgeBase.pagerank || 0,
        parser_config: {
          ...defaultValues.parser_config,
          ...currentKnowledgeBase.parser_config,
        },
      })
    }
  }, [currentKnowledgeBase, form])

  // 嵌入模型选项（带厂商图标）
  const embeddingModelOptions: SelectOptionGroup[] = React.useMemo(() => {
    const grouped: Record<string, LLMModel[]> = {}
    embeddingModels.forEach((model) => {
      const provider = model.fid || 'Other'
      if (!grouped[provider]) {
        grouped[provider] = []
      }
      grouped[provider].push(model)
    })

    return Object.entries(grouped).map(([provider, models]) => ({
      label: provider,
      options: models.map((model) => ({
        label: (
          <ModelOptionLabel 
            provider={provider} 
            modelName={model.llm_name} 
            maxTokens={model.max_tokens}
          />
        ),
        value: model.llm_name,
      })),
    }))
  }, [embeddingModels])

  // 提交表单
  const handleSubmit = async (data: Record<string, any>) => {
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

      const updateData: UpdateKBRequest = {
        kb_id: id,
        name: trimmedName,
        description: data.description?.trim() || null,
        permission: data.permission || null,
        avatar: data.avatar || null,
        parser_id: data.parseType === 1 ? data.parser_id : null,
        embd_id: data.embd_id?.trim() || null,
        pagerank: data.pagerank || 0,
        parser_config: data.parseType === 1 && data.parser_config ? data.parser_config : null,
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
      const defaultValues = getDefaultFormValues()
      form.reset({
        name: currentKnowledgeBase.name || '',
        description: currentKnowledgeBase.description || '',
        permission: (currentKnowledgeBase.permission as 'me' | 'team') || 'me',
        avatar: currentKnowledgeBase.avatar || '',
        parseType: (currentKnowledgeBase as any).pipeline_id ? 2 : 1,
        parser_id: currentKnowledgeBase.parser_id || 'naive',
        pipeline_id: (currentKnowledgeBase as any).pipeline_id || '',
        embd_id: currentKnowledgeBase.embd_id || '',
        pagerank: currentKnowledgeBase.pagerank || 0,
        parser_config: {
          ...defaultValues.parser_config,
          ...currentKnowledgeBase.parser_config,
        },
      })
    }
  }

  // 数据源操作
  const handleLinkDataSource = (items: DataSourceItem[]) => {
    setDataSources(items)
  }

  const handleUnbindDataSource = (item: DataSourceItem) => {
    setDataSources((prev) => prev.filter((s) => s.id !== item.id))
  }

  const handleAutoParseChange = (sourceId: string, autoParse: boolean) => {
    setDataSources((prev) =>
      prev.map((s) => (s.id === sourceId ? { ...s, auto_parse: autoParse ? '1' : '0' } : s))
    )
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
                            <div className="flex gap-6">
                              {ParseTypeOptions.map((opt) => (
                                <label
                                  key={opt.value}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <input
                                    type="radio"
                                    name="parseType"
                                    value={opt.value}
                                    checked={field.value === opt.value}
                                    onChange={() => field.onChange(opt.value)}
                                    className="h-4 w-4 text-primary border-border focus:ring-primary"
                                  />
                                  <span className="text-sm text-text-secondary">{opt.label}</span>
                                </label>
                              ))}
                            </div>
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
                        <div className="border-t border-border pt-4">
                          <ChunkMethodForm />
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

                {/* ==================== 4. 数据源 ==================== */}
                <LinkDataSource
                  data={dataSources}
                  onLinkOrEditSubmit={handleLinkDataSource}
                  onUnbind={handleUnbindDataSource}
                  onAutoParse={handleAutoParseChange}
                />
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
    </div>
  )
}

export { KnowledgeSettingsPage }
