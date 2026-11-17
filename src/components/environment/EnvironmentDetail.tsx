import { useEffect, useState, type MutableRefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import {
  PageEmptyState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { environmentAPI } from '@/api/environment'
import {
  useCreateEnvironment,
  useEnvironmentVariableMutations,
  useUpdateEnvironment,
} from '@/hooks/use-environment-request'
import { toast } from '@/lib/toast'
import type { Environment, EnvironmentUpdate } from '@/types/api'
import { AddVariableDialog } from './add-variable-dialog'
import { CreateModeVariablesTable } from './create-mode-variables-table'
import { environmentDotClass } from './environment-color'
import {
  BaseUrlSection,
  EnvironmentDetailHeader,
  VariablesEmpty,
  VariablesSection,
} from './environment-detail-sections'
import {
  environmentFormDefaults,
  type EnvironmentFormData,
} from './environment-form-state'
import {
  resolveLocally,
  variableDraftProblem,
  type CreateModeVariable,
  type VariableDraft,
} from './environment-variables'
import { EnvironmentVariablesTable } from './EnvironmentVariablesTable'
import { VariableResolveDialog } from './variable-resolve-dialog'

interface EnvironmentDetailProps {
  environmentId: string | 'global' | 'create-new'
  currentEnvironment: Environment | null
  /** Position in the environment list; picks the status dot colour. */
  dotIndex?: number
  onDataChange: (isDirty: boolean) => void
  /** Receives the save action that the manager's Save button runs. */
  saveRef?: MutableRefObject<(() => Promise<void>) | null>
  onEnvironmentCreated?: (environmentId: string) => void
}

const FORM_FIELDS = ['name', 'description', 'base_url', 'is_default'] as const

export function EnvironmentDetail({
  environmentId,
  currentEnvironment,
  dotIndex = 0,
  onDataChange,
  saveRef,
  onEnvironmentCreated,
}: EnvironmentDetailProps) {
  const { t } = useTranslation()
  const { createEnvironment } = useCreateEnvironment()
  const { updateEnvironment } = useUpdateEnvironment()
  const { addVariable } = useEnvironmentVariableMutations()

  const isCreateMode = environmentId === 'create-new'
  const [formData, setFormData] = useState<EnvironmentFormData>(
    environmentFormDefaults,
  )
  const [originalData, setOriginalData] = useState<EnvironmentFormData>(
    environmentFormDefaults,
  )
  const [isResolveOpen, setIsResolveOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  // Variables of an environment that is being created live here until saved.
  const [createModeVariables, setCreateModeVariables] = useState<
    CreateModeVariable[]
  >([])

  // Switching environments closes the dialogs and clears unsaved variables.
  const [shownEnvironmentId, setShownEnvironmentId] = useState<string | null>(
    null,
  )
  if (shownEnvironmentId !== environmentId) {
    setShownEnvironmentId(environmentId)
    if (isCreateMode) setCreateModeVariables([])
    setIsAddOpen(false)
    setIsResolveOpen(false)
  }

  // Load the form whenever the environment (or its fetched data) changes.
  const [formSource, setFormSource] = useState<unknown[] | null>(null)
  const nextFormSource = [currentEnvironment, environmentId]
  if (
    formSource === null ||
    nextFormSource.some((value, index) => !Object.is(value, formSource[index]))
  ) {
    setFormSource(nextFormSource)
    if (isCreateMode || (currentEnvironment && environmentId !== 'global')) {
      const data = environmentFormDefaults(
        isCreateMode ? null : currentEnvironment,
      )
      setFormData(data)
      setOriginalData(data)
    }
  }

  const handleFormChange = (
    field: keyof EnvironmentFormData,
    value: string | boolean,
  ) => {
    const next = { ...formData, [field]: value }
    setFormData(next)
    onDataChange(JSON.stringify(next) !== JSON.stringify(originalData))
  }

  const saveEnvironmentData = async () => {
    if (environmentId === 'global') return
    try {
      if (isCreateMode) {
        if (!formData.name.trim()) {
          toast.error(t('environment.detail.nameRequired'))
          return
        }
        const created = await createEnvironment({
          ...formData,
          is_global: false,
          variables: createModeVariables.map((variable) => ({
            key_name: variable.key_name,
            key_value: variable.key_value,
            description: variable.description,
            is_secret: variable.is_secret,
            variable_type: variable.variable_type,
          })),
        })
        toast.success(t('environment.detail.created'))
        setOriginalData(formData)
        onDataChange(false)
        if (created?.id) onEnvironmentCreated?.(created.id)
        return
      }
      if (!currentEnvironment) return
      // Only send the fields that changed.
      const changed: EnvironmentUpdate = {}
      for (const field of FORM_FIELDS) {
        if (formData[field] !== originalData[field])
          Object.assign(changed, { [field]: formData[field] })
      }
      if (Object.keys(changed).length === 0) {
        toast.success(t('environment.detail.noChanges'))
        return
      }
      await updateEnvironment({ id: currentEnvironment.id, data: changed })
      setOriginalData(formData)
      toast.success(t('environment.detail.saved'))
    } catch (error) {
      toast.error(t('environment.detail.saveFailed'))
      throw error
    }
  }

  // The manager's Save button runs the latest save action.
  useEffect(() => {
    if (!saveRef) return
    saveRef.current = saveEnvironmentData
    return () => {
      if (saveRef.current === saveEnvironmentData) saveRef.current = null
    }
  })

  const resolveText = async (text: string) =>
    isCreateMode
      ? resolveLocally(text, createModeVariables)
      : environmentAPI.resolveVariablesOnServer(
          currentEnvironment?.id || environmentId,
          text,
        )

  const handleAddVariable = async (draft: VariableDraft) => {
    const existing = isCreateMode
      ? createModeVariables
      : (currentEnvironment?.variables ?? [])
    const problem = variableDraftProblem(
      draft,
      existing.map((variable) => variable.key_name),
    )
    if (problem) {
      toast.error(t(`environment.variables.${problem}`))
      return
    }
    if (isCreateMode) {
      setCreateModeVariables([
        ...createModeVariables,
        { ...draft, id: `temp-${Date.now()}` },
      ])
      toast.success(t('environment.variables.addedToList'))
      onDataChange(true)
      setIsAddOpen(false)
      return
    }
    try {
      await addVariable(currentEnvironment?.id || environmentId, draft)
      toast.success(t('environment.variables.added'))
      onDataChange(true)
      setIsAddOpen(false)
    } catch {
      toast.error(t('environment.variables.addFailed'))
    }
  }

  if (environmentId === 'global') {
    return (
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-space-base border-b border-border-subtle px-space-lg py-space-base">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-radius-lg bg-status-info-subtle text-status-info">
            <Globe className="size-icon-md" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-text-primary">
              {t('environment.global.title')}
            </h3>
            <p className="text-sm text-text-secondary">
              {t('environment.global.description')}
            </p>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <PageEmptyState
            compact
            icon={<Globe className="size-icon-lg" aria-hidden="true" />}
            title={t('environment.global.comingSoon')}
          />
        </div>
      </div>
    )
  }

  if (!isCreateMode && !currentEnvironment) {
    return (
      <PageLoadingState
        compact
        title={t('environment.detail.loading')}
        description={t('environment.detail.loadingHint')}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <EnvironmentDetailHeader
        form={formData}
        onChange={handleFormChange}
        dotClassName={environmentDotClass(formData.name, dotIndex)}
        isNew={isCreateMode}
        isGlobal={Boolean(currentEnvironment?.is_global) && !isCreateMode}
      />
      <div className="min-h-0 flex-1 space-y-space-base overflow-y-auto p-space-lg">
        <BaseUrlSection value={formData.base_url} onChange={handleFormChange} />
        <VariablesSection
          onTestResolve={() => setIsResolveOpen(true)}
          onAddVariable={() => setIsAddOpen(true)}
          testDisabled={isCreateMode && createModeVariables.length === 0}
        >
          {isCreateMode ? (
            createModeVariables.length === 0 ? (
              <VariablesEmpty />
            ) : (
              <CreateModeVariablesTable
                variables={createModeVariables}
                onVariablesChange={(variables) => {
                  setCreateModeVariables(variables)
                  onDataChange(true)
                }}
              />
            )
          ) : currentEnvironment ? (
            <EnvironmentVariablesTable
              environmentId={currentEnvironment.id}
              variables={currentEnvironment.variables || []}
              onVariablesChange={() => onDataChange(true)}
              hideAddButton
              hideAddDialog
            />
          ) : null}
        </VariablesSection>
      </div>

      <VariableResolveDialog
        open={isResolveOpen}
        onOpenChange={setIsResolveOpen}
        onResolve={resolveText}
      />
      <AddVariableDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddVariable}
      />
    </div>
  )
}
