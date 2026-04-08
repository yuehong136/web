import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { initialVariableAggregatorValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'

const variableAggregatorSchema = z.object({
  groups: z.array(z.any()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export const VariableAggregatorForm = memo(function VariableAggregatorForm({
  node,
}: INextOperatorForm) {
  const values = useFormValues(initialVariableAggregatorValues, node)

  const form = useForm({
    resolver: zodResolver(variableAggregatorSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <div className="text-sm text-text-secondary">
          Variable aggregation groups are configured via the canvas
          connections.
        </div>
        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
})
