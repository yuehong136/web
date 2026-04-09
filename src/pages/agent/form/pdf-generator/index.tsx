import { Form } from '@/components/ui/form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { initialPDFGeneratorValues } from '../../constant'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, transferOutputs } from '../components'
import { DocumentSettings } from './components/document-settings'
import { LogoSettings } from './components/logo-settings'
import { OutputSettings } from './components/output-settings'
import { PageLayoutSettings } from './components/page-layout-settings'
import { TypographySettings } from './components/typography-settings'
import { pdfGeneratorSchema } from './schema'

export function PDFGeneratorForm({ node }: INextOperatorForm) {
  const values = useFormValues(initialPDFGeneratorValues, node)

  const form = useForm({
    resolver: zodResolver(pdfGeneratorSchema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const outputs = form.getValues('outputs')

  return (
    <Form {...form}>
      <FormWrapper>
        <DocumentSettings control={form.control} />
        <LogoSettings control={form.control} />
        <TypographySettings control={form.control} />
        <PageLayoutSettings control={form.control} />
        <OutputSettings control={form.control} />
        {outputs && <Output list={transferOutputs(outputs)} />}
      </FormWrapper>
    </Form>
  )
}
