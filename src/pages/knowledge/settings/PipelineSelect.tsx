import { useTranslation } from 'react-i18next'
import { useFormContext } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import { DocumentPipelineSelector } from '@/components/knowledge/document-parser/selectors'
import { useDocumentParserActor } from '@/hooks/use-document-parser-actor'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'

export function PipelineSelect({
  datasetId,
  tenantId,
  disabled = false,
}: {
  datasetId: string
  tenantId: string
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const form = useFormContext()
  const actor = useDocumentParserActor()
  return (
    <FormField
      control={form.control}
      name="pipeline_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel tooltip={t('knowledge.settings.fields.pipelineTooltip')}>
            {t('knowledge.settings.fields.pipeline')}
          </FormLabel>
          <FormControl>
            <DocumentPipelineSelector
              value={field.value || ''}
              onChange={field.onChange}
              datasetId={datasetId}
              tenantId={tenantId}
              actorKey={actor.key}
              disabled={disabled}
            />
          </FormControl>
          <Button asChild variant="outline" size="sm">
            <Link to={ROUTES.AGENTS}>
              {t('knowledge.settings.fields.createFromScratch')}
            </Link>
          </Button>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
