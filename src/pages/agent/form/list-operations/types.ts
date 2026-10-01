export interface IListOperationsForm {
  query?: string
  operations?: string
  operations_version?: unknown
  n?: unknown
  strict?: unknown
  sort_method?: string
  filter?: { operator?: string; value?: string }
  outputs?: Record<string, unknown>
}
