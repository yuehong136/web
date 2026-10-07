import React, { useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { ChatModelSelector } from './ChatModelSelector'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'
import { MetadataFilter } from './MetadataFilter'
import { GenerationPresetSelector } from './GenerationPresetSelector'
import { SliderWithInput } from '@/components/ui/slider-with-input'
import { SLIDER_PRESETS } from '@/components/ui/slider-with-input.constants'
import { useGenerationPreset } from '@/hooks/use-generation-preset'
import type { LLMParameters } from '@/constants/llm'
import type { KnowledgeBase, LLMModel } from '@/types/api'
import type { MyLLMProvider } from '@/stores/model'
import { CROSS_LANGUAGE_OPTIONS } from './chat-settings.constants'
import type { ChatSettings, DynamicVariable } from './chat-settings.types'
import {
  ChatSettingsHeader,
  ChatSettingsSection,
  SettingLabel,
  SettingRow,
} from './chat-settings-layout'

export type { ChatSettings } from './chat-settings.types'
export { defaultChatSettings } from './chat-settings.constants'

interface ChatSettingsPanelProps {
  /** 是否显示面板 */
  open: boolean
  /** 关闭面板回调 */
  onClose: () => void
  /** 当前设置 */
  settings: ChatSettings
  /** 设置变更回调 */
  onSettingsChange: (settings: ChatSettings) => void
  /** 保存回调 */
  onSave?: () => void
  /** 是否正在保存 */
  saving?: boolean
  /** 设置是否正在加载 */
  loading?: boolean
  /** 可选的元数据字段列表 */
  metadataFields?: string[]
  /** 知识库列表 */
  knowledgeBases?: KnowledgeBase[]
  /** 重排序模型列表 (LLMModel[] 格式) */
  rerankModels?: LLMModel[]
  /** LLM 模型数据 (MyLLMProvider 格式，用于 ChatModelSelector) */
  llmModels?: MyLLMProvider
  /** 模型加载状态 */
  modelsLoading?: boolean
  /** 模型加载错误 */
  modelsError?: string
  /** 知识库加载回调 */
  onLoadKnowledgeBases?: (
    search?: string,
    page?: number,
  ) => Promise<{ kbs: KnowledgeBase[]; total: number }>
}

/**
 * 聊天设置面板
 * 参考 ragflow 的聊天设置，在右侧显示可配置的选项
 */
export const ChatSettingsPanel: React.FC<ChatSettingsPanelProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
  onSave,
  saving = false,
  loading = false,
  metadataFields = [],
  knowledgeBases = [],
  rerankModels = [],
  llmModels = {},
  modelsLoading = false,
  modelsError,
  onLoadKnowledgeBases,
}) => {
  // ========== 所有 Hooks 必须在条件返回之前 ==========
  const { t } = useTranslation()
  const [chatSettingsExpanded, setChatSettingsExpanded] = React.useState(true)
  const [basicExpanded, setBasicExpanded] = React.useState(true)
  const [promptExpanded, setPromptExpanded] = React.useState(true)
  const [modelExpanded, setModelExpanded] = React.useState(true)

  // 将 ChatSettings 中的 LLM 参数提取为 LLMParameters 对象
  const llmParameters: LLMParameters = useMemo(
    () => ({
      preset: settings.generationPreset,
      temperature: settings.temperature,
      topP: settings.topP,
      presencePenalty: settings.presencePenalty,
      frequencyPenalty: settings.frequencyPenalty,
      maxTokens: settings.maxTokens,
      temperatureEnabled: settings.temperatureEnabled,
      topPEnabled: settings.topPEnabled,
      presencePenaltyEnabled: settings.presencePenaltyEnabled,
      frequencyPenaltyEnabled: settings.frequencyPenaltyEnabled,
      maxTokensEnabled: settings.maxTokensEnabled,
    }),
    [
      settings.generationPreset,
      settings.temperature,
      settings.topP,
      settings.presencePenalty,
      settings.frequencyPenalty,
      settings.maxTokens,
      settings.temperatureEnabled,
      settings.topPEnabled,
      settings.presencePenaltyEnabled,
      settings.frequencyPenaltyEnabled,
      settings.maxTokensEnabled,
    ],
  )

  // 将 LLMParameters 更新回 ChatSettings
  const handleLLMParametersChange = useCallback(
    (params: LLMParameters) => {
      onSettingsChange({
        ...settings,
        generationPreset: params.preset,
        temperature: params.temperature,
        topP: params.topP,
        presencePenalty: params.presencePenalty,
        frequencyPenalty: params.frequencyPenalty,
        maxTokens: params.maxTokens,
        temperatureEnabled: params.temperatureEnabled,
        topPEnabled: params.topPEnabled,
        presencePenaltyEnabled: params.presencePenaltyEnabled,
        frequencyPenaltyEnabled: params.frequencyPenaltyEnabled,
        maxTokensEnabled: params.maxTokensEnabled,
      })
    },
    [settings, onSettingsChange],
  )

  // 使用 useGenerationPreset hook 管理预设和参数
  const { preset, setPreset, updateParameter } = useGenerationPreset({
    parameters: llmParameters,
    onChange: handleLLMParametersChange,
  })

  // ========== 条件返回 ==========
  if (!open) return null

  // 如果正在加载设置，显示加载状态
  if (loading) {
    return (
      <div
        className="flex h-full w-[420px] flex-col"
        style={{
          backgroundColor: 'var(--color-background-primary)',
          borderLeft: '1px solid var(--color-border-default)',
        }}
      >
        <ChatSettingsHeader onClose={onClose} />

        {/* 加载状态 */}
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p
              className="text-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {t('chat.settings.loading')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ========== 辅助函数 ==========
  // 更新单个设置项
  const updateSetting = <K extends keyof ChatSettings>(
    key: K,
    value: ChatSettings[K],
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    })
  }

  // 添加动态变量
  const addVariable = () => {
    updateSetting('variables', [
      ...settings.variables,
      { key: '', optional: false },
    ])
  }

  // 删除动态变量
  const removeVariable = (index: number) => {
    updateSetting(
      'variables',
      settings.variables.filter((_, i) => i !== index),
    )
  }

  // 更新动态变量
  const updateVariable = (index: number, updates: Partial<DynamicVariable>) => {
    updateSetting(
      'variables',
      settings.variables.map((v, i) =>
        i === index ? { ...v, ...updates } : v,
      ),
    )
  }

  return (
    <div
      className="flex h-full w-[420px] flex-col"
      style={{
        backgroundColor: 'var(--color-background-primary)',
        borderLeft: '1px solid var(--color-border-default)',
      }}
    >
      <ChatSettingsHeader onClose={onClose} />

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        {/* ========== 聊天设置（参考 ragflow） ========== */}
        <ChatSettingsSection
          title={t('chat.settings.sections.assistant')}
          open={chatSettingsExpanded}
          onOpenChange={setChatSettingsExpanded}
        >
          {/* 助理头像 */}
          <div className="space-y-2">
            <SettingLabel>{t('chat.settings.avatar')}</SettingLabel>
            <AvatarUpload
              value={settings.icon}
              onChange={(value) => updateSetting('icon', value)}
            />
          </div>

          {/* 助理姓名 */}
          <div className="space-y-2">
            <SettingLabel>
              <span className="mr-1 text-red-500">*</span>
              {t('chat.settings.name')}
            </SettingLabel>
            <Input
              value={settings.name || ''}
              onChange={(e) => updateSetting('name', e.target.value)}
              placeholder={t('chat.settings.namePlaceholder')}
              style={{
                backgroundColor: 'var(--color-components-input-bg)',
                borderColor: 'var(--color-components-input-border)',
                color: 'var(--color-components-input-text)',
              }}
            />
          </div>

          {/* 助理描述 */}
          <div className="space-y-2">
            <SettingLabel>{t('chat.settings.description')}</SettingLabel>
            <Textarea
              value={settings.description || ''}
              onChange={(e) => updateSetting('description', e.target.value)}
              placeholder={t('chat.settings.descriptionPlaceholder')}
              rows={3}
              style={{
                backgroundColor: 'var(--color-components-input-bg)',
                borderColor: 'var(--color-components-input-border)',
                color: 'var(--color-components-input-text)',
              }}
            />
          </div>

          {/* 空回复 */}
          <div className="space-y-2">
            <SettingLabel tooltip={t('chat.settings.emptyResponseTip')}>
              {t('chat.settings.emptyResponse')}
            </SettingLabel>
            <Textarea
              value={settings.emptyResponse || ''}
              onChange={(e) => updateSetting('emptyResponse', e.target.value)}
              placeholder={t('chat.settings.emptyResponsePlaceholder')}
              rows={3}
              style={{
                backgroundColor: 'var(--color-components-input-bg)',
                borderColor: 'var(--color-components-input-border)',
                color: 'var(--color-components-input-text)',
              }}
            />
          </div>

          {/* 开场白 */}
          <div className="space-y-2">
            <SettingLabel tooltip={t('chat.settings.prologueTip')}>
              {t('chat.settings.prologue')}
            </SettingLabel>
            <Textarea
              value={settings.prologue || ''}
              onChange={(e) => updateSetting('prologue', e.target.value)}
              placeholder={t('chat.settings.prologuePlaceholder')}
              rows={3}
              style={{
                backgroundColor: 'var(--color-components-input-bg)',
                borderColor: 'var(--color-components-input-border)',
                color: 'var(--color-components-input-text)',
              }}
            />
          </div>
        </ChatSettingsSection>

        <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

        {/* ========== 模型设置 ========== */}
        <ChatSettingsSection
          title={t('chat.settings.sections.model')}
          open={modelExpanded}
          onOpenChange={setModelExpanded}
        >
          {/* LLM 模型选择 - 使用 ChatModelSelector */}
          <ChatModelSelector
            models={llmModels}
            selectedModelName={settings.llmId || null}
            onSelect={(modelName) => updateSetting('llmId', modelName || '')}
            loading={modelsLoading}
            error={modelsError}
            modelTypes={['chat', 'image2text']}
          />

          {/* 生成多样性预设选择器 - 使用 useGenerationPreset hook */}
          <GenerationPresetSelector value={preset} onChange={setPreset} />

          {/* Temperature - 使用 updateParameter 自动检测预设匹配 */}
          <SliderWithInput
            label={SLIDER_PRESETS.temperature.label}
            tooltip={t('chat.llmParameters.temperatureTip')}
            value={settings.temperature}
            onChange={(value) => updateParameter('temperature', value)}
            enabled={settings.temperatureEnabled}
            onEnabledChange={(checked) =>
              updateParameter('temperatureEnabled', checked)
            }
            min={SLIDER_PRESETS.temperature.min}
            max={SLIDER_PRESETS.temperature.max}
            step={SLIDER_PRESETS.temperature.step}
            precision={SLIDER_PRESETS.temperature.precision}
          />

          {/* Top P */}
          <SliderWithInput
            label={SLIDER_PRESETS.topP.label}
            tooltip={t('chat.llmParameters.topPTip')}
            value={settings.topP}
            onChange={(value) => updateParameter('topP', value)}
            enabled={settings.topPEnabled}
            onEnabledChange={(checked) =>
              updateParameter('topPEnabled', checked)
            }
            min={SLIDER_PRESETS.topP.min}
            max={SLIDER_PRESETS.topP.max}
            step={SLIDER_PRESETS.topP.step}
            precision={SLIDER_PRESETS.topP.precision}
          />

          {/* Presence Penalty */}
          <SliderWithInput
            label={SLIDER_PRESETS.presencePenalty.label}
            tooltip={t('chat.llmParameters.presencePenaltyTip')}
            value={settings.presencePenalty}
            onChange={(value) => updateParameter('presencePenalty', value)}
            enabled={settings.presencePenaltyEnabled}
            onEnabledChange={(checked) =>
              updateParameter('presencePenaltyEnabled', checked)
            }
            min={SLIDER_PRESETS.presencePenalty.min}
            max={SLIDER_PRESETS.presencePenalty.max}
            step={SLIDER_PRESETS.presencePenalty.step}
            precision={SLIDER_PRESETS.presencePenalty.precision}
          />

          {/* Frequency Penalty */}
          <SliderWithInput
            label={SLIDER_PRESETS.frequencyPenalty.label}
            tooltip={t('chat.llmParameters.frequencyPenaltyTip')}
            value={settings.frequencyPenalty}
            onChange={(value) => updateParameter('frequencyPenalty', value)}
            enabled={settings.frequencyPenaltyEnabled}
            onEnabledChange={(checked) =>
              updateParameter('frequencyPenaltyEnabled', checked)
            }
            min={SLIDER_PRESETS.frequencyPenalty.min}
            max={SLIDER_PRESETS.frequencyPenalty.max}
            step={SLIDER_PRESETS.frequencyPenalty.step}
            precision={SLIDER_PRESETS.frequencyPenalty.precision}
          />

          {/* Max Tokens */}
          <SliderWithInput
            label={SLIDER_PRESETS.maxTokens.label}
            tooltip={t('chat.llmParameters.maxTokensTip')}
            value={settings.maxTokens}
            onChange={(value) => updateParameter('maxTokens', value)}
            enabled={settings.maxTokensEnabled}
            onEnabledChange={(checked) =>
              updateParameter('maxTokensEnabled', checked)
            }
            min={SLIDER_PRESETS.maxTokens.min}
            max={SLIDER_PRESETS.maxTokens.max}
            step={SLIDER_PRESETS.maxTokens.step}
            inputOnly={SLIDER_PRESETS.maxTokens.inputOnly}
            inputWidth={SLIDER_PRESETS.maxTokens.inputWidth}
            precision={SLIDER_PRESETS.maxTokens.precision}
          />
        </ChatSettingsSection>

        <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

        {/* ========== 基础设置 ========== */}
        <ChatSettingsSection
          title={t('chat.settings.sections.basic')}
          open={basicExpanded}
          onOpenChange={setBasicExpanded}
        >
          {/* 开关选项 */}
          <SettingRow
            label={t('chat.settings.quote')}
            tooltip={t('chat.settings.quoteTip')}
          >
            <Switch
              checked={settings.quote}
              onCheckedChange={(checked) => updateSetting('quote', checked)}
            />
          </SettingRow>

          <SettingRow
            label={t('chat.settings.keyword')}
            tooltip={t('chat.settings.keywordTip')}
          >
            <Switch
              checked={settings.keyword}
              onCheckedChange={(checked) => updateSetting('keyword', checked)}
            />
          </SettingRow>

          <SettingRow
            label={t('chat.settings.tts')}
            tooltip={t('chat.settings.ttsTip')}
          >
            <Switch
              checked={settings.tts}
              onCheckedChange={(checked) => updateSetting('tts', checked)}
            />
          </SettingRow>

          <SettingRow
            label={t('chat.settings.tocEnhance')}
            tooltip={t('chat.settings.tocEnhanceTip')}
          >
            <Switch
              checked={settings.tocEnhance}
              onCheckedChange={(checked) =>
                updateSetting('tocEnhance', checked)
              }
            />
          </SettingRow>

          <Separator
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          />

          {/* Tavily API Key */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <SettingLabel tooltip={t('chat.settings.tavilyTip')}>
                Tavily API Key
              </SettingLabel>
              <a
                href="https://app.tavily.com/home"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs"
                style={{ color: 'var(--color-text-accent)' }}
              >
                {t('chat.settings.tavilyHelp')}{' '}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Input
              type="password"
              value={settings.tavilyApiKey || ''}
              onChange={(e) => updateSetting('tavilyApiKey', e.target.value)}
              placeholder={t('chat.settings.tavilyPlaceholder')}
              style={{
                backgroundColor: 'var(--color-components-input-bg)',
                borderColor: 'var(--color-components-input-border)',
                color: 'var(--color-components-input-text)',
              }}
            />
          </div>

          <Separator
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          />

          {/* 知识库选择 - 使用新的知识库选择器 */}
          <KnowledgeBaseSelector
            selectedIds={settings.kbIds}
            knowledgeBases={knowledgeBases}
            onChange={(ids) => updateSetting('kbIds', ids)}
            onLoadMore={onLoadKnowledgeBases}
          />

          {/* 元数据过滤 */}
          <MetadataFilter
            mode={settings.metadataFilterMode}
            onModeChange={(mode) => updateSetting('metadataFilterMode', mode)}
            value={settings.metadataCondition}
            onChange={(condition) =>
              updateSetting('metadataCondition', condition)
            }
            metadataFields={metadataFields}
          />
        </ChatSettingsSection>

        <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

        {/* ========== 提示工程 ========== */}
        <ChatSettingsSection
          title={t('chat.settings.sections.prompt')}
          open={promptExpanded}
          onOpenChange={setPromptExpanded}
        >
          {/* 系统提示词 */}
          <div className="space-y-2">
            <SettingLabel>{t('chat.settings.systemPrompt')}</SettingLabel>
            <Textarea
              value={settings.systemPrompt}
              onChange={(e) => updateSetting('systemPrompt', e.target.value)}
              placeholder={t('chat.settings.systemPromptPlaceholder')}
              rows={6}
              style={{
                backgroundColor: 'var(--color-components-input-bg)',
                borderColor: 'var(--color-components-input-border)',
                color: 'var(--color-components-input-text)',
              }}
            />
          </div>

          {/* 相似度阈值 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SettingLabel tooltip={t('chat.settings.similarityThresholdTip')}>
                {t('chat.settings.similarityThreshold')}
              </SettingLabel>
              <span
                className="text-sm tabular-nums"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {settings.similarityThreshold.toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.similarityThreshold]}
              onValueChange={([value]) =>
                updateSetting('similarityThreshold', value)
              }
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          {/* 向量相似度权重 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SettingLabel
                tooltip={t('chat.settings.vectorSimilarityWeightTip')}
              >
                {t('chat.settings.vectorSimilarityWeight')}
              </SettingLabel>
              <div className="flex items-center gap-2 text-xs">
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {t('chat.settings.vectorWeight', {
                    value: settings.vectorSimilarityWeight.toFixed(2),
                  })}
                </span>
                <span style={{ color: 'var(--color-text-tertiary)' }}>|</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {t('chat.settings.fullTextWeight', {
                    value: (1 - settings.vectorSimilarityWeight).toFixed(2),
                  })}
                </span>
              </div>
            </div>
            <Slider
              value={[settings.vectorSimilarityWeight]}
              onValueChange={([value]) =>
                updateSetting('vectorSimilarityWeight', value)
              }
              min={0}
              max={1}
              step={0.01}
            />
          </div>

          {/* Top N */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SettingLabel tooltip={t('chat.settings.topNTip')}>
                Top N
              </SettingLabel>
              <span
                className="text-sm tabular-nums"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {settings.topN}
              </span>
            </div>
            <Slider
              value={[settings.topN]}
              onValueChange={([value]) => updateSetting('topN', value)}
              min={1}
              max={30}
              step={1}
            />
          </div>

          <Separator
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          />

          {/* 开关选项 */}
          <SettingRow
            label={t('chat.settings.refineMultiturn')}
            tooltip={t('chat.settings.refineMultiturnTip')}
          >
            <Switch
              checked={settings.refineMultiturn}
              onCheckedChange={(checked) =>
                updateSetting('refineMultiturn', checked)
              }
            />
          </SettingRow>

          <SettingRow
            label={t('chat.settings.useKnowledgeGraph')}
            tooltip={t('chat.settings.useKnowledgeGraphTip')}
          >
            <Switch
              checked={settings.useKnowledgeGraph}
              onCheckedChange={(checked) =>
                updateSetting('useKnowledgeGraph', checked)
              }
            />
          </SettingRow>

          <SettingRow
            label={t('chat.settings.reasoning')}
            tooltip={t('chat.settings.reasoningTip')}
          >
            <Switch
              checked={settings.reasoning}
              onCheckedChange={(checked) => updateSetting('reasoning', checked)}
            />
          </SettingRow>

          <Separator
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          />

          {/* 重排序模型 - 使用 RerankModelSelector */}
          <RerankModelSelector
            models={rerankModels}
            selectedModelId={settings.rerankId || null}
            onSelect={(modelId) => updateSetting('rerankId', modelId || '')}
            loading={modelsLoading}
            error={modelsError}
          />

          {/* Top K (当选择了重排序模型时显示) */}
          {settings.rerankId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SettingLabel tooltip={t('chat.settings.topKTip')}>
                  Top K
                </SettingLabel>
                <span
                  className="text-sm tabular-nums"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {settings.topK}
                </span>
              </div>
              <Slider
                value={[settings.topK]}
                onValueChange={([value]) => updateSetting('topK', value)}
                min={1}
                max={2048}
                step={1}
              />
            </div>
          )}

          <Separator
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          />

          {/* 跨语言 */}
          <div className="space-y-2">
            <SettingLabel tooltip={t('chat.settings.crossLanguagesTip')}>
              {t('chat.settings.crossLanguages')}
            </SettingLabel>
            <div className="flex flex-wrap gap-2">
              {CROSS_LANGUAGE_OPTIONS.map((lang) => {
                const isSelected = settings.crossLanguages.includes(lang.value)
                return (
                  <button
                    key={lang.value}
                    onClick={() => {
                      if (isSelected) {
                        updateSetting(
                          'crossLanguages',
                          settings.crossLanguages.filter(
                            (l) => l !== lang.value,
                          ),
                        )
                      } else {
                        updateSetting('crossLanguages', [
                          ...settings.crossLanguages,
                          lang.value,
                        ])
                      }
                    }}
                    className="rounded-full px-3 py-1 text-xs transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--color-components-badge-info-bg)'
                        : 'var(--color-components-tag-bg)',
                      color: isSelected
                        ? 'var(--color-components-badge-info-text)'
                        : 'var(--color-components-tag-text)',
                      border: `1px solid ${
                        isSelected
                          ? 'var(--color-components-alert-info-border)'
                          : 'var(--color-components-tag-border)'
                      }`,
                    }}
                  >
                    {t(lang.labelKey)}
                  </button>
                )
              })}
            </div>
          </div>

          <Separator
            style={{ backgroundColor: 'var(--color-border-subtle)' }}
          />

          {/* 动态变量 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <SettingLabel tooltip={t('chat.settings.variablesTip')}>
                {t('chat.settings.variables')}
              </SettingLabel>
              <Button
                variant="ghost"
                size="sm"
                onClick={addVariable}
                className="h-7 px-2"
                aria-label={t('chat.settings.addVariable')}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {settings.variables.length > 0 && (
              <div className="space-y-2">
                <div
                  className="flex gap-2 px-1 text-xs"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <span className="flex-1">
                    {t('chat.settings.variableName')}
                  </span>
                  <span className="w-16 text-center">
                    {t('chat.settings.variableOptional')}
                  </span>
                  <span className="w-8"></span>
                </div>
                {settings.variables.map((variable, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={variable.key}
                      onChange={(e) =>
                        updateVariable(index, { key: e.target.value })
                      }
                      placeholder={t('chat.settings.variableName')}
                      className="h-8 flex-1"
                      style={{
                        backgroundColor: 'var(--color-components-input-bg)',
                        borderColor: 'var(--color-components-input-border)',
                        color: 'var(--color-components-input-text)',
                      }}
                    />
                    <div className="flex w-16 justify-center">
                      <Switch
                        checked={variable.optional}
                        onCheckedChange={(checked) =>
                          updateVariable(index, { optional: checked })
                        }
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariable(index)}
                      className="h-8 w-8 p-0"
                      aria-label={t('chat.settings.removeVariable')}
                    >
                      <Trash2
                        className="h-4 w-4"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ChatSettingsSection>
      </div>

      {/* 底部按钮 */}
      <div
        className="flex items-center justify-end gap-3 p-4"
        style={{ borderTop: '1px solid var(--color-border-subtle)' }}
      >
        <Button
          variant="outline"
          onClick={onClose}
          style={{
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {t('common.cancel')}
        </Button>
        {onSave && (
          <Button
            onClick={onSave}
            disabled={saving}
            style={{
              backgroundColor: 'var(--color-components-button-primary-bg)',
              color: 'var(--color-components-button-primary-text)',
            }}
          >
            {saving ? t('common.saving') : t('common.save')}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ChatSettingsPanel
