/** Deterministic browser transport, shared by API and React contract tests. */
export class UploadXHR {
  static instances: UploadXHR[] = []
  method = ''
  url = ''
  timeout = 0
  status = 200
  responseText = ''
  headers: Record<string, string> = {}
  body?: FormData
  aborted = false
  upload = { onprogress: null as ((event: ProgressEvent) => void) | null }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  ontimeout: (() => void) | null = null
  onabort: (() => void) | null = null

  constructor() {
    UploadXHR.instances.push(this)
  }
  open(method: string, url: string) {
    this.method = method
    this.url = url
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value
  }
  send(body: FormData) {
    this.body = body
  }
  abort() {
    this.aborted = true
    this.onabort?.()
  }
  respond(body: unknown, status = 200) {
    this.status = status
    this.responseText = JSON.stringify(body)
    this.onload?.()
  }
  progress(loaded: number, total: number) {
    this.upload.onprogress?.({
      loaded,
      total,
      lengthComputable: true,
    } as ProgressEvent)
  }
}

export const attachmentMetadata = (id = 'attachment-1') => ({
  id,
  name: 'sample.txt',
  extension: 'txt',
  mime_type: 'text/plain',
  size: 7,
  created_at: 1700000000,
  created_by: 'owner-1',
  preview_url: null,
})
