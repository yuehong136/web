import DOMPurify from 'dompurify'

const DOCX_OPTIONS = {
  breakPages: true,
  ignoreLastRenderedPageBreak: false,
  ignoreWidth: false,
  ignoreHeight: false,
  renderAltChunks: false,
  renderComments: false,
  useBase64URL: true,
  experimental: false,
} as const

/** Render offscreen; only sanitized output enters the script-free sandbox. */
export const renderDocxDocument = async (arrayBuffer: ArrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer)
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b)
    throw new Error('Unsupported Word format')
  const inert = document.implementation.createHTMLDocument()
  const { renderAsync } = await import('docx-preview')
  await renderAsync(arrayBuffer, inert.body, inert.head, DOCX_OPTIONS)
  const sanitizedStyles = DOMPurify.sanitize(inert.head.innerHTML, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'link', 'meta'],
  })
  const styles = new DOMParser().parseFromString(sanitizedStyles, 'text/html')
    .head.innerHTML
  const body = DOMPurify.sanitize(inert.body.innerHTML, {
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
    FORBID_ATTR: ['href', 'xlink:href', 'target'],
  })
  // CSP blocks external images/fonts, CSS URLs and connections. The sandbox
  // disables scripts, forms and parent navigation; links are display-only.
  return `<!doctype html><html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
${styles}
<style>
body { margin: 0; zoom: var(--preview-zoom, 1); }
.docx-wrapper { background: transparent; padding: 16px; width: max-content; min-width: 100%; box-sizing: border-box; }
.docx-wrapper > section { margin-inline: auto; overflow: visible; }
.docx-wrapper p { line-height: normal; }
a { pointer-events: none; }
</style></head><body>${body}</body></html>`
}

export const DOCX_ZOOM_STEPS = [5, 10, 25, 50, 75, 100, 125, 150, 175, 200]

export const stepDocxZoom = (zoom: number, direction: 1 | -1) =>
  direction === 1
    ? (DOCX_ZOOM_STEPS.find((step) => step > zoom) ?? 200)
    : ([...DOCX_ZOOM_STEPS].reverse().find((step) => step < zoom) ?? 5)
