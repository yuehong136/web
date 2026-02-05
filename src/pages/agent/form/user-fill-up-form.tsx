import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { BeginQueryType, initialUserFillUpValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output } from './components'

const schema = z.object({
  enable_tips: z.boolean().optional(),
  tips: z.string().optional(),
  inputs: z
    .array(
      z.object({
        name: z.string().optional(),
        type: z.string().optional(),
        value: z.string().optional(),
        optional: z.boolean().optional(),
      }),
    )
    .optional(),
})

export function UserFillUpForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialUserFillUpValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const { fields, append, remove } = useFieldArray({
    name: 'inputs',
    control: form.control,
  })

  const inputs = useWatch({ control: form.control, name: 'inputs' }) || []

  const outputList = useMemo(
    () =>
      inputs.map((item: any) => ({
        title: item?.name || '',
        type: item?.type || '',
      })),
    [inputs],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="enable_tips"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('flow.guidingQuestion', 'Guiding Question')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tips"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.msg', 'Message')}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>{t('flow.input', 'Inputs')}</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                append({
                  name: '',
                  type: BeginQueryType.Line,
                  value: '',
                  optional: false,
                })
              }
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="space-y-2 rounded-radius-md border border-border-default p-space-sm">
                <FormField
                  control={form.control}
                  name={`inputs.${index}.name`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <FormLabel>{t('flow.name', 'Name')}</FormLabel>
                      <FormControl>
                        <Input {...inputField} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`inputs.${index}.type`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <FormLabel>{t('flow.type', 'Type')}</FormLabel>
                      <FormControl>
                        <Select
                          value={inputField.value}
                          onValueChange={inputField.onChange}
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
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`inputs.${index}.value`}
                  render={({ field: inputField }) => (
                    <FormItem>
                      <FormLabel>{t('flow.defaultValue', 'Default')}</FormLabel>
                      <FormControl>
                        <Input {...inputField} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`inputs.${index}.optional`}
                  render={({ field: inputField }) => (
                    <FormItem className="flex items-center gap-space-sm">
                      <FormControl>
                        <Checkbox
                          checked={!!inputField.value}
                          onCheckedChange={(val) =>
                            inputField.onChange(Boolean(val))
                          }
                        />
                      </FormControl>
                      <FormLabel>{t('flow.optional', 'Optional')}</FormLabel>
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

        <Output list={outputList} />
      </FormWrapper>
    </Form>
  )
}
