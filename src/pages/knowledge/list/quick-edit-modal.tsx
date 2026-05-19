import type { ChangeEvent, FC, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Textarea } from '@/components/ui/textarea'
import type { KnowledgeBase } from '@/types/api'
import type { QuickEditValues } from './types'

interface KnowledgeEditDialogProps {
  open: boolean
  onClose: () => void
  knowledgeBase: KnowledgeBase
  submitting: boolean
  onSubmit: (values: QuickEditValues) => Promise<void>
}

export const KnowledgeQuickEditDialog: FC<KnowledgeEditDialogProps> = ({
  open,
  onClose,
  knowledgeBase,
  submitting,
  onSubmit,
}) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: knowledgeBase.name || '',
    description: knowledgeBase.description || '',
  })

  useEffect(() => {
    setFormData({
      name: knowledgeBase.name || '',
      description: knowledgeBase.description || '',
    })
  }, [knowledgeBase])

  const handleInputChange =
    (field: keyof typeof formData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData((prev) => ({ ...prev, [field]: event.target.value }))
    }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    await onSubmit({
      name: formData.name,
      description: formData.description.trim() || null,
    })
  }

  const handleCancel = () => {
    setFormData({
      name: knowledgeBase.name || '',
      description: knowledgeBase.description || '',
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleCancel}
      title={t('knowledge.list.quickEdit.title')}
      size="md"
      footer={
        <div className="gap-space-sm flex items-center justify-end">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            {t('knowledge.list.quickEdit.actions.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={submitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {t('knowledge.list.quickEdit.actions.save')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="mb-2 block text-sm font-medium text-text-secondary">
            {t('knowledge.list.quickEdit.fields.name')}
            <span className="ml-1 text-text-error">*</span>
          </div>
          <Input
            id="knowledge-quick-edit-name"
            value={formData.name}
            onChange={handleInputChange('name')}
            placeholder={t('knowledge.list.quickEdit.fields.namePlaceholder')}
            title={t('knowledge.list.quickEdit.fields.nameTooltip')}
            required
          />
          <p className="mt-1 text-sm text-text-tertiary">
            {t('knowledge.list.quickEdit.fields.nameRule')}
          </p>
        </div>

        <div>
          <div className="mb-2 block text-sm font-medium text-text-secondary">
            {t('knowledge.list.quickEdit.fields.description')}
          </div>
          <Textarea
            id="knowledge-quick-edit-description"
            value={formData.description}
            onChange={handleInputChange('description')}
            placeholder={t(
              'knowledge.list.quickEdit.fields.descriptionPlaceholder',
            )}
            rows={3}
          />
        </div>
      </form>
    </Modal>
  )
}
