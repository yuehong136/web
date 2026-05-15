import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
  useCallback,
} from 'react'
import {
  FileText,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  FileCode,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Presentation,
} from 'lucide-react'
import { Button, Tooltip } from '@/components/ui'
import { cn } from '@/lib/utils'
import { API_BASE_URL, API_VERSION, STORAGE_KEYS } from '@/constants'
import {
  AreaHighlight,
  Highlight,
  PdfHighlighter,
  PdfLoader,
  Popup,
} from 'react-pdf-highlighter'
import type { IHighlight } from 'react-pdf-highlighter'
// v8 ships CSS as a separate file; the JS entry no longer side-effect imports
// it. Without this, the internal PDFViewer container isn't absolutely
// positioned and pdfjs-dist 4.x throws "container must be absolutely
// positioned" at runtime.
import 'react-pdf-highlighter/dist/style.css'
import { v4 as uuid } from 'uuid'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mammoth from 'mammoth'
import Papa from 'papaparse'

// Vite hashes the worker URL at build time and serves it from the dev server in
// dev, so we never ship the worker by hand. pdfjs-dist 4.x exposes the ESM
// worker as `pdf.worker.min.mjs`.
const pdfWorkerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// 文件类型枚举
type FileType =
  | 'pdf'
  | 'image'
  | 'video'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'txt'
  | 'md'
  | 'csv'
  | 'unknown'

// 原始高亮数据格式
interface RawHighlight {
  page: number
  x1: number
  x2: number
  y1: number
  y2: number
}

interface DocumentPreviewProps {
  /** 文档 ID */
  docId: string
  /** 文档名称 */
  docName?: string
  /** 文档类型 */
  docType?: string
  /** 高亮区域 (用于 PDF 高亮) */
  highlights?: RawHighlight[]
  /** 选中的切片 ID (用于高亮联动) */
  selectedChunkId?: string
  /** 自定义类名 */
  className?: string
  /** 是否可折叠 */
  collapsible?: boolean
  /** 初始是否折叠 */
  defaultCollapsed?: boolean
  /** 折叠状态变化回调 */
  onCollapsedChange?: (collapsed: boolean) => void
  /** 关闭预览（通常用于关闭外层预览面板） */
  onClose?: () => void
  /** 隐藏组件自带的标题栏（由外层页面自行提供 header 时使用） */
  hideHeader?: boolean
  /** 是否允许下载（false 时下载按钮灰态） */
  canDownload?: boolean
}

// 支持的图片格式
const IMAGE_EXTENSIONS = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'bmp',
  'svg',
  'ico',
  'tif',
  'tiff',
]
// 支持的视频格式
const VIDEO_EXTENSIONS = [
  'mp4',
  'avi',
  'mov',
  'mkv',
  'wmv',
  'flv',
  'mpeg',
  'mpg',
  'webm',
]

// 获取文件类型
const getFileType = (filename?: string, docType?: string): FileType => {
  const ext =
    filename?.split('.').pop()?.toLowerCase() || docType?.toLowerCase()

  if (!ext) return 'unknown'

  if (ext === 'pdf') return 'pdf'
  if (IMAGE_EXTENSIONS.includes(ext)) return 'image'
  if (VIDEO_EXTENSIONS.includes(ext)) return 'video'
  if (['doc', 'docx'].includes(ext)) return 'docx'
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx'
  if (['ppt', 'pptx'].includes(ext)) return 'pptx'
  if (['txt', 'text', 'log'].includes(ext)) return 'txt'
  if (ext === 'md' || ext === 'mdx' || ext === 'markdown') return 'md'
  if (ext === 'csv') return 'csv'

  return 'unknown'
}

// 获取文档 URL
const getDocumentUrl = (docId: string): string => {
  return `${API_BASE_URL}/${API_VERSION}/document/get/${docId}`
}

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  } catch {
    return null
  }
}

const buildAuthHeader = (): string | null => {
  const token = getAuthToken()
  if (!token) return null
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`
}

// 通用的 fetch 函数（带认证）
const fetchWithAuth = async (url: string): Promise<Response> => {
  const auth = buildAuthHeader()
  const headers: HeadersInit = {}
  if (auth) headers.Authorization = auth
  return fetch(url, { headers })
}

// 构建 PDF 高亮数据（参考 ragflow buildChunkHighlights）
const buildPdfHighlights = (
  rawHighlights: RawHighlight[] | undefined,
  pageSize: { width: number; height: number },
): IHighlight[] => {
  if (
    !rawHighlights ||
    !Array.isArray(rawHighlights) ||
    rawHighlights.length === 0
  ) {
    return []
  }

  return rawHighlights.map((h) => {
    const boundingRect = {
      width: pageSize.width,
      height: pageSize.height,
      x1: h.x1,
      x2: h.x2,
      y1: h.y1,
      y2: h.y2,
    }
    return {
      id: uuid(),
      comment: {
        text: '',
        emoji: '',
      },
      content: {
        text: '',
      },
      position: {
        boundingRect: boundingRect,
        rects: [boundingRect],
        pageNumber: h.page,
      },
    }
  })
}

// 高亮弹出提示组件
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

// 通用加载状态组件
const LoadingState: React.FC<{ message?: string }> = ({
  message = '加载中...',
}) => (
  <div className="flex h-full w-full items-center justify-center bg-background-subtle">
    <div className="flex flex-col items-center gap-3">
      <div
        className="h-10 w-10 animate-spin rounded-full border-b-2"
        style={{ borderColor: 'var(--color-text-accent)' }}
      />
      <span className="text-sm text-text-secondary">{message}</span>
    </div>
  </div>
)

// 通用错误状态组件
const ErrorState: React.FC<{
  icon?: React.ReactNode
  title?: string
  message?: string
  url?: string
  filename?: string
}> = ({
  icon = <FileText className="h-16 w-16" />,
  title = '加载失败',
  message = '未知错误',
  url,
  filename,
}) => (
  <div className="flex h-full w-full flex-col items-center justify-center bg-background-subtle p-8">
    <div className="mb-4 text-text-muted">{icon}</div>
    <p className="mb-2 text-base font-medium text-text-primary">{title}</p>
    <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
      {message}
    </p>
    {url && (
      <div className="flex gap-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-background-surface px-4 py-2 text-text-accent transition-colors hover:bg-state-hover"
        >
          <ExternalLink className="h-4 w-4" />
          在新窗口打开
        </a>
        {filename && (
          <a
            href={url}
            download={filename}
            className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-background-surface px-4 py-2 text-text-primary transition-colors hover:bg-state-hover"
          >
            <Download className="h-4 w-4" />
            下载
          </a>
        )}
      </div>
    )}
  </div>
)

// ==================== PDF 预览组件 ====================

// PdfBody renders the highlighter for a loaded pdfDocument.
//
// Critical: PdfHighlighter@8 runs its viewer setup in an async `init()` that
// dereferences `this.viewer` inside `componentDidUpdate`'s `renderHighlightLayers`
// path. If the `highlights` prop reference changes between mount and the moment
// `init()`'s `await import(...)` resolves, React fires componentDidUpdate while
// `this.viewer` is still undefined and the lib throws
// `Cannot read properties of undefined (reading 'getPageView')`.
//
// To avoid that race we wait until `pageSize` is measured before mounting
// PdfHighlighter at all. That way the first highlights prop is also the final
// one, no componentDidUpdate runs from a highlights-identity change, and we
// dodge the lib's missing null check.
type PdfDocument = Parameters<
  React.ComponentProps<typeof PdfLoader>['children']
>[0]

const PdfBody: React.FC<{
  pdfDocument: PdfDocument
  rawHighlights?: RawHighlight[]
}> = ({ pdfDocument, rawHighlights }) => {
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
        // Fallback to a sensible default so the viewer can still mount.
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
    return <LoadingState message="渲染 PDF 中..." />
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

const PdfPreviewInner: React.FC<{
  url: string
  highlights?: RawHighlight[]
}> = ({ url, highlights: rawHighlights }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadPdf = async () => {
      try {
        setLoading(true)
        setError(null)

        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
          blobUrlRef.current = null
          setBlobUrl(null)
        }

        const response = await fetchWithAuth(url)

        if (!response.ok) {
          throw new Error(`PDF 加载失败: ${response.status}`)
        }

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          const errorData = await response.json().catch(() => null)
          throw new Error(
            errorData?.message || errorData?.retmsg || 'PDF 加载失败',
          )
        }

        if (contentType.includes('text/html')) {
          throw new Error('认证失败，请重新登录')
        }

        const blob = await response.blob()

        if (blob.size === 0) {
          throw new Error('PDF 文件为空')
        }

        const newBlobUrl = URL.createObjectURL(blob)
        blobUrlRef.current = newBlobUrl

        if (mounted) {
          setBlobUrl(newBlobUrl)
          setLoading(false)
        }
      } catch (err) {
        console.error('[PDF] Load error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'PDF 加载失败')
          setLoading(false)
        }
      }
    }

    loadPdf()

    return () => {
      mounted = false
    }
  }, [url])

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = null
      }
    }
  }, [])

  if (loading) {
    return <LoadingState message="加载 PDF 中..." />
  }

  if (error || !blobUrl) {
    return (
      <ErrorState
        icon={<FileText className="h-16 w-16" />}
        title="PDF 加载失败"
        message={error || '未知错误'}
        url={url}
      />
    )
  }

  return (
    <div className="pdf-highlighter-container relative h-full w-full overflow-hidden">
      <PdfLoader
        url={blobUrl}
        beforeLoad={<LoadingState message="渲染 PDF 中..." />}
        workerSrc={pdfWorkerSrc}
        cMapUrl="/pdfjs-dist/cmaps/"
        cMapPacked={true}
        onError={(err) => {
          console.error('[PDF] PdfLoader error:', err)
        }}
        errorMessage={
          <ErrorState
            icon={<FileText className="h-16 w-16" />}
            title="PDF 渲染失败"
            message="请尝试在新窗口中打开"
            url={url}
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

const PdfPreview = memo(PdfPreviewInner)

// ==================== 图片预览组件 ====================
const ImagePreviewInner: React.FC<{
  url: string
  alt?: string
}> = ({ url, alt }) => {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 5))
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.1))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)
  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    const loadImage = async () => {
      try {
        setLoading(true)
        setError(false)

        const response = await fetchWithAuth(url)
        if (!response.ok) {
          throw new Error(`图片加载失败: ${response.status}`)
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)

        if (mounted) {
          setBlobUrl(objectUrl)
          setLoading(false)
        }
      } catch (err) {
        console.error('Image load error:', err)
        if (mounted) {
          setError(true)
          setLoading(false)
        }
      }
    }

    loadImage()

    return () => {
      mounted = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [url])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      setPosition({
        x: dragStartRef.current.posX + dx,
        y: dragStartRef.current.posY + dy,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (loading) {
    return <LoadingState message="加载图片中..." />
  }

  if (error) {
    return (
      <ErrorState
        icon={<ImageIcon className="h-16 w-16" />}
        title="图片加载失败"
        url={url}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-background-subtle">
      {/* 工具栏 */}
      <div className="flex items-center justify-center gap-1 border-b border-border-default bg-background-surface px-4 py-2">
        <Tooltip content="缩小 (-)">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={scale <= 0.1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </Tooltip>
        <span className="min-w-[50px] text-center font-mono text-xs text-text-secondary">
          {Math.round(scale * 100)}%
        </span>
        <Tooltip content="放大 (+)">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={scale >= 5}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </Tooltip>
        <div className="mx-2 h-4 w-px bg-border-default" />
        <Tooltip content="旋转 90°">
          <Button variant="ghost" size="sm" onClick={handleRotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Tooltip content="重置">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </Tooltip>
      </div>

      {/* 图片容器 */}
      <div
        className={cn(
          'flex flex-1 items-center justify-center overflow-hidden p-4',
          scale > 1 && 'cursor-grab',
          isDragging && 'cursor-grabbing',
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {blobUrl && (
          <img
            src={blobUrl}
            alt={alt || '图片预览'}
            className="max-h-full max-w-full select-none object-contain transition-transform duration-200"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x / scale}px, ${position.y / scale}px)`,
            }}
            draggable={false}
          />
        )}
      </div>
    </div>
  )
}

const ImagePreview = memo(ImagePreviewInner)

// ==================== 视频预览组件 ====================
const VideoPreviewInner: React.FC<{
  url: string
}> = ({ url }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    let mounted = true
    let objectUrl: string | null = null

    const loadVideo = async () => {
      try {
        setLoading(true)
        setError(false)

        const response = await fetchWithAuth(url)
        if (!response.ok) {
          throw new Error(`视频加载失败: ${response.status}`)
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)

        if (mounted) {
          setBlobUrl(objectUrl)
          setLoading(false)
        }
      } catch (err) {
        console.error('Video load error:', err)
        if (mounted) {
          setError(true)
          setLoading(false)
        }
      }
    }

    loadVideo()

    return () => {
      mounted = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [url])

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress(
        (videoRef.current.currentTime / videoRef.current.duration) * 100,
      )
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time =
        (parseFloat(e.target.value) / 100) * videoRef.current.duration
      videoRef.current.currentTime = time
      setProgress(parseFloat(e.target.value))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return <LoadingState message="加载视频中..." />
  }

  if (error) {
    return (
      <ErrorState
        icon={<Video className="h-16 w-16" />}
        title="视频加载失败"
        url={url}
      />
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-black">
      {blobUrl && (
        <>
          <div className="flex flex-1 items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              src={blobUrl}
              className="max-h-full max-w-full object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />
          </div>
          {/* 视频控制栏 */}
          <div className="bg-background-overlay px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlay}
                className="hover:bg-background-surface/20 text-white"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <span className="min-w-[40px] text-xs text-white/80">
                {formatTime((progress / 100) * duration)}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="bg-background-surface/30 h-1 flex-1 cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background-surface"
              />
              <span className="min-w-[40px] text-xs text-white/80">
                {formatTime(duration)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="hover:bg-background-surface/20 text-white"
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const VideoPreview = memo(VideoPreviewInner)

// ==================== 文本预览组件 ====================
const TxtPreviewInner: React.FC<{
  url: string
}> = ({ url }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    let mounted = true

    const loadTxt = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithAuth(url)
        if (!response.ok) {
          throw new Error(`文件加载失败: ${response.status}`)
        }

        const text = await response.text()

        if (mounted) {
          setContent(text)
          setLoading(false)
        }
      } catch (err) {
        console.error('Txt load error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : '加载失败')
          setLoading(false)
        }
      }
    }

    loadTxt()

    return () => {
      mounted = false
    }
  }, [url])

  if (loading) {
    return <LoadingState message="加载文件中..." />
  }

  if (error) {
    return (
      <ErrorState
        icon={<FileCode className="h-16 w-16" />}
        title="文件加载失败"
        message={error}
        url={url}
      />
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-surface p-4">
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-text-secondary">
        {content}
      </pre>
    </div>
  )
}

const TxtPreview = memo(TxtPreviewInner)

// ==================== Markdown 预览组件 ====================
const MdPreviewInner: React.FC<{
  url: string
}> = ({ url }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')

  useEffect(() => {
    let mounted = true

    const loadMd = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithAuth(url)
        if (!response.ok) {
          throw new Error(`文件加载失败: ${response.status}`)
        }

        const text = await response.text()

        if (mounted) {
          setContent(text)
          setLoading(false)
        }
      } catch (err) {
        console.error('Markdown load error:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : '加载失败')
          setLoading(false)
        }
      }
    }

    loadMd()

    return () => {
      mounted = false
    }
  }, [url])

  if (loading) {
    return <LoadingState message="加载文档中..." />
  }

  if (error) {
    return (
      <ErrorState
        icon={<FileCode className="h-16 w-16" />}
        title="文档加载失败"
        message={error}
        url={url}
      />
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-surface p-6">
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  )
}

const MdPreview = memo(MdPreviewInner)

// ==================== Word 文档预览组件 (使用 mammoth，与 ragflow 一致) ====================
const DocxPreviewInner: React.FC<{
  url: string
}> = ({ url }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [htmlContent, setHtmlContent] = useState<string>('')

  // 检测是否是 ZIP 格式（docx 是 ZIP 格式）
  const isZipLikeBlob = async (blob: Blob): Promise<boolean> => {
    try {
      const headerSlice = blob.slice(0, 4)
      const buf = await headerSlice.arrayBuffer()
      const bytes = new Uint8Array(buf)
      // ZIP files start with "PK" (0x50, 0x4B)
      return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b
    } catch (e) {
      console.error('Failed to inspect blob header', e)
      return false
    }
  }

  useEffect(() => {
    let mounted = true

    const loadDocx = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithAuth(url)
        if (!response.ok) {
          throw new Error(`文档加载失败: ${response.status}`)
        }

        const blob = await response.blob()

        // 检查是否是 docx 格式
        const looksLikeZip = await isZipLikeBlob(blob)

        if (!looksLikeZip) {
          // 不是 docx 格式（可能是旧版 .doc）
          if (mounted) {
            setHtmlContent(`
              <div class="flex h-full items-center justify-center">
                <div class="border border-dashed border-border-default rounded-xl p-8 max-w-2xl text-center">
                  <p class="text-xl font-bold mb-4 text-text-primary">
                    该 Word 文档暂不支持预览
                  </p>
                  <p class="text-sm text-text-secondary leading-relaxed">
                    Mammoth 仅支持现代 <code class="bg-background-subtle px-1 rounded">.docx</code> 文件。<br/>
                    该文件可能是旧版 <code class="bg-background-subtle px-1 rounded">.doc</code> 格式。
                  </p>
                </div>
              </div>
            `)
            setLoading(false)
          }
          return
        }

        // 使用 mammoth 解析 docx
        const arrayBuffer = await blob.arrayBuffer()
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          { includeDefaultStyleMap: true },
        )

        // 添加样式
        const styledContent = result.value
          .replace(
            /<p>/g,
            '<p class="mb-3 text-text-secondary leading-relaxed">',
          )
          .replace(
            /<h1>/g,
            '<h1 class="text-2xl font-bold mt-6 mb-3 text-text-primary">',
          )
          .replace(
            /<h2>/g,
            '<h2 class="text-xl font-semibold mt-5 mb-2 text-text-primary">',
          )
          .replace(
            /<h3>/g,
            '<h3 class="text-lg font-semibold mt-4 mb-2 text-text-primary">',
          )
          .replace(
            /<h4>/g,
            '<h4 class="text-base font-semibold mt-4 mb-2 text-text-primary">',
          )
          .replace(
            /<h5>/g,
            '<h5 class="text-sm font-semibold mt-3 mb-2 text-text-primary">',
          )
          .replace(
            /<h6>/g,
            '<h6 class="text-sm font-medium mt-3 mb-2 text-text-primary">',
          )
          .replace(
            /<table>/g,
            '<table class="min-w-full border-collapse border border-border-default my-4">',
          )
          .replace(
            /<th>/g,
            '<th class="border border-border-default px-4 py-2 bg-background-surface text-left font-medium">',
          )
          .replace(
            /<td>/g,
            '<td class="border border-border-default px-4 py-2">',
          )
          .replace(/<ul>/g, '<ul class="list-disc pl-6 mb-3">')
          .replace(/<ol>/g, '<ol class="list-decimal pl-6 mb-3">')
          .replace(/<li>/g, '<li class="mb-1">')
          .replace(/<a /g, '<a class="text-text-accent hover:underline" ')
          .replace(
            /<strong>/g,
            '<strong class="font-semibold text-text-primary">',
          )
          .replace(/<em>/g, '<em class="italic">')

        if (mounted) {
          setHtmlContent(styledContent)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Docx preview error:', err)
          setError(err instanceof Error ? err.message : '文档预览失败')
          setLoading(false)
        }
      }
    }

    loadDocx()

    return () => {
      mounted = false
    }
  }, [url])

  if (loading) {
    return <LoadingState message="加载文档中..." />
  }

  if (error) {
    return (
      <ErrorState
        icon={<FileText className="h-16 w-16" />}
        title="文档预览失败"
        message={error}
        url={url}
      />
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-surface p-6">
      <div
        className="mx-auto max-w-4xl"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  )
}

const DocxPreview = memo(DocxPreviewInner)

// ==================== Excel 预览组件 ====================
const ExcelPreviewInner: React.FC<{
  url: string
}> = ({ url }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previewerRef = useRef<ReturnType<
    typeof import('@js-preview/excel').default.init
  > | null>(null)

  useEffect(() => {
    let mounted = true

    const loadExcel = async () => {
      if (!containerRef.current) return

      try {
        setLoading(true)
        setError(null)

        // 动态导入 @js-preview/excel 及其样式
        const jsPreviewExcel = await import('@js-preview/excel')
        await import('@js-preview/excel/lib/index.css')

        const response = await fetchWithAuth(url)
        if (!response.ok) {
          throw new Error(`Excel 加载失败: ${response.status}`)
        }

        const arrayBuffer = await response.arrayBuffer()

        if (!mounted || !containerRef.current) return

        // 清理之前的实例
        if (previewerRef.current) {
          previewerRef.current.destroy()
        }

        const excelPreviewer = jsPreviewExcel.default.init(containerRef.current)
        previewerRef.current = excelPreviewer

        await excelPreviewer.preview(arrayBuffer)

        if (mounted) {
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Excel preview error:', err)
          setError(err instanceof Error ? err.message : 'Excel 预览失败')
          setLoading(false)
        }
      }
    }

    loadExcel()

    return () => {
      mounted = false
      // 清理实例
      if (previewerRef.current) {
        previewerRef.current.destroy()
        previewerRef.current = null
      }
    }
  }, [url])

  if (error) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title="Excel 预览失败"
        message={error}
        url={url}
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-background-surface">
      {loading && (
        <div className="absolute inset-0 z-10">
          <LoadingState message="加载 Excel 中..." />
        </div>
      )}
      <div
        ref={containerRef}
        className="excel-csv-previewer h-full w-full rounded-md border border-border-default p-4"
      />
    </div>
  )
}

const ExcelPreview = memo(ExcelPreviewInner)

// ==================== PPT 预览组件 ====================
const PptPreviewInner: React.FC<{ url: string }> = ({ url }) => {
  const measureRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slideCount, setSlideCount] = useState(0)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    let mounted = true

    const loadPpt = async () => {
      if (!measureRef.current || !wrapperRef.current) return

      try {
        setLoading(true)
        setError(null)
        setSlideCount(0)
        wrapperRef.current.innerHTML = ''

        const pptxPreview = await import('pptx-preview')

        const response = await fetchWithAuth(url)
        if (!response.ok) throw new Error(`PPT 加载失败: ${response.status}`)

        const arrayBuffer = await response.arrayBuffer()
        if (!mounted || !measureRef.current || !wrapperRef.current) return

        // 以测量容器的宽度定幻灯片尺寸，保持 16:9
        const slideWidth = Math.max(measureRef.current.clientWidth - 64, 480)
        const slideHeight = Math.round((slideWidth * 9) / 16)

        const pptPreviewer = pptxPreview.init(wrapperRef.current, {
          width: slideWidth,
          height: slideHeight,
        })
        await pptPreviewer.preview(arrayBuffer)

        if (mounted) {
          // 统计渲染出的幻灯片数量
          const slides = wrapperRef.current?.querySelectorAll(
            '.slide-wrapper, [class*="slide"]',
          )
          setSlideCount(slides?.length ?? 0)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('PPT preview error:', err)
          setError(err instanceof Error ? err.message : 'PPT 预览失败')
          setLoading(false)
        }
      }
    }

    loadPpt()
    return () => {
      mounted = false
    }
  }, [url])

  if (error) {
    return (
      <ErrorState
        icon={<Presentation className="h-16 w-16" />}
        title="PPT 预览失败"
        message={error}
        url={url}
      />
    )
  }

  return (
    <div className="ppt-previewer flex h-full w-full flex-col" ref={measureRef}>
      {/* 工具栏 */}
      <div className="px-space-md py-space-sm bg-surface-primary flex shrink-0 items-center justify-between border-b border-border-default">
        <div className="gap-space-xs flex items-center text-text-secondary">
          <Presentation className="h-4 w-4 shrink-0" />
          {!loading && slideCount > 0 && (
            <span className="text-sm">{slideCount} 张幻灯片</span>
          )}
          {loading && <span className="text-sm">加载中...</span>}
        </div>
        <div className="gap-space-xs flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
            disabled={zoom <= 50 || loading}
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="min-w-[3rem] text-center text-sm tabular-nums text-text-secondary">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
            disabled={zoom >= 200 || loading}
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(100)}
            disabled={zoom === 100 || loading}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 幻灯片区域 */}
      <div className="ppt-scroll-area flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <LoadingState message="加载 PPT 中..." />
          </div>
        ) : (
          <div
            className="py-space-lg"
            style={{
              zoom: `${zoom}%`,
              // zoom 缩小时保持容器可正确滚动
              minWidth: zoom < 100 ? `${10000 / zoom}%` : undefined,
            }}
          >
            <div ref={wrapperRef} />
          </div>
        )}
      </div>
    </div>
  )
}

const PptPreview = memo(PptPreviewInner)

// ==================== CSV 预览组件 ====================
interface CSVData {
  rows: string[][]
  headers: string[]
}

const CsvPreviewInner: React.FC<{
  url: string
}> = ({ url }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CSVData | null>(null)

  const parseCSV = useCallback((csvText: string): CSVData => {
    const result = Papa.parse<string[]>(csvText, {
      header: false,
      skipEmptyLines: false,
    })

    const rows = result.data as string[][]
    const headers = rows[0] || []
    const dataRows = rows.slice(1)

    return { headers, rows: dataRows }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadCsv = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetchWithAuth(url)
        if (!response.ok) {
          throw new Error(`CSV 加载失败: ${response.status}`)
        }

        const text = await response.text()
        const parsedData = parseCSV(text)

        if (mounted) {
          setData(parsedData)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('CSV load error:', err)
          setError(err instanceof Error ? err.message : 'CSV 加载失败')
          setLoading(false)
        }
      }
    }

    loadCsv()

    return () => {
      mounted = false
      setData(null)
    }
  }, [url, parseCSV])

  if (loading) {
    return <LoadingState message="加载 CSV 中..." />
  }

  if (error) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title="CSV 加载失败"
        message={error}
        url={url}
      />
    )
  }

  if (!data) {
    return (
      <ErrorState
        icon={<FileSpreadsheet className="h-16 w-16" />}
        title="CSV 数据为空"
        url={url}
      />
    )
  }

  return (
    <div className="h-full w-full overflow-auto bg-background-surface p-4">
      <table className="min-w-full divide-y divide-border-default overflow-hidden rounded-lg border border-border-default">
        <thead className="bg-background-surface">
          <tr>
            {data.headers.map((header, index) => (
              <th
                key={`header-${index}`}
                className="border-b border-border-default px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-primary"
              >
                {header || `列 ${index + 1}`}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-default">
          {data.rows.map((row, rowIndex) => (
            <tr
              key={`row-${rowIndex}`}
              className="transition-colors hover:bg-state-hover"
            >
              {row.map((cell, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className="whitespace-nowrap px-4 py-3 text-sm text-text-secondary"
                >
                  {cell || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const CsvPreview = memo(CsvPreviewInner)

// ==================== 不支持预览的文件类型 ====================
const UnsupportedPreview: React.FC<{
  url: string
  filename?: string
  fileType: FileType
  canDownload?: boolean
}> = ({ url, filename, fileType, canDownload = false }) => {
  const typeLabels: Record<FileType, { label: string; icon: React.ReactNode }> =
    {
      pdf: { label: 'PDF 文档', icon: <FileText className="h-16 w-16" /> },
      image: { label: '图片', icon: <ImageIcon className="h-16 w-16" /> },
      video: { label: '视频', icon: <Video className="h-16 w-16" /> },
      docx: { label: 'Word 文档', icon: <FileText className="h-16 w-16" /> },
      xlsx: {
        label: 'Excel 表格',
        icon: <FileSpreadsheet className="h-16 w-16" />,
      },
      pptx: {
        label: 'PowerPoint',
        icon: <Presentation className="h-16 w-16" />,
      },
      txt: { label: '文本文件', icon: <FileCode className="h-16 w-16" /> },
      md: { label: 'Markdown', icon: <FileCode className="h-16 w-16" /> },
      csv: {
        label: 'CSV 表格',
        icon: <FileSpreadsheet className="h-16 w-16" />,
      },
      unknown: { label: '文件', icon: <FileText className="h-16 w-16" /> },
    }

  const { label, icon } = typeLabels[fileType] || typeLabels.unknown

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background-subtle p-8">
      <div className="mb-6 text-text-muted">{icon}</div>
      <h3 className="mb-2 text-lg font-medium text-text-primary">{label}</h3>
      <p className="mb-8 max-w-sm text-center text-sm text-text-secondary">
        {canDownload
          ? '该类型文件暂不支持在线预览，请下载后查看'
          : '该类型文件暂不支持在线预览'}
      </p>
      <div className="flex gap-3">
        <Button variant="outline" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            新窗口打开
          </a>
        </Button>
        <Tooltip content={canDownload ? undefined : '请联系管理员获取下载权限'}>
          <Button disabled={!canDownload} asChild={canDownload}>
            {canDownload ? (
              <a href={url} download={filename}>
                <Download className="mr-2 h-4 w-4" />
                下载文件
              </a>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                下载文件
              </>
            )}
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}

// ==================== 主组件 ====================
export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  docId,
  docName,
  docType,
  highlights,
  className,
  onClose,
  hideHeader = false,
  canDownload = false,
}) => {
  const fileType = useMemo(
    () => getFileType(docName, docType),
    [docName, docType],
  )
  const documentUrl = useMemo(() => getDocumentUrl(docId), [docId])

  const renderPreview = () => {
    switch (fileType) {
      case 'pdf':
        return <PdfPreview url={documentUrl} highlights={highlights} />
      case 'image':
        return <ImagePreview url={documentUrl} alt={docName} />
      case 'video':
        return <VideoPreview url={documentUrl} />
      case 'docx':
        return <DocxPreview url={documentUrl} />
      case 'xlsx':
        return <ExcelPreview url={documentUrl} />
      case 'pptx':
        return <PptPreview url={documentUrl} />
      case 'txt':
        return <TxtPreview url={documentUrl} />
      case 'md':
        return <MdPreview url={documentUrl} />
      case 'csv':
        return <CsvPreview url={documentUrl} />
      default:
        return (
          <UnsupportedPreview
            url={documentUrl}
            filename={docName}
            fileType={fileType}
            canDownload={canDownload}
          />
        )
    }
  }

  return (
    <div
      className={cn('flex h-full flex-col bg-background-default', className)}
    >
      {!hideHeader && (
        <div className="flex items-center justify-between border-b border-border-default bg-background-surface px-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <FileText className="h-4 w-4 flex-shrink-0 text-text-secondary" />
            <Tooltip content={docName || '文档预览'}>
              <span className="truncate text-sm font-medium text-text-primary">
                {docName || '文档预览'}
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-0.5">
            <Tooltip
              content={canDownload ? '下载' : '请联系管理员获取下载权限'}
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={!canDownload}
                asChild={canDownload}
              >
                {canDownload ? (
                  <a href={documentUrl} download={docName}>
                    <Download className="h-4 w-4" />
                  </a>
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </Tooltip>
            <Tooltip content="新窗口打开">
              <Button variant="ghost" size="sm" asChild>
                <a href={documentUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </Tooltip>
            {onClose && (
              <Tooltip content="关闭预览">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">{renderPreview()}</div>
    </div>
  )
}

export default DocumentPreview
