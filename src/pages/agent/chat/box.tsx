import { memo, useCallback, useMemo, useState } from 'react'
import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MessageSquareDashed, Send, Square } from 'lucide-react'
import type { AgentRuntimeController, RuntimeAttachment } from '../features/runtime-workbench/types'
import { RuntimeMessageBubble } from '../components/runtime-message-bubble'
import DebugContent from '../debug-content'
import { FileUploadDirectUpload } from '../debug-content/uploader'

interface AgentChatBoxProps {
  controller: AgentRuntimeController
}

function AgentChatBox({ controller }: AgentChatBoxProps) {
  const [inputValue, setInputValue] = useState('')
  const [files, setFiles] = useState<RuntimeAttachment[]>([])

  const isComposerDisabled = useMemo(() => {
    return controller.loading || controller.isTaskMode
  }, [controller.isTaskMode, controller.loading])

  const handleSendMessage = useCallback(async () => {
    if ((!inputValue.trim() && files.length === 0) || controller.loading) {
      return
    }

    const requestFiles = [...files]

    await controller.handleSendMessage({
      content: inputValue,
      files: requestFiles,
    })

    setInputValue('')
    setFiles([])
  }, [controller, files, inputValue])

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        void handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-auto px-space-md py-space-md">
        {controller.messages.length === 0 ? (
          <SectionCard padding="default">
            <div className="flex items-start gap-space-sm text-sm text-text-secondary">
              <MessageSquareDashed className="mt-[2px] size-4 shrink-0 text-text-accent" />
              <div className="space-y-space-xs">
                <p className="text-text-primary">
                  还没有运行消息
                </p>
                <p>
                  先在 Run 视图提交 Begin 输入，然后在这里发送测试消息。普通 Agent 会复用当前编辑器里的最新图谱。
                </p>
              </div>
            </div>
          </SectionCard>
        ) : (
          <div className="space-y-space-md">
            {controller.messages.map((message, index) => {
              const isLatest = index === controller.messages.length - 1

              return (
                <RuntimeMessageBubble
                  key={message.id}
                  message={message}
                  onXCardAction={controller.handleXCardAction}
                >
                    {message.awaitingInputs?.length && isLatest ? (
                      <div className="mt-space-md rounded-radius-md border border-border-primary bg-surface-primary p-space-sm">
                        <DebugContent
                          canvasId={controller.canvasId}
                          parameters={message.awaitingInputs}
                          ok={(values) =>
                            controller.handleSubmitAwaitingInputs(message.id, values)
                          }
                          isNext={false}
                          loading={controller.loading}
                          btnText="提交继续运行"
                          className="min-h-0"
                          maxHeight="max-h-none"
                        />
                      </div>
                    ) : null}
                </RuntimeMessageBubble>
              )
            })}
          </div>
        )}
      </div>

      {controller.isTaskMode ? null : (
        <div className="border-t border-border-primary px-space-md py-space-sm">
          <div className="mb-space-sm flex flex-wrap items-center gap-space-sm">
            <FileUploadDirectUpload
              canvasId={controller.canvasId}
              value={files}
              onChange={(value) => setFiles(value as RuntimeAttachment[])}
              multiple
              compact
              buttonLabel="附件"
            />
          </div>

          <div className="flex items-center gap-space-sm">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入测试消息..."
              disabled={isComposerDisabled}
              className="flex-1"
            />

            {controller.loading ? (
              <Button
                type="button"
                variant="outline"
                onClick={controller.handleStop}
              >
                <Square className="size-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  void handleSendMessage()
                }}
                disabled={(!inputValue.trim() && files.length === 0) || isComposerDisabled}
              >
                <Send className="size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default memo(AgentChatBox)
