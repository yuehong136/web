import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { AgentRunMode } from '@/types/agent'

interface AgentRunModeProps {
  mode: AgentRunMode | 'session'
  onChange?: (mode: AgentRunMode) => void
  disabled?: boolean
}

/** Describes run intent only; it never infers authority from session titles. */
export function AgentRunMode({ mode, onChange, disabled }: AgentRunModeProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-space-xs">
      {onChange && mode !== 'session' ? (
        <div
          className="flex flex-wrap gap-space-xs"
          role="group"
          aria-label={t('agent.runtime.mode.label')}
        >
          {(['draft', 'published'] as const).map((value) => (
            <Button
              key={value}
              type="button"
              variant={mode === value ? 'secondary' : 'ghost'}
              size="sm"
              aria-pressed={mode === value}
              disabled={disabled}
              onClick={() => onChange(value)}
            >
              {t(`agent.runtime.mode.${value}`)}
            </Button>
          ))}
        </div>
      ) : (
        <Badge variant="outline">{t(`agent.runtime.mode.${mode}`)}</Badge>
      )}
      <p className="text-xs text-text-secondary">
        {t(`agent.runtime.mode.${mode}Description`)}
      </p>
    </div>
  )
}
