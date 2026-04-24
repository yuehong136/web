'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from 'react-hook-form'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { FormTooltip } from '@/components/ui/tooltip'

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>')
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

interface FormItemProps extends React.HTMLAttributes<HTMLDivElement> {
  horizontal?: boolean
}

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(
  ({ className, horizontal = false, ...props }, ref) => {
    const id = React.useId()

    return (
      <FormItemContext.Provider value={{ id }}>
        <div
          ref={ref}
          className={cn(
            'space-y-2',
            horizontal && 'flex items-center space-y-0',
            className
          )}
          {...props}
        />
      </FormItemContext.Provider>
    )
  }
)
FormItem.displayName = 'FormItem'

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
  tooltip?: React.ReactNode
  horizontal?: boolean
}

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  FormLabelProps
>(({ className, required, tooltip, horizontal = false, children, ...props }, ref) => {
  const { formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(
        'text-sm text-text-secondary',
        horizontal && 'w-1/4 shrink-0',
        className
      )}
      htmlFor={formItemId}
      {...props}
    >
      <span className="flex items-center gap-0.5">
        {required && <span className="text-red-500">*</span>}
        {children}
        {tooltip && <FormTooltip tooltip={tooltip} />}
      </span>
    </Label>
  )
})
FormLabel.displayName = 'FormLabel'

interface FormControlProps extends React.ComponentPropsWithoutRef<typeof Slot> {
  horizontal?: boolean
}

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  FormControlProps
>(({ horizontal = false, className, children, ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()
  const controlClassName = cn(horizontal && 'w-3/4', className)
  const describedBy = !error
    ? `${formDescriptionId}`
    : `${formDescriptionId} ${formMessageId}`

  if (
    React.Children.count(children) !== 1 ||
    !React.isValidElement(children) ||
    children.type === React.Fragment
  ) {
    return (
      <div
        ref={ref as React.Ref<HTMLDivElement>}
        id={formItemId}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        className={controlClassName}
        data-form-control-fallback=""
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={describedBy}
      aria-invalid={!!error}
      className={controlClassName}
      {...props}
    >
      {children}
    </Slot>
  )
})
FormControl.displayName = 'FormControl'

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-sm text-text-tertiary', className)}
      {...props}
    />
  )
})
FormDescription.displayName = 'FormDescription'

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-sm font-medium text-red-500', className)}
      {...props}
    >
      {body}
    </p>
  )
})
FormMessage.displayName = 'FormMessage'

// 水平布局的表单项包装器
interface HorizontalFormItemProps {
  children: React.ReactNode
  className?: string
}

const HorizontalFormItem = React.forwardRef<HTMLDivElement, HorizontalFormItemProps>(
  ({ children, className }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-start gap-1', className)}>
        {children}
      </div>
    )
  }
)
HorizontalFormItem.displayName = 'HorizontalFormItem'

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  HorizontalFormItem,
}
