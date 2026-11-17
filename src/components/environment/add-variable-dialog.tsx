import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { VariableType } from '@/types/api'
import {
  VARIABLE_TYPES,
  emptyVariableDraft,
  type VariableDraft,
} from './environment-variables'

interface AddVariableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Validates and stores the draft; the owner closes the dialog on success. */
  onSubmit: (draft: VariableDraft) => Promise<void> | void
}

/** The "add environment variable" form, shared by saved and new environments. */
export function AddVariableDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddVariableDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{t('environment.addVariable.title')}</DialogTitle>
        </DialogHeader>
        {/* Mounted per opening, so every new variable starts empty. */}
        <AddVariableForm
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  )
}

function AddVariableForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void
  onSubmit: AddVariableDialogProps['onSubmit']
}) {
  const { t } = useTranslation()
  const id = useId()
  const [draft, setDraft] = useState<VariableDraft>(emptyVariableDraft)
  const [submitting, setSubmitting] = useState(false)
  const nameInput = useRef<HTMLInputElement>(null)
  // A fresh form starts on the name field.
  useEffect(() => {
    nameInput.current?.focus()
  }, [])
  const update = <K extends keyof VariableDraft>(
    key: K,
    value: VariableDraft[K],
  ) => setDraft((current) => ({ ...current, [key]: value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit(draft)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={submit}>
      <DialogBody className="space-y-space-base">
        <Input
          label={t('environment.addVariable.name')}
          required
          value={draft.key_name}
          onChange={(event) => update('key_name', event.target.value)}
          placeholder={t('environment.addVariable.namePlaceholder')}
          className="font-mono"
          autoComplete="off"
          spellCheck={false}
          ref={nameInput}
        />
        <div className="grid grid-cols-1 gap-space-base sm:grid-cols-2">
          <div className="space-y-space-xs">
            <Label htmlFor={`${id}-type`}>
              {t('environment.addVariable.type')}
            </Label>
            <Select
              value={draft.variable_type}
              onValueChange={(value) =>
                update('variable_type', value as VariableType)
              }
            >
              <SelectTrigger id={`${id}-type`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VARIABLE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`environment.variables.types.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-space-sm sm:pt-space-lg">
            <Switch
              id={`${id}-secret`}
              checked={draft.is_secret}
              onCheckedChange={(checked) => update('is_secret', checked)}
            />
            <Label htmlFor={`${id}-secret`}>
              {t('environment.addVariable.secret')}
            </Label>
          </div>
        </div>
        <Input
          label={t('environment.addVariable.value')}
          value={draft.key_value}
          onChange={(event) => update('key_value', event.target.value)}
          placeholder={t('environment.addVariable.valuePlaceholder')}
          className="font-mono"
          type={draft.is_secret ? 'password' : 'text'}
          autoComplete="off"
          spellCheck={false}
        />
        <div className="space-y-space-xs">
          <Label htmlFor={`${id}-description`}>
            {t('environment.addVariable.description')}
          </Label>
          <Textarea
            id={`${id}-description`}
            value={draft.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder={t('environment.addVariable.descriptionPlaceholder')}
            rows={3}
          />
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" loading={submitting}>
          {t('environment.addVariable.save')}
        </Button>
      </DialogFooter>
    </form>
  )
}
