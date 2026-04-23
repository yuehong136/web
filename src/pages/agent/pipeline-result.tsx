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
        description="当前链接没有携带 agent_id 或 message_id，无法读取本次运行 trace。"
        onRetry={() => navigate('/agents')}
        retryLabel="返回 Agent Center"
      />
    )
  }

  return (
    <ConsolePageTemplate
      header={
        <PageHeader
          title="Pipeline 运行结果"
          description="轻量结果页用于当前阶段测试：对齐 RAGFlow 的 View Result 跳转路径，并展示本次运行上下文与 END 输出。"
          actions={
            <>
              <Button variant="outline" onClick={() => navigate(`/agent/${agentId}`)}>
                <ArrowLeft className="mr-space-xs size-4" />
                返回 Pipeline
              </Button>
              <Button
                variant="outline"
                disabled={!outputAvailable}
                onClick={() => downloadJsonFile(output, `${agentTitle || 'pipeline-output'}.json`)}
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
        <div className="grid gap-space-lg p-space-lg lg:grid-cols-[320px_minmax(0,1fr)]">
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
              <pre className="max-h-[640px] overflow-auto rounded-radius-md bg-surface-secondary p-space-sm text-xs">
                {JSON.stringify(output, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-text-secondary">
                当前 trace 中还没有可展示的 END 输出。完整文档预览、parser/splitter 结果编辑与局部重跑仍留给 T11 知识库联动阶段。
              </p>
            )}
          </SectionCard>
        </div>
      )}
    </ConsolePageTemplate>
  )
}
