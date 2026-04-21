import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useTranslation } from 'react-i18next'
import { BeginQueryType } from '../../constant'
import { BeginDynamicOptions } from './begin-dynamic-options'
import type { BeginInputEditorItem } from './utils'

const formId = 'begin-parameter-dialog-form'

const parameterSchema = z.object({
  type: z.string().min(1),
  key: z
    .string()
    .trim()
    .min(1)
    .refine(() => true),
  optional: z.boolean(),
  name: z.string().trim().min(1),
  value: z.string().optional(),
  options: z
    .array(z.object({ value: z.union([z.string(), z.number(), z.boolean()]) }))
    .optional(),
})

type ParameterDialogValues = z.infer<typeof parameterSchema>

type ParameterDialogProps = {
  initialValue?: Partial<BeginInputEditorItem>
  otherThanCurrentQuery: BeginInputEditorItem[]
  open: boolean
  onOpenChange(open: boolean): void
  submit(values: BeginInputEditorItem): void
}

function buildDefaultValues(): ParameterDialogValues {
  return {
    type: BeginQueryType.Line,
    key: '',
    optional: false,
    name: '',
    value: '',
    options: [],
  }
}

export function ParameterDialog({
  initialValue,
  otherThanCurrentQuery,
  open,
  onOpenChange,
  submit,
}: ParameterDialogProps) {
  const { t } = useTranslation()

  const uniqueKeySchema = useMemo(
    () =>
      parameterSchema.extend({
        key: z
          .string()
          .trim()
          .min(1)
          .refine(
            (value) =>
              !otherThanCurrentQuery.some((item) => item.key.trim() === value),
            { message: t('flow.keyCannotRepeat', 'The key cannot be repeated.') },
          ),
      }),
    [otherThanCurrentQuery, t],
  )

  const form = useForm<ParameterDialogValues>({
    resolver: zodResolver(uniqueKeySchema),
    defaultValues: buildDefaultValues(),
    mode: 'onChange',
  })

  const type = useWatch({
    control: form.control,
    name: 'type',
  })

  useEffect(() => {
    if (!open) {
      return
    }

    form.reset({
      ...buildDefaultValues(),
      ...initialValue,
      options: initialValue?.options || [],
    })
  }, [form, initialValue, open])

  const handleSubmit = form.handleSubmit((values) => {
    submit({
      ...values,
      key: values.key.trim(),
      name: values.name.trim(),
      value: values.value || '',
    })
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {t('flow.variableSettings', 'Variable settings')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            id={formId}
            className="space-y-space-md px-space-lg pb-space-lg"
            onSubmit={handleSubmit}
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.type', 'Type')}</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || BeginQueryType.Line}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BeginQueryType).map((value) => (
                          <SelectItem key={value} value={value}>
                            {t(`flow.${value}`, value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="key"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.key', 'Key')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      onBlur={(event) => {
                        const nextKey = event.target.value.trim()
                        field.onChange(nextKey)
                        field.onBlur()
                        if (!form.getValues('name')) {
                          form.setValue('name', nextKey, {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.name', 'Name')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="optional"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>{t('flow.optional', 'Optional')}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {type === BeginQueryType.Options && <BeginDynamicOptions />}
          </form>
        </Form>

        <DialogFooter>
          <Button type="submit" form={formId}>
            {t('modal.okText', 'OK')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
