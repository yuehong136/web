import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface WatermarkProps {
  /** One line, or several stacked lines (e.g. account and date). */
  content: string | string[]
  children?: ReactNode
  className?: string
  fontSize?: number
  /** Space between repeats, [horizontal, vertical] in px. */
  gap?: [number, number]
  /** Text angle in degrees. */
  rotate?: number
}

const escapeXml = (text: string) =>
  text.replace(
    /[<>&'"]/g,
    (char) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
      })[char]!,
  )

let measureContext: CanvasRenderingContext2D | null | undefined
function measure(text: string, fontSize: number) {
  if (measureContext === undefined) {
    measureContext =
      typeof CanvasRenderingContext2D === 'undefined'
        ? null
        : document.createElement('canvas').getContext('2d')
  }
  if (!measureContext) return text.length * fontSize * 0.6
  measureContext.font = `${fontSize}px sans-serif`
  return measureContext.measureText(text).width
}

/** One tile of rotated text as an SVG mask, repeated over the area. */
function buildTile(
  lines: string[],
  fontSize: number,
  [gapX, gapY]: [number, number],
  rotate: number,
) {
  const lineHeight = fontSize * 1.4
  const textWidth = Math.max(...lines.map((line) => measure(line, fontSize)))
  const width = Math.ceil(textWidth + gapX)
  const height = Math.ceil(lineHeight * lines.length + gapY)
  const top = height / 2 - (lineHeight * (lines.length - 1)) / 2
  const spans = lines
    .map(
      (line, index) =>
        `<tspan x="${width / 2}" ${index ? `dy="${lineHeight}"` : ''}>${escapeXml(line)}</tspan>`,
    )
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><text y="${top}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-size="${fontSize}" transform="rotate(${rotate} ${width / 2} ${height / 2})">${spans}</text></svg>`
  return {
    image: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    size: `${width}px ${height}px`,
  }
}

/**
 * Repeats faint text (who is viewing, and when) over its content, the way
 * document viewers discourage screenshots and copies. The text is a mask
 * over a theme-coloured layer, so it follows light and dark themes; the
 * layer ignores the pointer, and is put back if removed or restyled.
 */
export function Watermark({
  content,
  children,
  className,
  fontSize = 14,
  gap = [100, 100],
  rotate = -22,
}: WatermarkProps) {
  const lines = (Array.isArray(content) ? content : [content]).filter(Boolean)
  const key = lines.join('\n')
  const [gapX, gapY] = gap
  const tile = useMemo(
    () =>
      key ? buildTile(key.split('\n'), fontSize, [gapX, gapY], rotate) : null,
    [key, fontSize, gapX, gapY, rotate],
  )
  const layer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = layer.current
    const host = node?.parentElement
    if (!node || !host) return
    const style = node.getAttribute('style') ?? ''
    const restore = () => {
      if (!node.isConnected) host.appendChild(node)
      if (node.getAttribute('style') !== style)
        node.setAttribute('style', style)
      if (node.hidden) node.hidden = false
    }
    const parent = new MutationObserver(restore)
    parent.observe(host, { childList: true })
    const self = new MutationObserver(restore)
    self.observe(node, {
      attributes: true,
      attributeFilter: ['style', 'hidden', 'class'],
    })
    return () => {
      parent.disconnect()
      self.disconnect()
    }
  }, [tile])

  return (
    <div className={cn('relative', className)}>
      {children}
      {tile ? (
        <div
          ref={layer}
          aria-hidden="true"
          data-watermark
          className="pointer-events-none absolute inset-0 z-10 select-none"
          style={{
            backgroundColor: 'var(--color-fg)',
            opacity: 0.1,
            maskImage: tile.image,
            WebkitMaskImage: tile.image,
            maskSize: tile.size,
            WebkitMaskSize: tile.size,
            maskRepeat: 'repeat',
            WebkitMaskRepeat: 'repeat',
          }}
        />
      ) : null}
    </div>
  )
}
