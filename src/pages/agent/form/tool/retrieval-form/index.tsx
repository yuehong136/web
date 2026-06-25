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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown } from 'lucide-react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { RetrievalFrom } from '../../../constant'
import type { INextOperatorForm } from '../../../types'
import { KnowledgeBaseSelectField } from '../../components/knowledge-base-select-field'
import { LLMSelectField } from '../../components/llm-select-field'
import { MetadataFilter } from '../../components/metadata-filter'
import { MemorySelectField } from '../../retrieval/memory-select-field'
import { ToolConfigForm } from '../tool-config-form'

const schema = z.object({
  description: z.string().optional(),
  similarity_threshold: z.number().optional(),
  keywords_similarity_weight: z.number().optional(),
  top_n: z.number().optional(),
  top_k: z.number().optional(),
  rerank_id: z.string().optional(),
  empty_response: z.string().optional(),
  dataset_ids: z.array(z.string()).optional(),
  kb_ids: z.array(z.string()).optional(),
  memory_ids: z.array(z.string()).optional(),
  user_id: z.string().optional(),
  retrieval_from: z.string().optional(),
  cross_languages: z.array(z.string()).optional(),
  use_kg: z.boolean().optional(),
  toc_enhance: z.boolean().optional(),
  meta_data_filter: z.any().optional(),
})

const crossLanguageOptions = [
  'Chinese',
  'English',
  'Japanese',
  'Korean',
  'French',
  'German',
  'Spanish',
].map((value) => ({
  label: value,
  value,
}))

function RetrievalToolFields() {
  const { t } = useTranslation()
  const form = useFormContext()
  const retrievalFrom = useWatch({
    control: form.control,
    name: 'retrieval_from',
  }) as string | undefined
  const isMemoryMode = retrievalFrom === RetrievalFrom.Memory

  return (
    <>
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.description', 'Description')}</FormLabel>
            <FormControl>
              <Textarea {...field} value={field.value ?? ''} />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="retrieval_from"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.retrievalFrom', 'Retrieval From')}</FormLabel>
            <FormControl>
              <RadioGroup
                className="gap-space-sm grid grid-cols-2"
                value={field.value ?? RetrievalFrom.Dataset}
                onValueChange={field.onChange}
              >
                <label className="gap-space-sm rounded-radius-md px-space-sm py-space-sm flex items-center border border-border-default">
                  <RadioGroupItem value={RetrievalFrom.Dataset} />
                  <span>{t('flow.dataset', 'Dataset')}</span>
                </label>
                <label className="gap-space-sm rounded-radius-md px-space-sm py-space-sm flex items-center border border-border-default">
                  <RadioGroupItem value={RetrievalFrom.Memory} />
                  <span>{t('flow.memories', 'Memories')}</span>
                </label>
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      {isMemoryMode ? (
        <>
          <MemorySelectField />
          <FormField
            control={form.control}
            name="user_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('flow.userId', 'User ID')}</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      ) : (
        <KnowledgeBaseSelectField />
      )}

      <Collapsible defaultOpen>
        <CollapsibleTrigger className="gap-space-xs flex items-center text-sm font-medium text-text-primary">
          <ChevronDown className="size-4" />
          {t('flow.advancedSettings', 'Advanced Settings')}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-space-md pt-space-md">
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
                    onValueChange={([value]) => field.onChange(value)}
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
                    onValueChange={([value]) => field.onChange(value)}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="gap-space-md grid md:grid-cols-2">
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
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
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
                      onChange={(event) =>
                        field.onChange(Number(event.target.value))
                      }
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {!isMemoryMode && (
            <>
              <LLMSelectField name="rerank_id" type="rerank" />
              <MetadataFilter />

              <FormField
                control={form.control}
                name="cross_languages"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('flow.crossLanguages', 'Cross Languages')}
                    </FormLabel>
                    <FormControl>
                      <MultiSelectWithSearch
                        options={crossLanguageOptions}
                        value={Array.isArray(field.value) ? field.value : []}
                        onChange={field.onChange}
                        placeholder={t(
                          'flow.selectCrossLanguages',
                          'Select languages',
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="use_kg"
                render={({ field }) => (
                  <FormItem className="rounded-radius-md px-space-sm py-space-sm flex items-center justify-between border border-border-default">
                    <FormLabel>
                      {t('flow.useKnowledgeGraph', 'Use Knowledge Graph')}
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
                name="toc_enhance"
                render={({ field }) => (
                  <FormItem className="rounded-radius-md px-space-sm py-space-sm flex items-center justify-between border border-border-default">
                    <FormLabel>{t('flow.tocEnhance', 'TOC Enhance')}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
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
            name="empty_response"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t('flow.emptyResponse', 'Empty Response')}
                </FormLabel>
                <FormControl>
                  <Textarea {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}

export default function RetrievalToolForm({ node }: INextOperatorForm) {
  return (
    <ToolConfigForm node={node} schema={schema}>
      <RetrievalToolFields />
    </ToolConfigForm>
  )
}
