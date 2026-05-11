import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  SectionCard,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useFetchMessageTrace } from '@/hooks/use-agent-request'
import {
  downloadJsonFile,
  findPipelineEndOutput,
  isPipelineEndOutputEmpty,
} from './features/pipeline-workbench/utils'
import { ArrowLeft, Download } from 'lucide-react'

export default function PipelineResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const messageId = searchParams.get('id') || ''
  const agentId = searchParams.get('agent_id') || ''
  const documentId = searchParams.get('doc_id') || ''
  const agentTitle = searchParams.get('agent_title') || 'Pipeline'
  const documentExtension = searchParams.get('extension') || ''
  const createdBy = searchParams.get('created_by') || ''

  const traceQuery = useFetchMessageTrace(agentId, messageId)
  const output = useMemo(
    () => findPipelineEndOutput(traceQuery.data),
    [traceQuery.data],
  )
  const outputAvailable = useMemo(
    () => !isPipelineEndOutputEmpty(traceQuery.data),
    [traceQuery.data],
  )

  const metadata = [
    ['Agent', agentTitle],
    ['Agent ID', agentId],
    ['Message ID', messageId],
    ['Document ID', documentId],
    ['Extension', documentExtension],
    ['Created By', createdBy],
  ].filter(([, value]) => Boolean(value))

  if (!agentId || !messageId) {
    return (
      <PageErrorState
        scene={AppScene.CONSOLE}
        title="缺少 Pipeline 结果上下文"
        description="当前链接缺少运行结果所需的信息，无法读取本次 Pipeline 输出。"
        onRetry={() => navigate('/agents')}
        retryLabel="返回智能体列表"
      />
    )
  }

  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title="Pipeline 运行结果"
          description="查看本次 Pipeline 运行上下文、END 节点输出，并按需下载结果 JSON。"
          actions={
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/agent/${agentId}`)}
              >
                <ArrowLeft className="mr-space-xs size-4" />
                返回 Pipeline
              </Button>
              <Button
                variant="outline"
                disabled={!outputAvailable}
                onClick={() =>
                  downloadJsonFile(
                    output,
                    `${agentTitle || 'pipeline-output'}.json`,
                  )
                }
              >
                <Download className="mr-space-xs size-4" />
                下载 JSON
              </Button>
            </>
          }
        />
      }
    >
      {traceQuery.isLoading ? (
        <PageLoadingState
          scene={AppScene.CONSOLE}
          compact
          title="正在读取 Pipeline trace"
          description="根据 agent_id 与 message_id 获取本次运行结果。"
        />
      ) : (
        <div className="gap-space-lg p-space-lg grid lg:grid-cols-[320px_minmax(0,1fr)]">
          <SectionCard title="运行上下文" padding="default">
            <dl className="space-y-space-sm text-sm">
              {metadata.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-radius-md bg-surface-secondary p-space-sm"
                >
                  <dt className="text-xs text-text-tertiary">{label}</dt>
                  <dd className="mt-space-xs break-all font-medium text-text-primary">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          <SectionCard title="END 节点输出" padding="default">
            {outputAvailable ? (
              <pre className="rounded-radius-md bg-surface-secondary p-space-sm max-h-[640px] overflow-auto text-xs">
                {JSON.stringify(output, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-text-secondary">
                当前运行还没有可展示的 END 节点输出。请返回 Pipeline
                检查运行日志，或重新运行后再查看结果。
              </p>
            )}
          </SectionCard>
        </div>
      )}
    </ConsolePageTemplate>
  )
}
