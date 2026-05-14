'use client'

import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext, useWatch } from 'react-hook-form'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  SelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/select-with-search'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import {
  GraphRagMethodOptions,
  DefaultEntityTypes,
} from '@/types/knowledge-form'

interface GraphRagFormFieldsProps {
  className?: string
}

// 实体类型编辑组件
function EntityTypesFormField({
  name = 'parser_config.graphrag.entity_types',
}: {
  name?: string
}) {
  const { t } = useTranslation()
  const form = useFormContext()
  const [inputValue, setInputValue] = React.useState('')

  const entityTypes: string[] =
    useWatch({
      control: form.control,
      name,
      defaultValue: DefaultEntityTypes,
    }) || []

  const handleAdd = () => {
    const trimmed = inputValue.trim().toLowerCase()
    if (trimmed && !entityTypes.includes(trimmed)) {
      form.setValue(name, [...entityTypes, trimmed])
      setInputValue('')
    }
  }

  const handleRemove = (type: string) => {
    form.setValue(
      name,
      entityTypes.filter((t) => t !== type),
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className="flex items-start gap-1 space-y-0">
          <FormLabel
            required
            tooltip={t('knowledge.settings.graphrag.entityTypesTooltip')}
            className="w-1/4 shrink-0 pt-2 text-sm text-text-secondary"
          >
            {t('knowledge.settings.graphrag.entityTypes')}
          </FormLabel>
          <div className="w-3/4 space-y-2">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t(
                  'knowledge.settings.graphrag.entityTypesPlaceholder',
                )}
                className="h-9 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="h-9 px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {entityTypes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {entityTypes.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {type}
                    <button
                      type="button"
                      onClick={() => handleRemove(type)}
                      className="transition-colors hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  )
}

export function GraphRagFormFields({ className }: GraphRagFormFieldsProps) {
  const { t } = useTranslation()
  const form = useFormContext()

  const useGraphRag = useWatch({
    control: form.control,
    name: 'parser_config.graphrag.use_graphrag',
    defaultValue: false,
  })

  const methodOptions: SelectOptionGroup[] = GraphRagMethodOptions.map(
    (opt) => ({
      label: opt.label,
      value: opt.value,
    }),
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* 启用 GraphRAG */}
      <FormField
        control={form.control}
        name="parser_config.graphrag.use_graphrag"
        render={({ field }) => (
          <FormItem className="flex items-center gap-1 space-y-0">
            <FormLabel
              tooltip={t('knowledge.settings.graphrag.enableTooltip')}
              className="w-1/4 shrink-0 text-sm text-text-secondary"
            >
              {t('knowledge.settings.graphrag.enable')}
            </FormLabel>
            <div className="w-3/4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </div>
          </FormItem>
        )}
      />

      {useGraphRag && (
        <>
          {/* 实体类型 */}
          <EntityTypesFormField />

          {/* 方法选择 */}
          <FormField
            control={form.control}
            name="parser_config.graphrag.method"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel
                  tooltip={
                    <div>
                      <p>
                        <strong>Light</strong>:{' '}
                        {t('knowledge.settings.graphrag.methodTooltipLight')}
                      </p>
                      <p>
                        <strong>General</strong>:{' '}
                        {t('knowledge.settings.graphrag.methodTooltipGeneral')}
                      </p>
                    </div>
                  }
                  className="w-1/4 shrink-0 text-sm text-text-secondary"
                >
                  {t('knowledge.settings.graphrag.method')}
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <SelectWithSearch
                      value={field.value}
                      onChange={field.onChange}
                      options={methodOptions}
                      placeholder={t(
                        'knowledge.settings.graphrag.methodPlaceholder',
                      )}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {/* 实体归一化 */}
          <FormField
            control={form.control}
            name="parser_config.graphrag.resolution"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel
                  tooltip={t('knowledge.settings.graphrag.resolutionTooltip')}
                  className="w-1/4 shrink-0 text-sm text-text-secondary"
                >
                  {t('knowledge.settings.graphrag.resolution')}
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          {/* 社区报告生成 */}
          <FormField
            control={form.control}
            name="parser_config.graphrag.community"
            render={({ field }) => (
              <FormItem className="flex items-center gap-1 space-y-0">
                <FormLabel
                  tooltip={t('knowledge.settings.graphrag.communityTooltip')}
                  className="w-1/4 shrink-0 text-sm text-text-secondary"
                >
                  {t('knowledge.settings.graphrag.community')}
                </FormLabel>
                <div className="w-3/4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </div>
              </FormItem>
            )}
          />
        </>
      )}
    </div>
  )
}

export default GraphRagFormFields
