import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type {
  MemoryStartupCapabilities,
  MemoryStartupRequest,
} from '@/types/memory-startup'
export function MemoryStartupForm({
  capability,
  pending,
  onDirty,
  onPreview,
}: {
  capability: MemoryStartupCapabilities
  pending: boolean
  onDirty: () => void
  onPreview: (request: MemoryStartupRequest) => void
}) {
  const { t } = useTranslation()
  const identity = z
    .string()
    .refine((value) => new TextEncoder().encode(value).length <= 256)
  const schema = z.object({
    user: identity,
    agent: identity,
    session: identity,
    sessionMode: z.enum(['all', 'exact']),
    entryText: z.string().refine((text) => {
      const ids = text.trim() ? text.trim().split(/[\s,]+/) : []
      return (
        ids.length <= capability.max_entry_ids &&
        new Set(ids).size === ids.length &&
        ids.every((id) => /^[0-9a-f]{32}$/.test(id))
      )
    }),
    budget: z
      .number()
      .int()
      .min(capability.budget_tokens_min)
      .max(capability.budget_tokens_max),
    maxItems: z.number().int().min(1).max(capability.max_items),
    inventory: z.number().int().min(1).max(capability.max_inventory_limit),
  })
  type Values = z.infer<typeof schema>
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      user: '',
      agent: '',
      session: '',
      sessionMode: 'all',
      entryText: '',
      budget: Math.min(4096, capability.budget_tokens_max),
      maxItems: Math.min(8, capability.max_items),
      inventory: Math.min(64, capability.max_inventory_limit),
    },
  })
  const sessionMode = useWatch({ control: form.control, name: 'sessionMode' })
  return (
    <form
      className="min-w-0 space-y-space-base"
      onChange={onDirty}
      onSubmit={form.handleSubmit((value) =>
        onPreview({
          user_id: value.user,
          agent_id: value.agent,
          session_id: value.sessionMode === 'exact' ? value.session : null,
          entry_ids: value.entryText.trim()
            ? value.entryText.trim().split(/[\s,]+/)
            : null,
          budget_tokens: value.budget,
          max_items: value.maxItems,
          inventory_limit: value.inventory,
        }),
      )}
    >
      <div className="grid min-w-0 gap-space-base sm:grid-cols-2">
        {(['user', 'agent'] as const).map((key) => (
          <div key={key} className="min-w-0 space-y-space-xs">
            <Label htmlFor={`startup-${key}`}>
              {t(`memory.startup.${key}`)}
            </Label>
            <Input id={`startup-${key}`} {...form.register(key)} />
          </div>
        ))}
      </div>
      <p className="text-xs text-fg-muted">{t('memory.startup.scopeHint')}</p>
      <div className="min-w-0 space-y-space-xs">
        <Label htmlFor="startup-session-mode">
          {t('memory.startup.session')}
        </Label>
        <Select
          value={sessionMode}
          onValueChange={(mode) => {
            onDirty()
            form.setValue('sessionMode', mode as Values['sessionMode'])
          }}
        >
          <SelectTrigger
            id="startup-session-mode"
            className="h-auto min-h-9 max-w-full text-left whitespace-normal"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('memory.startup.sessionAll')}
            </SelectItem>
            <SelectItem value="exact">
              {t('memory.startup.sessionExact')}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input
          aria-label={t('memory.startup.sessionExact')}
          disabled={sessionMode !== 'exact'}
          {...form.register('session')}
        />
      </div>
      <Label htmlFor="startup-entries">{t('memory.startup.entryIds')}</Label>
      <Textarea id="startup-entries" rows={2} {...form.register('entryText')} />
      <p className="text-xs text-fg-muted">{t('memory.startup.entryHint')}</p>
      <div className="grid min-w-0 gap-space-base sm:grid-cols-3">
        {(
          [
            [
              'budget',
              'budget',
              capability.budget_tokens_min,
              capability.budget_tokens_max,
            ],
            ['maxItems', 'maxItems', 1, capability.max_items],
            ['inventory', 'inventoryLimit', 1, capability.max_inventory_limit],
          ] as const
        ).map(([key, label, min, max]) => (
          <div key={key} className="min-w-0 space-y-space-xs">
            <Label htmlFor={`startup-${key}`}>
              {t(`memory.startup.${label}`)}
            </Label>
            <Input
              id={`startup-${key}`}
              type="number"
              min={min}
              max={max}
              step={1}
              {...form.register(key, { valueAsNumber: true })}
            />
          </div>
        ))}
      </div>
      {!!Object.keys(form.formState.errors).length && (
        <p role="alert" className="text-sm text-danger-fg">
          {t('memory.startup.invalid')}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {t('memory.startup.preview')}
      </Button>
    </form>
  )
}
