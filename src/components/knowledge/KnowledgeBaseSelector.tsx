import type { ComponentPropsWithoutRef, FC } from 'react'
import { useCallback, useState } from 'react'
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
import { useKnowledgeSelector } from '@/hooks/use-knowledge-selector'
import type { KnowledgeBase } from '@/types/api'
import { EmbeddingModelLabel, KnowledgeAvatar } from './knowledge-identity'

interface KnowledgeBaseSelectorProps extends Pick<
  ComponentPropsWithoutRef<typeof Button>,
  'id' | 'aria-describedby' | 'aria-invalid'
> {
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
        isSelected ? 'border-primary bg-primary' : 'border-line opacity-50',
        isDisabled && 'cursor-not-allowed',
      )}
    >
      {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
    </div>

    <KnowledgeAvatar knowledgeBase={kb} size="xs" />

    <span
      className={cn(
        'flex-1 truncate text-sm',
        isDisabled && 'text-fg-disabled',
      )}
    >
      {kb.name}
    </span>

    {kb.nickname && (
      <div
        className={cn(
          'max-w-[120px] shrink-0 truncate rounded-md border px-2 py-0.5 text-xs',
          'border-line-subtle bg-sunken text-fg-muted',
          isDisabled && 'text-fg-disabled',
        )}
        title={kb.nickname}
      >
        {kb.nickname}
      </div>
    )}

    {kb.embd_id && (
      <div
        className={cn(
          'flex max-w-40 shrink-0 items-center rounded-radius-md border border-line-subtle bg-sunken px-space-sm py-space-2xs',
          isDisabled && 'opacity-60',
        )}
      >
        <EmbeddingModelLabel modelId={kb.embd_id} className="text-fg-muted" />
      </div>
    )}
  </div>
)

const SelectedKnowledgeBaseBadge: FC<{
  kb: KnowledgeBase
  onRemove: () => void
}> = ({ kb, onRemove }) => (
  <Badge className="flex h-6 max-w-[240px] items-center gap-1 bg-info-soft px-1.5 py-0.5 text-xs text-info-fg">
    <KnowledgeAvatar knowledgeBase={kb} size="2xs" />
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
  id,
  'aria-describedby': ariaDescribedby,
  'aria-invalid': ariaInvalid,
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
  const {
    searchValue,
    setSearchValue,
    selectedKbs,
    displayKbs,
    isDisabled,
    isSearching,
    isError,
    retry,
    hasNextPage,
    loadMore,
  } = useKnowledgeSelector(
    selectedIds,
    knowledgeBases,
    extraKnowledgeBases,
    open,
    onLoadMore,
  )

  const handleSelect = useCallback(
    (kb: KnowledgeBase) => {
      if (isDisabled(kb)) return
      onChange(
        selectedIds.includes(kb.id)
          ? selectedIds.filter((id) => id !== kb.id)
          : [...selectedIds, kb.id],
      )
    },
    [onChange, selectedIds, isDisabled],
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

  const placeholderText =
    placeholder ?? t('knowledge.shared.knowledgeBaseSelector.placeholder')
  const labelText = label ?? t('knowledge.shared.knowledgeBaseSelector.label')

  return (
    <div className={cn('space-y-2', className)}>
      {showLabel && (
        <div className="flex items-center">
          <span className="block text-xs font-medium text-fg" title={tooltip}>
            {labelText}
          </span>
        </div>
      )}

      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (nextOpen) setSearchValue('')
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            aria-describedby={ariaDescribedby}
            aria-invalid={ariaInvalid}
            aria-haspopup="listbox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'group min-h-10 w-full justify-between border border-border bg-transparent px-3 font-normal outline-hidden outline-offset-0 hover:bg-fill-hover focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary/30',
              selectedIds.length > 0 ? 'h-auto py-1.5' : 'h-10',
            )}
          >
            {selectedIds.length > 0 ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                  {selectedKbs.map((selected, index) => {
                    const kb =
                      selected ??
                      ({
                        id: selectedIds[index],
                        name: selectedIds[index],
                      } as KnowledgeBase)
                    return (
                      <SelectedKnowledgeBaseBadge
                        key={kb.id}
                        kb={kb}
                        onRemove={() => handleRemove(kb.id)}
                      />
                    )
                  })}
                </div>
                <div className="ml-2 flex shrink-0 items-center">
                  <XIcon
                    size={16}
                    className="mr-2 hidden cursor-pointer text-fg-subtle group-hover:block hover:text-fg-muted"
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
                    className="shrink-0 text-fg-subtle"
                    aria-hidden="true"
                  />
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 text-left text-sm text-fg-subtle">
                  {placeholderText}
                </span>
                <div className="ml-2 flex shrink-0 items-center">
                  <ChevronDownIcon
                    size={16}
                    className="shrink-0 text-fg-subtle"
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
              onValueChange={setSearchValue}
              className="placeholder:text-fg-subtle"
            />
            <CommandList className="mt-2 max-h-64 outline-hidden">
              {isError ? (
                <Button variant="ghost" onClick={retry}>
                  {t('common.retry')}
                </Button>
              ) : isSearching ? (
                <div className="py-6 text-center text-sm text-fg-subtle">
                  {t('knowledge.shared.knowledgeBaseSelector.searching')}
                </div>
              ) : displayKbs.length === 0 ? (
                <CommandEmpty>
                  <div className="py-4 text-fg-subtle">
                    {searchValue.trim()
                      ? t('knowledge.shared.knowledgeBaseSelector.noResults')
                      : t('knowledge.shared.knowledgeBaseSelector.empty')}
                  </div>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {displayKbs.map((kb) => {
                    const isSelected = selectedIds.includes(kb.id)
                    const disabledOption = isDisabled(kb)
                    return (
                      <CommandItem
                        key={kb.id}
                        value={kb.id}
                        onSelect={() => handleSelect(kb)}
                        className={cn(
                          'cursor-pointer',
                          isSelected && 'bg-accent-soft',
                          disabledOption && 'cursor-not-allowed opacity-60',
                        )}
                        disabled={disabledOption}
                      >
                        <KnowledgeBaseOptionLabel
                          kb={kb}
                          isSelected={isSelected}
                          isDisabled={disabledOption}
                        />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
              {hasNextPage && !isSearching && (
                <Button variant="ghost" onClick={loadMore} className="w-full">
                  {t('common.more')}
                </Button>
              )}
            </CommandList>

            {displayKbs.length > 0 && (
              <div className="absolute right-0 bottom-0 left-0 mx-4 flex items-center justify-between border-t border-line-subtle bg-background">
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
