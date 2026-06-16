import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckIcon, ChevronDownIcon, XCircleIcon, XIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'
import { KnowledgeBaseAvatar } from './KnowledgeBaseAvatar'

interface KnowledgeBaseSelectorProps {
  selectedIds: string[]
  onChange: (ids: string[]) => void
  knowledgeBases: KnowledgeBase[]
  extraKnowledgeBases?: KnowledgeBase[]
  onLoadMore?: (
    search?: string,
    page?: number,
  ) => Promise<{ kbs: KnowledgeBase[]; total: number }>
  placeholder?: string
  disabled?: boolean
  className?: string
  showLabel?: boolean
  label?: string
  tooltip?: string
}

const EMPTY_KNOWLEDGE_BASES: KnowledgeBase[] = []

const KnowledgeBaseOptionLabel: FC<{
  kb: KnowledgeBase
  isSelected: boolean
  isDisabled?: boolean
}> = ({ kb, isSelected, isDisabled }) => (
  <div
    className={cn(
      'flex w-full min-w-0 items-center gap-2 py-1',
      isDisabled && 'opacity-50',
    )}
  >
    <div
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border',
        isSelected
          ? 'border-primary bg-primary'
          : 'border-border-default opacity-50',
        isDisabled && 'cursor-not-allowed',
      )}
    >
      {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
    </div>

    <KnowledgeBaseAvatar name={kb.name} avatar={kb.avatar} size="md" />

    <span
      className={cn(
        'flex-1 truncate text-sm',
        isDisabled && 'text-text-disabled',
      )}
    >
      {kb.name}
    </span>

    {kb.nickname && (
      <div
        className={cn(
          'max-w-[120px] shrink-0 truncate rounded-md border px-2 py-0.5 text-xs',
          'border-border-subtle bg-background-subtle text-text-secondary',
          isDisabled && 'text-text-disabled',
        )}
        title={kb.nickname}
      >
        {kb.nickname}
      </div>
    )}

    {kb.embd_id && (
      <div
        className={cn(
          'max-w-[160px] shrink-0 truncate rounded-md border px-2 py-0.5 text-xs',
          'border-border-subtle bg-background-subtle text-text-secondary',
          isDisabled && 'text-text-disabled',
        )}
      >
        {kb.embd_id}
      </div>
    )}
  </div>
)

const SelectedKnowledgeBaseBadge: FC<{
  kb: KnowledgeBase
  onRemove: () => void
}> = ({ kb, onRemove }) => (
  <Badge
    variant="secondary"
    className="flex h-6 max-w-[240px] items-center gap-1 bg-components-badge-info-bg px-1.5 py-0.5 text-xs text-components-badge-info-text"
  >
    <KnowledgeBaseAvatar name={kb.name} avatar={kb.avatar} size="sm" />
    <span className="min-w-0 truncate">{kb.name}</span>
    {kb.nickname && (
      <span
        className="max-w-[80px] shrink-0 truncate opacity-70"
        title={kb.nickname}
      >
        · {kb.nickname}
      </span>
    )}
    <XCircleIcon
      className="h-4 w-4 shrink-0 cursor-pointer hover:opacity-70"
      onClick={(event) => {
        event.stopPropagation()
        onRemove()
      }}
    />
  </Badge>
)

export const KnowledgeBaseSelector: FC<KnowledgeBaseSelectorProps> = ({
  selectedIds,
  onChange,
  knowledgeBases,
  extraKnowledgeBases = EMPTY_KNOWLEDGE_BASES,
  onLoadMore,
  placeholder,
  disabled = false,
  className,
  showLabel = true,
  label,
  tooltip,
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchResults, setSearchResults] = useState<KnowledgeBase[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const allKnowledgeBases = useMemo(() => {
    const kbMap = new Map<string, KnowledgeBase>()
    knowledgeBases.forEach((kb) => kbMap.set(kb.id, kb))
    extraKnowledgeBases.forEach((kb) => kbMap.set(kb.id, kb))
    searchResults.forEach((kb) => kbMap.set(kb.id, kb))
    return Array.from(kbMap.values())
  }, [extraKnowledgeBases, knowledgeBases, searchResults])

  const selectedKbs = useMemo(() => {
    return selectedIds.map((id) => {
      const kb = allKnowledgeBases.find((item) => item.id === id)
      return (kb || { id, name: id, embd_id: '' }) as KnowledgeBase
    })
  }, [allKnowledgeBases, selectedIds])

  const selectedEmbdId = useMemo(() => {
    if (selectedIds.length === 0) return ''
    const firstSelected = allKnowledgeBases.find(
      (kb) => kb.id === selectedIds[0],
    )
    return firstSelected?.embd_id || ''
  }, [allKnowledgeBases, selectedIds])

  const handleSearch = useCallback(
    async (value: string) => {
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
    },
    [onLoadMore],
  )

  useEffect(() => {
    if (open) {
      setSearchValue('')
      setSearchResults([])
    }
  }, [open])

  const handleSelect = useCallback(
    (kb: KnowledgeBase) => {
      const isDisabled = selectedEmbdId !== '' && kb.embd_id !== selectedEmbdId
      if (isDisabled) return

      if (selectedIds.includes(kb.id)) {
        onChange(selectedIds.filter((id) => id !== kb.id))
      } else {
        onChange([...selectedIds, kb.id])
      }
    },
    [onChange, selectedEmbdId, selectedIds],
  )

  const handleRemove = useCallback(
    (kbId: string) => {
      onChange(selectedIds.filter((id) => id !== kbId))
    },
    [onChange, selectedIds],
  )

  const handleClear = useCallback(() => {
    onChange([])
  }, [onChange])

  const displayKbs = useMemo(() => {
    const keyword = searchValue.trim().toLowerCase()
    if (!keyword) return knowledgeBases
    if (onLoadMore) return searchResults
    return knowledgeBases.filter((kb) => {
      const text =
        `${kb.name ?? ''} ${kb.description ?? ''} ${kb.embd_id ?? ''}`.toLowerCase()
      return text.includes(keyword)
    })
  }, [knowledgeBases, onLoadMore, searchResults, searchValue])

  const placeholderText =
    placeholder ?? t('knowledge.shared.knowledgeBaseSelector.placeholder')
  const labelText = label ?? t('knowledge.shared.knowledgeBaseSelector.label')

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center">
          <span
            className="block text-xs font-medium text-text-primary"
            title={tooltip}
          >
            {labelText}
          </span>
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'hover:bg-accent/30 group min-h-10 w-full justify-between border border-border bg-transparent px-3 font-normal outline-none outline-offset-0 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30',
              selectedIds.length > 0 ? 'h-auto py-1.5' : 'h-10',
            )}
          >
            {selectedIds.length > 0 ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {selectedKbs.map((kb) => (
                    <SelectedKnowledgeBaseBadge
                      key={kb.id}
                      kb={kb}
                      onRemove={() => handleRemove(kb.id)}
                    />
                  ))}
                </div>
                <div className="ml-2 flex shrink-0 items-center">
                  <XIcon
                    size={16}
                    className="mr-2 hidden cursor-pointer text-text-tertiary group-hover:block hover:text-text-secondary"
                    onClick={(event) => {
                      event.stopPropagation()
                      handleClear()
                    }}
                  />
                  <Separator
                    orientation="vertical"
                    className="mr-2 hidden h-4 group-hover:block"
                  />
                  <ChevronDownIcon
                    size={16}
                    className="shrink-0 text-text-tertiary"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 text-left text-sm text-text-tertiary">
                  {placeholderText}
                </span>
                <div className="ml-2 flex shrink-0 items-center">
                  <ChevronDownIcon
                    size={16}
                    className="shrink-0 text-text-tertiary"
                    aria-hidden="true"
                  />
                </div>
              </>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-full min-w-[var(--radix-popper-anchor-width)] border-border p-0"
          align="start"
        >
          <Command className="p-4 pb-12" shouldFilter={false}>
            <CommandInput
              placeholder={t(
                'knowledge.shared.knowledgeBaseSelector.searchPlaceholder',
              )}
              value={searchValue}
              onValueChange={handleSearch}
              className="placeholder:text-text-tertiary"
            />
            <CommandList className="mt-2 max-h-64 outline-none">
              {isSearching ? (
                <div className="py-6 text-center text-sm text-text-tertiary">
                  {t('knowledge.shared.knowledgeBaseSelector.searching')}
                </div>
              ) : displayKbs.length === 0 ? (
                <CommandEmpty>
                  <div className="py-4 text-text-tertiary">
                    {searchValue.trim()
                      ? t('knowledge.shared.knowledgeBaseSelector.noResults')
                      : t('knowledge.shared.knowledgeBaseSelector.empty')}
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {displayKbs.map((kb) => {
                    const isSelected = selectedIds.includes(kb.id)
                    const isDisabled =
                      selectedEmbdId !== '' && kb.embd_id !== selectedEmbdId
                    return (
                      <CommandItem
                        key={kb.id}
                        value={kb.id}
                        onSelect={() => handleSelect(kb)}
                        className={cn(
                          'cursor-pointer',
                          isSelected && 'bg-accent/50',
                          isDisabled && 'cursor-not-allowed opacity-60',
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

            {displayKbs.length > 0 && (
              <div className="bg-background-primary absolute bottom-0 left-0 right-0 mx-4 flex items-center justify-between border-t border-border-subtle">
                <CommandSeparator />
                {selectedIds.length > 0 && (
                  <>
                    <CommandItem
                      onSelect={handleClear}
                      className="flex-1 cursor-pointer justify-center py-2 text-sm"
                    >
                      {t('knowledge.shared.knowledgeBaseSelector.clear')}
                    </CommandItem>
                    <Separator orientation="vertical" className="h-4" />
                  </>
                )}
                <CommandItem
                  onSelect={() => setOpen(false)}
                  className="flex-1 cursor-pointer justify-center py-2 text-sm"
                >
                  {t('knowledge.shared.knowledgeBaseSelector.close')}
                </CommandItem>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
