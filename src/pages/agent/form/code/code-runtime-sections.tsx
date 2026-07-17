import { Code2, Database, Variable } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ProgrammingLanguage } from '../../constant'
import {
  CodeExecPanelSystemOutputs,
  type CodeOutputMap,
  getBusinessOutputs,
} from '../../utils/code-outputs'
import { Output, transferOutputs } from '../components'
import { SectionHeader } from './section-header'

function getLanguageRuntimeHint(
  language: string | undefined,
  t: ReturnType<typeof useTranslation>['t'],
) {
  if (language === ProgrammingLanguage.JavaScript) {
    return t(
      'flow.codeJsRuntimeArgsHint',
      'JavaScript receives this object as main(args).',
    )
  }

  return t(
    'flow.codePythonRuntimeArgsHint',
    'Python receives these keys as main(**args).',
  )
}

function stringifyPreview(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

export function ParameterPreview({
  argumentsValue,
  language,
}: {
  argumentsValue?: Record<string, unknown>
  language?: string
}) {
  const { t } = useTranslation()
  const preview = useMemo(
    () => stringifyPreview(argumentsValue),
    [argumentsValue],
  )

  return (
    <section className="space-y-space-sm rounded-radius-lg bg-surface-secondary p-space-base border border-border-subtle">
      <SectionHeader
        icon={<Variable className="size-icon-sm" />}
        title={t('flow.codeParameterPreview', 'Parameter preview')}
        description={getLanguageRuntimeHint(language, t)}
      />
      <pre className="rounded-radius-md bg-surface-primary p-space-sm max-h-52 overflow-auto border border-border-subtle font-mono text-xs leading-5 text-text-primary">
        {preview}
      </pre>
    </section>
  )
}

function CodeOutputOverview({ outputs }: { outputs?: CodeOutputMap }) {
  const { t } = useTranslation()
  const businessOutputs = getBusinessOutputs(outputs)

  return (
    <section className="space-y-space-base pt-space-md border-t border-border-subtle">
      <SectionHeader
        icon={<Variable className="size-icon-sm" />}
        title={t('flow.codeOutputContract', 'Output contract')}
        description={t(
          'flow.codeOutputContractTip',
          'Use the business value in downstream nodes; use system outputs for rendering, checks, and troubleshooting.',
        )}
      />

      <div className="gap-space-base grid lg:grid-cols-2">
        <Output
          list={transferOutputs(businessOutputs)}
          title={t('flow.businessOutput', 'Business output')}
          description={t(
            'flow.businessOutputTip',
            'The value returned by main().',
          )}
        />
        <Output
          list={transferOutputs(CodeExecPanelSystemOutputs)}
          title={t('flow.systemOutputs', 'System outputs')}
          description={t(
            'flow.systemOutputsTip',
            'Runtime metadata for logs, type checks, raw result, and attachments.',
          )}
        />
      </div>
    </section>
  )
}

export function CodeRuntimeOverview({ outputs }: { outputs?: CodeOutputMap }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-radius-lg bg-surface-secondary p-space-base border border-border-subtle">
      <div className="mb-space-base gap-space-sm flex items-center">
        <span className="rounded-radius-md flex size-icon-xl items-center justify-center bg-background-surface text-text-secondary">
          <Code2 className="size-icon-sm" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-text-primary">
            {t('flow.codeRuntimeShape', 'Runtime shape')}
          </div>
          <div className="text-xs leading-5 text-text-secondary">
            {t(
              'flow.codeRuntimeShapeTip',
              'Downstream nodes see the same contract that the runtime validates.',
            )}
          </div>
        </div>
        <Database className="ml-auto size-icon-sm shrink-0 text-text-tertiary" />
      </div>
      <CodeOutputOverview outputs={outputs} />
    </div>
  )
}
