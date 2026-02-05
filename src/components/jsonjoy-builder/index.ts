// https://github.com/lovasoa/jsonjoy-builder v0.1.0
// exports for public API

import JsonSchemaEditor, {
  type JsonSchemaEditorProps,
} from './components/schema-editor/json-schema-editor'
import JsonSchemaVisualizer, {
  type JsonSchemaVisualizerProps,
} from './components/schema-editor/json-schema-visualizer'

export * from './i18n/locales/en'
export * from './i18n/translation-context'
export * from './i18n/translation-keys'

export {
  JsonSchemaEditor,
  JsonSchemaVisualizer,
  type JsonSchemaEditorProps,
  type JsonSchemaVisualizerProps,
}

export type { JSONSchema, baseSchema } from './types/json-schema'
