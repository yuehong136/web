import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memo } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { initialVariableAssignerValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'

const variableAssignerSchema = z.object({
  variables: z.array(z.any()).optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

const variableAssignerDefaultValues = {
  ...initialVariableAssignerValues,
  variables: [] as unknown[],
}

export const VariableAssignerForm = memo(function VariableAssignerForm({
  node,
}: INextOperatorForm) {
  const values = useFormValues(variableAssignerDefaultValues, node)

  const form = useForm({
    resolver: zodResolver(variableAssignerSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <div className="text-sm text-text-secondary">
          Variable assignments are configured via the canvas connections.
        </div>
        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
})
