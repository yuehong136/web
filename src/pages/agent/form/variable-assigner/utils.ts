import type { useTranslation } from 'react-i18next'
import { camelCase } from 'lodash'
import { VariableAssignerLogicalNumberOperatorLabelMap } from '../../constant'

export function getVariableAssignerOperatorLabel(
  t: ReturnType<typeof useTranslation>['t'],
  operator?: string,
) {
  if (!operator) {
    return ''
  }

  const labelKey = camelCase(
    VariableAssignerLogicalNumberOperatorLabelMap[
      operator as keyof typeof VariableAssignerLogicalNumberOperatorLabelMap
    ] || operator,
  )

  return t(`flow.variableAssignerLogicalOperatorOptions.${labelKey}`, operator)
}
