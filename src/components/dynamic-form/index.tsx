'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  useForm,
  Controller,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { FormTooltip } from '@/components/ui/tooltip'
import { Label } from '@/components/ui/label'
import {
  FormFieldType,
  type FormFieldConfig,
  type FormFieldShowWhen,
} from '@/pages/settings/datasource/types'
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
const shouldShowField = (
  showWhen: FormFieldShowWhen | undefined,
  formValues: Record<string, any>,
): boolean => {
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
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<typeof Input>
>((props, ref) => {
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
            className="focus:outline-hidden"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        }
      />
    </div>
  )
})
PasswordInput.displayName = 'PasswordInput'

/**
 * 渲染单个表单字段
 */
const renderField = (
  field: FormFieldConfig,
  control: any,
  formValues: Record<string, any>,
  idPrefix: string,
  requiredMessage: string,
  labelClassName?: string,
) => {
  if (field.hidden) return null
  if (!shouldShowField(field.showWhen, formValues)) return null
  const id = `${idPrefix}-${field.name}`
  const labelId = `${id}-label`
  const rules = {
    validate: (value: unknown) =>
      !field.required ||
      field.disabled ||
      (typeof value === 'string'
        ? value.trim().length > 0
        : Array.isArray(value)
          ? value.length > 0
          : value != null) ||
      requiredMessage,
  }

  // 如果有自定义渲染函数
  if (field.render) {
    return (
      <Controller
        key={field.name}
        name={field.name}
        control={control}
        rules={rules}
        defaultValue={field.defaultValue}
        render={({ field: fieldProps, fieldState }) => (
          <div className="space-y-2">
            {field.label && (
              <div className="flex items-center gap-1">
                <Label
                  id={labelId}
                  className={cn(
                    'text-sm font-medium text-text-primary',
                    labelClassName,
                  )}
                >
                  {field.label}
                  {field.required && (
                    <span className="ml-1 text-status-error">*</span>
                  )}
                </Label>
                {field.tooltip && <FormTooltip tooltip={field.tooltip} />}
              </div>
            )}
            <div role="group" aria-labelledby={labelId}>
              {field.render!(fieldProps)}
            </div>
            {fieldState.error && (
              <p role="alert" className="text-sm text-status-error">
                {fieldState.error.message}
              </p>
            )}
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
      rules={rules}
      defaultValue={field.defaultValue ?? ''}
      render={({ field: fieldProps, fieldState }) => (
        <div className="space-y-2">
          {field.label && (
            <div className="flex items-center gap-1">
              <Label
                id={labelId}
                htmlFor={id}
                className={cn(
                  'text-sm font-medium text-text-primary',
                  labelClassName,
                )}
              >
                {field.label}
                {field.required && (
                  <span className="ml-1 text-status-error">*</span>
                )}
              </Label>
              {field.tooltip && <FormTooltip tooltip={field.tooltip} />}
            </div>
          )}

          {field.type === FormFieldType.Text && (
            <Input
              {...fieldProps}
              id={id}
              aria-invalid={!!fieldState.error}
              placeholder={field.placeholder}
              disabled={field.disabled}
              error={fieldState.error?.message}
            />
          )}

          {field.type === FormFieldType.Password && (
            <PasswordInput
              {...fieldProps}
              id={id}
              aria-invalid={!!fieldState.error}
              placeholder={field.placeholder}
              disabled={field.disabled}
              error={fieldState.error?.message}
            />
          )}

          {field.type === FormFieldType.Number && (
            <Input
              {...fieldProps}
              id={id}
              aria-invalid={!!fieldState.error}
              type="number"
              placeholder={field.placeholder}
              disabled={field.disabled}
              error={fieldState.error?.message}
              onChange={(e) =>
                fieldProps.onChange(
                  e.target.value ? Number(e.target.value) : '',
                )
              }
            />
          )}

          {field.type === FormFieldType.Textarea && (
            <Textarea
              {...fieldProps}
              id={id}
              aria-invalid={!!fieldState.error}
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
              <SelectTrigger id={id} aria-labelledby={labelId}>
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
                id={id}
                checked={fieldProps.value}
                onCheckedChange={fieldProps.onChange}
                disabled={field.disabled}
              />
            </div>
          )}

          {field.type === FormFieldType.Tag && (
            <div role="group" aria-labelledby={labelId}>
              <TagEditor
                value={fieldProps.value || []}
                onChange={fieldProps.onChange}
                placeholder={field.placeholder}
              />
            </div>
          )}

          {field.type === FormFieldType.Segmented && (
            <div
              role="group"
              aria-labelledby={labelId}
              className="bg-surface-secondary flex gap-1 rounded-lg p-1"
            >
              {field.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={fieldProps.value === option.value}
                  onClick={() => fieldProps.onChange(option.value)}
                  className={cn(
                    'flex-1 rounded-md px-3 py-1.5 text-sm transition-colors',
                    fieldProps.value === option.value
                      ? 'bg-surface-primary text-text-primary shadow-xs'
                      : 'text-text-secondary hover:text-text-primary',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          {fieldState.error &&
            ![
              FormFieldType.Text,
              FormFieldType.Password,
              FormFieldType.Number,
            ].includes(field.type) && (
              <p role="alert" className="text-sm text-status-error">
                {fieldState.error.message}
              </p>
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
  const { t } = useTranslation()
  const idPrefix = React.useId()
  const form = useForm<T>({
    defaultValues: defaultValues as any,
  })

  const formValues = form.watch()

  return (
    <FormContext.Provider value={form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4', className)}
      >
        {fields.map((field) =>
          renderField(
            field,
            form.control,
            formValues,
            idPrefix,
            t('common.required'),
            labelClassName,
          ),
        )}
        {children}
      </form>
    </FormContext.Provider>
  )
}

/**
 * 取消按钮
 */
function CancelButton({
  handleCancel,
  className,
}: {
  handleCancel: () => void
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleCancel}
      className={className}
    >
      {t('common.cancel')}
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
  const { t } = useTranslation()
  const form = useFormInstance()

  const handleClick = async () => {
    const isValid = await form.trigger()
    if (isValid && submitFunc) {
      submitFunc(form.getValues())
    }
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={submitLoading}
      className={className}
    >
      {submitLoading
        ? t('common.processing')
        : buttonText || t('common.confirm')}
    </Button>
  )
}

export const DynamicForm = {
  Root: DynamicFormRoot,
  CancelButton,
  SavingButton,
}

export default DynamicForm
