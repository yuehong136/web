import type { LLMFactoryInterface } from '@/stores/model'

const TAG_ORDER: Record<string, number> = {
  LLM: 1,
  'TEXT EMBEDDING': 2,
  'TEXT RE-RANK': 3,
  TTS: 4,
  SPEECH2TEXT: 5,
  IMAGE2TEXT: 6,
  MODERATION: 7,
}

export const sortProviderTags = (tags: string): string[] =>
  [
    ...new Set(
      tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => (TAG_ORDER[a] ?? 999) - (TAG_ORDER[b] ?? 999))

/** Each provider contributes once, including catalogs with repeated capabilities. */
export function availableModelFilters(
  factories: readonly LLMFactoryInterface[],
  addedProviders: readonly string[],
  searchTerm: string,
  selectedTags: readonly string[],
) {
  const added = new Set(addedProviders)
  const providers = new Map<string, LLMFactoryInterface>()
  for (const factory of factories) {
    if (added.has(factory.name)) continue
    const previous = providers.get(factory.name)
    providers.set(factory.name, {
      ...factory,
      tags: sortProviderTags(
        [previous?.tags, factory.tags].filter(Boolean).join(','),
      ).join(','),
    })
  }
  const available = [...providers.values()]
  const allTags = sortProviderTags(
    available.map((factory) => factory.tags).join(','),
  )
  const searched = available.filter((factory) =>
    factory.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const filtered = searched.filter((factory) => {
    const tags = sortProviderTags(factory.tags)
    return selectedTags.every((tag) => tags.includes(tag))
  })
  // A count adds that capability to the current AND selection. Selected tags
  // retain the current result count; unselected tags show its intersection.
  const counts = new Map(
    allTags.map((tag) => [
      tag,
      filtered.filter((factory) => sortProviderTags(factory.tags).includes(tag))
        .length,
    ]),
  )
  return { allTags, searched, filtered, counts }
}
