import { useCallback, useState, type FC } from 'react'
import { Database } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { CreateKnowledgeForm } from '../create/create-knowledge-form'

interface CreateKnowledgeModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (knowledgeBaseId: string) => void
}

export const CreateKnowledgeModal: FC<CreateKnowledgeModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isSubmitting) {
        onClose()
      }
    },
    [isSubmitting, onClose],
  )

  const handleCreated = useCallback(
    (knowledgeBaseId: string) => {
      onClose()
      onSuccess?.(knowledgeBaseId)
    },
    [onClose, onSuccess],
  )

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-hidden" size="lg">
        <DialogHeader className="pb-0">
          <div className="gap-space-sm flex items-center">
            <div
              className={cn(
                'rounded-radius-xl flex h-10 w-10 items-center justify-center',
                'bg-gradient-to-br from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
              )}
            >
              <Database className="h-5 w-5 text-text-inverted" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg font-semibold text-text-primary">
                {t('knowledge.create.title')}
              </DialogTitle>
              <DialogDescription className="text-text-secondary">
                {t('knowledge.create.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <CreateKnowledgeForm
          bodyClassName="max-h-[calc(90vh-200px)] overflow-y-auto px-space-lg py-space-base"
          footerClassName="px-space-lg"
          onCancel={onClose}
          onCreated={handleCreated}
          onSubmittingChange={setIsSubmitting}
          submitLabel={t('knowledge.create.actions.create')}
        />
      </DialogContent>
    </Dialog>
  )
}
