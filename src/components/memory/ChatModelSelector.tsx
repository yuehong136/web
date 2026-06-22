/**
 * 对话模型选择器
 * 复用 EmbeddingModelSelector 的模式，从 modelStore 获取 chat 和 image2text 类型模型
 */

import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { FormTooltip } from '@/components/ui/tooltip'
import { IconFontFill } from '@/components/ui/icon-font'
import { IconMap, LLMFactory, isLLMModelEnabled } from '@/stores/model'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { useIsDarkTheme } from '@/themes'

interface ChatModelSelectorProps {
  /** 当前选中的模型 ID（格式：modelName@providerName） */
  selectedModelId: string | null
  /** 模型选择变化回调 */
  onSelect: (modelId: string | null) => void
  /** 是否禁用 */
  disabled?: boolean
  /** 错误信息 */
  error?: string
  /** 是否显示标签 */
  showLabel?: boolean
  /** 自定义标签文本 */
  labelText?: string
  /** 提示文本 */
  tooltipText?: string
}

// 需要主题切换的厂商
const THEME_AWARE_FACTORIES: string[] = [
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

// 带图标的模型选项 Label（与系统设置页面保持一致）
function ModelOptionLabel({
  provider,
  modelName,
}: {
  provider: string
  modelName: string
}) {
  const isDark = useIsDarkTheme()
  const iconName = getIconName(provider, isDark)

  return (
    <div className="flex w-full min-w-0 items-center gap-2">
      <IconFontFill name={iconName} className="h-5 w-5 shrink-0" />
      <span className="truncate">{modelName}</span>
    </div>
  )
}

/**
 * 对话模型选择器
 * 直接从 modelStore 获取数据，与模型提供商页面的设置保持一致
 */
export function ChatModelSelector({
  selectedModelId,
  onSelect,
  disabled = false,
  error,
  showLabel = true,
  labelText,
  tooltipText,
}: ChatModelSelectorProps) {
  const { t } = useTranslation()
  const { myLLMs, isLoading } = useFetchMyLLMs()
  const resolvedLabelText = labelText ?? t('memory.fields.llm')
  const resolvedTooltipText = tooltipText ?? t('memory.fields.llmTooltip')

  // 支持的模型类型：chat 和 image2text
  const SUPPORTED_MODEL_TYPES = ['chat', 'image2text']

  // 按厂商分组选项（与系统设置页面保持一致）
  const groupedOptions = useMemo((): SelectOptionGroup[] => {
    const groups: SelectOptionGroup[] = []

    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      // 过滤出 chat 和 image2text 类型的模型
      const supportedModels = providerData.llm.filter(
        (model) =>
          SUPPORTED_MODEL_TYPES.includes(model.type) &&
          isLLMModelEnabled(model),
      )

      if (supportedModels.length > 0) {
        groups.push({
          label: providerName,
          options: supportedModels.map((model) => ({
            label: (
              <ModelOptionLabel
                provider={providerName}
                modelName={model.name}
              />
            ) as ReactNode,
            // 使用 name@provider 格式作为 value，与系统设置页面保持一致
            value: `${model.name}@${providerName}`,
          })),
        })
      }
    })

    return groups
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SUPPORTED_MODEL_TYPES 为模块级常量，引用稳定
  }, [myLLMs])

  // 构建所有支持的模型的 value 映射（用于查找匹配）
  const allModelValues = useMemo(() => {
    const values: Map<string, string> = new Map()
    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      providerData.llm
        .filter(
          (model) =>
            SUPPORTED_MODEL_TYPES.includes(model.type) &&
            isLLMModelEnabled(model),
        )
        .forEach((model) => {
          const fullValue = `${model.name}@${providerName}`
          // 存储多种可能的匹配格式
          values.set(fullValue.toLowerCase(), fullValue)
          values.set(model.name.toLowerCase(), fullValue)
        })
    })
    return values
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SUPPORTED_MODEL_TYPES 为模块级常量，引用稳定
  }, [myLLMs])

  // 规范化选中的模型 ID（匹配 API 返回格式与选择器 value 格式）
  const normalizedValue = useMemo(() => {
    if (!selectedModelId) return ''
    const lowerValue = selectedModelId.toLowerCase()
    // 直接匹配
    if (allModelValues.has(lowerValue)) {
      return allModelValues.get(lowerValue)!
    }
    // 尝试匹配（忽略大小写和连字符变化）
    for (const [key, fullValue] of allModelValues) {
      if (
        key
          .replace(/-/g, '')
          .includes(lowerValue.replace(/-/g, '').replace(/@.*$/, ''))
      ) {
        return fullValue
      }
    }
    return selectedModelId
  }, [selectedModelId, allModelValues])

  // 计算是否有可用模型
  const hasModels = groupedOptions.length > 0

  if (isLoading) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="block text-sm font-medium text-text-primary">
            {resolvedLabelText}
          </div>
        )}
        <div className="bg-surface-secondary/50 flex h-10 w-full items-center rounded-md border border-border-default px-3 py-2">
          <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-text-accent"></div>
          <span className="ml-2 text-sm text-text-tertiary">
            {t('memory.model.loading')}
          </span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="block text-sm font-medium text-text-primary">
            {resolvedLabelText}
          </div>
        )}
        <div className="bg-status-error/10 flex h-10 w-full items-center rounded-md border border-status-error px-3 py-2">
          <AlertCircle className="h-3 w-3 text-status-error" />
          <span className="ml-2 text-sm text-status-error">{error}</span>
        </div>
      </div>
    )
  }

  if (!hasModels) {
    return (
      <div className="space-y-2">
        {showLabel && (
          <div className="block text-sm font-medium text-text-primary">
            {resolvedLabelText}
          </div>
        )}
        <div className="bg-status-warning/10 flex h-10 w-full items-center rounded-md border border-status-warning px-3 py-2">
          <AlertCircle className="h-3 w-3 text-status-warning" />
          <span className="ml-2 text-sm text-status-warning">
            {t('memory.model.noChatModels')}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {showLabel && (
        <div className="mb-1 flex items-center">
          <div className="block text-sm font-medium text-text-primary">
            {resolvedLabelText}
          </div>
          {resolvedTooltipText && <FormTooltip tooltip={resolvedTooltipText} />}
        </div>
      )}

      <SelectWithSearch
        value={normalizedValue}
        options={groupedOptions}
        onChange={(value) => onSelect(value || null)}
        placeholder={t('memory.model.chatPlaceholder')}
        emptyText={t('memory.model.chatEmpty')}
        triggerClassName="h-10"
        disabled={disabled}
      />
    </div>
  )
}
