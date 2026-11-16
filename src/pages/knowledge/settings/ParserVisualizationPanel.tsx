import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DocumentParserType,
  DOCUMENT_PARSER_TYPE_LABELS,
} from '@/types/document-parser'
import { FileText } from 'lucide-react'
import { getParserImageFileNames } from './parser-image-map'

const chunkMethodImages = import.meta.glob<{ default: string }>(
  '@/assets/svg/chunk-method/*.svg',
)

const loadImageUrl = async (filename: string) => {
  const entry = Object.entries(chunkMethodImages).find(([path]) =>
    path.endsWith(`/${filename}.svg`),
  )
  if (!entry) return undefined
  const module = await entry[1]()
  return module.default
}

interface ParserVisualizationPanelProps {
  selectedParser: DocumentParserType | string | null
}

export const ParserVisualizationPanel: React.FC<
  ParserVisualizationPanelProps
> = ({ selectedParser }) => {
  const { t } = useTranslation()
  const [images, setImages] = React.useState<string[]>([])

  const parserInfo = useMemo(() => {
    if (!selectedParser || typeof selectedParser !== 'string') {
      return null
    }

    const parserType = selectedParser as DocumentParserType
    return {
      title:
        DOCUMENT_PARSER_TYPE_LABELS[parserType] ||
        t('knowledge.settings.parserDescription.unknownTitle'),
    }
  }, [selectedParser, t])

  React.useEffect(() => {
    let ignore = false
    const filenames = selectedParser
      ? getParserImageFileNames(selectedParser)
      : []

    Promise.all(filenames.map(loadImageUrl)).then((urls) => {
      if (!ignore) {
        setImages(urls.filter((url): url is string => Boolean(url)))
      }
    })

    return () => {
      ignore = true
    }
  }, [selectedParser])

  if (!parserInfo) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center p-space-xl text-center">
        <FileText
          className="mb-space-base size-icon-xl text-text-tertiary"
          aria-hidden="true"
        />
        <h3 className="mb-space-xs text-sm font-semibold text-text-primary">
          {t('knowledge.settings.parserDescription.fallbackTitle')}
        </h3>
        <p className="max-w-xs text-sm text-text-tertiary">
          {t('knowledge.settings.parserDescription.fallbackDescription')}
        </p>
      </div>
    )
  }

  const parserType = selectedParser as DocumentParserType
  const detailedInfo = {
    description: t(
      `knowledge.settings.parserDescription.details.${parserType}.description`,
      {
        defaultValue: t(
          'knowledge.settings.parserDescription.defaultDescription',
        ),
      },
    ),
    supportedFormats: t(
      `knowledge.settings.parserDescription.details.${parserType}.supportedFormats`,
      {
        defaultValue: t('knowledge.settings.parserDescription.multipleFormats'),
      },
    ),
  }

  return (
    <div className="min-h-full">
      {/* 头部信息 */}
      <div className="border-b border-border-subtle p-space-md">
        <h2 className="mb-space-2xs text-sm font-semibold text-text-primary">
          {parserInfo.title}
        </h2>
        <p className="text-xs text-text-secondary">
          <span className="font-medium">
            {t('knowledge.settings.parserDescription.supportedFormats')}
          </span>
          {detailedInfo.supportedFormats}
        </p>
      </div>

      {/* 分块方法说明 */}
      <div className="border-b border-border-subtle p-space-md">
        <h3 className="mb-space-sm text-sm font-semibold text-text-primary">
          {t('knowledge.settings.parserDescription.methodDescription')}
        </h3>
        <div className="text-sm leading-relaxed whitespace-pre-line text-text-secondary">
          {detailedInfo.description}
        </div>
      </div>

      {/* 使用示例 */}
      {images.length > 0 && (
        <div className="p-space-md">
          <h3 className="mb-space-xs text-sm font-semibold text-text-primary">
            {t('knowledge.settings.parserDescription.examples')}
          </h3>
          <p className="mb-space-base text-xs text-text-tertiary">
            {t('knowledge.settings.parserDescription.examplesDescription')}
          </p>

          <div className="grid grid-cols-1 gap-space-base">
            {images.map((imageName, index) => (
              <figure
                key={index}
                className="rounded-radius-lg border border-border-subtle p-space-sm"
              >
                <div className="mb-space-xs aspect-4/3 overflow-hidden rounded-radius-md bg-background-subtle">
                  <img
                    src={imageName}
                    alt={t('knowledge.settings.parserDescription.exampleAlt', {
                      index: index + 1,
                    })}
                    className="h-full w-full object-contain"
                    data-dark-enhance="true"
                  />
                </div>
                <figcaption className="text-center text-xs text-text-tertiary">
                  {t('knowledge.settings.parserDescription.exampleLabel', {
                    index: index + 1,
                  })}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
