import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Globe, Plus, Settings2, Zap } from 'lucide-react'
import { badgeVariants } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { useFetchEnvironments } from '@/hooks/use-environment-request'
import { cn } from '@/lib/utils'
import { environmentDotClass } from './environment-color'

interface ModernEnvironmentSelectorProps {
  onEnvironmentChange?: (environmentId: string | null) => void
  onManageClick?: () => void
  className?: string
}

const Dot = ({ className }: { className: string }) => (
  <span
    aria-hidden="true"
    className={cn('size-2 shrink-0 rounded-radius-full', className)}
  />
)

/** Picks the environment whose base URL and variables the API reference uses. */
export function ModernEnvironmentSelector({
  onEnvironmentChange,
  onManageClick,
  className,
}: ModernEnvironmentSelectorProps) {
  const { t } = useTranslation()
  const { selectedEnvironmentId, selectEnvironment } = useEnvironmentStore()
  const { environments, isLoading } = useFetchEnvironments()

  const selectedIndex = environments.findIndex(
    (env) => env.id === selectedEnvironmentId,
  )
  const selectedEnvironment =
    selectedIndex >= 0 ? environments[selectedIndex] : undefined

  const handleEnvironmentSelect = (environmentId: string) => {
    selectEnvironment(environmentId)
    onEnvironmentChange?.(environmentId)
  }

  if (isLoading && environments.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('min-w-40', className)}
        loading
      >
        {t('environment.selector.loading')}
      </Button>
    )
  }

  if (environments.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('min-w-40', className)}
        onClick={onManageClick}
        leftIcon={<Plus aria-hidden="true" />}
      >
        {t('environment.selector.createFirst')}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('max-w-56 min-w-40 justify-between', className)}
        >
          <span className="sr-only">{t('environment.selector.label')}: </span>
          {selectedEnvironment ? (
            <span className="flex min-w-0 flex-1 items-center gap-space-sm">
              <Dot
                className={environmentDotClass(
                  selectedEnvironment.name,
                  selectedIndex,
                )}
              />
              <span className="truncate text-fg">
                {selectedEnvironment.name}
              </span>
              {selectedEnvironment.is_default && (
                <Zap
                  className="size-icon-xs shrink-0 text-warning-fg"
                  aria-label={t('environment.selector.default')}
                />
              )}
              {selectedEnvironment.is_global && (
                <Globe
                  className="size-icon-xs shrink-0 text-fg-subtle"
                  aria-label={t('environment.selector.global')}
                />
              )}
            </span>
          ) : (
            <span className="truncate text-fg-muted">
              {t('environment.selector.choose')}
            </span>
          )}
          <ChevronDown
            className="size-icon-sm shrink-0 text-fg-subtle"
            aria-hidden="true"
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="right"
        className="w-72 max-w-[calc(100vw-2rem)]"
      >
        {environments.map((env, index) => {
          const isSelected = env.id === selectedEnvironmentId
          return (
            <DropdownMenuItem
              key={env.id}
              onClick={() => handleEnvironmentSelect(env.id)}
              aria-current={isSelected ? 'true' : undefined}
              className={cn(
                'items-start py-space-xs',
                isSelected && 'bg-accent-soft text-accent-fg',
              )}
            >
              <span className="flex h-5 items-center">
                <Dot className={environmentDotClass(env.name, index)} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-space-xs">
                  <span className="truncate font-medium">{env.name}</span>
                  {env.is_default && (
                    <span className={cn(badgeVariants(), 'px-space-xs')}>
                      {t('environment.selector.default')}
                    </span>
                  )}
                  {env.is_global && (
                    <Globe
                      className="size-icon-xs shrink-0"
                      aria-label={t('environment.selector.global')}
                    />
                  )}
                </span>
                {env.description ? (
                  <span className="block truncate text-xs text-fg-subtle">
                    {env.description}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-xs text-fg-subtle">
                {t('environment.selector.variableCount', {
                  count: env.variables_count ?? 0,
                })}
              </span>
              <Check
                className={cn(
                  'size-icon-sm shrink-0',
                  isSelected ? 'text-accent-fg' : 'invisible',
                )}
                aria-hidden="true"
              />
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onManageClick?.()}>
          <Settings2 aria-hidden="true" />
          {t('environment.selector.manage')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
