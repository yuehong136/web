/** SSE fixtures shared by the Home chat hook tests. */

export const deferred = <T>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((settle, fail) => {
    resolve = settle
    reject = fail
  })
  return { promise, resolve, reject }
}

// 让流管道与 promise 链都推进一轮
export const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

export const sse = (...frames: unknown[]) =>
  new Response(
    frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(''),
    { headers: { 'content-type': 'text/event-stream' } },
  )

/** An SSE response whose frames the test pushes one by one. */
export const openStream = () => {
  const encoder = new TextEncoder()
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start: (streamController) => {
      controller = streamController
    },
  })
  return {
    response: new Response(body, {
      headers: { 'content-type': 'text/event-stream' },
    }),
    // 订阅被取消后再推送会抛错，正如服务端仍在输出但本地已不再读取
    push: (frame: unknown) => {
      try {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`))
      } catch {
        // reader already cancelled
      }
    },
    close: () => {
      try {
        controller.close()
      } catch {
        // reader already cancelled
      }
    },
    // 连接中途断开：已推送的帧照常送达，之后的读取以该错误失败
    fail: (error: unknown) => {
      try {
        controller.error(error)
      } catch {
        // reader already cancelled
      }
    },
  }
}

export const delta = (text: string) => ({
  retcode: 0,
  data: { answer: text, reference: {} },
})

export const done = { retcode: 0, data: true }
