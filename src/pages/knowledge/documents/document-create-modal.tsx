import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { knowledgeAPI } from '@/api/knowledge'
import {
  DocumentCreationMode,
  type CreatedDatasetDocument,
} from '@/api/knowledge-rest'
import { Button, Input, Modal, Switch } from '@/components/ui'
import { toast } from '@/lib/toast'

type CreateMode = DocumentCreationMode.WEB | DocumentCreationMode.EMPTY

interface DocumentCreateModalProps {
  mode: CreateMode
  kbId: string
  onClose: () => void
  onCreated: (document: CreatedDatasetDocument, mode: CreateMode) => void
}

export function DocumentCreateModal({
  mode,
  kbId,
  onClose,
  onCreated,
}: DocumentCreateModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [nameError, setNameError] = useState('')
  const [urlError, setUrlError] = useState('')
  const [parseAfterCreate, setParseAfterCreate] = useState(true)
  const [pending, setPending] = useState(false)
  const isWeb = mode === DocumentCreationMode.WEB

  const handleClose = () => {
    if (!pending) onClose()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (pending) return

    const documentName = name.trim()
    const webpageUrl = url.trim()
    const nextNameError = !documentName
      ? t('documentCreate.nameRequired')
      : new TextEncoder().encode(documentName).length > 255
        ? t('documentCreate.nameTooLong')
        : ''
    let nextUrlError = ''
    if (isWeb) {
      try {
        const parsed = new URL(webpageUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          nextUrlError = t('documentCreate.urlInvalid')
        }
      } catch {
        nextUrlError = t('documentCreate.urlInvalid')
      }
    }
    setNameError(nextNameError)
    setUrlError(nextUrlError)
    if (nextNameError || nextUrlError) return

    setPending(true)
    try {
      const created = isWeb
        ? await knowledgeAPI.document.createWeb(kbId, documentName, webpageUrl)
        : await knowledgeAPI.document.createEmpty(kbId, documentName)
      toast.success(
        t(isWeb ? 'documentCreate.webSuccess' : 'documentCreate.blankSuccess'),
      )
      if (isWeb && parseAfterCreate) {
        try {
          await knowledgeAPI.document.parse(kbId, [created.id])
          toast.success(t('documentCreate.parseStarted'))
        } catch {
          toast.error(t('documentCreate.parseFailed'))
        }
      }
      onCreated(created, mode)
    } catch {
      toast.error(t('documentCreate.createFailed'))
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open
      onClose={handleClose}
      showCloseButton={!pending}
      title={t(isWeb ? 'documentCreate.webTitle' : 'documentCreate.blankTitle')}
      description={t(
        isWeb
          ? 'documentCreate.webDescription'
          : 'documentCreate.blankDescription',
      )}
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="gap-space-base flex flex-col"
      >
        <Input
          label={t('documentCreate.name')}
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setNameError('')
          }}
          placeholder={t(
            isWeb
              ? 'documentCreate.webNamePlaceholder'
              : 'documentCreate.blankNamePlaceholder',
          )}
          error={nameError}
          disabled={pending}
          required
        />
        {isWeb && (
          <Input
            label={t('documentCreate.url')}
            type="url"
            value={url}
            onChange={(event) => {
              setUrl(event.target.value)
              setUrlError('')
            }}
            placeholder={t('documentCreate.urlPlaceholder')}
            error={urlError}
            disabled={pending}
            required
          />
        )}
        {isWeb && (
          <div className="gap-space-base rounded-radius-lg bg-surface-secondary p-space-base flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                {t('documentCreate.parseAfterCreate')}
              </p>
              <p className="text-text-caption text-xs">
                {t('documentCreate.parseAfterCreateDescription')}
              </p>
            </div>
            <Switch
              checked={parseAfterCreate}
              onCheckedChange={setParseAfterCreate}
              disabled={pending}
              aria-label={t('documentCreate.parseAfterCreate')}
            />
          </div>
        )}
        <div className="gap-space-sm pt-space-base flex justify-end border-t border-border-subtle">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={pending}
          >
            {t('knowledge.common.cancel')}
          </Button>
          <Button type="submit" loading={pending} disabled={pending}>
            {t(pending ? 'documentCreate.creating' : 'documentCreate.create')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
