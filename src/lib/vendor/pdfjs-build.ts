// pdfjs-dist@2.x ships legacy/build/pdf as a UMD/AMD webpack bundle. esbuild's
// CJS analyzer cannot statically detect its named exports, so the pre-bundled
// file only exposes `default`. react-pdf-highlighter imports
// `{ getDocument, GlobalWorkerOptions }` directly, which then throws at runtime.
//
// `pdfjsShimPlugin` in vite.config.ts redirects external imports of
// `pdfjs-dist/legacy/build/pdf` here, but lets this file's own import of the
// same specifier fall through to Vite's optimizeDeps pipeline — which produces
// an ESM module with a usable `default` export.
import pdfModule from 'pdfjs-dist/legacy/build/pdf'

const mod =
  (pdfModule as { default?: unknown }).default ?? (pdfModule as unknown)

type PdfModule = {
  getDocument: unknown
  GlobalWorkerOptions: unknown
  PDFWorker: unknown
  version: unknown
  build: unknown
  OPS: unknown
  AnnotationMode: unknown
  AnnotationType: unknown
  AnnotationLayer: unknown
  renderTextLayer: unknown
  SVGGraphics: unknown
  PDFDateString: unknown
  PasswordResponses: unknown
  Util: unknown
  PermissionFlag: unknown
}

const p = mod as PdfModule

export const getDocument = p.getDocument
export const GlobalWorkerOptions = p.GlobalWorkerOptions
export const PDFWorker = p.PDFWorker
export const version = p.version
export const build = p.build
export const OPS = p.OPS
export const AnnotationMode = p.AnnotationMode
export const AnnotationType = p.AnnotationType
export const AnnotationLayer = p.AnnotationLayer
export const renderTextLayer = p.renderTextLayer
export const SVGGraphics = p.SVGGraphics
export const PDFDateString = p.PDFDateString
export const PasswordResponses = p.PasswordResponses
export const Util = p.Util
export const PermissionFlag = p.PermissionFlag

export default mod
