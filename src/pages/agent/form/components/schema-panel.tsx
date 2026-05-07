import type { JSONSchema } from '@/components/jsonjoy-builder/types/json-schema'
import { JsonViewer } from './json-viewer'

export function SchemaPanel({ value }: { value: JSONSchema }) {
  return (
    <section className="h-48 overflow-hidden">
      <JsonViewer data={value} className="h-full max-h-none" />
    </section>
  )
}
