/**
 * 记忆类型多选组件
 * 基于 cmdk 实现的多选下拉框，支持搜索、一键清除、关闭
 */

import { useMemo, useState, type MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronsUpDown, Lock, X, Search, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from 'cmdk'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// 记忆类型使用字符串，与后端保持一致
type MemoryTypeValue = 'raw' | 'semantic' | 'episodic' | 'procedural'

interface MemoryTypeSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  className?: string
}

type MemoryTypeOption = {
  value: MemoryTypeValue
  label: string
  description: string
  required?: boolean
}

// 记忆类型颜色映射 - 使用 Badge variant
const memoryTypeVariants: Record<
  MemoryTypeValue,
  'blue' | 'purple' | 'green' | 'orange'
> = {
  raw: 'blue',
  semantic: 'purple',
  episodic: 'green',
  procedural: 'orange',
}

export function MemoryTypeSelect({
  value,
  onChange,
  disabled = false,
  className,
}: MemoryTypeSelectProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const memoryTypeOptions = useMemo<MemoryTypeOption[]>(
    () => [
      {
        value: 'raw',
        label: t('memory.filters.raw'),
        description: t('memory.filters.rawDescription'),
        required: true,
      },
      {
        value: 'semantic',
        label: t('memory.filters.semantic'),
        description: t('memory.filters.semanticDescription'),
      },
      {
        value: 'episodic',
        label: t('memory.filters.episodic'),
        description: t('memory.filters.episodicDescription'),
      },
      {
        value: 'procedural',
        label: t('memory.filters.procedural'),
        description: t('memory.filters.proceduralDescription'),
      },
    ],
    [t],
  )

  // 过滤选项
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return memoryTypeOptions
    const query = searchQuery.toLowerCase()
    return memoryTypeOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description.toLowerCase().includes(query),
    )
  }, [memoryTypeOptions, searchQuery])

  // 非必选项的数量
  const optionalSelectedCount = value.filter(
    (v) => !memoryTypeOptions.find((o) => o.value === v)?.required,
  ).length

  const handleSelect = (type: string) => {
    const option = memoryTypeOptions.find((o) => o.value === type)

    // 如果是必选项，不允许取消选择
    if (option?.required && value.includes(type)) {
      return
    }

    if (value.includes(type)) {
      onChange(value.filter((v) => v !== type))
    } else {
      onChange([...value, type])
    }
  }

  const handleRemove = (type: string, e: MouseEvent) => {
    e.stopPropagation()
    const option = memoryTypeOptions.find((o) => o.value === type)

    // 如果是必选项，不允许移除
    if (option?.required) {
      return
    }

    onChange(value.filter((v) => v !== type))
  }

  // 清除所有非必选项
  const handleClearOptional = () => {
    const requiredValues = value.filter(
      (v) => memoryTypeOptions.find((o) => o.value === v)?.required,
    )
    onChange(requiredValues)
  }

  const getLabelForType = (type: string) => {
    return memoryTypeOptions.find((o) => o.value === type)?.label || type
  }

  const getVariantForType = (
    type: string,
  ): 'blue' | 'purple' | 'green' | 'orange' => {
    return memoryTypeVariants[type as MemoryTypeValue] || 'blue'
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'h-auto min-h-[42px] w-full justify-between px-3 py-2',
            'border-border-default bg-background-surface',
            'hover:bg-background-subtle',
            className,
          )}
        >
          <div className="flex flex-1 flex-wrap gap-1.5">
            {value.length === 0 ? (
              <span className="text-text-muted">
                {t('memory.filters.selectTypePlaceholder')}
              </span>
            ) : (
              value.map((type) => {
                const option = memoryTypeOptions.find((o) => o.value === type)
                return (
                  <Badge
                    key={type}
                    variant={getVariantForType(type)}
                    className="gap-1 text-xs"
                  >
                    {getLabelForType(type)}
                    {option?.required ? (
                      <Lock className="h-3 w-3 opacity-50" />
                    ) : (
                      <X
                        className="h-3 w-3 cursor-pointer hover:opacity-70"
                        onClick={(e) => handleRemove(type, e)}
                      />
                    )}
                  </Badge>
                )
              })
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          {/* 头部：搜索 + 操作按钮 */}
          <div className="flex items-center gap-2 border-b border-border-default p-3">
            <div className="flex-1">
              <Input
                placeholder={t('memory.filters.searchTypePlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            {optionalSelectedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearOptional}
                className="h-8 shrink-0 px-2 text-xs text-text-tertiary hover:text-text-primary"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                {t('memory.common.clear')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 shrink-0 p-0 text-text-tertiary hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-6 text-center text-sm text-text-tertiary">
              {t('memory.filters.noTypeFound')}
            </CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 p-3',
                      option.required && isSelected && 'opacity-70',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 flex h-5 w-5 items-center justify-center rounded border',
                        'border-border-default',
                        isSelected && 'border-text-accent bg-text-accent',
                      )}
                    >
                      {isSelected && (
                        <Check className="w-icon-xs h-icon-xs text-components-button-primary-text" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {option.label}
                        </span>
                        {option.required && (
                          <Badge variant="outline" className="text-xs">
                            {t('memory.filters.required')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">
                        {option.description}
                      </p>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>

          {/* 底部：已选数量提示 */}
          <div className="bg-surface-secondary/30 border-t border-border-default px-3 py-2 text-xs text-text-tertiary">
            {t('memory.common.selectedCount', { count: value.length })}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
