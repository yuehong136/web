/**
 * 记忆类型多选组件
 * 基于 cmdk 实现的多选下拉框，支持搜索、一键清除、关闭
 */

import React from 'react'
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
import { MEMORY_TEXTS } from '@/constants/memory-texts'

// 记忆类型使用字符串，与后端保持一致
type MemoryTypeValue = 'raw' | 'semantic' | 'episodic' | 'procedural'

interface MemoryTypeSelectProps {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  className?: string
}

// 记忆类型选项配置
const memoryTypeOptions: Array<{
  value: MemoryTypeValue
  label: string
  description: string
  required?: boolean
}> = [
  {
    value: 'raw',
    label: MEMORY_TEXTS.memories.raw,
    description: MEMORY_TEXTS.memories.rawDesc,
    required: true, // raw 是必选的
  },
  {
    value: 'semantic',
    label: MEMORY_TEXTS.memories.semantic,
    description: MEMORY_TEXTS.memories.semanticDesc,
  },
  {
    value: 'episodic',
    label: MEMORY_TEXTS.memories.episodic,
    description: MEMORY_TEXTS.memories.episodicDesc,
  },
  {
    value: 'procedural',
    label: MEMORY_TEXTS.memories.procedural,
    description: MEMORY_TEXTS.memories.proceduralDesc,
  },
]

// 记忆类型颜色映射 - 使用 Badge variant
const memoryTypeVariants: Record<MemoryTypeValue, 'blue' | 'purple' | 'green' | 'orange'> = {
  raw: 'blue',
  semantic: 'purple',
  episodic: 'green',
  procedural: 'orange',
}

export const MemoryTypeSelect: React.FC<MemoryTypeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  // 过滤选项
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return memoryTypeOptions
    const query = searchQuery.toLowerCase()
    return memoryTypeOptions.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // 非必选项的数量
  const optionalSelectedCount = value.filter(
    (v) => !memoryTypeOptions.find((o) => o.value === v)?.required
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

  const handleRemove = (type: string, e: React.MouseEvent) => {
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
      (v) => memoryTypeOptions.find((o) => o.value === v)?.required
    )
    onChange(requiredValues)
  }

  const getLabelForType = (type: string) => {
    return memoryTypeOptions.find((o) => o.value === type)?.label || type
  }
  
  const getVariantForType = (type: string): 'blue' | 'purple' | 'green' | 'orange' => {
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
            'w-full justify-between min-h-[42px] h-auto px-3 py-2',
            'bg-background-surface border-border-default',
            'hover:bg-background-subtle',
            className
          )}
        >
          <div className="flex flex-wrap gap-1.5 flex-1">
            {value.length === 0 ? (
              <span className="text-text-muted">
                {MEMORY_TEXTS.common.selectMemoryType}
              </span>
            ) : (
              value.map((type) => {
                const option = memoryTypeOptions.find((o) => o.value === type)
                return (
                  <Badge
                    key={type}
                    variant={getVariantForType(type)}
                    className="text-xs gap-1"
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
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          {/* 头部：搜索 + 操作按钮 */}
          <div className="flex items-center gap-2 p-3 border-b border-border-default">
            <div className="flex-1">
              <Input
                placeholder="搜索记忆类型..."
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
                className="h-8 px-2 text-xs text-text-tertiary hover:text-text-primary shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1" />
                清除
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-8 w-8 p-0 text-text-tertiary hover:text-text-primary shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <CommandList className="max-h-[280px]">
            <CommandEmpty className="py-6 text-center text-sm text-text-tertiary">
              {MEMORY_TEXTS.memories.noMemoryTypeFound}
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
                      'flex items-start gap-3 p-3 cursor-pointer',
                      option.required && isSelected && 'opacity-70'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded border mt-0.5',
                        'border-border-default',
                        isSelected && 'bg-text-accent border-text-accent'
                      )}
                    >
                      {isSelected && (
                        <Check className="w-icon-xs h-icon-xs text-white" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {option.label}
                        </span>
                        {option.required && (
                          <Badge variant="outline" className="text-xs">
                            {MEMORY_TEXTS.memories.required}
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
          <div className="px-3 py-2 border-t border-border-default bg-surface-secondary/30 text-xs text-text-tertiary">
            已选择 {value.length} 项（必选 1 项）
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

MemoryTypeSelect.displayName = 'MemoryTypeSelect'
