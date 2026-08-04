import { Segmented, SegmentedItem } from '@/components/vendor/ui/segmented'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Form,
  FormControl,
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
import { Switch } from '@/components/ui/switch'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { type Control, useFieldArray, useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  TitleChunkerMethod,
  initialTitleChunkerValues,
} from '../chunker-constants'
import { useFormValues } from '../../hooks/use-form-values'
import { useWatchFormChange } from '../../hooks/use-watch-form-change'
import type { INextOperatorForm } from '../../types'
import { FormWrapper, Output, buildOutputList } from '../components'
import {
  getTitleChunkerHierarchyOptions,
  normalizeTitleChunkerFormForStore,
  type TitleChunkerRule,
} from './utils'

const expressionField = z.string().refine(
  (value) => {
    if (!value) {
      return true
    }

    try {
      new RegExp(value)
      return true
    } catch {
      return false
    }
  },
  { message: 'Must be a valid regular expression' },
)

const rulesSchema = z.array(
  z.object({
    levels: z.array(
      z.object({
        expression: expressionField,
      }),
    ),
  }),
)

const titleChunkerSchema = z.object({
  method: z.enum([TitleChunkerMethod.Hierarchy, TitleChunkerMethod.Group]),
  hierarchyHierarchy: z.string().optional(),
  hierarchyGroup: z.string().optional(),
  include_heading_content: z.boolean().optional(),
  root_chunk_as_heading: z.boolean().optional(),
  hierarchyRules: rulesSchema.optional(),
  groupRules: rulesSchema.optional(),
  outputs: z.record(z.string(), z.any()).optional(),
})

export type TitleChunkerFormValues = z.input<typeof titleChunkerSchema>

type RuleCardProps = {
  name: 'hierarchyRules' | 'groupRules'
  ruleIndex: number
  control: Control<TitleChunkerFormValues>
  onRemoveRule: (index: number) => void
  canRemoveRule: boolean
}

function RuleCard({
  name,
  ruleIndex,
  control,
  onRemoveRule,
  canRemoveRule,
}: RuleCardProps) {
  const { t } = useTranslation()
  const levelsFieldArray = useFieldArray({
    control,
    name: `${name}.${ruleIndex}.levels`,
  })

  return (
    <Card padding="sm">
      <CardHeader className="p-space-sm flex-row items-center justify-between">
        <span className="text-sm font-medium text-text-primary">
          {t('flow.rule', 'Rule')} {ruleIndex + 1}
        </span>
        {canRemoveRule && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onRemoveRule(ruleIndex)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-space-sm p-space-sm pt-0">
        {levelsFieldArray.fields.map((levelField, levelIndex) => (
          <div key={levelField.id} className="gap-space-sm flex items-start">
            <FormField
              control={control}
              name={`${name}.${ruleIndex}.levels.${levelIndex}.expression`}
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel className={levelIndex > 0 ? 'sr-only' : ''}>
                    {t('flow.regularExpressions', 'Regular Expressions')} H
                    {levelIndex + 1}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="^##[^#]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {levelsFieldArray.fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => levelsFieldArray.remove(levelIndex)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => levelsFieldArray.append({ expression: '' })}
        >
          <Plus className="mr-space-xs size-4" />
          {t('flow.addRegularExpressions', 'Add Regular Expressions')}
        </Button>
      </CardContent>
    </Card>
  )
}

type RulesFieldArrayProps = {
  name: 'hierarchyRules' | 'groupRules'
  control: Control<TitleChunkerFormValues>
}

function RulesFieldArray({ name, control }: RulesFieldArrayProps) {
  const { t } = useTranslation()
  const rulesFieldArray = useFieldArray({
    control,
    name,
  })

  return (
    <div className="space-y-space-md">
      {rulesFieldArray.fields.map((ruleField, ruleIndex) => (
        <RuleCard
          key={ruleField.id}
          name={name}
          ruleIndex={ruleIndex}
          control={control}
          onRemoveRule={rulesFieldArray.remove}
          canRemoveRule={rulesFieldArray.fields.length > 1}
        />
      ))}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => rulesFieldArray.append({ levels: [{ expression: '' }] })}
      >
        <Plus className="mr-space-xs size-4" />
        {t('flow.addRule', 'Add Rule')}
      </Button>
    </div>
  )
}

export function TitleChunkerForm({ node }: INextOperatorForm) {
  const { t } = useTranslation()
  const values = normalizeTitleChunkerFormForStore(
    useFormValues(initialTitleChunkerValues, node),
  )

  const form = useForm<
    TitleChunkerFormValues,
    unknown,
    z.output<typeof titleChunkerSchema>
  >({
    resolver: zodResolver(titleChunkerSchema),
    defaultValues: values as TitleChunkerFormValues,
    mode: 'onChange',
  })

  useWatchFormChange(node?.id, form)

  const method = useWatch({
    control: form.control,
    name: 'method',
  })
  const hierarchyRules = useWatch({
    control: form.control,
    name: 'hierarchyRules',
  }) as TitleChunkerRule[] | undefined
  const groupRules = useWatch({
    control: form.control,
    name: 'groupRules',
  }) as TitleChunkerRule[] | undefined
  const activeRules =
    method === TitleChunkerMethod.Group ? groupRules : hierarchyRules
  const hierarchyOptions = useMemo(
    () =>
      getTitleChunkerHierarchyOptions(
        activeRules,
        method === TitleChunkerMethod.Group,
      ),
    [activeRules, method],
  )
  const outputs = useMemo(
    () => buildOutputList(form.getValues('outputs')),
    [form],
  )

  return (
    <Form {...form}>
      <FormWrapper>
        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Segmented
                  value={field.value ?? TitleChunkerMethod.Hierarchy}
                  onValueChange={field.onChange}
                  block
                >
                  <SegmentedItem value={TitleChunkerMethod.Hierarchy}>
                    {t('flow.hierarchy', 'Hierarchy')}
                  </SegmentedItem>
                  <SegmentedItem value={TitleChunkerMethod.Group}>
                    {t('flow.group', 'Group')}
                  </SegmentedItem>
                </Segmented>
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={
            method === TitleChunkerMethod.Group
              ? 'hierarchyGroup'
              : 'hierarchyHierarchy'
          }
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('flow.hierarchy', 'Hierarchy')}</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hierarchyOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.value === '0'
                          ? t('common.automatic', 'Automatic')
                          : option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {method === TitleChunkerMethod.Hierarchy && (
          <>
            <FormField
              control={form.control}
              name="include_heading_content"
              render={({ field }) => (
                <FormItem className="rounded-radius-md px-space-sm py-space-sm flex items-center justify-between border border-border-default">
                  <FormLabel>
                    {t('flow.includeHeadingContent', 'Include heading content')}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="root_chunk_as_heading"
              render={({ field }) => (
                <FormItem className="rounded-radius-md px-space-sm py-space-sm flex items-center justify-between border border-border-default">
                  <FormLabel>
                    {t('flow.rootAsHeading', 'Use root as H0 heading')}
                  </FormLabel>
                  <FormControl>
                    <Switch
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}

        {method === TitleChunkerMethod.Group ? (
          <RulesFieldArray name="groupRules" control={form.control} />
        ) : (
          <RulesFieldArray name="hierarchyRules" control={form.control} />
        )}

        <Output list={outputs} />
      </FormWrapper>
    </Form>
  )
}
