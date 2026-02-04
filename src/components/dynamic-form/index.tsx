'use client'

import * as React from 'react'
import { useForm, Controller, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormTooltip } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import { FormFieldType, type FormFieldConfig, type FormFieldShowWhen } from '@/pages/settings/datasource/types'
import { TagEditor } from '@/components/ui/tag-editor'
import { Eye, EyeOff } from 'lucide-react'

interface DynamicFormRootProps<T extends FieldValues> {
  fields: FormFieldConfig[]
  onSubmit: (data: T) => void
  defaultValues?: Partial<T>
  children?: React.ReactNode
  className?: string
  labelClassName?: string
}

// Context for form instance
const FormContext = React.createContext<UseFormReturn<any> | null>(null)

export const useFormInstance = () => {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error('useFormInstance must be used within DynamicForm.Root')
  }
  return context
}

/**
 * 检查字段是否应该显示
 */
const shouldShowField = (showWhen: FormFieldShowWhen | undefined, formValues: Record<string, any>): boolean => {
  if (!showWhen) return true
  
  const fieldValue = getNestedValue(formValues, showWhen.field)
  if (Array.isArray(showWhen.value)) {
    return showWhen.value.includes(fieldValue)
  }
  return fieldValue === showWhen.value
}

/**
 * 获取嵌套对象的值
 */
const getNestedValue = (obj: Record<string, any>, path: string): any => {
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

/**
 * 密码输入框组件（带显示/隐藏切换）
 */
const PasswordInput = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<typeof Input>>(
  (props, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    
    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

/**
 * 渲染单个表单字段
 */
const renderField = (
  field: FormFieldConfig,
  control: any,
  formValues: Record<string, any>,
  labelClassName?: string
) => {
  if (field.hidden) return null
  if (!shouldShowField(field.showWhen, formValues)) return null

  // 如果有自定义渲染函数
  if (field.render) {
    return (
      <Controller
        key={field.name}
        name={field.name}
        control={control}
        defaultValue={field.defaultValue}
        render={({ field: fieldProps }) => (
          <div className="space-y-2">
            {field.label && (
              <div className="flex items-center gap-1">
                <Label className={cn('text-sm font-medium text-text-primary', labelClassName)}>
                  {field.label}
                  {field.required && <span className="text-status-error ml-1">*</span>}
                </Label>
                {field.tooltip && <FormTooltip tooltip={field.tooltip} />}
              </div>
            )}
            {field.render!(fieldProps)}
          </div>
        )}
      />
    )
  }

  return (
    <Controller
      key={field.name}
      name={field.name}
      control={control}
      defaultValue={field.defaultValue ?? ''}
      render={({ field: fieldProps, fieldState }) => (
        <div className="space-y-2">
          {field.label && (
            <div className="flex items-center gap-1">
              <Label className={cn('text-sm font-medium text-text-primary', labelClassName)}>
                {field.label}
                {field.required && <span className="text-status-error ml-1">*</span>}
              </Label>
              {field.tooltip && <FormTooltip tooltip={field.tooltip} />}
            </div>
          )}
          
          {field.type === FormFieldType.Text && (
            <Input
              {...fieldProps}
              placeholder={field.placeholder}
              disabled={field.disabled}
              error={fieldState.error?.message}
            />
          )}
          
          {field.type === FormFieldType.Password && (
            <PasswordInput
              {...fieldProps}
              placeholder={field.placeholder}
              disabled={field.disabled}
              error={fieldState.error?.message}
            />
          )}
          
          {field.type === FormFieldType.Number && (
            <Input
              {...fieldProps}
              type="number"
              placeholder={field.placeholder}
              disabled={field.disabled}
              error={fieldState.error?.message}
              onChange={(e) => fieldProps.onChange(e.target.value ? Number(e.target.value) : '')}
            />
          )}
          
          {field.type === FormFieldType.Textarea && (
            <Textarea
              {...fieldProps}
              placeholder={field.placeholder}
              disabled={field.disabled}
              rows={4}
            />
          )}
          
          {field.type === FormFieldType.Select && (
            <Select
              value={fieldProps.value}
              onValueChange={fieldProps.onChange}
              disabled={field.disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {field.type === FormFieldType.Checkbox && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={fieldProps.value}
                onCheckedChange={fieldProps.onChange}
                disabled={field.disabled}
              />
            </div>
          )}
          
          {field.type === FormFieldType.Tag && (
            <TagEditor
              value={fieldProps.value || []}
              onChange={fieldProps.onChange}
              placeholder={field.placeholder}
            />
          )}
          
          {field.type === FormFieldType.Segmented && (
            <div className="flex gap-1 p-1 bg-surface-secondary rounded-lg">
              {field.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => fieldProps.onChange(option.value)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-sm rounded-md transition-colors',
                    fieldProps.value === option.value
                      ? 'bg-surface-primary text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    />
  )
}

/**
 * DynamicForm Root 组件
 */
function DynamicFormRoot<T extends FieldValues>({
  fields,
  onSubmit,
  defaultValues,
  children,
  className,
  labelClassName,
}: DynamicFormRootProps<T>) {
  const form = useForm<T>({
    defaultValues: defaultValues as any,
  })

  const formValues = form.watch()

  return (
    <FormContext.Provider value={form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
        {fields.map((field) => renderField(field, form.control, formValues, labelClassName))}
        {children}
      </form>
    </FormContext.Provider>
  )
}

/**
 * 取消按钮
 */
function CancelButton({ handleCancel, className }: { handleCancel: () => void; className?: string }) {
  return (
    <Button type="button" variant="outline" onClick={handleCancel} className={className}>
      取消
    </Button>
  )
}

/**
 * 提交按钮
 */
function SavingButton({
  submitLoading,
  buttonText,
  submitFunc,
  className,
}: {
  submitLoading: boolean
  buttonText?: string
  submitFunc?: (values: any) => void
  className?: string
}) {
  const form = useFormInstance()

  const handleClick = async () => {
    const isValid = await form.trigger()
    if (isValid && submitFunc) {
      submitFunc(form.getValues())
    }
  }

  return (
    <Button type="button" onClick={handleClick} disabled={submitLoading} className={className}>
      {submitLoading ? '处理中...' : buttonText || '确定'}
    </Button>
  )
}

export const DynamicForm = {
  Root: DynamicFormRoot,
  CancelButton,
  SavingButton,
}

export default DynamicForm
