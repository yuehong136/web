import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'

interface ResolvedVariablesSummaryProps {
  variablesUsed: string[]
  missingVariables: string[]
}

/** The variables a resolution used, and the references it could not resolve. */
export function ResolvedVariablesSummary({
  variablesUsed,
  missingVariables,
}: ResolvedVariablesSummaryProps) {
  const { t } = useTranslation()

  return (
    <>
      {variablesUsed.length > 0 && (
        <div className="space-y-space-xs">
          <h3 className="text-sm font-medium text-fg">
            {t('environment.resolve.variablesUsed')}
          </h3>
          <ul className="flex flex-wrap gap-space-xs">
            {variablesUsed.map((variable) => (
              <li key={variable}>
                <Badge tone="success" className="font-mono">
                  {variable}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}

      {missingVariables.length > 0 && (
        <div className="space-y-space-xs">
          <h3 className="text-sm font-medium text-danger-fg">
            {t('environment.resolve.missingVariables')}
          </h3>
          <ul className="flex flex-wrap gap-space-xs">
            {missingVariables.map((variable) => (
              <li key={variable}>
                <Badge tone="danger" className="font-mono">
                  {variable}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="text-xs text-fg-subtle">
            {t('environment.resolve.missingVariablesHint')}
          </p>
        </div>
      )}
    </>
  )
}
