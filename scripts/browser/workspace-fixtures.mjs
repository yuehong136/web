/** Controlled HTTP/SSE fixtures only; no provider calls or real credentials. */
export async function installWorkspaceFixtures(context) {
  const user = {
    id: 'browser-fixture',
    tenant_id: 'fixture',
    email: 'fixture@example.test',
    nickname: 'Fixture',
    username: 'Fixture',
    roles: [],
    permissions: [],
  }
  const app = {
    id: 'fixture-app',
    tenant_id: 'fixture',
    name: 'Research assistant',
    description: 'Fixture research',
    llm_id: 'fixture-model',
    dataset_ids: ['fixture-kb'],
    kb_names: ['Research library'],
    status: '1',
    icon: '',
    update_time: 1792800000000,
  }
  const sourceContent =
    '原文证据：保留来源，核对结论。Evidence remains available beside the answer.' +
    '\n\nEvidence detail: compare the source, preserve its context, and verify each conclusion.'.repeat(
      24,
    )
  const chunk = {
    id: 'fixture-chunk',
    chunk_id: 'fixture-chunk',
    content: sourceContent,
    content_with_weight: sourceContent,
    text: 'Evidence remains available beside the answer.',
    document_id: 'fixture-doc',
    doc_id: 'fixture-doc',
    document_name: 'Research notes.pdf',
    docnm_kwd: 'Research notes.pdf',
    dataset_id: 'fixture-kb',
    kb_id: 'fixture-kb',
    similarity: 0,
    document_metadata: { author: 'Fixture', version: 1 },
  }
  const state = {
    end: 'completed',
    completions: 0,
    artifacts: 0,
    artifactRequests: {},
    lastSubmission: null,
  }
  await context.addInitScript(
    ({ user }) => {
      // Only the application owns fixture storage; sandboxed artifact frames
      // intentionally have no origin and must not receive this bootstrap.
      if (window.top !== window) return
      localStorage.setItem('auth_token', 'controlled-browser-fixture')
      localStorage.setItem('user_info', JSON.stringify(user))
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({
          state: {
            user,
            tenant: null,
            token: 'controlled-browser-fixture',
            isAuthenticated: true,
          },
          version: 0,
        }),
      )
      if (!localStorage.getItem('i18n_language'))
        localStorage.setItem('i18n_language', 'en-US')
      if (!localStorage.getItem('appearance'))
        localStorage.setItem(
          'appearance',
          JSON.stringify({
            preset: 'studio',
            mode: 'light',
            density: 'comfortable',
            textScale: 1,
            motion: 'reduced',
          }),
        )
      const evidence = { createdUrls: [], revokedUrls: [], unsafeMessages: 0 }
      Object.defineProperty(window, '__workspaceFixtureEvidence', {
        value: evidence,
      })
      const createObjectUrl = URL.createObjectURL.bind(URL)
      const revokeObjectUrl = URL.revokeObjectURL.bind(URL)
      URL.createObjectURL = (blob) => {
        const url = createObjectUrl(blob)
        evidence.createdUrls.push(url)
        return url
      }
      URL.revokeObjectURL = (url) => {
        evidence.revokedUrls.push(url)
        return revokeObjectUrl(url)
      }
      window.addEventListener('message', (event) => {
        if (event.data === 'UNSAFE_FIXTURE') evidence.unsafeMessages++
      })
    },
    { user },
  )
  await context.route(/\/(?:api\/)?v1\//, async (route) => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    let data = []
    if (
      pathname.includes('/documents/artifact/') ||
      pathname.includes('/document/artifact/')
    ) {
      state.artifacts++
      const filename = pathname.split('/').at(-1)
      state.artifactRequests[filename] =
        (state.artifactRequests[filename] ?? 0) + 1
      const status = pathname.includes('denied')
        ? 403
        : pathname.includes('missing')
          ? 404
          : pathname.includes('failed')
            ? 500
            : 200
      const image = filename === 'chart.png'
      await route.fulfill({
        status,
        contentType:
          status !== 200
            ? 'application/json'
            : image
              ? 'image/png'
              : 'text/html',
        headers: {
          // The dev API can be on a different origin. Match the readable file
          // metadata contract rather than treating HTML as an error envelope.
          'access-control-expose-headers': 'Content-Disposition',
          ...(status === 200
            ? { 'content-disposition': `inline; filename="${filename}"` }
            : {}),
        },
        body:
          status !== 200
            ? JSON.stringify({ detail: 'PRIVATE_FIXTURE_BACKEND_ERROR' })
            : image
              ? Buffer.from(
                  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jKFAAAAAASUVORK5CYII=',
                  'base64',
                )
              : '<!doctype html><html><body><h1>Research artifact</h1>' +
                '<p>Read-only report. Check the source and preserve context.</p>'.repeat(
                  35,
                ) +
                '<script>parent.postMessage("UNSAFE_FIXTURE", "*")</script></body></html>',
      })
      return
    }
    if (
      /\/completion(?:s)?$|chat_service_sse$|enhanced_chat_sse$/.test(pathname)
    ) {
      state.completions++
      state.lastSubmission = request.postDataJSON()
      const answer = [
        'Evidence-backed answer. [ID:0]',
        '```typescript\nconst answer: number = 42\nconsole.log(answer)\n```',
        '```python\ndef summarize(value: int) -> str:\n    return f"Evidence {value}"\n```',
        '[Research report](/api/v1/documents/artifact/report.html)',
        '![Research chart](/api/v1/documents/artifact/chart.png)',
        '[Restricted report](/api/v1/documents/artifact/denied.html)',
        '[Missing report](/api/v1/documents/artifact/missing.html)',
        '[Failed report](/api/v1/documents/artifact/failed.html)',
      ].join('\n\n')
      const frames = [
        {
          retcode: 0,
          data: { answer, reference: { chunks: [chunk] }, final: true },
        },
      ]
      if (state.end === 'failed')
        frames.push({ retcode: 500, retmsg: 'fixture failure', data: false })
      if (state.end === 'completed') frames.push({ retcode: 0, data: true })
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: frames
          .map((frame) => `data: ${JSON.stringify(frame)}\n\n`)
          .join(''),
      })
      return
    }
    if (pathname.endsWith('/users/me')) data = user
    else if (pathname.endsWith('/llm/my_llms'))
      data = {
        Fixture: {
          tags: '',
          llm: [
            {
              name: 'fixture-model',
              type: 'chat',
              status: '1',
              available: true,
              used_token: 0,
            },
          ],
        },
      }
    else if (pathname.endsWith('/chats')) data = { chats: [app], total: 1 }
    else if (pathname.endsWith('/chats/fixture-app')) data = app
    else if (pathname.endsWith('/conversation/set'))
      data = { id: 'fixture-conversation', message: [] }
    else if (pathname.endsWith('/conversation/list'))
      data = [
        {
          id: 'fixture-recent',
          name: 'Continue research',
          update_time: 1792800000000,
        },
      ]
    else if (pathname.endsWith('/conversation/get'))
      data = {
        id: 'fixture-recent',
        message: [
          {
            id: 'history-answer',
            role: 'assistant',
            content: 'Historic answer without a terminal receipt.',
          },
        ],
      }
    else if (pathname.endsWith('/searches/fixture-search'))
      data = {
        id: 'fixture-search',
        tenant_id: 'fixture',
        name: 'Research desk',
        description: 'Controlled browser fixture',
        search_config: {
          kb_ids: ['fixture-kb'],
          top_k: 8,
          similarity_threshold: 0.2,
          vector_similarity_weight: 0.3,
          summary: true,
          related_search: false,
          use_rerank: false,
          use_kg: false,
        },
      }
    else if (pathname.endsWith('/datasets/search'))
      data = {
        total: 1,
        chunks: [chunk],
        doc_aggs: [
          { doc_id: 'fixture-doc', doc_name: 'Research notes.pdf', count: 1 },
        ],
        labels: {},
      }
    else if (pathname.endsWith('/datasets'))
      data = [
        {
          id: 'fixture-kb',
          name: 'Research library',
          document_count: 1,
          chunk_count: 1,
        },
      ]
    else if (pathname.endsWith('/mcp_server/list'))
      data = { mcp_servers: [], total: 0 }
    else if (pathname.endsWith('/agents')) data = { agents: [], total: 0 }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: 0, message: '', data, total: 1 }),
    })
  })
  return state
}
