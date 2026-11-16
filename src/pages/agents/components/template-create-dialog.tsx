import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSetAgent } from '@/hooks/use-agent-request'
import {
  buildAgentCanvasPath,
  buildInitialDsl,
  inferCanvasTypeFromGraph,
  resolveCanvasCategory,
  resolveCanvasKind,
  resolveLocalizedText,
} from '@/lib/agent'
import { AgentCanvasType, type AgentTemplate } from '@/types/agent'
import { CreateAgentDialog } from './create-agent-dialog'

/** Agent or pipeline, preferring what the template's graph says. */
export function resolveTemplateKind(template: AgentTemplate | null) {
  if (!template) return AgentCanvasType.AGENT
  const graphKind = inferCanvasTypeFromGraph(template.dsl?.graph)
  if (graphKind === AgentCanvasType.PIPELINE) return graphKind
  return resolveCanvasKind(template)
}

/**
 * Names a new agent made from `template`, creates it and opens its canvas.
 * Shared by the template gallery and the Studio "start from a template" row.
 */
export function TemplateCreateDialog({
  template,
  onClose,
}: {
  template: AgentTemplate | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAgent = useSetAgent()

  const handleCreate = async (payload: { title: string }) => {
    if (!template) return
    const templateKind = resolveTemplateKind(template)
    const templateCategory = resolveCanvasCategory(templateKind)
    const flow = await setAgent.setAgent({
      title: payload.title,
      canvas_category: templateCategory,
      avatar: template.avatar,
      description: resolveLocalizedText(template.description, ''),
      dsl: template.dsl || buildInitialDsl(templateKind),
    })
    navigate(buildAgentCanvasPath(flow.id, templateCategory))
  }

  return (
    <CreateAgentDialog
      key={template?.id || 'template-create-dialog'}
      open={Boolean(template)}
      onOpenChange={(open) => !open && onClose()}
      onConfirm={handleCreate}
      defaultTitle={template ? resolveLocalizedText(template.title) : ''}
      initialKind={resolveTemplateKind(template)}
      allowKindChange={false}
      title={t('agents.templatesPage.createTitle')}
      description={t('agents.templatesPage.createDescription')}
    />
  )
}
