const record = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}

/** Normalize persisted RAPTOR methods into the API extension contract. */
export function normalizeRaptorConfig(value: unknown): Record<string, unknown> {
  const { clustering_method, tree_builder, ext, ...config } = record(value)
  const extensions = record(ext)
  return {
    ...config,
    ext: {
      ...extensions,
      clustering_method:
        extensions.clustering_method ?? clustering_method ?? 'gmm',
      tree_builder: extensions.tree_builder ?? tree_builder ?? 'raptor',
    },
  }
}
