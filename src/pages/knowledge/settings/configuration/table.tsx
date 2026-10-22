'use client'

import { useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { SelectWithSearch } from '@/components/ui/select-with-search'
import type { KnowledgeSettingsFormData } from '@/types/knowledge-form'
import {
  ConfigurationFormContainer,
  MainContainer,
} from '../configuration-form-container'

const roles = ['both', 'indexing', 'metadata'] as const

export function TableConfiguration() {
  const { t } = useTranslation()
  const form = useFormContext<KnowledgeSettingsFormData>()
  const mode =
    useWatch({
      control: form.control,
      name: 'parser_config.table_column_mode',
    }) ?? 'auto'
  const columns =
    useWatch({
      control: form.control,
      name: 'parser_config.table_column_names',
    }) ?? []
  const selectedRoles =
    useWatch({
      control: form.control,
      name: 'parser_config.table_column_roles',
    }) ?? {}
  const label = (key: string) =>
    t(`knowledge.settings.configuration.table.${key}`)
  const [scrollTop, setScrollTop] = useState(0)
  const virtual = columns.length > 200
  const start = virtual ? Math.max(0, Math.floor(scrollTop / 60) - 3) : 0
  const indices = Array.from(
    { length: virtual ? Math.min(13, columns.length - start) : columns.length },
    (_, offset) => start + offset,
  )

  return (
    <MainContainer>
      <ConfigurationFormContainer>
        <FormField
          control={form.control}
          name="parser_config.table_column_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{label('mode')}</FormLabel>
              <FormControl>
                <SelectWithSearch
                  searchPlaceholder={t('common.search')}
                  emptyText={t('common.noResults')}
                  value={mode}
                  onChange={field.onChange}
                  ariaLabel={label('mode')}
                  options={['auto', 'manual'].map((value) => ({
                    value,
                    label: label(value),
                  }))}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <p className="text-sm text-text-secondary">
          {label(mode === 'auto' ? 'autoDescription' : 'description')}
        </p>
        {mode === 'manual' &&
          (columns.length ? (
            <fieldset
              onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
              className={virtual ? 'h-96 overflow-auto' : ''}
              aria-label={label('roles')}
            >
              <div
                className="relative"
                style={virtual ? { height: columns.length * 60 } : undefined}
              >
                {indices.map((index) => {
                  const column = columns[index]
                  return (
                    <div
                      key={column}
                      className="flex min-h-15 items-center gap-4"
                      style={
                        virtual
                          ? {
                              position: 'absolute',
                              top: index * 60,
                              width: '100%',
                            }
                          : undefined
                      }
                    >
                      <span className="min-w-0 flex-1 text-sm break-words text-text-primary">
                        {column}
                      </span>
                      <SelectWithSearch
                        searchPlaceholder={t('common.search')}
                        emptyText={t('common.noResults')}
                        value={selectedRoles[column] ?? 'both'}
                        ariaLabel={column}
                        triggerClassName="w-36"
                        options={roles.map((value) => ({
                          value,
                          label: label(value),
                        }))}
                        onChange={(role) =>
                          form.setValue(
                            'parser_config.table_column_roles',
                            {
                              ...form.getValues(
                                'parser_config.table_column_roles',
                              ),
                              [column]: role as (typeof roles)[number],
                            },
                            { shouldDirty: true },
                          )
                        }
                      />
                    </div>
                  )
                })}
              </div>
            </fieldset>
          ) : (
            <p className="text-sm text-text-secondary">{label('empty')}</p>
          ))}
        <p className="text-sm text-text-secondary">{label('reparse')}</p>
      </ConfigurationFormContainer>
    </MainContainer>
  )
}
