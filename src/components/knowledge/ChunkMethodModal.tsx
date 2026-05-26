import type { FC } from 'react'
import { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { Settings2 } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import { ChunkMethodForm } from '@/pages/knowledge/settings/ChunkMethodForm'
import type { Document } from '@/types/api'
import { DocumentParserType } from '@/types/document-parser'

interface ChunkMethodModalProps {
  open: boolean
  onClose: () => void
  document: Document | null
  onSubmit: (data: {
    docId: string
    parserId: string
    parserConfig?: Record<string, unknown>
  }) => Promise<void>
  onMetadataSettingsClick?: (document: Document) => void
  isLoading?: boolean
}

interface FormValues {
  parseType: 1 | 2
  parser_id: string
  pipeline_id: string
  parser_config: Record<string, unknown>
}

const PARSER_OPTIONS: SelectOptionGroup[] = [
  { value: 'naive', label: 'General' },
  { value: 'qa', label: 'Q&A' },
  { value: 'resume', label: 'Resume' },
  { value: 'manual', label: 'Manual' },
  { value: 'table', label: 'Table' },
  { value: 'paper', label: 'Paper' },
  { value: 'book', label: 'Book' },
  { value: 'laws', label: 'Laws' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'one', label: 'One' },
  { value: 'tag', label: 'Tag' },
]

const ParseTypeSelector: FC<{
  value: 1 | 2
  onChange: (value: 1 | 2) => void
}> = ({ value, onChange }) => {
  const { t } = useTranslation()

  return (
    <div className="rounded-radius-lg bg-surface-secondary p-space-base border border-border-default">
      <div className="mb-space-sm block text-sm font-medium text-text-primary">
        {t('knowledge.documents.chunkMethodModal.parseMethod')}
      </div>
      <RadioGroup
        value={String(value)}
        onValueChange={(val) => onChange(Number(val) as 1 | 2)}
        className="gap-space-lg flex items-center"
      >
        <div className="gap-space-xs flex cursor-pointer items-center">
          <RadioGroupItem value="1" />
          <span className="text-sm text-text-secondary">
            {t('knowledge.documents.chunkMethodModal.builtin')}
          </span>
        </div>
        <div className="gap-space-xs flex cursor-pointer items-center">
          <RadioGroupItem value="2" />
          <span className="text-sm text-text-secondary">
            {t('knowledge.documents.chunkMethodModal.selectPipeline')}
          </span>
        </div>
      </RadioGroup>
    </div>
  )
}

const BuiltInParserSelector: FC<{
  value: string
  onChange: (value: string) => void
}> = ({ value, onChange }) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
        <span className="text-text-error">*</span>
        {t('knowledge.documents.chunkMethodModal.builtin')}
      </div>
      <SelectWithSearch
        value={value}
        onChange={onChange}
        options={PARSER_OPTIONS}
        placeholder={t(
          'knowledge.documents.chunkMethodModal.parserPlaceholder',
        )}
        emptyText={t('knowledge.documents.chunkMethodModal.parserEmpty')}
      />
    </div>
  )
}

const PipelineSelector: FC<{
  value: string
  onChange: (value: string) => void
  options?: SelectOptionGroup[]
}> = ({ value, onChange, options = [] }) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-sm font-medium text-text-primary">
        <span className="text-text-error">*</span>
        {t('knowledge.documents.chunkMethodModal.selectPipeline')}
      </div>
      <SelectWithSearch
        value={value}
        onChange={onChange}
        options={options}
        placeholder={t(
          'knowledge.documents.chunkMethodModal.pipelinePlaceholder',
        )}
        emptyText={t('knowledge.documents.chunkMethodModal.pipelineEmpty')}
      />
      <p className="text-xs text-text-tertiary">
        {t('knowledge.documents.chunkMethodModal.pipelineTip')}
      </p>
    </div>
  )
}

export const ChunkMethodModal: FC<ChunkMethodModalProps> = ({
  open,
  onClose,
  document,
  onSubmit,
  onMetadataSettingsClick,
  isLoading = false,
}) => {
  const { t } = useTranslation()

  const methods = useForm<FormValues>({
    defaultValues: {
      parseType: 1,
      parser_id: document?.parser_id || DocumentParserType.Naive,
      pipeline_id: '',
      parser_config: document?.parser_config || {},
    },
  })

  useEffect(() => {
    if (document && open) {
      methods.reset({
        parseType: 1,
        parser_id: document.parser_id || DocumentParserType.Naive,
        pipeline_id: '',
        parser_config: document.parser_config || {},
      })
    }
  }, [document, methods, open])

  const handleSubmit = async (data: FormValues) => {
    if (!document) return

    if (data.parseType === 2 && !data.pipeline_id) {
      return
    }

    await onSubmit({
      docId: document.id,
      parserId: data.parseType === 1 ? data.parser_id : data.pipeline_id,
      parserConfig: data.parseType === 1 ? data.parser_config : {},
    })
  }

  const handleMetadataSettingsClick = useCallback(() => {
    if (document) {
      onMetadataSettingsClick?.(document)
    }
  }, [document, onMetadataSettingsClick])

  const parseType = useWatch({
    control: methods.control,
    name: 'parseType',
  })

  const currentParserId = useWatch({
    control: methods.control,
    name: 'parser_id',
  })

  if (!document) return null

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={t('knowledge.settings.fields.chunkMethod')}
        icon={<Settings2 className="h-5 w-5" />}
        size="lg"
        footer={
          <div className="flex w-full justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              {t('knowledge.common.cancel')}
            </Button>
            <Button
              onClick={methods.handleSubmit(handleSubmit)}
              loading={isLoading}
            >
              {t('knowledge.common.save')}
            </Button>
          </div>
        }
      >
        <FormProvider {...methods}>
          <form className="space-y-4">
            <ParseTypeSelector
              value={parseType}
              onChange={(value) => {
                methods.setValue('parseType', value)
                if (value === 1) {
                  methods.setValue('pipeline_id', '')
                }
              }}
            />

            {parseType === 1 && (
              <div className="rounded-radius-lg bg-surface-secondary p-space-base space-y-4 border border-border-default">
                <BuiltInParserSelector
                  value={currentParserId}
                  onChange={(value) => {
                    methods.setValue('parser_id', value)
                    methods.setValue('parser_config', {})
                  }}
                />
              </div>
            )}

            {parseType === 2 && (
              <div className="rounded-radius-lg bg-surface-secondary p-space-base border border-border-default">
                <PipelineSelector
                  value={methods.watch('pipeline_id')}
                  onChange={(value) => methods.setValue('pipeline_id', value)}
                />
              </div>
            )}

            {parseType === 1 && currentParserId && (
              <ChunkMethodForm
                onMetadataSettingsClick={handleMetadataSettingsClick}
              />
            )}
          </form>
        </FormProvider>
      </Modal>
    </>
  )
}
