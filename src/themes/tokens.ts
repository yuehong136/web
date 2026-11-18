/**
 * Token registry. Semantic roles (`semantic-tokens.ts`) are the vocabulary
 * components use; legacy names (`legacy-tokens.ts`) remain as aliases of those
 * roles until no source references them. Values come from the generator.
 */
import { LEGACY_TOKENS, type LegacyToken } from './legacy-tokens'
import { SEMANTIC_TOKENS, type SemanticToken } from './semantic-tokens'

export type TokenName = SemanticToken | LegacyToken
export type DesignTokens = Record<TokenName, string>

export const TOKEN_NAMES = [
  ...SEMANTIC_TOKENS,
  ...(Object.keys(LEGACY_TOKENS) as LegacyToken[]),
] as readonly TokenName[]

/** Empty registry for type checks and name enumeration. */
export const defaultTokens = Object.fromEntries(
  TOKEN_NAMES.map((name) => [name, '']),
) as DesignTokens

/** `--color-<name>` references, mapped into Tailwind by `@theme inline`. */
export const cssVariables = Object.fromEntries(
  TOKEN_NAMES.map((name) => [name, `var(--color-${name})`]),
) as Record<TokenName, string>
