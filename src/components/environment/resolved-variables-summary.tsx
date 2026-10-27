import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'

interface ResolvedVariablesSummaryProps {
  variablesUsed: string[]
  missingVariables: string[]
}

// 变量解析预览中的"使用的变量 / 缺失的变量"，从 EnvironmentDetail 抽出以控制文件体积。
export function ResolvedVariablesSummary({
  variablesUsed,
  missingVariables,
}: ResolvedVariablesSummaryProps) {
  const { t } = useTranslation()

  return (
    <>
      {variablesUsed.length > 0 && (
        <div className="space-y-2">
          <Label>{t('settings.environment.variablesUsed')}</Label>
          <div className="flex flex-wrap gap-1">
            {variablesUsed.map((variable) => (
              <Badge key={variable} variant="secondary" className="text-xs">
                {variable}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {missingVariables.length > 0 && (
        <div className="space-y-2">
          <Label className="text-status-error">
            {t('settings.environment.missingVariables')}
          </Label>
          <div className="flex flex-wrap gap-1">
            {missingVariables.map((variable) => (
              <Badge key={variable} variant="destructive" className="text-xs">
                {variable}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-status-error">
            {t('settings.environment.missingVariablesHint')}
          </p>
        </div>
      )}
    </>
  )
}
