import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Maximize2 } from 'lucide-react'
import { useRef, useState, type FC } from 'react'
import { useTranslation } from '../../hooks/use-translation'
import { cn } from '@/lib/utils'
import type { JSONSchema } from '../../types/json-schema'
import JsonSchemaVisualizer from './json-schema-visualizer'

/** @public */
export interface JsonSchemaEditorProps {
  schema?: JSONSchema
  setSchema?: (schema: JSONSchema) => void
  className?: string
}

/** @public */
const JsonSchemaEditor: FC<JsonSchemaEditorProps> = ({
  schema = { type: 'object' },
  setSchema,
  className,
}) => {
  // Handle schema changes and propagate to parent if needed
  const handleSchemaChange = (newSchema: JSONSchema) => {
    setSchema?.(newSchema)
  }

  const t = useTranslation()

  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const fullscreenClass = isFullscreen
    ? 'fixed inset-0 z-50 bg-surface-primary'
    : ''

  return (
    <div
      className={cn(
        'bg-surface-primary border-border-primary w-full rounded-radius-lg border shadow-elevation-low',
        fullscreenClass,
        className,
      )}
    >
      {/* For mobile screens - show as tabs */}
      <div className="block w-full lg:hidden">
        <Tabs defaultValue="json" className="w-full">
          <div className="border-border-primary flex w-full items-center justify-between border-b px-space-md py-space-base">
            <h3 className="font-medium">{t.schemaEditorTitle}</h3>
            <div className="flex items-center gap-space-sm">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="hover:bg-surface-secondary rounded-radius-md p-1.5 transition-colors"
                aria-label="Toggle fullscreen"
              >
                <Maximize2 size={16} />
              </button>
              <TabsList className="grid w-[100px] grid-cols-1">
                <TabsTrigger value="json">
                  {t.schemaEditorEditModeJson}
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent
            value="json"
            className={cn(
              'w-full focus:outline-hidden',
              isFullscreen ? 'h-screen' : 'h-[500px]',
            )}
          >
            <JsonSchemaVisualizer
              schema={schema}
              onChange={handleSchemaChange}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* For large screens - show JSON editor */}
      <div
        ref={containerRef}
        className={cn(
          'hidden w-full lg:flex lg:flex-col',
          isFullscreen ? 'h-screen' : 'h-[600px]',
        )}
      >
        <div className="border-border-primary flex w-full shrink-0 items-center justify-between border-b px-space-md py-space-base">
          <h3 className="font-medium">{t.schemaEditorTitle}</h3>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hover:bg-surface-secondary rounded-radius-md p-1.5 transition-colors"
            aria-label={t.schemaEditorToggleFullscreen}
          >
            <Maximize2 size={16} />
          </button>
        </div>
        <div className="flex min-h-0 w-full grow flex-row">
          <div className="h-full min-h-0 w-full">
            <JsonSchemaVisualizer
              schema={schema}
              onChange={handleSchemaChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default JsonSchemaEditor
