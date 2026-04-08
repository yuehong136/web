import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import {
  ApiKeyField,
  DescriptionField,
  FormWrapper,
  Output,
  transferOutputs,
} from '../components'

const schema = z.object({
  api_key: z.string().optional(),
  description: z.string().optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

const defaultValues = {
  api_key: '',
  description: '',
}

export function ToolForm({ node }: INextOperatorForm) {
  const values = useFormValues(defaultValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <ApiKeyField />
        <DescriptionField />
        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
