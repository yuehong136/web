/**
 * report 端点(`/v1/report/*`)的 SSE 瘦客户端。骨架生成 / 试运行填值的真逻辑都在后端
 * (report_skeleton + report_fill),前端只 POST 一次、流式读结构化进度 + 末尾结果对象。
 *
 * 信封沿用 `/v1/llm/*` 的 `{ retcode, retmsg, data }`:
 *   - retcode !== 0      → 抛错(retmsg)
 *   - retmsg === 'done'  → 最终结果(data 为结构化结果对象)
 *   - data === true      → 收尾标记(忽略)
 *   - 其余 data 对象     → 进度帧 → onProgress(data)
 *
 * 读循环走共享运行时 `@/lib/streaming`(ARCH-1 阶段 2)。signal 只交给 fetch、
 * 不传给 readSSEStream:两个调用方依赖中止时 AbortError 向外传播来静默退出,
 * 干净 resolve 反而会误抛「ended without a result」。
 */
import {
  assertSSEResponse,
  readSSEStream,
  type SSEEnvelope,
} from '@/lib/streaming'

const API_BASE = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000'

export interface ReportProgress {
  phase?: string
  current?: number
  total?: number
}

/**
 * 连一个 report SSE 端点:流式回调进度,返回最终结果对象(done 帧的 data)。
 * HTTP 非 2xx / 流内 error 帧 / 无结果即结束 → 抛错;取消则由调用方的 AbortSignal 触发 AbortError。
 */
export async function streamReport(
  path: '/skeleton' | '/fill',
  body: unknown,
  onProgress: (progress: ReportProgress) => void,
  signal: AbortSignal,
): Promise<Record<string, unknown>> {
  const token = localStorage.getItem('auth_token')
  const response = await fetch(`${API_BASE}/v1/report${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    signal,
  })
  await assertSSEResponse(response)

  let result: Record<string, unknown> | null = null

  await readSSEStream<SSEEnvelope>(response, {
    onEvent: (env) => {
      if (typeof env.retcode === 'number' && env.retcode !== 0) {
        throw new Error(env.retmsg || 'report stream error')
      }
      if (env.retmsg === 'done') {
        result = (env.data as Record<string, unknown>) ?? {}
        return
      }
      if (env.data === true) return // 收尾标记
      if (env.data && typeof env.data === 'object') {
        onProgress(env.data as ReportProgress)
      }
    },
  })

  if (!result) throw new Error('report stream ended without a result')
  return result
}
