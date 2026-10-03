import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AutoResizeTextarea } from '@/components/mcp/auto-resize-textarea'

interface MCPFormKeyValuesProps {
  entries: Array<{ key: string; value: string }>
  onChange: (index: number, field: 'key' | 'value', value: string) => void
  onRemove: (index: number) => void
  onAdd: () => void
  keyPlaceholder: string
  valuePlaceholder: string
  emptyText: string
  emptyDescription: string
}

export const MCPFormKeyValues = ({
  entries,
  onChange,
  onRemove,
  onAdd,
  keyPlaceholder,
  valuePlaceholder,
  emptyText,
  emptyDescription,
}: MCPFormKeyValuesProps) => {
  const { t } = useTranslation()
  const id = React.useId()
  return (
    <div className="space-y-space-base">
      {entries.length === 0 ? (
        <div className="rounded-radius-lg border border-dashed border-border-default p-space-lg text-center">
          <p className="text-sm text-text-primary">{emptyText}</p>
          <p className="mt-space-xs text-sm text-text-secondary">
            {emptyDescription}
          </p>
        </div>
      ) : (
        entries.map((entry, index) => (
          <div
            key={index}
            className="flex items-start gap-space-sm rounded-radius-lg border border-border-default bg-background-surface p-space-base"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-space-sm">
              <Input
                label={t('mcp.form.key')}
                placeholder={keyPlaceholder}
                value={entry.key}
                inputSize="sm"
                className="font-mono"
                onChange={(event) => onChange(index, 'key', event.target.value)}
              />
              <label
                className="text-sm font-medium text-text-primary"
                htmlFor={`${id}-${index}`}
              >
                {t('mcp.form.value')}
              </label>
              <AutoResizeTextarea
                id={`${id}-${index}`}
                placeholder={valuePlaceholder}
                value={entry.value}
                onChange={(event) =>
                  onChange(index, 'value', event.target.value)
                }
                maxHeight={160}
                className="font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t('mcp.form.removeRow', { index: index + 1 })}
              onClick={() => onRemove(index)}
              className="text-text-secondary hover:text-status-error"
            >
              <Trash2 className="size-icon-sm" />
            </Button>
          </div>
        ))
      )}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="size-icon-sm" />
        {t('mcp.form.addRow')}
      </Button>
    </div>
  )
}
