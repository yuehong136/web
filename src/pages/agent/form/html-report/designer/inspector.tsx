/**
 * Designer 右栏(3b 轻量版):按选中目标显示报告/小节/块的基础属性。
 * 字段级 directive 编辑器(static/variable/llm,10 个块各一套)在 3c 接入。
 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { blockDisplayLabel } from './block-meta'
import type { DraftAction, DraftState } from './use-skeleton-draft'

interface InspectorProps {
  state: DraftState
  dispatch: React.Dispatch<DraftAction>
}

export function Inspector({ state, dispatch }: InspectorProps) {
  const { t } = useTranslation()
  const { selection, present } = state

  if (selection.kind === 'section') {
    const section = present.sections.find((s) => s.id === selection.sectionId)
    if (!section)
      return (
        <EmptyHint
          text={t('flow.htmlReportInspectorNone', 'Select an item to edit')}
        />
      )
    return (
      <div className="space-y-space-md p-space-base">
        <Heading
          text={t('flow.htmlReportSectionSettings', 'Section settings')}
        />
        <Field label={t('flow.htmlReportSectionTitle', 'Section title')}>
          <Input
            value={section.title ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'setSectionField',
                sectionId: section.id,
                key: 'title',
                value: e.target.value,
              })
            }
          />
        </Field>
        <Field label={t('flow.htmlReportSectionSubtitle', 'Section subtitle')}>
          <Input
            value={section.subtitle ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'setSectionField',
                sectionId: section.id,
                key: 'subtitle',
                value: e.target.value,
              })
            }
          />
        </Field>
        <Field
          label={t('flow.htmlReportAnnotation', 'Annotation (for the model)')}
        >
          <Textarea
            rows={3}
            value={section.annotation ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'setSectionField',
                sectionId: section.id,
                key: 'annotation',
                value: e.target.value,
              })
            }
          />
        </Field>
      </div>
    )
  }

  if (selection.kind === 'block') {
    const section = present.sections.find((s) => s.id === selection.sectionId)
    const block = section?.blocks.find((b) => b.id === selection.blockId)
    if (!block)
      return (
        <EmptyHint
          text={t('flow.htmlReportInspectorNone', 'Select an item to edit')}
        />
      )
    const label = blockDisplayLabel(block)
    return (
      <div className="space-y-space-md p-space-base">
        <Heading text={t(label.labelKey, label.fallback)} />
        <Field
          label={t('flow.htmlReportAnnotation', 'Annotation (for the model)')}
        >
          <Textarea
            rows={3}
            value={block.annotation ?? ''}
            onChange={(e) =>
              dispatch({
                type: 'setBlockAnnotation',
                sectionId: selection.sectionId,
                blockId: block.id,
                value: e.target.value,
              })
            }
          />
        </Field>
        <p className="text-text-caption text-xs">
          {t(
            'flow.htmlReportFieldEditorSoon',
            'Per-field editing (static / variable / model) comes next.',
          )}
        </p>
      </div>
    )
  }

  // none / theme:报告元信息 + 主题主色
  return (
    <div className="space-y-space-md p-space-base">
      <Heading text={t('flow.htmlReportReportSettings', 'Report settings')} />
      <Field label={t('flow.htmlReportTitle', 'Report title')}>
        <Input
          value={present.title}
          onChange={(e) =>
            dispatch({
              type: 'setReportField',
              key: 'title',
              value: e.target.value,
            })
          }
        />
      </Field>
      <Field label={t('flow.htmlReportSubtitle', 'Report subtitle')}>
        <Input
          value={present.subtitle ?? ''}
          onChange={(e) =>
            dispatch({
              type: 'setReportField',
              key: 'subtitle',
              value: e.target.value,
            })
          }
        />
      </Field>
      <Field label={t('flow.htmlReportPrimaryColor', 'Primary color')}>
        <Input
          value={present.theme?.primaryColor ?? ''}
          placeholder="#1677ff"
          onChange={(e) =>
            dispatch({
              type: 'setTheme',
              theme: { ...present.theme, primaryColor: e.target.value },
            })
          }
        />
      </Field>
    </div>
  )
}

function Heading({ text }: { text: string }) {
  return <h3 className="text-sm font-semibold text-text-primary">{text}</h3>
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-space-xs">
      <Label className="text-xs text-text-secondary">{label}</Label>
      {children}
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return <p className="p-space-base text-text-caption text-sm">{text}</p>
}
