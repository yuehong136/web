import {
  useEffect,
  useMemo,
  type FC,
  type FormEvent,
  type ReactNode,
} from 'react'
import { ArrowRight, HelpCircle, Loader2, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CustomSelect } from '@/components/ui/custom-select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip } from '@/components/ui/tooltip'
import { EmbeddingModelSelector } from '@/components/knowledge/EmbeddingModelSelector'
import { cn } from '@/lib/utils'
import { useModelStore } from '@/stores/model'
import { LANGUAGE_OPTIONS, PERMISSION_OPTIONS } from './constants'
import { useCreateKnowledge } from './use-create-knowledge'
import type { KnowledgePermission } from './types'

interface CreateKnowledgeFormProps {
  bodyClassName?: string
  footerClassName?: string
  onCancel: () => void
  onCreated?: (knowledgeBaseId: string) => void
  onSubmittingChange?: (isSubmitting: boolean) => void
  submitLabel?: ReactNode
}

export const CreateKnowledgeForm: FC<CreateKnowledgeFormProps> = ({
  bodyClassName,
  footerClassName,
  onCancel,
  onCreated,
  onSubmittingChange,
  submitLabel,
}) => {
  const { t } = useTranslation()
  const modelProviders = useModelStore((state) => state.myLLMs)
  const isLoadingModels = useModelStore((state) => state.isLoading)
  const loadMyLLMs = useModelStore((state) => state.loadMyLLMs)
  const {
    canSubmit,
    formData,
    handleModelSelect,
    handleNameChange,
    isLoading,
    nameError,
    submit,
    updateField,
  } = useCreateKnowledge({ onCreated })

  useEffect(() => {
    onSubmittingChange?.(isLoading)
  }, [isLoading, onSubmittingChange])

  useEffect(() => {
    if (Object.keys(modelProviders).length === 0) {
      void loadMyLLMs()
    }
  }, [loadMyLLMs, modelProviders])

  const languageOptions = useMemo(
    () =>
      LANGUAGE_OPTIONS.map((value) => ({
        value,
        label: t(`knowledge.create.options.language.${value}`),
      })),
    [t],
  )

  const permissionOptions = useMemo(
    () =>
      PERMISSION_OPTIONS.map((value) => ({
        value,
        label: t(`knowledge.create.options.permission.${value}`),
      })),
    [t],
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void submit()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn('p-space-lg space-y-5', bodyClassName)}>
        <div className="space-y-2">
          <div className="gap-space-xs flex items-center">
            <Label className="text-sm font-medium text-text-primary">
              {t('knowledge.create.fields.name')}
              <span className="ml-1 text-status-error">*</span>
            </Label>
            <Tooltip content={t('knowledge.create.fields.nameTooltip')}>
              <HelpCircle className="h-4 w-4 cursor-help text-text-tertiary hover:text-text-secondary" />
            </Tooltip>
          </div>
          <Input
            className={cn(nameError && 'border-status-error')}
            disabled={isLoading}
            onChange={(event) => handleNameChange(event.target.value)}
            placeholder={t('knowledge.create.fields.namePlaceholder')}
            value={formData.name}
          />
          {nameError ? (
            <p className="text-xs text-status-error">{nameError}</p>
          ) : null}
          <p className="text-xs text-text-tertiary">
            {t('knowledge.create.fields.nameRule')}
          </p>
        </div>

        <div className="space-y-2">
          <div className="gap-space-xs flex items-center">
            <Label className="text-sm font-medium text-text-primary">
              {t('knowledge.create.fields.description')}
            </Label>
            <Tooltip content={t('knowledge.create.fields.descriptionTooltip')}>
              <HelpCircle className="h-4 w-4 cursor-help text-text-tertiary hover:text-text-secondary" />
            </Tooltip>
          </div>
          <Textarea
            disabled={isLoading}
            onChange={(event) => updateField('description', event.target.value)}
            placeholder={t('knowledge.create.fields.descriptionPlaceholder')}
            rows={3}
            value={formData.description}
          />
        </div>

        <div className="space-y-2">
          <div className="gap-space-xs flex items-center">
            <Label className="text-sm font-medium text-text-primary">
              {t('knowledge.create.fields.language')}
            </Label>
            <Tooltip content={t('knowledge.create.fields.languageTooltip')}>
              <HelpCircle className="h-4 w-4 cursor-help text-text-tertiary hover:text-text-secondary" />
            </Tooltip>
          </div>
          <CustomSelect
            disabled={isLoading}
            onChange={(value) => updateField('language', value)}
            options={languageOptions}
            placeholder={t('knowledge.create.fields.languagePlaceholder')}
            value={formData.language}
          />
        </div>

        <EmbeddingModelSelector
          isLoadingModels={isLoadingModels}
          modelProviders={modelProviders}
          onSelect={handleModelSelect}
          selectedModelId={formData.embd_id || null}
        />

        <div className="space-y-2">
          <div className="gap-space-xs flex items-center">
            <Label className="text-sm font-medium text-text-primary">
              {t('knowledge.create.fields.permission')}
            </Label>
            <Tooltip content={t('knowledge.create.fields.permissionTooltip')}>
              <HelpCircle className="h-4 w-4 cursor-help text-text-tertiary hover:text-text-secondary" />
            </Tooltip>
          </div>
          <CustomSelect
            disabled={isLoading}
            onChange={(value) =>
              updateField('permission', value as KnowledgePermission)
            }
            options={permissionOptions}
            placeholder={t('knowledge.create.fields.permissionPlaceholder')}
            value={formData.permission}
          />
        </div>

        <div className="gap-space-sm rounded-radius-xl p-space-base flex items-start bg-status-info-subtle">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-status-info" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text-primary">
              {t('knowledge.create.tip.title')}
            </p>
            <p className="text-sm leading-relaxed text-text-secondary">
              {t('knowledge.create.tip.description')}
            </p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'gap-space-sm px-space-lg py-space-base flex items-center justify-end border-t border-border-default bg-background-subtle',
          footerClassName,
        )}
      >
        <Button
          disabled={isLoading}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          {t('knowledge.common.cancel')}
        </Button>
        <Button
          className="gap-1.5"
          disabled={!canSubmit || isLoading}
          type="submit"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('knowledge.create.actions.creating')}
            </>
          ) : (
            <>
              {submitLabel ?? t('knowledge.create.actions.submit')}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
