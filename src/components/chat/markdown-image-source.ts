/** DOMPurify permits data URLs on images; restrict that exception to raster base64. */
export function isSafeMarkdownImageSource(src: string): boolean {
  if (!/^\s*data:/i.test(src)) return true
  const prefix = /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.exec(src)
  if (!prefix) return false
  const encoded = src.slice(prefix[0].length)
  return (
    encoded.length > 0 &&
    /^[A-Za-z0-9+/]+={0,2}$/.test(encoded) &&
    (encoded.endsWith('=')
      ? encoded.length % 4 === 0
      : encoded.length % 4 !== 1)
  )
}
