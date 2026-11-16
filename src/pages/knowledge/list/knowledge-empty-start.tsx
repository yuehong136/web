import { useTranslation } from 'react-i18next'
import { Plug, Upload } from 'lucide-react'
import {
  EmptyStart,
  FileStackIllustration,
} from '@/components/patterns/empty-start'

interface KnowledgeEmptyStartProps {
  /** Create a base; the new base opens with the upload dialog. */
  onCreate: () => void
  /** Data source connectors live in settings and are linked per base. */
  onConnectSource: () => void
}

/** First use: no knowledge base yet. Search-empty keeps `PageEmptyState`. */
export function KnowledgeEmptyStart({
  onCreate,
  onConnectSource,
}: KnowledgeEmptyStartProps) {
  const { t } = useTranslation()
  return (
    <EmptyStart
      illustration={<FileStackIllustration />}
      title={t('knowledge.list.empty.startTitle')}
      description={t('knowledge.list.empty.startDescription')}
      paths={[
        {
          key: 'upload',
          primary: true,
          icon: <Upload aria-hidden="true" />,
          iconClassName:
            'bg-components-avatar-6-bg text-components-avatar-6-text',
          title: t('knowledge.list.empty.uploadTitle'),
          description: t('knowledge.list.empty.uploadDescription'),
          cta: t('knowledge.list.empty.uploadCta'),
          onSelect: onCreate,
        },
        {
          key: 'source',
          icon: <Plug aria-hidden="true" />,
          iconClassName:
            'bg-components-avatar-7-bg text-components-avatar-7-text',
          title: t('knowledge.list.empty.sourceTitle'),
          description: t('knowledge.list.empty.sourceDescription'),
          cta: t('knowledge.list.empty.sourceCta'),
          onSelect: onConnectSource,
        },
      ]}
    />
  )
}
