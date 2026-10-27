import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wrench, Search, FileText, Image, Code } from 'lucide-react'

export function WelcomeMessage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-2xl px-4 py-2 text-center">
      <Card
        className="p-6 text-center"
        style={{
          backgroundColor: 'var(--color-chat-content-bg)',
          border: '1px solid var(--color-chat-welcome-border)',
        }}
      >
        <div className="mb-4">
          <h1 className="mb-1 text-xl font-semibold">
            {t('mcp.playground.welcome.title')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t('mcp.playground.welcome.description')}
          </p>
        </div>

        <div className="mb-4 space-y-3">
          <div className="rounded-lg bg-muted p-3 text-left">
            <div className="mb-1 flex items-center gap-2 text-sm font-medium">
              <Wrench className="h-4 w-4" />
              <span>{t('mcp.playground.welcome.integrationTitle')}</span>
              <Badge variant="secondary">
                {t('mcp.playground.welcome.newBadge')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('mcp.playground.welcome.integrationDescription')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-muted p-2">
              <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium">
                <Search className="h-3.5 w-3.5" />
                {t('mcp.playground.welcome.webSearch')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('mcp.playground.welcome.webSearchDescription')}
              </div>
            </div>

            <div className="rounded-lg bg-muted p-2">
              <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium">
                <FileText className="h-3.5 w-3.5" />
                {t('mcp.playground.welcome.docs')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('mcp.playground.welcome.docsDescription')}
              </div>
            </div>

            <div className="rounded-lg bg-muted p-2">
              <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium">
                <Image className="h-3.5 w-3.5" />
                {t('mcp.playground.welcome.images')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('mcp.playground.welcome.imagesDescription')}
              </div>
            </div>

            <div className="rounded-lg bg-muted p-2">
              <div className="mb-0.5 flex items-center gap-1.5 text-xs font-medium">
                <Code className="h-3.5 w-3.5" />
                {t('mcp.playground.welcome.academic')}
              </div>
              <div className="text-xs text-muted-foreground">
                {t('mcp.playground.welcome.academicDescription')}
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-3 text-xs text-muted-foreground">
          {t('mcp.playground.welcome.tip')}
        </div>
      </Card>
    </div>
  )
}
