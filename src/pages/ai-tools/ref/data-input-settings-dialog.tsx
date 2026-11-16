import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { useFetchMCPServers } from '@/hooks/use-mcp-request'
import { useModelSelectorRequest } from '@/hooks/use-model-selector-request'
import {
  UserInputSection,
  type UploadedFile,
  type UserInputMode,
} from './data-input-user-input-section'

export interface LlmConfig {
  llm_name: string
  temperature: number
  max_tokens: number
}

export interface McpConfig {
  mcp_ids: string[]
  mcp_timeout: number
  verbose_tool_use: boolean
}

export interface PromptConfig {
  systemPrompt: string
  userInput: string
}

interface DataInputSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  llmConfig: LlmConfig
  setLlmConfig: React.Dispatch<React.SetStateAction<LlmConfig>>
  mcpConfig: McpConfig
  setMcpConfig: React.Dispatch<React.SetStateAction<McpConfig>>
  promptConfig: PromptConfig
  setPromptConfig: React.Dispatch<React.SetStateAction<PromptConfig>>
  userInputMode: UserInputMode
  setUserInputMode: (mode: UserInputMode) => void
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
}

type SettingsTab = 'llm' | 'prompt' | 'mcp'

/** Model, prompt and MCP settings for AI fill; edits apply immediately. */
export const DataInputSettingsDialog = ({
  open,
  onOpenChange,
  llmConfig,
  setLlmConfig,
  mcpConfig,
  setMcpConfig,
  promptConfig,
  setPromptConfig,
  userInputMode,
  setUserInputMode,
  uploadedFiles,
  setUploadedFiles,
}: DataInputSettingsDialogProps) => {
  const { t } = useTranslation()
  const [tab, setTab] = React.useState<SettingsTab>('llm')
  const { myLLMs, modelRequest } = useModelSelectorRequest()
  const { data: serverData, isFetching: mcpLoading } = useFetchMCPServers({
    page_size: 100,
    errorMessage: t('aiTools.autoFill.fill.mcpLoadFailed'),
    enabled: open,
  })
  const mcpServers = serverData?.mcp_servers ?? []
  const ids = React.useId()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" modal>
        <DialogHeader>
          <DialogTitle>{t('aiTools.autoFill.settings.title')}</DialogTitle>
          <DialogDescription>
            {t('aiTools.autoFill.settings.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as SettingsTab)}
          >
            <TabsList className="mb-space-base w-full *:flex-1">
              <TabsTrigger value="llm">
                {t('aiTools.autoFill.settings.tabs.model')}
              </TabsTrigger>
              <TabsTrigger value="prompt">
                {t('aiTools.autoFill.settings.tabs.prompt')}
              </TabsTrigger>
              <TabsTrigger value="mcp">
                {t('aiTools.autoFill.settings.tabs.advanced')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="llm" className="flex flex-col gap-space-base">
              <ChatModelSelector
                models={myLLMs}
                {...modelRequest}
                selectedModelName={llmConfig.llm_name}
                onSelect={(name) =>
                  setLlmConfig((prev) => ({ ...prev, llm_name: name || '' }))
                }
                modelTypes={['chat']}
              />
              <div className="grid grid-cols-2 gap-space-base">
                <div className="flex flex-col gap-space-xs">
                  <Label htmlFor={`${ids}-temperature`}>
                    {t('aiTools.autoFill.settings.temperature')}
                  </Label>
                  <Input
                    id={`${ids}-temperature`}
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={llmConfig.temperature}
                    onChange={(event) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        temperature: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <Label htmlFor={`${ids}-max-tokens`}>
                    {t('aiTools.autoFill.settings.maxTokens')}
                  </Label>
                  <Input
                    id={`${ids}-max-tokens`}
                    type="number"
                    min="256"
                    max="4096"
                    value={llmConfig.max_tokens}
                    onChange={(event) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        max_tokens: Number(event.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="flex flex-col gap-space-lg">
              <div className="flex flex-col gap-space-xs">
                <Label htmlFor={`${ids}-system`}>
                  {t('aiTools.autoFill.settings.systemPrompt')}
                </Label>
                <Textarea
                  id={`${ids}-system`}
                  className="min-h-20 resize-none"
                  value={promptConfig.systemPrompt}
                  onChange={(event) =>
                    setPromptConfig((prev) => ({
                      ...prev,
                      systemPrompt: event.target.value,
                    }))
                  }
                  placeholder={t('aiTools.autoFill.prompt.system')}
                />
                <p className="text-xs text-text-secondary">
                  {t('aiTools.autoFill.settings.systemPromptHint')}
                </p>
              </div>
              <UserInputSection
                userInputMode={userInputMode}
                setUserInputMode={setUserInputMode}
                userInput={promptConfig.userInput}
                onUserInputChange={(value) =>
                  setPromptConfig((prev) => ({ ...prev, userInput: value }))
                }
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
              />
            </TabsContent>

            <TabsContent value="mcp" className="flex flex-col gap-space-base">
              <div className="flex flex-col gap-space-xs">
                <p className="flex items-center gap-space-xs text-sm font-medium text-text-primary">
                  {t('aiTools.autoFill.settings.mcpTools')}
                  {mcpLoading ? <Spinner size="sm" /> : null}
                </p>
                <ScrollArea className="h-32 rounded-radius-md border border-border-default p-space-sm">
                  {mcpServers.length === 0 ? (
                    <p className="py-space-base text-center text-sm text-text-secondary">
                      {t('aiTools.autoFill.settings.noMcp')}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-space-sm">
                      {mcpServers.map((server) => (
                        <li key={server.id}>
                          <label className="flex cursor-pointer items-center gap-space-sm text-sm text-text-primary">
                            <Checkbox
                              checked={mcpConfig.mcp_ids.includes(server.id)}
                              onCheckedChange={(checked) =>
                                setMcpConfig((prev) => ({
                                  ...prev,
                                  mcp_ids: checked
                                    ? [...prev.mcp_ids, server.id]
                                    : prev.mcp_ids.filter(
                                        (id) => id !== server.id,
                                      ),
                                }))
                              }
                            />
                            {server.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </div>
              <div className="grid grid-cols-2 gap-space-base">
                <div className="flex flex-col gap-space-xs">
                  <Label htmlFor={`${ids}-timeout`}>
                    {t('aiTools.autoFill.settings.timeout')}
                  </Label>
                  <Input
                    id={`${ids}-timeout`}
                    type="number"
                    min="1"
                    max="60"
                    value={mcpConfig.mcp_timeout}
                    onChange={(event) =>
                      setMcpConfig((prev) => ({
                        ...prev,
                        mcp_timeout: Number(event.target.value),
                      }))
                    }
                  />
                </div>
                <div className="flex flex-col gap-space-xs">
                  <Label htmlFor={`${ids}-verbose`}>
                    {t('aiTools.autoFill.settings.verbose')}
                  </Label>
                  <div className="flex min-h-[var(--control-height)] items-center">
                    <Switch
                      id={`${ids}-verbose`}
                      checked={mcpConfig.verbose_tool_use}
                      onCheckedChange={(checked) =>
                        setMcpConfig((prev) => ({
                          ...prev,
                          verbose_tool_use: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('aiTools.autoFill.settings.cancel')}
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            {t('aiTools.autoFill.settings.done')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
