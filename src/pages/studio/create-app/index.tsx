import React, { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { StudioTriPanePageTemplate } from '@/components/page-templates'
import { STUDIO_CREATE_APP_LAYOUT_ID } from './constants'
import { ConfigPane } from './components/config-pane'
import { EditAppDialog } from './components/edit-app-dialog'
import { EditorHeader } from './components/editor-header'
import { KnowledgeDialog } from './components/knowledge-dialog'
import { PreviewPane } from './components/preview-pane'
import { PromptPane } from './components/prompt-pane'
import { VariableDialog } from './components/variable-dialog'
import { useCreateAppPage } from './hooks/use-create-app-page'

const CreateAppPageComponent: React.FC = () => {
  const navigate = useNavigate()
  const controller = useCreateAppPage()

  return (
    <>
      <StudioTriPanePageTemplate
        header={<EditorHeader controller={controller} onBack={() => navigate('/studio')} />}
        autoSaveId={STUDIO_CREATE_APP_LAYOUT_ID}
        leftPanelRef={controller.leftPanelRef}
        rightPanelRef={controller.rightPanelRef}
        leftPanelProps={{
          id: 'studio-create-left',
          order: 1,
          defaultSize: 33,
          minSize: 20,
          maxSize: 50,
          collapsible: true,
          collapsedSize: 4,
          onCollapse: () => controller.setLeftCollapsed(true),
          onExpand: () => controller.setLeftCollapsed(false),
        }}
        centerPanelProps={{
          id: 'studio-create-center',
          order: 2,
          defaultSize: 34,
          minSize: 30,
        }}
        rightPanelProps={{
          id: 'studio-create-right',
          order: 3,
          defaultSize: 33,
          minSize: 20,
          maxSize: 50,
          collapsible: true,
          collapsedSize: 4,
          onCollapse: () => controller.setRightCollapsed(true),
          onExpand: () => controller.setRightCollapsed(false),
        }}
        leftPane={<PromptPane controller={controller} />}
        centerPane={<ConfigPane controller={controller} />}
        rightPane={<PreviewPane controller={controller} />}
      />

      <EditAppDialog controller={controller} />
      <KnowledgeDialog controller={controller} />
      <VariableDialog controller={controller} />
    </>
  )
}

export const CreateAppPage = memo(CreateAppPageComponent)
