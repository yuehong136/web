import { PromptEditor } from '@/components/prompt-editor'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { summaryToTableData, useMetadataSummary } from '@/hooks/use-metadata'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useBuildNodeOutputOptions } from '../../hooks/use-build-options'
import useGraphStore from '../../store'
import {
  retrievalMetaDataLogic,
  retrievalMetaDataMethod,
  retrievalMetaDataOperatorOptions,
} from '../retrieval/utils'

type MetadataFilterProps = {
  name?: string
  kbIdsName?: string
  nodeId?: string
}

export function MetadataFilter({
  name = 'meta_data_filter',
  kbIdsName = 'kb_ids',
  nodeId,
}: MetadataFilterProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const clickedNodeId = useGraphStore((state) => state.clickedNodeId)
  const promptOptions = useBuildNodeOutputOptions(nodeId || clickedNodeId)
  const kbIds = useWatch({
    control: form.control,
    name: kbIdsName,
  }) as string[] | undefined
  const selectedKbId = (kbIds || []).find(
    (item) => typeof item === 'string' && item.trim() && !item.includes('@'),
  )
  const method = useWatch({
    control: form.control,
    name: `${name}.method`,
  }) as string | undefined
  const { data } = useMetadataSummary(selectedKbId || '', Boolean(selectedKbId))

  const metadataItems = useMemo(() => {
    return summaryToTableData(data?.summary || {})
  }, [data?.summary])

  const metadataFieldOptions = useMemo(() => {
    return metadataItems.map((item) => ({
      label: item.field,
      value: item.field,
    }))
  }, [metadataItems])

  const metadataValueMap = useMemo(() => {
    return metadataItems.reduce<Record<string, string[]>>((acc, item) => {
      acc[item.field] = item.values
      return acc
    }, {})
  }, [metadataItems])

  const manualFieldArray = useFieldArray({
    control: form.control,
    name: `${name}.manual`,
  })

  return (
    <section className="space-y-space-md rounded-radius-md border border-border-default p-space-base">
      <div className="space-y-space-xs">
        <div className="text-sm font-medium text-text-primary">
          {t('flow.metadataFilter', 'Metadata Filter')}
        </div>
        <div className="text-xs text-text-secondary">
          {selectedKbId
            ? t(
                'flow.metadataFilterDescription',
                'Filter dataset chunks by metadata conditions before retrieval runs.',
              )
            : t(
                'flow.metadataFilterSelectDatasetFirst',
                'Select a dataset first to load metadata fields.',
              )}
        </div>
      </div>

      <div className="grid gap-space-md md:grid-cols-2">
        <FormField
          control={form.control}
          name={`${name}.method`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.method', 'Method')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={retrievalMetaDataMethod.Manual}>
                      {t('flow.manual', 'Manual')}
                    </SelectItem>
                    <SelectItem value={retrievalMetaDataMethod.SemiAuto}>
                      {t('flow.semiAuto', 'Semi Auto')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`${name}.logic`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.logic', 'Logic')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={retrievalMetaDataLogic.And}>
                      AND
                    </SelectItem>
                    <SelectItem value={retrievalMetaDataLogic.Or}>
                      OR
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      {method === retrievalMetaDataMethod.SemiAuto ? (
        <FormField
          control={form.control}
          name={`${name}.semi_auto`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.fields', 'Fields')}</FormLabel>
              <FormControl>
                <MultiSelectWithSearch
                  options={metadataFieldOptions}
                  value={field.value || []}
                  onChange={field.onChange}
                  placeholder={t('flow.selectFields', 'Select metadata fields')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <section className="space-y-space-md">
          {manualFieldArray.fields.map((manualField, index) => {
            const fieldKeyName = `${name}.manual.${index}.key`
            const operatorName = `${name}.manual.${index}.op`
            const valueName = `${name}.manual.${index}.value`
            const selectedFieldKey = form.watch(fieldKeyName)
            const suggestedValues = metadataValueMap[selectedFieldKey] || []

            return (
              <div
                key={manualField.id}
                className="space-y-space-sm rounded-radius-md border border-border-default p-space-sm"
              >
                <div className="grid gap-space-sm md:grid-cols-[1.2fr_0.8fr]">
                  <FormField
                    control={form.control}
                    name={fieldKeyName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('flow.field', 'Field')}</FormLabel>
                        <FormControl>
                          <MultiSelectWithSearch
                            options={metadataFieldOptions}
                            value={field.value ? [field.value] : []}
                            onChange={(values) => field.onChange(values[0] || '')}
                            maxDisplayItems={1}
                            placeholder={t('flow.selectField', 'Select field')}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={operatorName}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('flow.operator', 'Operator')}</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {retrievalMetaDataOperatorOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={valueName}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('flow.value', 'Value')}</FormLabel>
                      <FormControl>
                        <PromptEditor
                          value={field.value}
                          onChange={field.onChange}
                          options={promptOptions}
                          multiLine={false}
                          showToolbar={false}
                        />
                      </FormControl>
                      {suggestedValues.length > 0 && (
                        <div className="text-xs text-text-secondary">
                          {t('flow.suggestedValues', 'Suggested values')}: {suggestedValues.slice(0, 5).join(', ')}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => manualFieldArray.remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              manualFieldArray.append({
                key: '',
                op: retrievalMetaDataOperatorOptions[0],
                value: '',
              })
            }
          >
            <Plus className="mr-space-xs size-4" />
            {t('common.add', 'Add')}
          </Button>
        </section>
      )}

      <Separator />
    </section>
  )
}
