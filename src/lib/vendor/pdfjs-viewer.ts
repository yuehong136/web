// pdfjs-dist@2.x ships legacy/web/pdf_viewer as a UMD/AMD webpack bundle. esbuild's
// CJS analyzer cannot statically detect its named exports, so the pre-bundled file
// only exposes `default`. react-pdf-highlighter imports named members, which then
// throws "does not provide an export named 'EventBus'".
//
// `pdfjsViewerShimPlugin` in vite.config.ts redirects external imports of
// `pdfjs-dist/legacy/web/pdf_viewer` here, but lets this file's own import of the
// same specifier fall through to Vite's optimizeDeps pipeline — which produces an
// ESM module with a usable `default` export.
import pdfViewer from 'pdfjs-dist/legacy/web/pdf_viewer'

const viewer =
  (pdfViewer as { default?: unknown }).default ?? (pdfViewer as unknown)

type ViewerModule = {
  EventBus: unknown
  NullL10n: unknown
  PDFLinkService: unknown
  PDFViewer: unknown
  SimpleLinkService: unknown
  PDFFindController: unknown
  PDFPageView: unknown
  AutomationEventBus: unknown
}

const v = viewer as ViewerModule

export const EventBus = v.EventBus
export const NullL10n = v.NullL10n
export const PDFLinkService = v.PDFLinkService
export const PDFViewer = v.PDFViewer
export const SimpleLinkService = v.SimpleLinkService
export const PDFFindController = v.PDFFindController
export const PDFPageView = v.PDFPageView
export const AutomationEventBus = v.AutomationEventBus
