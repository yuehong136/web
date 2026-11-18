import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, RotateCcw, Save } from 'lucide-react'
import { DetailTemplate } from '@/components/page-templates/detail-template'
import {
  PageLoadingState,
  PageErrorState,
} from '@/components/patterns/page-states'
import { SectionCard } from '@/components/patterns/section-card'
import { StatusDot } from '@/components/studio'
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
import { MemoryTypeBadge } from '@/components/memory/memory-labels'
import {
  getMemorySettingsSchema,
  getMemorySettingsValues,
  type MemorySettingsValues,
} from '@/components/memory/memory-settings-form'
import {
  useMemoryConfig,
  useMemoryDetail,
  useUpdateMemory,
  useMessageList,
} from '@/hooks/use-memory'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { ROUTES } from '@/constants'
import { formatBytes } from '@/lib/utils'
import type { MemoryType } from '@/types/memory'
import {
  MemoryAvatar,
  MemoryModelRow,
  useMemoryCrumbs,
} from './detail/memory-identity'

const SECTIONS = ['identity', 'policy', 'extraction'] as const

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
  const { data: memory } = useMemoryDetail(memoryId)
  const crumbs = useMemoryCrumbs(memory, `${ROUTES.MEMORY}/${memoryId}`)
  const messages = useMessageList(memoryId, { page: 1, page_size: 1 })
  // Model names and logos resolve from the cached provider list.
  useFetchMyLLMs()
  const update = useUpdateMemory()
  const schema = useMemo(() => getMemorySettingsSchema(t), [t])
  const form = useForm<MemorySettingsValues>({
    resolver: zodResolver(schema),
    defaultValues: getMemorySettingsValues(),
  })
  const { isDirty } = form.formState
  const [activeSection, setActiveSection] = useState<string>('identity')
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
  const config = query.data
  const ready = !query.isPending && !query.isError && !!config
  return (
    <Form {...form}>
      <Tabs
        value={activeSection}
        onValueChange={setActiveSection}
        className="h-full"
      >
        <DetailTemplate
          title={t('memory.workspace.strategy')}
          crumbs={crumbs}
          leading={
            <MemoryAvatar memory={memory ?? config} memoryId={memoryId} />
          }
          subline={
            ready ? (
              <output className="flex min-w-0" aria-live="polite">
                <StatusDot
                  tone={isDirty ? 'warning' : 'success'}
                  label={t(
                    isDirty
                      ? 'memory.workspace.unsaved'
                      : 'memory.workspace.saved',
                  )}
                />
              </output>
            ) : undefined
          }
          actions={
            ready ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!isDirty || update.isPending}
                  onClick={() => form.reset(getMemorySettingsValues(config))}
                  aria-label={t('memory.workspace.resetChanges')}
                  title={t('memory.workspace.resetChanges')}
                >
                  <RotateCcw aria-hidden="true" className="size-icon-sm" />
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  form="memory-settings"
                  disabled={!isDirty || update.isPending}
                >
                  <Save aria-hidden="true" className="size-icon-sm" />
                  {t(update.isPending ? 'common.loading' : 'common.save')}
                </Button>
              </>
            ) : undefined
          }
          tabs={
            ready ? (
              <TabsList
                aria-label={t('memory.detail.settingsSections')}
                className="min-h-0 border-b-0"
              >
                {SECTIONS.map((section) => (
                  <TabsTrigger key={section} value={section}>
                    {t(`memory.workspace.${section}Tab`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            ) : undefined
          }
          state={query.isPending ? 'loading' : !ready ? 'error' : 'content'}
          loadingState={<PageLoadingState />}
          errorState={<PageErrorState onRetry={() => query.refetch()} />}
        >
          {config && (
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
              className="mx-auto flex w-full max-w-4xl flex-col gap-space-lg px-space-md py-space-lg sm:px-space-lg"
            >
              <p className="text-sm text-fg-muted">
                {t('memory.workspace.settingsDescription')}
              </p>
              <TabsContent value="identity" className="mt-0 space-y-space-lg">
                <SectionCard
                  headingLevel={2}
                  title={t('memory.config.basicInfo')}
                >
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
                <SectionCard
                  headingLevel={2}
                  title={t('memory.config.modelConfig')}
                >
                  <div className="space-y-space-lg">
                    {locked && (
                      <p className="flex items-start gap-space-sm rounded-radius-lg border border-line-subtle bg-sunken p-space-base text-xs leading-relaxed text-fg-muted">
                        <LockKeyhole
                          aria-hidden="true"
                          className="size-icon-sm shrink-0"
                        />
                        {t('memory.workspace.modelLock')}
                      </p>
                    )}
                    <FormField
                      control={form.control}
                      name="memory_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('memory.filters.memoryType')}
                          </FormLabel>
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
                      <MemoryModelRow
                        reference={config.embd_id}
                        hint={t('memory.common.notEditable')}
                      />
                      <p className="text-xs text-fg-subtle">
                        {t('memory.fields.embeddingModelTooltip')}
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="llm_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('memory.fields.llm')}</FormLabel>
                          {locked ? (
                            <MemoryModelRow
                              reference={field.value}
                              hint={t('memory.detail.lockedHint')}
                            />
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
              <TabsContent value="policy" className="mt-0">
                <SectionCard
                  headingLevel={2}
                  title={t('memory.workspace.policyTab')}
                >
                  <div className="space-y-space-xl">
                    <p className="text-sm leading-relaxed text-fg-muted">
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
                            <span className="font-mono text-sm font-medium text-accent-fg tabular-nums">
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
                    <div className="flex items-center justify-between gap-space-base rounded-radius-lg border border-line-subtle bg-sunken px-space-base py-space-sm">
                      <span className="flex flex-col gap-space-2xs">
                        <span className="text-xs text-fg-subtle">
                          {t('memory.fields.storageType')}
                        </span>
                        <span className="text-sm text-fg">
                          {t(
                            config.storage_type === 'graph'
                              ? 'memory.fields.graph'
                              : 'memory.fields.table',
                          )}
                        </span>
                      </span>
                      <span className="flex items-center gap-space-xs text-xs text-fg-subtle">
                        <LockKeyhole
                          aria-hidden="true"
                          className="size-icon-xs"
                        />
                        {t('memory.common.notEditable')}
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </TabsContent>
              <TabsContent value="extraction" className="mt-0">
                <SectionCard
                  headingLevel={2}
                  title={t('memory.workspace.extractionTab')}
                >
                  <div className="space-y-space-lg">
                    <p className="text-sm leading-relaxed text-fg-muted">
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
                            placeholder={t(
                              'memory.config.userPromptPlaceholder',
                            )}
                          />
                        </SettingField>
                      )}
                    />
                  </div>
                </SectionCard>
              </TabsContent>
            </form>
          )}
        </DetailTemplate>
      </Tabs>
    </Form>
  )
}
