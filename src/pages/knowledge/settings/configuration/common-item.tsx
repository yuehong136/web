import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { ModelSelect } from '@/components/models/model-select'
import { modelOptions } from '@/components/models/model-select-options'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

/** RAGFlow's LLMModelItem, adapted to the existing Web model inventory. */
export function LLMModelItem({
  name = 'parser_config.llm_id',
  documentScope = false,
}: {
  name?: string
  documentScope?: boolean
}) {
  const { t } = useTranslation()
  const form = useFormContext()
  const { myLLMs, isLoading, error, refetch } = useFetchMyLLMs()
  const models = modelOptions(myLLMs, ['chat', 'image2text'])
  const label = t(
    documentScope
      ? 'knowledge.settings.fields.documentParserModel'
      : 'knowledge.settings.fields.globalIndexModel',
  )

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-space-sm">
          <div className="flex items-start gap-space-xs">
            <FormLabel className="w-1/4 shrink-0 pt-space-sm text-sm text-text-secondary">
              {label}
            </FormLabel>
            <div className="min-w-0 flex-1 space-y-space-sm">
              <FormControl>
                <ModelSelect
                  ref={field.ref}
                  ariaLabel={label}
                  value={typeof field.value === 'string' ? field.value : ''}
                  onChange={field.onChange}
                  {...models}
                  loading={isLoading}
                  error={error}
                  onRetry={refetch}
                  placeholder={t(
                    'knowledge.settings.fields.parserModelDefault',
                  )}
                />
              </FormControl>
              <p className="text-xs text-text-secondary">
                {t(
                  documentScope
                    ? 'knowledge.settings.fields.documentParserModelTip'
                    : 'knowledge.settings.fields.globalIndexModelTip',
                )}
              </p>
              <p className="text-xs text-text-secondary">
                {t('knowledge.settings.fields.parserModelSavedTip')}
              </p>
              <FormMessage />
            </div>
          </div>
        </FormItem>
      )}
    />
  )
}
