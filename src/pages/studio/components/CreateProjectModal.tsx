import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppWindow, Bot } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateProject: (type: 'app' | 'agent') => void
}
export function CreateProjectModal({
  isOpen,
  onClose,
  onCreateProject,
}: CreateProjectModalProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<'app' | 'agent' | ''>('')
  const id = useId()
  const close = () => {
    setSelected('')
    onClose()
  }
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent size="lg" modal>
        <DialogHeader>
          <DialogTitle id={`${id}-title`}>
            {t('studio.projectType.title')}
          </DialogTitle>
          <DialogDescription>
            {t('studio.projectType.description')}
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          aria-labelledby={`${id}-title`}
          value={selected}
          onValueChange={(value) => setSelected(value as 'app' | 'agent')}
          className="grid grid-cols-1 gap-space-md p-space-lg sm:grid-cols-2"
        >
          {(['app', 'agent'] as const).map((type) => (
            <Label
              key={type}
              htmlFor={`${id}-${type}`}
              className={cn(
                'flex cursor-pointer flex-col gap-space-base rounded-radius-lg border p-space-lg',
                selected === type
                  ? 'border-state-focus bg-state-selected-bg'
                  : 'border-border-default bg-background-surface hover:border-border-strong',
              )}
            >
              <div className="flex items-center justify-between gap-space-sm">
                {type === 'app' ? (
                  <AppWindow
                    className="size-icon-lg text-text-secondary"
                    aria-hidden="true"
                  />
                ) : (
                  <Bot
                    className="size-icon-lg text-text-secondary"
                    aria-hidden="true"
                  />
                )}
                <RadioGroupItem
                  id={`${id}-${type}`}
                  value={type}
                  aria-label={t(`studio.projectType.${type}Title`)}
                />
              </div>
              <span className="text-base font-semibold text-text-primary">
                {t(`studio.projectType.${type}Title`)}
              </span>
              <span className="text-sm leading-relaxed text-text-secondary">
                {t(`studio.projectType.${type}Description`)}
              </span>
            </Label>
          ))}
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onCreateProject(selected)
                setSelected('')
              }
            }}
          >
            {t('studio.projectType.continue')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
