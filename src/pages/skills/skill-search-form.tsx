import { useTranslation } from 'react-i18next'
import { ChevronDown, Search } from 'lucide-react'
import type { SkillSearchMode } from '@/api/skill-types'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuLabel,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SkillSearchFormProps {
  draft: string
  onDraftChange: (value: string) => void
  onSubmit: () => void
  submitDisabled?: boolean
  /** Retrieval modes the service offers; omit for protocols without modes. */
  modes?: SkillSearchMode[]
  mode?: SkillSearchMode
  onModeChange?: (mode: SkillSearchMode) => void
  className?: string
}

/**
 * Submit-on-enter search used in the toolbar strip by both skill protocols.
 * Unlike `FilterBar` search it runs only when submitted.
 */
export function SkillSearchForm({
  draft,
  onDraftChange,
  onSubmit,
  submitDisabled = false,
  modes,
  mode,
  onModeChange,
  className,
}: SkillSearchFormProps) {
  const { t } = useTranslation()
  return (
    <form
      role="search"
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-space-sm',
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault()
        if (!submitDisabled) onSubmit()
      }}
    >
      <div className="w-full sm:w-72">
        <Input
          type="search"
          inputSize="sm"
          aria-label={t('skills.query')}
          placeholder={t('skills.query')}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
        />
      </div>
      {modes && mode && onModeChange ? (
        <ActionMenu>
          <ActionMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={`${t('skills.searchMode')}: ${t(`skills.${mode}`)}`}
              className="text-xs font-normal text-text-secondary"
            >
              {t(`skills.${mode}`)}
              <ChevronDown className="size-icon-xs" aria-hidden="true" />
            </Button>
          </ActionMenuTrigger>
          <ActionMenuContent align="start" className="min-w-40">
            <ActionMenuLabel className="px-space-sm py-space-xs text-xs text-text-tertiary">
              {t('skills.searchMode')}
            </ActionMenuLabel>
            <ActionMenuRadioGroup
              value={mode}
              onValueChange={(value) => onModeChange(value as SkillSearchMode)}
            >
              {modes.map((value) => (
                <ActionMenuRadioItem
                  key={value}
                  value={value}
                  disabled={!draft.trim() && value !== 'keyword'}
                >
                  {t(`skills.${value}`)}
                </ActionMenuRadioItem>
              ))}
            </ActionMenuRadioGroup>
          </ActionMenuContent>
        </ActionMenu>
      ) : null}
      <Button
        type="submit"
        variant="outline"
        size="sm"
        disabled={submitDisabled}
      >
        {t('skills.search')}
      </Button>
    </form>
  )
}
