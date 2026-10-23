import { Monitor, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuRadioGroup,
  ActionMenuRadioItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import {
  setTheme,
  useAppearance,
  useResolvedAppearance,
  type Theme,
} from '@/themes'

interface ThemeSwitcherProps {
  className?: string
  variant?: 'dropdown' | 'toggle' | 'compact'
}

/** All variants share the appearance owner and keyboard-accessible menu. */
export function ThemeSwitcher({
  className,
  variant = 'toggle',
}: ThemeSwitcherProps) {
  const { t } = useTranslation()
  const { mode } = useAppearance()
  const { resolvedMode } = useResolvedAppearance()
  const themes = [
    { value: 'system', label: t('layout.sidebar.systemTheme'), icon: Monitor },
    { value: 'light', label: t('layout.sidebar.lightTheme'), icon: Sun },
    { value: 'dark', label: t('layout.sidebar.darkTheme'), icon: Moon },
  ] as const
  const selected = themes.find((theme) => theme.value === mode) ?? themes[0]
  const Icon = selected.icon
  if (variant === 'toggle') {
    const next = resolvedMode === 'dark' ? themes[1] : themes[2]
    return (
      <Button
        variant="ghost"
        size="icon-sm"
        className={className}
        aria-label={next.label}
        title={next.label}
        onClick={() => setTheme(next.value)}
      >
        <Icon className="size-icon-sm" />
      </Button>
    )
  }
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          variant={variant === 'compact' ? 'ghost' : 'outline'}
          size={variant === 'compact' ? 'icon-sm' : 'sm'}
          className={className}
          aria-label={t('layout.sidebar.theme')}
        >
          <Icon className="size-icon-sm" />
          {variant === 'dropdown' && selected.label}
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent>
        <ActionMenuRadioGroup
          value={mode}
          onValueChange={(value) => setTheme(value as Theme)}
        >
          {themes.map(({ value, label, icon: OptionIcon }) => (
            <ActionMenuRadioItem key={value} value={value}>
              <OptionIcon className="size-icon-sm" />
              {label}
            </ActionMenuRadioItem>
          ))}
        </ActionMenuRadioGroup>
      </ActionMenuContent>
    </ActionMenu>
  )
}
