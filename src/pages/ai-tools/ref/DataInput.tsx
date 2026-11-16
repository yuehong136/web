import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  ChevronDown,
  Code2,
  Copy,
  FormInput,
  PlugZap,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { documentAPI } from '@/api/document'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { toast } from '@/lib/toast'
import { useStructuredAIFill } from './use-structured-ai-fill'
import {
  DataInputSettingsDialog,
  type LlmConfig,
  type McpConfig,
  type PromptConfig,
} from './data-input-settings-dialog'
import type {
  UploadedFile,
  UserInputMode,
} from './data-input-user-input-section'

export interface PlaceholderData {
  [key: string]: string
}

interface DataInputProps {
  placeholders: PlaceholderData
  processedFile: string
  originalFileName?: string
  onDataFilled: (fileData: string) => void
  onBackToUpload: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const emptyForm = (placeholders: PlaceholderData) =>
  Object.fromEntries(Object.keys(placeholders).map((key) => [key, '']))

const isFilled = (value: string | undefined) => Boolean(value?.trim())

/** Step 2: fill the placeholders by hand, as JSON, or with AI. */
const DataInput: React.FC<DataInputProps> = ({
  placeholders,
  processedFile,
  originalFileName,
  onDataFilled,
  onBackToUpload,
  isLoading,
  setIsLoading,
}) => {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<PlaceholderData>({})
  const [jsonInput, setJsonInput] = useState('')
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { aiFilling, aiRawOutput, fill } = useStructuredAIFill(setIsLoading)
  const [llmConfig, setLlmConfig] = useState<LlmConfig>({
    llm_name: '',
    temperature: 0.3,
    max_tokens: 2048,
  })
  const [mcpConfig, setMcpConfig] = useState<McpConfig>({
    mcp_ids: [],
    mcp_timeout: 10,
    verbose_tool_use: false,
  })
  const [promptConfig, setPromptConfig] = useState<PromptConfig>(() => ({
    systemPrompt: t('aiTools.autoFill.prompt.system'),
    userInput: '',
  }))
  const [searchKey, setSearchKey] = useState('')
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false)
  // Kept here so closing the settings dialog keeps typed text and files.
  const [userInputMode, setUserInputMode] = useState<UserInputMode>('manual')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])

  const [previousPlaceholders, setPreviousPlaceholders] =
    useState<PlaceholderData | null>(null)
  if (previousPlaceholders !== placeholders) {
    setPreviousPlaceholders(placeholders)
    const initial = emptyForm(placeholders)
    setFormData(initial)
    setJsonInput(JSON.stringify(initial, null, 2))
  }

  const placeholderKeys = Object.keys(placeholders)
  const filledCount = placeholderKeys.filter((key) =>
    isFilled(formData[key]),
  ).length
  const filteredKeys = placeholderKeys.filter((key) => {
    const hit =
      !searchKey || key.toLowerCase().includes(searchKey.toLowerCase())
    return showOnlyEmpty ? hit && !isFilled(formData[key]) : hit
  })

  const setForm = (next: PlaceholderData) => {
    setFormData(next)
    setJsonInput(JSON.stringify(next, null, 2))
  }

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    try {
      setFormData(JSON.parse(value))
    } catch {
      /* keep the last valid form while the JSON is being edited */
    }
  }

  /** The supplement the model sees: typed text, or the attached files. */
  const supplement = () => {
    const files = uploadedFiles
      .filter((file) => file.content)
      .map((file) =>
        t('aiTools.autoFill.prompt.file', {
          name: file.name,
          content: file.content,
        }),
      )
    const parts =
      userInputMode === 'file' ? files : [promptConfig.userInput.trim()]
    return (
      parts.filter(Boolean).join('\n\n') || t('aiTools.autoFill.prompt.none')
    )
  }

  const handleAIFill = async () => {
    if (placeholderKeys.length === 0) {
      toast.error(t('aiTools.autoFill.fill.noFields'))
      return
    }
    if (!llmConfig.llm_name) {
      toast.error(t('aiTools.autoFill.fill.chooseModel'))
      setSettingsOpen(true)
      return
    }
    let baseData: PlaceholderData
    try {
      baseData = JSON.parse(jsonInput)
    } catch {
      baseData = formData
    }
    const parsed = await fill({
      prompt: (
        promptConfig.systemPrompt || t('aiTools.autoFill.prompt.system')
      ).trim(),
      messages: [
        {
          role: 'user' as const,
          content: t('aiTools.autoFill.prompt.user', {
            template: JSON.stringify(baseData || {}, null, 2),
            input: supplement(),
          }),
        },
      ],
      llm_name: llmConfig.llm_name,
      stream: true,
      gen_conf: {
        ...(llmConfig.temperature !== undefined
          ? { temperature: llmConfig.temperature }
          : {}),
        ...(llmConfig.max_tokens ? { max_tokens: llmConfig.max_tokens } : {}),
      },
      mcp_ids: mcpConfig.mcp_ids,
      mcp_timeout: mcpConfig.mcp_timeout,
      verbose_tool_use: mcpConfig.verbose_tool_use,
      files: [],
      structured_output: mcpConfig.mcp_ids.length > 0,
      delta_stream: true,
    })
    if (!parsed) return
    setForm(parsed)
    toast.success(t('chat.stream.aiFillComplete'))
  }

  const resetForm = () => {
    setForm(emptyForm(placeholders))
    toast.success(t('aiTools.autoFill.fill.resetDone'))
  }

  const fillDocument = async () => {
    if (!processedFile) {
      toast.error(t('aiTools.autoFill.fill.missingFile'))
      return
    }
    setIsLoading(true)
    try {
      const bytes = Uint8Array.from(atob(processedFile.trim()), (char) =>
        char.charCodeAt(0),
      )
      const upload = new File([bytes], originalFileName || 'document.docx', {
        type: DOCX_MIME,
      })
      const response = await documentAPI.fillDocx(upload, formData)
      onDataFilled(response.file)
      toast.success(t('aiTools.autoFill.fill.generated'))
    } catch (error) {
      console.error(error)
      toast.error(t('aiTools.autoFill.fill.generateFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm">
          <Button variant="ghost" size="sm" onClick={onBackToUpload}>
            <ArrowLeft aria-hidden="true" />
            {t('aiTools.autoFill.fill.back')}
          </Button>
          <span className="text-sm text-text-secondary tabular-nums">
            {t('aiTools.autoFill.fill.filled', {
              filled: filledCount,
              total: placeholderKeys.length,
            })}
          </span>
        </div>
        <div className="flex items-center gap-space-xs">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={resetForm}
            aria-label={t('aiTools.autoFill.fill.reset')}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 aria-hidden="true" />
            {t('aiTools.autoFill.fill.settings')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIFill}
            disabled={isLoading || aiFilling || placeholderKeys.length === 0}
          >
            {aiFilling ? (
              <Spinner size="sm" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            {t('aiTools.autoFill.fill.aiFill')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-space-md gap-y-space-xs text-sm">
        <p className="flex items-center gap-space-xs">
          <span className="text-text-secondary">
            {t('aiTools.autoFill.fill.model')}
          </span>
          <span className="font-medium text-text-primary">
            {llmConfig.llm_name || t('aiTools.autoFill.fill.noModel')}
          </span>
        </p>
        {mcpConfig.mcp_ids.length > 0 ? (
          <p className="flex items-center gap-space-xs text-text-secondary">
            <PlugZap className="size-icon-xs" aria-hidden="true" />
            {t('aiTools.autoFill.fill.mcpCount', {
              count: mcpConfig.mcp_ids.length,
            })}
          </p>
        ) : null}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'form' | 'json')}
      >
        <div className="mb-space-base flex flex-wrap items-center justify-between gap-space-sm">
          <TabsList>
            <TabsTrigger value="form">
              <FormInput aria-hidden="true" />
              {t('aiTools.autoFill.fill.tabs.form')}
            </TabsTrigger>
            <TabsTrigger value="json">
              <Code2 aria-hidden="true" />
              {t('aiTools.autoFill.fill.tabs.json')}
            </TabsTrigger>
          </TabsList>
          {activeTab === 'form' ? (
            <div className="flex items-center gap-space-sm">
              <Input
                value={searchKey}
                onChange={(event) => setSearchKey(event.target.value)}
                placeholder={t('aiTools.autoFill.fill.searchFields')}
                aria-label={t('aiTools.autoFill.fill.searchFields')}
                inputSize="sm"
                leftIcon={<Search className="size-icon-sm" />}
                className="w-40"
              />
              <label className="flex cursor-pointer items-center gap-space-xs text-sm text-text-secondary">
                <Switch
                  checked={showOnlyEmpty}
                  onCheckedChange={setShowOnlyEmpty}
                />
                {t('aiTools.autoFill.fill.onlyEmpty')}
              </label>
            </div>
          ) : null}
        </div>

        <TabsContent value="form" className="mt-0">
          {placeholderKeys.length === 0 || filteredKeys.length === 0 ? (
            <p className="py-space-2xl text-center text-sm text-text-secondary">
              {placeholderKeys.length === 0
                ? t('aiTools.autoFill.fill.noPlaceholders')
                : t('aiTools.autoFill.fill.noMatches')}
            </p>
          ) : (
            <div className="grid gap-space-base sm:grid-cols-2">
              {filteredKeys.map((key) => (
                <div key={key} className="flex min-w-0 flex-col gap-space-xs">
                  <Label htmlFor={`placeholder-${key}`} className="truncate">
                    {key}
                  </Label>
                  <Input
                    id={`placeholder-${key}`}
                    value={formData[key] || ''}
                    onChange={(event) =>
                      setForm({ ...formData, [key]: event.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="json" className="mt-0 flex flex-col gap-space-base">
          <div className="relative">
            <Textarea
              value={jsonInput}
              onChange={(event) => handleJsonChange(event.target.value)}
              aria-label={t('aiTools.autoFill.fill.tabs.json')}
              className="min-h-60 resize-none font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t('aiTools.autoFill.fill.copyJson')}
              onClick={() =>
                copyToClipboardWithFeedback(
                  jsonInput,
                  t('aiTools.autoFill.fill.jsonCopied'),
                  t('aiTools.autoFill.fill.copyFailed'),
                )
              }
              className="absolute top-space-xs right-space-xs"
            >
              <Copy aria-hidden="true" />
            </Button>
          </div>
          {aiRawOutput ? (
            <details className="group rounded-radius-lg border border-border-default">
              <summary className="flex cursor-pointer list-none items-center gap-space-xs px-space-base py-space-sm text-sm font-medium text-text-primary hover:bg-state-hover [&::-webkit-details-marker]:hidden">
                <Sparkles
                  className="size-icon-sm text-text-tertiary"
                  aria-hidden="true"
                />
                <span className="flex-1">
                  {t('aiTools.autoFill.fill.rawOutput')}
                </span>
                <ChevronDown
                  className="size-icon-sm transition-transform group-open:rotate-180 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </summary>
              <pre className="max-h-40 overflow-auto border-t border-border-subtle p-space-base text-xs whitespace-pre-wrap text-text-secondary">
                {aiRawOutput}
              </pre>
            </details>
          ) : null}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end border-t border-border-subtle pt-space-base">
        <Button
          onClick={fillDocument}
          disabled={isLoading || placeholderKeys.length === 0}
          size="lg"
        >
          {isLoading ? <Spinner size="sm" /> : <Save aria-hidden="true" />}
          {isLoading
            ? t('aiTools.autoFill.fill.generating')
            : t('aiTools.autoFill.fill.generate')}
        </Button>
      </div>

      <DataInputSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        llmConfig={llmConfig}
        setLlmConfig={setLlmConfig}
        mcpConfig={mcpConfig}
        setMcpConfig={setMcpConfig}
        promptConfig={promptConfig}
        setPromptConfig={setPromptConfig}
        userInputMode={userInputMode}
        setUserInputMode={setUserInputMode}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
      />
    </div>
  )
}

export default DataInput
