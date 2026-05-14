'use client'

import React from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { IconFontFill } from '@/components/ui/icon-font'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import {
  useModelStore,
  IconMap,
  LLMFactory,
  isLLMModelEnabled,
} from '@/stores/model'
import { useIsDarkTheme } from '@/themes'
import { ROUTES } from '@/constants'
import type { KnowledgeBase, UpdateKBRequest } from '@/types/api'
import {
  DocumentParserType,
  DOCUMENT_PARSER_TYPE_LABELS,
  DOCUMENT_PARSER_TYPE_DESCRIPTIONS,
} from '@/types/document-parser'
import {
  knowledgeSettingsFormSchema,
  getDefaultFormValues,
  ParseTypeOptions,
  type KnowledgeSettingsFormData,
} from '@/types/knowledge-form'
import {
  Form,
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
import { PageEmptyState, PageHeader, SectionCard } from '@/components/patterns'

const KB_SETTINGS_FORM_ID = 'kb-settings-form'

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
  modelName,
}) => {
  const isDark = useIsDarkTheme()
  const iconName = getIconName(provider, isDark)

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <IconFontFill name={iconName} className="h-5 w-5 shrink-0" />
      <span className="truncate">{modelName}</span>
    </div>
  )
}

// 解析器类型选项
const parserTypeOptions: SelectOptionGroup[] = Object.values(
  DocumentParserType,
).map((type) => ({
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
        .filter(
          (model) => model.type === 'embedding' && isLLMModelEnabled(model),
        )
        .forEach((model) => {
          const fullValue = `${model.name}@${providerName}`
          // 存储多种可能的匹配格式
          values.set(fullValue.toLowerCase(), fullValue)
          values.set(model.name.toLowerCase(), fullValue)
        })
    })
    return values
  }, [myLLMs])

  // 规范化嵌入模型 ID（匹配 API 返回格式与选择器 value 格式）
  const normalizeEmbdId = React.useCallback(
    (value: string): string => {
      if (!value) return ''
      const lowerValue = value.toLowerCase()
      // 直接匹配
      if (allEmbeddingModelValues.has(lowerValue)) {
        return allEmbeddingModelValues.get(lowerValue)!
      }
      // 尝试匹配（忽略大小写和连字符变化）
      for (const [key, fullValue] of allEmbeddingModelValues) {
        if (
          key
            .replace(/-/g, '')
            .includes(lowerValue.replace(/-/g, '').replace(/@.*$/, ''))
        ) {
          return fullValue
        }
      }
      return value
    },
    [allEmbeddingModelValues],
  )

  // 初始化表单数据
  React.useEffect(() => {
    if (currentKnowledgeBase) {
      form.reset(
        buildKnowledgeSettingsFormValues(currentKnowledgeBase, normalizeEmbdId),
      )
    }
  }, [currentKnowledgeBase, form, normalizeEmbdId])

  // 嵌入模型选项（带厂商图标），复用与模型提供商页面相同的逻辑
  const embeddingModelOptions: SelectOptionGroup[] = React.useMemo(() => {
    const groups: SelectOptionGroup[] = []

    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      // 过滤出 embedding 类型的模型
      const embeddingModels = providerData.llm.filter(
        (model) => model.type === 'embedding' && isLLMModelEnabled(model),
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
      const parserConfig =
        data.parseType === 1 && data.parser_config
          ? {
              ...data.parser_config,
              // 将 image_table_context_window 映射到后端的两个字段
              image_context_size: data.parser_config.image_table_context_window,
              table_context_size: data.parser_config.image_table_context_window,
            }
          : null

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
      form.reset(
        buildKnowledgeSettingsFormValues(currentKnowledgeBase, normalizeEmbdId),
      )
    }
  }

  const parserDescription = selectedParserId
    ? DOCUMENT_PARSER_TYPE_DESCRIPTIONS[selectedParserId as DocumentParserType]
    : ''

  if (!currentKnowledgeBase) {
    return (
      <PageEmptyState
        title="知识库不存在"
        description="该知识库可能已被删除或您没有访问权限。"
        action={
          <Button onClick={() => navigate(ROUTES.KNOWLEDGE)}>
            返回知识库列表
          </Button>
        }
      />
    )
  }

  return (
    <Form {...form}>
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-components-console-bg">
        <PageHeader
          compact
          surface="elevated"
          titleSize="md"
          title="知识库设置"
          description="配置解析方式和参数选项"
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button
                type="submit"
                form={KB_SETTINGS_FORM_ID}
                loading={isLoading}
                leftIcon={<Save className="h-4 w-4" />}
              >
                保存
              </Button>
            </>
          }
        />

        <div className="gap-space-md p-space-md flex min-h-0 flex-1 overflow-hidden">
          <aside
            aria-label="设置表单"
            className="rounded-radius-lg flex min-h-0 w-[720px] shrink-0 flex-col overflow-hidden border border-components-console-border bg-components-console-surface"
          >
            <form
              id={KB_SETTINGS_FORM_ID}
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-space-md p-space-lg min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin"
            >
              <SectionCard title="基本信息">
                <GeneralForm
                  embeddingModelOptions={embeddingModelOptions}
                  embeddingModelLoading={isLoadingModels}
                />
              </SectionCard>

              <SectionCard title="全局索引">
                <div className="space-y-space-lg">
                  <GraphRagFormFields />
                  <div className="pt-space-md border-t border-border-subtle">
                    <RaptorFormFields />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="数据管道">
                <div className="space-y-space-md">
                  <FormField
                    control={form.control}
                    name="parseType"
                    render={({ field }) => (
                      <FormItem className="gap-space-xs flex items-center space-y-0">
                        <FormLabel className="w-1/4 shrink-0 text-sm text-text-secondary">
                          解析类型
                        </FormLabel>
                        <div className="w-3/4">
                          <FormControl>
                            <RadioGroup
                              value={String(field.value)}
                              onValueChange={(val) =>
                                field.onChange(Number(val))
                              }
                              className="gap-space-lg flex"
                            >
                              {ParseTypeOptions.map((opt) => (
                                <label
                                  key={opt.value}
                                  className="gap-space-sm flex cursor-pointer items-center"
                                >
                                  <RadioGroupItem value={String(opt.value)} />
                                  <span className="text-sm text-text-secondary">
                                    {opt.label}
                                  </span>
                                </label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage className="mt-space-xs" />
                        </div>
                      </FormItem>
                    )}
                  />

                  {parseType === 1 && (
                    <>
                      <FormField
                        control={form.control}
                        name="parser_id"
                        render={({ field }) => (
                          <FormItem className="gap-space-xs flex items-center space-y-0">
                            <FormLabel
                              required
                              tooltip="选择文档的解析方式，不同的解析器适用于不同类型的文档。"
                              className="w-1/4 shrink-0 text-sm text-text-secondary"
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
                              <FormMessage className="mt-space-xs" />
                            </div>
                          </FormItem>
                        )}
                      />

                      {parserDescription ? (
                        <div className="gap-space-xs flex items-start">
                          <div className="w-1/4" />
                          <div className="rounded-radius-md px-space-base py-space-sm w-3/4 border border-primary/20 bg-primary/5">
                            <p className="text-sm text-primary">
                              {parserDescription}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {selectedParserId ? (
                        <div className="space-y-space-md pt-space-md border-t border-border-subtle">
                          <ChunkMethodForm />
                          <AutoMetadataFormField
                            onSettingsClick={() => setMetadataModalOpen(true)}
                            metadataCount={
                              currentKnowledgeBase?.metadata_settings?.length ??
                              0
                            }
                          />
                        </div>
                      ) : null}
                    </>
                  )}

                  {parseType === 2 && (
                    <PipelineSelect
                      options={pipelineOptions}
                      showNavigateLink
                    />
                  )}
                </div>
              </SectionCard>

              <SectionCard>
                <LinkDataSource kbId={id!} />
              </SectionCard>
            </form>
          </aside>

          <section
            aria-label="解析预览"
            className="rounded-radius-lg flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-components-console-border bg-components-console-surface"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
              {parseType === 1 ? (
                <ParserVisualizationPanel selectedParser={selectedParserId} />
              ) : (
                <div className="space-y-space-sm p-space-lg">
                  <h3 className="text-base font-medium text-text-primary">
                    数据管道
                  </h3>
                  <p className="text-sm text-text-tertiary">
                    使用数据管道可以自定义文档的处理流程，包括解析、清洗、分块等步骤。
                  </p>
                  <p className="text-sm text-text-tertiary">
                    如果没有合适的数据管道，可以点击「从头创建」来创建新的数据管道。
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {id ? (
        <ManageMetadataModal
          open={metadataModalOpen}
          onClose={() => setMetadataModalOpen(false)}
          kbId={id}
          mode={MetadataManageType.SETTING}
          initialSettings={currentKnowledgeBase?.metadata_settings || []}
          onSuccess={() => {
            // 依赖 useUpdateKBMetadataSettings 的缓存失效逻辑
          }}
        />
      ) : null}
    </Form>
  )
}

export { KnowledgeSettingsPage }
