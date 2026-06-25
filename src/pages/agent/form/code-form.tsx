import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { zodResolver } from '@hookform/resolvers/zod'
import { Braces, Code2, Database, Variable } from 'lucide-react'
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  CodeTemplateStrMap,
  JsonSchemaDataType,
  ProgrammingLanguage,
  TypesWithArray,
  initialCodeValues,
} from '../constant'
import { useFormValues } from '../hooks/use-form-values'
import { useWatchFormChange } from '../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../types'
import {
  CodeExecPanelSystemOutputs,
  type CodeOutputContract,
  type CodeOutputMap,
  deserializeCodeOutputContract,
  getBusinessOutputs,
  getCodeNodeOutputs,
  isValidCodeOutputName,
  serializeCodeOutputContract,
} from '../utils/code-outputs'
import { FormWrapper, Output, transferOutputs } from './components'

const schema = z.object({
  lang: z.string(),
  script: z.string().optional(),
  arguments: z.record(z.string(), z.unknown()).optional(),
  outputs: z.record(z.string(), z.unknown()).optional(),
})

const codeOutputTypeOptions = [
  JsonSchemaDataType.String,
  JsonSchemaDataType.Number,
  JsonSchemaDataType.Boolean,
  JsonSchemaDataType.Object,
  JsonSchemaDataType.Array,
  TypesWithArray.ArrayString,
  TypesWithArray.ArrayNumber,
  TypesWithArray.ArrayBoolean,
  TypesWithArray.ArrayObject,
]

function SectionHeader({
  icon,
  title,
  description,
  badge,
}: {
  icon: ReactNode
  title: string
  description?: string
  badge?: ReactNode
}) {
  return (
    <div className="gap-space-base flex min-w-0 items-start justify-between">
      <div className="gap-space-sm flex min-w-0 items-start">
        <span className="rounded-radius-md mt-0.5 flex size-8 shrink-0 items-center justify-center bg-components-system-accent-soft text-components-system-accent-text">
          {icon}
        </span>
        <div className="space-y-space-xs min-w-0">
          <h4 className="text-base font-semibold leading-6 text-text-primary">
            {title}
          </h4>
          {description ? (
            <p className="text-sm leading-6 text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  )
}

function useReturnValueDraft(contract: CodeOutputContract) {
  const [draft, setDraft] = useState(contract)

  useEffect(() => {
    setDraft(contract)
  }, [contract])

  return [draft, setDraft] as const
}

function ReturnValueEditor({
  outputs,
  onChange,
}: {
  outputs?: CodeOutputMap
  onChange: (outputs: CodeOutputMap) => void
}) {
  const { t } = useTranslation()
  const { contract } = useMemo(
    () => deserializeCodeOutputContract({ outputs }),
    [outputs],
  )
  const [draft, setDraft] = useReturnValueDraft(contract)
  const isNameValid = isValidCodeOutputName(draft.name)

  const commit = useCallback(
    (nextContract: CodeOutputContract) => {
      if (!isValidCodeOutputName(nextContract.name)) {
        return
      }

      onChange(serializeCodeOutputContract(nextContract))
    },
    [onChange],
  )

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = {
        ...draft,
        name: event.target.value,
      }

      setDraft(next)
      commit(next)
    },
    [commit, draft, setDraft],
  )

  const handleTypeChange = useCallback(
    (type: string) => {
      const next = {
        ...draft,
        type,
      }

      setDraft(next)
      commit(next)
    },
    [commit, draft, setDraft],
  )

  return (
    <section className="space-y-space-base pt-space-md border-t border-border-subtle">
      <SectionHeader
        icon={<Braces className="size-4" />}
        title={t('flow.codeReturnValue', 'Return value')}
        description={t(
          'flow.codeReturnValueTip',
          'Expose one business output from main(). System outputs stay available for logs and diagnostics.',
        )}
        badge={
          <Badge variant="blue">
            {t('flow.codeSingleOutputBadge', 'Single output')}
          </Badge>
        }
      />

      <div className="gap-space-base grid sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="space-y-space-xs">
          <label className="text-sm text-text-secondary">
            {t('flow.outputName', 'Output name')}
          </label>
          <Input
            value={draft.name}
            inputSize="sm"
            onChange={handleNameChange}
            error={
              isNameValid
                ? undefined
                : t(
                    'flow.codeInvalidOutputName',
                    'Use a non-empty name without dots or reserved system keys.',
                  )
            }
          />
        </div>

        <div className="space-y-space-xs">
          <label className="text-sm text-text-secondary">
            {t('flow.outputType', 'Type')}
          </label>
          <Select value={draft.type} onValueChange={handleTypeChange}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {codeOutputTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  )
}

function CodeOutputOverview({ outputs }: { outputs?: CodeOutputMap }) {
  const { t } = useTranslation()
  const businessOutputs = getBusinessOutputs(outputs)
  const systemOutputs = CodeExecPanelSystemOutputs

  return (
    <section className="space-y-space-base pt-space-md border-t border-border-subtle">
      <SectionHeader
        icon={<Variable className="size-4" />}
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
          list={transferOutputs(systemOutputs)}
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

export function CodeForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = useFormValues(initialCodeValues, node)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: values,
  })

  useWatchFormChange(node?.id, form)

  const watchedOutputs = form.watch('outputs') as CodeOutputMap | undefined
  const outputs = getCodeNodeOutputs(watchedOutputs)

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="lang"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.language', 'Language')}</FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={(val) => {
                    field.onChange(val)
                    const template =
                      CodeTemplateStrMap[val as keyof typeof CodeTemplateStrMap]
                    if (template) {
                      form.setValue('script', template)
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ProgrammingLanguage.Python}>
                      Python
                    </SelectItem>
                    <SelectItem value={ProgrammingLanguage.JavaScript}>
                      JavaScript
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="script"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.code', 'Code')}</FormLabel>
              <FormControl>
                <Textarea
                  rows={12}
                  className="font-mono text-xs"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                {t(
                  'flow.codeMainReturnTip',
                  'Return a JSON-serializable value from main(). It will be exposed as the single business output below.',
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <ReturnValueEditor
          outputs={watchedOutputs}
          onChange={(nextOutputs) =>
            form.setValue('outputs', nextOutputs, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            })
          }
        />

        <div className="rounded-radius-lg bg-surface-secondary p-space-base border border-border-subtle">
          <div className="mb-space-base gap-space-sm flex items-center">
            <span className="rounded-radius-md flex size-8 items-center justify-center bg-background-surface text-text-secondary">
              <Code2 className="size-4" />
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
            <Database className="ml-auto size-4 shrink-0 text-text-tertiary" />
          </div>
          <CodeOutputOverview outputs={outputs} />
        </div>
      </FormWrapper>
    </Form>
  )
}
