export const IMAGE_EXTENSIONS = [
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

export const VIDEO_EXTENSIONS = [
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

export const pdfWorkerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()
