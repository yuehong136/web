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
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialParserValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, transferOutputs } from './components'

const schema = z.object({
  setups: z
    .array(
      z.object({
        fileFormat: z.string().optional(),
        output_format: z.string().optional(),
        parse_method: z.string().optional(),
        lang: z.string().optional(),
        fields: z.string().optional(),
        llm_id: z.string().optional(),
        system_prompt: z.string().optional(),
        table_result_type: z.string().optional(),
        markdown_image_response_type: z.string().optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function ParserForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialParserValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const { fields, append, remove } = useFieldArray({
    name: 'setups',
    control: form.control,
  })

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <div className="flex items-center justify-between">
          <FormLabel>{t('flow.parserSetup', 'Parser Setups')}</FormLabel>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() =>
              append({
                fileFormat: '',
                output_format: '',
                parse_method: '',
                lang: '',
                fields: '',
                llm_id: '',
                system_prompt: '',
                table_result_type: '',
                markdown_image_response_type: '',
              })
            }
          >
            <Plus className="size-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-3 rounded-radius-md border border-border-default p-space-sm">
              <FormField
                control={form.control}
                name={`setups.${index}.fileFormat`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.fileFormat', 'File Format')}</FormLabel>
                    <FormControl>
                      <Input {...inputField} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.output_format`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.outputFormat', 'Output Format')}</FormLabel>
                    <FormControl>
                      <Input {...inputField} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.parse_method`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.parseMethod', 'Parse Method')}</FormLabel>
                    <FormControl>
                      <Input {...inputField} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.lang`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.language', 'Language')}</FormLabel>
                    <FormControl>
                      <Input {...inputField} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.fields`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.fields', 'Fields')}</FormLabel>
                    <FormControl>
                      <Input {...inputField} placeholder="field1,field2" />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.llm_id`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.model', 'Model')}</FormLabel>
                    <FormControl>
                      <Input {...inputField} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.system_prompt`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.systemPrompt', 'System Prompt')}</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...inputField} value={inputField.value ?? ''} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.table_result_type`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>{t('flow.tableResultType', 'Table Result Type')}</FormLabel>
                    <FormControl>
                      <Input {...inputField} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`setups.${index}.markdown_image_response_type`}
                render={({ field: inputField }) => (
                  <FormItem>
                    <FormLabel>
                      {t('flow.markdownImageResponseType', 'Markdown Image Response Type')}
                    </FormLabel>
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

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
