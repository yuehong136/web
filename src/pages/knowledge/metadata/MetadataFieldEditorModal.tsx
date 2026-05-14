import React, { useState, useEffect, useCallback, memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2, HelpCircle, Settings2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { MetadataTableData } from '@/types/api'
import { MetadataManageType } from '@/types/api'

interface MetadataFieldEditorModalProps {
  /**
   * 是否显示
   */
  open: boolean
  /**
   * 关闭回调
   */
  onClose: () => void
  /**
   * 初始数据
   */
  initialData?: {
    field: string
    description?: string
    restrictDefinedValues?: boolean
    values: string[]
  }
  /**
   * 已存在的字段名列表
   */
  existingKeys?: string[]
  /**
   * 模式
   */
  mode: (typeof MetadataManageType)[keyof typeof MetadataManageType]
  /**
   * 保存回调
   */
  onSave: (data: MetadataTableData) => void
  /**
   * 是否加载中
   */
  loading?: boolean
}

// 值输入项组件
const ValueInputItem = memo(
  ({
    value,
    index,
    onChange,
    onDelete,
    onBlur,
    disabled,
    placeholder,
  }: {
    value: string
    index: number
    onChange: (index: number, value: string) => void
    onDelete: (index: number) => void
    onBlur: (index: number) => void
    disabled?: boolean
    placeholder: string
  }) => {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
          onBlur={() => onBlur(index)}
          placeholder={placeholder}
          className="flex-1"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          disabled={disabled}
          className="hover:bg-status-error/10 hover:text-status-error h-9 w-9 shrink-0 p-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    )
  },
)
ValueInputItem.displayName = 'ValueInputItem'

/**
 * Metadata 字段编辑模态框
 * 参照 ragflow 的 ManageValuesModal 设计
 */
export const MetadataFieldEditorModal: React.FC<
  MetadataFieldEditorModalProps
> = ({
  open,
  onClose,
  initialData,
  existingKeys = [],
  mode,
  onSave,
  loading = false,
}) => {
  const { t } = useTranslation()
  const isSettingMode =
    mode === MetadataManageType.SETTING ||
    mode === MetadataManageType.SINGLE_FILE_SETTING
  const isNew = !initialData?.field

  // 表单数据状态
  const [formData, setFormData] = useState<MetadataTableData>({
    field: '',
    description: '',
    values: [],
    restrictDefinedValues: false,
  })

  // 临时值列表（用于输入时的即时更新）
  const [tempValues, setTempValues] = useState<string[]>([])

  // 错误状态
  const [errors, setErrors] = useState<{
    field?: string
    values?: string
  }>({})

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          field: initialData.field,
          description: initialData.description || '',
          values: initialData.values,
          restrictDefinedValues: initialData.restrictDefinedValues || false,
        })
        setTempValues([...initialData.values])
      } else {
        setFormData({
          field: '',
          description: '',
          values: [],
          restrictDefinedValues: false,
        })
        setTempValues([])
      }
      setErrors({})
    }
  }, [open, initialData])

  // 处理字段名变化
  const handleFieldChange = useCallback(
    (value: string) => {
      // 只允许字母和下划线
      if (!/^[a-zA-Z_]*$/.test(value)) {
        return
      }

      setFormData((prev) => ({ ...prev, field: value }))

      // 检查字段名是否已存在
      if (existingKeys.includes(value)) {
        setErrors((prev) => ({
          ...prev,
          field: t('knowledge.metadata.editor.duplicateField'),
        }))
      } else {
        setErrors((prev) => ({
          ...prev,
          field: undefined,
        }))
      }
    },
    [existingKeys, t],
  )

  // 处理描述变化
  const handleDescriptionChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, description: value }))
  }, [])

  // 处理限制开关变化
  const handleRestrictChange = useCallback((checked: boolean) => {
    setFormData((prev) => ({ ...prev, restrictDefinedValues: checked }))
  }, [])

  // 处理值变化
  const handleValueChange = useCallback(
    (index: number, value: string) => {
      setTempValues((prev) => {
        // 检查值是否重复（排除当前正在编辑的项）
        const otherValues = prev.filter((_, i) => i !== index)
        if (value && otherValues.includes(value)) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            values: t('knowledge.metadata.editor.duplicateValue'),
          }))
        } else {
          setErrors((prevErrors) => ({
            ...prevErrors,
            values: undefined,
          }))
        }

        const newValues = [...prev]
        newValues[index] = value
        return newValues
      })
    },
    [t],
  )

  // 处理值输入框失焦
  const handleValueBlur = useCallback(() => {
    // 同步临时值到表单数据，并去重
    const uniqueValues = [...new Set(tempValues.filter((v) => v.trim()))]
    setFormData((prev) => ({ ...prev, values: uniqueValues }))
    setTempValues(uniqueValues)
  }, [tempValues])

  // 添加新值
  const handleAddValue = useCallback(() => {
    setTempValues((prev) => [...prev, ''])
  }, [])

  // 删除值
  const handleDeleteValue = useCallback((index: number) => {
    setTempValues((prev) => {
      const newValues = [...prev]
      newValues.splice(index, 1)
      return newValues
    })
    setFormData((prev) => {
      const newValues = [...prev.values]
      if (index < newValues.length) {
        newValues.splice(index, 1)
      }
      return { ...prev, values: newValues }
    })
  }, [])

  // 处理保存
  const handleSave = useCallback(() => {
    // 验证字段名
    if (!formData.field.trim()) {
      setErrors((prev) => ({
        ...prev,
        field: t('knowledge.metadata.editor.requiredField'),
      }))
      return
    }

    if (errors.field) {
      return
    }

    // 最终同步值并去重
    const finalValues = [...new Set(tempValues.filter((v) => v.trim()))]

    // 检查是否有重复值（最终验证）
    if (finalValues.length !== tempValues.filter((v) => v.trim()).length) {
      // 有重复值，但已经通过 Set 去重了，可以继续保存
      // 这里清除错误状态
      setErrors((prev) => ({ ...prev, values: undefined }))
    }

    // 如果当前仍有值重复错误，阻止保存
    if (errors.values) {
      return
    }

    onSave({
      ...formData,
      values: finalValues,
    })
  }, [formData, tempValues, errors.field, errors.values, onSave, t])

  // 处理关闭
  const handleClose = useCallback(() => {
    setFormData({
      field: '',
      description: '',
      values: [],
      restrictDefinedValues: false,
    })
    setTempValues([])
    setErrors({})
    onClose()
  }, [onClose])

  const title = isNew
    ? isSettingMode
      ? t('knowledge.metadata.editor.addField')
      : t('knowledge.metadata.editor.addMetadata')
    : isSettingMode
      ? t('knowledge.metadata.editor.editField')
      : t('knowledge.metadata.editor.editMetadata')

  const description = isSettingMode
    ? t('knowledge.metadata.editor.settingDescription')
    : t('knowledge.metadata.editor.valueDescription')

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent size="sm">
        {/* 头部 */}
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <Settings2 className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="max-h-[50vh] space-y-5 overflow-y-auto px-6 py-4">
          {/* 字段名显示（非编辑模式）*/}
          {!isNew && !isSettingMode && (
            <div className="bg-surface-secondary rounded-lg border border-border-default p-4">
              <span className="text-base font-medium text-text-primary">
                {formData.field}
              </span>
            </div>
          )}

          {/* 字段名输入（编辑模式）*/}
          {(isNew || isSettingMode) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-text-primary">
                {t('knowledge.metadata.editor.fieldName')}
              </Label>
              <Input
                value={formData.field}
                onChange={(e) => handleFieldChange(e.target.value)}
                placeholder={t(
                  'knowledge.metadata.editor.fieldNamePlaceholder',
                )}
                disabled={loading}
              />
              {errors.field && (
                <p className="text-status-error text-xs">{errors.field}</p>
              )}
            </div>
          )}

          {/* 描述（Setting 模式）*/}
          {isSettingMode && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium text-text-primary">
                  {t('knowledge.metadata.editor.description')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-text-tertiary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">
                        {t('knowledge.metadata.editor.descriptionTooltip')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder={t(
                  'knowledge.metadata.editor.descriptionPlaceholder',
                )}
                rows={2}
                disabled={loading}
              />
            </div>
          )}

          {/* 限制定义值开关（Setting 模式）*/}
          {isSettingMode && (
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium text-text-primary">
                  {t('knowledge.metadata.editor.restrictDefinedValues')}
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 cursor-help text-text-tertiary" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">
                        {t(
                          'knowledge.metadata.editor.restrictDefinedValuesTooltip',
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Switch
                checked={formData.restrictDefinedValues}
                onCheckedChange={handleRestrictChange}
                disabled={loading}
              />
            </div>
          )}

          {/* 值列表 */}
          {(!isSettingMode || formData.restrictDefinedValues) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-text-primary">
                  {isSettingMode
                    ? t('knowledge.metadata.editor.optionalValues')
                    : t('knowledge.metadata.editor.values')}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddValue}
                  disabled={loading}
                  className="h-7 px-2 text-text-secondary hover:text-text-primary"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t('knowledge.metadata.editor.add')}
                </Button>
              </div>

              <div className="space-y-2">
                {tempValues.length === 0 ? (
                  <div className="py-4 text-center text-sm text-text-tertiary">
                    {t('knowledge.metadata.editor.emptyValues')}
                  </div>
                ) : (
                  tempValues.map((value, index) => (
                    <ValueInputItem
                      key={index}
                      value={value}
                      index={index}
                      onChange={handleValueChange}
                      onDelete={handleDeleteValue}
                      onBlur={handleValueBlur}
                      disabled={loading}
                      placeholder={t(
                        'knowledge.metadata.editor.valuePlaceholder',
                      )}
                    />
                  ))
                )}
              </div>

              {errors.values && (
                <p className="text-status-error text-xs">{errors.values}</p>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {t('knowledge.common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading || !!errors.field || !!errors.values}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('knowledge.metadata.editor.saving')}
              </>
            ) : (
              t('knowledge.metadata.editor.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
