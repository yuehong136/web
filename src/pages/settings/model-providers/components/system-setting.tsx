import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { FormTooltip } from '@/components/ui/tooltip'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { IconMap, LLMFactory, isLLMModelEnabled } from '@/stores/model'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { authAPI } from '@/api/auth'
import { toast } from '@/lib/toast'
import { IconFontFill } from '@/components/ui/icon-font'
import { useIsDarkTheme } from '@/themes'

interface TenantInfo {
  tenant_id: string
  name: string
  llm_id: string
  embd_id: string
  img2txt_id: string
  asr_id: string
  rerank_id: string
  tts_id: string
}

const MODEL_TYPES = {
  llm_id: {
    label: 'LLM',
    types: ['chat'],
    tooltip: '所有新创建的知识库都会使用默认的聊天模型。',
    required: true,
  },
  embd_id: {
    label: 'Embedding',
    types: ['embedding'],
    tooltip:
      '所有新创建的知识库使用的默认嵌入模型。如未显示可选模型，请检查你是否在使用 MultiRAG slim 版(不含嵌入模型)；或确认你的模型供应商是否提供该模型。',
  },
  img2txt_id: {
    label: 'VLM',
    types: ['image2text'],
    tooltip:
      '所有新创建的知识库都将使用默认的 VLM 模型。它可以描述图片或视频。如未显示可选模型，请确认你的模型供应商是否提供该模型。',
  },
  asr_id: {
    label: 'ASR',
    types: ['speech2text'],
    tooltip:
      '所有新创建的知识库都将使用默认的 ASR 模型。使用此模型将语音翻译为相应的文本。如未显示可选模型，请确认你的模型供应商是否提供该模型。',
  },
  rerank_id: {
    label: 'Rerank',
    types: ['rerank'],
    tooltip:
      '默认的 reranking 模型。如未显示可选模型，请确认你的模型供应商是否提供该模型。',
  },
  tts_id: {
    label: 'TTS',
    types: ['tts'],
    tooltip:
      '默认的 TTS 模型会被用于在对话过程中请求语音生成时使用。如未显示可选模型，请确认你的模型供应商是否提供该模型。',
  },
} as const

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

export const SystemSetting: React.FC = () => {
  const { myLLMs } = useFetchMyLLMs()
  const _isDark = useIsDarkTheme()
  const [tenantInfo, setTenantInfo] = useState<TenantInfo>({
    tenant_id: '',
    name: '',
    llm_id: '',
    embd_id: '',
    img2txt_id: '',
    asr_id: '',
    rerank_id: '',
    tts_id: '',
  })

  // 从后端获取系统设置
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await authAPI.getTenantInfo()
        if (response) {
          setTenantInfo({
            tenant_id: response.tenant_id || '',
            name: response.name || '',
            llm_id: response.llm_id || '',
            embd_id: response.embd_id || '',
            img2txt_id: response.img2txt_id || '',
            asr_id: response.asr_id || '',
            rerank_id: response.rerank_id || '',
            tts_id: response.tts_id || '',
          })
        }
      } catch (error) {
        console.error('Failed to fetch tenant info:', error)
      }
    }
    fetchSettings()
  }, [])

  // 构建所有模型的 value 映射（用于查找匹配）
  const allModelValues = useMemo(() => {
    const values: Map<string, string> = new Map()
    Object.entries(myLLMs).forEach(([providerName, providerData]) => {
      providerData.llm.forEach((model) => {
        if (!isLLMModelEnabled(model)) return
        const fullValue = `${model.name}@${providerName}`
        // 存储多种可能的匹配格式
        values.set(fullValue.toLowerCase(), fullValue)
        values.set(model.name.toLowerCase(), fullValue)
      })
    })
    return values
  }, [myLLMs])

  // 规范化已选择的值（匹配 API 返回格式）
  const normalizeValue = useCallback(
    (value: string): string => {
      if (!value) return ''
      // 直接匹配
      const lowerValue = value.toLowerCase()
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
      return value
    },
    [allModelValues],
  )

  // 根据模型类型构建分组选项列表（按厂商分组，带图标）
  const getGroupedOptionsForType = useCallback(
    (types: string[]): SelectOptionGroup[] => {
      const groups: SelectOptionGroup[] = []

      Object.entries(myLLMs).forEach(([providerName, providerData]) => {
        const matchingModels = providerData.llm.filter(
          (model) => types.includes(model.type) && isLLMModelEnabled(model),
        )

        if (matchingModels.length > 0) {
          groups.push({
            // 分组标题：纯文字厂商名称（与 ragflow 一致）
            label: providerName,
            options: matchingModels.map((model) => ({
              // 选项：模型名称（带图标）
              label: (
                <ModelOptionLabel
                  provider={providerName}
                  modelName={model.name}
                />
              ),
              value: `${model.name}@${providerName}`, // 与 ragflow 格式一致
              disabled: false,
            })),
          })
        }
      })

      return groups
    },
    [myLLMs],
  )

  // 为每种模型类型生成分组选项
  const modelOptions = useMemo(() => {
    return {
      llm_id: getGroupedOptionsForType(['chat', 'image2text']),
      embd_id: getGroupedOptionsForType(['embedding']),
      img2txt_id: getGroupedOptionsForType(['image2text']),
      asr_id: getGroupedOptionsForType(['speech2text']),
      rerank_id: getGroupedOptionsForType(['rerank']),
      tts_id: getGroupedOptionsForType(['tts']),
    }
  }, [getGroupedOptionsForType])

  // 处理字段变更并保存（传递完整的设置对象）
  const handleFieldChange = useCallback(
    async (field: keyof TenantInfo, value: string) => {
      const updatedInfo = { ...tenantInfo, [field]: value || '' }
      setTenantInfo(updatedInfo)

      try {
        // 传递完整的设置对象，与 ragflow 一致
        await authAPI.updateTenantInfo({
          tenant_id: updatedInfo.tenant_id,
          name: updatedInfo.name,
          llm_id: updatedInfo.llm_id,
          embd_id: updatedInfo.embd_id,
          img2txt_id: updatedInfo.img2txt_id,
          asr_id: updatedInfo.asr_id,
          rerank_id: updatedInfo.rerank_id,
          tts_id: updatedInfo.tts_id,
        })
        toast.success('已更新')
      } catch (error) {
        console.error('Failed to save settings:', error)
        toast.error('保存设置失败')
      }
    },
    [tenantInfo],
  )

  return (
    <div className="w-full rounded-lg">
      {/* 标题 */}
      <div className="flex flex-col py-4">
        <h2 className="text-2xl font-medium text-text-primary">设置默认模型</h2>
        <p className="mt-1 text-sm text-text-secondary">
          请在开始之前完成这些设置
        </p>
      </div>

      {/* 设置表单 */}
      <div className="max-h-[70vh] space-y-6 overflow-y-auto rounded-lg border border-border-subtle px-7 py-6">
        {(Object.keys(MODEL_TYPES) as Array<keyof typeof MODEL_TYPES>).map(
          (field) => {
            const config = MODEL_TYPES[field]
            const options = modelOptions[field]
            // 使用规范化的值进行匹配
            const currentValue = normalizeValue(tenantInfo[field])

            return (
              <div key={field} className="flex gap-3">
                {/* 标签 */}
                <label className="flex w-1/4 shrink-0 items-center text-sm font-normal text-text-secondary">
                  {'required' in config && config.required && (
                    <span className="text-red-500">*</span>
                  )}
                  {config.label}
                  <FormTooltip tooltip={config.tooltip} />
                </label>

                {/* 选择器 */}
                <SelectWithSearch
                  triggerClassName="w-3/4 flex items-center"
                  value={currentValue}
                  options={options}
                  onChange={(value) => handleFieldChange(field, value)}
                  placeholder="请选择模型"
                  emptyText="暂无可用模型，请先添加模型供应商"
                  allowClear={field !== 'llm_id'}
                />
              </div>
            )
          },
        )}
      </div>
    </div>
  )
}
