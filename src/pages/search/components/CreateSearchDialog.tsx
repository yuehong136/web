import { useTranslation } from 'react-i18next'
import { toast } from '@/lib/toast'
import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MultiSelectWithSearch } from '@/components/ui/multi-select-with-search'
import { useCreateSearch } from '@/hooks/use-search-request'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { ROUTES } from '@/constants'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { DEFAULT_SEARCH_CONFIG } from '../constants'

interface CreateSearchDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: (searchId: string) => void
}

const CreateSearchDialog: React.FC<CreateSearchDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { createSearch, isLoading } = useCreateSearch()
  const { knowledgeBases } = useFetchKnowledgeList({ page_size: 1000 })

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [kbIds, setKbIds] = useState<string[]>([])
  const [nameError, setNameError] = useState<string | null>(null)

  const kbOptions = knowledgeBases.map((kb) => ({
    label: kb.name,
    value: kb.id,
  }))

  const resetForm = useCallback(() => {
    setName('')
    setDescription('')
    setKbIds([])
    setNameError(null)
  }, [])

  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError(t('searchPage.feedback.nameRequired'))
      return
    }
    if (kbIds.length === 0) {
      toast.error(t('searchPage.feedback.knowledgeRequired'))
      return
    }

    try {
      const result = await createSearch({
        name: trimmedName,
        description: description.trim() || undefined,
        search_config: {
          ...DEFAULT_SEARCH_CONFIG,
          kb_ids: kbIds,
          rerank_id: '',
          web_search: false,
          query_mindmap: false,
          cross_languages: [],
          meta_data_filter: {
            method: 'disabled',
            logic: 'and',
            semi_auto: [],
            manual: [],
          },
        },
      })

      toast.success(t('searchPage.feedback.createTitle'), {
        description: t('searchPage.feedback.createSuccess'),
      })
      resetForm()
      onClose()

      if (onSuccess) {
        onSuccess(result.search_id)
      } else {
        navigate(`${ROUTES.SEARCH}/${result.search_id}`)
      }
    } catch {
      toast.error(t('searchPage.feedback.createFailedTitle'), {
        description: t('searchPage.feedback.createFailed'),
      })
    }
  }, [
    t,
    name,
    description,
    kbIds,
    createSearch,
    navigate,
    resetForm,
    onClose,
    onSuccess,
  ])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-0">
          <div className="mb-2 flex items-center gap-3">
            <EntityAvatar
              name={name}
              size="lg"
              icon={name.trim() ? undefined : <Search />}
            />
            <div>
              <DialogTitle>{t('searchPage.createDialog.title')}</DialogTitle>
              <DialogDescription>
                {t('searchPage.createDialog.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-200px)] space-y-5 overflow-y-auto px-6 py-5">
          {/* Name */}
          <div className="space-y-2">
            <Label>
              {t('searchPage.createDialog.name')}{' '}
              <span className="text-danger-fg">*</span>
            </Label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (nameError) setNameError(null)
              }}
              placeholder={t('searchPage.createDialog.namePlaceholder')}
              variant={nameError ? 'destructive' : 'default'}
              aria-invalid={!!nameError}
            />
            {nameError && <p className="text-xs text-danger-fg">{nameError}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{t('searchPage.createDialog.descriptionLabel')}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('searchPage.createDialog.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          {/* Knowledge Base Selection */}
          <div className="space-y-2">
            <Label>
              {t('searchPage.createDialog.knowledge')}{' '}
              <span className="text-danger-fg">*</span>
            </Label>
            <MultiSelectWithSearch
              options={[
                {
                  label: t('searchPage.createDialog.knowledge'),
                  options: kbOptions,
                },
              ]}
              value={kbIds}
              onChange={setKbIds}
              placeholder={t('searchPage.createDialog.knowledgePlaceholder')}
              emptyText={t('searchPage.createDialog.knowledgeEmpty')}
            />
            <p className="text-xs text-fg-subtle">
              {t('searchPage.createDialog.knowledgeHint')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !name.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('searchPage.createDialog.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateSearchDialog
