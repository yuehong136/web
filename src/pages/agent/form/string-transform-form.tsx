import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  StringTransformDelimiter,
  StringTransformMethod,
  initialStringTransformValues,
} from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, QueryVariable, transferOutputs } from './components'

const schema = z.object({
  method: z.string().optional(),
  split_ref: z.string().optional(),
  script: z.string().optional(),
  delimiters: z.array(z.string()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function StringTransformForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialStringTransformValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const method = useWatch({ control: form.control, name: 'method' })

  const { fields, append, remove } = useFieldArray({
    name: 'delimiters',
    control: form.control,
  })

  useEffect(() => {
    const isMerge = method === StringTransformMethod.Merge
    const outputs = {
      ...initialStringTransformValues.outputs,
      result: {
        type: isMerge ? 'string' : 'Array<string>',
      },
    }
    form.setValue('outputs', outputs, { shouldDirty: true })
    if (isMerge && (!form.getValues('delimiters') || fields.length === 0)) {
      form.setValue('delimiters', [StringTransformDelimiter.Comma], {
        shouldDirty: true,
      })
    }
  }, [form, method, fields.length])

  const outputs = form.getValues('outputs')

  const methodOptions = useMemo(
    () => Object.values(StringTransformMethod),
    [],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.method', 'Method')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {methodOptions.map((value) => (
                      <SelectItem key={value} value={value}>
                        {t(`flow.${value}`, value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />

        {method === StringTransformMethod.Split ? (
          <QueryVariable
            name="split_ref"
            label={t('flow.splitRef', 'Split Ref')}
          />
        ) : (
          <FormField
            control={form.control}
            name="script"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.script', 'Script')}</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormLabel>{t('flow.delimiters', 'Delimiters')}</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => append(StringTransformDelimiter.Comma)}
            >
              <Plus className="size-4" />
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-space-sm">
                <FormField
                  control={form.control}
                  name={`delimiters.${index}`}
                  render={({ field: inputField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input {...inputField} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
