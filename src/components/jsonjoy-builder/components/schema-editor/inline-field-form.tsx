import { Save, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useTranslation } from '../../hooks/use-translation'
import { getTypeLabel } from '../../lib/utils'
import { validateFieldName } from '../../lib/schema-editor'
import type { NewField, SchemaType } from '../../types/json-schema'
import { EDITABLE_TYPES, sanitizeFieldName } from './schema-visual-editor-utils'

type InlineFieldFormProps = {
  initialField?: NewField
  existingNames: string[]
  pattern?: RegExp | string
  submitLabel: string
  onSubmit: (field: NewField) => void
  onCancel: () => void
}

export function InlineFieldForm({
  initialField,
  existingNames,
  pattern,
  submitLabel,
  onSubmit,
  onCancel,
}: InlineFieldFormProps) {
  const t = useTranslation()
  const nameId = useId()
  const descriptionId = useId()
  const typeId = useId()
  const requiredId = useId()
  const [name, setName] = useState(initialField?.name ?? '')
  const [description, setDescription] = useState(
    initialField?.description ?? '',
  )
  const [type, setType] = useState<SchemaType>(initialField?.type ?? 'string')
  const [required, setRequired] = useState(Boolean(initialField?.required))

  const normalizedName = name.trim()
  const duplicateName = existingNames.some(
    (item) => item !== initialField?.name && item === normalizedName,
  )
  const nameError = !normalizedName
    ? t.fieldNameRequired
    : !validateFieldName(normalizedName)
      ? t.fieldNameInvalid
      : duplicateName
        ? t.fieldNameDuplicate
        : null
  const canSubmit = !nameError

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    onSubmit({
      name: normalizedName,
      type,
      description: description.trim(),
      required,
      validation: initialField?.validation,
    })
  }

  return (
    <form
      className="space-y-space-md rounded-radius-md border border-border-subtle bg-surface-secondary p-space-md"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-space-md lg:grid-cols-2">
        <div className="space-y-space-xs">
          <label className="text-sm font-medium" htmlFor={nameId}>
            {t.fieldNameLabel}
          </label>
          <Input
            id={nameId}
            value={name}
            onChange={(event) => {
              setName(sanitizeFieldName(event.target.value, pattern))
            }}
            placeholder={t.fieldNamePlaceholder}
            aria-invalid={Boolean(nameError)}
          />
          {nameError && (
            <p className="text-xs text-status-error">{nameError}</p>
          )}
        </div>
        <div className="space-y-space-xs">
          <label className="text-sm font-medium" htmlFor={typeId}>
            {t.fieldType}
          </label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as SchemaType)}
          >
            <SelectTrigger id={typeId} className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EDITABLE_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {getTypeLabel(t, item)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-space-xs">
        <label className="text-sm font-medium" htmlFor={descriptionId}>
          {t.fieldDescription}
        </label>
        <Textarea
          id={descriptionId}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t.fieldDescriptionPlaceholder}
          className="min-h-[84px]"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-space-md">
        <label
          className="flex items-center gap-space-sm text-sm text-text-secondary"
          htmlFor={requiredId}
        >
          <Checkbox
            id={requiredId}
            checked={required}
            onCheckedChange={(checked) => setRequired(Boolean(checked))}
          />
          {t.fieldRequiredLabel}
        </label>
        <div className="flex items-center gap-space-sm">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            <X className="h-icon-sm w-icon-sm" />
            {t.fieldAddNewCancel}
          </Button>
          <Button type="submit" size="sm" disabled={!canSubmit}>
            <Save className="h-icon-sm w-icon-sm" />
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
