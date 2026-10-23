import {
  getMetadataMode,
  toMetadataCondition,
  toMetadataSemiAutoFields,
} from './search-metadata-config'
import { ReferenceMetadataSettings } from '@/components/chat/reference-metadata-settings'
import { memo, useCallback, useMemo, type FC } from 'react'
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
import type { MetadataCondition } from '@/types/api'
import type { SearchApp, SearchConfig } from '@/types/search'
import ToggleRow from './toggle-row'
import { useTranslation } from 'react-i18next'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ContextPanel } from '@/components/patterns/context-panel'
import { useReturnFocus } from '@/components/chat/use-return-focus'
import { useSearchModels } from '../hooks/use-search-models'
import {
  SummaryPreset,
  DEFAULT_LLM_SETTING,
  SUMMARY_PRESET_MAP,
  matchSummaryPreset,
  type LLMSettingField,
} from './search-summary-presets'

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

const SearchSettingsSheet: FC<SearchSettingsSheetProps> = ({
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
  const { t } = useTranslation()
  const returnFocus = useReturnFocus()
  const {
    chatModelProviders,
    chatModelNameById,
    rerankModels,
    isPending: modelLoading,
    isError: modelsFailed,
    refetch: retryModels,
  } = useSearchModels(open)
  const modelError = modelsFailed
    ? t('searchPage.settings.modelsFailed')
    : undefined

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

  if (!open) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="h-full w-full overflow-hidden bg-background-surface p-0 sm:max-w-lg"
        {...returnFocus}
      >
        <ContextPanel
          width="full"
          title={
            <SheetTitle asChild>
              <span>{t('searchPage.settings.title')}</span>
            </SheetTitle>
          }
          description={
            <SheetDescription>
              {t('searchPage.settings.description')}
            </SheetDescription>
          }
          onClose={() => onOpenChange(false)}
          closeLabel={t('searchPage.workspace.closeSettings')}
          footer={
            <Button
              className="w-full"
              loading={isSaving}
              onClick={onSave}
              disabled={isSaving || !isDirty}
            >
              {t('searchPage.settings.save')}
            </Button>
          }
        >
          {modelsFailed && (
            <div className="mb-space-base text-sm text-text-secondary">
              {t('searchPage.settings.modelsFailed')}{' '}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void retryModels()}
              >
                {t('common.retry')}
              </Button>
            </div>
          )}
          <section className="space-y-4 pb-space-lg">
            <div className="space-y-space-sm">
              <Label className="text-sm">
                {t('searchPage.settings.avatar')}
              </Label>
              <AvatarUpload
                value={avatar}
                onChange={(value) => onBasicInfoChange({ avatar: value })}
                tips={t('searchPage.settings.uploadHint')}
                size={64}
              />
            </div>

            <div className="space-y-space-sm">
              <Label className="text-sm">
                <span className="mr-1 text-status-error">*</span>
                {t('searchPage.settings.name')}
              </Label>
              <Input
                value={name}
                onChange={(event) =>
                  onBasicInfoChange({ name: event.target.value })
                }
                placeholder={t('searchPage.settings.namePlaceholder')}
                className="h-11"
              />
            </div>

            <div className="space-y-space-sm">
              <Label className="text-sm">
                {t('searchPage.settings.descriptionLabel')}
              </Label>
              <Textarea
                value={description || ''}
                onChange={(event) =>
                  onBasicInfoChange({ description: event.target.value })
                }
                placeholder={t('searchPage.settings.descriptionPlaceholder')}
                rows={3}
                className="resize-none"
              />
            </div>
          </section>

          <Separator className="my-space-sm" />

          <section className="space-y-4 py-space-lg">
            <KnowledgeBaseSelector
              selectedIds={config.kb_ids}
              onChange={(kbIds) => onConfigChange({ kb_ids: kbIds })}
              knowledgeBases={knowledgeBases}
              label={t('searchPage.settings.knowledgeBases')}
            />

            <ReferenceMetadataSettings
              datasetIds={config.kb_ids}
              value={config.reference_metadata}
              onChange={(reference_metadata) =>
                onConfigChange({ reference_metadata })
              }
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

          <section className="space-y-4 py-space-lg">
            <SliderWithInput
              label={t('searchPage.settings.similarity')}
              tooltip={t('searchPage.settings.similarityTip')}
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
                label={t('searchPage.settings.vectorWeight')}
                tooltip={t('searchPage.settings.vectorWeightTip')}
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
              <div className="flex items-center justify-between px-space-xs text-xs text-text-secondary">
                <span>vector {config.vector_similarity_weight.toFixed(2)}</span>
                <span>
                  full-text {(1 - config.vector_similarity_weight).toFixed(2)}
                </span>
              </div>
            </div>

            <SliderWithInput
              label="Top K"
              tooltip={t('searchPage.settings.topKTip')}
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

          <section className="space-y-4 py-space-lg">
            <ToggleRow
              label={t('searchPage.settings.summary')}
              checked={config.summary}
              onCheckedChange={(checked) =>
                onConfigChange({ summary: checked })
              }
            />

            {config.summary ? (
              <div className="space-y-4 pl-space-xs">
                <div className="space-y-space-sm">
                  <Label className="text-sm">
                    {t('searchPage.settings.model')}
                  </Label>
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
                  <Label className="text-sm">
                    {t('searchPage.settings.preset')}
                  </Label>
                  <Select
                    value={summaryPreset}
                    onValueChange={handleSummaryPresetChange}
                  >
                    <SelectTrigger className="h-11 w-full rounded-radius-lg">
                      <SelectValue
                        placeholder={t('searchPage.settings.select')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SummaryPreset.PRECISE}>
                        {t('searchPage.settings.precise')}
                      </SelectItem>
                      <SelectItem value={SummaryPreset.BALANCED}>
                        {t('searchPage.settings.balanced')}
                      </SelectItem>
                      <SelectItem value={SummaryPreset.CREATIVE}>
                        {t('searchPage.settings.creative')}
                      </SelectItem>
                      <SelectItem value={SummaryPreset.CUSTOM}>
                        {t('searchPage.settings.custom')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SliderWithInput
                  label={t('searchPage.settings.temperature')}
                  tooltip={t('searchPage.settings.temperatureTip')}
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
                  tooltip={t('searchPage.settings.topPTip')}
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
                  label={t('searchPage.settings.presencePenalty')}
                  tooltip={t('searchPage.settings.presenceTip')}
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
                  label={t('searchPage.settings.frequencyPenalty')}
                  tooltip={t('searchPage.settings.frequencyTip')}
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
              label={t('searchPage.settings.relatedQuestions')}
              checked={config.related_search}
              onCheckedChange={(checked) =>
                onConfigChange({ related_search: checked })
              }
            />
            <ToggleRow
              label={t('searchPage.settings.mindmap')}
              checked={!!config.query_mindmap}
              onCheckedChange={(checked) =>
                onConfigChange({ query_mindmap: checked })
              }
            />
            <ToggleRow
              label={t('searchPage.settings.knowledgeGraph')}
              checked={config.use_kg}
              onCheckedChange={(checked) => onConfigChange({ use_kg: checked })}
            />

            <div className="space-y-space-sm">
              <Label className="text-sm">
                {t('searchPage.settings.crossLanguage')}
                {(config.cross_languages?.length || 0) > 0 ? (
                  <span className="ml-space-xs rounded-radius-full bg-background-subtle px-space-sm py-0.5 text-xs text-text-secondary">
                    {t('searchPage.settings.languageCount', {
                      count: config.cross_languages?.length ?? 0,
                    })}
                  </span>
                ) : null}
              </Label>
              <MultiSelectWithSearch
                options={CROSS_LANGUAGE_OPTIONS}
                value={config.cross_languages || []}
                onChange={(languages) =>
                  onConfigChange({ cross_languages: languages })
                }
                placeholder={t('searchPage.settings.languagePlaceholder')}
                emptyText={t('searchPage.settings.noLanguages')}
                allowClear
                maxDisplayItems={100}
                triggerClassName="min-h-10 bg-components-input-bg hover:bg-components-input-bg-hover focus-visible:border-components-input-border-focus focus-visible:bg-components-input-bg-focus focus-visible:ring-state-focus-subtle"
              />
              <p className="text-xs text-text-tertiary">
                {t('searchPage.settings.languageTip')}
              </p>
            </div>
          </section>

          <Separator className="my-space-sm" />

          <section className="space-y-4 py-space-lg">
            <ToggleRow
              label={t('searchPage.settings.rerank')}
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
        </ContextPanel>
      </SheetContent>
    </Sheet>
  )
}

export default memo(SearchSettingsSheet)
