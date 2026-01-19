import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

// 表单验证 schema
const metadataFieldSchema = z.object({
  key: z
    .string()
    .min(1, '字段名不能为空')
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, '字段名只能包含英文字母、数字和下划线，且不能以数字开头'),
  description: z.string().optional(),
  restrictDefinedValues: z.boolean().optional(),
  values: z.array(z.string()),
})

type MetadataFieldFormData = z.infer<typeof metadataFieldSchema>

interface MetadataFieldFormProps {
  /**
   * 初始数据
   */
  initialData?: {
    key: string
    description?: string
    restrictDefinedValues?: boolean
    values: string[]
  }
  /**
   * 已存在的字段名列表（用于验证重复）
   */
  existingKeys?: string[]
  /**
   * 是否允许编辑字段名
   */
  allowEditKey?: boolean
  /**
   * 是否显示描述字段
   */
  showDescription?: boolean
  /**
   * 是否显示限制开关
   */
  showRestrictSwitch?: boolean
  /**
   * 是否允许添加值
   */
  allowAddValue?: boolean
  /**
   * 提交回调
   */
  onSubmit: (data: MetadataFieldFormData) => void
  /**
   * 取消回调
   */
  onCancel: () => void
  /**
   * 是否加载中
   */
  loading?: boolean
  /**
   * 自定义类名
   */
  className?: string
}

/**
 * Metadata 字段编辑表单组件
 * 用于创建或编辑单个 metadata 字段定义
 */
export const MetadataFieldForm: React.FC<MetadataFieldFormProps> = ({
  initialData,
  existingKeys = [],
  allowEditKey = true,
  showDescription = true,
  showRestrictSwitch = true,
  allowAddValue = true,
  onSubmit,
  onCancel,
  loading = false,
  className,
}) => {
  const form = useForm<MetadataFieldFormData>({
    resolver: zodResolver(metadataFieldSchema),
    defaultValues: {
      key: initialData?.key || '',
      description: initialData?.description || '',
      restrictDefinedValues: initialData?.restrictDefinedValues ?? false,
      values: initialData?.values || [],
    },
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form
  const values = watch('values')
  const restrictDefinedValues = watch('restrictDefinedValues')

  // 添加新值
  const handleAddValue = () => {
    setValue('values', [...values, ''])
  }

  // 更新值
  const handleValueChange = (index: number, newValue: string) => {
    const newValues = [...values]
    newValues[index] = newValue
    setValue('values', newValues)
  }

  // 删除值
  const handleRemoveValue = (index: number) => {
    const newValues = values.filter((_, i) => i !== index)
    setValue('values', newValues)
  }

  // 提交处理
  const handleFormSubmit = (data: MetadataFieldFormData) => {
    // 检查字段名是否重复
    if (
      allowEditKey &&
      existingKeys.includes(data.key) &&
      data.key !== initialData?.key
    ) {
      form.setError('key', { message: '字段名已存在' })
      return
    }
    // 过滤空值
    const filteredData = {
      ...data,
      values: data.values.filter((v) => v.trim() !== ''),
    }
    onSubmit(filteredData)
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className={cn('flex flex-col gap-space-md', className)}
    >
      {/* 字段名 */}
      <div className="flex flex-col gap-space-xs">
        <Label htmlFor="key">字段名</Label>
        {allowEditKey ? (
          <>
            <Input
              id="key"
              {...register('key')}
              placeholder="请输入字段名（仅英文字母和下划线）"
              disabled={loading}
            />
            {errors.key && (
              <span className="text-status-error text-body-sm">
                {errors.key.message}
              </span>
            )}
          </>
        ) : (
          <div className="px-space-base py-space-sm bg-surface-secondary rounded-radius-md text-text-primary">
            {initialData?.key}
          </div>
        )}
      </div>

      {/* 描述 */}
      {showDescription && (
        <div className="flex flex-col gap-space-xs">
          <Label htmlFor="description">描述</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="请输入字段描述"
            rows={2}
            disabled={loading}
          />
        </div>
      )}

      {/* 限制开关 */}
      {showRestrictSwitch && (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-space-xs">
            <Label>限制为预定义值</Label>
            <span className="text-text-secondary text-body-sm">
              开启后，用户只能从预定义值中选择
            </span>
          </div>
          <Switch
            checked={restrictDefinedValues}
            onCheckedChange={(checked) =>
              setValue('restrictDefinedValues', checked)
            }
            disabled={loading}
          />
        </div>
      )}

      {/* 值列表 */}
      {(restrictDefinedValues || !showRestrictSwitch) && (
        <div className="flex flex-col gap-space-sm">
          <div className="flex items-center justify-between">
            <Label>可选值</Label>
            {allowAddValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddValue}
                disabled={loading}
              >
                <Plus className="w-icon-sm h-icon-sm" />
              </Button>
            )}
          </div>
          <div className="flex flex-col gap-space-xs">
            {values.map((value, index) => (
              <div key={index} className="flex items-center gap-space-xs">
                <Input
                  value={value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder={`值 ${index + 1}`}
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveValue(index)}
                  disabled={loading}
                  className="h-[32px] w-[32px] p-0 hover:text-status-error shrink-0"
                >
                  <Trash2 className="w-icon-sm h-icon-sm" />
                </Button>
              </div>
            ))}
            {values.length === 0 && (
              <span className="text-text-tertiary text-body-sm py-space-sm text-center">
                暂无可选值，点击上方按钮添加
              </span>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex justify-end gap-space-sm pt-space-md border-t border-border-default">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          取消
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '保存中...' : '确认'}
        </Button>
      </div>
    </form>
  )
}
