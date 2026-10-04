export type SkillProtocol = 'multirag-assets-v1' | 'ragflow-skills-v1'

/** A deployment choice, never inferred from a failed request or response body. */
export function parseSkillProtocol(value: unknown): SkillProtocol {
  if (value === undefined || value === '' || value === 'multirag-assets-v1')
    return 'multirag-assets-v1'
  if (value === 'ragflow-skills-v1') return value
  throw new Error('Unsupported VITE_SKILLS_API_PROTOCOL')
}

export const SKILL_PROTOCOL = parseSkillProtocol(
  import.meta.env?.VITE_SKILLS_API_PROTOCOL,
)
