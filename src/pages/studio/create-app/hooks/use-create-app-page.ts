import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type ChangeEvent,
} from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { getCurrentLanguage } from '@/locales/i18n'
import { createInitialEditorConfig } from '../initial-config'
import { useSearchParams } from 'react-router-dom'
import {
  GenerationPresetType,
  detectMatchingPresetSnake,
  generationPresetConfigMapSnake,
  getDefaultEnabledFieldsSnake,
} from '@/constants/llm'
import { hasKnowledgePlaceholder } from '@/lib/chat/knowledge-prompt'
import { toast } from '@/lib/toast'
import type { KnowledgeBase } from '@/types/api'
import { DEFAULT_VARIABLE_FORM, createTempConfig } from '../constants'
import type { AppConfig, TempAppConfig, VariableForm } from '../types'
import { normalizeDialogConfig } from '../data'
import { configSignature, hasRequiredPreviewVariables } from '../editor-state'
import { withAppKnowledgeRetrieval } from '../knowledge-prompt'
import { useEditorData } from './use-editor-data'
import { useCreateAppPreview } from './use-create-app-preview'
import { useCreateAppSave } from './use-create-app-save'
import { useCurrentTheme } from './use-current-theme'

export const useCreateAppPage = () => {
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const routeId = searchParams.get('dialog_id') || searchParams.get('id')
  const currentDialogId = routeId
  const hydratedId = useRef<string | null>(null)
  const form = useForm<AppConfig>({
    defaultValues: createInitialEditorConfig(
      {
        name: searchParams.get('name'),
        description: searchParams.get('description'),
        icon: searchParams.get('icon'),
      },
      getCurrentLanguage(),
    ),
  })
  const config = useWatch({ control: form.control }) as AppConfig
  const getConfig = form.getValues
  const setConfig = useCallback<Dispatch<SetStateAction<AppConfig>>>(
    (update) => {
      const current = getConfig()
      const next = typeof update === 'function' ? update(current) : update
      for (const key of Object.keys(next) as (keyof AppConfig)[]) {
        if (current[key] !== next[key])
          form.setValue(key, next[key], { shouldDirty: true })
      }
    },
    [form, getConfig],
  )
  const [saved, setSaved] = useState<{ id: string; config: AppConfig } | null>(
    null,
  )
  const savedConfig = saved?.id === currentDialogId ? saved.config : null
  const setSavedConfig = useCallback(
    (config: AppConfig, id: string) => setSaved({ id, config }),
    [],
  )
  const [tempConfig, setTempConfig] = useState<TempAppConfig>(() =>
    createTempConfig(getConfig()),
  )
  const [showEditModal, setShowEditModal] = useState(false)
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [variableForm, setVariableForm] = useState<VariableForm>(
    DEFAULT_VARIABLE_FORM,
  )
  const [knowledgeSearch, setKnowledgeSearch] = useState('')
  const [activeKnowledgeSearch, setActiveKnowledgeSearch] = useState('')
  const [knowledgePage, setKnowledgePage] = useState(1)
  const [currentPreset, setCurrentPreset] = useState<GenerationPresetType>(
    GenerationPresetType.Custom,
  )
  const iconInputRef = useRef<HTMLInputElement>(null)
  const currentTheme = useCurrentTheme()
  const data = useEditorData(
    currentDialogId,
    config.kb_ids,
    activeKnowledgeSearch,
    knowledgePage,
    showKnowledgeModal,
  )
  useEffect(() => {
    if (
      !currentDialogId ||
      !data.detail.data ||
      hydratedId.current === currentDialogId
    )
      return
    const loaded = normalizeDialogConfig(data.detail.data)
    form.reset(loaded.config)
    setSavedConfig(loaded.config, currentDialogId)
    setTempConfig(createTempConfig(loaded.config))
    setCurrentPreset(loaded.matchedPreset)
    hydratedId.current = currentDialogId
  }, [currentDialogId, data.detail.data, form, setSavedConfig])
  const setCurrentDialogId = useCallback(
    (id: string) => {
      hydratedId.current = id
      setSearchParams(
        (previous) => {
          previous.set('dialog_id', id)
          previous.delete('id')
          return previous
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )
  const { saving, saveStatus, handleSave } = useCreateAppSave({
    getConfig,
    setConfig,
    currentDialogId,
    setCurrentDialogId,
    setSavedConfig,
  })
  const knowledgeBlock = t('chat.knowledgePrompt.block')
  const savedSignature = savedConfig
    ? configSignature(savedConfig, knowledgeBlock)
    : null
  const isDirty =
    !savedConfig || configSignature(config, knowledgeBlock) !== savedSignature
  const requiredVariables = hasRequiredPreviewVariables(savedConfig ?? config)
  const preview = useCreateAppPreview({
    dialogId: currentDialogId,
    savedConfig,
    canSend: !!savedConfig && !isDirty && !requiredVariables && !saving,
  })
  const previewStale =
    !!savedConfig &&
    preview.sessionSignature !== null &&
    (preview.sessionSignature !== savedSignature ||
      preview.sessionDialogId !== currentDialogId)
  const resetPreview = preview.handleResetPreview
  const handleSaveAndPreview = useCallback(async () => {
    const confirmed = await handleSave()
    if (!confirmed) return
    if (
      configSignature(getConfig(), t('chat.knowledgePrompt.block')) !==
      confirmed.signature
    ) {
      toast.info(t('studio.editor.newChanges'))
      return
    }
    resetPreview(confirmed.config, confirmed.id)
  }, [handleSave, getConfig, resetPreview, t])
  const knowledgeBases = data.knowledgeBases
  const addedKnowledgeBases = useMemo(
    () => new Set(config.kb_ids),
    [config.kb_ids],
  )
  const selectedEmbdId = knowledgeBases[0]?.embd_id ?? ''
  const handleOpenKnowledgeModal = useCallback(() => {
    setKnowledgePage(1)
    setShowKnowledgeModal(true)
  }, [])
  const handleKnowledgeSearch = useCallback(() => {
    setKnowledgePage(1)
    setActiveKnowledgeSearch(knowledgeSearch)
  }, [knowledgeSearch])
  const handleKnowledgePageChange = setKnowledgePage
  const handleConfigChange = useCallback(
    <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
      setConfig((previousConfig) => ({ ...previousConfig, [key]: value }))
    },
    [setConfig],
  )

  const handlePresetChange = useCallback(
    (presetType: GenerationPresetType) => {
      if (
        presetType !== GenerationPresetType.Custom &&
        presetType in generationPresetConfigMapSnake
      ) {
        const presetConfig =
          generationPresetConfigMapSnake[
            presetType as Exclude<GenerationPresetType, 'custom'>
          ]
        const enabledFields = getDefaultEnabledFieldsSnake()

        setConfig((previousConfig) => ({
          ...previousConfig,
          llm_setting: {
            ...previousConfig.llm_setting,
            temperature: presetConfig.temperature,
            top_p: presetConfig.top_p,
            presence_penalty: presetConfig.presence_penalty,
            frequency_penalty: presetConfig.frequency_penalty,
            max_tokens: presetConfig.max_tokens,
            ...enabledFields,
          },
        }))
        setCurrentPreset(presetType)
        return
      }

      setCurrentPreset(GenerationPresetType.Custom)
    },
    [setConfig],
  )

  const handleLLMSettingChange = useCallback(
    <K extends keyof AppConfig['llm_setting']>(
      field: K,
      value: AppConfig['llm_setting'][K],
    ) => {
      setConfig((previousConfig) => {
        const nextSetting = {
          ...previousConfig.llm_setting,
          [field]: value,
        }

        const matchedPreset = detectMatchingPresetSnake({
          temperature: nextSetting.temperature ?? 0.5,
          top_p: nextSetting.top_p ?? 0.85,
          presence_penalty: nextSetting.presence_penalty ?? 0.2,
          frequency_penalty: nextSetting.frequency_penalty ?? 0.3,
          max_tokens: nextSetting.max_tokens ?? 4096,
          temperature_enabled: nextSetting.temperature_enabled ?? false,
          top_p_enabled: nextSetting.top_p_enabled ?? false,
          presence_penalty_enabled:
            nextSetting.presence_penalty_enabled ?? false,
          frequency_penalty_enabled:
            nextSetting.frequency_penalty_enabled ?? false,
          max_tokens_enabled: nextSetting.max_tokens_enabled ?? false,
        })
        setCurrentPreset(matchedPreset)

        return {
          ...previousConfig,
          llm_setting: nextSetting,
        }
      })
    },
    [setConfig],
  )

  const handleAddKnowledgeBase = useCallback(
    (knowledgeBase: KnowledgeBase) => {
      const knowledgeBlock = t('chat.knowledgePrompt.block')
      setConfig((previousConfig) =>
        previousConfig.kb_ids.includes(knowledgeBase.id)
          ? previousConfig
          : withAppKnowledgeRetrieval(
              {
                ...previousConfig,
                kb_ids: [...previousConfig.kb_ids, knowledgeBase.id],
              },
              knowledgeBlock,
            ),
      )
      if (!hasKnowledgePlaceholder(config.systemPrompt)) {
        toast.info(t('chat.knowledgePrompt.inserted'))
      }
    },
    [config.systemPrompt, t, setConfig],
  )

  const handleInsertKnowledgePlaceholder = useCallback(() => {
    const knowledgeBlock = t('chat.knowledgePrompt.block')
    setConfig((previousConfig) =>
      withAppKnowledgeRetrieval(previousConfig, knowledgeBlock),
    )
  }, [t, setConfig])

  const handleRemoveKnowledgeBase = useCallback(
    (knowledgeBaseId: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        kb_ids: previousConfig.kb_ids.filter((id) => id !== knowledgeBaseId),
      }))
    },
    [setConfig],
  )

  const handleAddVariable = useCallback(() => {
    if (!variableForm.key.trim()) {
      toast.error(t('studio.editor.variableRequired'))
      return
    }

    const exists = config.prompt_config.parameters.some(
      (item) => item.key === variableForm.key.trim(),
    )
    if (exists) {
      toast.error(t('studio.editor.variableExists'))
      return
    }

    setConfig((previousConfig) => ({
      ...previousConfig,
      prompt_config: {
        ...previousConfig.prompt_config,
        parameters: [
          ...previousConfig.prompt_config.parameters,
          { ...variableForm, key: variableForm.key.trim() },
        ],
      },
    }))
    setVariableForm(DEFAULT_VARIABLE_FORM)
    setShowVariableModal(false)
  }, [config.prompt_config.parameters, variableForm, setConfig, t])

  const handleRemoveVariable = useCallback(
    (key: string) => {
      setConfig((previousConfig) => ({
        ...previousConfig,
        prompt_config: {
          ...previousConfig.prompt_config,
          parameters: previousConfig.prompt_config.parameters.filter(
            (item) => item.key !== key,
          ),
        },
      }))
    },
    [setConfig],
  )

  const handleEditApp = useCallback(() => {
    setTempConfig(createTempConfig(config))
    setShowEditModal(true)
  }, [config])

  const handleSaveEdit = useCallback(() => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      name: tempConfig.name,
      description: tempConfig.description,
      icon: tempConfig.icon,
    }))
    setShowEditModal(false)
  }, [tempConfig, setConfig])

  const handleCancelEdit = useCallback(() => {
    setTempConfig(createTempConfig(config))
    setShowEditModal(false)
  }, [config])

  const handleIconUpload = useCallback(
    (file: File) => {
      const isAllowedType =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/svg+xml'
      if (!isAllowedType) {
        toast.error(t('studio.editor.iconTypeError'))
        return false
      }

      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        toast.error(t('studio.editor.iconSizeError'))
        return false
      }

      const reader = new FileReader()
      reader.onload = () => {
        setTempConfig((previousConfig) => ({
          ...previousConfig,
          icon: reader.result as string,
        }))
      }
      reader.onerror = () => {
        toast.error(t('studio.editor.iconReadError'))
      }
      reader.readAsDataURL(file)

      return false
    },
    [t],
  )

  const handleOpenIconPicker = useCallback(() => {
    iconInputRef.current?.click()
  }, [])

  const handleIconInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        handleIconUpload(file)
      }
      event.target.value = ''
    },
    [handleIconUpload],
  )

  return {
    dialogId: currentDialogId,
    config,
    savedConfig,
    tempConfig,
    setTempConfig,
    currentTheme,
    saving,
    saveStatus,
    isDirty,
    previewStale,
    requiredVariables,
    initialLoading:
      !!currentDialogId &&
      !savedConfig &&
      data.detail.isPending &&
      saveStatus !== 'saving' &&
      saveStatus !== 'unconfirmed',
    initialError:
      !!currentDialogId &&
      !savedConfig &&
      data.detail.isError &&
      saveStatus !== 'saving' &&
      saveStatus !== 'unconfirmed',
    retryLoad: data.detail.refetch,
    chatModels: data.mappedModels.chatModels,
    rerankModels: data.mappedModels.rerankModels,
    modelsLoading: data.models.isPending,
    modelsError: data.models.isError
      ? t('studio.editor.modelsFailed')
      : undefined,
    knowledgeBases,
    availableKnowledgeBases: data.knowledge.data?.kbs ?? [],
    knowledgeLoading: data.knowledge.isPending,
    knowledgeError: data.knowledge.isError,
    retryKnowledge: data.knowledge.refetch,
    knowledgeSearch,
    setKnowledgeSearch,
    knowledgePage,
    knowledgeTotal: data.knowledge.data?.total ?? 0,
    addedKnowledgeBases,
    selectedEmbdId,
    currentPreset,
    variableForm,
    setVariableForm,
    ...preview,
    iconInputRef,
    showEditModal,
    setShowEditModal,
    showKnowledgeModal,
    setShowKnowledgeModal,
    showVariableModal,
    setShowVariableModal,
    handleConfigChange,
    handleLLMSettingChange,
    handlePresetChange,
    handleOpenKnowledgeModal,
    handleKnowledgeSearch,
    handleKnowledgePageChange,
    handleAddKnowledgeBase,
    handleRemoveKnowledgeBase,
    handleInsertKnowledgePlaceholder,
    handleAddVariable,
    handleRemoveVariable,
    handleEditApp,
    handleSaveEdit,
    handleCancelEdit,
    handleSave,
    handleSaveAndPreview,
    handleOpenIconPicker,
    handleIconInputChange,
  }
}
export type CreateAppPageController = ReturnType<typeof useCreateAppPage>
