import type { FC } from 'react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Settings2 } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { ChunkMethodForm } from '@/pages/knowledge/settings/ChunkMethodForm'
import type { Document } from '@/types/api'
import type { DocumentParserSubmission } from '@/hooks/use-document-parser-modal'
import { ParserFieldScope } from '@/components/forms/parser-field-scope'
import {
  hydrateParserDraft,
  serializeParserDraft,
  type ParserFormValues,
} from './document-parser/draft'
import { parserErrorKey } from './document-parser/errors'
import {
  DocumentBuiltinSelector,
  DocumentPipelineSelector,
  ParserModeSelector,
} from './document-parser/selectors'

interface ChunkMethodModalProps {
  open: boolean
  onClose: () => void
  document: Document | null
  datasetId: string
  tenantId: string
  actorKey: number
  session: number
  errorKey?: string
  onSubmit: (data: DocumentParserSubmission) => Promise<void>
  onMetadataSettingsClick?: (document: Document) => void
  isLoading?: boolean
}

type DraftProps = Omit<ChunkMethodModalProps, 'document'> & {
  document: Document
}

function ParserDraftModal({
  open,
  onClose,
  document,
  datasetId,
  tenantId,
  actorKey,
  onSubmit,
  onMetadataSettingsClick,
  errorKey,
  isLoading = false,
}: DraftProps) {
  const { t } = useTranslation()
  // One immutable snapshot per open/session; background list updates do not rebase edits.
  const [initial] = useState(() => hydrateParserDraft(document))
  const [draftError, setDraftError] = useState<string>()
  const methods = useForm<ParserFormValues>({
    defaultValues: structuredClone(initial),
  })
  const { dirtyFields, isSubmitting } = methods.formState
  const busy = isLoading || isSubmitting

  const handleSubmit = async (data: ParserFormValues) => {
    if (busy) return
    setDraftError(undefined)
    try {
      const patch = serializeParserDraft(initial, data, dirtyFields)
      await onSubmit({ docId: document.id, patch })
    } catch (error) {
      setDraftError(parserErrorKey(error))
    }
  }

  const handleMetadataSettingsClick = useCallback(() => {
    onMetadataSettingsClick?.(document)
  }, [document, onMetadataSettingsClick])
  const parseType = useWatch({ control: methods.control, name: 'parseType' })
  const parserId = useWatch({ control: methods.control, name: 'parser_id' })
  const pipelineId = useWatch({ control: methods.control, name: 'pipeline_id' })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('knowledge.settings.fields.chunkMethod')}
      icon={<Settings2 className="size-icon-lg" />}
      size="lg"
      footer={
        <div className="flex w-full justify-end gap-space-md">
          <Button type="button" variant="outline" onClick={onClose}>
            {t('knowledge.common.cancel')}
          </Button>
          <Button type="submit" form="document-parser-draft" loading={busy}>
            {t('knowledge.common.save')}
          </Button>
        </div>
      }
    >
      <FormProvider {...methods}>
        <ParserFieldScope.Provider value="document">
          <form
            id="document-parser-draft"
            onSubmit={methods.handleSubmit(handleSubmit)}
            className="space-y-space-base"
          >
            {(draftError || errorKey) && (
              <p role="alert" className="text-status-error">
                {t(draftError || errorKey!)}
              </p>
            )}
            <ParserModeSelector
              value={parseType}
              disabled={busy}
              onChange={(value) =>
                methods.setValue('parseType', value, { shouldDirty: true })
              }
            />
            <fieldset disabled={busy} className="space-y-space-base">
              {parseType === 1 ? (
                <DocumentBuiltinSelector
                  document={document}
                  value={parserId}
                  disabled={busy}
                  onChange={(value) =>
                    methods.setValue('parser_id', value, { shouldDirty: true })
                  }
                />
              ) : (
                <DocumentPipelineSelector
                  value={pipelineId}
                  datasetId={datasetId}
                  tenantId={tenantId}
                  actorKey={actorKey}
                  disabled={busy}
                  onChange={(value) =>
                    methods.setValue('pipeline_id', value, {
                      shouldDirty: true,
                    })
                  }
                />
              )}
              {parseType === 1 && parserId && (
                <ChunkMethodForm
                  onMetadataSettingsClick={handleMetadataSettingsClick}
                />
              )}
            </fieldset>
          </form>
        </ParserFieldScope.Provider>
      </FormProvider>
    </Modal>
  )
}

export const ChunkMethodModal: FC<ChunkMethodModalProps> = (props) => {
  if (!props.open || !props.document) return null
  return (
    <ParserDraftModal
      key={`${props.datasetId}:${props.document.id}:${props.actorKey}:${props.session}`}
      {...props}
      document={props.document}
    />
  )
}
