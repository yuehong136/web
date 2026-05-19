import type { ReactNode } from 'react'
import { Key, MessageCircleQuestion, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, Modal, TagEditor } from '@/components/ui'
import { Textarea } from '@/components/ui/textarea'

interface AddChunkModalProps {
  open: boolean
  onClose: () => void
  content: string
  onContentChange: (content: string) => void
  importantKwd: string[]
  onImportantKwdChange: (keywords: string[]) => void
  questionKwd: string[]
  onQuestionKwdChange: (questions: string[]) => void
  onCreate: () => void
}

export const AddChunkModal = ({
  open,
  onClose,
  content,
  onContentChange,
  importantKwd,
  onImportantKwdChange,
  questionKwd,
  onQuestionKwdChange,
  onCreate,
}: AddChunkModalProps) => {
  const { t } = useTranslation()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('knowledge.chunks.modal.addTitle')}
      size="lg"
    >
      <div className="space-y-5">
        <div>
          <FieldLabel>{t('knowledge.chunks.modal.content')}</FieldLabel>
          <Textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder={t('knowledge.chunks.modal.contentPlaceholder')}
            className="h-40 rounded-md px-3 py-2"
          />
        </div>

        <TagModalSection
          icon={<Key className="h-4 w-4 text-text-accent" />}
          label={t('knowledge.chunks.modal.keywords')}
          value={importantKwd}
          onChange={onImportantKwdChange}
          placeholder={t('knowledge.chunks.modal.keywordPlaceholder')}
          variant="info"
        />

        <TagModalSection
          icon={<MessageCircleQuestion className="h-4 w-4 text-text-warning" />}
          label={t('knowledge.chunks.modal.questions')}
          value={questionKwd}
          onChange={onQuestionKwdChange}
          placeholder={t('knowledge.chunks.modal.questionPlaceholder')}
          variant="warning"
        />

        <div className="flex justify-end space-x-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            {t('knowledge.chunks.modal.cancel')}
          </Button>
          <Button onClick={onCreate} disabled={!content.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            {t('knowledge.chunks.modal.addChunk')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

interface TagModalSectionProps {
  icon: ReactNode
  label: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  variant: 'info' | 'warning'
}

const TagModalSection = ({
  icon,
  label,
  value,
  onChange,
  placeholder,
  variant,
}: TagModalSectionProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <FieldLabel>{label}</FieldLabel>
        <span className="text-xs text-text-tertiary">
          {t('knowledge.chunks.modal.optional')}
        </span>
      </div>
      <div className="rounded-lg border border-border-default bg-background-subtle p-3">
        <TagEditor
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          variant={variant}
        />
      </div>
    </div>
  )
}

const FieldLabel = ({ children }: { children: ReactNode }) => (
  <label className="mb-2 block text-sm font-medium text-text-primary">
    {children}
  </label>
)
