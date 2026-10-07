import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { StudioPageTemplate } from '@/components/page-templates'
import { PageErrorState, PageLoadingState } from '@/components/patterns'
import { ConfigPane } from './components/config-pane'
import { EditAppDialog } from './components/edit-app-dialog'
import { EditorHeader } from './components/editor-header'
import {
  EditorWorkspace,
  type EditorFocus,
} from './components/editor-workspace'
import { KnowledgeDialog } from './components/knowledge-dialog'
import { PreviewPane } from './components/preview-pane'
import { VariableDialog } from './components/variable-dialog'
import { useCreateAppPage } from './hooks/use-create-app-page'

export function CreateAppPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const controller = useCreateAppPage()
  const [focus, setFocus] = useState<EditorFocus>('split')
  const focusOrigin = useRef<HTMLElement | null>(null)
  const variableTriggerRef = useRef<HTMLButtonElement>(null)
  const toggleFocus = (pane: 'edit' | 'preview') => {
    if (focus === pane) {
      setFocus('split')
      requestAnimationFrame(() => focusOrigin.current?.focus())
    } else {
      focusOrigin.current = document.activeElement as HTMLElement | null
      setFocus(pane)
    }
  }
  const bindings = {
    config: controller.config,
    onChange: controller.handleConfigChange,
  }
  const disabled = controller.initialLoading || controller.initialError
  const status = controller.saving
    ? 'saving'
    : controller.saveStatus === 'failed' ||
        controller.saveStatus === 'unconfirmed'
      ? controller.saveStatus
      : controller.isDirty
        ? 'unsaved'
        : 'saved'
  return (
    <>
      <StudioPageTemplate
        toolbar={
          <EditorHeader
            config={controller.config}
            saving={controller.saving}
            status={status}
            disabled={disabled}
            onEdit={controller.handleEditApp}
            onSave={controller.handleSave}
            onBack={() => navigate('/studio')}
          />
        }
      >
        {controller.initialLoading ? (
          <PageLoadingState title={t('studio.editor.loading')} description="" />
        ) : controller.initialError ? (
          <PageErrorState
            title={t('studio.editor.loadFailed')}
            description={t('studio.editor.loadFailedDescription')}
            retryLabel={t('studio.editor.retryLoad')}
            onRetry={() => {
              void controller.retryLoad()
            }}
          />
        ) : (
          <EditorWorkspace
            focus={focus}
            editor={
              <ConfigPane
                prompt={{
                  ...bindings,
                  theme: controller.currentTheme,
                  focused: focus === 'edit',
                  onFocus: () => toggleFocus('edit'),
                  onAddVariable: (trigger) => {
                    variableTriggerRef.current = trigger
                    controller.setShowVariableModal(true)
                  },
                  onRemoveVariable: controller.handleRemoveVariable,
                  onInsertKnowledge:
                    controller.handleInsertKnowledgePlaceholder,
                }}
                knowledge={{
                  ...bindings,
                  knowledgeBases: controller.knowledgeBases,
                  rerankModels: controller.rerankModels,
                  modelsLoading: controller.modelsLoading,
                  modelsError: controller.modelsError,
                  onAdd: controller.handleOpenKnowledgeModal,
                  onRemove: controller.handleRemoveKnowledgeBase,
                }}
                model={{
                  ...bindings,
                  models: controller.chatModels,
                  loading: controller.modelsLoading,
                  error: controller.modelsError,
                  preset: controller.currentPreset,
                  onPresetChange: controller.handlePresetChange,
                  onSettingChange: controller.handleLLMSettingChange,
                }}
                experience={bindings}
              />
            }
            preview={
              <PreviewPane
                savedConfig={controller.savedConfig}
                isDirty={controller.isDirty}
                previewStale={controller.previewStale}
                requiredVariables={controller.requiredVariables}
                saving={controller.saving}
                previewMessages={controller.previewMessages}
                inputValue={controller.inputValue}
                setInputValue={controller.setInputValue}
                isStreaming={controller.isStreaming}
                status={controller.status}
                runDetails={controller.runDetails}
                handleSendPreviewMessage={controller.handleSendPreviewMessage}
                handleStopOutput={controller.handleStopOutput}
                handleRetryPreview={controller.handleRetryPreview}
                handleSaveAndPreview={controller.handleSaveAndPreview}
                focused={focus === 'preview'}
                onFocus={() => toggleFocus('preview')}
                onReset={() => controller.handleResetPreview()}
              />
            }
          />
        )}
      </StudioPageTemplate>
      <EditAppDialog controller={controller} />
      <KnowledgeDialog controller={controller} />
      <VariableDialog
        controller={controller}
        returnFocusRef={variableTriggerRef}
      />
    </>
  )
}
