import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import { extractTableColumns } from './table-column-extract'
import type { TableColumnRole, TableUploadConfig } from './table-upload-config'

interface TableFileColumnConfigProps {
  file: File
  disabled: boolean
  onChange: (file: File, config?: TableUploadConfig) => void
}

export function TableFileColumnConfig({
  file,
  disabled,
  onChange,
}: TableFileColumnConfigProps) {
  const { t } = useTranslation()
  const [columns, setColumns] = useState<string[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [mode, setMode] = useState<'inherit' | 'auto' | 'manual'>('inherit')
  const [roles, setRoles] = useState<Record<string, TableColumnRole>>({})
  const [scrollTop, setScrollTop] = useState(0)
  const label = (key: string) =>
    t(`knowledge.settings.configuration.table.${key}`)
  useEffect(() => {
    let active = true
    void extractTableColumns(file).then(
      (names) => {
        if (active) {
          setColumns(names)
          setStatus('ready')
        }
      },
      () => {
        if (active) setStatus('error')
      },
    )
    return () => {
      active = false
    }
  }, [file])

  const roleFor = (name: string): TableColumnRole =>
    Object.hasOwn(roles, name) ? roles[name] : 'both'
  const updateMode = (value: string) => {
    if (value !== 'inherit' && value !== 'auto' && value !== 'manual') return
    if (value === 'manual' && status !== 'ready') return
    setMode(value)
    const nextRoles = Object.fromEntries(
      columns.map((name) => [name, roleFor(name)]),
    )
    setRoles(nextRoles)
    onChange(
      file,
      value === 'inherit'
        ? undefined
        : {
            table_column_mode: value,
            table_column_roles: value === 'manual' ? nextRoles : {},
          },
    )
  }
  const virtual = columns.length > 200
  const start = virtual ? Math.max(0, Math.floor(scrollTop / 60) - 3) : 0
  const visible = columns.slice(start, virtual ? start + 13 : undefined)

  return (
    <fieldset
      disabled={disabled}
      className="space-y-space-sm rounded-radius-md border border-border-subtle p-space-md"
    >
      <legend
        className="max-w-full truncate px-space-xs text-sm font-medium text-text-primary"
        title={file.name}
      >
        {file.name}
      </legend>
      <SelectWithSearch
        searchPlaceholder={t('common.search')}
        emptyText={t('common.noResults')}
        ariaLabel={`${file.name}: ${label('mode')}`}
        value={mode}
        disabled={disabled}
        onChange={updateMode}
        options={[
          {
            value: 'inherit',
            label: t('knowledge.documents.upload.inheritTableConfig'),
          },
          { value: 'auto', label: label('auto') },
          ...(status === 'ready'
            ? [{ value: 'manual', label: label('manual') }]
            : []),
        ]}
      />
      <output className="block text-sm text-text-secondary">
        {status === 'error'
          ? t('knowledge.documents.upload.tableHeadersFailed')
          : status === 'loading'
            ? t('knowledge.documents.upload.readingTableHeaders')
            : t('knowledge.documents.upload.tableHeadersScope')}
      </output>
      {mode === 'manual' && (
        <div
          className={virtual ? 'h-96 overflow-auto' : 'max-h-64 overflow-auto'}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        >
          <div
            className="relative"
            style={virtual ? { height: columns.length * 60 } : undefined}
          >
            {visible.map((column, index) => (
              <div
                key={column}
                className="flex min-h-15 items-center gap-space-md"
                style={
                  virtual
                    ? {
                        position: 'absolute',
                        top: (start + index) * 60,
                        width: '100%',
                      }
                    : undefined
                }
              >
                <span
                  className="min-w-0 flex-1 truncate text-sm text-text-primary"
                  title={column}
                >
                  {column}
                </span>
                <div className="w-40 shrink-0">
                  <SelectWithSearch
                    searchPlaceholder={t('common.search')}
                    emptyText={t('common.noResults')}
                    ariaLabel={`${file.name}: ${column}`}
                    value={roleFor(column)}
                    disabled={disabled}
                    onChange={(value) => {
                      if (
                        value !== 'indexing' &&
                        value !== 'metadata' &&
                        value !== 'both'
                      )
                        return
                      const nextRoles: Record<string, TableColumnRole> = {
                        ...roles,
                        [column]: value,
                      }
                      setRoles(nextRoles)
                      onChange(file, {
                        table_column_mode: 'manual',
                        table_column_roles: nextRoles,
                      })
                    }}
                    options={['both', 'indexing', 'metadata'].map((value) => ({
                      value,
                      label: label(value),
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </fieldset>
  )
}
