import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { memo, useMemo } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { BeginQueryType, initialUserFillUpValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output } from '../components'
import { InputItemCard } from './components/input-item-card'
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

function createUserFillUpInput(): UserFillUpInputItem {
  return {
    name: '',
    type: BeginQueryType.Line,
    value: '',
    optional: false,
  }
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

  const { fields, append, remove } = useFieldArray({
    name: 'inputs',
    control: form.control,
  })

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

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <FormLabel>{t('flow.input', 'Inputs')}</FormLabel>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => append(createUserFillUpInput())}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <InputItemCard
                key={field.id}
                control={form.control}
                index={index}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        </div>

        <Output list={outputList} />
      </FormWrapper>
    </Form>
  )
})
