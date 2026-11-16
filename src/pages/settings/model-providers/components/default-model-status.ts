import type { ModelOption } from '@/components/models/model-select-options'

export type DefaultModelStatus = 'set' | 'missing' | 'unavailable' | 'unknown'

interface ModelChoices {
  /** Selectable (enabled, de-duplicated) options grouped by provider. */
  options: { options?: ModelOption[] }[]
  /** Every configured model, including disabled ones. */
  knownOptions: ModelOption[]
}

/**
 * Whether a default model slot needs attention: nothing chosen, or a saved
 * model that is no longer selectable (turned off or removed). Mirrors how
 * ModelSelect resolves a saved reference, including legacy name aliases.
 * While the model inventory loads or fails the answer is `unknown`.
 */
export function defaultModelStatus(
  value: string,
  { options, knownOptions }: ModelChoices,
  { uncertain = false, builtin = false } = {},
): DefaultModelStatus {
  if (builtin) return 'set'
  if (!value) return 'missing'
  if (uncertain) return 'unknown'
  const choices = options.flatMap((group) => group.options ?? [])
  const metadata = [...choices, ...knownOptions]
  const exact = metadata.find((option) => option.value === value)
  const aliased = [
    ...new Map(
      metadata
        .filter((option) => option.aliases?.includes(value))
        .map((option) => [option.value, option]),
    ).values(),
  ]
  const saved = exact ?? (aliased.length === 1 ? aliased[0] : undefined)
  const available =
    saved !== undefined &&
    choices.some((option) => option.value === saved.value && !option.disabled)
  return available ? 'set' : 'unavailable'
}
