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
import { useFieldArray, useForm, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  TavilySearchDepth,
  TavilyTopic,
  initialTavilyValues,
} from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import {
  ApiKeyField,
  FormWrapper,
  Output,
  QueryVariable,
  transferOutputs,
} from './components'

const schema = z.object({
  api_key: z.string().optional(),
  query: z.string().optional(),
  search_depth: z.string().optional(),
  topic: z.string().optional(),
  max_results: z.coerce.number().optional(),
  days: z.coerce.number().optional(),
  include_answer: z.boolean().optional(),
  include_raw_content: z.boolean().optional(),
  include_images: z.boolean().optional(),
  include_image_descriptions: z.boolean().optional(),
  include_domains: z.array(z.string()).optional(),
  exclude_domains: z.array(z.string()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

type StringArrayFieldProps = {
  name: 'include_domains' | 'exclude_domains'
  label: string
}

function StringArrayField({ name, label }: StringArrayFieldProps) {
  const form = useFormContext()
  const { fields, append, remove } = useFieldArray({
    name,
    control: form.control,
  })

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <FormLabel>{label}</FormLabel>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => append('')}
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-space-sm">
            <FormField
              control={form.control}
              name={`${name}.${index}`}
              render={({ field: inputField }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input {...inputField} placeholder="example.com" />
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
  )
}

export function TavilyForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialTavilyValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  const searchDepthOptions = useMemo(
    () => Object.values(TavilySearchDepth),
    [],
  )
  const topicOptions = useMemo(() => Object.values(TavilyTopic), [])

  return (
    <Form {...form}>
      <FormWrapper>
        <ApiKeyField />
        <QueryVariable />

        <FormField
          control={form.control}
          name="search_depth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.searchDepth', 'Search Depth')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {searchDepthOptions.map((value) => (
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
          name="topic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.topic', 'Topic')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {topicOptions.map((value) => (
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
          name="max_results"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.maxResults', 'Max Results')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? 5}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="days"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.days', 'Days')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  value={field.value ?? 7}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="include_answer"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('flow.includeAnswer', 'Include Answer')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="include_raw_content"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>
                {t('flow.includeRawContent', 'Include Raw Content')}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="include_images"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('flow.includeImages', 'Include Images')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="include_image_descriptions"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>
                {t('flow.includeImageDescriptions', 'Image Descriptions')}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? false}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <StringArrayField
          name="include_domains"
          label={t('flow.includeDomains', 'Include Domains')}
        />

        <StringArrayField
          name="exclude_domains"
          label={t('flow.excludeDomains', 'Exclude Domains')}
        />

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
