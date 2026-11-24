import type {
  MemoryBoundSourceExcerpt,
  MemoryBoundSourceReference,
} from '@/types/memory-startup'
/** Validate server-reported Unicode positions without fetching or slicing the whole source. */
export function boundSourceRange(
  value: MemoryBoundSourceExcerpt,
  source: MemoryBoundSourceReference,
  memoryId: string,
  offset: number,
  limit: number,
) {
  if (
    value.state !== 'available' ||
    value.excerpt === null ||
    value.offset_unit !== 'unicode_codepoint' ||
    value.source_revision !== source.source_revision ||
    value.source_generation !== source.source_generation ||
    value.content_sha256 !== source.content_sha256 ||
    value.locator?.memory_id !== memoryId ||
    value.locator.message_id !== source.source_id ||
    value.scope.user_id !== source.scope.user_id ||
    value.scope.agent_id !== source.scope.agent_id ||
    value.scope.session_id !== source.scope.session_id ||
    value.offset !== offset ||
    !Number.isSafeInteger(value.total_chars) ||
    value.total_chars === null ||
    value.total_chars < offset
  )
    throw new Error('bound_source_changed')
  const end = offset + [...value.excerpt].length
  if (
    end > value.total_chars ||
    end - offset > limit ||
    value.truncated !== end < value.total_chars ||
    (value.next_offset !== null &&
      (!Number.isSafeInteger(value.next_offset) ||
        value.next_offset !== end ||
        end <= offset)) ||
    (end < value.total_chars && value.next_offset === null) ||
    (end === value.total_chars && value.next_offset !== null)
  )
    throw new Error('bound_source_range_invalid')
  return { start: offset, end, total: value.total_chars }
}
