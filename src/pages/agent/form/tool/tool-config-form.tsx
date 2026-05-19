import type { ReactNode } from 'react'
import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { DefaultValues, FieldValues, Resolver } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { FormWrapper } from '../components'
import type { RAGFlowNodeType } from '../../types'
import { useValues } from './use-values'
import { useWatchFormChange } from './use-watch-change'

type ToolConfigFormProps = {
  node?: RAGFlowNodeType
  schema: z.ZodTypeAny
  children: ReactNode
  onSubmit?: (values: FieldValues) => void
}

export function ToolConfigForm({
  node,
  schema,
  children,
  onSubmit,
}: ToolConfigFormProps) {
  const values = useValues(node)

  const form = useForm<FieldValues>({
    resolver: zodResolver(schema as never) as Resolver<FieldValues>,
    defaultValues: values as DefaultValues<FieldValues>,
  })

  useWatchFormChange(form, node)

  return (
    <Form {...form}>
      <FormWrapper
        onSubmit={onSubmit ? form.handleSubmit(onSubmit) : undefined}
      >
        {children}
      </FormWrapper>
    </Form>
  )
}
