import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, RotateCcw, Save } from 'lucide-react'
import { ConsolePageTemplate } from '@/components/page-templates/console-page-template'
import { PageHeader } from '@/components/patterns/page-header'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { SectionCard } from '@/components/patterns/section-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AvatarUpload } from '@/components/memory/AvatarUpload'
import { ChatModelSelector } from '@/components/memory/ChatModelSelector'
import { MemoryTypeSelect } from '@/components/memory/MemoryTypeSelect'
import { ReadOnlyModelField } from '@/components/memory/read-only-model-field'
import { MemoryTypeBadge } from '@/components/memory/memory-labels'
import {
  getMemorySettingsSchema,
  getMemorySettingsValues,
  type MemorySettingsValues,
} from '@/components/memory/memory-settings-form'
import {
  useMemoryConfig,
  useUpdateMemory,
  useMessageList,
} from '@/hooks/use-memory'
import { formatBytes } from '@/lib/utils'
import type { MemoryType } from '@/types/memory'

function SettingField({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: ReactNode
}) {
  return (
    <FormItem className="space-y-space-sm">
      <FormLabel>{label}</FormLabel>
      <FormControl>{children}</FormControl>
      {description && (
        <FormDescription className="text-xs leading-relaxed whitespace-pre-line">
          {description}
        </FormDescription>
      )}
      <FormMessage />
    </FormItem>
  )
}

export function MemorySettingsPage() {
  const { id } = useParams<{ id: string }>()
  return id ? <MemorySettings key={id} memoryId={id} /> : null
}

function MemorySettings({ memoryId }: { memoryId: string }) {
  const { t } = useTranslation()
  const query = useMemoryConfig(memoryId)
  const messages = useMessageList(memoryId, { page: 1, page_size: 1 })
  const update = useUpdateMemory()
  const schema = useMemo(() => getMemorySettingsSchema(t), [t])
  const form = useForm<MemorySettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: getMemorySettingsValues(),
  })
  const { isDirty } = form.formState
  const [activeSection, setActiveSection] = useState('identity')
  useEffect(() => {
    if (query.data && !form.formState.isDirty)
      form.reset(getMemorySettingsValues(query.data))
  }, [query.data, form])
  // Keep model/type editing locked until the existing-message check succeeds.
  const locked =
    messages.isPending ||
    messages.isError ||
    (messages.data?.total_count ?? 0) > 0
  const submit = async (values: MemorySettingsValues) => {
    try {
      await update.mutateAsync({
        id: memoryId,
        data: locked ? { ...values, memory_type: undefined } : values,
      })
      form.reset(values)
    } catch {
      /* The mutation owns error feedback; keep unsaved input. */
    }
  }
  if (query.isPending) return <PageLoadingState />
  if (query.isError || !query.data)
    return <PageErrorState onRetry={() => query.refetch()} />
  return (
    <Form {...form}>
      <ConsolePageTemplate
        header={
          <PageHeader
            title={t('memory.config.title')}
            description={t('memory.workspace.settingsDescription')}
            titleSize="md"
            wrapActions
            actions={
              <>
                <output className="hidden text-xs text-text-tertiary xl:block">
                  {t(
                    isDirty
                      ? 'memory.workspace.unsaved'
                      : 'memory.workspace.saved',
                  )}
                </output>
                <Button
                  variant="outline"
                  disabled={!isDirty || update.isPending}
                  onClick={() =>
                    form.reset(getMemorySettingsValues(query.data))
                  }
                  aria-label={t('memory.workspace.resetChanges')}
                >
                  <RotateCcw className="size-icon-sm" />
                </Button>
                <Button
                  type="submit"
                  form="memory-settings"
                  disabled={!isDirty || update.isPending}
                >
                  <Save className="size-icon-sm" />
                  {t(update.isPending ? 'common.loading' : 'common.save')}
                </Button>
              </>
            }
          />
        }
      >
        <form
          id="memory-settings"
          onSubmit={form.handleSubmit(submit, (errors) => {
            const field = Object.keys(errors)[0]
            setActiveSection(
              ['memory_size', 'forgetting_policy'].includes(field)
                ? 'policy'
                : ['temperature', 'system_prompt', 'user_prompt'].includes(
                      field,
                    )
                  ? 'extraction'
                  : 'identity',
            )
          })}
          className="mx-auto max-w-5xl p-space-lg"
        >
          <Tabs
            value={activeSection}
            onValueChange={setActiveSection}
            className="space-y-space-lg"
          >
            <TabsList className="max-w-full">
              <TabsTrigger value="identity">
                {t('memory.workspace.identityTab')}
              </TabsTrigger>
              <TabsTrigger value="policy">
                {t('memory.workspace.policyTab')}
              </TabsTrigger>
              <TabsTrigger value="extraction">
                {t('memory.workspace.extractionTab')}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="identity" className="space-y-space-lg">
              <SectionCard title={t('memory.config.basicInfo')}>
                <div className="space-y-space-lg">
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('memory.fields.avatar')}</FormLabel>
                        <AvatarUpload
                          value={field.value}
                          onChange={field.onChange}
                          size="lg"
                          name={form.getValues('name')}
                          seed={memoryId}
                          tips={t('memory.fields.avatarUploadTips')}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <SettingField label={t('memory.fields.name')}>
                        <Input
                          {...field}
                          placeholder={t('memory.fields.namePlaceholder')}
                        />
                      </SettingField>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <SettingField label={t('memory.fields.description')}>
                        <Textarea
                          {...field}
                          rows={3}
                          placeholder={t(
                            'memory.fields.descriptionPlaceholder',
                          )}
                        />
                      </SettingField>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="permissions"
                    render={({ field }) => (
                      <SettingField label={t('memory.fields.permission')}>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="me">
                              {t('memory.fields.onlyMe')}
                            </SelectItem>
                            <SelectItem value="team">
                              {t('memory.fields.team')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingField>
                    )}
                  />
                </div>
              </SectionCard>
              <SectionCard title={t('memory.config.modelConfig')}>
                <div className="space-y-space-lg">
                  {locked && (
                    <p className="flex items-start gap-space-sm rounded-radius-lg bg-background-subtle p-space-base text-xs leading-relaxed text-text-secondary">
                      <LockKeyhole className="size-icon-sm shrink-0" />
                      {t('memory.workspace.modelLock')}
                    </p>
                  )}
                  <FormField
                    control={form.control}
                    name="memory_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('memory.filters.memoryType')}</FormLabel>
                        {locked ? (
                          <div className="flex flex-wrap gap-space-sm">
                            {field.value.map((type) => (
                              <MemoryTypeBadge
                                key={type}
                                type={type as MemoryType}
                              />
                            ))}
                          </div>
                        ) : (
                          <FormControl>
                            <MemoryTypeSelect
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-space-sm">
                    <p className="text-sm font-medium">
                      {t('memory.fields.embeddingModel')}
                    </p>
                    <ReadOnlyModelField modelId={query.data.embd_id} />
                    <p className="text-xs text-text-tertiary">
                      {t('memory.common.notEditable')}
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="llm_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('memory.fields.llm')}</FormLabel>
                        {locked ? (
                          <ReadOnlyModelField modelId={field.value} />
                        ) : (
                          <FormControl>
                            <ChatModelSelector
                              selectedModelId={field.value}
                              onSelect={(id) => field.onChange(id || '')}
                              showLabel={false}
                            />
                          </FormControl>
                        )}
                        <FormDescription>
                          {t('memory.fields.llmTooltip')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </SectionCard>
            </TabsContent>
            <TabsContent value="policy">
              <SectionCard title={t('memory.workspace.policyTab')}>
                <div className="space-y-space-xl">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {t('memory.workspace.policyDescription')}
                  </p>
                  <FormField
                    control={form.control}
                    name="memory_size"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between gap-space-base">
                          <FormLabel>
                            {t('memory.workspace.capacity')}
                          </FormLabel>
                          <span className="text-sm font-medium text-text-accent">
                            {formatBytes(field.value)}
                          </span>
                        </div>
                        <FormControl>
                          <Slider
                            aria-label={t('memory.workspace.capacity')}
                            min={1048576}
                            max={104857600}
                            step={1048576}
                            value={[field.value]}
                            onValueChange={([value]) => field.onChange(value)}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('memory.workspace.capacityDescription')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="forgetting_policy"
                    render={({ field }) => (
                      <SettingField
                        label={t('memory.config.forgettingPolicy')}
                        description={t(
                          'memory.workspace.forgettingDescription',
                        )}
                      >
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FIFO">
                              {t('memory.config.fifo')}
                            </SelectItem>
                            <SelectItem value="LRU">
                              {t('memory.config.lru')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </SettingField>
                    )}
                  />
                  <div className="rounded-radius-lg bg-background-subtle p-space-base">
                    <p className="text-xs text-text-tertiary">
                      {t('memory.fields.storageType')}
                    </p>
                    <p className="mt-space-xs text-sm">
                      {t(
                        query.data.storage_type === 'graph'
                          ? 'memory.fields.graph'
                          : 'memory.fields.table',
                      )}{' '}
                      · {t('memory.common.notEditable')}
                    </p>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>
            <TabsContent value="extraction">
              <SectionCard title={t('memory.workspace.extractionTab')}>
                <div className="space-y-space-lg">
                  <p className="text-sm leading-relaxed text-text-secondary">
                    {t('memory.workspace.extractionDescription')}
                  </p>
                  <FormField
                    control={form.control}
                    name="temperature"
                    render={({ field }) => (
                      <SettingField
                        label={t('memory.config.temperature')}
                        description={t('memory.config.temperatureTooltip')}
                      >
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.1}
                          className="max-w-32"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ''
                                ? NaN
                                : Number(e.target.value),
                            )
                          }
                        />
                      </SettingField>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="system_prompt"
                    render={({ field }) => (
                      <SettingField label={t('memory.config.systemPrompt')}>
                        <Textarea
                          {...field}
                          rows={10}
                          className="font-mono text-xs leading-relaxed"
                          placeholder={t(
                            'memory.config.systemPromptPlaceholder',
                          )}
                        />
                      </SettingField>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="user_prompt"
                    render={({ field }) => (
                      <SettingField label={t('memory.config.userPrompt')}>
                        <Textarea
                          {...field}
                          rows={6}
                          className="font-mono text-xs leading-relaxed"
                          placeholder={t('memory.config.userPromptPlaceholder')}
                        />
                      </SettingField>
                    )}
                  />
                </div>
              </SectionCard>
            </TabsContent>
          </Tabs>
        </form>
      </ConsolePageTemplate>
    </Form>
  )
}
