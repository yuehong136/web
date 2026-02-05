import { JsonSchemaVisualizer } from '@/components/jsonjoy-builder'
import type { JSONSchema } from '@/components/jsonjoy-builder/types/json-schema'

export function SchemaPanel({ value }: { value: JSONSchema }) {
  return (
    <section className="h-48">
      <JsonSchemaVisualizer
        schema={value}
        readOnly
        showHeader={false}
      ></JsonSchemaVisualizer>
    </section>
  )
}
