/** 报告级属性(空选 / 主题时显示):报告标题、副标题、主题主色。 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import type { SkeletonSchema } from '../../types'
import type { DraftAction } from '../use-skeleton-draft'
import { InspectorField, InspectorHeading } from './field-primitives'

interface ReportFieldsProps {
  present: SkeletonSchema
  dispatch: React.Dispatch<DraftAction>
}

export function ReportFields({ present, dispatch }: ReportFieldsProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-space-md p-space-base">
      <InspectorHeading
        text={t('flow.htmlReportReportSettings', 'Report settings')}
      />
      <InspectorField label={t('flow.htmlReportTitle', 'Report title')}>
        <Input
          inputSize="sm"
          value={present.title}
          onChange={(e) =>
            dispatch({
              type: 'setReportField',
              key: 'title',
              value: e.target.value,
            })
          }
        />
      </InspectorField>
      <InspectorField label={t('flow.htmlReportSubtitle', 'Report subtitle')}>
        <Input
          inputSize="sm"
          value={present.subtitle ?? ''}
          onChange={(e) =>
            dispatch({
              type: 'setReportField',
              key: 'subtitle',
              value: e.target.value,
            })
          }
        />
      </InspectorField>
      <InspectorField label={t('flow.htmlReportPrimaryColor', 'Primary color')}>
        <Input
          inputSize="sm"
          value={present.theme?.primaryColor ?? ''}
          placeholder="#1677ff"
          onChange={(e) =>
            dispatch({
              type: 'setTheme',
              theme: { ...present.theme, primaryColor: e.target.value },
            })
          }
        />
      </InspectorField>
    </div>
  )
}
