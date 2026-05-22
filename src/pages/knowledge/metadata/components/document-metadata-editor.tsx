import { useEffect, useState, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { MetadataFieldDefinition } from '@/types/api'

export type DocumentMetadataValue = string | number | boolean | string[]
export type DocumentMetadataRecord = Record<string, DocumentMetadataValue>

interface MetadataEntry {
  key: string
  value: string
}

interface DocumentMetadataEditorProps {
  value: DocumentMetadataRecord
  onChange: (value: DocumentMetadataRecord) => void
  fieldDefinitions?: MetadataFieldDefinition[]
  disabled?: boolean
  readOnly?: boolean
  compact?: boolean
  className?: string
}

export const DocumentMetadataEditor: FC<DocumentMetadataEditorProps> = ({
  value,
  onChange,
  fieldDefinitions = [],
  disabled = false,
  readOnly = false,
  compact = false,
  className,
}) => {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<MetadataEntry[]>([])

  useEffect(() => {
    const initialEntries = Object.entries(value || {}).map(([key, val]) => ({
      key,
      value: Array.isArray(val) ? val.join(', ') : String(val || ''),
    }))
    setEntries(initialEntries.length > 0 ? initialEntries : [])
  }, [value])

  const syncToParent = (newEntries: MetadataEntry[]) => {
    const newValue: DocumentMetadataRecord = {}
    newEntries.forEach(({ key, value: val }) => {
      const trimmedKey = key.trim()
      if (!trimmedKey) return

      if (val.includes(',')) {
        newValue[trimmedKey] = val
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      } else {
        newValue[trimmedKey] = val.trim()
      }
    })
    onChange(newValue)
  }

  const handleAdd = () => {
    const newEntries = [...entries, { key: '', value: '' }]
    setEntries(newEntries)
  }

  const handleUpdate = (
    index: number,
    field: 'key' | 'value',
    newValue: string,
  ) => {
    const newEntries = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: newValue } : entry,
    )
    setEntries(newEntries)
    syncToParent(newEntries)
  }

  const handleRemove = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index)
    setEntries(newEntries)
    syncToParent(newEntries)
  }

  const getFieldEnum = (fieldKey: string): string[] | undefined => {
    const def = fieldDefinitions.find((d) => d.key === fieldKey)
    return def?.enum
  }

  const getUnusedFields = (): MetadataFieldDefinition[] => {
    const usedKeys = new Set(entries.map((e) => e.key))
    return fieldDefinitions.filter((d) => !usedKeys.has(d.key))
  }

  if (readOnly) {
    return (
      <div className={cn('gap-space-xs flex flex-col', className)}>
        {entries.length === 0 ? (
          <span className="text-body-sm text-text-tertiary">
            {t('knowledge.metadata.editor.noMetadata')}
          </span>
        ) : (
          entries.map(({ key, value: val }, index) => (
            <div key={index} className="gap-space-sm flex items-center">
              <span className="text-body-sm min-w-[80px] text-text-secondary">
                {key}:
              </span>
              <span className="text-body-sm text-text-primary">
                {val || '-'}
              </span>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className={cn('gap-space-sm flex flex-col', className)}>
      {entries.map((entry, index) => {
        const enumValues = getFieldEnum(entry.key)
        const hasEnum = enumValues && enumValues.length > 0

        return (
          <div
            key={index}
            className={cn(
              'gap-space-xs flex items-center',
              compact ? 'gap-space-xs' : 'gap-space-sm',
            )}
          >
            {fieldDefinitions.length > 0 ? (
              <Select
                value={entry.key}
                onValueChange={(val) => handleUpdate(index, 'key', val)}
                disabled={disabled}
              >
                <SelectTrigger
                  className={cn(compact ? 'w-[100px]' : 'w-[120px]')}
                >
                  <SelectValue
                    placeholder={t('knowledge.metadata.editor.selectField')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {entry.key && (
                    <SelectItem value={entry.key}>{entry.key}</SelectItem>
                  )}
                  {getUnusedFields().map((def) => (
                    <SelectItem key={def.key} value={def.key}>
                      {def.key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={entry.key}
                onChange={(e) => handleUpdate(index, 'key', e.target.value)}
                placeholder={t('knowledge.metadata.editor.fieldPlaceholder')}
                disabled={disabled}
                className={cn(compact ? 'w-[100px]' : 'w-[120px]')}
              />
            )}

            {hasEnum ? (
              <Select
                value={entry.value}
                onValueChange={(val) => handleUpdate(index, 'value', val)}
                disabled={disabled}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={t('knowledge.metadata.editor.selectValue')}
                  />
                </SelectTrigger>
                <SelectContent>
                  {enumValues.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={entry.value}
                onChange={(e) => handleUpdate(index, 'value', e.target.value)}
                placeholder={t(
                  'knowledge.metadata.editor.valueInputPlaceholder',
                )}
                disabled={disabled}
                className="flex-1"
              />
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(index)}
              disabled={disabled}
              className="h-[32px] w-[32px] shrink-0 p-0 hover:text-status-error"
              aria-label={t('knowledge.metadata.editor.removeValueAria', {
                value: entry.key || entry.value,
              })}
            >
              <X className="w-icon-sm h-icon-sm" />
            </Button>
          </div>
        )
      })}

      {!disabled && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="w-full"
        >
          <Plus className="w-icon-sm h-icon-sm mr-space-xs" />
          {t('knowledge.metadata.editor.addMetadataButton')}
        </Button>
      )}

      {entries.length === 0 && disabled && (
        <span className="text-body-sm py-space-sm text-center text-text-tertiary">
          {t('knowledge.metadata.editor.noMetadata')}
        </span>
      )}
    </div>
  )
}
