import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

const options = [
  {
    value: 'streamable-http',
    label: 'Streamable HTTP',
    descriptionKey: 'mcp.form.httpDescription',
  },
  { value: 'sse', label: 'SSE', descriptionKey: 'mcp.form.sseDescription' },
  {
    value: 'stdio',
    label: 'STDIO',
    descriptionKey: 'mcp.form.stdioDescription',
  },
]

export const MCPProtocolSelect = ({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) => {
  const { t } = useTranslation()
  return (
    <fieldset className="space-y-space-sm">
      <legend className="text-sm font-medium text-text-primary">
        {t('mcp.form.protocol')} <span className="text-status-error">*</span>
      </legend>
      <div className="grid grid-cols-1 gap-space-sm @md:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-w-0 flex-col items-start gap-space-xs rounded-radius-lg border p-space-base text-left focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
              value === option.value
                ? 'border-border-strong bg-state-active'
                : 'border-border-default hover:bg-state-hover',
            )}
          >
            <span className="flex items-center gap-space-xs text-sm font-medium text-text-primary">
              <Globe className="size-icon-sm text-text-secondary" />
              {option.label}
            </span>
            <span className="text-xs text-text-secondary">
              {t(option.descriptionKey)}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
