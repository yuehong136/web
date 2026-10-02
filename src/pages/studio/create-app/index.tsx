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
        header={
          <EditorHeader
            controller={controller}
            onBack={() => navigate('/studio')}
          />
        }
        layoutId={STUDIO_CREATE_APP_LAYOUT_ID}
        leftPanelRef={controller.leftPanelRef}
        rightPanelRef={controller.rightPanelRef}
        leftPanelProps={{
          id: 'studio-create-left',
          defaultSize: '33%',
          minSize: '20%',
          maxSize: '50%',
          collapsible: true,
          collapsedSize: '4%',
          onResize: () =>
            controller.setLeftCollapsed(
              controller.leftPanelRef.current?.isCollapsed() ?? false,
            ),
        }}
        centerPanelProps={{
          id: 'studio-create-center',
          defaultSize: '34%',
          minSize: '30%',
        }}
        rightPanelProps={{
          id: 'studio-create-right',
          defaultSize: '33%',
          minSize: '20%',
          maxSize: '50%',
          collapsible: true,
          collapsedSize: '4%',
          onResize: () =>
            controller.setRightCollapsed(
              controller.rightPanelRef.current?.isCollapsed() ?? false,
            ),
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
