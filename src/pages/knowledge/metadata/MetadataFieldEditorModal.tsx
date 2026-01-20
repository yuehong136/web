import React, { useState, useEffect, useCallback, memo } from 'react'
import { Plus, Trash2, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  }: {
    value: string
    index: number
    onChange: (index: number, value: string) => void
    onDelete: (index: number) => void
    onBlur: (index: number) => void
    disabled?: boolean
  }) => {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(index, e.target.value)}
          onBlur={() => onBlur(index)}
          placeholder="输入值..."
          className="flex-1"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onDelete(index)}
          disabled={disabled}
          className="h-9 w-9 p-0 hover:bg-status-error/10 hover:text-status-error shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    )
  }
)
ValueInputItem.displayName = 'ValueInputItem'

/**
 * Metadata 字段编辑模态框
 * 参照 ragflow 的 ManageValuesModal 设计
 */
export const MetadataFieldEditorModal: React.FC<MetadataFieldEditorModalProps> = ({
  open,
  onClose,
  initialData,
  existingKeys = [],
  mode,
  onSave,
  loading = false,
}) => {
  const isSettingMode = mode === MetadataManageType.SETTING || mode === MetadataManageType.SINGLE_FILE_SETTING
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
          field: '字段名已存在',
        }))
      } else {
        setErrors((prev) => ({
          ...prev,
          field: undefined,
        }))
      }
    },
    [existingKeys]
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
  const handleValueChange = useCallback((index: number, value: string) => {
    setTempValues((prev) => {
      // 检查值是否重复（排除当前正在编辑的项）
      const otherValues = prev.filter((_, i) => i !== index)
      if (value && otherValues.includes(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          values: '值已存在',
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
  }, [])

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
      setErrors((prev) => ({ ...prev, field: '请输入字段名' }))
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
  }, [formData, tempValues, errors.field, errors.values, onSave])

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
      ? '字段设置'
      : '添加元数据'
    : isSettingMode
      ? '字段设置'
      : '编辑元数据'

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md p-0 gap-0">
        {/* 头部 */}
        <DialogHeader className="px-6 py-4 border-b border-border-default">
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* 内容区域 */}
        <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* 字段名显示（非编辑模式）*/}
          {!isNew && !isSettingMode && (
            <div className="p-4 bg-surface-secondary rounded-lg border border-border-default">
              <span className="text-base font-medium text-text-primary">
                {formData.field}
              </span>
            </div>
          )}

          {/* 字段名输入（编辑模式）*/}
          {(isNew || isSettingMode) && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-text-primary">
                字段名
              </Label>
              <Input
                value={formData.field}
                onChange={(e) => handleFieldChange(e.target.value)}
                placeholder="仅支持英文字母和下划线"
                disabled={loading}
              />
              {errors.field && (
                <p className="text-xs text-status-error">{errors.field}</p>
              )}
            </div>
          )}

          {/* 描述（Setting 模式）*/}
          {isSettingMode && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <Label className="text-sm font-medium text-text-primary">
                  描述
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-text-tertiary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">
                        描述此字段的用途，帮助 AI 更准确地提取元数据
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="描述此字段的含义和用途..."
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
                  限制为预定义值
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-text-tertiary cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-[200px] text-xs">
                        开启后，AI 提取的值将被限制在下方定义的可选值范围内
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
                  {isSettingMode ? '可选值' : '值'}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddValue}
                  disabled={loading}
                  className="h-7 px-2 text-text-secondary hover:text-text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加
                </Button>
              </div>

              <div className="space-y-2">
                {tempValues.length === 0 ? (
                  <div className="py-4 text-center text-sm text-text-tertiary">
                    暂无值，点击「添加」开始
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
                    />
                  ))
                )}
              </div>

              {errors.values && (
                <p className="text-xs text-status-error">{errors.values}</p>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <DialogFooter className="px-6 py-4 border-t border-border-default">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading || !!errors.field || !!errors.values}>
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                保存中...
              </>
            ) : (
              '确认'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
