import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Form } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { Separator } from '@/components/ui/separator'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo } from 'react'
import { useForm, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  ComparisonOperator,
  DataOperationsOperatorOptions,
  JsonSchemaDataType,
  Operations,
  initialDataOperationsValues,
} from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  CompactRecordList,
  CompactRecordRow,
  FormWrapper,
  Output,
  QueryVariableList,
  buildOutputList,
} from '../components'
import { dataOperationOptions } from './constants'

const dataOperationsSchema = z.object({
  query: z.array(z.object({ input: z.string().optional() })).optional(),
  operations: z.string().optional(),
  select_keys: z.array(z.object({ name: z.string().optional() })).optional(),
  remove_keys: z.array(z.object({ name: z.string().optional() })).optional(),
  updates: z
    .array(
      z.object({
        key: z.string().optional(),
        value: z.string().optional(),
      }),
    )
    .optional(),
  rename_keys: z
    .array(
      z.object({
        old_key: z.string().optional(),
        new_key: z.string().optional(),
      }),
    )
    .optional(),
  filter_values: z
    .array(
      z.object({
        key: z.string().optional(),
        operator: z.string().optional(),
        value: z.string().optional(),
      }),
    )
    .optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

function SimpleNameList({
  name,
  label,
  placeholder,
}: {
  name: 'select_keys' | 'remove_keys'
  label: string
  placeholder: string
}) {
  const { t } = useTranslation()
  const form = useFormContext()

  return (
    <CompactRecordList
      name={name}
      label={label}
      addLabel={t('common.add', 'Add')}
      emptyLabel={t('common.noData', 'No items yet')}
      defaultValue={{ name: '' }}
    >
      {({ field, index, ctx }) => (
        <CompactRecordRow key={field.id} onRemove={() => ctx.remove(index)}>
          <FormField
            control={form.control}
            name={`${name}.${index}.name`}
            render={({ field: nameField }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input
                    {...nameField}
                    value={nameField.value ?? ''}
                    placeholder={placeholder}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CompactRecordRow>
      )}
    </CompactRecordList>
  )
}

function KeyValueList({
  name,
  label,
  keyLabel,
  valueLabel,
}: {
  name: 'updates' | 'rename_keys'
  label: string
  keyLabel: string
  valueLabel: string
}) {
  const { t } = useTranslation()
  const form = useFormContext()
  const keyFieldName = name === 'rename_keys' ? 'old_key' : 'key'
  const valueFieldName = name === 'rename_keys' ? 'new_key' : 'value'

  return (
    <CompactRecordList
      name={name}
      label={label}
      addLabel={t('common.add', 'Add')}
      emptyLabel={t('common.noData', 'No items yet')}
      defaultValue={{ [keyFieldName]: '', [valueFieldName]: '' }}
    >
      {({ field, index, ctx }) => (
        <CompactRecordRow key={field.id} onRemove={() => ctx.remove(index)}>
          <FormField
            control={form.control}
            name={`${name}.${index}.${keyFieldName}`}
            render={({ field: keyField }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input
                    {...keyField}
                    value={keyField.value ?? ''}
                    placeholder={keyLabel}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${name}.${index}.${valueFieldName}`}
            render={({ field: valueField }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input
                    {...valueField}
                    value={valueField.value ?? ''}
                    placeholder={valueLabel}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CompactRecordRow>
      )}
    </CompactRecordList>
  )
}

function FilterValuesList() {
  const { t } = useTranslation()
  const form = useFormContext()
  const operatorOptions = DataOperationsOperatorOptions.map((value) => ({
    label: value,
    value,
  }))

  return (
    <CompactRecordList
      name="filter_values"
      label={t('flow.operationsOptions.filterValues', 'Filter values')}
      addLabel={t('common.add', 'Add')}
      emptyLabel={t('common.noData', 'No items yet')}
      defaultValue={{
        key: '',
        operator: ComparisonOperator.Equal,
        value: '',
      }}
    >
      {({ field, index, ctx }) => (
        <CompactRecordRow key={field.id} onRemove={() => ctx.remove(index)}>
          <FormField
            control={form.control}
            name={`filter_values.${index}.key`}
            render={({ field: keyField }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input
                    {...keyField}
                    value={keyField.value ?? ''}
                    placeholder={t('flow.key', 'Key')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`filter_values.${index}.operator`}
            render={({ field: operatorField }) => (
              <FormItem className="flex-[0.8_1_0] min-w-0">
                <FormControl>
                  <SelectWithSearch
                    value={operatorField.value || ComparisonOperator.Equal}
                    onChange={operatorField.onChange}
                    options={operatorOptions}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`filter_values.${index}.value`}
            render={({ field: valueField }) => (
              <FormItem className="flex-1 min-w-0">
                <FormControl>
                  <Input
                    {...valueField}
                    value={valueField.value ?? ''}
                    placeholder={t('flow.value', 'Value')}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </CompactRecordRow>
      )}
    </CompactRecordList>
  )
}

export const DataOperationsForm = memo(function DataOperationsForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialDataOperationsValues, node)

  const form = useForm({
    resolver: zodResolver(dataOperationsSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const operation = useWatch({
    control: form.control,
    name: 'operations',
  })

  return (
    <Form {...form}>
      <FormWrapper>
        <QueryVariableList
          name="query"
          label={t('flow.query', 'Query')}
          tooltip={t('flow.queryTip', 'Select one or more object arrays')}
          types={[JsonSchemaDataType.Array]}
        />

        <Separator />

        <FormField
          control={form.control}
          name="operations"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.operations', 'Operations')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  value={field.value || Operations.SelectKeys}
                  onChange={field.onChange}
                  options={dataOperationOptions}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {operation === Operations.SelectKeys && (
          <SimpleNameList
            name="select_keys"
            label={t('flow.operationsOptions.selectKeys', 'Select keys')}
            placeholder={t('flow.key', 'Key')}
          />
        )}

        {operation === Operations.RemoveKeys && (
          <SimpleNameList
            name="remove_keys"
            label={t('flow.operationsOptions.removeKeys', 'Remove keys')}
            placeholder={t('flow.key', 'Key')}
          />
        )}

        {operation === Operations.AppendOrUpdate && (
          <KeyValueList
            name="updates"
            label={t('flow.operationsOptions.appendOrUpdate', 'Append or update')}
            keyLabel={t('flow.key', 'Key')}
            valueLabel={t('flow.value', 'Value')}
          />
        )}

        {operation === Operations.RenameKeys && (
          <KeyValueList
            name="rename_keys"
            label={t('flow.operationsOptions.renameKeys', 'Rename keys')}
            keyLabel={t('flow.oldKey', 'Old key')}
            valueLabel={t('flow.newKey', 'New key')}
          />
        )}

        {operation === Operations.FilterValues && <FilterValuesList />}

        <Output list={buildOutputList(initialDataOperationsValues.outputs)} />
      </FormWrapper>
    </Form>
  )
})
