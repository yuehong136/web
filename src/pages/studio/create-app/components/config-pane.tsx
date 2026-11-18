import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <Tabs
      value={tab}
      onValueChange={(value) => setTab(value as EditorTab)}
      className="flex h-full min-h-0 flex-col bg-surface"
    >
      <TabsList
        variant="segmented"
        aria-label={t('studio.editor.edit')}
        className="m-space-sm grid shrink-0 grid-cols-2 sm:grid-cols-4"
      >
        {(['prompt', 'knowledge', 'model', 'experience'] as const).map(
          (value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="min-w-0 justify-center px-space-xs"
            >
              {t(`studio.editor.${value}`)}
            </TabsTrigger>
          ),
        )}
      </TabsList>
      <TabsContent
        value="prompt"
        forceMount
        hidden={tab !== 'prompt'}
        className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden"
      >
        <PromptPane {...prompt} />
      </TabsContent>
      <TabsContent
        value="knowledge"
        forceMount
        hidden={tab !== 'knowledge'}
        className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
      >
        <KnowledgeConfig {...knowledge} />
      </TabsContent>
      <TabsContent
        value="model"
        forceMount
        hidden={tab !== 'model'}
        className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
      >
        <ModelConfig {...model} />
      </TabsContent>
      <TabsContent
        value="experience"
        forceMount
        hidden={tab !== 'experience'}
        className="mt-0 min-h-0 flex-1 overflow-y-auto data-[state=inactive]:hidden"
      >
        <ExperienceConfig {...experience} />
      </TabsContent>
    </Tabs>
  )
}
