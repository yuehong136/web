import { EventSourceParserStream } from 'eventsource-parser/stream'

export const createLocalRuntimeMessageId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export async function assertRuntimeStreamResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`

    try {
      const errorBody = await response.clone().json()
      errorMessage =
        errorBody?.message ||
        errorBody?.retmsg ||
        errorMessage
    } catch {
      // ignore json parsing errors for non-json error bodies
    }

    throw new Error(errorMessage)
  }

  if (!response.body) {
    throw new Error('运行接口没有返回可读的数据流')
  }
}

export async function consumeRuntimeStream(
  response: Response,
  onEvent: (event: unknown) => void,
) {
  await assertRuntimeStreamResponse(response)

  const reader = response.body
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream())
    .getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    const rawData = value?.data
    if (!rawData) {
      continue
    }

    try {
      onEvent(JSON.parse(rawData))
    } catch {
      // ignore malformed chunks
    }
  }
}
