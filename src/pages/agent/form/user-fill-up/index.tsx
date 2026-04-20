import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { BeginQueryType, initialUserFillUpValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  CompactRecordList,
  CompactRecordRow,
  FormWrapper,
  Output,
  RecordAdvancedPanel,
} from '../components'
import type { UserFillUpFormValues, UserFillUpInputItem } from './types'

const userFillUpSchema = z.object({
  enable_tips: z.boolean().optional(),
  tips: z.string().optional(),
  inputs: z
    .array(
      z.object({
        name: z.string().optional(),
        type: z.string().optional(),
        value: z.string().optional(),
        optional: z.boolean().optional(),
      }),
    )
    .optional(),
})

const defaultInput: UserFillUpInputItem = {
  name: '',
  type: BeginQueryType.Line,
  value: '',
  optional: false,
}

export const UserFillUpForm = memo(function UserFillUpForm({
  node,
}: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialUserFillUpValues, node)

  const form = useForm<UserFillUpFormValues>({
    resolver: zodResolver(userFillUpSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const inputs = useWatch({ control: form.control, name: 'inputs' })

  const outputList = useMemo(
    () =>
      (inputs || []).map((item) => ({
        title: item?.name || '',
        type: item?.type || '',
      })),
    [inputs],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="enable_tips"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between">
              <FormLabel>{t('flow.guidingQuestion', 'Guiding Question')}</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tips"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.msg', 'Message')}</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ''} />
              </FormControl>
            </FormItem>
          )}
        />

        <CompactRecordList
          name="inputs"
          label={t('flow.input', 'Inputs')}
          addLabel={t('common.add', 'Add')}
          emptyLabel={t('flow.noInputs', 'No inputs yet')}
          defaultValue={defaultInput}
        >
          {({ field, index, ctx }) => (
            <CompactRecordRow
              key={field.id}
              onRemove={() => ctx.remove(index)}
              advanced={
                <RecordAdvancedPanel>
                  <FormField
                    control={form.control}
                    name={`inputs.${index}.value`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>{t('flow.defaultValue', 'Default')}</FormLabel>
                        <FormControl>
                          <Input
                            {...inputField}
                            value={inputField.value ?? ''}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </RecordAdvancedPanel>
              }
            >
              <FormField
                control={form.control}
                name={`inputs.${index}.name`}
                render={({ field: inputField }) => (
                  <FormItem className="flex-[2_1_0] min-w-0">
                    <FormControl>
                      <Input
                        {...inputField}
                        value={inputField.value ?? ''}
                        placeholder={t('flow.name', 'Name')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`inputs.${index}.type`}
                render={({ field: inputField }) => (
                  <FormItem className="flex-[1_1_0] min-w-0">
                    <FormControl>
                      <Select
                        value={inputField.value}
                        onValueChange={inputField.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(BeginQueryType).map((value) => (
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
                name={`inputs.${index}.optional`}
                render={({ field: inputField }) => (
                  <FormItem className="flex items-center gap-space-xs">
                    <FormControl>
                      <Checkbox
                        checked={!!inputField.value}
                        onCheckedChange={(value) =>
                          inputField.onChange(Boolean(value))
                        }
                      />
                    </FormControl>
                    <FormLabel className="text-xs text-text-secondary">
                      {t('flow.optional', 'Optional')}
                    </FormLabel>
                  </FormItem>
                )}
              />
            </CompactRecordRow>
          )}
        </CompactRecordList>

        <Output list={outputList} />
      </FormWrapper>
    </Form>
  )
})
