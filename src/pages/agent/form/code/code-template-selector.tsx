import { FormDescription, FormItem, FormLabel } from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { CodeTemplateId } from '../../utils/code-templates'
import type { CodeTemplateIdValue } from './types'

const codeTemplateIds = [
  CodeTemplateId.StringResult,
  CodeTemplateId.ObjectResult,
  CodeTemplateId.CsvArtifact,
]

function getCodeTemplateLabel(
  templateId: CodeTemplateIdValue,
  t: ReturnType<typeof useTranslation>['t'],
) {
  const labels: Record<CodeTemplateIdValue, string> = {
    [CodeTemplateId.StringResult]: t(
      'flow.codeTemplateStringResult',
      'Return string',
    ),
    [CodeTemplateId.ObjectResult]: t(
      'flow.codeTemplateObjectResult',
      'Return object',
    ),
    [CodeTemplateId.CsvArtifact]: t(
      'flow.codeTemplateCsvArtifact',
      'Generate artifact',
    ),
  }

  return labels[templateId]
}

interface CodeTemplateSelectorProps {
  value: CodeTemplateIdValue
  onApply: (templateId: CodeTemplateIdValue) => void
}

export function CodeTemplateSelector({
  value,
  onApply,
}: CodeTemplateSelectorProps) {
  const { t } = useTranslation()

  return (
    <FormItem>
      <FormLabel>{t('flow.codeTemplate', 'Template')}</FormLabel>
      <Select
        value={value}
        onValueChange={(nextValue) => onApply(nextValue as CodeTemplateIdValue)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {codeTemplateIds.map((templateId) => (
            <SelectItem key={templateId} value={templateId}>
              {getCodeTemplateLabel(templateId, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormDescription>
        {t(
          'flow.codeTemplateTip',
          'Templates update the code body and the declared return type together.',
        )}
      </FormDescription>
    </FormItem>
  )
}
