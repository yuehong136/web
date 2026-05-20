import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DocumentParserType,
  DOCUMENT_PARSER_TYPE_LABELS,
} from '@/types/document-parser'
import { Card } from '@/components/ui/card'
import { FileText, Lightbulb, Image } from 'lucide-react'
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
      <div className="flex min-h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-2xl bg-background-subtle">
          <FileText className="h-12 w-12 text-text-tertiary" />
        </div>
        <h3 className="mb-2 text-base font-medium text-text-primary">
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
      <div className="border-b border-border-default p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-radius-xl flex h-11 w-11 flex-shrink-0 items-center justify-center bg-status-info-subtle">
            <Lightbulb className="h-5 w-5 text-text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="mb-1.5 text-lg font-semibold text-text-primary">
              {parserInfo.title}
            </h2>
            <div className="text-sm text-text-secondary">
              <span className="font-medium">
                {t('knowledge.settings.parserDescription.supportedFormats')}
              </span>
              <span className="text-text-accent">
                {detailedInfo.supportedFormats}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 分块方法说明 */}
      <div className="border-b border-border-default p-6">
        <h3 className="mb-3 text-base font-medium text-text-primary">
          {t('knowledge.settings.parserDescription.methodDescription')}
        </h3>
        <div className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
          {detailedInfo.description}
        </div>
      </div>

      {/* 使用示例 */}
      {images.length > 0 && (
        <div className="p-6">
          <h3 className="mb-3 flex items-center gap-2 text-base font-medium text-text-primary">
            <Image className="h-4 w-4 text-text-accent" />
            {t('knowledge.settings.parserDescription.examples')}
          </h3>
          <p className="mb-4 text-sm text-text-tertiary">
            {t('knowledge.settings.parserDescription.examplesDescription')}
          </p>

          <div className="grid grid-cols-1 gap-4">
            {images.map((imageName, index) => (
              <Card
                key={index}
                className="border-border-subtle bg-background-subtle p-3 transition-colors hover:border-border-default"
              >
                <div className="mb-2 aspect-[4/3] overflow-hidden rounded-lg bg-background">
                  <img
                    src={imageName}
                    alt={t('knowledge.settings.parserDescription.exampleAlt', {
                      index: index + 1,
                    })}
                    className="h-full w-full object-contain"
                    data-dark-enhance="true"
                  />
                </div>
                <p className="text-center text-xs text-text-tertiary">
                  {t('knowledge.settings.parserDescription.exampleLabel', {
                    index: index + 1,
                  })}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
