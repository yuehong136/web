import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react'
import { CheckIcon, ChevronDownIcon, XIcon, XCircleIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { KnowledgeBaseAvatar } from './KnowledgeBaseAvatar'
import { knowledgeAPI } from '@/api/knowledge'
import type { KnowledgeBase } from '@/types/api'

interface KnowledgeBaseSelectorProps {
  /** 已选中的知识库 ID 列表 */
  selectedIds: string[]
  /** 选择变更回调 */
  onChange: (ids: string[]) => void
  /** 知识库列表 */
  knowledgeBases: KnowledgeBase[]
  /** 加载更多知识库的回调（用于搜索） */
  onLoadMore?: (search?: string, page?: number) => Promise<{ kbs: KnowledgeBase[]; total: number }>
  /** 占位文本 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 自定义类名 */
  className?: string
  /** 是否显示标签 */
  showLabel?: boolean
  /** 标签文本 */
  label?: string
  /** 提示文本 */
  tooltip?: string
}

// ============================================================================
// 知识库选项组件
// ============================================================================

// 知识库选项 Label
const KnowledgeBaseOptionLabel: React.FC<{ 
  kb: KnowledgeBase
  isSelected: boolean
  isDisabled?: boolean
}> = ({ kb, isSelected, isDisabled }) => (
  <div className={cn(
    'flex items-center gap-2 min-w-0 w-full py-1',
    isDisabled && 'opacity-50'
  )}>
    {/* Checkbox */}
    <div
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-sm border shrink-0',
        isSelected 
          ? 'bg-primary border-primary' 
          : 'border-border-default opacity-50',
        isDisabled && 'cursor-not-allowed'
      )}
    >
      {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
    </div>
    
    {/* 头像 */}
    <KnowledgeBaseAvatar 
      name={kb.name} 
      avatar={kb.avatar} 
      size="md"
    />
    
    {/* 名称 */}
    <span className={cn(
      'flex-1 truncate text-sm',
      isDisabled && 'text-text-disabled'
    )}>
      {kb.name}
    </span>
    
    {/* Embedding 模型标签 */}
    {kb.embd_id && (
      <div className={cn(
        'text-xs px-2 py-0.5 rounded-md border shrink-0 max-w-[160px] truncate',
        'bg-background-subtle border-border-subtle text-text-secondary',
        isDisabled && 'text-text-disabled'
      )}>
        {kb.embd_id}
      </div>
    )}
  </div>
)

// 已选中的知识库 Badge
const SelectedKnowledgeBaseBadge: React.FC<{
  kb: KnowledgeBase
  onRemove: () => void
}> = ({ kb, onRemove }) => (
  <Badge 
    variant="secondary" 
    className="flex items-center gap-1 px-1.5 py-0.5 text-xs max-w-[180px] h-6"
    style={{
      backgroundColor: 'var(--color-components-badge-info-bg)',
      color: 'var(--color-components-badge-info-text)',
    }}
  >
    <KnowledgeBaseAvatar 
      name={kb.name} 
      avatar={kb.avatar} 
      size="sm"
    />
    <span className="truncate">{kb.name}</span>
    <XCircleIcon 
      className="w-4 h-4 shrink-0 cursor-pointer hover:opacity-70" 
      onClick={(e) => {
        e.stopPropagation()
        onRemove()
      }}
    />
  </Badge>
)

export const KnowledgeBaseSelector: React.FC<KnowledgeBaseSelectorProps> = ({
  selectedIds,
  onChange,
  knowledgeBases,
  onLoadMore,
  placeholder = '选择知识库',
  disabled = false,
  className,
  showLabel = true,
  label = '知识库',
  tooltip,
}) => {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeBase[]>([])
  const [isSearching, setIsSearching] = useState(false)
  // 存储通过 API 获取的缺失知识库详情
  const [fetchedKnowledgeBases, setFetchedKnowledgeBases] = useState<KnowledgeBase[]>([])
  // 跟踪已经尝试获取过的 ID，避免重复请求
  const fetchedIdsRef = useRef<Set<string>>(new Set())

  // 合并知识库列表（已有列表 + 搜索结果 + 额外获取的详情）
  const allKnowledgeBases = useMemo(() => {
    const kbMap = new Map<string, KnowledgeBase>()
    // 先添加已有列表
    knowledgeBases.forEach(kb => kbMap.set(kb.id, kb))
    // 添加搜索结果
    searchResults.forEach(kb => kbMap.set(kb.id, kb))
    // 添加额外获取的知识库详情
    fetchedKnowledgeBases.forEach(kb => kbMap.set(kb.id, kb))
    return Array.from(kbMap.values())
  }, [knowledgeBases, searchResults, fetchedKnowledgeBases])

  // 获取缺失的知识库详情（当 selectedIds 中有 ID 不在已有列表中时）
  useEffect(() => {
    const fetchMissingKnowledgeBases = async () => {
      // 找出不在 allKnowledgeBases 中且未尝试获取过的 ID
      const missingIds = selectedIds.filter(id => {
        const exists = knowledgeBases.some(kb => kb.id === id) || 
                       fetchedKnowledgeBases.some(kb => kb.id === id)
        const alreadyFetched = fetchedIdsRef.current.has(id)
        return !exists && !alreadyFetched
      })

      if (missingIds.length === 0) return

      // 标记为已尝试获取
      missingIds.forEach(id => fetchedIdsRef.current.add(id))

      // 并行获取所有缺失的知识库详情
      const fetchPromises = missingIds.map(async (id) => {
        try {
          const kb = await knowledgeAPI.knowledgeBase.get(id)
          return kb
        } catch (error) {
          console.error(`Failed to fetch knowledge base ${id}:`, error)
          return null
        }
      })

      const results = await Promise.all(fetchPromises)
      const validKbs = results.filter((kb): kb is KnowledgeBase => kb !== null)

      if (validKbs.length > 0) {
        setFetchedKnowledgeBases(prev => [...prev, ...validKbs])
      }
    }

    fetchMissingKnowledgeBases()
  }, [selectedIds, knowledgeBases, fetchedKnowledgeBases])

  // 获取已选中的知识库详情
  const selectedKbs = useMemo(() => {
    return selectedIds.map(id => {
      const kb = allKnowledgeBases.find(k => k.id === id)
      return kb || { id, name: id, embd_id: '' } as KnowledgeBase
    })
  }, [selectedIds, allKnowledgeBases])

  // 获取当前选中知识库的 embedding 模型 ID（用于禁用不同 embedding 的知识库）
  const selectedEmbdId = useMemo(() => {
    if (selectedIds.length === 0) return ''
    const firstSelected = allKnowledgeBases.find(kb => kb.id === selectedIds[0])
    return firstSelected?.embd_id || ''
  }, [selectedIds, allKnowledgeBases])

  // 处理搜索
  const handleSearch = useCallback(async (value: string) => {
    setSearchValue(value)
    
    if (onLoadMore && value.trim()) {
      setIsSearching(true)
      try {
        const result = await onLoadMore(value, 1)
        setSearchResults(result.kbs)
      } catch (error) {
        console.error('Search knowledge bases failed:', error)
      } finally {
        setIsSearching(false)
      }
    } else if (!value.trim()) {
      setSearchResults([])
    }
  }, [onLoadMore])

  // 当打开下拉框时，重置搜索
  useEffect(() => {
    if (open) {
      setSearchValue('')
      setSearchResults([])
    }
  }, [open])

  // 处理选择/取消选择
  const handleSelect = useCallback((kb: KnowledgeBase) => {
    // 检查是否被禁用（不同 embedding 模型）
    const isDisabled = selectedEmbdId !== '' && kb.embd_id !== selectedEmbdId
    if (isDisabled) return

    if (selectedIds.includes(kb.id)) {
      const newIds = selectedIds.filter(id => id !== kb.id)
      onChange(newIds)
    } else {
      onChange([...selectedIds, kb.id])
    }
  }, [selectedIds, selectedEmbdId, onChange])

  // 移除选中的知识库
  const handleRemove = useCallback((kbId: string) => {
    onChange(selectedIds.filter(id => id !== kbId))
  }, [selectedIds, onChange])

  // 清除所有选中
  const handleClear = useCallback(() => {
    onChange([])
  }, [onChange])

  // 显示的知识库列表
  const displayKbs = searchValue.trim() ? searchResults : knowledgeBases

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center">
          <label 
            className="block text-xs font-medium"
            style={{ color: 'var(--color-text-primary)' }}
            title={tooltip}
          >
            {label}
          </label>
        </div>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'bg-transparent hover:bg-accent/30 border border-border w-full justify-between px-3 font-normal outline-offset-0 outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30 group min-h-10',
              selectedIds.length > 0 ? 'h-auto py-1.5' : 'h-10'
            )}
          >
            {selectedIds.length > 0 ? (
              <div className="flex justify-between items-center w-full">
                <div className="flex flex-wrap gap-1 flex-1 min-w-0">
                  {selectedKbs.map(kb => (
                    <SelectedKnowledgeBaseBadge
                      key={kb.id}
                      kb={kb}
                      onRemove={() => handleRemove(kb.id)}
                    />
                  ))}
                </div>
                <div className="flex items-center shrink-0 ml-2">
                  <XIcon
                    size={16}
                    className="text-text-tertiary cursor-pointer hover:text-text-secondary hidden group-hover:block mr-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClear()
                    }}
                  />
                  <Separator orientation="vertical" className="h-4 hidden group-hover:block mr-2" />
                  <ChevronDownIcon
                    size={16}
                    className="text-text-tertiary shrink-0"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 text-text-tertiary text-left text-sm">{placeholder}</span>
                <div className="flex items-center shrink-0 ml-2">
                  <ChevronDownIcon
                    size={16}
                    className="text-text-tertiary shrink-0"
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="border-border w-full min-w-[var(--radix-popper-anchor-width)] p-0"
          align="start"
        >
          <Command className="p-4 pb-12" shouldFilter={false}>
            <CommandInput
              placeholder="搜索..."
              value={searchValue}
              onValueChange={handleSearch}
              className="placeholder:text-text-tertiary"
            />
            <CommandList className="mt-2 outline-none max-h-64">
              {isSearching ? (
                <div className="py-6 text-center text-sm text-text-tertiary">
                  搜索中...
                </div>
              ) : displayKbs.length === 0 ? (
                <CommandEmpty>
                  <div className="text-text-tertiary py-4">
                    {searchValue.trim() ? '未找到匹配的知识库' : '暂无可用知识库'}
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {displayKbs.map((kb) => {
                    const isSelected = selectedIds.includes(kb.id)
                    // 如果已选中了知识库，则禁用不同 embedding 模型的知识库
                    const isDisabled = selectedEmbdId !== '' && kb.embd_id !== selectedEmbdId
                    return (
                      <CommandItem
                        key={kb.id}
                        value={kb.id}
                        onSelect={() => handleSelect(kb)}
                        className={cn(
                          'cursor-pointer',
                          isSelected && 'bg-accent/50',
                          isDisabled && 'cursor-not-allowed opacity-60'
                        )}
                        disabled={isDisabled}
                      >
                        <KnowledgeBaseOptionLabel 
                          kb={kb} 
                          isSelected={isSelected} 
                          isDisabled={isDisabled}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>
            
            {/* 底部操作栏 */}
            {displayKbs.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border-subtle bg-background-primary mx-4">
                <CommandSeparator />
                {selectedIds.length > 0 && (
                  <>
                    <CommandItem
                      onSelect={handleClear}
                      className="flex-1 justify-center cursor-pointer text-sm py-2"
                    >
                      Clear
                    </CommandItem>
                    <Separator orientation="vertical" className="h-4" />
                  </>
                )}
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="flex-1 justify-center cursor-pointer text-sm py-2"
                >
                  关闭
                </CommandItem>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default KnowledgeBaseSelector
