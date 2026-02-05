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
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialRetrievalValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper, Output, transferOutputs } from './components'

const schema = z.object({
  query: z.string().optional(),
  similarity_threshold: z.coerce.number().optional(),
  keywords_similarity_weight: z.coerce.number().optional(),
  top_n: z.coerce.number().optional(),
  top_k: z.coerce.number().optional(),
  rerank_id: z.string().optional(),
  empty_response: z.string().optional(),
  kb_ids: z.array(z.string()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function RetrievalForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialRetrievalValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.query', 'Query')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="kb_ids"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('flow.knowledgeBases', 'Knowledge Bases')}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t(
                    'flow.kbIdsPlaceholder',
                    'Comma-separated KB IDs',
                  )}
                  value={(field.value ?? []).join(', ')}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
            <ChevronDown className="size-4" />
            {t('flow.advancedSettings', 'Advanced Settings')}
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="similarity_threshold"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {t('flow.similarityThreshold', 'Similarity Threshold')}
                    </FormLabel>
                    <span className="text-xs text-text-secondary">
                      {field.value ?? 0.2}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[field.value ?? 0.2]}
                      onValueChange={([v]) => field.onChange(v)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keywords_similarity_weight"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>
                      {t(
                        'flow.keywordsSimilarityWeight',
                        'Keywords Similarity Weight',
                      )}
                    </FormLabel>
                    <span className="text-xs text-text-secondary">
                      {field.value ?? 0.3}
                    </span>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[field.value ?? 0.3]}
                      onValueChange={([v]) => field.onChange(v)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="top_n"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.topN', 'Top N')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      value={field.value ?? 8}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="top_k"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.topK', 'Top K')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      value={field.value ?? 1024}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rerank_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('flow.rerankModel', 'Rerank Model')}</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empty_response"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('flow.emptyResponse', 'Empty Response')}
                  </FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} value={field.value ?? ''} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CollapsibleContent>
        </Collapsible>

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
