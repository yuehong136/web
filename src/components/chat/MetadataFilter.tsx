import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { MetadataCondition, MetadataFilterCondition } from '@/types/api'

// 比较操作符选项
export const ComparisonOperators = [
  { value: 'is', labelKey: 'knowledge.search.metadataFilter.operators.is' },
  {
    value: 'not is',
    labelKey: 'knowledge.search.metadataFilter.operators.not is',
  },
  {
    value: 'contains',
    labelKey: 'knowledge.search.metadataFilter.operators.contains',
  },
  {
    value: 'not contains',
    labelKey: 'knowledge.search.metadataFilter.operators.not contains',
  },
  {
    value: 'start with',
    labelKey: 'knowledge.search.metadataFilter.operators.start with',
  },
  {
    value: 'end with',
    labelKey: 'knowledge.search.metadataFilter.operators.end with',
  },
  {
    value: 'empty',
    labelKey: 'knowledge.search.metadataFilter.operators.empty',
  },
  {
    value: 'not empty',
    labelKey: 'knowledge.search.metadataFilter.operators.not empty',
  },
  { value: '>', labelKey: 'knowledge.search.metadataFilter.operators.>' },
  { value: '<', labelKey: 'knowledge.search.metadataFilter.operators.<' },
  { value: '≥', labelKey: 'knowledge.search.metadataFilter.operators.≥' },
  { value: '≤', labelKey: 'knowledge.search.metadataFilter.operators.≤' },
] as const

// 元数据过滤模式
export const MetadataFilterModes = [
  {
    value: 'disabled',
    labelKey: 'knowledge.search.metadataFilter.modes.disabled',
  },
  { value: 'auto', labelKey: 'knowledge.search.metadataFilter.modes.auto' },
  {
    value: 'semi_auto',
    labelKey: 'knowledge.search.metadataFilter.modes.semi_auto',
  },
  { value: 'manual', labelKey: 'knowledge.search.metadataFilter.modes.manual' },
] as const

export type MetadataFilterMode = (typeof MetadataFilterModes)[number]['value']

export interface MetadataSemiAutoField {
  key: string
  op?: string
}

interface MetadataFilterProps {
  /** 过滤模式 */
  mode: MetadataFilterMode
  /** 模式变更回调 */
  onModeChange: (mode: MetadataFilterMode) => void
  /** 元数据条件 */
  value: MetadataCondition
  /** 条件变更回调 */
  onChange: (value: MetadataCondition) => void
  /** 可选的元数据字段列表（从知识库获取） */
  metadataFields?: string[]
  /** 半自动模式下参与 LLM 生成过滤条件的字段 */
  semiAutoFields?: MetadataSemiAutoField[]
  /** 半自动字段变更回调 */
  onSemiAutoFieldsChange?: (fields: MetadataSemiAutoField[]) => void
  /** 可展示的过滤模式，默认保持旧行为 */
  enabledModes?: MetadataFilterMode[]
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 元数据过滤组件
 * 用于配置聊天时的文档元数据过滤条件
 */
export const MetadataFilter: React.FC<MetadataFilterProps> = ({
  mode,
  onModeChange,
  value,
  onChange,
  metadataFields = [],
  semiAutoFields = [],
  onSemiAutoFieldsChange,
  enabledModes = ['disabled', 'manual'],
  disabled = false,
}) => {
  const { t } = useTranslation()
  const conditions = value.conditions || []
  const logic = value.logic || 'and'
  const modeOptions = MetadataFilterModes.filter((option) =>
    enabledModes.includes(option.value),
  )
  const semiAutoOperatorOptions = [
    {
      value: '__auto__',
      labelKey: 'knowledge.search.metadataFilter.autoOperator',
    },
    ...ComparisonOperators,
  ]

  // 添加条件
  const handleAddCondition = (fieldName?: string) => {
    const newCondition: MetadataFilterCondition = {
      name: fieldName || '',
      comparison_operator: 'is',
      value: '',
    }
    onChange({
      ...value,
      conditions: [...conditions, newCondition],
    })
  }

  // 删除条件
  const handleRemoveCondition = (index: number) => {
    const newConditions = conditions.filter((_, i) => i !== index)
    onChange({
      ...value,
      conditions: newConditions,
    })
  }

  // 更新条件
  const handleUpdateCondition = (
    index: number,
    updates: Partial<MetadataFilterCondition>,
  ) => {
    const newConditions = conditions.map((cond, i) =>
      i === index ? { ...cond, ...updates } : cond,
    )
    onChange({
      ...value,
      conditions: newConditions,
    })
  }

  // 更新逻辑操作符
  const handleLogicChange = (newLogic: 'and' | 'or') => {
    onChange({
      ...value,
      logic: newLogic,
    })
  }

  // 检查操作符是否不需要值
  const isValuelessOperator = (op: string) => {
    return op === 'empty' || op === 'not empty'
  }

  const handleToggleSemiAutoField = (key: string, checked: boolean) => {
    if (!onSemiAutoFieldsChange) return

    if (checked) {
      onSemiAutoFieldsChange([...semiAutoFields, { key }])
      return
    }

    onSemiAutoFieldsChange(semiAutoFields.filter((item) => item.key !== key))
  }

  const handleSemiAutoOperatorChange = (key: string, op: string) => {
    if (!onSemiAutoFieldsChange) return

    onSemiAutoFieldsChange(
      semiAutoFields.map((item) =>
        item.key === key ? { key, ...(op === '__auto__' ? {} : { op }) } : item,
      ),
    )
  }

  return (
    <div className="space-y-4">
      {/* 模式选择 */}
      <div className="space-y-2">
        <Label
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {t('knowledge.search.metadataFilter.label')}
        </Label>
        <Select
          value={mode}
          onValueChange={(v) => onModeChange(v as MetadataFilterMode)}
          disabled={disabled}
        >
          <SelectTrigger
            className="w-full"
            style={{
              backgroundColor: 'var(--color-components-input-bg)',
              borderColor: 'var(--color-components-input-border)',
              color: 'var(--color-components-input-text)',
            }}
          >
            <SelectValue
              placeholder={t('knowledge.search.metadataFilter.selectMode')}
            />
          </SelectTrigger>
          <SelectContent>
            {modeOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mode === 'auto' && (
        <p className="text-xs text-text-tertiary">
          {t('knowledge.search.metadataFilter.autoHelp')}
        </p>
      )}

      {mode === 'semi_auto' && (
        <div className="space-y-3">
          <p className="text-xs text-text-tertiary">
            {t('knowledge.search.metadataFilter.semiAutoHelp')}
          </p>
          {metadataFields.length === 0 ? (
            <p className="text-xs text-text-tertiary">
              {t('knowledge.search.metadataFilter.noFields')}
            </p>
          ) : (
            <div className="space-y-2">
              {metadataFields.map((field) => {
                const selected = semiAutoFields.find(
                  (item) => item.key === field,
                )
                return (
                  <div
                    key={field}
                    className="gap-space-sm rounded-radius-md bg-surface-secondary px-space-sm py-space-xs flex items-center border border-border-default"
                  >
                    <label className="gap-space-xs flex min-w-0 flex-1 cursor-pointer items-center">
                      <Checkbox
                        checked={Boolean(selected)}
                        onCheckedChange={(checked) =>
                          handleToggleSemiAutoField(field, checked === true)
                        }
                        disabled={disabled}
                      />
                      <span className="truncate text-sm text-text-secondary">
                        {field}
                      </span>
                    </label>
                    <Select
                      value={selected?.op || '__auto__'}
                      onValueChange={(op) =>
                        handleSemiAutoOperatorChange(field, op)
                      }
                      disabled={disabled || !selected}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {semiAutoOperatorOptions.map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {t(op.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 手动配置模式下显示条件编辑器 */}
      {mode === 'manual' && (
        <div className="space-y-3">
          {/* 逻辑操作符选择（当有多个条件时显示） */}
          {conditions.length > 1 && (
            <div className="flex items-center gap-2">
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {t('knowledge.search.metadataFilter.logic')}
              </span>
              <Select
                value={logic}
                onValueChange={(v) => handleLogicChange(v as 'and' | 'or')}
                disabled={disabled}
              >
                <SelectTrigger
                  className="w-24"
                  style={{
                    backgroundColor: 'var(--color-components-input-bg)',
                    borderColor: 'var(--color-components-input-border)',
                    color: 'var(--color-components-input-text)',
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="and">
                    {t('knowledge.search.metadataFilter.and')}
                  </SelectItem>
                  <SelectItem value="or">
                    {t('knowledge.search.metadataFilter.or')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 条件列表 */}
          <div className="space-y-3">
            {conditions.map((condition, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 rounded-lg p-3"
                style={{
                  backgroundColor: 'var(--color-background-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                }}
              >
                {/* 字段名和删除按钮 */}
                <div className="flex items-center gap-2">
                  {metadataFields.length > 0 ? (
                    <Select
                      value={condition.name}
                      onValueChange={(v) =>
                        handleUpdateCondition(index, { name: v })
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger
                        className="flex-1"
                        style={{
                          backgroundColor: 'var(--color-components-input-bg)',
                          borderColor: 'var(--color-components-input-border)',
                          color: 'var(--color-components-input-text)',
                        }}
                      >
                        <SelectValue
                          placeholder={t(
                            'knowledge.search.metadataFilter.selectField',
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {metadataFields.map((field) => (
                          <SelectItem key={field} value={field}>
                            {field}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={condition.name}
                      onChange={(e) =>
                        handleUpdateCondition(index, { name: e.target.value })
                      }
                      placeholder={t(
                        'knowledge.search.metadataFilter.fieldName',
                      )}
                      disabled={disabled}
                      className="flex-1"
                      style={{
                        backgroundColor: 'var(--color-components-input-bg)',
                        borderColor: 'var(--color-components-input-border)',
                        color: 'var(--color-components-input-text)',
                      }}
                    />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCondition(index)}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <X
                      className="h-4 w-4"
                      style={{ color: 'var(--color-text-tertiary)' }}
                    />
                  </Button>
                </div>

                {/* 操作符选择 */}
                <Select
                  value={condition.comparison_operator}
                  onValueChange={(v) =>
                    handleUpdateCondition(index, { comparison_operator: v })
                  }
                  disabled={disabled}
                >
                  <SelectTrigger
                    className="w-full"
                    style={{
                      backgroundColor: 'var(--color-components-input-bg)',
                      borderColor: 'var(--color-components-input-border)',
                      color: 'var(--color-components-input-text)',
                    }}
                  >
                    <SelectValue
                      placeholder={t(
                        'knowledge.search.metadataFilter.selectOperator',
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {ComparisonOperators.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {t(op.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 值输入（某些操作符不需要值） */}
                {!isValuelessOperator(condition.comparison_operator) && (
                  <Input
                    value={String(condition.value || '')}
                    onChange={(e) =>
                      handleUpdateCondition(index, { value: e.target.value })
                    }
                    placeholder={t(
                      'knowledge.search.metadataFilter.inputValue',
                    )}
                    disabled={disabled}
                    style={{
                      backgroundColor: 'var(--color-components-input-bg)',
                      borderColor: 'var(--color-components-input-border)',
                      color: 'var(--color-components-input-text)',
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* 添加条件按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddCondition()}
            disabled={disabled}
            className="w-full"
            style={{
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('knowledge.search.metadataFilter.addCondition')}
          </Button>
        </div>
      )}
    </div>
  )
}

export default MetadataFilter
