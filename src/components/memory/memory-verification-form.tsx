import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
export interface MemoryVerificationDraft {
  result: 'human_confirmed' | 'disputed' | 'needs_review'
  method: 'source_comparison' | 'external_check' | 'other'
  applicability: string
  notes: string
  evidence: { description: string; reference: string }[]
}
export function MemoryVerificationForm({
  locked,
  onSubmit,
}: {
  locked: boolean
  onSubmit: (value: MemoryVerificationDraft) => void
}) {
  const { t } = useTranslation(),
    id = useId()
  const [value, setValue] = useState<MemoryVerificationDraft>({
    result: 'needs_review',
    method: 'source_comparison',
    applicability: '',
    notes: '',
    evidence: [{ description: '', reference: '' }],
  })
  const [confirmed, setConfirmed] = useState(false)
  const evidence = value.evidence.filter(
    (item) => item.description.trim() || item.reference.trim(),
  )
  const valid =
    value.applicability.trim().length > 0 &&
    value.applicability.length <= 1024 &&
    value.notes.length <= 2048 &&
    value.notes.trim().length > 0 &&
    evidence.length <= 8 &&
    evidence.every(
      (item) =>
        item.description.trim() &&
        item.description.length <= 1024 &&
        item.reference.length <= 1024,
    )
  const change = (next: MemoryVerificationDraft) => {
    setValue(next)
    setConfirmed(false)
  }
  return (
    <form
      className="space-y-space-base"
      onSubmit={(event) => {
        event.preventDefault()
        if (valid && confirmed && !locked) onSubmit({ ...value, evidence })
      }}
    >
      <fieldset disabled={locked} className="min-w-0 space-y-space-base">
        <div className="grid min-w-0 gap-space-base sm:grid-cols-2">
          <div className="min-w-0 space-y-space-xs">
            <Label htmlFor={`${id}-result`}>
              {t('memory.verification.conclusion')}
            </Label>
            <Select
              value={value.result}
              onValueChange={(result) =>
                change({
                  ...value,
                  result: result as MemoryVerificationDraft['result'],
                })
              }
            >
              <SelectTrigger
                id={`${id}-result`}
                className="h-auto min-h-9 text-left whitespace-normal"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['human_confirmed', 'disputed', 'needs_review'] as const).map(
                  (result) => (
                    <SelectItem key={result} value={result}>
                      {t(`memory.verification.results.${result}`)}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0 space-y-space-xs">
            <Label htmlFor={`${id}-method`}>
              {t('memory.verification.method')}
            </Label>
            <Select
              value={value.method}
              onValueChange={(method) =>
                change({
                  ...value,
                  method: method as MemoryVerificationDraft['method'],
                })
              }
            >
              <SelectTrigger
                id={`${id}-method`}
                className="h-auto min-h-9 text-left whitespace-normal"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  ['source_comparison', 'external_check', 'other'] as const
                ).map((method) => (
                  <SelectItem key={method} value={method}>
                    {t(`memory.verification.methods.${method}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Label htmlFor={`${id}-scope`}>
          {t('memory.verification.applicability')}
        </Label>
        <Textarea
          id={`${id}-scope`}
          maxLength={1024}
          value={value.applicability}
          onChange={(event) =>
            change({ ...value, applicability: event.target.value })
          }
        />
        <Label htmlFor={`${id}-notes`}>
          {t('memory.verification.evidence')}
        </Label>
        <Textarea
          id={`${id}-notes`}
          maxLength={2048}
          value={value.notes}
          onChange={(event) => change({ ...value, notes: event.target.value })}
        />
        {value.evidence.map((item, index) => (
          <div
            key={index}
            className="min-w-0 space-y-space-sm rounded-radius-md border border-border-default p-space-sm"
          >
            <Label htmlFor={`${id}-description-${index}`}>
              {t('memory.verification.evidenceDescription', {
                index: index + 1,
              })}
            </Label>
            <Textarea
              id={`${id}-description-${index}`}
              maxLength={1024}
              value={item.description}
              onChange={(event) =>
                change({
                  ...value,
                  evidence: value.evidence.map((entry, i) =>
                    i === index
                      ? { ...entry, description: event.target.value }
                      : entry,
                  ),
                })
              }
            />
            <Label htmlFor={`${id}-reference-${index}`}>
              {t('memory.verification.reference')}
            </Label>
            <Input
              id={`${id}-reference-${index}`}
              maxLength={1024}
              value={item.reference}
              onChange={(event) =>
                change({
                  ...value,
                  evidence: value.evidence.map((entry, i) =>
                    i === index
                      ? { ...entry, reference: event.target.value }
                      : entry,
                  ),
                })
              }
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                change({
                  ...value,
                  evidence: value.evidence.filter((_, i) => i !== index),
                })
              }
            >
              {t('memory.verification.removeEvidence')}
            </Button>
          </div>
        ))}
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={value.evidence.length >= 8}
          onClick={() =>
            change({
              ...value,
              evidence: [...value.evidence, { description: '', reference: '' }],
            })
          }
        >
          {t('memory.verification.addEvidence')}
        </Button>
        <p className="text-xs text-text-secondary">
          {t('memory.verification.humanTime')}
        </p>
        <div className="flex items-start gap-space-sm">
          <Checkbox
            id={`${id}-confirm`}
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
          />
          <Label htmlFor={`${id}-confirm`} className="min-w-0">
            {t('memory.verification.confirmSnapshot')}
          </Label>
        </div>
        <Button type="submit" disabled={!valid || !confirmed}>
          {t('memory.verification.record')}
        </Button>
      </fieldset>
    </form>
  )
}
