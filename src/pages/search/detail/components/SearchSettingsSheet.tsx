import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SliderWithInput } from '@/components/ui/slider-with-input'
import {
  MultiSelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/multi-select-with-search'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'
import {
  MetadataFilter,
  type MetadataFilterMode,
  type MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { llmAPI } from '@/api/llm'
import type { LLMModel, MetadataCondition } from '@/types/api'
import type { SearchApp, SearchConfig } from '@/types/search'
import type { MyLLMProvider } from '@/stores/model'
import ToggleRow from './toggle-row'

interface SearchSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  name: string
  description?: string
  avatar?: string
  onBasicInfoChange: (
    partial: Partial<Pick<SearchApp, 'name' | 'description' | 'avatar'>>,
  ) => void
  config: SearchConfig
  onConfigChange: (partial: Partial<SearchConfig>) => void
  onSave: () => void
  isSaving: boolean
  isDirty: boolean
}

enum SummaryPreset {
  PRECISE = 'precise',
  BALANCED = 'balanced',
  CREATIVE = 'creative',
  CUSTOM = 'custom',
}

type LLMSettingValue = {
  temperature: number
  top_p: number
  presence_penalty: number
  frequency_penalty: number
}

const DEFAULT_LLM_SETTING: LLMSettingValue = {
  temperature: 0.5,
  top_p: 0.85,
  presence_penalty: 0.2,
  frequency_penalty: 0.3,
}

const SUMMARY_PRESET_MAP: Record<
  Exclude<SummaryPreset, SummaryPreset.CUSTOM>,
  LLMSettingValue
> = {
  [SummaryPreset.PRECISE]: {
    temperature: 0.2,
    top_p: 0.7,
    presence_penalty: 0.1,
    frequency_penalty: 0.1,
  },
  [SummaryPreset.BALANCED]: {
    temperature: 0.5,
    top_p: 0.85,
    presence_penalty: 0.2,
    frequency_penalty: 0.3,
  },
  [SummaryPreset.CREATIVE]: {
    temperature: 0.9,
    top_p: 0.95,
    presence_penalty: 0.4,
    frequency_penalty: 0.4,
  },
}

type LLMSettingField =
  | 'temperature'
  | 'top_p'
  | 'presence_penalty'
  | 'frequency_penalty'

const CROSS_LANGUAGE_OPTIONS: SelectOptionGroup[] = [
  'English',
  'Chinese',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Vietnamese',
  'Arabic',
  'Turkish',
].map((language) => ({ label: language, value: language }))

interface RawModelItem {
  id?: string
  name?: string
  llm_name?: string
  type?: string
  mdl_type?: string
  available?: boolean
  status?: string
  used_token?: number
}

interface RawProviderPayload {
  tags?: string
  llm?: RawModelItem[]
}

const getMetadataMode = (
  metaDataFilter?: SearchConfig['meta_data_filter'],
): MetadataFilterMode => {
  if (
    metaDataFilter?.method === 'auto' ||
    metaDataFilter?.method === 'semi_auto' ||
    metaDataFilter?.method === 'manual'
  ) {
    return metaDataFilter.method
  }
  return 'disabled'
}

const toMetadataCondition = (
  metaDataFilter?: SearchConfig['meta_data_filter'],
): MetadataCondition => {
  return {
    logic: metaDataFilter?.logic || 'and',
    conditions: (metaDataFilter?.manual || []).map((item) => ({
      name: item.key || '',
      comparison_operator: item.op || 'is',
      value: item.value || '',
    })),
  }
}

const toMetadataSemiAutoFields = (
  metaDataFilter?: SearchConfig['meta_data_filter'],
): MetadataSemiAutoField[] => {
  return (metaDataFilter?.semi_auto || [])
    .map((item) => {
      if (typeof item === 'string') return { key: item }
      return { key: item.key, op: item.op }
    })
    .filter((item) => Boolean(item.key))
}

const isEnabledRawModel = (model: RawModelItem) =>
  model.available !== false && model.status !== '0'

const matchSummaryPreset = (llmSetting?: SearchConfig['llm_setting']) => {
  if (!llmSetting) return SummaryPreset.BALANCED

  const keys: LLMSettingField[] = [
    'temperature',
    'top_p',
    'presence_penalty',
    'frequency_penalty',
  ]
  const allEnabled = keys.every((key) => llmSetting[key] !== undefined)
  if (!allEnabled) return SummaryPreset.CUSTOM

  const isMatched = (preset: Exclude<SummaryPreset, SummaryPreset.CUSTOM>) => {
    const target = SUMMARY_PRESET_MAP[preset]
    return keys.every(
      (key) => Math.abs((llmSetting[key] as number) - target[key]) < 0.0001,
    )
  }

  if (isMatched(SummaryPreset.PRECISE)) return SummaryPreset.PRECISE
  if (isMatched(SummaryPreset.BALANCED)) return SummaryPreset.BALANCED
  if (isMatched(SummaryPreset.CREATIVE)) return SummaryPreset.CREATIVE
  return SummaryPreset.CUSTOM
}

const SearchSettingsSheet: React.FC<SearchSettingsSheetProps> = ({
  open,
  onOpenChange,
  name,
  description,
  avatar,
  onBasicInfoChange,
  config,
  onConfigChange,
  onSave,
  isSaving,
  isDirty,
}) => {
  const { knowledgeBases } = useFetchKnowledgeList({ page_size: 1000 })
  const [chatModelProviders, setChatModelProviders] = useState<MyLLMProvider>(
    {},
  )
  const [chatModelNameById, setChatModelNameById] = useState<
    Record<string, string>
  >({})
  const [rerankModels, setRerankModels] = useState<LLMModel[]>([])
  const [modelLoading, setModelLoading] = useState(false)
  const [modelError, setModelError] = useState<string | undefined>()

  const metadataMode = useMemo(
    () => getMetadataMode(config.meta_data_filter),
    [config.meta_data_filter],
  )
  const metadataCondition = useMemo(
    () => toMetadataCondition(config.meta_data_filter),
    [config.meta_data_filter],
  )
  const metadataSemiAutoFields = useMemo(
    () => toMetadataSemiAutoFields(config.meta_data_filter),
    [config.meta_data_filter],
  )

  const metadataFields = useMemo(() => {
    const fieldSet = new Set<string>()
    knowledgeBases
      .filter((kb) => config.kb_ids.includes(kb.id))
      .forEach((kb) => {
        kb.metadata_settings?.forEach((field) => {
          if (field.key) fieldSet.add(field.key)
        })
      })
    return Array.from(fieldSet)
  }, [config.kb_ids, knowledgeBases])

  const summaryPreset = useMemo(
    () => matchSummaryPreset(config.llm_setting),
    [config.llm_setting],
  )

  const selectedSummaryModelName = useMemo(() => {
    const selectedModel = config.chat_id || config.llm_id
    if (!selectedModel) return null
    return chatModelNameById[selectedModel] || selectedModel
  }, [chatModelNameById, config.chat_id, config.llm_id])

  const getLLMValue = useCallback(
    (field: LLMSettingField) =>
      config.llm_setting?.[field] ?? DEFAULT_LLM_SETTING[field],
    [config.llm_setting],
  )

  const updateLLMField = useCallback(
    (field: LLMSettingField, enabled: boolean, value?: number) => {
      const nextLLMSetting = { ...(config.llm_setting || {}) }
      if (enabled) {
        nextLLMSetting[field] = value ?? DEFAULT_LLM_SETTING[field]
      } else {
        delete nextLLMSetting[field]
      }

      onConfigChange({
        llm_setting: Object.keys(nextLLMSetting).length
          ? nextLLMSetting
          : undefined,
      })
    },
    [config.llm_setting, onConfigChange],
  )

  const handleMetadataModeChange = useCallback(
    (mode: MetadataFilterMode) => {
      const currentMetaDataFilter = config.meta_data_filter || {
        method: 'disabled',
        logic: 'and',
        semi_auto: [],
        manual: [],
      }
      onConfigChange({
        meta_data_filter: {
          ...currentMetaDataFilter,
          method: mode,
        },
      })
    },
    [config.meta_data_filter, onConfigChange],
  )

  const handleMetadataConditionChange = useCallback(
    (condition: MetadataCondition) => {
      onConfigChange({
        meta_data_filter: {
          ...(config.meta_data_filter || { semi_auto: [] }),
          method: 'manual',
          logic: condition.logic || 'and',
          manual: (condition.conditions || []).map((item) => ({
            key: item.name || '',
            op: item.comparison_operator || 'is',
            value: String(item.value ?? ''),
          })),
        },
      })
    },
    [config.meta_data_filter, onConfigChange],
  )

  const handleMetadataSemiAutoFieldsChange = useCallback(
    (fields: MetadataSemiAutoField[]) => {
      onConfigChange({
        meta_data_filter: {
          ...(config.meta_data_filter || { logic: 'and', manual: [] }),
          method: 'semi_auto',
          semi_auto: fields.map((item) =>
            item.op ? { key: item.key, op: item.op } : item.key,
          ),
        },
      })
    },
    [config.meta_data_filter, onConfigChange],
  )

  const handleSummaryPresetChange = useCallback(
    (value: string) => {
      if (value === SummaryPreset.CUSTOM) return
      const preset = value as Exclude<SummaryPreset, SummaryPreset.CUSTOM>
      const next = SUMMARY_PRESET_MAP[preset]
      onConfigChange({
        llm_setting: {
          ...(config.llm_setting || {}),
          temperature: next.temperature,
          top_p: next.top_p,
          presence_penalty: next.presence_penalty,
          frequency_penalty: next.frequency_penalty,
        },
      })
    },
    [config.llm_setting, onConfigChange],
  )

  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelLoading(true)
        setModelError(undefined)

        const response = await llmAPI.list({ available: true })
        const providers = Object.entries(
          response as Record<string, unknown>,
        ).reduce<MyLLMProvider>((acc, [providerName, providerValue]) => {
          const payload = providerValue as RawProviderPayload | RawModelItem[]
          const llmList = Array.isArray(payload) ? payload : payload?.llm || []
          const llm = llmList
            .filter((model) => {
              const modelType = model.mdl_type || model.type
              return (
                isEnabledRawModel(model) &&
                (modelType === 'chat' || modelType === 'image2text') &&
                !!(model.llm_name || model.name || model.id)
              )
            })
            .map((model) => ({
              type: (model.mdl_type || model.type) as 'chat' | 'image2text',
              name: model.llm_name || model.name || model.id || '',
              used_token: model.used_token || 0,
              status: model.status as '0' | '1' | undefined,
              available: model.available,
            }))

          if (llm.length) {
            acc[providerName] = {
              tags: Array.isArray(payload) ? '' : payload.tags || '',
              llm,
            }
          }

          return acc
        }, {})

        const allModels = Object.entries(
          response as Record<string, unknown>,
        ).flatMap(([providerName, providerValue]) => {
          const payload = providerValue as RawProviderPayload | RawModelItem[]
          const llmList = Array.isArray(payload) ? payload : payload?.llm || []
          return llmList
            .filter((model) => isEnabledRawModel(model))
            .map(
              (model): LLMModel => ({
                id:
                  model.id ||
                  `${model.llm_name || model.name || 'model'}@${providerName}`,
                llm_name: model.llm_name || model.name || model.id || '',
                fid: providerName,
                mdl_type: (model.mdl_type ||
                  model.type ||
                  'chat') as LLMModel['mdl_type'],
                available: model.available !== false,
                status: model.status,
                name: model.name,
              }),
            )
        })

        const idToNameMap: Record<string, string> = {}
        allModels.forEach((model) => {
          if (model.mdl_type !== 'chat' && model.mdl_type !== 'image2text')
            return
          const modelName = model.llm_name || model.name || model.id
          if (!modelName) return
          idToNameMap[model.id || modelName] = modelName
        })

        setRerankModels(
          allModels.filter((model) => model.mdl_type === 'rerank'),
        )
        setChatModelProviders(providers)
        setChatModelNameById(idToNameMap)
      } catch {
        setModelError('模型列表加载失败')
      } finally {
        setModelLoading(false)
      }
    }

    if (open) {
      loadModels()
    }
  }, [open])

  if (!open) return null

  return (
    <aside className="px-space-base py-space-sm shadow-elevation-high relative z-20 w-[380px] shrink-0 border-l border-border-default bg-background-surface xl:w-[420px]">
      <div className="px-space-sm py-space-base flex h-full min-h-0 flex-col bg-background-surface">
        <div className="gap-space-sm flex shrink-0 items-center justify-between">
          <h3 className="text-base font-semibold text-text-primary">
            搜索设置
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            title="收起配置"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-space-lg pr-space-xs min-h-0 flex-1 overflow-y-auto">
          <section className="pb-space-lg space-y-4">
            <div className="space-y-space-sm">
              <Label className="text-sm">头像</Label>
              <AvatarUpload
                value={avatar}
                onChange={(value) => onBasicInfoChange({ avatar: value })}
                tips="你可以上传4MB的文件"
                size={64}
              />
            </div>

            <div className="space-y-space-sm">
              <Label className="text-sm">
                <span className="mr-1 text-status-error">*</span>
                姓名
              </Label>
              <Input
                value={name}
                onChange={(event) =>
                  onBasicInfoChange({ name: event.target.value })
                }
                placeholder="请输入名称"
                className="h-11"
              />
            </div>

            <div className="space-y-space-sm">
              <Label className="text-sm">描述</Label>
              <Textarea
                value={description || ''}
                onChange={(event) =>
                  onBasicInfoChange({ description: event.target.value })
                }
                placeholder="请输入描述"
                rows={3}
                className="resize-none"
              />
            </div>
          </section>

          <Separator className="my-space-sm" />

          <section className="py-space-lg space-y-4">
            <KnowledgeBaseSelector
              selectedIds={config.kb_ids}
              onChange={(kbIds) => onConfigChange({ kb_ids: kbIds })}
              knowledgeBases={knowledgeBases}
              label="知识库"
            />

            <MetadataFilter
              mode={metadataMode}
              onModeChange={handleMetadataModeChange}
              value={metadataCondition}
              onChange={handleMetadataConditionChange}
              metadataFields={metadataFields}
              semiAutoFields={metadataSemiAutoFields}
              onSemiAutoFieldsChange={handleMetadataSemiAutoFieldsChange}
              enabledModes={['disabled', 'auto', 'semi_auto', 'manual']}
            />
          </section>

          <Separator className="my-space-sm" />

          <section className="py-space-lg space-y-4">
            <SliderWithInput
              label="相似度阈值"
              tooltip="只有相似度高于此阈值的内容才会被检索。"
              value={config.similarity_threshold}
              onChange={(value) =>
                onConfigChange({ similarity_threshold: value })
              }
              min={0}
              max={1}
              step={0.01}
              precision={2}
              showSwitch={false}
            />

            <div className="space-y-space-sm">
              <SliderWithInput
                label="向量相似度权重"
                tooltip="向量召回与全文召回的融合权重。"
                value={config.vector_similarity_weight}
                onChange={(value) =>
                  onConfigChange({ vector_similarity_weight: value })
                }
                min={0}
                max={1}
                step={0.01}
                precision={2}
                showSwitch={false}
              />
              <div className="px-space-xs flex items-center justify-between text-xs text-text-secondary">
                <span>vector {config.vector_similarity_weight.toFixed(2)}</span>
                <span>
                  full-text {(1 - config.vector_similarity_weight).toFixed(2)}
                </span>
              </div>
            </div>

            <SliderWithInput
              label="Top K"
              tooltip="单轮检索返回的最大片段数。"
              value={config.top_k}
              onChange={(value) => onConfigChange({ top_k: value })}
              min={1}
              max={128}
              step={1}
              precision={0}
              showSwitch={false}
            />
          </section>

          <Separator className="my-space-sm" />

          <section className="py-space-lg space-y-4">
            <ToggleRow
              label="AI 总结"
              checked={config.summary}
              onCheckedChange={(checked) =>
                onConfigChange({ summary: checked })
              }
            />

            {config.summary ? (
              <div className="pl-space-xs space-y-4">
                <div className="space-y-space-sm">
                  <Label className="text-sm">模型</Label>
                  <ChatModelSelector
                    models={chatModelProviders}
                    selectedModelName={selectedSummaryModelName}
                    onSelect={(modelName) => {
                      if (!modelName) {
                        onConfigChange({
                          chat_id: undefined,
                          llm_id: undefined,
                        })
                        return
                      }
                      onConfigChange({ chat_id: modelName, llm_id: modelName })
                    }}
                    loading={modelLoading}
                    error={modelError}
                    variant="compact"
                    triggerClassName="w-full justify-between"
                  />
                </div>

                <div className="space-y-space-sm">
                  <Label className="text-sm">自由度</Label>
                  <Select
                    value={summaryPreset}
                    onValueChange={handleSummaryPresetChange}
                  >
                    <SelectTrigger className="rounded-radius-lg h-11 w-full">
                      <SelectValue placeholder="请选择" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SummaryPreset.PRECISE}>
                        精准（低随机）
                      </SelectItem>
                      <SelectItem value={SummaryPreset.BALANCED}>
                        平衡（推荐）
                      </SelectItem>
                      <SelectItem value={SummaryPreset.CREATIVE}>
                        创意（高发散）
                      </SelectItem>
                      <SelectItem value={SummaryPreset.CUSTOM}>
                        自定义
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SliderWithInput
                  label="温度"
                  tooltip="控制输出随机性，值越高越有创造性。"
                  value={getLLMValue('temperature')}
                  onChange={(value) =>
                    updateLLMField('temperature', true, value)
                  }
                  enabled={config.llm_setting?.temperature !== undefined}
                  onEnabledChange={(enabled) =>
                    updateLLMField(
                      'temperature',
                      enabled,
                      getLLMValue('temperature'),
                    )
                  }
                  min={0}
                  max={2}
                  step={0.01}
                  precision={2}
                />

                <SliderWithInput
                  label="Top P"
                  tooltip="控制输出词汇的采样范围。"
                  value={getLLMValue('top_p')}
                  onChange={(value) => updateLLMField('top_p', true, value)}
                  enabled={config.llm_setting?.top_p !== undefined}
                  onEnabledChange={(enabled) =>
                    updateLLMField('top_p', enabled, getLLMValue('top_p'))
                  }
                  min={0}
                  max={1}
                  step={0.01}
                  precision={2}
                />

                <SliderWithInput
                  label="存在处罚"
                  tooltip="降低模型重复提及同一主题的概率。"
                  value={getLLMValue('presence_penalty')}
                  onChange={(value) =>
                    updateLLMField('presence_penalty', true, value)
                  }
                  enabled={config.llm_setting?.presence_penalty !== undefined}
                  onEnabledChange={(enabled) =>
                    updateLLMField(
                      'presence_penalty',
                      enabled,
                      getLLMValue('presence_penalty'),
                    )
                  }
                  min={0}
                  max={2}
                  step={0.01}
                  precision={2}
                />

                <SliderWithInput
                  label="频率惩罚"
                  tooltip="降低模型重复使用相同词语的概率。"
                  value={getLLMValue('frequency_penalty')}
                  onChange={(value) =>
                    updateLLMField('frequency_penalty', true, value)
                  }
                  enabled={config.llm_setting?.frequency_penalty !== undefined}
                  onEnabledChange={(enabled) =>
                    updateLLMField(
                      'frequency_penalty',
                      enabled,
                      getLLMValue('frequency_penalty'),
                    )
                  }
                  min={0}
                  max={2}
                  step={0.01}
                  precision={2}
                />
              </div>
            ) : null}

            <ToggleRow
              label="相关问题推荐"
              checked={config.related_search}
              onCheckedChange={(checked) =>
                onConfigChange({ related_search: checked })
              }
            />
            <ToggleRow
              label="查询思维导图"
              checked={!!config.query_mindmap}
              onCheckedChange={(checked) =>
                onConfigChange({ query_mindmap: checked })
              }
            />
            <ToggleRow
              label="知识图谱增强"
              checked={config.use_kg}
              onCheckedChange={(checked) => onConfigChange({ use_kg: checked })}
            />

            <div className="space-y-space-sm">
              <Label className="text-sm">
                跨语言翻译
                {(config.cross_languages?.length || 0) > 0 ? (
                  <span className="ml-space-xs rounded-radius-full px-space-sm bg-background-subtle py-0.5 text-xs text-text-secondary">
                    {config.cross_languages?.length}种语言
                  </span>
                ) : null}
              </Label>
              <MultiSelectWithSearch
                options={CROSS_LANGUAGE_OPTIONS}
                value={config.cross_languages || []}
                onChange={(languages) =>
                  onConfigChange({ cross_languages: languages })
                }
                placeholder="选择翻译语言..."
                emptyText="暂无语言"
                allowClear
                maxDisplayItems={100}
                triggerClassName="min-h-10 bg-components-input-bg hover:bg-components-input-bg-hover focus-visible:border-components-input-border-focus focus-visible:bg-components-input-bg-focus focus-visible:ring-state-focus-subtle"
              />
              <p className="text-xs text-text-tertiary">
                将问题翻译成选中的语言进行检索，提高多语言内容匹配率
              </p>
            </div>
          </section>

          <Separator className="my-space-sm" />

          <section className="py-space-lg space-y-4">
            <ToggleRow
              label="rerank 模型"
              checked={config.use_rerank}
              onCheckedChange={(checked) =>
                onConfigChange({
                  use_rerank: checked,
                  rerank_id: checked ? config.rerank_id : '',
                })
              }
            />

            {config.use_rerank ? (
              <RerankModelSelector
                models={rerankModels}
                loading={modelLoading}
                error={modelError}
                selectedModelId={config.rerank_id || null}
                onSelect={(modelId) =>
                  onConfigChange({ rerank_id: modelId || '' })
                }
              />
            ) : null}
          </section>
        </div>

        <div className="mt-space-base pt-space-sm">
          <Button
            className="w-full"
            onClick={onSave}
            disabled={isSaving || !isDirty}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            保存配置
          </Button>
        </div>
      </div>
    </aside>
  )
}

export default memo(SearchSettingsSheet)
