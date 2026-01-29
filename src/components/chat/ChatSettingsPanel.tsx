import React, { useMemo, useCallback } from 'react'
import { X, Plus, ExternalLink, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { ChatModelSelector } from './ChatModelSelector'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import { KnowledgeBaseSelector } from '@/components/knowledge/KnowledgeBaseSelector'
import { MetadataFilter, type MetadataFilterMode } from './MetadataFilter'
import { GenerationPresetSelector } from './GenerationPresetSelector'
import { SliderWithInput, SLIDER_PRESETS } from '@/components/ui/slider-with-input'
import { useGenerationPreset } from '@/hooks/use-generation-preset'
import { GenerationPresetType, type LLMParameters } from '@/constants/llm'
import type { MetadataCondition, KnowledgeBase, LLMModel } from '@/types/api'
import type { MyLLMProvider } from '@/stores/model'

// 支持的语言列表
const SupportedLanguages = [
  { value: 'English', label: '英语' },
  { value: 'Chinese', label: '中文' },
  { value: 'Spanish', label: '西班牙语' },
  { value: 'French', label: '法语' },
  { value: 'German', label: '德语' },
  { value: 'Japanese', label: '日语' },
  { value: 'Korean', label: '韩语' },
  { value: 'Vietnamese', label: '越南语' },
]

// 动态变量项
interface DynamicVariable {
  key: string
  optional: boolean
}

/**
 * 聊天设置配置 - 完整版，参考 ragflow
 */
export interface ChatSettings {
  // === 聊天设置（参考 ragflow） ===
  /** 助理头像 (base64 或 URL) */
  icon?: string
  /** 助手名称 */
  name?: string
  /** 助手描述 */
  description?: string
  /** 空回复内容 */
  emptyResponse?: string
  /** 开场白 */
  prologue?: string
  
  // === 开关选项 ===
  /** 显示引用 */
  quote: boolean
  /** 关键词分析 */
  keyword: boolean
  /** 文本转语音 */
  tts: boolean
  /** 目录增强 */
  tocEnhance: boolean
  /** 多轮对话优化 */
  refineMultiturn: boolean
  /** 使用知识图谱 */
  useKnowledgeGraph: boolean
  /** 深度思考/推理 */
  reasoning: boolean
  
  // === API Key ===
  /** Tavily API Key */
  tavilyApiKey?: string
  
  // === 知识库设置 ===
  /** 选中的知识库 ID 列表 */
  kbIds: string[]
  
  // === 元数据过滤 ===
  /** 元数据过滤模式 */
  metadataFilterMode: MetadataFilterMode
  /** 元数据过滤条件 */
  metadataCondition: MetadataCondition
  
  // === 提示工程 ===
  /** 系统提示词 */
  systemPrompt: string
  /** 相似度阈值 */
  similarityThreshold: number
  /** 向量相似度权重 */
  vectorSimilarityWeight: number
  /** Top N */
  topN: number
  /** 跨语言 */
  crossLanguages: string[]
  /** 动态变量 */
  variables: DynamicVariable[]
  
  // === 重排序设置 ===
  /** 重排序模型 ID */
  rerankId?: string
  /** Top K (重排序时使用) */
  topK: number
  
  // === LLM 设置 ===
  /** LLM 模型 ID */
  llmId?: string
  /** 生成多样性预设 */
  generationPreset: GenerationPresetType
  /** Temperature */
  temperature: number
  /** Temperature 是否启用 */
  temperatureEnabled: boolean
  /** Top P */
  topP: number
  /** Top P 是否启用 */
  topPEnabled: boolean
  /** Presence Penalty */
  presencePenalty: number
  /** Presence Penalty 是否启用 */
  presencePenaltyEnabled: boolean
  /** Frequency Penalty */
  frequencyPenalty: number
  /** Frequency Penalty 是否启用 */
  frequencyPenaltyEnabled: boolean
  /** Max Tokens */
  maxTokens: number
  /** Max Tokens 是否启用 */
  maxTokensEnabled: boolean
}

/**
 * 默认聊天设置
 */
export const defaultChatSettings: ChatSettings = {
  // 聊天设置
  icon: '',
  name: '',
  description: '',
  emptyResponse: '',
  prologue: '您好，我是您的助手！有什么可以帮您的？',
  
  // 开关选项
  quote: true,
  keyword: false,
  tts: false,
  tocEnhance: false,
  refineMultiturn: true,
  useKnowledgeGraph: false,
  reasoning: false,
  
  // API Key
  tavilyApiKey: '',
  
  // 知识库
  kbIds: [],
  
  // 元数据过滤
  metadataFilterMode: 'disabled',
  metadataCondition: {
    logic: 'and',
    conditions: [],
  },
  
  // 提示工程
  systemPrompt: '',
  similarityThreshold: 0.2,
  vectorSimilarityWeight: 0.3,
  topN: 8,
  crossLanguages: [],
  variables: [],
  
  // 重排序
  rerankId: '',
  topK: 1024,
  
  // LLM 设置
  llmId: '',
  generationPreset: GenerationPresetType.Balance,
  temperature: 0.5,
  temperatureEnabled: true,
  topP: 0.85,
  topPEnabled: true,
  presencePenalty: 0.2,
  presencePenaltyEnabled: true,
  frequencyPenalty: 0.3,
  frequencyPenaltyEnabled: true,
  maxTokens: 4096,
  maxTokensEnabled: false,
}

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
  onLoadKnowledgeBases?: (search?: string, page?: number) => Promise<{ kbs: KnowledgeBase[]; total: number }>
}

/**
 * 设置项标签组件
 */
const SettingLabel: React.FC<{
  children: React.ReactNode
  tooltip?: string
  htmlFor?: string
}> = ({ children, tooltip, htmlFor }) => (
  <Label 
    htmlFor={htmlFor}
    className="text-sm font-medium cursor-pointer"
    style={{ color: 'var(--color-text-primary)' }}
    title={tooltip}
  >
    {children}
  </Label>
)

/**
 * 设置项行组件
 */
const SettingRow: React.FC<{
  label: string
  tooltip?: string
  children: React.ReactNode
  vertical?: boolean
}> = ({ label, tooltip, children, vertical = false }) => (
  <div className={vertical ? 'space-y-2' : 'flex items-center justify-between'}>
    <SettingLabel tooltip={tooltip}>{label}</SettingLabel>
    {children}
  </div>
)

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
  const [chatSettingsExpanded, setChatSettingsExpanded] = React.useState(true)
  const [basicExpanded, setBasicExpanded] = React.useState(true)
  const [promptExpanded, setPromptExpanded] = React.useState(true)
  const [modelExpanded, setModelExpanded] = React.useState(true)

  // 将 ChatSettings 中的 LLM 参数提取为 LLMParameters 对象
  const llmParameters: LLMParameters = useMemo(() => ({
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
  }), [
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
  ])

  // 将 LLMParameters 更新回 ChatSettings
  const handleLLMParametersChange = useCallback((params: LLMParameters) => {
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
  }, [settings, onSettingsChange])

  // 使用 useGenerationPreset hook 管理预设和参数
  const {
    preset,
    setPreset,
    updateParameter,
  } = useGenerationPreset({
    parameters: llmParameters,
    onChange: handleLLMParametersChange,
  })

  // ========== 条件返回 ==========
  if (!open) return null

  // 如果正在加载设置，显示加载状态
  if (loading) {
    return (
      <div 
        className="w-[420px] h-full flex flex-col"
        style={{
          backgroundColor: 'var(--color-background-primary)',
          borderLeft: '1px solid var(--color-border-default)',
        }}
      >
        {/* 头部 */}
        <div 
          className="flex items-center justify-between p-4"
          style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
        >
          <h2 
            className="text-base font-medium"
            style={{ color: 'var(--color-text-primary)' }}
          >
            聊天设置
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
          </Button>
        </div>
        
        {/* 加载状态 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              加载设置中...
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
    value: ChatSettings[K]
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
      { key: '', optional: false }
    ])
  }

  // 删除动态变量
  const removeVariable = (index: number) => {
    updateSetting('variables', settings.variables.filter((_, i) => i !== index))
  }

  // 更新动态变量
  const updateVariable = (index: number, updates: Partial<DynamicVariable>) => {
    updateSetting('variables', settings.variables.map((v, i) => 
      i === index ? { ...v, ...updates } : v
    ))
  }

  return (
    <div 
      className="w-[420px] h-full flex flex-col"
      style={{
        backgroundColor: 'var(--color-background-primary)',
        borderLeft: '1px solid var(--color-border-default)',
      }}
    >
      {/* 头部 */}
      <div 
        className="flex items-center justify-between p-4"
        style={{ borderBottom: '1px solid var(--color-border-subtle)' }}
      >
        <h2 
          className="text-base font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          聊天设置
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
        </Button>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto">
        {/* ========== 聊天设置（参考 ragflow） ========== */}
        <Collapsible open={chatSettingsExpanded} onOpenChange={setChatSettingsExpanded}>
          <CollapsibleTrigger 
            className="w-full px-4 py-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-components-collapse-header-bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              聊天设置
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              {chatSettingsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            {/* 助理头像 */}
            <div className="space-y-2">
              <SettingLabel>助理头像</SettingLabel>
              <AvatarUpload
                value={settings.icon}
                onChange={(value) => updateSetting('icon', value)}
                tips="你可以上传4MB的文件"
              />
            </div>

            {/* 助理姓名 */}
            <div className="space-y-2">
              <SettingLabel>
                <span className="text-red-500 mr-1">*</span>
                助理姓名
              </SettingLabel>
              <Input
                value={settings.name || ''}
                onChange={(e) => updateSetting('name', e.target.value)}
                placeholder="请输入助理名称"
                style={{
                  backgroundColor: 'var(--color-components-input-bg)',
                  borderColor: 'var(--color-components-input-border)',
                  color: 'var(--color-components-input-text)',
                }}
              />
            </div>

            {/* 助理描述 */}
            <div className="space-y-2">
              <SettingLabel>助理描述</SettingLabel>
              <Textarea
                value={settings.description || ''}
                onChange={(e) => updateSetting('description', e.target.value)}
                placeholder="请输入助理描述"
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
              <SettingLabel tooltip="当检索不到相关内容时，系统将返回此消息">
                空回复
              </SettingLabel>
              <Textarea
                value={settings.emptyResponse || ''}
                onChange={(e) => updateSetting('emptyResponse', e.target.value)}
                placeholder="例如：抱歉，我没有找到相关的信息"
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
              <SettingLabel tooltip="对话开始时的问候语">
                开场白
              </SettingLabel>
              <Textarea
                value={settings.prologue || ''}
                onChange={(e) => updateSetting('prologue', e.target.value)}
                placeholder="例如：您好，我是您的助手！有什么可以帮您的？"
                rows={3}
                style={{
                  backgroundColor: 'var(--color-components-input-bg)',
                  borderColor: 'var(--color-components-input-border)',
                  color: 'var(--color-components-input-text)',
                }}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

        {/* ========== 模型设置 ========== */}
        <Collapsible open={modelExpanded} onOpenChange={setModelExpanded}>
          <CollapsibleTrigger 
            className="w-full px-4 py-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-components-collapse-header-bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              模型设置
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              {modelExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
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
            <GenerationPresetSelector
              value={preset}
              onChange={setPreset}
            />

            {/* Temperature - 使用 updateParameter 自动检测预设匹配 */}
            <SliderWithInput
              label={SLIDER_PRESETS.temperature.label}
              tooltip={SLIDER_PRESETS.temperature.tooltip}
              value={settings.temperature}
              onChange={(value) => updateParameter('temperature', value)}
              enabled={settings.temperatureEnabled}
              onEnabledChange={(checked) => updateParameter('temperatureEnabled', checked)}
              min={SLIDER_PRESETS.temperature.min}
              max={SLIDER_PRESETS.temperature.max}
              step={SLIDER_PRESETS.temperature.step}
              precision={SLIDER_PRESETS.temperature.precision}
            />

            {/* Top P */}
            <SliderWithInput
              label={SLIDER_PRESETS.topP.label}
              tooltip={SLIDER_PRESETS.topP.tooltip}
              value={settings.topP}
              onChange={(value) => updateParameter('topP', value)}
              enabled={settings.topPEnabled}
              onEnabledChange={(checked) => updateParameter('topPEnabled', checked)}
              min={SLIDER_PRESETS.topP.min}
              max={SLIDER_PRESETS.topP.max}
              step={SLIDER_PRESETS.topP.step}
              precision={SLIDER_PRESETS.topP.precision}
            />

            {/* Presence Penalty */}
            <SliderWithInput
              label={SLIDER_PRESETS.presencePenalty.label}
              tooltip={SLIDER_PRESETS.presencePenalty.tooltip}
              value={settings.presencePenalty}
              onChange={(value) => updateParameter('presencePenalty', value)}
              enabled={settings.presencePenaltyEnabled}
              onEnabledChange={(checked) => updateParameter('presencePenaltyEnabled', checked)}
              min={SLIDER_PRESETS.presencePenalty.min}
              max={SLIDER_PRESETS.presencePenalty.max}
              step={SLIDER_PRESETS.presencePenalty.step}
              precision={SLIDER_PRESETS.presencePenalty.precision}
            />

            {/* Frequency Penalty */}
            <SliderWithInput
              label={SLIDER_PRESETS.frequencyPenalty.label}
              tooltip={SLIDER_PRESETS.frequencyPenalty.tooltip}
              value={settings.frequencyPenalty}
              onChange={(value) => updateParameter('frequencyPenalty', value)}
              enabled={settings.frequencyPenaltyEnabled}
              onEnabledChange={(checked) => updateParameter('frequencyPenaltyEnabled', checked)}
              min={SLIDER_PRESETS.frequencyPenalty.min}
              max={SLIDER_PRESETS.frequencyPenalty.max}
              step={SLIDER_PRESETS.frequencyPenalty.step}
              precision={SLIDER_PRESETS.frequencyPenalty.precision}
            />

            {/* Max Tokens */}
            <SliderWithInput
              label={SLIDER_PRESETS.maxTokens.label}
              tooltip={SLIDER_PRESETS.maxTokens.tooltip}
              value={settings.maxTokens}
              onChange={(value) => updateParameter('maxTokens', value)}
              enabled={settings.maxTokensEnabled}
              onEnabledChange={(checked) => updateParameter('maxTokensEnabled', checked)}
              min={SLIDER_PRESETS.maxTokens.min}
              max={SLIDER_PRESETS.maxTokens.max}
              step={SLIDER_PRESETS.maxTokens.step}
              inputOnly={SLIDER_PRESETS.maxTokens.inputOnly}
              inputWidth={SLIDER_PRESETS.maxTokens.inputWidth}
              precision={SLIDER_PRESETS.maxTokens.precision}
            />
          </CollapsibleContent>
        </Collapsible>

        <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

        {/* ========== 基础设置 ========== */}
        <Collapsible open={basicExpanded} onOpenChange={setBasicExpanded}>
          <CollapsibleTrigger 
            className="w-full px-4 py-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-components-collapse-header-bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              基础设置
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              {basicExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            {/* 开关选项 */}
            <SettingRow label="显示引用" tooltip="在回答中显示引用来源">
              <Switch
                checked={settings.quote}
                onCheckedChange={(checked) => updateSetting('quote', checked)}
              />
            </SettingRow>

            <SettingRow label="关键词分析" tooltip="分析问题中的关键词以提高检索准确性">
              <Switch
                checked={settings.keyword}
                onCheckedChange={(checked) => updateSetting('keyword', checked)}
              />
            </SettingRow>

            <SettingRow label="文本转语音" tooltip="将回答转换为语音">
              <Switch
                checked={settings.tts}
                onCheckedChange={(checked) => updateSetting('tts', checked)}
              />
            </SettingRow>

            <SettingRow label="目录增强" tooltip="使用文档目录结构增强检索">
              <Switch
                checked={settings.tocEnhance}
                onCheckedChange={(checked) => updateSetting('tocEnhance', checked)}
              />
            </SettingRow>

            <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

            {/* Tavily API Key */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <SettingLabel tooltip="用于网络搜索增强">Tavily API Key</SettingLabel>
                <a 
                  href="https://app.tavily.com/home" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs flex items-center gap-1"
                  style={{ color: 'var(--color-text-accent)' }}
                >
                  如何获取? <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <Input
                type="password"
                value={settings.tavilyApiKey || ''}
                onChange={(e) => updateSetting('tavilyApiKey', e.target.value)}
                placeholder="请输入你的 Tavily API Key"
                style={{
                  backgroundColor: 'var(--color-components-input-bg)',
                  borderColor: 'var(--color-components-input-border)',
                  color: 'var(--color-components-input-text)',
                }}
              />
            </div>

            <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

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
              onChange={(condition) => updateSetting('metadataCondition', condition)}
              metadataFields={metadataFields}
            />
          </CollapsibleContent>
        </Collapsible>

        <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

        {/* ========== 提示工程 ========== */}
        <Collapsible open={promptExpanded} onOpenChange={setPromptExpanded}>
          <CollapsibleTrigger 
            className="w-full px-4 py-3 flex items-center justify-between transition-colors"
            style={{ 
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-components-collapse-header-bg-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
              提示工程
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              {promptExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 space-y-4">
            {/* 系统提示词 */}
            <div className="space-y-2">
              <SettingLabel>系统提示词</SettingLabel>
              <Textarea
                value={settings.systemPrompt}
                onChange={(e) => updateSetting('systemPrompt', e.target.value)}
                placeholder="设置 AI 助手的行为指引..."
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
                <SettingLabel tooltip="只有相似度高于此阈值的内容才会被检索">
                  相似度阈值
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
                onValueChange={([value]) => updateSetting('similarityThreshold', value)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>

            {/* 向量相似度权重 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SettingLabel tooltip="向量搜索与全文搜索的权重分配">
                  向量相似度权重
                </SettingLabel>
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    vector: {settings.vectorSimilarityWeight.toFixed(2)}
                  </span>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>|</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    full-text: {(1 - settings.vectorSimilarityWeight).toFixed(2)}
                  </span>
                </div>
              </div>
              <Slider
                value={[settings.vectorSimilarityWeight]}
                onValueChange={([value]) => updateSetting('vectorSimilarityWeight', value)}
                min={0}
                max={1}
                step={0.01}
              />
            </div>

            {/* Top N */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SettingLabel tooltip="检索返回的最大文档块数量">Top N</SettingLabel>
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

            <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

            {/* 开关选项 */}
            <SettingRow label="多轮对话优化" tooltip="优化多轮对话的上下文理解">
              <Switch
                checked={settings.refineMultiturn}
                onCheckedChange={(checked) => updateSetting('refineMultiturn', checked)}
              />
            </SettingRow>

            <SettingRow label="使用知识图谱" tooltip="利用知识图谱增强检索和推理">
              <Switch
                checked={settings.useKnowledgeGraph}
                onCheckedChange={(checked) => updateSetting('useKnowledgeGraph', checked)}
              />
            </SettingRow>

            <SettingRow label="深度思考" tooltip="启用深度推理模式，适合复杂问题">
              <Switch
                checked={settings.reasoning}
                onCheckedChange={(checked) => updateSetting('reasoning', checked)}
              />
            </SettingRow>

            <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

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
                  <SettingLabel tooltip="重排序时考虑的最大候选数量">Top K</SettingLabel>
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

            <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

            {/* 跨语言 */}
            <div className="space-y-2">
              <SettingLabel tooltip="选择需要支持的语言，实现跨语言检索">跨语言</SettingLabel>
              <div className="flex flex-wrap gap-2">
                {SupportedLanguages.map((lang) => {
                  const isSelected = settings.crossLanguages.includes(lang.value)
                  return (
                    <button
                      key={lang.value}
                      onClick={() => {
                        if (isSelected) {
                          updateSetting('crossLanguages', 
                            settings.crossLanguages.filter(l => l !== lang.value))
                        } else {
                          updateSetting('crossLanguages', 
                            [...settings.crossLanguages, lang.value])
                        }
                      }}
                      className="px-3 py-1 text-xs rounded-full transition-colors"
                      style={{
                        backgroundColor: isSelected 
                          ? 'var(--color-components-badge-info-bg)' 
                          : 'var(--color-components-tag-bg)',
                        color: isSelected 
                          ? 'var(--color-components-badge-info-text)' 
                          : 'var(--color-components-tag-text)',
                        border: `1px solid ${isSelected 
                          ? 'var(--color-components-alert-info-border)' 
                          : 'var(--color-components-tag-border)'}`,
                      }}
                    >
                      {lang.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

            {/* 动态变量 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SettingLabel tooltip="定义可在提示词中使用的动态变量">动态变量</SettingLabel>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addVariable}
                  className="h-7 px-2"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {settings.variables.length > 0 && (
                <div className="space-y-2">
                  <div 
                    className="flex text-xs gap-2 px-1"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    <span className="flex-1">变量名</span>
                    <span className="w-16 text-center">可选</span>
                    <span className="w-8"></span>
                  </div>
                  {settings.variables.map((variable, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        value={variable.key}
                        onChange={(e) => updateVariable(index, { key: e.target.value })}
                        placeholder="变量名"
                        className="flex-1 h-8"
                        style={{
                          backgroundColor: 'var(--color-components-input-bg)',
                          borderColor: 'var(--color-components-input-border)',
                          color: 'var(--color-components-input-text)',
                        }}
                      />
                      <div className="w-16 flex justify-center">
                        <Switch
                          checked={variable.optional}
                          onCheckedChange={(checked) => updateVariable(index, { optional: checked })}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariable(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
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
          取消
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
            {saving ? '保存中...' : '保存'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ChatSettingsPanel
