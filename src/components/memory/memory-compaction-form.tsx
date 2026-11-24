import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { parseMemorySourceIds } from '@/lib/memory-source-ids'
import {
  MEMORY_COMPACTION_LIMITS,
  type MemoryCompactionCommand,
} from '@/types/memory-compaction'
import { MemoryCompactionSources } from './memory-compaction-sources'

export function MemoryCompactionForm({
  locked,
  enabled,
  onGenerate,
  onInspect,
}: {
  locked: boolean
  enabled: boolean
  onGenerate: (draft: Omit<MemoryCompactionCommand, 'operation_id'>) => void
  onInspect: (ids: string[]) => void
}) {
  const { t } = useTranslation()
  const [sources, setSources] = useState(''),
    [prefix, setPrefix] = useState('1')
  const [input, setInput] = useState(
      String(MEMORY_COMPACTION_LIMITS.input.default),
    ),
    [output, setOutput] = useState(
      String(MEMORY_COMPACTION_LIMITS.output.default),
    ),
    [budget, setBudget] = useState(
      String(MEMORY_COMPACTION_LIMITS.package.default),
    ),
    [error, setError] = useState(false)
  const selected = () =>
    parseMemorySourceIds(sources, MEMORY_COMPACTION_LIMITS.sources)
  const generate = () => {
    try {
      const ids = selected(),
        count = Number(prefix)
      if (!Number.isSafeInteger(count) || count < 1 || count > ids.length)
        throw new Error('invalid_prefix')
      for (const [value, limit] of [
        [input, MEMORY_COMPACTION_LIMITS.input],
        [output, MEMORY_COMPACTION_LIMITS.output],
        [budget, MEMORY_COMPACTION_LIMITS.package],
      ] as const) {
        const number = Number(value)
        if (
          !Number.isSafeInteger(number) ||
          number < limit.min ||
          number > limit.max
        )
          throw new Error('invalid_budget')
      }
      setError(false)
      onGenerate({
        source_ids: ids,
        prefix_count: count,
        input_budget_tokens: Number(input),
        output_budget_tokens: Number(output),
        budget_tokens: Number(budget),
      })
    } catch {
      setError(true)
    }
  }
  return (
    <form
      className="min-w-0 space-y-space-base"
      onSubmit={(event) => {
        event.preventDefault()
        generate()
      }}
    >
      <MemoryCompactionSources
        value={sources}
        maximum={MEMORY_COMPACTION_LIMITS.sources}
        disabled={locked}
        onChange={(value) => {
          setSources(value)
          onInspect([])
          setError(false)
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={locked || !sources.trim()}
        onClick={() => {
          try {
            onInspect(selected())
            setError(false)
          } catch {
            setError(true)
          }
        }}
      >
        {t('memory.compaction.inspect')}
      </Button>
      <div className="space-y-space-sm">
        <Label htmlFor="compaction-prefix">
          {t('memory.compaction.prefix')}
        </Label>
        <Input
          id="compaction-prefix"
          type="number"
          min={1}
          max={32}
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          disabled={locked}
        />
        <p className="text-xs text-fg-muted">
          {t('memory.compaction.prefixBoundary')}
        </p>
      </div>
      <div className="grid gap-space-base md:grid-cols-3">
        {[
          {
            name: 'input',
            value: input,
            set: setInput,
            limit: MEMORY_COMPACTION_LIMITS.input,
          },
          {
            name: 'output',
            value: output,
            set: setOutput,
            limit: MEMORY_COMPACTION_LIMITS.output,
          },
          {
            name: 'package',
            value: budget,
            set: setBudget,
            limit: MEMORY_COMPACTION_LIMITS.package,
          },
        ].map((field) => (
          <div key={field.name} className="min-w-0 space-y-space-sm">
            <Label htmlFor={'compaction-' + field.name}>
              {t('memory.compaction.' + field.name + 'Budget')}
            </Label>
            <Input
              id={'compaction-' + field.name}
              type="number"
              min={field.limit.min}
              max={field.limit.max}
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              disabled={locked}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-fg-muted">
        {t('memory.compaction.estimateBoundary')}
      </p>
      {error && (
        <Alert variant="warning">{t('memory.compaction.invalidRequest')}</Alert>
      )}
      <Button type="submit" disabled={locked || !enabled}>
        {t('memory.compaction.generate')}
      </Button>
    </form>
  )
}
