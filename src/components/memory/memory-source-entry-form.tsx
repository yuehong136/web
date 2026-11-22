import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert } from '@/components/ui/alert'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type {
  MemoryStructuredSourceCommand,
  MemoryStructuredSourcesCapability,
} from '@/types/memory-sources'
export function MemorySourceEntryForm({
  capability,
  onSubmit,
}: {
  capability: MemoryStructuredSourcesCapability
  onSubmit: (
    draft: Omit<MemoryStructuredSourceCommand, 'operation_id' | 'user_id'>,
  ) => void
}) {
  const { t } = useTranslation(),
    error = t('memory.sourceEntry.invalid')
  const schema = z
    .object({
      agent: z
        .string()
        .refine((v) => new TextEncoder().encode(v).length <= 256, error),
      session: z
        .string()
        .refine((v) => new TextEncoder().encode(v).length <= 256, error),
      eventMode: z.enum(['unknown', 'declared']),
      eventTime: z.string(),
      segments: z
        .array(
          z.object({
            role: z.enum(['user', 'assistant', 'tool', 'unknown']),
            content: z.string().refine((v) => !!v.trim(), error),
          }),
        )
        .min(1)
        .max(capability.max_segments),
    })
    .refine(
      (v) =>
        v.eventMode === 'unknown' ||
        (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(
          v.eventTime,
        ) &&
          z.string().datetime({ offset: true }).safeParse(v.eventTime).success),
      { message: error, path: ['eventTime'] },
    )
  type Draft = z.infer<typeof schema>
  const form = useForm<Draft>({
    resolver: zodResolver(schema),
    defaultValues: {
      agent: '',
      session: '',
      eventMode: 'unknown',
      eventTime: '',
      segments: [{ role: 'user', content: '' }],
    },
  })
  const segments = useFieldArray({ control: form.control, name: 'segments' }),
    mode = useWatch({ control: form.control, name: 'eventMode' }),
    values = useWatch({ control: form.control, name: 'segments' })
  return (
    <form
      className="min-w-0 space-y-space-base"
      onSubmit={form.handleSubmit((value) =>
        onSubmit({
          agent_id: value.agent,
          session_id: value.session,
          event_time: value.eventMode === 'unknown' ? null : value.eventTime,
          segments: value.segments,
        }),
      )}
    >
      <Alert variant="info">{t('memory.sourceEntry.boundary')}</Alert>
      <p className="text-xs text-text-secondary">
        {t('memory.sourceEntry.subject')}
      </p>
      <div className="grid gap-space-sm sm:grid-cols-2">
        <div className="space-y-space-xs">
          <Label htmlFor="source-entry-agent">
            {t('memory.sourceEntry.agent')}
          </Label>
          <Input id="source-entry-agent" {...form.register('agent')} />
        </div>
        <div className="space-y-space-xs">
          <Label htmlFor="source-entry-session">
            {t('memory.sourceEntry.session')}
          </Label>
          <Input id="source-entry-session" {...form.register('session')} />
        </div>
      </div>
      <p className="text-xs text-text-secondary">
        {t('memory.sourceEntry.exactScope')}
      </p>
      <div className="space-y-space-xs">
        <Label htmlFor="source-entry-time-mode">
          {t('memory.sourceEntry.eventTime')}
        </Label>
        <Select
          value={mode}
          onValueChange={(v) =>
            form.setValue('eventMode', v as Draft['eventMode'])
          }
        >
          <SelectTrigger id="source-entry-time-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unknown">
              {t('memory.sourceEntry.unknownTime')}
            </SelectItem>
            <SelectItem value="declared">
              {t('memory.sourceEntry.declaredTime')}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === 'declared' && (
        <div className="space-y-space-xs">
          <Label htmlFor="source-entry-time">
            {t('memory.sourceEntry.timestamp')}
          </Label>
          <Input
            id="source-entry-time"
            placeholder={t('memory.sourceEntry.timestampExample')}
            {...form.register('eventTime')}
          />
        </div>
      )}
      {segments.fields.map((field, index) => (
        <fieldset
          key={field.id}
          className="min-w-0 space-y-space-sm rounded-radius-md border border-border-subtle p-space-sm"
        >
          <legend className="text-sm">
            {t('memory.sourceEntry.segment', { count: index + 1 })}
          </legend>
          <Label htmlFor={`source-role-${field.id}`}>
            {t('memory.sourceEntry.role')}
          </Label>
          <Select
            value={values[index]?.role ?? field.role}
            onValueChange={(v) =>
              form.setValue(
                `segments.${index}.role`,
                v as Draft['segments'][number]['role'],
              )
            }
          >
            <SelectTrigger id={`source-role-${field.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(['user', 'assistant', 'tool', 'unknown'] as const).map(
                (role) => (
                  <SelectItem key={role} value={role}>
                    {t(`memory.sources.roles.${role}`)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
          <Label htmlFor={`source-content-${field.id}`}>
            {t('memory.sourceEntry.content')}
          </Label>
          <Textarea
            id={`source-content-${field.id}`}
            rows={4}
            {...form.register(`segments.${index}.content`)}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={segments.fields.length === 1}
            onClick={() => segments.remove(index)}
          >
            {t('memory.sourceEntry.remove', { count: index + 1 })}
          </Button>
        </fieldset>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={segments.fields.length >= capability.max_segments}
        onClick={() => segments.append({ role: 'unknown', content: '' })}
      >
        {t('memory.sourceEntry.add')}
      </Button>
      <p className="text-xs text-text-secondary">
        {t('memory.sourceEntry.limits', {
          count: capability.max_segments,
          bytes: capability.max_content_bytes,
          tokens: capability.max_content_tokens,
        })}
      </p>
      {!!Object.keys(form.formState.errors).length && (
        <p role="alert" className="text-sm text-status-error">
          {error}
        </p>
      )}
      <Button type="submit">{t('memory.sourceEntry.submit')}</Button>
    </form>
  )
}
