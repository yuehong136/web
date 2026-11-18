/** Metadata is untrusted document data: render values as text, never HTML. */
export function ReferenceMetadataBadges({
  metadata,
}: {
  metadata?: Record<string, unknown> | null
}) {
  if (!metadata || !Object.keys(metadata).length) return null
  return (
    <dl className="mt-space-sm flex flex-wrap gap-space-xs">
      {Object.entries(metadata).map(([key, value]) => (
        <div
          key={key}
          className="max-w-full rounded-radius-sm bg-sunken px-space-xs py-space-xs text-xs break-words"
        >
          <dt className="inline text-fg-muted">{key}: </dt>
          <dd className="inline text-fg">
            {value == null
              ? ''
              : typeof value === 'object'
                ? JSON.stringify(value)
                : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
