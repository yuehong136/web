import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { StudioPanelShell } from '@/components/patterns'
import { GenerationPresetSelector } from '@/components/chat/GenerationPresetSelector'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { SliderWithInput } from '@/components/ui/slider-with-input'
import { SLIDER_PRESETS } from '@/components/ui/slider-with-input.constants'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { KnowledgeBaseAvatar, RerankModelSelector } from '@/components/knowledge'
import { SUPPORTED_LANGUAGES } from '../constants'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import { CenterConfigSection } from './center-config-section'

interface ConfigPaneProps {
  controller: CreateAppPageController
}

const toggleRowClass = 'flex items-center justify-between gap-space-base py-space-xs'

export const ConfigPane: React.FC<ConfigPaneProps> = ({ controller }) => {
  const {
    config,
    chatModels,
    rerankModels,
    modelsLoading,
    modelsError,
    knowledgeBases,
    currentPreset,
    modelSectionExpanded,
    setModelSectionExpanded,
    knowledgeSectionExpanded,
    setKnowledgeSectionExpanded,
    advancedSectionExpanded,
    setAdvancedSectionExpanded,
    variableSectionExpanded,
    setVariableSectionExpanded,
    experienceSectionExpanded,
    setExperienceSectionExpanded,
    handleConfigChange,
    handleLLMSettingChange,
    handlePresetChange,
    handleOpenKnowledgeModal,
    handleRemoveKnowledgeBase,
    handleRemoveVariable,
    setShowVariableModal,
  } = controller

  const advancedToggles = [
    { key: 'keyword', label: '关键词分析' },
    { key: 'tts', label: '文本转语音' },
    { key: 'toc_enhance', label: '目录增强' },
    { key: 'refine_multiturn', label: '多轮对话优化' },
    { key: 'use_kg', label: '使用知识图谱' },
    { key: 'reasoning', label: '深度思考' },
  ] as const

  return (
    <StudioPanelShell
      title="应用配置"
      scrollMode="y"
      viewportClassName="overscroll-contain"
      bodyClassName="px-space-lg py-space-lg"
    >
      <CenterConfigSection
        title="模型设置"
        open={modelSectionExpanded}
        onOpenChange={setModelSectionExpanded}
      >
        <ChatModelSelector
          models={chatModels}
          selectedModelName={config.llm_id}
          onSelect={(modelName) => {
            if (modelName) {
              handleConfigChange('llm_id', modelName)
            }
          }}
          loading={modelsLoading}
          error={modelsError}
          modelTypes={['chat', 'image2text']}
        />

        <GenerationPresetSelector value={currentPreset} onChange={handlePresetChange} />

        <SliderWithInput
          className="space-y-space-sm"
          label={SLIDER_PRESETS.temperature.label}
          tooltip={SLIDER_PRESETS.temperature.tooltip}
          value={config.llm_setting.temperature ?? SLIDER_PRESETS.temperature.default}
          onChange={(value) => handleLLMSettingChange('temperature', value)}
          enabled={config.llm_setting.temperature_enabled ?? false}
          onEnabledChange={(checked) => handleLLMSettingChange('temperature_enabled', checked)}
          min={SLIDER_PRESETS.temperature.min}
          max={SLIDER_PRESETS.temperature.max}
          step={SLIDER_PRESETS.temperature.step}
          precision={SLIDER_PRESETS.temperature.precision}
        />

        <SliderWithInput
          className="space-y-space-sm"
          label={SLIDER_PRESETS.topP.label}
          tooltip={SLIDER_PRESETS.topP.tooltip}
          value={config.llm_setting.top_p ?? SLIDER_PRESETS.topP.default}
          onChange={(value) => handleLLMSettingChange('top_p', value)}
          enabled={config.llm_setting.top_p_enabled ?? false}
          onEnabledChange={(checked) => handleLLMSettingChange('top_p_enabled', checked)}
          min={SLIDER_PRESETS.topP.min}
          max={SLIDER_PRESETS.topP.max}
          step={SLIDER_PRESETS.topP.step}
          precision={SLIDER_PRESETS.topP.precision}
        />

        <SliderWithInput
          className="space-y-space-sm"
          label={SLIDER_PRESETS.presencePenalty.label}
          tooltip={SLIDER_PRESETS.presencePenalty.tooltip}
          value={config.llm_setting.presence_penalty ?? SLIDER_PRESETS.presencePenalty.default}
          onChange={(value) => handleLLMSettingChange('presence_penalty', value)}
          enabled={config.llm_setting.presence_penalty_enabled ?? false}
          onEnabledChange={(checked) => handleLLMSettingChange('presence_penalty_enabled', checked)}
          min={SLIDER_PRESETS.presencePenalty.min}
          max={SLIDER_PRESETS.presencePenalty.max}
          step={SLIDER_PRESETS.presencePenalty.step}
          precision={SLIDER_PRESETS.presencePenalty.precision}
        />

        <SliderWithInput
          className="space-y-space-sm"
          label={SLIDER_PRESETS.frequencyPenalty.label}
          tooltip={SLIDER_PRESETS.frequencyPenalty.tooltip}
          value={config.llm_setting.frequency_penalty ?? SLIDER_PRESETS.frequencyPenalty.default}
          onChange={(value) => handleLLMSettingChange('frequency_penalty', value)}
          enabled={config.llm_setting.frequency_penalty_enabled ?? false}
          onEnabledChange={(checked) => handleLLMSettingChange('frequency_penalty_enabled', checked)}
          min={SLIDER_PRESETS.frequencyPenalty.min}
          max={SLIDER_PRESETS.frequencyPenalty.max}
          step={SLIDER_PRESETS.frequencyPenalty.step}
          precision={SLIDER_PRESETS.frequencyPenalty.precision}
        />

        <SliderWithInput
          className="space-y-space-sm"
          label={SLIDER_PRESETS.maxTokens.label}
          tooltip={SLIDER_PRESETS.maxTokens.tooltip}
          value={config.llm_setting.max_tokens ?? SLIDER_PRESETS.maxTokens.default}
          onChange={(value) => handleLLMSettingChange('max_tokens', value)}
          enabled={config.llm_setting.max_tokens_enabled ?? false}
          onEnabledChange={(checked) => handleLLMSettingChange('max_tokens_enabled', checked)}
          min={SLIDER_PRESETS.maxTokens.min}
          max={SLIDER_PRESETS.maxTokens.max}
          step={SLIDER_PRESETS.maxTokens.step}
          precision={SLIDER_PRESETS.maxTokens.precision}
          inputOnly={SLIDER_PRESETS.maxTokens.inputOnly}
          inputWidth={SLIDER_PRESETS.maxTokens.inputWidth}
        />
      </CenterConfigSection>

      <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

      <CenterConfigSection
        title="知识库设置"
        open={knowledgeSectionExpanded}
        onOpenChange={setKnowledgeSectionExpanded}
        extra={(
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation()
              handleOpenKnowledgeModal()
            }}
          >
            <Plus className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
          </Button>
        )}
      >
        <div className="space-y-space-base">
          <div className="flex items-center justify-between gap-space-base">
            <span className="block text-sm font-medium text-text-primary">已添加的知识库</span>
            <Badge variant="secondary" className="shrink-0">
              {knowledgeBases.length} 个
            </Badge>
          </div>
          {knowledgeBases.length === 0 ? (
            <div className="rounded-radius-lg border border-dashed border-border-subtle bg-surface-secondary/40 px-space-base py-space-lg text-center">
              <div className="text-sm font-medium text-text-secondary">暂无添加的知识库</div>
              <div className="mt-space-xs text-xs text-text-tertiary">
                点击右上角 + 添加后，可在这里统一配置检索策略
              </div>
            </div>
          ) : (
            <div className="space-y-space-sm">
              {knowledgeBases.map((knowledgeBase) => (
                <div
                  key={knowledgeBase.id}
                  className="flex items-center justify-between rounded-radius-lg border border-border-default p-space-base"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-space-base">
                    <KnowledgeBaseAvatar
                      name={knowledgeBase.name}
                      avatar={knowledgeBase.avatar}
                      size="lg"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-text-primary">{knowledgeBase.name}</div>
                      {knowledgeBase.description ? (
                        <div className="truncate text-xs text-text-tertiary">{knowledgeBase.description}</div>
                      ) : null}
                      {knowledgeBase.embd_id ? (
                        <Badge variant="blue" className="mt-space-xs text-xs">
                          {knowledgeBase.embd_id}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemoveKnowledgeBase(knowledgeBase.id)}
                  >
                    <Trash2 className="h-4 w-4" style={{ color: 'var(--color-state-error-text)' }} />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-space-xl rounded-radius-lg bg-surface-secondary/40 px-space-lg py-space-lg">
          <div className="space-y-space-xs">
            <div className="text-sm font-semibold text-text-primary">搜索策略</div>
            <div className="text-xs text-text-tertiary">
              选择召回方式，并调整阈值、重排序范围和结果展示方式。
            </div>
          </div>

          <div className="space-y-space-lg">
            <Select
              value={config.search_mode?.type ?? 'dense'}
              onValueChange={(value) => {
                const nextSearchMode = value === 'hybrid'
                  ? {
                      type: 'hybrid' as const,
                      weight_dense: config.search_mode?.weight_dense ?? 0.7,
                      weight_sparse: config.search_mode?.weight_sparse ?? 0.3,
                    }
                  : value === 'dense'
                    ? { type: 'dense' as const }
                    : { type: 'sparse' as const }

                handleConfigChange('search_mode', nextSearchMode)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="选择搜索策略" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hybrid">混合</SelectItem>
                <SelectItem value="dense">语义</SelectItem>
                <SelectItem value="sparse">全文</SelectItem>
              </SelectContent>
            </Select>

            {config.search_mode?.type === 'hybrid' ? (
              <div className="space-y-space-lg rounded-radius-md bg-surface-primary px-space-base py-space-base">
                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">向量权重</span>
                    <span className="text-text-secondary">
                      {(config.search_mode.weight_dense ?? 0.7).toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[config.search_mode.weight_dense ?? 0.7]}
                    onValueChange={(values) => {
                      const denseWeight = Number(values[0].toFixed(2))
                      const sparseWeight = Number((1 - denseWeight).toFixed(2))
                      handleConfigChange('search_mode', {
                        type: 'hybrid',
                        weight_dense: denseWeight,
                        weight_sparse: sparseWeight,
                      })
                    }}
                  />
                </div>

                <div className="space-y-space-sm">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">全文权重（自动计算）</span>
                    <span className="text-text-secondary">
                      {(config.search_mode.weight_sparse ?? 0.3).toFixed(2)}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-radius-full bg-components-progress-bg">
                    <div
                      className="h-full rounded-radius-full bg-components-progress-fill"
                      style={{
                        width: `${((config.search_mode.weight_sparse ?? 0.3) * 100).toFixed(0)}%`,
                      }}
                    />
                  </div>
                </div>

                <div
                  className="rounded-radius-md border p-space-sm text-xs text-text-tertiary"
                  style={{
                    backgroundColor: 'var(--color-components-alert-info-bg)',
                    borderColor: 'var(--color-components-alert-info-border)',
                  }}
                >
                  向量权重 + 全文权重 = 1.00
                </div>
              </div>
            ) : null}
          </div>

          <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

          <div className="space-y-space-xl py-space-sm">
            <div className="text-base font-semibold text-text-primary">相关度控制</div>

            <div className="space-y-space-base py-space-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">相似度阈值</span>
                <span className="text-sm tabular-nums text-text-secondary">
                  {Number(config.similarity_threshold ?? 0).toFixed(2)}
                </span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[config.similarity_threshold ?? 0]}
                onValueChange={(values) => handleConfigChange('similarity_threshold', values[0])}
              />
            </div>

            <div className="space-y-space-base py-space-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">向量相似度权重</span>
                <div className="flex items-center gap-space-xs text-xs">
                  <span className="text-text-secondary">
                    vector: {Number(config.vector_similarity_weight ?? 0).toFixed(2)}
                  </span>
                  <span className="text-text-tertiary">|</span>
                  <span className="text-text-secondary">
                    full-text: {(1 - Number(config.vector_similarity_weight ?? 0)).toFixed(2)}
                  </span>
                </div>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[config.vector_similarity_weight ?? 0]}
                onValueChange={(values) => handleConfigChange('vector_similarity_weight', values[0])}
              />
            </div>
          </div>

          <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

          <div className="space-y-space-xl py-space-sm">
            <div className="text-base font-semibold text-text-primary">召回与重排</div>

            <SliderWithInput
              className="space-y-space-base py-space-sm"
              label="Top N"
              tooltip="检索返回的最大文档块数量"
              value={config.top_n}
              onChange={(value) => handleConfigChange('top_n', Math.max(1, Math.round(value)))}
              min={1}
              max={30}
              step={1}
              precision={0}
              showSwitch={false}
            />

            <div className="py-space-sm">
              <RerankModelSelector
                models={rerankModels}
                selectedModelId={config.rerank_id}
                onSelect={(modelId) => handleConfigChange('rerank_id', modelId)}
                loading={modelsLoading}
                error={modelsError}
              />
            </div>

            <SliderWithInput
              className="space-y-space-base py-space-sm"
              label="Top K"
              tooltip="重排序时考虑的最大候选数量"
              value={config.top_k}
              onChange={(value) => handleConfigChange('top_k', Math.max(1, Math.round(value)))}
              min={1}
              max={2048}
              step={1}
              precision={0}
              showSwitch={false}
              inputOnly
              inputWidth={100}
            />
          </div>

          <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

          <div className="flex items-center justify-between rounded-radius-md bg-surface-primary px-space-base py-space-sm">
            <div className="space-y-space-xs">
              <div className="text-sm font-medium text-text-primary">显示来源</div>
              <div className="text-xs text-text-tertiary">在回答中显示引用的知识片段来源</div>
            </div>
            <Switch
              checked={config.do_refer === '1'}
              onCheckedChange={(checked) => {
                handleConfigChange('do_refer', checked ? '1' : '0')
                handleConfigChange('prompt_config', {
                  ...config.prompt_config,
                  quote: checked,
                })
              }}
            />
          </div>
        </div>
      </CenterConfigSection>

      <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

      <CenterConfigSection
        title="高级设置"
        open={advancedSectionExpanded}
        onOpenChange={setAdvancedSectionExpanded}
      >
        <div className="space-y-space-sm">
          {advancedToggles.map(({ key, label }) => (
            <div key={key} className={toggleRowClass}>
              <span className="text-sm font-medium text-text-primary">{label}</span>
              <Switch
                checked={config.prompt_config[key]}
                onCheckedChange={(checked) => handleConfigChange('prompt_config', {
                  ...config.prompt_config,
                  [key]: checked,
                })}
              />
            </div>
          ))}
        </div>

        <div className="space-y-space-base">
          <span className="block text-sm font-medium text-text-primary">Tavily API Key</span>
          <Input
            type="password"
            value={config.prompt_config.tavily_api_key}
            onChange={(event) => handleConfigChange('prompt_config', {
              ...config.prompt_config,
              tavily_api_key: event.target.value,
            })}
            placeholder="用于联网搜索增强"
          />
        </div>

        <div className="space-y-space-base">
          <span className="block text-sm font-medium text-text-primary">跨语言</span>
          <div className="flex flex-wrap gap-space-sm">
            {SUPPORTED_LANGUAGES.map((language) => {
              const selected = config.prompt_config.cross_languages.includes(language.value)

              return (
                <button
                  key={language.value}
                  type="button"
                  className="rounded-radius-full px-space-base py-space-xs text-xs transition-colors"
                  style={{
                    backgroundColor: selected
                      ? 'var(--color-components-badge-info-bg)'
                      : 'var(--color-components-tag-bg)',
                    color: selected
                      ? 'var(--color-components-badge-info-text)'
                      : 'var(--color-components-tag-text)',
                    border: `1px solid ${selected
                      ? 'var(--color-components-alert-info-border)'
                      : 'var(--color-components-tag-border)'}`,
                  }}
                  onClick={() => {
                    const nextLanguages = selected
                      ? config.prompt_config.cross_languages.filter((item) => item !== language.value)
                      : [...config.prompt_config.cross_languages, language.value]

                    handleConfigChange('prompt_config', {
                      ...config.prompt_config,
                      cross_languages: nextLanguages,
                    })
                  }}
                >
                  {language.label}
                </button>
              )
            })}
          </div>
        </div>
      </CenterConfigSection>

      <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

      <CenterConfigSection
        title="变量配置"
        open={variableSectionExpanded}
        onOpenChange={setVariableSectionExpanded}
        extra={(
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              event.stopPropagation()
              setShowVariableModal(true)
            }}
          >
            <Plus className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
          </Button>
        )}
      >
        {config.prompt_config.parameters.length === 0 ? (
          <div className="py-space-base text-center text-sm text-text-tertiary">暂无变量</div>
        ) : (
          <div className="space-y-space-sm">
            {config.prompt_config.parameters.map((parameter) => (
              <div
                key={parameter.key}
                className="flex items-center justify-between rounded-radius-lg border border-border-default p-space-base"
              >
                <div className="flex items-center gap-space-sm">
                  <span className="font-medium text-text-primary">{parameter.key}</span>
                  <Badge variant={parameter.optional ? 'orange' : 'blue'}>
                    {parameter.optional ? '可选' : '必选'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveVariable(parameter.key)}
                >
                  <Trash2 className="h-4 w-4" style={{ color: 'var(--color-state-error-text)' }} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CenterConfigSection>

      <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

      <CenterConfigSection
        title="对话体验"
        open={experienceSectionExpanded}
        onOpenChange={setExperienceSectionExpanded}
      >
        <div className="space-y-space-base">
          <span className="block text-sm font-medium text-text-primary">知识库空回复</span>
          <Textarea
            rows={2}
            value={config.prompt_config.empty_response}
            onChange={(event) => handleConfigChange('prompt_config', {
              ...config.prompt_config,
              empty_response: event.target.value,
            })}
            placeholder="当知识库中未找到相关内容时的回复"
          />
        </div>

        <div className="space-y-space-base">
          <span className="block text-sm font-medium text-text-primary">开场白</span>
          <Textarea
            rows={3}
            value={config.prompt_config.prologue}
            onChange={(event) => handleConfigChange('prompt_config', {
              ...config.prompt_config,
              prologue: event.target.value,
            })}
            placeholder="设置对话开始时的问候语"
          />
        </div>
      </CenterConfigSection>
    </StudioPanelShell>
  )
}
