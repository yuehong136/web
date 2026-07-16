import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { type Resolver, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { PromptEditor } from '@/components/prompt-editor'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Switch } from '@/components/ui/switch'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'
import { useDocGeneratorValues } from './use-values'

const docGeneratorSchema = z.object({
  output_format: z.string().default('pdf'),
  content: z.string().min(1, 'Content is required'),
  filename: z.string().optional(),
  header_text: z.string().optional(),
  footer_text: z.string().optional(),
  watermark_text: z.string().optional(),
  add_page_numbers: z.boolean(),
  add_timestamp: z.boolean(),
  font_size: z.coerce.number().min(12, 'Font size must be at least 12'),
  outputs: z.object({
    download: z.object({
      type: z.string(),
      value: z.unknown().optional(),
    }),
  }),
})

type DocGeneratorFormValues = z.infer<typeof docGeneratorSchema>

const outputFormatOptions = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
  { label: 'TXT', value: 'txt' },
  { label: 'Markdown', value: 'markdown' },
  { label: 'HTML', value: 'html' },
]

export function DocGeneratorForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useDocGeneratorValues(node)
  const form = useForm<DocGeneratorFormValues>({
    defaultValues: values,
    resolver: zodResolver(
      docGeneratorSchema,
    ) as Resolver<DocGeneratorFormValues>,
  })

  useWatchFormChange(node?.id, form)

  const outputFormat = form.watch('output_format')
  const formOutputs = form.watch('outputs')
  const supportsDocumentDecorations =
    outputFormat === 'pdf' || outputFormat === 'docx'
  const outputList = useMemo(
    () => transferOutputs(formOutputs ?? values.outputs),
    [formOutputs, values.outputs],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="output_format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.outputFormat', 'Output Format')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  options={outputFormatOptions}
                  value={field.value ?? 'pdf'}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.content', 'Content')}</FormLabel>
              <FormControl>
                <PromptEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  showToolbar
                  placeholder="Enter markdown content..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filename"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.filename', 'Filename')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="document.ext (auto-generated if empty)"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {supportsDocumentDecorations && (
          <>
            <FormField
              control={form.control}
              name="font_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.fontSize', 'Font Size')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={12}
                      onChange={(event) => field.onChange(event.target.value)}
                      onBlur={(event) => {
                        field.onBlur()
                        const value = Number(event.target.value)
                        field.onChange(
                          Number.isFinite(value) && value >= 12 ? value : 12,
                        )
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Header Text</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="footer_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {outputFormat === 'pdf' && (
              <FormField
                control={form.control}
                name="watermark_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('flow.watermarkText', 'Watermark Text')}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="add_page_numbers"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between">
                  <FormLabel>
                    {t('flow.addPageNumbers', 'Add Page Numbers')}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="add_timestamp"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between">
              <FormLabel>{t('flow.addTimestamp', 'Add Timestamp')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="outputs"
          render={() => <div />}
        />
      </FormWrapper>
      <div className="p-5">
        <Output list={outputList} />
      </div>
    </Form>
  )
}
