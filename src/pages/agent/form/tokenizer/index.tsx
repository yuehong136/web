import { SliderInputFormField } from '@/components/forms/SliderInputFormField'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialTokenizerValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { buildOutputList, FormWrapper, Output } from '../components'
import { TokenizerFieldOptions, TokenizerSearchMethodOptions } from './constants'

const outputList = buildOutputList(initialTokenizerValues.outputs)

const schema = z.object({
  search_method: z.array(z.string()).min(1),
  filename_embd_weight: z.coerce.number(),
  fields: z.string(),
})

export function TokenizerForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialTokenizerValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
    mode: 'onChange',
  })

  useWatchFormChange(node?.id, form)

  const searchMethodOptions = useMemo(
    () =>
      TokenizerSearchMethodOptions.map((value) => ({
        label: t(`flow.tokenizerSearchMethodOptions.${value}`, value),
        value,
      })),
    [t],
  )

  const fieldOptions = useMemo(
    () =>
      TokenizerFieldOptions.map((value) => ({
        label: t(`flow.tokenizerFieldsOptions.${value}`, value),
        value,
      })),
    [t],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="search_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel
                tooltip={t(
                  'flow.searchMethodTip',
                  'Choose whether the tokenizer uses embedding search, full-text search, or both.',
                )}
              >
                {t('flow.searchMethod', 'Search Method')}
              </FormLabel>
              <FormControl>
                <MultiSelectWithSearch
                  value={field.value ?? []}
                  onChange={field.onChange}
                  options={searchMethodOptions}
                  placeholder={t('flow.searchMethod', 'Search Method')}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <SliderInputFormField
          name="filename_embd_weight"
          label={t('flow.filenameEmbeddingWeight', 'Filename Embedding Weight')}
          max={0.5}
          step={0.01}
          defaultValue={0.1}
        />

        <FormField
          control={form.control}
          name="fields"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.fields', 'Fields')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  options={fieldOptions}
                  placeholder={t('flow.fields', 'Fields')}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Output list={outputList} />
      </FormWrapper>
    </Form>
  )
}
