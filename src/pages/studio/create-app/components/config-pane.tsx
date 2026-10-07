import { useTranslation } from 'react-i18next'
import {
  SegmentedTabs,
  SegmentedTabsContent,
  SegmentedTabsList,
  SegmentedTabsTrigger,
} from '@/components/ui/segmented-tabs'
import {
  useStudioEditorPreferences,
  type EditorTab,
} from '@/stores/studio-editor'
import { PromptPane, type PromptPaneProps } from './prompt-pane'
import { KnowledgeConfig, type KnowledgeConfigProps } from './knowledge-config'
import { ModelConfig, type ModelConfigProps } from './model-config'
import { ExperienceConfig } from './experience-config'
import type { ConfigBindings } from './config-fields'

export function ConfigPane({
  prompt,
  knowledge,
  model,
  experience,
}: {
  prompt: PromptPaneProps
  knowledge: KnowledgeConfigProps
  model: ModelConfigProps
  experience: ConfigBindings
}) {
  const { t } = useTranslation()
  const tab = useStudioEditorPreferences((state) => state.tab)
  const setTab = useStudioEditorPreferences((state) => state.setTab)
  return (
    <SegmentedTabs
      value={tab}
      onValueChange={(value) => setTab(value as EditorTab)}
      className="flex h-full min-h-0 flex-col bg-components-studio-surface"
    >
      <SegmentedTabsList
        aria-label={t('studio.editor.edit')}
        className="grid grid-cols-2 overflow-visible sm:grid-cols-4"
      >
        {(['prompt', 'knowledge', 'model', 'experience'] as const).map(
          (value) => (
            <SegmentedTabsTrigger
              key={value}
              value={value}
              className="min-w-0 justify-center px-space-xs"
            >
              {t(`studio.editor.${value}`)}
            </SegmentedTabsTrigger>
          ),
        )}
      </SegmentedTabsList>
      <SegmentedTabsContent
        value="prompt"
        forceMount
        hidden={tab !== 'prompt'}
        className="min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <PromptPane {...prompt} />
      </SegmentedTabsContent>
      <SegmentedTabsContent
        value="knowledge"
        forceMount
        hidden={tab !== 'knowledge'}
        className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
      >
        <KnowledgeConfig {...knowledge} />
      </SegmentedTabsContent>
      <SegmentedTabsContent
        value="model"
        forceMount
        hidden={tab !== 'model'}
        className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
      >
        <ModelConfig {...model} />
      </SegmentedTabsContent>
      <SegmentedTabsContent
        value="experience"
        forceMount
        hidden={tab !== 'experience'}
        className="min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
      >
        <ExperienceConfig {...experience} />
      </SegmentedTabsContent>
    </SegmentedTabs>
  )
}
