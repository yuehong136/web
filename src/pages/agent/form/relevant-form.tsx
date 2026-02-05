import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { initialRelevantValues } from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import { FormWrapper } from './components'
import { LlmSetting } from './components/llm-setting'

const schema = z.object({
  llm_id: z.string().optional(),
  temperature: z.coerce.number().optional(),
  top_p: z.coerce.number().optional(),
  presence_penalty: z.coerce.number().optional(),
  frequency_penalty: z.coerce.number().optional(),
  max_tokens: z.coerce.number().optional(),
})

export function RelevantForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialRelevantValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  return (
    <Form {...form}>
      <FormWrapper>
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium">
            <ChevronDown className="size-4" />
            {t('flow.modelSettings', 'Model Settings')}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <LlmSetting />
          </CollapsibleContent>
        </Collapsible>
      </FormWrapper>
    </Form>
  )
}
