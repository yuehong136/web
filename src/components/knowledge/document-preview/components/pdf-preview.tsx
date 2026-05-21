import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FC,
} from 'react'
import { FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
} from 'react-pdf-highlighter'
import type { IHighlight } from 'react-pdf-highlighter'
import 'react-pdf-highlighter/dist/style.css'
import { pdfWorkerSrc } from '../constants'
import type { RawHighlight } from '../types'
import { buildPdfHighlights } from '../utils'
import { ErrorState, LoadingState } from './preview-state'

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string }
}) =>
  comment.text ? (
    <div className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-800 shadow-lg">
      {comment.emoji} {comment.text}
    </div>
  ) : null

type PdfDocument = Parameters<ComponentProps<typeof PdfLoader>['children']>[0]

const PdfBody: FC<{
  pdfDocument: PdfDocument
  rawHighlights?: RawHighlight[]
}> = ({ pdfDocument, rawHighlights }) => {
  const { t } = useTranslation()
  const [pageSize, setPageSize] = useState<{
    width: number
    height: number
  } | null>(null)
  const scrollToRef = useRef<(highlight: IHighlight) => void>(() => {})

  useEffect(() => {
    let cancelled = false
    setPageSize(null)
    pdfDocument
      .getPage(1)
      .then((page) => {
        if (cancelled) return
        const viewport = page.getViewport({ scale: 1 })
        setPageSize({ width: viewport.width, height: viewport.height })
      })
      .catch(() => {
        if (cancelled) return
        setPageSize({ width: 849, height: 1200 })
      })
    return () => {
      cancelled = true
    }
  }, [pdfDocument])

  const highlights = useMemo(
    () => (pageSize ? buildPdfHighlights(rawHighlights, pageSize) : []),
    [rawHighlights, pageSize],
  )

  useEffect(() => {
    if (highlights.length === 0) return undefined
    const timeoutId = setTimeout(() => {
      try {
        scrollToRef.current?.(highlights[0])
      } catch (err) {
        console.warn('[PDF] Failed to scroll to highlight:', err)
      }
    }, 100)
    return () => clearTimeout(timeoutId)
  }, [highlights])

  if (!pageSize) {
    return <LoadingState message={t('knowledge.preview.renderingPdf')} />
  }

  return (
    <PdfHighlighter
      pdfDocument={pdfDocument}
      enableAreaSelection={(event) => event.altKey}
      onScrollChange={() => {}}
      scrollRef={(scrollTo) => {
        scrollToRef.current = scrollTo
      }}
      onSelectionFinished={() => null}
      highlightTransform={(
        highlight,
        index,
        setTip,
        hideTip,
        _viewportToScaled,
        _screenshot,
        isScrolledTo,
      ) => {
        const isTextHighlight = !(highlight.content && highlight.content.image)
        const component = isTextHighlight ? (
          <Highlight
            isScrolledTo={isScrolledTo}
            position={highlight.position}
            comment={highlight.comment}
          />
        ) : (
          <AreaHighlight
            isScrolledTo={isScrolledTo}
            highlight={highlight}
            onChange={() => {}}
          />
        )
        return (
          <Popup
            popupContent={<HighlightPopup {...highlight} />}
            onMouseOver={(popupContent) =>
              setTip(highlight, () => popupContent)
            }
            onMouseOut={hideTip}
            key={index}
          >
            {component}
          </Popup>
        )
      }}
      highlights={highlights}
    />
  )
}

const PdfPreviewInner: FC<{
  objectUrl?: string
  sourceUrl: string
  highlights?: RawHighlight[]
}> = ({ objectUrl, sourceUrl, highlights: rawHighlights }) => {
  const { t } = useTranslation()
  if (!objectUrl) {
    return (
      <ErrorState
        icon={<FileText className="h-16 w-16" />}
        title={t('knowledge.preview.pdfLoadFailed')}
        message={t('knowledge.preview.unknownError')}
        url={sourceUrl}
      />
    )
  }

  return (
    <div className="pdf-highlighter-container relative h-full w-full overflow-hidden">
      <PdfLoader
        url={objectUrl}
        beforeLoad={
          <LoadingState message={t('knowledge.preview.renderingPdf')} />
        }
        workerSrc={pdfWorkerSrc}
        cMapUrl="/pdfjs-dist/cmaps/"
        cMapPacked={true}
        onError={(err) => {
          console.error('[PDF] PdfLoader error:', err)
        }}
        errorMessage={
          <ErrorState
            icon={<FileText className="h-16 w-16" />}
            title={t('knowledge.preview.pdfRenderFailed')}
            message={t('knowledge.preview.tryOpenInNewWindow')}
            url={sourceUrl}
          />
        }
      >
        {(pdfDocument) => (
          <PdfBody pdfDocument={pdfDocument} rawHighlights={rawHighlights} />
        )}
      </PdfLoader>
    </div>
  )
}

export const PdfPreview = memo(PdfPreviewInner)
