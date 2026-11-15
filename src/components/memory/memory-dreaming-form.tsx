import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import type { MemoryMaintenanceCommand } from '@/types/memory-dreaming'

const splitIds = (value: string) =>
  value.trim() ? value.trim().split(/[\s,]+/) : []
export function parseMaintenanceSourceIds(value: string, max = 32): string[] {
  const ids = splitIds(value)
  if (
    !ids.length ||
    ids.length > max ||
    new Set(ids).size !== ids.length ||
    ids.some(
      (id) => !/^[1-9][0-9]*$/.test(id) || BigInt(id) > 9223372036854775807n,
    )
  )
    throw new Error('invalid_source_ids')
  return ids
}
type Values = {
  sourceIds: string
  entryIds: string
  policy: 'general' | 'preferences' | 'decisions' | 'procedures'
  inputBudget: number
  outputBudget: number
}
export function MemoryDreamingForm({
  disabled,
  managed,
  maxSources,
  onCreate,
  onInspectSources,
}: {
  disabled: boolean
  managed: boolean
  maxSources: number
  onCreate: (command: Omit<MemoryMaintenanceCommand, 'operation_id'>) => void
  onInspectSources: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  const schema = useMemo(
    () =>
      z.object({
        sourceIds: z.string().refine(
          (value) => {
            try {
              parseMaintenanceSourceIds(value, maxSources)
              return true
            } catch {
              return false
            }
          },
          t('memory.dreaming.invalidSources', { count: maxSources }),
        ),
        entryIds: z.string().refine((value) => {
          const ids = splitIds(value)
          return (
            ids.length <= 32 &&
            new Set(ids).size === ids.length &&
            ids.every((id) => /^[0-9a-f]{32}$/.test(id))
          )
        }, t('memory.dreaming.invalidEntries')),
        policy: z.enum(['general', 'preferences', 'decisions', 'procedures']),
        inputBudget: z
          .number({ error: t('memory.dreaming.invalidBudget') })
          .int({ error: t('memory.dreaming.invalidBudget') })
          .min(1024, { error: t('memory.dreaming.invalidBudget') })
          .max(32768, { error: t('memory.dreaming.invalidBudget') }),
        outputBudget: z
          .number({ error: t('memory.dreaming.invalidBudget') })
          .int({ error: t('memory.dreaming.invalidBudget') })
          .min(256, { error: t('memory.dreaming.invalidBudget') })
          .max(8192, { error: t('memory.dreaming.invalidBudget') }),
      }),
    [maxSources, t],
  )
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      sourceIds: '',
      entryIds: '',
      policy: 'general',
      inputBudget: 16384,
      outputBudget: 4096,
    },
  })
  return (
    <Form {...form}>
      <form
        className="space-y-space-base"
        onSubmit={form.handleSubmit((values) =>
          onCreate({
            source_ids: parseMaintenanceSourceIds(values.sourceIds, maxSources),
            entry_ids: splitIds(values.entryIds),
            policy: values.policy,
            input_budget_tokens: values.inputBudget,
            output_budget_tokens: values.outputBudget,
          }),
        )}
      >
        <fieldset disabled={disabled} className="space-y-space-base">
          <FormField
            control={form.control}
            name="sourceIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('memory.dreaming.sourceIds')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    placeholder={t('memory.dreaming.sourcePlaceholder')}
                  />
                </FormControl>
                <FormDescription>
                  {t('memory.dreaming.explicitScope', { count: maxSources })}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              if (await form.trigger('sourceIds'))
                onInspectSources(
                  parseMaintenanceSourceIds(
                    form.getValues('sourceIds'),
                    maxSources,
                  ),
                )
            }}
          >
            {t('memory.dreaming.inspectSources')}
          </Button>
          <FormField
            control={form.control}
            name="entryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('memory.dreaming.entryIds')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  {t('memory.dreaming.entryScope')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-space-base md:grid-cols-3">
            <FormField
              control={form.control}
              name="policy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('memory.dreaming.policy')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        [
                          'general',
                          'preferences',
                          'decisions',
                          'procedures',
                        ] as const
                      ).map((policy) => (
                        <SelectItem key={policy} value={policy}>
                          {t(`memory.dreaming.policies.${policy}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {(['inputBudget', 'outputBudget'] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t(`memory.dreaming.${name}`)}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min={name === 'inputBudget' ? 1024 : 256}
                        max={name === 'inputBudget' ? 32768 : 8192}
                        step={1}
                        onChange={(event) =>
                          field.onChange(event.target.valueAsNumber)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
          <p className="text-xs text-text-secondary">
            {t('memory.dreaming.budgetBoundary')}
          </p>
          {!managed && (
            <p className="text-sm text-status-warning">
              {t('memory.dreaming.requiresManaged')}
            </p>
          )}
          <Button type="submit" disabled={!managed}>
            {t('memory.dreaming.create')}
          </Button>
        </fieldset>
      </form>
    </Form>
  )
}
