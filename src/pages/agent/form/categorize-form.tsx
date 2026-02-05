import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown, Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { initialCategorizeValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, QueryVariable, transferOutputs } from './components'
import { LlmSetting } from './components/llm-setting'

const schema = z.object({
  llm_id: z.string().optional(),
  temperature: z.coerce.number().optional(),
  top_p: z.coerce.number().optional(),
  presence_penalty: z.coerce.number().optional(),
  frequency_penalty: z.coerce.number().optional(),
  max_tokens: z.coerce.number().optional(),
  query: z.string().optional(),
  parameter: z.string().optional(),
  message_history_window_size: z.coerce.number().optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        uuid: z.string(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function CategorizeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialCategorizeValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  })

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariable />

        <FormField
          control={form.control}
          name="message_history_window_size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flow.messageHistoryWindowSize', 'Message History Window')}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  {...field}
                  value={field.value ?? 1}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {t('flow.categories', 'Categories')}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                append({ name: '', description: '', uuid: uuid() })
              }
            >
              <Plus className="size-4 mr-1" />
              {t('common.add', 'Add')}
            </Button>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="rounded-radius-md border border-border p-space-sm space-y-2"
            >
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name={`items.${index}.name`}
                  render={({ field: nameField }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={t('flow.categoryName', 'Category name')}
                          {...nameField}
                        />
                      </FormControl>
                      <FormMessage />
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
              <FormField
                control={form.control}
                name={`items.${index}.description`}
                render={({ field: descField }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder={t('flow.categoryDescription', 'Description')}
                        {...descField}
                        value={descField.value ?? ''}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          ))}
        </div>

        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
            <ChevronDown className="size-4" />
            {t('flow.modelSettings', 'Model Settings')}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <LlmSetting />
          </CollapsibleContent>
        </Collapsible>

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
