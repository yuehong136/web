/**
 * Token registry: the semantic roles (`semantic-tokens.ts`) are the only
 * color vocabulary. Values come from the generator.
 */
import { SEMANTIC_TOKENS, type SemanticToken } from './semantic-tokens'

export type TokenName = SemanticToken
export type DesignTokens = Record<TokenName, string>

export const TOKEN_NAMES: readonly TokenName[] = SEMANTIC_TOKENS

/** Empty registry for type checks and name enumeration. */
export const defaultTokens = Object.fromEntries(
  TOKEN_NAMES.map((name) => [name, '']),
) as DesignTokens

/** `--color-<name>` references, mapped into Tailwind by `@theme inline`. */
export const cssVariables = Object.fromEntries(
  TOKEN_NAMES.map((name) => [name, `var(--color-${name})`]),
) as Record<TokenName, string>
