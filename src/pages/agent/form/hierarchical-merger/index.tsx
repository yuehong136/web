import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialHierarchicalMergerValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'

const schema = z.object({
  hierarchy: z.string().optional(),
  levels: z.any().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export function HierarchicalMergerForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialHierarchicalMergerValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const levels = useWatch({ control: form.control, name: 'levels' })
  const [levelsText, setLevelsText] = useState<string>(() =>
    JSON.stringify(levels ?? values.levels ?? [], null, 2),
  )

  useEffect(() => {
    setLevelsText(JSON.stringify(levels ?? [], null, 2))
  }, [levels])

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="hierarchy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.hierarchy', 'Hierarchy')}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? '3'} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>{t('flow.levels', 'Levels (JSON)')}</FormLabel>
          <FormControl>
            <Textarea
              rows={6}
              value={levelsText}
              onChange={(e) => setLevelsText(e.target.value)}
              onBlur={() => {
                try {
                  const parsed = JSON.parse(levelsText)
                  form.setValue('levels', parsed, { shouldDirty: true })
                } catch {
                  // ignore invalid json
                }
              }}
            />
          </FormControl>
        </FormItem>

        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
