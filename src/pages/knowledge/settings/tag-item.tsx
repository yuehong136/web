'use client'

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFormContext, useWatch } from 'react-hook-form'
import { X, Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { SliderInputFormField } from '@/components/forms/SliderInputFormField'
import { useFetchKnowledgeList } from '@/hooks/use-knowledge-request'
import { DocumentParserType } from '@/types/document-parser'

// 标签知识库选择组件
interface TagSetItemProps {
  name?: string
  className?: string
}

export function TagSetItem({
  name = 'parser_config.tag_kb_ids',
  className,
}: TagSetItemProps) {
  const { t } = useTranslation()
  const form = useFormContext()
  const { knowledgeBases } = useFetchKnowledgeList({ page_size: 1000 })
  const [open, setOpen] = useState(false)

  // 过滤出解析器类型为 'tag' 的知识库
  const tagKnowledgeOptions = useMemo(() => {
    return knowledgeBases
      .filter((kb) => kb.parser_id === DocumentParserType.Tag)
      .map((kb) => ({
        label: kb.name,
        value: kb.id,
      }))
  }, [knowledgeBases])

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const selectedValues: string[] = Array.isArray(field.value)
          ? field.value
          : []

        const handleSelect = (value: string) => {
          const newValues = selectedValues.includes(value)
            ? selectedValues.filter((v) => v !== value)
            : [...selectedValues, value]
          field.onChange(newValues)
        }

        const handleRemove = (value: string) => {
          field.onChange(selectedValues.filter((v) => v !== value))
        }

        return (
          <FormItem
            className={cn('flex items-center gap-1 space-y-0', className)}
          >
            <FormLabel
              tooltip={
                <div>
                  <p>{t('knowledge.settings.fields.tagSetTooltip1')}</p>
                  <p className="mt-1">
                    {t('knowledge.settings.fields.tagSetTooltip2')}
                  </p>
                </div>
              }
              className="w-1/4 shrink-0 text-sm text-text-secondary"
            >
              {t('knowledge.settings.fields.tagSet')}
            </FormLabel>
            <div className="w-3/4">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="h-auto min-h-9 w-full justify-between py-1.5"
                      type="button"
                    >
                      <div className="flex flex-wrap gap-1">
                        {selectedValues.length > 0 ? (
                          selectedValues.map((value) => {
                            const option = tagKnowledgeOptions.find(
                              (opt) => opt.value === value,
                            )
                            return (
                              <Badge
                                key={value}
                                variant="secondary"
                                className="mr-1"
                              >
                                {option?.label || value}
                                <button
                                  type="button"
                                  className="ml-1 rounded-full outline-none hover:bg-background-subtle"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemove(value)
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            )
                          })
                        ) : (
                          <span className="text-text-tertiary">
                            {t('knowledge.settings.fields.tagSetPlaceholder')}
                          </span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={t(
                        'knowledge.settings.fields.tagSetSearchPlaceholder',
                      )}
                    />
                    <CommandList>
                      <CommandEmpty>
                        {t('knowledge.settings.fields.tagSetEmpty')}
                      </CommandEmpty>
                      <CommandGroup>
                        {tagKnowledgeOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.value}
                            onSelect={() => handleSelect(option.value)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedValues.includes(option.value)
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {tagKnowledgeOptions.length === 0 && (
                <p className="mt-1 text-xs text-text-tertiary">
                  {t('knowledge.settings.fields.tagSetTip')}
                </p>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}

// TopN 标签数量组件
interface TopNTagsItemProps {
  name?: string
  className?: string
}

export function TopNTagsItem({
  name = 'parser_config.topn_tags',
  className,
}: TopNTagsItemProps) {
  const { t } = useTranslation()

  return (
    <SliderInputFormField
      name={name}
      label={t('knowledge.settings.fields.topNTags')}
      tooltip={t('knowledge.settings.fields.topNTagsTooltip')}
      min={1}
      max={10}
      step={1}
      defaultValue={3}
      layout="horizontal"
      className={className}
    />
  )
}

// 标签管理组合组件
interface TagItemsProps {
  className?: string
}

export function TagItems({ className }: TagItemsProps) {
  const form = useFormContext()

  const tagKbIds = useWatch({
    control: form.control,
    name: 'parser_config.tag_kb_ids',
  })

  const hasSelectedTags = Array.isArray(tagKbIds) && tagKbIds.length > 0

  return (
    <div className={cn('space-y-4', className)}>
      <TagSetItem />
      {hasSelectedTags && <TopNTagsItem />}
    </div>
  )
}
